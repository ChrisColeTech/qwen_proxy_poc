import { Network } from 'lucide-react';
import { ActionList } from '@/components/ui/action-list';
import type { ActionItem } from '@/constants/home.constants';

interface ProviderSwitchTabProps {
  switchActions: ActionItem[];
}

export function ProviderSwitchTab({ switchActions }: ProviderSwitchTabProps) {
  return (
    <ActionList title="Available Providers" icon={Network} items={switchActions} />
  );
}
