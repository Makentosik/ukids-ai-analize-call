'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import EvaluationInput, { EvaluationValue } from '@/components/checklists/evaluation-input';

// Пример данных для демонстрации
const sampleItems = [
  {
    id: '1',
    title: 'Поздоровался с клиентом',
    description: 'Менеджер вежливо поздоровался с клиентом в начале разговора. Примеры: "Доброе утро!", "Здравствуйте!", "Добрый день!"',
    evaluationType: 'YES_NO' as const,
  },
  {
    id: '2',
    title: 'Представился и назвал компанию',
    description: 'Менеджер назвал свое имя и компанию, которую представляет. Пример: "Меня зовут Анна, я из Академии Ukids"',
    evaluationType: 'YES_NO' as const,
  },
  {
    id: '3',
    title: 'Выяснил потребность клиента',
    description: 'Менеджер задал вопросы, чтобы понять, что нужно клиенту, какие у него сложности и цели. Пример: "Скажите, какие сложности у ребёнка?"',
    evaluationType: 'SCALE_1_10' as const,
  },
  {
    id: '4',
    title: 'Предложил подходящий продукт/услугу',
    description: 'На основании потребности клиента менеджер предложил конкретные услуги или программы, объяснил их преимущества',
    evaluationType: 'SCALE_1_10' as const,
  },
  {
    id: '5',
    title: 'Ответил на все вопросы клиента',
    description: 'Менеджер терпеливо и полно ответил на все вопросы клиента, не оставил ниодного без внимания',
    evaluationType: 'SCALE_1_10' as const,
  },
  {
    id: '6',
    title: 'Договорился о следующих шагах',
    description: 'Менеджер обозначил конкретные дальнейшие действия: когда состоится встреча, пробное занятие, консультация или другие мероприятия',
    evaluationType: 'YES_NO' as const,
  },
  {
    id: '7',
    title: 'Поблагодарил за время',
    description: 'Менеджер вежливо поблагодарил клиента за время, уделённое разговору, и красиво завершил беседу',
    evaluationType: 'YES_NO' as const,
  },
];

export default function ChecklistEvaluationDemo() {
  const [evaluations, setEvaluations] = useState<Record<string, EvaluationValue>>({});

  const handleEvaluationChange = (itemId: string, value: EvaluationValue) => {
    setEvaluations(prev => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const calculateSummary = () => {
    let totalYesNo = 0;
    let yesCount = 0;
    let totalScale = 0;
    let scaleSum = 0;
    let scaleCount = 0;

    sampleItems.forEach(item => {
      const evaluation = evaluations[item.id];
      if (evaluation !== null && evaluation !== undefined) {
        if (item.evaluationType === 'YES_NO') {
          totalYesNo++;
          if (evaluation === true) yesCount++;
        } else if (item.evaluationType === 'SCALE_1_10' && typeof evaluation === 'number') {
          totalScale++;
          scaleSum += evaluation;
          scaleCount++;
        }
      }
    });

    const yesNoPercentage = totalYesNo > 0 ? Math.round((yesCount / totalYesNo) * 100) : 0;
    const scaleAverage = scaleCount > 0 ? Math.round((scaleSum / scaleCount) * 10) / 10 : 0;

    return { yesNoPercentage, scaleAverage, totalEvaluated: Object.keys(evaluations).length };
  };

  const summary = calculateSummary();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Демо: Оценка элементов чек-листа
        </h1>
        <p className="text-muted-foreground mt-2">
          Пример интерфейса оценки с двумя типами измерений: шкала 1-10 и Да/Нет
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Evaluation Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Базовая оценка звонка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {sampleItems.map((item, index) => (
                <div key={item.id}>
                  {index > 0 && <Separator className="mb-6" />}
                  <EvaluationInput
                    evaluationType={item.evaluationType}
                    value={evaluations[item.id]}
                    onChange={(value) => handleEvaluationChange(item.id, value)}
                    itemTitle={`${index + 1}. ${item.title}`}
                    itemDescription={item.description}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Сводка по оценке</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Общий прогресс</div>
                <div className="text-2xl font-bold">
                  {summary.totalEvaluated}/{sampleItems.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  элементов оценено
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium text-muted-foreground">Выполнение (Да/Нет)</div>
                <div className="text-2xl font-bold text-green-600">
                  {summary.yesNoPercentage}%
                </div>
                <div className="text-sm text-muted-foreground">
                  элементов выполнено
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium text-muted-foreground">Средняя оценка (1-10)</div>
                <div className="text-2xl font-bold text-blue-600">
                  {summary.scaleAverage}/10
                </div>
                <div className="text-sm text-muted-foreground">
                  по шкальным элементам
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Подробные оценки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sampleItems.map((item, index) => {
                const evaluation = evaluations[item.id];
                return (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="truncate mr-2">{index + 1}. {item.title}</span>
                    <div className="flex-shrink-0">
                      {evaluation === null || evaluation === undefined ? (
                        <span className="text-muted-foreground">—</span>
                      ) : item.evaluationType === 'YES_NO' ? (
                        <span className={evaluation ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {evaluation ? 'Да' : 'Нет'}
                        </span>
                      ) : (
                        <span className="font-medium">{evaluation}/10</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
