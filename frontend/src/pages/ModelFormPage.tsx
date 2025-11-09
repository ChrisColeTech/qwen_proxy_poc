import { TabCard } from '@/components/ui/tab-card';
import { useModelFormPage } from '@/hooks/useModelFormPage';
import {
  buildModelFormContent,
  buildModelFormActions,
  MODEL_FORM_TABS,
  MODEL_FORM_TITLE,
  MODEL_FORM_ICON
} from '@/constants/modelForm.constants';

export function ModelFormPage() {
  const { model, loading, settingDefault, handleSetAsDefault, handleBack } = useModelFormPage();

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading model...</p>
        </div>
      </div>
    );
  }

  if (!model) {
    return null;
  }

  const formContent = buildModelFormContent(model);

  const actions = buildModelFormActions({
    model,
    settingDefault,
    handleBack,
    handleSetAsDefault
  });

  const tabs = [
    {
      ...MODEL_FORM_TABS.DETAILS,
      content: formContent,
      contentCardTitle: MODEL_FORM_TABS.DETAILS.label,
      contentCardIcon: MODEL_FORM_ICON,
      contentCardActions: actions
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={MODEL_FORM_TITLE}
        icon={MODEL_FORM_ICON}
        tabs={tabs}
        defaultTab={MODEL_FORM_TABS.DETAILS.value}
        pageKey={`/models/${model.id}`}
      />
    </div>
  );
}
