'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  Loader2,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react';
import { uiText, dt } from '@/lib/locale';
import { updateProfileSchema, changePasswordSchema } from '@/lib/validations';
import { toast } from 'sonner';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

type ProfileFormProps = {
  user: UserProfile;
  onProfileUpdated?: (user: UserProfile) => void;
};

type ProfileFormData = z.infer<typeof updateProfileSchema>;
type PasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ProfileForm({ user, onProfileUpdated }: ProfileFormProps) {
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Форма для обновления профиля
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  });

  // Форма для смены пароля
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Обновляем форму при изменении пользователя
  useEffect(() => {
    profileForm.reset({
      name: user.name,
      email: user.email,
    });
  }, [user, profileForm]);

  const handleProfileSubmit = async (data: ProfileFormData) => {
    try {
      setIsSubmittingProfile(true);

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateProfile',
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка обновления профиля');
      }

      toast.success(uiText.profile.profileUpdated);
      
      if (onProfileUpdated && result.user) {
        onProfileUpdated(result.user);
      }
    } catch (error: any) {
      console.error('Ошибка обновления профиля:', error);
      toast.error(error.message || 'Ошибка обновления профиля');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    try {
      setIsSubmittingPassword(true);

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'changePassword',
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка смены пароля');
      }

      toast.success(uiText.profile.passwordUpdated);
      
      // Очищаем форму после успешной смены пароля
      passwordForm.reset();
    } catch (error: any) {
      console.error('Ошибка смены пароля:', error);
      toast.error(error.message || 'Ошибка смены пароля');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Информация о профиле */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {uiText.profile.personalInfo}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {uiText.profile.personalInfoDescription}
          </p>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{uiText.profile.name} *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Введите ваше полное имя"
                            className="pl-10"
                            {...field}
                            disabled={isSubmittingProfile}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Ваше имя будет отображаться в системе
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{uiText.profile.email} *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="Введите ваш email"
                            className="pl-10"
                            {...field}
                            disabled={isSubmittingProfile}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Email используется для входа в систему
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Информация только для чтения */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FormLabel>{uiText.profile.role}</FormLabel>
                  <div className="mt-2">
                    <Badge variant="outline" className="flex w-fit items-center gap-2">
                      <Shield className="h-3 w-3" />
                      {uiText.roles[user.role as keyof typeof uiText.roles]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Роль назначается администратором
                  </p>
                </div>

                <div>
                  <FormLabel>{uiText.profile.memberSince}</FormLabel>
                  <div className="mt-2">
                    <p className="text-sm font-medium">{dt(user.createdAt)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Дата регистрации в системе
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmittingProfile || !profileForm.formState.isDirty}
                >
                  {isSubmittingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {uiText.profile.saveProfile}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator />

      {/* Форма смены пароля */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {uiText.profile.changePassword}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {uiText.profile.changePasswordDescription}
          </p>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{uiText.profile.currentPassword} *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showCurrentPassword ? 'text' : 'password'}
                          placeholder="Введите текущий пароль"
                          className="pl-10 pr-10"
                          {...field}
                          disabled={isSubmittingPassword}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{uiText.profile.newPassword} *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="Введите новый пароль"
                            className="pl-10 pr-10"
                            {...field}
                            disabled={isSubmittingPassword}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Минимум 6 символов
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{uiText.profile.confirmPassword} *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Повторите новый пароль"
                            className="pl-10 pr-10"
                            {...field}
                            disabled={isSubmittingPassword}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmittingPassword || !passwordForm.formState.isDirty}
                >
                  {isSubmittingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Lock className="mr-2 h-4 w-4" />
                  {uiText.profile.changePasswordBtn}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
