const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔐 Создаем тестового пользователя...');
    
    const email = 'test@admin.local';
    const password = 'admin123';
    const name = 'Тест Администратор';
    const role = 'ADMINISTRATOR';

    // Проверяем, существует ли уже такой пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('🔄 Пользователь уже существует, обновляем пароль...');
      
      // Хешируем новый пароль
      const passwordHash = await bcrypt.hash(password, 12);
      
      await prisma.user.update({
        where: { email },
        data: { 
          passwordHash,
          name,
          role
        }
      });
      
      console.log('✅ Пароль обновлен!');
    } else {
      // Хешируем пароль
      const passwordHash = await bcrypt.hash(password, 12);

      // Создаем пользователя
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role
        }
      });

      console.log('✅ Пользователь создан!');
    }

    console.log('\n🎯 Данные для входа:');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Пароль: ${password}`);
    console.log(`👤 Роль: ${role}`);
    
    // Также проверим существующих пользователей
    console.log('\n📋 Все пользователи в системе:');
    const users = await prisma.user.findMany({
      select: { name: true, email: true, role: true }
    });
    
    users.forEach(u => {
      console.log(`  • ${u.name} (${u.email}) - ${u.role}`);
    });

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
