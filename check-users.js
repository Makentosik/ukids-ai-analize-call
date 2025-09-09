const { PrismaClient } = require('@prisma/client');

async function checkUsers() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Проверяем пользователей в базе...');
    
    const users = await prisma.user.findMany();
    
    console.log(`📊 Найдено пользователей: ${users.length}`);
    
    users.forEach((user, index) => {
      console.log(`\n👤 Пользователь ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Hash: ${user.passwordHash}`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
