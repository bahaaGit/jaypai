"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Package, Plane, Repeat, Check, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ROLES } from "@/lib/validations/auth"

type Role = (typeof ROLES)[number]

const OPTIONS: { role: Role; title: string; desc: string; icon: typeof Package }[] = [
  {
    role: "SENDER",
    title: "I want to send packages",
    desc: "Sender",
    icon: Package,
  },
  {
    role: "TRAVELER",
    title: "I travel and want to deliver",
    desc: "Traveler",
    icon: Plane,
  },
  {
    role: "SHIPPER",
    title: "I'm a business / Freight forwarder",
    desc: "Shipper — containers & cargo",
    icon: Building2,
  },
  {
    role: "BOTH",
    title: "Both",
    desc: "Sender & Traveler",
    icon: Repeat,
  },
]

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const router = useRouter()
  const [fullName, setFullName] = useState(defaultName)
  const [role, setRole] = useState<Role | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError(null)
    if (fullName.trim().length < 2) {
      setError("Enter your full name")
      return
    }
    if (!role) {
      setError("Choose an account type")
      return
    }
    setBusy(true)
    const res = await fetch("/api/auth/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: fullName.trim(), role }),
    })
    setBusy(false)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? "Something went wrong. Try again.")
      return
    }
    router.push("/home")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 pt-14 pb-10 max-w-sm mx-auto">
        <h1 className="text-2xl font-bold text-foreground">
          Choose your
          <br />
          account type
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">You can switch anytime.</p>

        <div className="mt-6 space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            placeholder="Enter your full name"
            autoComplete="name"
            className="h-12 bg-white"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="mt-5 space-y-3" role="radiogroup" aria-label="Account type">
          {OPTIONS.map(({ role: r, title, desc, icon: Icon }) => {
            const selected = role === r
            return (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setRole(r)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl border-2 bg-white p-4 text-left transition-colors",
                  selected ? "border-primary" : "border-border"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
                    selected ? "bg-primary text-white" : "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                {selected && <Check className="h-5 w-5 text-primary" />}
              </button>
            )
          })}
        </div>

        {error && (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          onClick={submit}
          disabled={busy}
          className="mt-6 w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
        >
          {busy ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  )
}
