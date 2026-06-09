"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  showBack?: boolean
  onBack?: () => void
  right?: React.ReactNode
  className?: string
}

export function PageHeader({ title, showBack = true, onBack, right, className }: PageHeaderProps) {
  const router = useRouter()

  return (
    <header className={cn("flex items-center justify-between px-4 py-4 bg-white border-b border-border", className)}>
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={onBack ?? (() => router.back())}
            className="p-1 -ml-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        )}
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>
      {right && <div>{right}</div>}
    </header>
  )
}
