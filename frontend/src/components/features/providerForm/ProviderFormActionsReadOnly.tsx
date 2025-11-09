import { ArrowLeft, Trash2, Power, PowerOff, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { TOOLTIP_LABELS } from '@/constants/providerForm.constants';

interface ProviderFormActionsReadOnlyProps {
  loading: boolean;
  enabled: boolean;
  handleBack: () => void;
  handleToggleEnabled: () => void;
  handleEdit: () => void;
  handleDelete: () => void;
}

export function ProviderFormActionsReadOnly({
  loading,
  enabled,
  handleBack,
  handleToggleEnabled,
  handleEdit,
  handleDelete
}: ProviderFormActionsReadOnlyProps) {
  return (
    <TooltipProvider>
      <div className="flex gap-2">
        <Tooltip content={TOOLTIP_LABELS.BACK}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label={TOOLTIP_LABELS.BACK}
          >
            <ArrowLeft className="icon-sm" />
          </Button>
        </Tooltip>
        <Tooltip content={enabled ? TOOLTIP_LABELS.TOGGLE_DISABLE : TOOLTIP_LABELS.TOGGLE_ENABLE}>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleToggleEnabled}
            disabled={loading}
            aria-label={enabled ? TOOLTIP_LABELS.TOGGLE_DISABLE : TOOLTIP_LABELS.TOGGLE_ENABLE}
          >
            {enabled ? <PowerOff className="icon-sm" /> : <Power className="icon-sm" />}
          </Button>
        </Tooltip>
        <Tooltip content={TOOLTIP_LABELS.EDIT}>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleEdit}
            aria-label={TOOLTIP_LABELS.EDIT}
          >
            <Edit className="icon-sm" />
          </Button>
        </Tooltip>
        <Tooltip content={TOOLTIP_LABELS.DELETE}>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={handleDelete}
            disabled={loading}
            aria-label={TOOLTIP_LABELS.DELETE}
          >
            <Trash2 className="icon-sm" />
          </Button>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
