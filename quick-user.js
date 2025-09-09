const bcrypt = require('bcryptjs');

async function createUser() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    console.log('🌱 Создание пользователя...');
    
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Администратор',
        passwordHash: hashedPassword,
        role: 'ADMIN',
      },
    });
    
    console.log('✅ Пользователь создан:', admin);
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Пароль: admin123');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

createUser();
