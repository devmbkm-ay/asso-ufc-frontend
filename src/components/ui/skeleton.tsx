import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const skeletonVariants = cva(
    "animate-pulse rounded-md bg-primary/10 dark:bg-primary/15",
    {
        variants: {
            variant: {
                default: "",
                text: "h-4 w-full",
                title: "h-5 w-40",
                card: "h-24 w-full",
                avatar: "size-8 rounded-full",
                badge: "h-6 w-20",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

function Skeleton({
    className,
    variant,
    ...props
}: React.ComponentProps<"div"> & VariantProps<typeof skeletonVariants>) {
    return (
        <div
            data-slot="skeleton"
            className={cn(skeletonVariants({ variant }), className)}
            {...props}
        />
    )
}

function SkeletonTableRow({ className }: { className?: string }) {
    return (
        <div data-slot="skeleton-table-row" className={cn("space-y-2", className)}>
            <Skeleton variant="text" />
            <Skeleton variant="text" />
            <Skeleton variant="text" />
        </div>
    )
}

export { Skeleton, SkeletonTableRow, skeletonVariants }
