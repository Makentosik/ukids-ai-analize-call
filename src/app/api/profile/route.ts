import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { updateProfileSchema, changePasswordSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';

// GET /api/profile - получить данные профиля текущего пользователя
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth();

    // Получаем полную информацию о пользователе
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    return NextResponse.json(userProfile);
  } catch (error: any) {
    console.error('Ошибка получения профиля:', error);

    if (error.message === 'Не авторизован') {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// PUT /api/profile - обновить профиль пользователя
export async function PUT(request: NextRequest) {
  try {
    const { user } = await requireAuth();

    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('Ошибка парсинга JSON:', jsonError);
      return NextResponse.json(
        { error: 'Неверный формат данных JSON' },
        { status: 400 }
      );
    }

    const { action } = body;

    if (action === 'updateProfile') {
      // Обновление основных данных профиля
      const validationResult = updateProfileSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            error: 'Неверный формат данных',
            details: validationResult.error.errors
          },
          { status: 400 }
        );
      }

      const { name, email } = validationResult.data;

      // Проверяем, не занят ли email другим пользователем
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: user.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email уже используется другим пользователем' },
          { status: 409 }
        );
      }

      // Обновляем профиль
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { name, email },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        message: 'Профиль успешно обновлен',
        user: updatedUser,
      });

    } else if (action === 'changePassword') {
      // Смена пароля
      const validationResult = changePasswordSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            error: 'Неверный формат данных',
            details: validationResult.error.errors
          },
          { status: 400 }
        );
      }

      const { currentPassword, newPassword } = validationResult.data;

      // Получаем текущего пользователя с паролем
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, passwordHash: true },
      });

      if (!currentUser) {
        return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
      }

      // Проверяем текущий пароль
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.passwordHash);
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: 'Неверный текущий пароль' },
          { status: 400 }
        );
      }

      // Хешируем новый пароль
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Обновляем пароль
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedNewPassword },
      });

      return NextResponse.json({
        message: 'Пароль успешно изменен',
      });

    } else {
      return NextResponse.json(
        { error: 'Неизвестное действие' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Ошибка обновления профиля:', error);

    if (error.message === 'Не авторизован') {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
