import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
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
import { MoreVertical, Plus, Settings, TestTube2, Trash2, Power, PowerOff } from 'lucide-react';
import type { ProvidersTableProps } from '@/types/providers.types';

export function ProvidersTable({
  providers,
  actionLoading,
  onToggleEnabled,
  onTest,
  onDelete,
  onCreate,
  onRowClick,
}: ProvidersTableProps) {
  return (
    <div className="flex-1 flex flex-col gap-4">
      <p className="step-description">
        Manage all providers in your system. Create, enable, disable, test, and delete providers:
      </p>

      <div className="demo-container flex-1">
        <div className="demo-header">
          <div className="demo-label">
            <Settings className="icon-primary" />
            <span className="demo-label-text">Provider Management</span>
          </div>
          {onCreate && (
            <TooltipProvider>
              <Tooltip content="Create new provider">
                <Button
                  onClick={onCreate}
                  size="icon"
                  variant="outline"
                  aria-label="Create new provider"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {providers.length === 0 ? (
          <div className="demo-error-state">No providers configured</div>
        ) : (
          <div className="flex-1 overflow-y-auto">
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
                  <TableRow
                    key={provider.id}
                    onClick={() => onRowClick?.(provider.id)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="providers-table-name">{provider.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{provider.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={provider.enabled ? 'default' : 'secondary'}>
                        {provider.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell className="providers-table-actions" onClick={(e) => e.stopPropagation()}>
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
                            {provider.enabled ? (
                              <>
                                <PowerOff className="h-4 w-4 mr-2" />
                                Disable
                              </>
                            ) : (
                              <>
                                <Power className="h-4 w-4 mr-2" />
                                Enable
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onTest(provider)}
                            disabled={actionLoading === `test-${provider.id}`}
                          >
                            <TestTube2 className="h-4 w-4 mr-2" />
                            Test Connection
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="providers-table-delete"
                            onClick={() => onDelete(provider)}
                            disabled={actionLoading === `delete-${provider.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
