"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

const LABELS: Record<string, string> = {
  soonest: "Soonest",
  price: "Lowest price",
  weight: "Most space",
}

function SortControl({ current }: { current: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", value)
    router.push(`/trips?${params.toString()}`)
  }

  return (
    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
      Sort by
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-border bg-white px-2 py-1 text-xs font-medium text-foreground"
      >
        {Object.entries(LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function SortSelect({ current }: { current: string }) {
  return (
    <Suspense>
      <SortControl current={current} />
    </Suspense>
  )
}
