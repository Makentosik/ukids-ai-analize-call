import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReviewStatus, UserRole } from '@prisma/client';
import { sendAutoWebhook } from '@/lib/webhook-sender';
import { parseRussianDate } from '@/lib/utils';

// Webhook эндпоинт для n8n
export async function POST(request: NextRequest) {
  console.log('🔴 [WEBHOOK-DEBUG] POST request received at /api/webhook/calls (v2 - with Russian date parsing)');
  console.log('🔴 [WEBHOOK-DEBUG] Request URL:', request.url);
  console.log('🔴 [WEBHOOK-DEBUG] Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    // Проверяем API ключ для безопасности (опционально)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.N8N_WEBHOOK_SECRET;
    
    // Проверяем только если токен настроен и это не тестовый режим
    if (expectedToken && process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Неавторизованный доступ' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('Ошибка парсинга JSON:', jsonError);
      return NextResponse.json(
        { error: 'Неверный формат данных JSON' },
        { status: 400 }
      );
    }
    console.log('📥 Получены данные от n8n:', body);
    console.log('📅 createdAt из n8n:', body.createdAt, '(тип:', typeof body.createdAt, ')');
    
    // Валидация входных данных
    const { 
      id, 
      dealId, 
      createdAt, 
      employeeName, 
      managerName, 
      initiatedBy,
      callText,
      ...otherFields 
    } = body;
    
    // Создаем payload из всех остальных полей
    const payload = {
      ...otherFields,
      // Сохраняем основные поля для совместимости
      duration: body.duration || otherFields.duration,
      phoneNumber: body.phoneNumber || otherFields.phoneNumber,
      callType: body.callType || otherFields.callType,
      notes: body.notes || otherFields.notes
    };
    
    console.log('📦 Payload для сохранения:', payload);
    
    if (!id || !dealId || !employeeName || !managerName) {
      return NextResponse.json(
        { 
          error: 'Отсутствуют обязательные поля',
          required: ['id', 'dealId', 'employeeName', 'managerName']
        },
        { status: 400 }
      );
    }

    // Парсим дату с использованием специальной функции для русского формата
    let finalDate: Date;
    if (createdAt) {
      const parsedDate = parseRussianDate(createdAt);
      if (parsedDate) {
        finalDate = parsedDate;
        console.log('✅ Дата успешно распознана как русский формат:', createdAt, '->', finalDate.toISOString());
      } else {
        console.warn('⚠️ Не удалось парсить дату, используем текущее время:', createdAt);
        finalDate = new Date();
      }
    } else {
      console.log('🕰️ Дата createdAt не предоставлена, используем текущее время');
      finalDate = new Date();
    }
    
    // Проверяем, что дата валидна перед сохранением в базу
    if (isNaN(finalDate.getTime())) {
      console.error('❌ Невалидная дата получена:', {
        original: createdAt,
        parsed: finalDate,
        timestamp: finalDate.getTime()
      });
      
      return NextResponse.json(
        { 
          error: 'Невалидная дата создания',
          details: `Не удалось распознать дату: "${createdAt}". Пожалуйста, используйте формат DD.MM.YYYY HH:MM или ISO 8601`
        },
        { status: 400 }
      );
    }
    
    console.log('🕰️ Проверка даты пройдена:', {
      original: createdAt,
      parsed: finalDate,
      isValid: !isNaN(finalDate.getTime()),
      timestamp: finalDate.getTime(),
      isoString: finalDate.toISOString()
    });
    
    // Создаем новый звонок
    const call = await prisma.call.create({
      data: {
        id: String(id),
        dealId: String(dealId),
        createdAt: finalDate,
        employeeName: String(employeeName),
        managerName: String(managerName),
        initiatedBy: initiatedBy ? String(initiatedBy) : null,
        callText: callText ? String(callText) : null,
        payload: payload,
      },
      include: {
        reviews: {
          include: {
            template: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    console.log('✅ Звонок успешно создан через webhook:', call.id);
    console.log('📝 callText:', callText ? `"${callText.substring(0, 50)}..."` : 'отсутствует');
    console.log('📅 Итоговая дата в базе:', call.createdAt);
    
    // Проверяем User-Agent для определения источника
    const userAgent = request.headers.get('user-agent') || '';
    const isFromCallAI = userAgent.includes('CallAI-App');
    
    if (!isFromCallAI) {
      console.log('🚀 Звонок создан из внешнего источника - запускаем автоматический анализ');
      
      // Создаем системного пользователя для автоматических операций
      let systemUser = await prisma.user.findFirst({
        where: { email: 'system@callai.local' }
      });
      
      if (!systemUser) {
        console.log('📝 Создаем системного пользователя для автоматических операций');
        systemUser = await prisma.user.create({
          data: {
            email: 'system@callai.local',
            name: 'Система CallAI',
            passwordHash: 'system_user_no_login',
            role: UserRole.ADMINISTRATOR,
          }
        });
      }
      
      try {
        const autoResult = await sendAutoWebhook(call.id, systemUser.id);
        console.log('📊 Результат автоматической отправки:', autoResult);
      } catch (autoError) {
        console.warn('⚠️ Ошибка автоматической отправки:', autoError);
      }
    } else {
      console.log('📝 Звонок создан от CallAI приложения - пропускаем автоматическую отправку для избежания петли');
    }
    
    return NextResponse.json({ 
      success: true, 
      call,
      message: 'Звонок успешно добавлен'
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Ошибка создания звонка через webhook:', error);
    
    // Обработка ошибки уникальности (звонок уже существует)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          error: 'Звонок с таким ID уже существует',
          code: 'DUPLICATE_ID'
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка сервера',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
