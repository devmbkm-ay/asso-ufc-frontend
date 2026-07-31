import { HeartCrack } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"

export function DeceasedBadge({ className }: { className?: string }) {
  return (
    <StatusBadge
      status="inactive"
      label="Décédé"
      icon={<HeartCrack size={10} />}
      className={cn("shrink-0", className)}
    />
  )
}
