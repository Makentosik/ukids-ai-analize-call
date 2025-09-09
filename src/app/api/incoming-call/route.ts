import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReviewStatus } from '@prisma/client';
import { sendToN8nSchema } from '@/lib/validations';

// POST /api/incoming-call
// Получает данные входящего звонка, создает Call, находит дефолтный активный чек-лист,
// создает CallReview и отправляет данные на анализ в n8n, затем уведомляет внешний webhook
export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('Ошибка парсинга JSON:', jsonError);
      return NextResponse.json(
        { error: 'Неверный формат данных JSON' },
        { status: 400 }
      );
    }

    // Валидация входящих данных (минимальная схема согласно ТЗ)
    const { call_id, phone_number, duration, transcription, timestamp } = body || {};
    if (!call_id || !timestamp) {
      return NextResponse.json({ error: 'call_id и timestamp обязательны' }, { status: 400 });
    }

    // 1) Создаем или обновляем звонок
    const createdAt = new Date(timestamp);
    const call = await prisma.call.upsert({
      where: { id: String(call_id) },
      update: {
        createdAt,
        payload: {
          ...(typeof duration === 'number' ? { duration } : {}),
          ...(phone_number ? { phoneNumber: String(phone_number) } : {}),
          callType: 'inbound',
        },
        callText: transcription ? String(transcription) : undefined,
      },
      create: {
        id: String(call_id),
        dealId: 'UNKNOWN',
        createdAt,
        employeeName: 'Тест Сотрудник',
        managerName: 'Тест Менеджер',
        payload: {
          ...(typeof duration === 'number' ? { duration } : {}),
          ...(phone_number ? { phoneNumber: String(phone_number) } : {}),
          callType: 'inbound',
        },
        callText: transcription ? String(transcription) : null,
      },
      include: { reviews: true },
    });

    // 2) Находим активный дефолтный чек-лист
    const checklist = await prisma.checklistTemplate.findFirst({
      where: { isActive: true, isDefault: true },
      include: { items: { orderBy: { orderIndex: 'asc' } } },
    });

    if (!checklist) {
      return NextResponse.json({ error: 'Не найден активный дефолтный чек-лист' }, { status: 404 });
    }

    // 3) Создаем задачу на проверку
    const review = await prisma.callReview.create({
      data: {
        callId: call.id,
        templateId: checklist.id,
        status: ReviewStatus.PENDING,
        commentText: 'Автоматическая проверка входящего звонка',
      },
    });

    // 4) Формируем payload для n8n
    const n8nPayload = {
      id: call.id,
      text: call.callText || '',
      checklist: checklist.items.map((item, index) => ({
        title: `${index + 1}.${item.title}`,
        description: item.description || null,
        evaluationType: item.evaluationType,
      })),
      reviewId: review.id,
    };

    // Валидация payload перед отправкой
    const validation = sendToN8nSchema.safeParse(n8nPayload);
    if (!validation.success) {
      console.error('Ошибка формирования payload для n8n:', validation.error);
    }

    // 5) Отправляем в n8n на анализ
    const n8nUrl = process.env.N8N_WEBHOOK_URL || 'https://miquenaluekos.beget.app/webhook/callai';
    const n8nResp = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'CallAI-App-Auto/1.0' },
      body: JSON.stringify(n8nPayload),
    });

    const n8nText = await n8nResp.text();
    let n8nJson: any;
    try { n8nJson = JSON.parse(n8nText); } catch { n8nJson = { rawResponse: n8nText }; }

    // Обновляем review статус по ответу n8n (для синхронных ошибок)
    const updatedReview = await prisma.callReview.update({
      where: { id: review.id },
      data: {
        status: n8nResp.ok ? ReviewStatus.SUCCESS : ReviewStatus.FAILED,
        n8nResponse: {
          status: n8nResp.status,
          statusText: n8nResp.statusText,
          body: n8nJson,
          timestamp: new Date().toISOString(),
        },
      },
      include: { template: { select: { title: true } } },
    });

    // 6) Уведомляем внешний webhook (прод)
    try {
      const notifyUrl = 'https://miquenaluekos.beget.app/webhook/callai';
      await fetch(notifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'incoming_call_processed', callId: call.id, reviewId: review.id }),
      });
    } catch (notifyErr) {
      console.warn('Не удалось отправить уведомление на внешний webhook:', notifyErr);
    }

    return NextResponse.json({ success: true, call, review: updatedReview }, { status: 201 });
  } catch (error: any) {
    console.error('Ошибка автоматической обработки входящего звонка:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера', details: error.message }, { status: 500 });
  }
}
