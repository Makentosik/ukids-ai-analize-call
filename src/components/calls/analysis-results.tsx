'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  FileText,
  Target,
  Lightbulb,
  BarChart3
} from 'lucide-react';
import { dt } from '@/lib/locale';

export type AnalysisResults = {
  ok: boolean;
  checklist?: Array<{
    step: string;
    description?: string;
    evaluationType?: 'SCALE_1_10' | 'YES_NO';
    done?: boolean;
    score?: number;
    evidence?: string;
  }>;
  triggers?: string[];
  recommendations?: string[];
  stats?: {
    total: number;
    done: number;
    notDone: number;
    unknown: number;
  };
  markdown?: string;
  original?: {
    id: string;
    results: Array<{
      step: string;
      description?: string;
      evaluationType?: 'SCALE_1_10' | 'YES_NO';
      done?: boolean;
      score?: number;
      evidence?: string;
    }>;
    summary?: string;
  };
  processedAt?: string;
};

interface AnalysisResultsProps {
  results: AnalysisResults;
  reviewId: string;
  templateTitle: string;
  completedAt?: string;
}

export default function AnalysisResults({ 
  results, 
  reviewId, 
  templateTitle,
  completedAt 
}: AnalysisResultsProps) {
  const { ok, checklist, triggers, recommendations, stats, markdown, original } = results;
  
  // Используем checklist из original.results если доступно, иначе из checklist
  const checklistData = original?.results || checklist || [];
  
  const getStepIcon = (item: any) => {
    if (item.evaluationType === 'SCALE_1_10') {
      const score = item.score;
      if (score >= 7) {
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      } else if (score >= 4) {
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      } else {
        return <XCircle className="h-5 w-5 text-red-600" />;
      }
    }
    
    // YES_NO type
    return item.done ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };
  
  const getStepBadge = (item: any) => {
    if (item.evaluationType === 'SCALE_1_10') {
      const score = item.score;
      const getScoreColor = () => {
        if (score >= 9) return 'bg-green-600';
        if (score >= 7) return 'bg-green-500';
        if (score >= 4) return 'bg-yellow-500';
        return 'bg-red-500';
      };
      
      const getScoreText = () => {
        if (score >= 9) return 'Отлично';
        if (score >= 7) return 'Хорошо';
        if (score >= 4) return 'Удовлетворительно';
        return 'Плохо';
      };
      
      return (
        <div className="flex items-center gap-2">
          <Badge 
            className={`text-white text-xs ${getScoreColor()}`}
          >
            {score}/10
          </Badge>
          <span className="text-xs text-muted-foreground">
            {getScoreText()}
          </span>
        </div>
      );
    }
    
    // YES_NO type
    return (
      <Badge variant={item.done ? "default" : "destructive"} className="text-xs">
        {item.done ? "Выполнено" : "Не выполнено"}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Результаты анализа
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={ok ? "default" : "destructive"}>
              {ok ? "Успешно" : "Есть проблемы"}
            </Badge>
            {completedAt && (
              <span className="text-sm text-muted-foreground">
                {dt(completedAt)}
              </span>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Анализ по чек-листу: <strong>{templateTitle}</strong>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Статистика */}
        {(() => {
          // Пересчитываем статистику с учетом типов оценки
          const calculatedStats = checklistData.reduce((acc, item) => {
            acc.total++;
            if (item.evaluationType === 'SCALE_1_10') {
              if (item.score >= 7) acc.done++;
              else if (item.score >= 4) acc.partial++;
              else if (item.score >= 1) acc.notDone++;
              else acc.unknown++;
            } else {
              if (item.done === true) acc.done++;
              else if (item.done === false) acc.notDone++;
              else acc.unknown++;
            }
            return acc;
          }, { total: 0, done: 0, notDone: 0, partial: 0, unknown: 0 });
          
          const displayStats = stats && stats.total > 0 ? stats : calculatedStats;
          
          return displayStats.total > 0 ? (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{displayStats.total}</div>
                  <div className="text-sm text-gray-600">Всего пунктов</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{displayStats.done}</div>
                  <div className="text-sm text-gray-600">Хорошо/Выполнено</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{displayStats.notDone}</div>
                  <div className="text-sm text-gray-600">Плохо/Не выполнено</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{displayStats.partial || displayStats.unknown}</div>
                  <div className="text-sm text-gray-600">Частично/Неизвестно</div>
                </div>
              </div>
              
              {/* Средняя оценка по шкале */}
              {(() => {
                const scaleItems = checklistData.filter(item => item.evaluationType === 'SCALE_1_10' && typeof item.score === 'number');
                if (scaleItems.length > 0) {
                  const averageScore = scaleItems.reduce((sum, item) => sum + item.score, 0) / scaleItems.length;
                  return (
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{averageScore.toFixed(1)}/10</div>
                      <div className="text-sm text-gray-600">Средняя оценка по шкале</div>
                    </div>
                  );
                }
                return null;
              })()
              }
            </div>
          ) : null;
        })()}

        {/* Чек-лист */}
        {checklistData && checklistData.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Проверка по пунктам</h3>
            </div>
            <div className="space-y-3">
              {checklistData.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {getStepIcon(item)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.step}</span>
                            {item.evaluationType && (
                              <Badge variant="outline" className="text-xs">
                                {item.evaluationType === 'SCALE_1_10' ? 'Шкала 1-10' : 'Да/Нет'}
                              </Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                        </div>
                        {getStepBadge(item)}
                      </div>
                      {item.evidence && (
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <div className="font-medium text-gray-700 mb-1">Подтверждение:</div>
                          <div className="text-gray-600 italic">"{item.evidence}"</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Триггеры */}
        {triggers && triggers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold">Выявленные проблемы</h3>
            </div>
            <div className="space-y-2">
              {triggers.map((trigger, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                  <span className="text-orange-800">{trigger}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Рекомендации */}
        {recommendations && recommendations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Рекомендации</h3>
            </div>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Lightbulb className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-blue-800">{recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Резюме */}
        {original?.summary && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Общее резюме</h3>
            </div>
            <div className="p-4 bg-gray-50 border rounded-lg">
              <p className="text-gray-700">{original.summary}</p>
            </div>
          </div>
        )}

        {/* Markdown отчет (скрытый по умолчанию, можно раскрыть) */}
        {markdown && (
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-lg font-semibold hover:text-primary">
              <FileText className="h-5 w-5" />
              <span>Подробный отчет</span>
              <span className="text-sm text-muted-foreground ml-auto group-open:hidden">
                Нажмите для раскрытия
              </span>
            </summary>
            <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                {markdown}
              </pre>
            </div>
          </details>
        )}

        {/* Техническая информация */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>ID проверки: {reviewId}</span>
            {results.processedAt && (
              <span>Обработано: {dt(results.processedAt)}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
