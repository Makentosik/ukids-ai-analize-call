import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

// Схема валидации для обновления пользователя
const updateUserSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').optional(),
  email: z.string().email('Неверный формат email').optional(),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов').optional(),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Неверная роль' }) }).optional(),
});

type RouteParams = {
  params: {
    id: string;
  };
};

// GET /api/admin/users/[id] - получить пользователя по ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Проверяем права администратора
    await requirePermission('canManageUsers');

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            createdChecklists: true,
            requestedReviews: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Ошибка получения пользователя:', error);
    
    if (error.message === 'Не авторизован') {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    if (error.message === 'Недостаточно прав') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - обновить пользователя
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Проверяем права администратора
    const { user: currentUser } = await requirePermission('canManageUsers');

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
    const validationResult = updateUserSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, email, password, role } = validationResult.data;

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Проверяем, не пытается ли пользователь изменить самого себя
    if (params.id === currentUser.id && role && role !== currentUser.role) {
      return NextResponse.json(
        { error: 'Нельзя изменить собственную роль' },
        { status: 400 }
      );
    }

    // Если изменяется email, проверяем уникальность
    if (email && email !== existingUser.email) {
      const userWithEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (userWithEmail) {
        return NextResponse.json(
          { error: 'Пользователь с таким email уже существует' },
          { status: 409 }
        );
      }
    }

    // Подготавливаем данные для обновления
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    // Обновляем пользователя
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('Ошибка обновления пользователя:', error);
    
    if (error.message === 'Не авторизован') {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    if (error.message === 'Недостаточно прав') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - удалить пользователя
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Проверяем права администратора
    const { user: currentUser } = await requirePermission('canManageUsers');

    // Проверяем, не пытается ли пользователь удалить самого себя
    if (params.id === currentUser.id) {
      return NextResponse.json(
        { error: 'Нельзя удалить собственный аккаунт' },
        { status: 400 }
      );
    }

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            createdChecklists: true,
            requestedReviews: true,
          },
        },
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Проверяем, есть ли у пользователя связанные данные
    if (existingUser._count.createdChecklists > 0 || existingUser._count.requestedReviews > 0) {
      return NextResponse.json(
        { error: 'Нельзя удалить пользователя с существующими данными' },
        { status: 400 }
      );
    }

    // Удаляем пользователя
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Пользователь успешно удален' });
  } catch (error: any) {
    console.error('Ошибка удаления пользователя:', error);
    
    if (error.message === 'Не авторизован') {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    if (error.message === 'Недостаточно прав') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
