import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
    label: string
    href?: string
}

interface BreadcrumbProps extends React.ComponentProps<"nav"> {
    items: BreadcrumbItem[]
}

function Breadcrumb({ items, className, ...props }: BreadcrumbProps) {
    return (
        <nav
            data-slot="breadcrumb"
            aria-label="Fil d'Ariane"
            className={cn("flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground", className)}
            {...props}
        >
            {items.map((item, i) => {
                const isLast = i === items.length - 1
                return (
                    <span key={i} className="flex items-center gap-1.5">
                        {i > 0 && <ChevronRight size={13} className="shrink-0 opacity-50" aria-hidden="true" />}
                        {item.href && !isLast ? (
                            <Link href={item.href} className="hover:text-foreground transition-colors">
                                {item.label}
                            </Link>
                        ) : (
                            <span
                                className={cn(isLast && "text-foreground font-medium")}
                                aria-current={isLast ? "page" : undefined}
                            >
                                {item.label}
                            </span>
                        )}
                    </span>
                )
            })}
        </nav>
    )
}

export { Breadcrumb }
