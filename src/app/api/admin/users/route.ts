import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/rbac';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

// Схема валидации для создания пользователя
const createUserSchema = z.object({
  name: z.string().min(1, 'Имя обязательно'),
  email: z.string().email('Неверный формат email'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Неверная роль' }) }),
});

// Схема валидации для обновления пользователя
const updateUserSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').optional(),
  email: z.string().email('Неверный формат email').optional(),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов').optional(),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Неверная роль' }) }).optional(),
});

// GET /api/admin/users - получить всех пользователей
export async function GET(request: NextRequest) {
  try {
    // Проверяем права администратора
    await requirePermission('canManageUsers');

    const users = await prisma.user.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Ошибка получения пользователей:', error);
    
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

// POST /api/admin/users - создать нового пользователя
export async function POST(request: NextRequest) {
  try {
    // Проверяем права администратора
    await requirePermission('canManageUsers');

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
    const validationResult = createUserSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, email, password, role } = validationResult.data;

    // Проверяем, не существует ли уже пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      );
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 12);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('Ошибка создания пользователя:', error);
    
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
