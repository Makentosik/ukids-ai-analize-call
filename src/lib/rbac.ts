import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { UserRole } from '@prisma/client';

export type RolePermission = {
  role: UserRole;
  canViewAllCalls: boolean;
  canSendToN8n: boolean;
  canManageChecklists: boolean;
  canManageUsers: boolean;
  canDeleteCalls: boolean;
};

// Определяем права доступа для каждой роли
export const ROLE_PERMISSIONS: Record<UserRole, RolePermission> = {
  [UserRole.ADMINISTRATOR]: {
    role: UserRole.ADMINISTRATOR,
    canViewAllCalls: true,
    canSendToN8n: true,
    canManageChecklists: true,
    canManageUsers: true,
    canDeleteCalls: true,
  },
  [UserRole.OCC_MANAGER]: {
    role: UserRole.OCC_MANAGER,
    canViewAllCalls: true,
    canSendToN8n: true,
    canManageChecklists: true,
    canManageUsers: false,
    canDeleteCalls: true,
  },
  [UserRole.SUPERVISOR]: {
    role: UserRole.SUPERVISOR,
    canViewAllCalls: true,
    canSendToN8n: false,
    canManageChecklists: false,
    canManageUsers: false,
    canDeleteCalls: false,
  },
};

/**
 * Проверяет, есть ли у пользователя определенное разрешение
 */
export function hasPermission(userRole: UserRole, permission: keyof Omit<RolePermission, 'role'>): boolean {
  return ROLE_PERMISSIONS[userRole][permission];
}

/**
 * Проверяет, может ли пользователь просматривать звонок
 */
export function canViewCall(userRole: UserRole, userName: string, callEmployeeName: string): boolean {
  if (hasPermission(userRole, 'canViewAllCalls')) {
    return true;
  }
  
  // Сотрудники могут видеть только свои звонки
  return userName === callEmployeeName;
}

/**
 * Получает сессию и проверяет права доступа к конкретному разрешению
 */
export async function requirePermission(permission: keyof Omit<RolePermission, 'role'>) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('Не авторизован');
  }
  
  const userRole = session.user.role as UserRole;
  if (!hasPermission(userRole, permission)) {
    throw new Error('Недостаточно прав');
  }
  
  return { session, user: session.user };
}

/**
 * Получает сессию и проверяет авторизацию без проверки конкретных прав
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('Не авторизован');
  }
  
  return { session, user: session.user };
}

/**
 * Создает фильтр для Prisma запроса на основе роли пользователя
 */
export function createCallsFilter(userRole: UserRole, userName: string) {
  if (hasPermission(userRole, 'canViewAllCalls')) {
    return {}; // Нет фильтра - видят все звонки
  }
  
  return {
    employeeName: userName, // Сотрудники видят только свои звонки
  };
}
