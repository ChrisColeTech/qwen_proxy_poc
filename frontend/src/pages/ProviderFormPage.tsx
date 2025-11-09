import { TabCard } from '@/components/ui/tab-card';
import { useProviderFormPage } from '@/hooks/useProviderFormPage';
import { ProviderFormContent } from '@/components/features/providerForm/ProviderFormContent';
import { ProviderFormActionsReadOnly } from '@/components/features/providerForm/ProviderFormActionsReadOnly';
import { ProviderFormActionsEdit } from '@/components/features/providerForm/ProviderFormActionsEdit';
import {
  PROVIDER_FORM_TABS,
  PROVIDER_FORM_TITLE_EDIT,
  PROVIDER_FORM_TITLE_CREATE,
  PROVIDER_FORM_ICON
} from '@/constants/providerForm.constants';

interface ProviderFormPageProps {
  readOnly?: boolean;
}

export function ProviderFormPage({ readOnly = false }: ProviderFormPageProps = {}) {
  const {
    isEditMode,
    loading,
    testing,
    formData,
    setFormData,
    handleSubmit,
    handleTest,
    handleConfigChange,
    handleReset,
    handleToggleEnabled,
    handleDelete,
    handleBack,
    handleEdit
  } = useProviderFormPage(readOnly);

  const formContent = (
    <ProviderFormContent
      formData={formData}
      isEditMode={isEditMode}
      readOnly={readOnly}
      setFormData={setFormData}
      handleConfigChange={handleConfigChange}
      handleSubmit={handleSubmit}
    />
  );

  const actions = readOnly ? (
    <ProviderFormActionsReadOnly
      loading={loading}
      enabled={formData.enabled}
      handleBack={handleBack}
      handleToggleEnabled={handleToggleEnabled}
      handleEdit={handleEdit}
      handleDelete={handleDelete}
    />
  ) : (
    <ProviderFormActionsEdit
      loading={loading}
      testing={testing}
      isEditMode={isEditMode}
      handleBack={handleBack}
      handleReset={handleReset}
      handleTest={handleTest}
      handleSubmit={handleSubmit}
    />
  );

  const tabs = [
    {
      ...PROVIDER_FORM_TABS.FORM,
      content: formContent,
      contentCardTitle: PROVIDER_FORM_TABS.FORM.label,
      contentCardIcon: PROVIDER_FORM_ICON,
      contentCardActions: actions
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={isEditMode ? PROVIDER_FORM_TITLE_EDIT : PROVIDER_FORM_TITLE_CREATE}
        icon={PROVIDER_FORM_ICON}
        tabs={tabs}
        defaultTab={PROVIDER_FORM_TABS.FORM.value}
      />
    </div>
  );
}
