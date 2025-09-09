-- Миграция ролей пользователей
-- Обновляем старые роли на новые

UPDATE users 
SET role = 'ADMINISTRATOR'
WHERE role = 'ADMIN';

UPDATE users 
SET role = 'OCC_MANAGER'
WHERE role = 'MANAGER';

UPDATE users 
SET role = 'SUPERVISOR'
WHERE role = 'EMPLOYEE';

-- Проверяем результат
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;
