const { PrismaClient } = require('@prisma/client');

async function checkCalls() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Проверяем звонки в базе...');
    
    const calls = await prisma.call.findMany({
      include: {
        reviews: {
          include: {
            template: true,
            requestedBy: true,
          }
        }
      }
    });
    
    console.log(`📊 Найдено звонков: ${calls.length}`);
    
    calls.forEach((call, index) => {
      console.log(`\n📞 Звонок ${index + 1}:`);
      console.log(`   ID: ${call.id}`);
      console.log(`   Deal ID: ${call.dealId}`);
      console.log(`   Employee: ${call.employeeName}`);
      console.log(`   Manager: ${call.managerName}`);
      console.log(`   Created: ${call.createdAt}`);
      console.log(`   Call Text: ${call.callText ? 'Есть' : 'Нет'}`);
      console.log(`   Reviews: ${call.reviews.length}`);
      
      call.reviews.forEach((review, reviewIndex) => {
        console.log(`     📝 Проверка ${reviewIndex + 1}:`);
        console.log(`        ID: ${review.id}`);
        console.log(`        Status: ${review.status}`);
        console.log(`        Template: ${review.template.title}`);
        console.log(`        Requested by: ${review.requestedBy ? review.requestedBy.name : 'Автоматическая'}`);
        console.log(`        Comment: ${review.commentText || 'Нет'}`);
        console.log(`        Analysis Results: ${review.analysisResults ? 'Есть' : 'Нет'}`);
        console.log(`        Created: ${review.createdAt}`);
        console.log(`        Completed: ${review.completedAt || 'Не завершена'}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCalls();
