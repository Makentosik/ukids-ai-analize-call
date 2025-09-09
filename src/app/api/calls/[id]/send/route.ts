import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, canViewCall } from '@/lib/rbac';
import { createCallReviewSchema, sendToN8nSchema } from '@/lib/validations';
import { UserRole, ReviewStatus } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Проверяем права на отправку в n8n
    const { user } = await requirePermission('canSendToN8n');
    console.log('🔍 DEBUG: Пользователь из requirePermission:', JSON.stringify({ id: user?.id, name: user?.name, role: user?.role }, null, 2));
    const { id: callId } = await params;

    if (!callId) {
      return NextResponse.json({ error: 'ID звонка обязателен' }, { status: 400 });
    }

    // Получаем данные из тела запроса
    let body;
    try {
      body = await request.json();
      console.log('🔍 DEBUG: Полученное тело запроса в /api/calls/[id]/send:', JSON.stringify(body, null, 2));
    } catch (jsonError) {
      console.error('Ошибка парсинга JSON:', jsonError);
      return NextResponse.json(
        { error: 'Неверный формат данных JSON' },
        { status: 400 }
      );
    }
    const validationResult = createCallReviewSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Неверный формат данных',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { templateId, commentText } = validationResult.data;

    // Получаем звонок с проверкой прав доступа
    const call = await prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      return NextResponse.json({ error: 'Звонок не найден' }, { status: 404 });
    }

    // Проверяем права на просмотр этого звонка
    if (!canViewCall(user.role as UserRole, user.name, call.employeeName)) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    // Получаем чек-лист с элементами
    const checklist = await prisma.checklistTemplate.findUnique({
      where: { id: templateId },
      include: {
        items: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    if (!checklist) {
      return NextResponse.json({ error: 'Чек-лист не найден' }, { status: 404 });
    }

    if (!checklist.isActive) {
      return NextResponse.json({ error: 'Чек-лист неактивен' }, { status: 400 });
    }

    // Проверим, что пользователь существует в базе
    let requestedById = null;
    if (user?.id) {
      const existingUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (existingUser) {
        requestedById = user.id;
      } else {
        console.warn('Пользователь с ID', user.id, 'не найден в базе данных. Нужно перелогиниться.');
        // Можно вернуть ошибку 401, но пока продолжаем без requestedById
      }
    }

    // Создаем запись о проверке
    const review = await prisma.callReview.create({
      data: {
        callId,
        templateId,
        requestedById,
        commentText,
        status: ReviewStatus.PENDING,
      },
    });

    try {
      // Подготавливаем данные для отправки в n8n
      const n8nPayload = {
        id: call.id,
        text: call.callText || commentText || '', // Используем текст звонка в первую очередь
        checklist: checklist.items.map(item => ({
          title: item.title,
          description: item.description || null,
          evaluationType: item.evaluationType, // Добавляем тип оценки
        })),
        reviewId: review.id, // Добавляем ID проверки
      };

      // Валидируем payload перед отправкой
      const payloadValidation = sendToN8nSchema.safeParse(n8nPayload);
      if (!payloadValidation.success) {
        throw new Error('Ошибка формирования payload для n8n');
      }

      // Отправляем данные в n8n (продакшн endpoint)
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://miquenaluekos.beget.app/webhook-test/callai';

      console.log('Отправляем в n8n:', n8nPayload);

      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CallAI-App-Manual/2.0',
        },
        body: JSON.stringify(n8nPayload),
      });

      const responseText = await n8nResponse.text();
      let responseJson;
      
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = { rawResponse: responseText };
      }

      // Обновляем статус проверки в зависимости от ответа n8n
      const updatedReview = await prisma.callReview.update({
        where: { id: review.id },
        data: {
          status: n8nResponse.ok ? ReviewStatus.SUCCESS : ReviewStatus.FAILED,
          n8nResponse: {
            status: n8nResponse.status,
            statusText: n8nResponse.statusText,
            headers: Object.fromEntries(n8nResponse.headers.entries()),
            body: responseJson,
            timestamp: new Date().toISOString(),
          },
        },
        include: {
          template: {
            select: {
              title: true,
            },
          },
        },
      });

      if (n8nResponse.ok) {
        console.log(`✅ Успешно отправлено в n8n для звонка ${callId}`);
        return NextResponse.json({
          success: true,
          message: 'Чек-лист успешно отправлен в n8n',
          review: updatedReview,
          n8nResponse: responseJson,
        });
      } else {
        console.error(`❌ Ошибка n8n для звонка ${callId}:`, n8nResponse.status, responseText);
        return NextResponse.json(
          {
            success: false,
            message: `Ошибка n8n: ${n8nResponse.status} ${n8nResponse.statusText}`,
            review: updatedReview,
            n8nResponse: responseJson,
          },
          { status: 422 }
        );
      }

    } catch (n8nError: any) {
      console.error('Ошибка отправки в n8n:', n8nError);

      // Обновляем статус проверки на FAILED
      const failedReview = await prisma.callReview.update({
        where: { id: review.id },
        data: {
          status: ReviewStatus.FAILED,
          n8nResponse: {
            error: n8nError.message,
            timestamp: new Date().toISOString(),
          },
        },
        include: {
          template: {
            select: {
              title: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: `Ошибка отправки в n8n: ${n8nError.message}`,
          review: failedReview,
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Общая ошибка отправки чек-листа:', error);

    if (error.message === 'Не авторизован') {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    if (error.message === 'Недостаточно прав') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
