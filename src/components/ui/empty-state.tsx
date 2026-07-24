import * as React from "react"
import { InboxIcon, CircleAlertIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface EmptyStateProps extends React.ComponentProps<"div"> {
    title: string
    description?: string
    action?: React.ReactNode
    icon?: React.ReactNode
}

function EmptyState({
    title,
    description,
    action,
    icon,
    className,
    ...props
}: EmptyStateProps) {
    return (
        <div
            data-slot="empty-state"
            className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-primary/20 bg-primary/5 px-6 py-8 text-center",
                className
            )}
            {...props}
        >
            <div className="flex size-12 items-center justify-center rounded-full bg-background text-primary shadow-sm ring-1 ring-primary/10">
                {icon ?? <InboxIcon className="size-5" />}
            </div>
            <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                {description ? (
                    <p className="max-w-md text-sm text-muted-foreground">{description}</p>
                ) : null}
            </div>
            {action ? <div className="pt-1">{action}</div> : null}
        </div>
    )
}

function EmptyStateError({
    title = "Une erreur est survenue",
    description = "Impossible de charger ce contenu pour le moment.",
    action,
    className,
}: Omit<EmptyStateProps, "title" | "description" | "icon"> & {
    title?: string
    description?: string
}) {
    return (
        <EmptyState
            title={title}
            description={description}
            action={action}
            icon={<CircleAlertIcon className="size-5" />}
            className={cn("border-error/20 bg-error/5", className)}
        />
    )
}

export { EmptyState, EmptyStateError }
