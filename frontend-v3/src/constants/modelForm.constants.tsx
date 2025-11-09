import { motion } from 'framer-motion';
import { ArrowLeft, Database, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { modelsService } from '@/services/models.service';
import type { ModelDetails } from '@/types/models.types';

// Tab configuration
export const MODEL_FORM_TABS = {
  DETAILS: {
    value: 'details',
    label: 'Model Details'
  }
} as const;

// Page constants
export const MODEL_FORM_TITLE = 'Model Information';
export const MODEL_FORM_ICON = Database;

// Field labels
export const FIELD_LABELS = {
  MODEL_ID: 'Model ID',
  MODEL_ID_DESC: 'Unique identifier for this model',

  MODEL_NAME: 'Model Name',
  MODEL_NAME_DESC: 'Display name for this model',

  DESCRIPTION: 'Description',
  DESCRIPTION_DESC: 'Model description and details',

  CAPABILITIES: 'Capabilities',
  CAPABILITIES_DESC: 'Model capabilities and features',

  STATUS: 'Status',
  STATUS_DESC: 'Current model status',

  LINKED_PROVIDERS_TITLE: 'Linked Providers',
  METADATA_TITLE: 'Metadata',

  CREATED: 'Created',
  CREATED_DESC: 'Model creation timestamp',

  LAST_UPDATED: 'Last Updated',
  LAST_UPDATED_DESC: 'Last modification timestamp'
} as const;

// Tooltip labels
export const TOOLTIP_LABELS = {
  BACK: 'Back to models list',
  SET_DEFAULT: 'Set as default model for linked providers'
} as const;

// Helper functions
export const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const parseCapabilities = (capabilitiesStr: string) => {
  try {
    return JSON.parse(capabilitiesStr);
  } catch {
    return [];
  }
};

// Builder function for form content
export const buildModelFormContent = (model: ModelDetails) => {
  const capabilities = parseCapabilities(model.capabilities);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="vspace-md p-4"
    >
      {/* Model ID */}
      <div className="flex-row-between">
        <div className="vspace-tight">
          <div className="text-setting-label">{FIELD_LABELS.MODEL_ID}</div>
          <div className="text-setting-description">{FIELD_LABELS.MODEL_ID_DESC}</div>
        </div>
        <Input
          value={model.id}
          disabled
          className="flex-1 max-w-md"
          aria-label={FIELD_LABELS.MODEL_ID}
        />
      </div>

      <div className="divider-horizontal" />

      {/* Model Name */}
      <div className="flex-row-between">
        <div className="vspace-tight">
          <div className="text-setting-label">{FIELD_LABELS.MODEL_NAME}</div>
          <div className="text-setting-description">{FIELD_LABELS.MODEL_NAME_DESC}</div>
        </div>
        <Input
          value={model.name}
          disabled
          className="flex-1 max-w-md"
          aria-label={FIELD_LABELS.MODEL_NAME}
        />
      </div>

      <div className="divider-horizontal" />

      {/* Description */}
      {model.description && (
        <>
          <div className="flex-row-between">
            <div className="vspace-tight">
              <div className="text-setting-label">{FIELD_LABELS.DESCRIPTION}</div>
              <div className="text-setting-description">{FIELD_LABELS.DESCRIPTION_DESC}</div>
            </div>
            <Input
              value={model.description}
              disabled
              className="flex-1 max-w-md"
              aria-label={FIELD_LABELS.DESCRIPTION}
            />
          </div>
          <div className="divider-horizontal" />
        </>
      )}

      {/* Capabilities */}
      <div className="flex-row-between">
        <div className="vspace-tight">
          <div className="text-setting-label">{FIELD_LABELS.CAPABILITIES}</div>
          <div className="text-setting-description">{FIELD_LABELS.CAPABILITIES_DESC}</div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end flex-1 max-w-md">
          {capabilities.length > 0 ? (
            capabilities.map((cap: string) => {
              const display = modelsService.getCapabilityDisplay(cap as any);
              return display ? (
                <Badge key={cap} variant="default" className="min-w-[80px] justify-center">
                  {display.label}
                </Badge>
              ) : null;
            })
          ) : (
            <span className="text-sm text-muted-foreground">No capabilities specified</span>
          )}
        </div>
      </div>

      <div className="divider-horizontal" />

      {/* Status */}
      <div className="flex-row-between">
        <div className="vspace-tight">
          <div className="text-setting-label">{FIELD_LABELS.STATUS}</div>
          <div className="text-setting-description">{FIELD_LABELS.STATUS_DESC}</div>
        </div>
        <Badge variant={model.status === 'active' ? 'default' : 'secondary'} className="min-w-[100px] justify-center">
          {model.status}
        </Badge>
      </div>

      {/* Linked Providers */}
      {model.providers && model.providers.length > 0 && (
        <>
          <div className="divider-horizontal" />
          <div className="vspace-tight mb-4">
            <div className="text-lg font-semibold">
              {FIELD_LABELS.LINKED_PROVIDERS_TITLE} ({model.providers.length})
            </div>
          </div>
          <div className="space-y-2">
            {model.providers.map((provider) => (
              <div
                key={provider.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex-1">
                  <div className="font-medium">{provider.name}</div>
                  <div className="text-sm text-muted-foreground">{provider.type}</div>
                </div>
                <div className="flex gap-2 items-center">
                  {provider.is_default && (
                    <Badge variant="default">Default</Badge>
                  )}
                  <Badge variant={provider.enabled ? 'default' : 'secondary'}>
                    {provider.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Metadata */}
      <div className="divider-horizontal" />
      <div className="vspace-tight mb-4">
        <div className="text-lg font-semibold">{FIELD_LABELS.METADATA_TITLE}</div>
      </div>

      <div className="flex-row-between">
        <div className="vspace-tight">
          <div className="text-setting-label">{FIELD_LABELS.CREATED}</div>
          <div className="text-setting-description">{FIELD_LABELS.CREATED_DESC}</div>
        </div>
        <Input
          value={formatDate(model.created_at)}
          disabled
          className="flex-1 max-w-md"
          aria-label={FIELD_LABELS.CREATED}
        />
      </div>

      <div className="divider-horizontal" />

      <div className="flex-row-between">
        <div className="vspace-tight">
          <div className="text-setting-label">{FIELD_LABELS.LAST_UPDATED}</div>
          <div className="text-setting-description">{FIELD_LABELS.LAST_UPDATED_DESC}</div>
        </div>
        <Input
          value={formatDate(model.updated_at)}
          disabled
          className="flex-1 max-w-md"
          aria-label={FIELD_LABELS.LAST_UPDATED}
        />
      </div>
    </motion.div>
  );
};

// Builder function for actions
export const buildModelFormActions = (params: {
  model: ModelDetails;
  settingDefault: boolean;
  handleBack: () => void;
  handleSetAsDefault: () => void;
}) => {
  const { model, settingDefault, handleBack, handleSetAsDefault } = params;

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
        {model && model.providers && model.providers.length > 0 && (
          <Tooltip content={TOOLTIP_LABELS.SET_DEFAULT}>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleSetAsDefault}
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
};
