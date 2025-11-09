import { TabCard } from '@/components/ui/tab-card';
import { useProviderFormPage } from '@/hooks/useProviderFormPage';
import {
  buildProviderFormContent,
  buildProviderFormActionsReadOnly,
  buildProviderFormActionsEdit,
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

  const formContent = buildProviderFormContent({
    formData,
    isEditMode,
    readOnly,
    setFormData,
    handleConfigChange,
    handleSubmit
  });

  const actions = readOnly
    ? buildProviderFormActionsReadOnly({
        loading,
        enabled: formData.enabled,
        handleBack,
        handleToggleEnabled,
        handleEdit,
        handleDelete
      })
    : buildProviderFormActionsEdit({
        loading,
        testing,
        isEditMode,
        handleBack,
        handleReset,
        handleTest,
        handleSubmit
      });

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
