import { TabCard } from '@/components/ui/tab-card';
import { useModelFormPage } from '@/hooks/useModelFormPage';
import { ModelDetailsTab } from '@/components/features/modelForm/ModelDetailsTab';
import { ModelFormActions } from '@/components/features/modelForm/ModelFormActions';
import {
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

  const tabs = [
    {
      ...MODEL_FORM_TABS.DETAILS,
      content: <ModelDetailsTab model={model} />,
      contentCardTitle: MODEL_FORM_TABS.DETAILS.label,
      contentCardIcon: MODEL_FORM_ICON,
      contentCardActions: (
        <ModelFormActions
          model={model}
          settingDefault={settingDefault}
          onBack={handleBack}
          onSetAsDefault={handleSetAsDefault}
        />
      )
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
