import { useToast } from "@/hooks/use-toast"
import { useUIStore } from "@/stores/useUIStore"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()
  const sidebarPosition = useUIStore((state) => state.uiState.sidebarPosition)

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{String(description)}</ToastDescription>
              )}
            </div>
            {action && <div>{action}</div>}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport
        className={
          sidebarPosition === 'right'
            ? 'sm:bottom-6 sm:right-16'
            : 'sm:bottom-6 sm:right-0'
        }
      />
    </ToastProvider>
  )
}
