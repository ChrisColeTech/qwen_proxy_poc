import { ArrowLeft, Save, TestTube, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { TOOLTIP_LABELS } from '@/constants/providerForm.constants';

interface ProviderFormActionsEditProps {
  loading: boolean;
  testing: boolean;
  isEditMode: boolean;
  handleBack: () => void;
  handleReset: () => void;
  handleTest: () => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export function ProviderFormActionsEdit({
  loading,
  testing,
  isEditMode,
  handleBack,
  handleReset,
  handleTest,
  handleSubmit
}: ProviderFormActionsEditProps) {
  return (
    <TooltipProvider>
      <div className="flex gap-2">
        <Tooltip content={TOOLTIP_LABELS.CANCEL}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label={TOOLTIP_LABELS.CANCEL}
          >
            <ArrowLeft className="icon-sm" />
          </Button>
        </Tooltip>
        <Tooltip content={TOOLTIP_LABELS.RESET}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleReset}
            aria-label={TOOLTIP_LABELS.RESET}
          >
            <RotateCcw className="icon-sm" />
          </Button>
        </Tooltip>
        {isEditMode && (
          <Tooltip content={testing ? TOOLTIP_LABELS.TEST_LOADING : TOOLTIP_LABELS.TEST}>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleTest}
              disabled={testing}
              aria-label={TOOLTIP_LABELS.TEST}
            >
              <TestTube className="icon-sm" />
            </Button>
          </Tooltip>
        )}
        <Tooltip content={loading ? TOOLTIP_LABELS.SAVE_LOADING : (isEditMode ? TOOLTIP_LABELS.SAVE_EDIT : TOOLTIP_LABELS.SAVE_CREATE)}>
          <Button
            type="submit"
            size="icon"
            variant="outline"
            disabled={loading}
            onClick={handleSubmit}
            aria-label={isEditMode ? TOOLTIP_LABELS.SAVE_EDIT : TOOLTIP_LABELS.SAVE_CREATE}
          >
            <Save className="icon-sm" />
          </Button>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
