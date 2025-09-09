# 🎯 Точная настройка Vercel для CallAI

## 📊 Ваши данные базы данных
- **Обычный PostgreSQL:** `postgres://9189e5555656e98e4b84ae0597975ca0759fcbf50356f876b89c871f39fdda83:sk_EuD3gH86uYXqAmgV5wUFc@db.prisma.io:5432/postgres?sslmode=require`
- **Prisma Accelerate:** `prisma+postgres://accelerate.prisma-data.net/?api_key=...` (для ускорения)

## 🚀 Настройка в Vercel Dashboard

### 1. Откройте ваш проект в Vercel
### 2. Перейдите в Settings → Environment Variables
### 3. Добавьте следующие переменные:

```bash
DATABASE_URL
postgres://9189e5555656e98e4b84ae0597975ca0759fcbf50356f876b89c871f39fdda83:sk_EuD3gH86uYXqAmgV5wUFc@db.prisma.io:5432/postgres?sslmode=require

NEXTAUTH_SECRET
I75qIb3tLEyQQ1O8inCL+Cbmn1ypIgKze+U18UFwfos=

NEXTAUTH_URL
https://your-actual-domain.vercel.app

N8N_WEBHOOK_URL
https://miquenaluekos.beget.app/webhook/callai

N8N_WEBHOOK_SECRET
your-actual-webhook-secret

NODE_ENV
production
```

### 4. Замените placeholder'ы:
- `your-actual-domain` → ваш реальный домен Vercel
- `your-actual-webhook-secret` → ваш реальный секрет webhook

## 🔄 Redeploy
1. **Deployments** → нажмите **⋯** у последнего деплоя
2. **Redeploy** → снимите галочку **Use existing Build Cache**
3. **Redeploy** → подождите завершения

## ✅ Проверка
После деплоя:
1. Откройте `https://your-domain.vercel.app`
2. Перейдите на `/login` 
3. Попробуйте войти или создать аккаунт

## 🆘 Если проблемы
1. **Functions** → **View Function Logs** - смотрите ошибки
2. Проверьте, что все переменные добавлены правильно
3. Убедитесь, что NEXTAUTH_URL точно совпадает с доменом

---

## 🎉 После успешного деплоя ваше приложение будет:
- Использовать Prisma Cloud Database (быстро и надежно)
- Работать с аутентификацией NextAuth
- Принимать webhooks от n8n
- Полностью функционально в production!
