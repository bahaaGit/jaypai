import { cn } from "@/lib/utils"

interface MobileShellProps {
  children: React.ReactNode
  className?: string
}

export function MobileShell({ children, className }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className={cn("flex-1 overflow-y-auto pb-20", className)}>
        {children}
      </div>
    </div>
  )
}
