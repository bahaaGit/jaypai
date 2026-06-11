"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Send, CalendarDays, ArrowRight, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/layout/PageHeader"

const RECENT_KEY = "jaypai-recent-searches"
const MAX_RECENT = 5

interface RecentSearch {
  from: string
  to: string
}

export default function TripSearchPage() {
  const router = useRouter()
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [date, setDate] = useState("")
  const [type, setType] = useState("all")
  const [maxPrice, setMaxPrice] = useState("")
  const [recent, setRecent] = useState<RecentSearch[]>([])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]")
      if (Array.isArray(stored)) {
        queueMicrotask(() => setRecent(stored.slice(0, MAX_RECENT)))
      }
    } catch {
      // ignore corrupt storage
    }
  }, [])

  const search = (f = from, t = to) => {
    const params = new URLSearchParams()
    if (f.trim()) params.set("from", f.trim())
    if (t.trim()) params.set("to", t.trim())
    if (date) params.set("date", date)
    if (type !== "all") params.set("type", type)
    if (maxPrice) params.set("maxPrice", maxPrice)

    if (f.trim() || t.trim()) {
      const entry = { from: f.trim(), to: t.trim() }
      const next = [
        entry,
        ...recent.filter((r) => r.from !== entry.from || r.to !== entry.to),
      ].slice(0, MAX_RECENT)
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    }

    router.push(`/trips?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Find a Trip" />
      <div className="px-4 py-5 max-w-sm mx-auto space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="from">From</Label>
          <div className="relative">
            <Send className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="from"
              placeholder="Seattle, USA"
              className="h-12 bg-white pl-10"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="to">To</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="to"
              placeholder="Banjul, Gambia"
              className="h-12 bg-white pl-10"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date">Departing</Label>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="date"
              type="date"
              className="h-12 bg-white pl-10"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          {!date && <p className="text-xs text-muted-foreground">Any date</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-12 w-full rounded-md border border-input bg-white px-3 text-sm text-foreground"
          >
            <option value="all">All (Luggage &amp; Cargo)</option>
            <option value="luggage">Luggage</option>
            <option value="cargo">Cargo (Containers)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="maxPrice">Max price per lb (optional)</Label>
          <Input
            id="maxPrice"
            type="number"
            inputMode="decimal"
            min="1"
            placeholder="$10"
            className="h-12 bg-white"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>

        <Button
          onClick={() => search()}
          className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
        >
          Search Trips
        </Button>

        {recent.length > 0 && (
          <div className="pt-2">
            <h2 className="text-sm font-semibold text-foreground mb-2">Recent Searches</h2>
            <div className="space-y-1">
              {recent.map((r, i) => (
                <button
                  key={i}
                  onClick={() => search(r.from, r.to)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-sm text-foreground hover:bg-muted"
                >
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span>{r.from || "Anywhere"}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{r.to || "Anywhere"}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
