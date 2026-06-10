"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BadgeCheck, LogOut, Pencil } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ROLES } from "@/lib/validations/auth"
import { cn } from "@/lib/utils"

const ROLE_LABEL: Record<string, string> = {
  SENDER: "Sender",
  TRAVELER: "Traveler",
  BOTH: "Sender & Traveler",
  ADMIN: "Admin",
}

interface ProfileUser {
  fullName: string
  email: string | null
  phone: string | null
  role: string
  city: string | null
  country: string | null
  trustScore: number
  ratingAverage: number
  completedTrips: number
  isEmailVerified: boolean
  isPhoneVerified: boolean
}

export function ProfileView({ user }: { user: ProfileUser }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(user.fullName)
  const [city, setCity] = useState(user.city ?? "")
  const [country, setCountry] = useState(user.country ?? "")
  const [role, setRole] = useState(user.role)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const initials = user.fullName
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const save = async () => {
    setError(null)
    setBusy(true)
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: fullName.trim(),
        city,
        country,
        ...(role !== "ADMIN" && { role }),
      }),
    })
    setBusy(false)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? "Could not save changes.")
      return
    }
    setEditing(false)
    router.refresh()
  }

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-primary px-6 pt-14 pb-16 text-center rounded-b-3xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-2xl font-bold text-white">
          {initials}
        </div>
        <h1 className="mt-3 text-xl font-bold text-white flex items-center justify-center gap-1.5">
          {user.fullName}
          {(user.isEmailVerified || user.isPhoneVerified) && (
            <BadgeCheck className="h-5 w-5 text-white/90" />
          )}
        </h1>
        <Badge className="mt-2 bg-white/15 text-white border-0">
          {ROLE_LABEL[user.role] ?? user.role}
        </Badge>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-8">
        <Card className="rounded-xl shadow-sm">
          <CardContent className="flex divide-x divide-border py-4 px-0">
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-foreground">{user.completedTrips}</p>
              <p className="text-xs text-muted-foreground">Trips</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-foreground">
                {user.ratingAverage > 0 ? user.ratingAverage.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-foreground">{user.trustScore}</p>
              <p className="text-xs text-muted-foreground">Trust Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details / edit */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Account details</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-sm font-medium text-primary"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          )}
        </div>

        <Card className="rounded-xl">
          <CardContent className="py-4 space-y-4">
            {editing ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    className="h-11"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      className="h-11"
                      placeholder="Seattle"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      className="h-11"
                      placeholder="USA"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>
                </div>
                {user.role !== "ADMIN" && (
                  <div className="space-y-1.5">
                    <Label>Account type</Label>
                    <div className="flex gap-2">
                      {ROLES.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={cn(
                            "flex-1 rounded-lg border-2 py-2 text-xs font-medium",
                            role === r
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border text-muted-foreground"
                          )}
                        >
                          {ROLE_LABEL[r]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={() => {
                      setEditing(false)
                      setFullName(user.fullName)
                      setCity(user.city ?? "")
                      setCountry(user.country ?? "")
                      setRole(user.role)
                      setError(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 h-11 bg-primary hover:bg-primary/90 font-semibold"
                    onClick={save}
                    disabled={busy}
                  >
                    {busy ? "Saving…" : "Save"}
                  </Button>
                </div>
              </>
            ) : (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium text-foreground">{user.email ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="font-medium text-foreground">{user.phone ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="font-medium text-foreground">
                    {[user.city, user.country].filter(Boolean).join(", ") || "—"}
                  </dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        <Button
          variant="outline"
          onClick={signOut}
          className="mt-5 w-full h-12 border-2 font-semibold text-destructive border-destructive/30 hover:bg-destructive/5"
        >
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  )
}
