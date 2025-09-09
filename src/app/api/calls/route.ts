import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, createCallsFilter } from '@/lib/rbac';
import { callsSearchSchema, parseDateString } from '@/lib/validations';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth();
    const { searchParams } = new URL(request.url);

    // Парсим и валидируем параметры запроса
    const params = {
      search: searchParams.get('search') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    const validationResult = callsSearchSchema.safeParse(params);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Неверные параметры запроса', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { search, dateFrom, dateTo, page, limit, sortBy, sortOrder } = validationResult.data;

    // Создаем базовый фильтр на основе роли
    const baseFilter = createCallsFilter(user.role as UserRole, user.name);

    // Создаем условие WHERE с учетом всех фильтров
    const whereCondition: any = { ...baseFilter };

    // Добавляем поиск по тексту (для SQLite убираем mode: 'insensitive')
    if (search) {
      console.log('🔍 Поиск по термину:', search);
      whereCondition.OR = [
        { id: { contains: search } },
        { dealId: { contains: search } },
        { employeeName: { contains: search } },
        { managerName: { contains: search } },
      ];
    }

    // Добавляем фильтр по дате
    const dateFilter: any = {};
    if (dateFrom) {
      const fromDate = parseDateString(dateFrom);
      if (fromDate) {
        dateFilter.gte = fromDate;
      }
    }
    if (dateTo) {
      const toDate = parseDateString(dateTo);
      if (toDate) {
        // Добавляем один день для включения записей до конца дня
        toDate.setDate(toDate.getDate() + 1);
        dateFilter.lt = toDate;
      }
    }
    if (Object.keys(dateFilter).length > 0) {
      whereCondition.createdAt = dateFilter;
    }

    // Настраиваем сортировку
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Рассчитываем смещение для пагинации
    const skip = (page - 1) * limit;

    // Выполняем запросы к базе данных
    const [calls, totalCount] = await Promise.all([
      prisma.call.findMany({
        where: whereCondition,
        include: {
          reviews: {
            include: {
              template: {
                select: {
                  title: true,
                },
              },
              requestedBy: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.call.count({
        where: whereCondition,
      }),
    ]);

    // Лог для диагностики
    console.log(`📊 Найдено ${calls.length} звонков из ${totalCount} общих`);
    
    // Подготавливаем метаданные для пагинации
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      calls,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error: any) {
    console.error('Ошибка получения звонков:', error);

    if (error.message === 'Не авторизован') {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth();
    
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

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
    
    // Валидация входных данных
    const { id, dealId, createdAt, employeeName, managerName, initiatedBy, callText, payload } = body;
    
    if (!id || !dealId || !createdAt || !employeeName || !managerName) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля' },
        { status: 400 }
      );
    }

    // Создаем новый звонок
    const call = await prisma.call.create({
      data: {
        id,
        dealId,
        createdAt: new Date(createdAt),
        employeeName,
        managerName,
        initiatedBy: initiatedBy ? String(initiatedBy) : null,
        callText: callText ? String(callText) : null,
        payload: payload || {},
      },
      include: {
        reviews: {
          include: {
            template: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(call, { status: 201 });
  } catch (error: any) {
    console.error('Ошибка создания звонка:', error);
    
    // Обработка ошибки уникальности (звонок уже существует)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Звонок с таким ID уже существует' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
