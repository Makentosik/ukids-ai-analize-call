'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { User, RefreshCw } from 'lucide-react';
import { uiText } from '@/lib/locale';
import ProfileForm from '@/components/profile/profile-form';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Перенаправляем неавторизованных пользователей
  if (status === 'unauthenticated') {
    redirect('/login');
  }

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile');
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить профиль');
      }
      
      const data = await response.json();
      setUserProfile(data);
      setError(null);
    } catch (err: any) {
      console.error('Ошибка загрузки профиля:', err);
      setError(err.message || 'Ошибка загрузки профиля');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile();
    }
  }, [session]);

  const handleProfileUpdated = async (updatedUser: UserProfile) => {
    // Обновляем локальное состояние
    setUserProfile(updatedUser);
    
    // Обновляем сессию, если изменилось имя или email
    if (session?.user && 
        (session.user.name !== updatedUser.name || session.user.email !== updatedUser.email)) {
      await update({
        ...session,
        user: {
          ...session.user,
          name: updatedUser.name,
          email: updatedUser.email,
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Заголовок */}
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>

          {/* Скелетон форм */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-72" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <Skeleton className="h-10 w-32 ml-auto" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-72" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-32 ml-auto" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Ошибка загрузки</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchUserProfile} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Попробовать снова
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Профиль не найден</CardTitle>
              <CardDescription>Не удалось загрузить данные профиля</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchUserProfile} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Обновить
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {uiText.profile.title}
              </h1>
            </div>
          </div>
          <p className="text-muted-foreground">
            {uiText.profile.subtitle}
          </p>
        </div>

        {/* Форма профиля */}
        <ProfileForm 
          user={userProfile} 
          onProfileUpdated={handleProfileUpdated}
        />
      </div>
    </div>
  );
}
