const { PrismaClient } = require('@prisma/client');

async function updateChecklistDescriptions() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Обновляем существующие элементы чек-листов с описаниями...');
    
    // Получаем все элементы чек-листов
    const items = await prisma.checklistItem.findMany({
      orderBy: [
        { templateId: 'asc' },
        { orderIndex: 'asc' }
      ]
    });
    
    console.log(`📊 Найдено ${items.length} элементов для обновления`);
    
    // Словарь описаний для разных заголовков
    const descriptions = {
      'Поздоровался с клиентом': 'Менеджер вежливо поздоровался с клиентом в начале разговора. Примеры: "Доброе утро!", "Здравствуйте!", "Добрый день!"',
      'Представился и назвал компанию': 'Менеджер назвал свое имя и компанию, которую представляет. Пример: "Меня зовут Анна, я из Академии Ukids"',
      'Выяснил потребность клиента': 'Менеджер задал вопросы, чтобы понять, что нужно клиенту, какие у него сложности и цели. Пример: "Скажите, какие сложности у ребёнка?"',
      'Предложил подходящий продукт/услугу': 'На основании потребности клиента менеджер предложил конкретные услуги или программы, объяснил их преимущества',
      'Ответил на все вопросы клиента': 'Менеджер терпеливо и полно ответил на все вопросы клиента, не оставил ниодного без внимания',
      'Договорился о следующих шагах': 'Менеджер обозначил конкретные дальнейшие действия: когда состоится встреча, пробное занятие, консультация или другие мероприятия',
      'Поблагодарил за время': 'Менеджер вежливо поблагодарил клиента за время, уделённое разговору, и красиво завершил беседу'
    };
    
    let updatedCount = 0;
    
    for (const item of items) {
      const description = descriptions[item.title];
      
      if (description && item.description !== description) {
        await prisma.checklistItem.update({
          where: { id: item.id },
          data: { description }
        });
        
        console.log(`✅ Обновлен элемент: "${item.title}"`);
        updatedCount++;
      } else if (!description) {
        console.log(`⚠️ Нет описания для элемента: "${item.title}"`);
      } else {
        console.log(`✓ Элемент уже имеет корректное описание: "${item.title}"`);
      }
    }
    
    console.log(`🎉 Обновлено ${updatedCount} элементов из ${items.length}`);
    
    // Проверим результат
    console.log('\n📋 Проверяем результат...');
    const updatedItems = await prisma.checklistItem.findMany({
      include: {
        template: true
      },
      orderBy: [
        { templateId: 'asc' },
        { orderIndex: 'asc' }
      ],
      take: 5
    });
    
    updatedItems.forEach((item, index) => {
      console.log(`${index + 1}. "${item.title}"`);
      console.log(`   Описание: ${item.description ? item.description.substring(0, 80) + '...' : 'НЕТ'}`);
      console.log(`   Шаблон: ${item.template.title}`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateChecklistDescriptions();
