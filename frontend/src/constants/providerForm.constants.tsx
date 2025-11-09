import { ArrowLeft, Save, TestTube, Settings, RotateCcw, Trash2, Power, PowerOff, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';

// Tab configuration
export const PROVIDER_FORM_TABS = {
  FORM: {
    value: 'form',
    label: 'Configuration'
  }
} as const;

// Page constants
export const PROVIDER_FORM_TITLE_EDIT = 'Edit Provider';
export const PROVIDER_FORM_TITLE_CREATE = 'Create Provider';
export const PROVIDER_FORM_ICON = Settings;

// Field labels and descriptions
export const FIELD_LABELS = {
  ID: 'Provider ID',
  ID_DESC: 'Lowercase letters, numbers, and hyphens only',
  ID_PLACEHOLDER: 'lm-studio-home',

  NAME: 'Display Name',
  NAME_DESC: 'Human-readable name for this provider',
  NAME_PLACEHOLDER: 'LM Studio Home',

  TYPE: 'Provider Type',
  TYPE_DESC: 'Type identifier (e.g., lm-studio, qwen-proxy, custom-type)',
  TYPE_PLACEHOLDER: 'lm-studio',

  DESCRIPTION: 'Description',
  DESCRIPTION_DESC: 'Optional description for this provider',
  DESCRIPTION_PLACEHOLDER: 'Optional description',

  PRIORITY: 'Priority',
  PRIORITY_DESC: 'Higher values = higher priority for routing',

  ENABLED: 'Enabled',
  ENABLED_DESC: 'Whether this provider is active',

  CONFIG_TITLE: 'Configuration',

  BASE_URL: 'baseURL',
  BASE_URL_DESC: 'Base URL for the provider API endpoint',
  BASE_URL_PLACEHOLDER: 'http://localhost:1234',

  TIMEOUT: 'timeout',
  TIMEOUT_DESC: 'Request timeout in milliseconds',
  TIMEOUT_PLACEHOLDER: '30000',

  DEFAULT_MODEL: 'defaultModel',
  DEFAULT_MODEL_DESC: 'Default model to use if none specified',
  DEFAULT_MODEL_PLACEHOLDER: 'qwen-max',

  API_KEY: 'apiKey',
  API_KEY_DESC: 'API key for authentication (OpenAI-compatible providers)',
  API_KEY_PLACEHOLDER: 'sk-...',

  TOKEN: 'token',
  TOKEN_DESC: 'Authentication token (Qwen providers)',
  TOKEN_PLACEHOLDER: 'your-api-token',

  COOKIES: 'cookies',
  COOKIES_DESC: 'Session cookies for authentication',
  COOKIES_PLACEHOLDER: 'cookie1=value1; cookie2=value2',

  EXPIRES_AT: 'expiresAt',
  EXPIRES_AT_DESC: 'Token expiration timestamp (Unix milliseconds)',
  EXPIRES_AT_PLACEHOLDER: '1704067200000'
} as const;

// Tooltip labels
export const TOOLTIP_LABELS = {
  BACK: 'Back to providers list',
  CANCEL: 'Cancel and go back',
  RESET: 'Reset form',
  TEST: 'Test connection',
  TEST_LOADING: 'Testing connection...',
  SAVE_EDIT: 'Save changes',
  SAVE_CREATE: 'Create provider',
  SAVE_LOADING: 'Saving...',
  TOGGLE_ENABLE: 'Enable provider',
  TOGGLE_DISABLE: 'Disable provider',
  EDIT: 'Edit provider',
  DELETE: 'Delete provider'
} as const;

// Builder function for form content
export const buildProviderFormContent = (params: {
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
}) => {
  const { formData, isEditMode, readOnly, setFormData, handleConfigChange, handleSubmit } = params;

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
};

// Builder function for actions (read-only mode)
export const buildProviderFormActionsReadOnly = (params: {
  loading: boolean;
  enabled: boolean;
  handleBack: () => void;
  handleToggleEnabled: () => void;
  handleEdit: () => void;
  handleDelete: () => void;
}) => {
  const { loading, enabled, handleBack, handleToggleEnabled, handleEdit, handleDelete } = params;

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
};

// Builder function for actions (edit mode)
export const buildProviderFormActionsEdit = (params: {
  loading: boolean;
  testing: boolean;
  isEditMode: boolean;
  handleBack: () => void;
  handleReset: () => void;
  handleTest: () => void;
  handleSubmit: (e: React.FormEvent) => void;
}) => {
  const { loading, testing, isEditMode, handleBack, handleReset, handleTest, handleSubmit } = params;

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
};
