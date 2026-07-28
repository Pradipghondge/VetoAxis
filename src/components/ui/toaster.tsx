"use client"

import { useToast } from "@/components/ui/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { AlertTriangle, Check, Info, X } from "lucide-react"

const getToastIcon = (variant?: string | null) => {
  const iconClass = "h-5 w-5 text-white"

  if (variant === "destructive") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500">
        <X className={iconClass} strokeWidth={3} />
      </div>
    )
  }

  if (variant === "warning") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500">
        <AlertTriangle className={iconClass} strokeWidth={3} />
      </div>
    )
  }

  if (variant === "info") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500">
        <Info className={iconClass} strokeWidth={3} />
      </div>
    )
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500">
      <Check className={iconClass} strokeWidth={3} />
    </div>
  )
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={3000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            {getToastIcon(props.variant)}
            <div className="grid min-w-0 flex-1 gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
