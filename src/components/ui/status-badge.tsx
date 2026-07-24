import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
    "inline-flex items-center gap-2",
    {
        variants: {
            status: {
                active: "bg-success/10 text-success dark:bg-success/20",
                inactive: "bg-muted text-muted-foreground dark:bg-muted/50",
                pending: "bg-warning/10 text-warning dark:bg-warning/20",
                inactive_payment: "bg-error/10 text-error dark:bg-error/20",
                completed: "bg-success/10 text-success dark:bg-success/20",
                cancelled: "bg-error/10 text-error dark:bg-error/20",
                info: "bg-info/10 text-info dark:bg-info/20",
            },
        },
        defaultVariants: {
            status: "info",
        },
    }
)

export interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
    label: string
    icon?: React.ReactNode
    className?: string
}

export function StatusBadge({
    status,
    label,
    icon,
    className,
}: StatusBadgeProps) {
    return (
        <span className={cn(statusBadgeVariants({ status }), className)}>
            {icon && <span className="shrink-0">{icon}</span>}
            <span className="text-xs font-medium">{label}</span>
        </span>
    )
}

export { statusBadgeVariants }
