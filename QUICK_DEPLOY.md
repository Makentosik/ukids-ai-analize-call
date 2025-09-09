# ⚡ Быстрый деплой CallAI

## 🚀 Самый простой способ - Vercel (5 минут)

### 1. Подготовка
```bash
git add .
git commit -m "Ready for production"
git push origin main
```

### 2. Деплой
1. Зайдите на [vercel.com](https://vercel.com)
2. **New Project** → Import ваш GitHub репозиторий
3. **Deploy** (Vercel автоматически определит Next.js)

### 3. База данных  
1. В Vercel Dashboard: **Storage** → **Create Database** → **Postgres**
2. Скопируйте `DATABASE_URL` из настроек

### 4. Переменные окружения
В **Settings** → **Environment Variables** добавьте:
```
DATABASE_URL=postgresql://[из Vercel Postgres]
NEXTAUTH_SECRET=your-super-secret-key-32-chars
NEXTAUTH_URL=https://your-app.vercel.app
N8N_WEBHOOK_URL=https://your-n8n.com/webhook/callai
N8N_WEBHOOK_SECRET=your-webhook-secret
```

### 5. Готово! 🎉
- Ваш сайт: `https://your-project.vercel.app`
- Автообновления: при push в main ветку

---

## 🔄 Обновление сайта

### Автоматически (рекомендуется)
```bash
git add .
git commit -m "Новые изменения"  
git push origin main
# Vercel автоматически обновит через ~2 минуты
```

### Вручную
```bash
npx vercel --prod
```

---

## 🆘 Если что-то не работает

1. **Проверьте health:** `https://your-app.vercel.app/api/health`
2. **Логи:** Vercel Dashboard → Functions → View Logs  
3. **База данных:** Убедитесь что `DATABASE_URL` правильный
4. **Миграции:** Vercel автоматически применяет при деплое

---

## 📱 Альтернатива - Railway

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. **Add PostgreSQL service**  
3. Добавьте те же переменные окружения
4. **Deploy**

Стоимость: ~$5/месяц vs Vercel бесплатно (с ограничениями)

---

## 🔑 Генерация секретных ключей

```bash
# NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Или онлайн
https://generate-secret.vercel.app/32
```

---

**Готово!** Теперь ваш CallAI доступен в интернете и автоматически обновляется! 🚀
