'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type EvaluationType = 'SCALE_1_10' | 'YES_NO';
export type EvaluationValue = number | boolean | null;

export type EvaluationInputProps = {
  evaluationType: EvaluationType;
  value?: EvaluationValue;
  onChange: (value: EvaluationValue) => void;
  disabled?: boolean;
  itemTitle: string;
  itemDescription?: string;
};

export default function EvaluationInput({
  evaluationType,
  value,
  onChange,
  disabled = false,
  itemTitle,
  itemDescription,
}: EvaluationInputProps) {
  const [tempValue, setTempValue] = useState<string>('');

  const handleScaleChange = (inputValue: string) => {
    setTempValue(inputValue);
    const numValue = parseInt(inputValue);
    if (inputValue === '' || isNaN(numValue)) {
      onChange(null);
    } else if (numValue >= 1 && numValue <= 10) {
      onChange(numValue);
    }
  };

  const handleQuickScaleSelect = (score: number) => {
    onChange(score);
    setTempValue(score.toString());
  };

  const handleYesNoChange = (boolValue: boolean) => {
    onChange(boolValue);
  };

  if (evaluationType === 'SCALE_1_10') {
    const scaleValue = typeof value === 'number' ? value : null;
    const inputValue = tempValue || (scaleValue?.toString() ?? '');

    return (
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">{itemTitle}</Label>
          {itemDescription && (
            <p className="text-xs text-muted-foreground mt-1">{itemDescription}</p>
          )}
        </div>
        
        <div className="space-y-3">
          {/* Быстрый выбор баллов */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Быстрый выбор:
            </Label>
            <div className="flex gap-1 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <Button
                  key={score}
                  type="button"
                  size="sm"
                  variant={scaleValue === score ? 'default' : 'outline'}
                  className="h-8 w-8 p-0 text-xs"
                  onClick={() => handleQuickScaleSelect(score)}
                  disabled={disabled}
                >
                  {score}
                </Button>
              ))}
            </div>
          </div>

          {/* Ручной ввод */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Или введите вручную (1-10):
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="10"
                value={inputValue}
                onChange={(e) => handleScaleChange(e.target.value)}
                disabled={disabled}
                className="w-20"
                placeholder="1-10"
              />
              {scaleValue !== null && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge 
                    variant={scaleValue >= 7 ? 'default' : scaleValue >= 4 ? 'secondary' : 'destructive'}
                  >
                    {scaleValue}/10
                  </Badge>
                  <span className="text-muted-foreground">
                    {scaleValue >= 8 ? 'Отлично' : 
                     scaleValue >= 6 ? 'Хорошо' : 
                     scaleValue >= 4 ? 'Удовлетворительно' : 'Плохо'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Подсказка */}
          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
            <strong>1 = Совсем не выполнил</strong> • 
            <strong> 10 = Полностью выполнил</strong>
          </div>
        </div>
      </div>
    );
  }

  if (evaluationType === 'YES_NO') {
    const boolValue = typeof value === 'boolean' ? value : null;

    return (
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">{itemTitle}</Label>
          {itemDescription && (
            <p className="text-xs text-muted-foreground mt-1">{itemDescription}</p>
          )}
        </div>
        
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Выберите оценку:
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={boolValue === true ? 'default' : 'outline'}
                className={cn(
                  "flex items-center gap-2 min-w-[100px]",
                  boolValue === true && "bg-green-600 hover:bg-green-700"
                )}
                onClick={() => handleYesNoChange(true)}
                disabled={disabled}
              >
                <CheckCircle2 className="h-4 w-4" />
                Выполнено
              </Button>
              <Button
                type="button"
                size="sm"
                variant={boolValue === false ? 'destructive' : 'outline'}
                className={cn(
                  "flex items-center gap-2 min-w-[120px]",
                  boolValue === false && "bg-red-600 hover:bg-red-700"
                )}
                onClick={() => handleYesNoChange(false)}
                disabled={disabled}
              >
                <XCircle className="h-4 w-4" />
                Не выполнено
              </Button>
            </div>
          </div>

          {/* Текущий выбор */}
          {boolValue !== null && (
            <div className="flex items-center gap-2">
              <Badge 
                variant={boolValue ? 'default' : 'destructive'}
                className={boolValue ? 'bg-green-600' : 'bg-red-600'}
              >
                {boolValue ? 'Выполнено' : 'Не выполнено'}
              </Badge>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
