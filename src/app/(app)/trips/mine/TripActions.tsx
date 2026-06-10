"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Pencil, XCircle, Trash2, Eye } from "lucide-react"

export function TripActions({
  tripId,
  status,
  hasBookings,
}: {
  tripId: string
  status: string
  hasBookings: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cancel = async () => {
    if (!confirm("Cancel this trip? Senders will no longer be able to book it.")) return
    setBusy(true)
    setError(null)
    const res = await fetch(`/api/trips/${tripId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    })
    setBusy(false)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? "Could not cancel trip")
      return
    }
    router.refresh()
  }

  const remove = async () => {
    if (!confirm("Delete this trip permanently?")) return
    setBusy(true)
    setError(null)
    const res = await fetch(`/api/trips/${tripId}`, { method: "DELETE" })
    setBusy(false)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? "Could not delete trip")
      return
    }
    router.refresh()
  }

  const active = status === "PUBLISHED" || status === "DRAFT"

  return (
    <div className="mt-3">
      <div className="flex items-center gap-4 text-xs font-medium">
        {status === "PUBLISHED" && (
          <Link href={`/trips/${tripId}`} className="flex items-center gap-1 text-foreground">
            <Eye className="h-3.5 w-3.5" /> View
          </Link>
        )}
        {active && (
          <Link href={`/trips/${tripId}/edit`} className="flex items-center gap-1 text-primary">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Link>
        )}
        {active && (
          <button
            onClick={cancel}
            disabled={busy}
            className="flex items-center gap-1 text-amber-600"
          >
            <XCircle className="h-3.5 w-3.5" /> Cancel
          </button>
        )}
        {!hasBookings && (
          <button
            onClick={remove}
            disabled={busy}
            className="flex items-center gap-1 text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        )}
      </div>
      {error && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
