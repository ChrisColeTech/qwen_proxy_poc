import { ArrowLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import type { ModelDetails } from '@/types/models.types';
import { TOOLTIP_LABELS } from '@/constants/modelForm.constants';

interface ModelFormActionsProps {
  model: ModelDetails;
  settingDefault: boolean;
  onBack: () => void;
  onSetAsDefault: () => void;
}

export function ModelFormActions({ model, settingDefault, onBack, onSetAsDefault }: ModelFormActionsProps) {
  return (
    <TooltipProvider>
      <div className="flex gap-2">
        <Tooltip content={TOOLTIP_LABELS.BACK}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label={TOOLTIP_LABELS.BACK}
          >
            <ArrowLeft className="icon-sm" />
          </Button>
        </Tooltip>
        {model && model.providers && model.providers.length > 0 && (
          <Tooltip content={TOOLTIP_LABELS.SET_DEFAULT}>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onSetAsDefault}
              disabled={settingDefault}
              aria-label={TOOLTIP_LABELS.SET_DEFAULT}
            >
              <Star className="icon-sm" />
            </Button>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
