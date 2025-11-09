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
        {/* Provider ID */}
        <div className="flex-row-between">
          <div className="vspace-tight">
            <div className="text-setting-label">
              {FIELD_LABELS.ID} <span className="text-destructive" aria-hidden="true">*</span>
            </div>
            <div id="id-description" className="text-setting-description">
              {FIELD_LABELS.ID_DESC}
            </div>
          </div>
          <Input
            id="id"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
            placeholder={FIELD_LABELS.ID_PLACEHOLDER}
            disabled={isEditMode || readOnly}
            required
            aria-label={FIELD_LABELS.ID}
            aria-describedby="id-description"
            aria-required="true"
            className="flex-1 max-w-md"
          />
        </div>

        <div className="divider-horizontal" />

        {/* Display Name */}
        <div className="flex-row-between">
          <div className="vspace-tight">
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
        <div className="flex-row-between">
          <div className="vspace-tight">
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
        <div className="flex-row-between">
          <div className="vspace-tight">
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

        {/* Priority */}
        <div className="flex-row-between">
          <div className="vspace-tight">
            <div className="text-setting-label">{FIELD_LABELS.PRIORITY}</div>
            <div className="text-setting-description">
              {FIELD_LABELS.PRIORITY_DESC}
            </div>
          </div>
          <Input
            id="priority"
            type="number"
            min="0"
            step="1"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
            disabled={readOnly}
            className="w-32"
          />
        </div>

        <div className="divider-horizontal" />

        {/* Enabled */}
        <div className="flex-row-between">
          <div className="vspace-tight">
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
          <div className="flex-row-between">
            <div className="vspace-tight">
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

          {/* timeout */}
          <div className="flex-row-between">
            <div className="vspace-tight">
              <div className="text-setting-label">{FIELD_LABELS.TIMEOUT}</div>
              <div className="text-setting-description">{FIELD_LABELS.TIMEOUT_DESC}</div>
            </div>
            <Input
              id="config-timeout"
              type="number"
              min="0"
              step="1000"
              value={formData.config.timeout || ''}
              onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value) || 0)}
              placeholder={FIELD_LABELS.TIMEOUT_PLACEHOLDER}
              disabled={readOnly}
              className="w-32"
            />
          </div>

          <div className="divider-horizontal" />

          {/* defaultModel */}
          <div className="flex-row-between">
            <div className="vspace-tight">
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
          <div className="flex-row-between">
            <div className="vspace-tight">
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

          <div className="divider-horizontal" />

          {/* token */}
          <div className="flex-row-between">
            <div className="vspace-tight">
              <div className="text-setting-label">{FIELD_LABELS.TOKEN}</div>
              <div className="text-setting-description">{FIELD_LABELS.TOKEN_DESC}</div>
            </div>
            <Input
              id="config-token"
              type="password"
              value={formData.config.token || ''}
              onChange={(e) => handleConfigChange('token', e.target.value)}
              placeholder={FIELD_LABELS.TOKEN_PLACEHOLDER}
              disabled={readOnly}
              className="flex-1 max-w-md"
            />
          </div>

          <div className="divider-horizontal" />

          {/* cookies */}
          <div className="flex-row-between">
            <div className="vspace-tight">
              <div className="text-setting-label">{FIELD_LABELS.COOKIES}</div>
              <div className="text-setting-description">{FIELD_LABELS.COOKIES_DESC}</div>
            </div>
            <Input
              id="config-cookies"
              value={formData.config.cookies || ''}
              onChange={(e) => handleConfigChange('cookies', e.target.value)}
              placeholder={FIELD_LABELS.COOKIES_PLACEHOLDER}
              disabled={readOnly}
              className="flex-1 max-w-md"
            />
          </div>

          <div className="divider-horizontal" />

          {/* expiresAt */}
          <div className="flex-row-between">
            <div className="vspace-tight">
              <div className="text-setting-label">{FIELD_LABELS.EXPIRES_AT}</div>
              <div className="text-setting-description">{FIELD_LABELS.EXPIRES_AT_DESC}</div>
            </div>
            <Input
              id="config-expiresAt"
              type="number"
              min="0"
              step="1"
              value={formData.config.expiresAt || ''}
              onChange={(e) => handleConfigChange('expiresAt', parseInt(e.target.value) || 0)}
              placeholder={FIELD_LABELS.EXPIRES_AT_PLACEHOLDER}
              disabled={readOnly}
              className="w-32"
            />
          </div>
        </>
      </div>
    </form>
  );
}
