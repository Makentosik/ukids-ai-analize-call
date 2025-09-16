import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseRussianDate } from '@/lib/utils';

export async function GET() {
  try {
    // Проверяем подключение к базе данных
    await prisma.$queryRaw`SELECT 1`;
    
    // Тестируем функцию парсинга русских дат
    const testDate = '16.09.2025 11:13';
    const parsedDate = parseRussianDate(testDate);
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '2.1-russian-date-parser',
      dateParser: {
        testInput: testDate,
        testOutput: parsedDate?.toISOString() || null,
        working: parsedDate !== null
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: 'Database connection failed',
      },
      { status: 500 }
    );
  }
}
