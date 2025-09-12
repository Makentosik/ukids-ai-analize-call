'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Phone, 
  ArrowLeft, 
  Send, 
  CheckSquare,
  User,
  Calendar,
  Hash,
  Briefcase,
  Clock,
  MessageSquare,
  Loader2,
  AlertCircle,
  CheckCircle,
  MoreHorizontal,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { dt, uiText, toastMessages } from '@/lib/locale';
import AnalysisResults, { type AnalysisResults as AnalysisResultsType } from '@/components/calls/analysis-results';
import { CallActions } from '@/components/calls/call-actions';

// Типы данных
type Call = {
  id: string;
  dealId: string;
  createdAt: string;
  employeeName: string;
  managerName: string;
  initiatedBy?: string; // Кто запустил бизнес-процесс в Б24
  callText?: string; // Текст звонка (расшифровка)
  payload: {
    duration?: number;
    phoneNumber?: string;
    callType?: string;
    notes?: string;
    [key: string]: any;
  };
  reviews: Array<{
    id: string;
    status: string;
    commentText?: string;
    createdAt: string;
    completedAt?: string;
    analysisResults?: AnalysisResultsType;
    template: {
      title: string;
    };
    requestedBy?: {
      name: string;
    } | null;
  }>;
};

type ChecklistTemplate = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  items: Array<{
    id: string;
    text: string;
    weight: number;
    orderIndex: number;
  }>;
};

// Схема валидации формы
const reviewFormSchema = z.object({
  templateId: z.string().min(1, 'Выберите чек-лист'),
  commentText: z.string().optional(),
});

type ReviewForm = z.infer<typeof reviewFormSchema>;

export default function CallDetailsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const callId = params?.id as string;

  const [call, setCall] = useState<Call | null>(null);
  const [checklists, setChecklists] = useState<ChecklistTemplate[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReviewForm>({
    resolver: zodResolver(reviewFormSchema),
  });

  const watchedTemplateId = watch('templateId');

  // Функция для ручного обновления данных
  const refreshCallData = async () => {
    if (!callId || !session || refreshing) return;

    try {
      setRefreshing(true);
      const callResponse = await fetch(`/api/calls/${callId}`);
      
      if (callResponse.ok) {
        const callData = await callResponse.json();
        setCall(callData);
        toast.success('Данные обновлены');
      } else {
        toast.error('Не удалось обновить данные');
      }
    } catch (err) {
      console.error('Ошибка обновления данных:', err);
      toast.error('Ошибка обновления данных');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (watchedTemplateId) {
      const checklist = checklists.find(c => c.id === watchedTemplateId);
      setSelectedChecklist(checklist || null);
    } else {
      setSelectedChecklist(null);
    }
  }, [watchedTemplateId, checklists]);

  useEffect(() => {
    const fetchData = async () => {
      if (!callId || !session) return;

      try {
        setLoading(true);
        
        // Получаем данные звонка и чек-листы параллельно
        const [callResponse, checklistsResponse] = await Promise.all([
          fetch(`/api/calls/${callId}`),
          fetch('/api/checklists'),
        ]);

        if (!callResponse.ok) {
          if (callResponse.status === 404) {
            throw new Error('Звонок не найден');
          }
          if (callResponse.status === 403) {
            throw new Error('У вас нет прав для просмотра этого звонка');
          }
          throw new Error('Не удалось загрузить данные звонка');
        }

        if (!checklistsResponse.ok) {
          throw new Error('Не удалось загрузить чек-листы');
        }

        const callData = await callResponse.json();
        const checklistsData = await checklistsResponse.json();
        
        setCall(callData);
        setChecklists(checklistsData);
      } catch (err: any) {
        console.error('Ошибка загрузки данных:', err);
        setError(err.message || 'Произошла ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [callId, session]);

  const deleteReview = async (reviewId: string) => {
    if (!call) return;

    try {
      setDeleting(reviewId);
      
      const response = await fetch(`/api/calls/${call.id}/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при удалении проверки');
      }

      const result = await response.json();
      
      toast.success(`Проверка удалена: ${result.deletedReview?.templateTitle || 'Проверка'}`);
      
      // Обновляем локально - убираем удаленную проверку
      setCall(prevCall => {
        if (!prevCall) return prevCall;
        return {
          ...prevCall,
          reviews: prevCall.reviews.filter(r => r.id !== reviewId)
        };
      });
    } catch (error: any) {
      console.error('Ошибка удаления проверки:', error);
      toast.error(error.message || 'Не удалось удалить проверку');
    } finally {
      setDeleting(null);
    }
  };

  const onSubmit = async (data: ReviewForm) => {
    if (!call || !selectedChecklist) return;

    try {
      setSending(true);
      
      console.log('🔍 DEBUG: Отправляем данные формы:', data);
      console.log('🔍 DEBUG: JSON.stringify(data):', JSON.stringify(data));
      
      const response = await fetch(`/api/calls/${call.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(toastMessages.sentToN8n);
        
        // Добавляем новую проверку локально (если есть в ответе)
        if (result.review) {
          setCall(prevCall => {
            if (!prevCall) return prevCall;
            return {
              ...prevCall,
              reviews: [...prevCall.reviews, result.review]
            };
          });
        }
        
        // Очищаем форму
        setValue('templateId', '');
        setValue('commentText', '');
      } else {
        toast.error(result.message || toastMessages.failedToSend);
      }
    } catch (error) {
      console.error('Ошибка отправки:', error);
      toast.error(toastMessages.failedToSend);
    } finally {
      setSending(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'SENT':
        return <Send className="h-4 w-4 text-blue-600" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'SENT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canSendToN8n = session?.user?.role && ['OCC_MANAGER', 'ADMINISTRATOR'].includes(session.user.role);
  
  const canDeleteReview = (review: Call['reviews'][0]) => {
    if (!session?.user) return false;
    
    const userRole = session.user.role;
    const userId = session.user.id;
    
    // Администраторы и OCC_MANAGER могут удалять любые проверки
    if (['ADMINISTRATOR', 'OCC_MANAGER'].includes(userRole)) {
      return true;
    }
    
    // Пользователь может удалить только свою проверку
    return review.requestedBy?.id === userId;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !call) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Ошибка
            </CardTitle>
            <CardDescription>{error || 'Звонок не найден'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/calls">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Вернуться к списку
                </Link>
              </Button>
              <Button onClick={() => window.location.reload()}>
                Попробовать снова
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="space-y-6">
        {/* Хлебные крошки и заголовок */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/calls">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {uiText.nav.calls}
              </Link>
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{call.id}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Кнопка обновления */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshCallData}
              disabled={refreshing}
              title="Обновить данные"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            
            {/* Действия со звонком */}
            <CallActions call={call} onDeleteSuccess={() => router.push('/calls')} />
          </div>
        </div>

        {/* Основная информация о звонке */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              {uiText.calls.callDetails}
            </CardTitle>
            <CardDescription>
              Детальная информация о звонке {call.id}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{uiText.calls.tableHeaders.id}</div>
                  <div className="text-sm text-muted-foreground font-mono">{call.id}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{uiText.calls.tableHeaders.deal}</div>
                  <div className="text-sm text-muted-foreground">{call.dealId}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{uiText.calls.tableHeaders.created}</div>
                  <div className="text-sm text-muted-foreground">{dt(call.createdAt)}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{uiText.calls.tableHeaders.employee}</div>
                  <div className="text-sm text-muted-foreground">{call.employeeName}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{uiText.calls.tableHeaders.manager}</div>
                  <div className="text-sm text-muted-foreground">{call.managerName}</div>
                </div>
              </div>
              
              {call.payload.duration && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Длительность</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDuration(call.payload.duration)}
                    </div>
                  </div>
                </div>
              )}
              
              {call.initiatedBy && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Инициатор Б24</div>
                    <div className="text-sm text-muted-foreground">{call.initiatedBy}</div>
                  </div>
                </div>
              )}
            </div>

            {call.payload.phoneNumber && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium mb-1">Номер телефона</div>
                <div className="text-sm text-muted-foreground">{call.payload.phoneNumber}</div>
              </div>
            )}


            {call.payload.notes && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium mb-1">Заметки</div>
                <div className="text-sm text-muted-foreground">{call.payload.notes}</div>
              </div>
            )}

            {call.callText && call.callText.trim() && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Текст звонка (расшифровка)
                </div>
                <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded border max-h-80 overflow-y-auto whitespace-pre-wrap">
                  {call.callText}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* История проверок */}
        {call.reviews && call.reviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                История проверок
              </CardTitle>
              <CardDescription>
                Предыдущие проверки этого звонка
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {call.reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(review.status)}
                        <Badge className={getStatusColor(review.status)}>
                          {uiText.status[review.status as keyof typeof uiText.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">
                          {dt(review.createdAt)}
                        </div>
                        {canDeleteReview(review) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                disabled={deleting === review.id}
                              >
                                {deleting === review.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{uiText.calls.confirmDeleteReview}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {uiText.calls.confirmDeleteReviewText}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{uiText.common.cancel}</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteReview(review.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {uiText.calls.deleteReview}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm font-medium mb-1">
                      Чек-лист: {review.template.title}
                    </div>
                    
                    {review.requestedBy && (
                      <div className="text-sm text-muted-foreground mb-2">
                        Запросил: {review.requestedBy.name}
                      </div>
                    )}
                    
                    {!review.requestedBy && (
                      <div className="text-sm text-muted-foreground mb-2">
                        Автоматическая проверка
                      </div>
                    )}
                    
                    {review.commentText && (
                      <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded mb-3">
                        <MessageSquare className="h-3 w-3 inline mr-1" />
                        {review.commentText}
                      </div>
                    )}
                    
                    {/* Отображение результатов анализа */}
                    {review.analysisResults && (
                      <div className="mt-4">
                        <AnalysisResults 
                          results={review.analysisResults}
                          reviewId={review.id}
                          templateTitle={review.template.title}
                          completedAt={review.completedAt}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Форма отправки в n8n */}
        {canSendToN8n && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                {uiText.calls.sendToN8n}
              </CardTitle>
              <CardDescription>
                Выберите чек-лист и отправьте результат проверки в n8n
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {uiText.calls.selectChecklist}
                  </label>
                  <Select 
                    value={watchedTemplateId || ''} 
                    onValueChange={(value) => setValue('templateId', value)}
                  >
                    <SelectTrigger className={errors.templateId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Выберите чек-лист..." />
                    </SelectTrigger>
                    <SelectContent>
                      {checklists.map((checklist) => (
                        <SelectItem key={checklist.id} value={checklist.id}>
                          <div>
                            <div className="font-medium">{checklist.name}</div>
                            {checklist.description && (
                              <div className="text-sm text-muted-foreground">{checklist.description}</div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.templateId && (
                    <p className="text-sm text-red-600 mt-1">{errors.templateId.message}</p>
                  )}
                </div>

                {selectedChecklist && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium mb-2">Элементы чек-листа:</h4>
                    <ul className="space-y-1">
                      {selectedChecklist.items
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((item, index) => (
                        <li key={item.id} className="text-sm border-l-2 border-blue-200 pl-3 py-2">
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground min-w-[1.5rem] mt-0.5">{index + 1}.</span>
                            <div className="flex-1">
                              <div className="font-medium">{item.text}</div>
                              {item.description && (
                                <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                              )}
                            </div>
                            <Badge variant="secondary" className="ml-auto text-xs">
                              вес: {item.weight}
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {uiText.calls.comment}
                  </label>
                  <textarea
                    {...register('commentText')}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                    placeholder="Дополнительные комментарии (необязательно)..."
                  />
                </div>

                <Button type="submit" disabled={sending || !selectedChecklist} className="w-full">
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Отправляется...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {uiText.calls.sendToN8n}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
