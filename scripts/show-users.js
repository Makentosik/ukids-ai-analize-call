const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showUsers() {
  try {
    console.log('👥 Пользователи в системе:\n');
    
    const users = await prisma.user.findMany({
      select: {
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (users.length === 0) {
      console.log('❌ Пользователи не найдены');
      return;
    }

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔐 Роль: ${user.role}`);
      console.log(`   📅 Создан: ${user.createdAt.toLocaleString()}`);
      console.log('');
    });

    console.log(`📊 Всего пользователей: ${users.length}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showUsers();
