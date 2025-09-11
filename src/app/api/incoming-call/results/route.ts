import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReviewStatus } from '@prisma/client';

// POST /api/incoming-call/results
// Получает результаты анализа от n8n и обновляет CallReview запись, затем уведомляет внешний webhook
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

    console.log('📥 Получены результаты анализа от n8n:', body);

    // Валидация входящих данных
    const { reviewId, analysisResults, status } = body || {};
    
    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId обязателен' }, { status: 400 });
    }

    if (!analysisResults) {
      return NextResponse.json({ error: 'analysisResults обязательны' }, { status: 400 });
    }

    // Находим CallReview запись
    const review = await prisma.callReview.findUnique({
      where: { id: reviewId },
      include: { call: true, template: true },
    });

    if (!review) {
      return NextResponse.json({ error: 'Запись проверки не найдена' }, { status: 404 });
    }

    // Обновляем CallReview с результатами анализа
    const updatedReview = await prisma.callReview.update({
      where: { id: reviewId },
      data: {
        status: status === 'success' ? ReviewStatus.SUCCESS : ReviewStatus.FAILED,
        analysisResults: analysisResults,
        completedAt: new Date(),
        n8nResponse: {
          ...review.n8nResponse,
          analysisCompleted: true,
          timestamp: new Date().toISOString(),
        },
      },
      include: {
        call: true,
        template: { include: { items: true } },
      },
    });

    console.log('✅ Результаты анализа сохранены для review:', reviewId);

    // Уведомляем внешний webhook о завершении анализа
    try {
      const notifyUrl = 'https://miquenaluekos.beget.app/webhook/callai';
      const notificationPayload = {
        type: 'analysis_completed',
        callId: updatedReview.call.id,
        reviewId: updatedReview.id,
        status: updatedReview.status,
        analysisResults: updatedReview.analysisResults,
        call: {
          id: updatedReview.call.id,
          dealId: updatedReview.call.dealId,
          employeeName: updatedReview.call.employeeName,
          managerName: updatedReview.call.managerName,
          createdAt: updatedReview.call.createdAt,
          payload: updatedReview.call.payload,
        },
        template: {
          title: updatedReview.template.title,
          items: updatedReview.template.items.map(item => ({
            title: item.title,
            description: item.description,
            evaluationType: String(item.evaluationType), // Приводим enum к строке
            orderIndex: item.orderIndex,
          })),
        },
        completedAt: updatedReview.completedAt,
      };

      const notifyResponse = await fetch(notifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationPayload),
      });

      console.log('📤 Уведомление отправлено на внешний webhook:', notifyResponse.status);
      
      if (!notifyResponse.ok) {
        console.warn('⚠️ Внешний webhook вернул ошибку:', await notifyResponse.text());
      }
    } catch (notifyErr) {
      console.warn('Не удалось отправить уведомление на внешний webhook:', notifyErr);
    }

    return NextResponse.json({ 
      success: true, 
      review: updatedReview,
      message: 'Результаты анализа успешно сохранены'
    });

  } catch (error: any) {
    console.error('Ошибка обработки результатов анализа:', error);
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера', 
      details: error.message 
    }, { status: 500 });
  }
}
