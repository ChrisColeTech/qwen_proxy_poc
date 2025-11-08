import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { X, LogOut } from 'lucide-react';

interface LogoutDialogProps {
  open: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutDialog({ open, loading, onConfirm, onCancel }: LogoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Logout</DialogTitle>
          <DialogDescription>
            Are you sure you want to log out? You'll need to log in again to use Qwen models.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <TooltipProvider>
            <Tooltip content="Cancel">
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
                aria-label="Cancel logout"
              >
                <X className="icon-sm" />
              </Button>
            </Tooltip>
            <Tooltip content={loading ? "Logging out..." : "Confirm logout"}>
              <Button
                variant="destructive"
                size="icon"
                onClick={onConfirm}
                disabled={loading}
                aria-label="Confirm logout"
              >
                <LogOut className="icon-sm" />
              </Button>
            </Tooltip>
          </TooltipProvider>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
