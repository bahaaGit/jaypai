"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PACKAGE_TYPES, CONTAINER_SIZES, tripCreateSchema } from "@/lib/validations/trip"
import { User as UserIcon, Container } from "lucide-react"

export interface TripFormValues {
  tripType: string
  containerSize: string
  flatPrice: string
  originCity: string
  originCountry: string
  destinationCity: string
  destinationCountry: string
  departureDate: string
  arrivalDate: string
  airline: string
  availableWeightLbs: string
  pricePerLb: string
  pickupInstructions: string
  dropoffInstructions: string
  allowedItemTypes: string[]
}

const EMPTY: TripFormValues = {
  tripType: "LUGGAGE",
  containerSize: "",
  flatPrice: "",
  originCity: "",
  originCountry: "",
  destinationCity: "",
  destinationCountry: "",
  departureDate: "",
  arrivalDate: "",
  airline: "",
  availableWeightLbs: "",
  pricePerLb: "",
  pickupInstructions: "",
  dropoffInstructions: "",
  allowedItemTypes: ["Clothes"],
}

const STEPS = ["Type", "Route", "Details", "Review"] as const

const POSTER_TYPES = [
  {
    value: "LUGGAGE",
    title: "Individual Traveler",
    desc: "I'm a person traveling with luggage space",
    icon: UserIcon,
  },
  {
    value: "CARGO",
    title: "Shipping Carrier",
    desc: "I'm sending goods in containers or cargo",
    icon: Container,
  },
] as const

export function TripForm({
  initial,
  tripId,
}: {
  initial?: TripFormValues
  tripId?: string
}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [v, setV] = useState<TripFormValues>(initial ?? EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = (field: keyof TripFormValues, value: string | string[]) =>
    setV((prev) => ({ ...prev, [field]: value }))

  const toggleType = (type: string) =>
    setV((prev) => ({
      ...prev,
      allowedItemTypes: prev.allowedItemTypes.includes(type)
        ? prev.allowedItemTypes.filter((t) => t !== type)
        : [...prev.allowedItemTypes, type],
    }))

  // Strip empty optional numerics so zod coercion doesn't turn "" into 0.
  const toPayload = (values: TripFormValues) => ({
    ...values,
    pricePerLb: values.pricePerLb === "" ? undefined : values.pricePerLb,
    flatPrice: values.flatPrice === "" ? undefined : values.flatPrice,
    containerSize: values.containerSize === "" ? undefined : values.containerSize,
  })

  const validate = () => {
    const parsed = tripCreateSchema.safeParse(toPayload(v))
    if (parsed.success) {
      setErrors({})
      return true
    }
    const fieldErrors: Record<string, string> = {}
    for (const [key, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
      if (msgs?.[0]) fieldErrors[key] = msgs[0]
    }
    setErrors(fieldErrors)
    return false
  }

  const step1Valid = () => {
    return validateAnd([
      "originCity",
      "originCountry",
      "destinationCity",
      "destinationCountry",
      "departureDate",
      "arrivalDate",
      "availableWeightLbs",
      "pricePerLb",
      "containerSize",
      "flatPrice",
    ])
  }

  const validateAnd = (fields: string[]) => {
    const parsed = tripCreateSchema.safeParse(toPayload(v))
    if (parsed.success) {
      setErrors({})
      return true
    }
    const fieldErrors: Record<string, string> = {}
    for (const [key, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
      if (fields.includes(key) && msgs?.[0]) fieldErrors[key] = msgs[0]
    }
    setErrors(fieldErrors)
    return Object.keys(fieldErrors).length === 0
  }

  const submit = async () => {
    if (!validate()) {
      setStep(1)
      return
    }
    setServerError(null)
    setBusy(true)
    const res = await fetch(tripId ? `/api/trips/${tripId}` : "/api/trips", {
      method: tripId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(v)),
    })
    setBusy(false)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setServerError(data?.error ?? "Something went wrong. Try again.")
      return
    }
    const data = await res.json()
    router.push(`/trips/${data.trip.id}`)
    router.refresh()
  }

  const err = (field: string) =>
    errors[field] ? <p className="text-xs text-destructive mt-1">{errors[field]}</p> : null

  return (
    <div className="px-4 py-5 max-w-sm mx-auto">
      {/* Stepper */}
      <div className="mb-6 flex items-center justify-between">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                  i < step
                    ? "bg-primary text-white"
                    : i === step
                      ? "border-2 border-primary text-primary"
                      : "border-2 border-border text-muted-foreground"
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "mt-1 text-[10px] font-medium",
                  i <= step ? "text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("mx-2 h-0.5 flex-1 -mt-4", i < step ? "bg-primary" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Who are you posting as?</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              This helps us show your trip to the right senders.
            </p>
          </div>
          <div className="space-y-3" role="radiogroup" aria-label="Posting as">
            {POSTER_TYPES.map(({ value, title, desc, icon: Icon }) => {
              const selected = v.tripType === value
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => set("tripType", value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border-2 bg-white p-4 text-left",
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
          <Button
            onClick={() => setStep(1)}
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
          >
            Continue
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="originCity">From — City</Label>
              <Input id="originCity" placeholder="Seattle" className="h-12 bg-white mt-1.5" value={v.originCity} onChange={(e) => set("originCity", e.target.value)} />
              {err("originCity")}
            </div>
            <div>
              <Label htmlFor="originCountry">Country</Label>
              <Input id="originCountry" placeholder="USA" className="h-12 bg-white mt-1.5" value={v.originCountry} onChange={(e) => set("originCountry", e.target.value)} />
              {err("originCountry")}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="destinationCity">To — City</Label>
              <Input id="destinationCity" placeholder="Banjul" className="h-12 bg-white mt-1.5" value={v.destinationCity} onChange={(e) => set("destinationCity", e.target.value)} />
              {err("destinationCity")}
            </div>
            <div>
              <Label htmlFor="destinationCountry">Country</Label>
              <Input id="destinationCountry" placeholder="Gambia" className="h-12 bg-white mt-1.5" value={v.destinationCountry} onChange={(e) => set("destinationCountry", e.target.value)} />
              {err("destinationCountry")}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="departureDate">Departure Date</Label>
              <Input id="departureDate" type="date" className="h-12 bg-white mt-1.5" min={new Date().toISOString().slice(0, 10)} value={v.departureDate} onChange={(e) => set("departureDate", e.target.value)} />
              {err("departureDate")}
            </div>
            <div>
              <Label htmlFor="arrivalDate">Arrival Date</Label>
              <Input id="arrivalDate" type="date" className="h-12 bg-white mt-1.5" min={v.departureDate || undefined} value={v.arrivalDate} onChange={(e) => set("arrivalDate", e.target.value)} />
              {err("arrivalDate")}
            </div>
          </div>

          {v.tripType === "CARGO" ? (
            <>
              <div>
                <Label>Container Size</Label>
                <div className="mt-2 flex gap-2">
                  {CONTAINER_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      aria-pressed={v.containerSize === size}
                      onClick={() => set("containerSize", size)}
                      className={cn(
                        "flex-1 rounded-xl border-2 py-3 text-sm font-semibold",
                        v.containerSize === size
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-white text-muted-foreground"
                      )}
                    >
                      {size} Container
                    </button>
                  ))}
                </div>
                {err("containerSize")}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="flatPrice">Container Price ($)</Label>
                  <Input id="flatPrice" type="number" inputMode="decimal" min="50" placeholder="950" className="h-12 bg-white mt-1.5" value={v.flatPrice} onChange={(e) => set("flatPrice", e.target.value)} />
                  {err("flatPrice")}
                </div>
                <div>
                  <Label htmlFor="availableWeightLbs">Capacity (lbs)</Label>
                  <Input id="availableWeightLbs" type="number" inputMode="numeric" min="1" placeholder="44000" className="h-12 bg-white mt-1.5" value={v.availableWeightLbs} onChange={(e) => set("availableWeightLbs", e.target.value)} />
                  {err("availableWeightLbs")}
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="availableWeightLbs">Available Space (lbs)</Label>
                <Input id="availableWeightLbs" type="number" inputMode="numeric" min="1" max="200" placeholder="80" className="h-12 bg-white mt-1.5" value={v.availableWeightLbs} onChange={(e) => set("availableWeightLbs", e.target.value)} />
                {err("availableWeightLbs")}
              </div>
              <div>
                <Label htmlFor="pricePerLb">Price per lb ($)</Label>
                <Input id="pricePerLb" type="number" inputMode="decimal" step="0.5" min="0.5" placeholder="5.00" className="h-12 bg-white mt-1.5" value={v.pricePerLb} onChange={(e) => set("pricePerLb", e.target.value)} />
                {err("pricePerLb")}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(0)} className="flex-1 h-12 border-2 font-semibold">
              Back
            </Button>
            <Button onClick={() => step1Valid() && setStep(2)} className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90">
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="airline">Airline (optional)</Label>
            <Input id="airline" placeholder="Delta Airlines" className="h-12 bg-white mt-1.5" value={v.airline} onChange={(e) => set("airline", e.target.value)} />
          </div>

          <div>
            <Label htmlFor="pickupInstructions">Pickup Instructions (optional)</Label>
            <Textarea id="pickupInstructions" placeholder="I can meet at SeaTac Airport or downtown Seattle." className="bg-white mt-1.5 min-h-20" value={v.pickupInstructions} onChange={(e) => set("pickupInstructions", e.target.value)} />
          </div>

          <div>
            <Label htmlFor="dropoffInstructions">Drop-off Instructions (optional)</Label>
            <Textarea id="dropoffInstructions" placeholder="I will deliver in Serrekunda area." className="bg-white mt-1.5 min-h-20" value={v.dropoffInstructions} onChange={(e) => set("dropoffInstructions", e.target.value)} />
          </div>

          <div>
            <Label>Package Types Allowed</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PACKAGE_TYPES.map((type) => {
                const selected = v.allowedItemTypes.includes(type)
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleType(type)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                      selected
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-white text-muted-foreground"
                    )}
                  >
                    {type}
                  </button>
                )
              })}
            </div>
            {err("allowedItemTypes")}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 border-2 font-semibold">
              Back
            </Button>
            <Button
              onClick={() => validateAnd(["allowedItemTypes"]) && setStep(3)}
              className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90"
            >
              Review Trip
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Card className="rounded-xl">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-base font-bold text-foreground">
                <span>{v.originCity}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span>{v.destinationCity}</span>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Type</dt><dd className="font-medium">{v.tripType === "CARGO" ? `Cargo · ${v.containerSize} container` : "Luggage"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Dates</dt><dd className="font-medium">{v.departureDate} → {v.arrivalDate}</dd></div>
                {v.tripType === "CARGO" ? (
                  <>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Capacity</dt><dd className="font-medium">{Number(v.availableWeightLbs).toLocaleString()} lbs</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Container price</dt><dd className="font-medium">${Number(v.flatPrice).toLocaleString()}</dd></div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Available space</dt><dd className="font-medium">{v.availableWeightLbs} lbs</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Price per lb</dt><dd className="font-medium">${v.pricePerLb}</dd></div>
                  </>
                )}
                {v.airline && <div className="flex justify-between"><dt className="text-muted-foreground">Airline</dt><dd className="font-medium">{v.airline}</dd></div>}
                {v.pickupInstructions && <div className="flex justify-between gap-4"><dt className="text-muted-foreground flex-shrink-0">Pickup</dt><dd className="font-medium text-right">{v.pickupInstructions}</dd></div>}
                {v.dropoffInstructions && <div className="flex justify-between gap-4"><dt className="text-muted-foreground flex-shrink-0">Drop-off</dt><dd className="font-medium text-right">{v.dropoffInstructions}</dd></div>}
              </dl>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Allowed Items</p>
                <div className="flex flex-wrap gap-1.5">
                  {v.allowedItemTypes.map((t) => (
                    <Badge key={t} className="bg-primary/10 text-primary border-0">{t}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {serverError && <p className="text-sm text-destructive" role="alert">{serverError}</p>}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 border-2 font-semibold">
              Back
            </Button>
            <Button onClick={submit} disabled={busy} className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90">
              {busy ? "Publishing…" : tripId ? "Save Changes" : "Publish Trip"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
