'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { uiText, toastMessages } from '@/lib/locale';

// Схема валидации формы логина
const loginSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(1, 'Пароль обязателен'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(toastMessages.invalidCredentials);
        return;
      }

      // Получаем сессию для проверки роли пользователя
      const session = await getSession();
      if (session?.user) {
        toast.success(`Добро пожаловать, ${session.user.name}!`);
        router.push('/calls');
      }
    } catch (error) {
      console.error('Ошибка входа:', error);
      toast.error(toastMessages.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {uiText.login.title}
          </CardTitle>
          <CardDescription className="text-center">
            Введите ваши данные для входа в систему
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {uiText.login.email}
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@localhost"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {uiText.login.password}
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Вход...' : uiText.login.submit}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Тестовые аккаунты:</p>
            <div className="mt-2 space-y-1">
              <p><strong>Админ:</strong> admin@localhost / admin123</p>
              <p><strong>Менеджер:</strong> manager@localhost / manager123</p>
              <p><strong>Сотрудник:</strong> employee@localhost / employee123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
