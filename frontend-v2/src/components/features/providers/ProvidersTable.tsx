import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, RefreshCw } from 'lucide-react';
import type { Provider } from '@/types/providers.types';

interface ProvidersTableProps {
  providers: Provider[];
  actionLoading: string | null;
  onToggleEnabled: (provider: Provider) => void;
  onTest: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
}

export function ProvidersTable({
  providers,
  actionLoading,
  onToggleEnabled,
  onTest,
  onDelete,
}: ProvidersTableProps) {
  if (providers.length === 0) {
    return (
      <div className="providers-empty-state">No providers configured</div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="providers-table-actions-header">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {providers.map((provider) => (
          <TableRow key={provider.id}>
            <TableCell className="providers-table-name">{provider.name}</TableCell>
            <TableCell>
              <Badge variant="outline">{provider.type}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={provider.enabled ? 'default' : 'secondary'}>
                {provider.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </TableCell>
            <TableCell className="providers-table-actions">
              <div className="providers-table-actions-buttons">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onTest(provider)}
                  disabled={actionLoading === `test-${provider.id}`}
                >
                  {actionLoading === `test-${provider.id}` ? (
                    <RefreshCw className="icon-xs providers-table-spinner" />
                  ) : (
                    'Test'
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="icon-sm" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onToggleEnabled(provider)}
                      disabled={
                        actionLoading === `enable-${provider.id}` ||
                        actionLoading === `disable-${provider.id}`
                      }
                    >
                      {provider.enabled ? 'Disable' : 'Enable'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onTest(provider)}
                      disabled={actionLoading === `test-${provider.id}`}
                    >
                      Test Connection
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="providers-table-delete"
                      onClick={() => onDelete(provider)}
                      disabled={actionLoading === `delete-${provider.id}`}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
