import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle2Icon, CircleAlertIcon, InfoIcon, TriangleAlertIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const toastVariants = cva(
    "flex w-full items-start gap-3 rounded-xl border p-3 shadow-sm",
    {
        variants: {
            variant: {
                default: "border-primary/20 bg-background text-foreground",
                success: "border-success/30 bg-success/10 text-success",
                warning: "border-warning/30 bg-warning/10 text-warning",
                error: "border-error/30 bg-error/10 text-error",
                info: "border-info/30 bg-info/10 text-info",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

interface ToastProps
    extends React.ComponentProps<"div">,
    VariantProps<typeof toastVariants> {
    title?: string
    description?: string
    closeable?: boolean
    onClose?: () => void
}

function Toast({
    className,
    title,
    description,
    variant,
    closeable = false,
    onClose,
    ...props
}: ToastProps) {
    const Icon =
        variant === "success"
            ? CheckCircle2Icon
            : variant === "warning"
                ? TriangleAlertIcon
                : variant === "error"
                    ? CircleAlertIcon
                    : variant === "info"
                        ? InfoIcon
                        : InfoIcon

    return (
        <div data-slot="toast" className={cn(toastVariants({ variant }), className)} {...props}>
            <div className="mt-0.5 shrink-0">
                <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
                {title ? <p className="text-sm font-semibold">{title}</p> : null}
                {description ? <p className="text-sm opacity-90">{description}</p> : null}
            </div>
            {closeable ? (
                <button
                    type="button"
                    aria-label="Fermer la notification"
                    onClick={onClose}
                    className="rounded-md p-1 text-current/70 transition hover:bg-current/10 hover:text-current"
                >
                    <XIcon className="size-4" />
                </button>
            ) : null}
        </div>
    )
}

export { Toast, toastVariants }
