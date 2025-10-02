# 🗃️ Восстановление PostgreSQL базы данных для Vercel

## 📋 Варианты настройки базы данных

### Вариант 1: Vercel Postgres (рекомендуется)

1. **Перейдите в проект на Vercel:**
   - Откройте https://vercel.com/dashboard
   - Выберите свой проект `callai-app`

2. **Создайте Vercel Postgres:**
   - Перейдите в раздел "Storage"
   - Нажмите "Connect Store" → "Postgres"
   - Выберите регион (лучше выбрать ближайший к России)
   - Нажмите "Create & Connect"

3. **Получите данные подключения:**
   - Vercel автоматически создаст переменные окружения:
     - `POSTGRES_URL`
     - `POSTGRES_PRISMA_URL` 
     - `POSTGRES_URL_NO_SSL`
     - `POSTGRES_URL_NON_POOLING`
     - и другие

4. **Обновите переменную DATABASE_URL:**
   - В настройках проекта Vercel → Environment Variables
   - Установите `DATABASE_URL` = `POSTGRES_PRISMA_URL`

### Вариант 2: Neon Database (бесплатный)

1. **Создайте аккаунт на Neon:**
   - Перейдите на https://neon.tech
   - Создайте проект

2. **Получите строку подключения:**
   ```
   postgresql://[user]:[password]@[hostname]/[database]?sslmode=require
   ```

3. **Установите в Vercel:**
   - Environment Variables → `DATABASE_URL` = ваша строка подключения

### Вариант 3: Railway (простой)

1. **Создайте проект на Railway:**
   - https://railway.app
   - Add Service → PostgreSQL

2. **Скопируйте DATABASE_URL из Railway**
3. **Установите в Vercel Environment Variables**

## 🚀 Восстановление структуры базы данных

### Способ 1: Через Prisma (автоматический)

1. **Обновите vercel-build скрипт в package.json:**
   ```json
   {
     "scripts": {
       "vercel-build": "prisma generate && prisma migrate deploy && prisma db seed && next build"
     }
   }
   ```

2. **Задеплойте проект:**
   ```bash
   vercel --prod
   ```

### Способ 2: Ручное восстановление через SQL

1. **Подключитесь к вашей новой базе PostgreSQL**
2. **Выполните скрипт `database-restore-script.sql`**

## 🔧 Настройка переменных окружения в Vercel

Установите следующие переменные в Vercel → Project Settings → Environment Variables:

### Обязательные:
```env
DATABASE_URL="ваша_строка_подключения_к_postgres"
NEXTAUTH_SECRET="I75qIb3tLEyQQ1O8inCL+Cbmn1ypIgKze+U18UFwfos="
NEXTAUTH_URL="https://ваш-домен.vercel.app"
NODE_ENV="production"
```

### Дополнительные (если используете):
```env
N8N_WEBHOOK_URL="https://miquenaluekos.beget.app/webhook/test-ai-call"
N8N_WEBHOOK_SECRET="your-production-webhook-secret"
```

## 🧪 Тестирование восстановления

1. **После деплоя перейдите на сайт:**
   ```
   https://ваш-домен.vercel.app/auth/signin
   ```

2. **Войдите с тестовыми данными:**
   - Админ: `admin@ukids.local` / `Admin#12345`
   - Менеджер: `manager@ukids.local` / `manager123`
   - Сотрудник: `employee@ukids.local` / `employee123`

## 🐛 Решение проблем

### Ошибка подключения к базе:
- Проверьте корректность строки подключения
- Убедитесь, что база данных запущена
- Проверьте настройки файрвола

### Ошибки миграции:
```bash
# Локально для тестирования:
npx prisma migrate reset --force
npx prisma db seed
```

### Проблемы с Vercel:
- Проверьте логи в Vercel Dashboard → Functions
- Убедитесь, что все переменные окружения установлены
- Перезапустите билд после изменения переменных

## 📞 Контакты для поддержки

Если возникли проблемы:
1. Проверьте логи в Vercel Functions
2. Убедитесь, что строка подключения к БД корректна
3. Проверьте, что все миграции применились

## 🔄 Команды для локальной работы

```bash
# Применить миграции
npx prisma migrate deploy

# Заполнить базу тестовыми данными
npx prisma db seed

# Сгенерировать Prisma Client
npx prisma generate

# Сбросить базу (только для разработки!)
npx prisma migrate reset --force
```