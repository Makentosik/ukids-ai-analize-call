const { PrismaClient } = require('@prisma/client');

async function checkStructure() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Проверяем структуру ChecklistItem...');
    
    const item = await prisma.checklistItem.findFirst({
      include: {
        template: true
      }
    });
    
    if (item) {
      console.log('📋 Найден элемент ChecklistItem:');
      console.log(`   ID: ${item.id}`);
      console.log(`   Title: ${item.title}`);
      console.log(`   Description: ${item.description || 'НЕТ ПОЛЯ description!'}`);
      console.log(`   OrderIndex: ${item.orderIndex}`);
      console.log(`   Template: ${item.template.title}`);
    } else {
      console.log('❌ Элементы ChecklistItem не найдены');
    }
    
    // Проверим все элементы
    const allItems = await prisma.checklistItem.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        orderIndex: true
      },
      take: 3
    });
    
    console.log(`\n📊 Всего элементов в базе: ${allItems.length}`);
    allItems.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.title}" - Описание: ${item.description || 'НЕТ'}`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (error.message.includes('description')) {
      console.log('🚨 Поле description отсутствует в базе данных!');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkStructure();
