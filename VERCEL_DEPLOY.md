# 🚀 Быстрый деплой на Vercel

## Текущая проблема
```
Environment Variable "DATABASE_URL" references Secret "database_url", which does not exist.
```

## Решение по шагам:

### 1. Создать базу данных в Vercel
1. Откройте **Vercel Dashboard** → ваш проект
2. Перейдите **Storage** → **Create Database** → **Postgres**
3. Название: `callai-db`
4. Нажмите **Create**

### 2. Скопировать DATABASE_URL
1. **Storage** → **callai-db** → **Quickstart**
2. Скопируйте строку из раздела **Prisma**:
   ```
   DATABASE_URL="postgresql://..."
   ```

### 3. Настроить переменные окружения
**Settings** → **Environment Variables** → добавить:

```bash
DATABASE_URL=postgresql://default:xxxxx@ep-xxxxx-pooler.us-east-1.postgres.vercel-storage.com/verceldb?sslmode=require
NEXTAUTH_SECRET=I75qIb3tLEyQQ1O8inCL+Cbmn1ypIgKze+U18UFwfos=
NEXTAUTH_URL=https://your-app-name.vercel.app
N8N_WEBHOOK_URL=https://miquenaluekos.beget.app/webhook/callai
N8N_WEBHOOK_SECRET=your-webhook-secret
NODE_ENV=production
```

### 4. Redeploy
1. **Deployments** → нажать **⋯** рядом с последним деплоем
2. **Redeploy** → **Use existing Build Cache: No**

### 5. Проверить логи
Если есть ошибки:
1. **Functions** → **View Function Logs**
2. Исправить проблемы
3. Повторить deploy

---

## 🔧 Альтернативное решение через CLI

Если есть Vercel CLI:
```bash
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET  
vercel env add NEXTAUTH_URL
vercel --prod
```

---

## ✅ После успешного деплоя

Ваше приложение будет доступно по адресу:
```
https://your-app-name.vercel.app
```

**Первый запуск:**
1. Зайдите на сайт
2. Перейдите на `/login`
3. Войдите с тестовыми данными или создайте аккаунт через seed

---

## 🆘 Если проблемы остались

Проверьте в Vercel Dashboard:
- ✅ База данных создана
- ✅ Все переменные окружения добавлены
- ✅ Build прошел успешно
- ✅ Functions не показывают ошибки
