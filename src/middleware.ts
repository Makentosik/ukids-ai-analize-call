import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // Если пользователь не авторизован, перенаправляем на страницу входа
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // RBAC проверки
    const userRole = token.role as string;

    // Доступ к админ панели только для ADMINISTRATOR
    if (pathname.startsWith('/admin') && userRole !== 'ADMINISTRATOR') {
      return NextResponse.redirect(new URL('/calls', req.url));
    }

    // Доступ к чек-листам только для OCC_MANAGER и ADMINISTRATOR
    if (pathname.startsWith('/checklists') && !['OCC_MANAGER', 'ADMINISTRATOR'].includes(userRole)) {
      return NextResponse.redirect(new URL('/calls', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Разрешаем доступ к публичным страницам
        if (['/login', '/api/auth'].some(path => pathname.startsWith(path))) {
          return true;
        }

        // Если пользователь не авторизован, перенаправляем на страницу входа
        if (!token) {
          return false;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - login (login page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|login).*)',
  ],
};
