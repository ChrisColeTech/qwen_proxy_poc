import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { FIELD_LABELS } from '@/constants/providerForm.constants';

interface ProviderFormContentProps {
  formData: {
    id: string;
    name: string;
    type: string;
    enabled: boolean;
    priority: number;
    description: string;
    config: Record<string, any>;
  };
  isEditMode: boolean;
  readOnly: boolean;
  setFormData: (data: any) => void;
  handleConfigChange: (key: string, value: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export function ProviderFormContent({
  formData,
  isEditMode,
  readOnly,
  setFormData,
  handleConfigChange,
  handleSubmit
}: ProviderFormContentProps) {
  return (
    <form onSubmit={handleSubmit}>
      <div className="vspace-md p-4">
        {/* Display Name */}
        <div className="flex-row-between gap-4">
          <div className="vspace-tight flex-1">
            <div className="text-setting-label">
              {FIELD_LABELS.NAME} <span className="text-destructive" aria-hidden="true">*</span>
            </div>
            <div id="name-description" className="text-setting-description">
              {FIELD_LABELS.NAME_DESC}
            </div>
          </div>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={FIELD_LABELS.NAME_PLACEHOLDER}
            disabled={readOnly}
            required
            aria-label={FIELD_LABELS.NAME}
            aria-describedby="name-description"
            aria-required="true"
            className="flex-1 max-w-md"
          />
        </div>

        <div className="divider-horizontal" />

        {/* Provider Type */}
        <div className="flex-row-between gap-4">
          <div className="vspace-tight flex-1">
            <div className="text-setting-label">
              {FIELD_LABELS.TYPE} <span className="text-destructive" aria-hidden="true">*</span>
            </div>
            <div id="type-description" className="text-setting-description">
              {FIELD_LABELS.TYPE_DESC}
            </div>
          </div>
          <Input
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            placeholder={FIELD_LABELS.TYPE_PLACEHOLDER}
            disabled={isEditMode || readOnly}
            required
            aria-label={FIELD_LABELS.TYPE}
            aria-describedby="type-description"
            aria-required="true"
            className="flex-1 max-w-md"
          />
        </div>

        <div className="divider-horizontal" />

        {/* Description */}
        <div className="flex-row-between gap-4">
          <div className="vspace-tight flex-1">
            <div className="text-setting-label">{FIELD_LABELS.DESCRIPTION}</div>
            <div className="text-setting-description">
              {FIELD_LABELS.DESCRIPTION_DESC}
            </div>
          </div>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={FIELD_LABELS.DESCRIPTION_PLACEHOLDER}
            disabled={readOnly}
            className="flex-1 max-w-md"
          />
        </div>

        <div className="divider-horizontal" />

        {/* Enabled */}
        <div className="flex-row-between gap-4">
          <div className="vspace-tight flex-1">
            <div className="text-setting-label">{FIELD_LABELS.ENABLED}</div>
            <div id="enabled-description" className="text-setting-description">
              {FIELD_LABELS.ENABLED_DESC}
            </div>
          </div>
          <Switch
            id="enabled"
            checked={formData.enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            disabled={readOnly}
            aria-label="Enable or disable provider"
            aria-describedby="enabled-description"
          />
        </div>

        {/* Configuration */}
        <>
          <div className="divider-horizontal" />
          <div className="text-lg font-semibold mb-4">{FIELD_LABELS.CONFIG_TITLE}</div>

          {/* baseURL */}
          <div className="flex-row-between gap-4">
            <div className="vspace-tight flex-1">
              <div className="text-setting-label">{FIELD_LABELS.BASE_URL}</div>
              <div className="text-setting-description">{FIELD_LABELS.BASE_URL_DESC}</div>
            </div>
            <Input
              id="config-baseURL"
              type="text"
              value={formData.config.baseURL || ''}
              onChange={(e) => handleConfigChange('baseURL', e.target.value)}
              placeholder={FIELD_LABELS.BASE_URL_PLACEHOLDER}
              disabled={readOnly}
              className="flex-1 max-w-md"
            />
          </div>

          <div className="divider-horizontal" />

          {/* defaultModel */}
          <div className="flex-row-between gap-4">
            <div className="vspace-tight flex-1">
              <div className="text-setting-label">{FIELD_LABELS.DEFAULT_MODEL}</div>
              <div className="text-setting-description">{FIELD_LABELS.DEFAULT_MODEL_DESC}</div>
            </div>
            <Input
              id="config-defaultModel"
              type="text"
              value={formData.config.defaultModel || ''}
              onChange={(e) => handleConfigChange('defaultModel', e.target.value)}
              placeholder={FIELD_LABELS.DEFAULT_MODEL_PLACEHOLDER}
              disabled={readOnly}
              className="flex-1 max-w-md"
            />
          </div>

          <div className="divider-horizontal" />

          {/* apiKey */}
          <div className="flex-row-between gap-4">
            <div className="vspace-tight flex-1">
              <div className="text-setting-label">{FIELD_LABELS.API_KEY}</div>
              <div className="text-setting-description">{FIELD_LABELS.API_KEY_DESC}</div>
            </div>
            <Input
              id="config-apiKey"
              type="password"
              value={formData.config.apiKey || ''}
              onChange={(e) => handleConfigChange('apiKey', e.target.value)}
              placeholder={FIELD_LABELS.API_KEY_PLACEHOLDER}
              disabled={readOnly}
              className="flex-1 max-w-md"
            />
          </div>

        </>
      </div>
    </form>
  );
}
