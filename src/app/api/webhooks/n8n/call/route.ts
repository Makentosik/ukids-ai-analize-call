import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { n8nCallWebhookSchema, parseDateString } from '@/lib/validations';
import { toastMessages } from '@/lib/locale';

export async function POST(request: NextRequest) {
  console.log('🔵 [N8N-WEBHOOK-DEBUG] POST request received at /api/webhooks/n8n/call');
  console.log('🔵 [N8N-WEBHOOK-DEBUG] Request URL:', request.url);
  console.log('🔵 [N8N-WEBHOOK-DEBUG] Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    // Проверяем токен аутентификации, если он настроен
    const n8nToken = process.env.N8N_TOKEN;
    if (n8nToken) {
      const authHeader = request.headers.get('authorization');
      const providedToken = authHeader?.replace('Bearer ', '');
      
      if (providedToken !== n8nToken) {
        console.error('Неверный N8N токен');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Читаем и парсим тело запроса
    let rawBody;
    try {
      rawBody = await request.json();
    } catch (jsonError) {
      console.error('Ошибка парсинга JSON:', jsonError);
      return NextResponse.json(
        { error: 'Неверный формат данных JSON' },
        { status: 400 }
      );
    }
    
    // Валидируем входящие данные
    const validationResult = n8nCallWebhookSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.error('Валидация webhook не прошла:', validationResult.error);
      return NextResponse.json(
        { 
          error: 'Неверный формат данных',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { id, deal_id, created_at, employe, employe_rug, initiated_by, call_text } = validationResult.data;

    // Парсим дату создания или используем текущее время
    const createdAtDate = parseDateString(created_at) || new Date();

    try {
      // Upsert звонка в базу данных
      const call = await prisma.call.upsert({
        where: { id },
        update: {
          dealId: deal_id,
          createdAt: createdAtDate,
          employeeName: employe,
          managerName: employe_rug,
          initiatedBy: initiated_by,
          callText: call_text,
          payload: rawBody, // Сохраняем весь исходный JSON
        },
        create: {
          id,
          dealId: deal_id,
          createdAt: createdAtDate,
          employeeName: employe,
          managerName: employe_rug,
          initiatedBy: initiated_by,
          callText: call_text,
          payload: rawBody, // Сохраняем весь исходный JSON
        },
      });

      console.log(`✅ Звонок ${id} успешно сохранен/обновлен`);
      
      return NextResponse.json({ 
        ok: true, 
        message: 'Звонок успешно сохранен',
        callId: call.id
      });

    } catch (dbError: any) {
      console.error('Ошибка базы данных при сохранении звонка:', dbError);
      
      // Специальная обработка для ошибок уникальности (хотя мы используем upsert)
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { error: 'Звонок с таким ID уже существует' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Ошибка сохранения в базу данных' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Общая ошибка обработки webhook:', error);
    
    // Проверяем, является ли ошибка проблемой парсинга JSON
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Неверный JSON в теле запроса' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Для безопасности, отвечаем только на POST запросы
export async function GET() {
  return NextResponse.json(
    { error: 'Метод не поддерживается' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Метод не поддерживается' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Метод не поддерживается' },
    { status: 405 }
  );
}
