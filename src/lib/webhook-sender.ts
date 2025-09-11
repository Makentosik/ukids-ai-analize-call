import { prisma } from '@/lib/prisma';
import { ReviewStatus } from '@prisma/client';
import { sendToN8nSchema } from '@/lib/validations';

/**
 * Автоматически отправляет webhook для проверки качества нового звонка
 * @param callId - ID созданного звонка
 * @param userId - ID пользователя, создавшего звонок (для записи в review)
 * @returns Promise с результатом отправки
 */
export async function sendAutoWebhook(callId: string, userId: string) {
  console.log(`🔄 Автоматическая отправка webhook для звонка ${callId}`);
  
  try {
    // Получаем звонок
    const call = await prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new Error(`Звонок ${callId} не найден`);
    }

    // Получаем дефолтный активный чек-лист
    let checklist = await prisma.checklistTemplate.findFirst({
      where: { 
        isDefault: true,
        isActive: true 
      },
      include: {
        items: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });
    
    // Fallback: если нет дефолтного, берем любой активный
    if (!checklist) {
      console.warn('⚠️ Дефолтный чек-лист не найден, ищем fallback...');
      
      checklist = await prisma.checklistTemplate.findFirst({
        where: { isActive: true },
        include: {
          items: {
            orderBy: {
              orderIndex: 'asc',
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!checklist) {
      throw new Error('❌ Не найден ни один активный чек-лист для автоматической отправки');
    }
    
    console.log(`📋 Используем чек-лист: "${checklist.title}" (ID: ${checklist.id}, isDefault: ${checklist.isDefault}, элементов: ${checklist.items.length})`);

    // Создаем запись о проверке
    const review = await prisma.callReview.create({
      data: {
        callId,
        templateId: checklist.id,
        requestedById: userId,
        commentText: 'Автоматическая проверка при создании звонка',
        status: ReviewStatus.PENDING,
      },
    });
    
    console.log(`📝 Создан review ID: ${review.id} для звонка ${callId} со статусом PENDING`);

    // Подготавливаем данные для отправки в n8n
    const n8nPayload = {
      id: call.id,
      text: call.callText || '', // Используем текст звонка или пустую строку
      checklist: checklist.items.map((item, index) => ({
        title: `${index + 1}.${item.title}`,
        description: item.description || null,
        evaluationType: String(item.evaluationType), // Добавляем тип оценки
      })),
      reviewId: review.id, // Добавляем ID проверки
    };

    // Валидируем payload перед отправкой
    const payloadValidation = sendToN8nSchema.safeParse(n8nPayload);
    if (!payloadValidation.success) {
      console.error('❌ Ошибка валидации payload:', payloadValidation.error);
      throw new Error('Ошибка формирования payload для n8n');
    }

    // Отправляем данные в n8n
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://miquenaluekos.beget.app/webhook/callai';

    console.log(`📤 Отправляем автоматический webhook в n8n на URL: ${n8nWebhookUrl}`);  
    console.log('📋 Payload для отправки:', JSON.stringify(n8nPayload, null, 2));

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CallAI-App-Auto/3.0',
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
    });

    if (n8nResponse.ok) {
      console.log(`✅ Автоматический webhook успешно отправлен для звонка ${callId} на URL: ${n8nWebhookUrl}`);
      console.log(`📊 Ответ от n8n (${n8nResponse.status}):`, responseJson);
      return {
        success: true,
        reviewId: review.id,
        n8nResponse: responseJson,
      };
    } else {
      console.error(`❌ Ошибка автоматического webhook для звонка ${callId} на URL: ${n8nWebhookUrl}:`, n8nResponse.status, responseText);
      return {
        success: false,
        reviewId: review.id,
        error: `N8n ошибка: ${n8nResponse.status} ${n8nResponse.statusText}`,
        n8nResponse: responseJson,
      };
    }

  } catch (error: any) {
    console.error(`❌ Ошибка автоматического webhook для звонка ${callId}:`, error);
    
    return {
      success: false,
      error: error.message,
    };
  }
}
