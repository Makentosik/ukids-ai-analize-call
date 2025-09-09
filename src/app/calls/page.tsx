'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Eye, 
  Phone, 
  Search, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Loader2 
} from 'lucide-react';
import { dt, uiText } from '@/lib/locale';
import { CallActions } from '@/components/calls/call-actions';

// Типы для данных звонков
type Call = {
  id: string;
  dealId: string;
  createdAt: string;
  employeeName: string;
  managerName: string;
  payload: {
    duration?: number;
    phoneNumber?: string;
    callType?: string;
    notes?: string;
  };
  reviews: Array<{
    id: string;
    status: string;
    template: {
      title: string;
    };
    requestedBy?: {
      name: string;
    } | null;
  }>;
};

type CallsResponse = {
  calls: Call[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export default function CallsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [callsData, setCallsData] = useState<CallsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояние фильтров
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
  
  const currentPage = Number(searchParams.get('page')) || 1;
  const currentLimit = Number(searchParams.get('limit')) || 20;

  // Debounced поиск
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentSearch = searchParams.get('search') || '';
      if (searchInput !== currentSearch) {
        const url = new URLSearchParams(searchParams);
        if (searchInput.trim()) {
          url.set('search', searchInput.trim());
        } else {
          url.delete('search');
        }
        url.set('page', '1');
        router.push(`/calls?${url.toString()}`);
      }
    }, 500); // Задержка 500мс

    return () => clearTimeout(timeoutId);
  }, [searchInput, searchParams, router]);

  // Функция для обновления URL с параметрами
  const updateURL = useCallback((params: Record<string, string>) => {
    const url = new URLSearchParams(searchParams);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.set(key, value);
      } else {
        url.delete(key);
      }
    });
    
    router.push(`/calls?${url.toString()}`);
  }, [searchParams, router]);

  const fetchCalls = useCallback(async () => {
    try {
      setLoading(true);
      
      // Получаем поиск непосредственно из URL
      const search = searchParams.get('search') || '';
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: currentLimit.toString(),
        ...(search && { search }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        sortBy,
        sortOrder,
      });
      
      const response = await fetch(`/api/calls?${params}`);
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить звонки');
      }
      
      const data = await response.json();
      setCallsData(data);
      setError(null);
    } catch (err) {
      console.error('Ошибка загрузки звонков:', err);
      setError('Не удалось загрузить звонки');
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentLimit, searchParams, dateFrom, dateTo, sortBy, sortOrder]);

  useEffect(() => {
    if (session) {
      fetchCalls();
    }
  }, [session, fetchCalls]);

  // Обработчики фильтров
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Принудительно обновляем URL с поиском
    updateURL({ search: searchInput.trim(), page: '1' });
  };

  const handleDateFilterChange = () => {
    updateURL({ dateFrom, dateTo, page: '1' });
  };

  const handleSortChange = (newSortBy: string) => {
    const newOrder = newSortBy === sortBy && sortOrder === 'desc' ? 'asc' : 'desc';
    updateURL({ sortBy: newSortBy, sortOrder: newOrder, page: '1' });
  };

  const handlePageChange = (page: number) => {
    updateURL({ page: page.toString() });
  };

  const clearFilters = () => {
    setSearchInput('');
    setDateFrom('');
    setDateTo('');
    updateURL({ search: '', dateFrom: '', dateTo: '', page: '1' });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };


  const getReviewStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SENT':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !callsData) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              {uiText.nav.calls}
            </CardTitle>
            <CardDescription>
              {uiText.calls.loading}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Ошибка</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchCalls}>Попробовать снова</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calls = callsData?.calls || [];
  const pagination = callsData?.pagination;

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            {uiText.nav.calls}
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <CardDescription>
            {pagination 
              ? `Показано ${calls.length} из ${pagination.totalCount} звонков`
              : uiText.calls.noCallsFound
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Фильтры */}
          <div className="grid gap-4 md:grid-cols-4">
            <form onSubmit={handleSearchSubmit} className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по ID, сделке, сотруднику..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button type="submit" size="sm" variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            
            <div className="relative">
              <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="От даты"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="relative">
              <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="До даты"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                onClick={handleDateFilterChange}
                variant="outline"
                size="sm"
              >
                Применить
              </Button>
              <Button 
                type="button" 
                onClick={clearFilters}
                variant="ghost"
                size="sm"
              >
                Очистить
              </Button>
            </div>
          </div>

          {/* Таблица */}
          {calls.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {uiText.calls.noCallsFound}
              </h3>
              <p className="text-gray-500">
                {searchParams.get('search') || dateFrom || dateTo 
                  ? 'Попробуйте изменить фильтры поиска'
                  : 'Звонки появятся здесь после получения данных из n8n'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSortChange('id')}
                    >
                      {uiText.calls.tableHeaders.id}
                      {sortBy === 'id' && (
                        <span className="ml-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                      )}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSortChange('dealId')}
                    >
                      {uiText.calls.tableHeaders.deal}
                      {sortBy === 'dealId' && (
                        <span className="ml-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                      )}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSortChange('createdAt')}
                    >
                      {uiText.calls.tableHeaders.created}
                      {sortBy === 'createdAt' && (
                        <span className="ml-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                      )}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSortChange('employeeName')}
                    >
                      {uiText.calls.tableHeaders.employee}
                      {sortBy === 'employeeName' && (
                        <span className="ml-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                      )}
                    </TableHead>
                    <TableHead>{uiText.calls.tableHeaders.manager}</TableHead>
                    <TableHead>Длительность</TableHead>
                    <TableHead>Проверки</TableHead>
                    <TableHead>{uiText.calls.tableHeaders.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((call) => (
                    <TableRow 
                      key={call.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/calls/${call.id}`)}
                    >
                      <TableCell className="font-mono text-sm">
                        {call.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {call.dealId}
                      </TableCell>
                      <TableCell>
                        {dt(call.createdAt)}
                      </TableCell>
                      <TableCell>{call.employeeName}</TableCell>
                      <TableCell>{call.managerName}</TableCell>
                      <TableCell>
                        {call.payload.duration 
                          ? formatDuration(call.payload.duration)
                          : '—'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {call.reviews.map((review) => (
                            <div key={review.id} className="flex flex-col gap-1">
                              <Badge
                                variant="outline"
                                className={getReviewStatusColor(review.status)}
                              >
                                {uiText.status[review.status as keyof typeof uiText.status]}
                              </Badge>
                              {review.requestedBy && (
                                <span className="text-xs text-gray-600">
                                  {review.requestedBy.name}
                                </span>
                              )}
                            </div>
                          ))}
                          {call.reviews.length === 0 && (
                            <span className="text-sm text-gray-500">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <CallActions call={call} onDeleteSuccess={fetchCalls} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Пагинация */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Страница {pagination.page} из {pagination.totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Назад
                </Button>
                
                {/* Номера страниц */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNumber = Math.max(1, pagination.page - 2) + i;
                  if (pageNumber > pagination.totalPages) return null;
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={pageNumber === pagination.page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                      disabled={loading}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || loading}
                >
                  Вперед
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
