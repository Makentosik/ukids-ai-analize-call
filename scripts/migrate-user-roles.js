const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateUserRoles() {
  console.log('🚀 Начинаем миграцию ролей пользователей...');

  try {
    // Получаем всех пользователей
    const users = await prisma.user.findMany();
    
    console.log(`📋 Найдено пользователей: ${users.length}`);

    const updates = [];

    for (const user of users) {
      let newRole;
      
      // Преобразуем старые роли в новые
      switch (user.role) {
        case 'ADMIN':
          newRole = 'ADMINISTRATOR';
          break;
        case 'MANAGER':
          newRole = 'OCC_MANAGER';
          break;
        case 'EMPLOYEE':
          newRole = 'SUPERVISOR';
          break;
        default:
          console.log(`⚠️  Неизвестная роль для пользователя ${user.name}: ${user.role}`);
          continue;
      }

      if (newRole !== user.role) {
        updates.push({
          id: user.id,
          name: user.name,
          oldRole: user.role,
          newRole: newRole
        });

        // Обновляем роль пользователя
        await prisma.user.update({
          where: { id: user.id },
          data: { role: newRole }
        });

        console.log(`✅ ${user.name}: ${user.role} → ${newRole}`);
      } else {
        console.log(`✓ ${user.name}: роль уже актуальна (${user.role})`);
      }
    }

    console.log(`\n🎉 Миграция завершена!`);
    console.log(`📊 Обновлено ролей: ${updates.length}`);
    
    if (updates.length > 0) {
      console.log('\n📋 Сводка изменений:');
      updates.forEach(update => {
        console.log(`   • ${update.name}: ${update.oldRole} → ${update.newRole}`);
      });
    }

  } catch (error) {
    console.error('❌ Ошибка при миграции:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем миграцию
migrateUserRoles()
  .then(() => {
    console.log('\n✨ Миграция успешно завершена!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Миграция завершилась с ошибкой:', error);
    process.exit(1);
  });
