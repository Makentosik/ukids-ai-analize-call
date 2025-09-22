import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requirePermission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    // Проверяем права на управление чек-листами
    const { user } = await requirePermission('canManageChecklists');
    
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    // Получаем чек-листы с фильтрацией по активности
    const whereClause = activeOnly ? { isActive: true } : {};
    
    const checklists = await prisma.checklistTemplate.findMany({
      where: whereClause,
      include: {
        items: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            items: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(checklists);
  } catch (error: any) {
    console.error('Ошибка получения чек-листов:', error);

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

export async function POST(request: NextRequest) {
  try {
    // Проверяем права на управление чек-листами
    const { requirePermission } = await import('@/lib/rbac');
    const { user } = await requirePermission('canManageChecklists');

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
    
    // Валидация данных
    console.log('🔍 Получены данные для создания чек-листа:', JSON.stringify(body, null, 2));
    
    const { createChecklistSchema } = await import('@/lib/validations');
    const validationResult = createChecklistSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('❌ Ошибка валидации чек-листа:');
      console.error('Error details:', validationResult.error);
      console.error('Error issues:', validationResult.error.issues);
      return NextResponse.json(
        { 
          error: 'Неверный формат данных',
          details: validationResult.error.issues,
          receivedData: body
        },
        { status: 400 }
      );
    }
    
    console.log('✅ Валидация прошла успешно:', validationResult.data);

    const { name, description, isActive, items } = validationResult.data;

    // Создаем чек-лист с элементами в транзакции
    const checklist = await prisma.checklistTemplate.create({
      data: {
        title: name, // Map name to title for the database
        description,
        isActive,
        createdById: user.id,
        items: {
          create: items.map(item => ({
            title: item.text, // Map text to title for database
            description: item.description || '',
            orderIndex: item.orderIndex,
            evaluationType: item.evaluationType || 'SCALE_1_10',
          })),
        },
      },
      include: {
        items: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(checklist, { status: 201 });
  } catch (error: any) {
    console.error('Ошибка создания чек-листа:', error);

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
