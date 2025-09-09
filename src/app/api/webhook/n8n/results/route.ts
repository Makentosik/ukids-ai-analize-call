import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { n8nResultsSchema } from '@/lib/validations';
import { ReviewStatus } from '@prisma/client';

// Webhook endpoint для получения результатов анализа от n8n
export async function POST(request: NextRequest) {
  try {
    // Проверяем API ключ для безопасности (опционально)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.N8N_WEBHOOK_SECRET;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
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

    console.log('Получены результаты анализа от n8n:', JSON.stringify(body, null, 2));
    
    // Поддерживаем как одиночный объект, так и массив
    const results = Array.isArray(body) ? body : [body];
    
    const updatedReviews = [];
    
    for (const result of results) {
      console.log('🔍 DEBUG: Обработка результата от n8n:', JSON.stringify(result, null, 2));
      
      // Валидация входных данных
      const validationResult = n8nResultsSchema.safeParse(result);
      
      if (!validationResult.success) {
        console.error('Ошибка валидации результата:', validationResult.error);
        continue; // Пропускаем невалидные результаты, но не останавливаем обработку
      }

      const { id, reviewId, ok, checklist, triggers, recommendations, stats, markdown, original } = validationResult.data;
      
      // Определяем callId - берем из id или original.id
      const callId = id || original?.id;
      
      if (!callId) {
        console.warn('Не найден ID звонка ни в id, ни в original.id');
        continue;
      }
      
      console.log(`Обрабатываем результат для звонка ${callId}, reviewId: ${reviewId}`);
      
      // Ищем проверку по reviewId или по callId
      let review;
      
      if (reviewId) {
        // Ищем по ID проверки
        review = await prisma.callReview.findUnique({
          where: { id: reviewId },
          include: {
            call: true,
            template: true,
          },
        });
      } else {
        // Ищем последнюю активную проверку для данного звонка
        review = await prisma.callReview.findFirst({
          where: {
            callId: callId,
            status: { in: [ReviewStatus.PENDING, ReviewStatus.SENT, ReviewStatus.SUCCESS] },
          },
          include: {
            call: true,
            template: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      }
      
      if (!review) {
        console.warn(`Проверка не найдена для callId: ${callId}, reviewId: ${reviewId}`);
        continue;
      }
      
      // Вычисляем статистику из original.results, если stats не указаны
      let finalStats = stats;
      if ((!stats || stats.total === 0) && original?.results) {
        const results = original.results;
        finalStats = {
          total: results.length,
          done: results.filter(r => r.done === true).length,
          notDone: results.filter(r => r.done === false).length,
          unknown: results.filter(r => r.done === undefined || r.done === null).length,
        };
        console.log(`Вычислена статистика из original.results:`, finalStats);
      }
      
      // Обновляем проверку с результатами анализа
      const updatedReview = await prisma.callReview.update({
        where: { id: review.id },
        data: {
          status: ok ? ReviewStatus.SUCCESS : ReviewStatus.FAILED,
          analysisResults: {
            ok,
            checklist: checklist || [],
            triggers: triggers || [],
            recommendations: recommendations || [],
            stats: finalStats || { total: 0, done: 0, notDone: 0, unknown: 0 },
            markdown: markdown || '',
            original: original || null,
            processedAt: new Date().toISOString(),
          },
          completedAt: new Date(),
        },
        include: {
          call: true,
          template: true,
        },
      });
      
      updatedReviews.push(updatedReview);
      
      console.log(`✅ Результаты анализа сохранены для проверки ${review.id} (звонок ${review.callId})`);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Обработано ${updatedReviews.length} результатов анализа`,
      processedReviews: updatedReviews.length,
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Ошибка обработки результатов анализа от n8n:', error);
    
    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка сервера',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
