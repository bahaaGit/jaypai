"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Minus, Plus, Check, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { cn, calculateTotal, formatCurrency } from "@/lib/utils"
import { PICKUP_PREFERENCES } from "@/lib/validations/booking"
import { initialsOf, formatTripDate } from "@/components/trips/TripCard"

export interface BookingTripInfo {
  id: string
  originCity: string
  destinationCity: string
  departureDate: string
  arrivalDate: string
  pricePerLb: number
  remainingLbs: number
  allowedItemTypes: string[]
  tripType: string
  containerSize: string | null
  flatPrice: number | null
  traveler: { fullName: string; ratingAverage: number }
}

const STEPS = ["Weight", "Details", "Pickup", "Review"] as const

export function BookingForm({ trip }: { trip: BookingTripInfo }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [weight, setWeight] = useState(Math.min(25, trip.remainingLbs))
  const [itemCategory, setItemCategory] = useState(trip.allowedItemTypes[0] ?? "Clothes")
  const [description, setDescription] = useState("")
  const [declaredValue, setDeclaredValue] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [recipientCity, setRecipientCity] = useState("")
  const [pickupPreference, setPickupPreference] = useState<string>("MEET_IN_PERSON")
  const [pickupInstructions, setPickupInstructions] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isCargo = trip.tripType === "CARGO"
  // Cargo bookings take the whole container at the flat price.
  const cargoSubtotal = trip.flatPrice ?? 0
  const luggageCalc = calculateTotal(weight, trip.pricePerLb)
  const subtotal = isCargo ? cargoSubtotal : luggageCalc.subtotal
  const serviceFee = isCargo
    ? Math.round(cargoSubtotal * 10) / 100
    : luggageCalc.serviceFee
  const total = isCargo ? Math.round((cargoSubtotal + serviceFee) * 100) / 100 : luggageCalc.total

  const bumpWeight = (delta: number) =>
    setWeight((w) => Math.min(Math.max(1, w + delta), trip.remainingLbs))

  const submit = async () => {
    setError(null)
    setBusy(true)
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tripId: trip.id,
        estimatedWeightLbs: isCargo ? trip.remainingLbs : weight,
        itemCategory,
        packageDescription: description,
        declaredValue: declaredValue ? Number(declaredValue) : undefined,
        pickupPreference,
        pickupInstructions,
        recipientName,
        recipientPhone,
        recipientCity,
      }),
    })
    setBusy(false)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? "Something went wrong. Try again.")
      return
    }
    const data = await res.json()
    router.push(`/bookings/${data.booking.id}/confirmed`)
    router.refresh()
  }

  const next = () => {
    setError(null)
    if (step === 1 && recipientName.trim().length < 2) {
      setError("Enter the recipient's name")
      return
    }
    setStep((s) => s + 1)
  }

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
              <div className={cn("mx-1.5 h-0.5 flex-1 -mt-4", i < step ? "bg-primary" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      {/* Trip summary header (always visible) */}
      <Card className="rounded-xl mb-5">
        <CardContent className="p-3.5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {initialsOf(trip.traveler.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">
              {trip.traveler.fullName}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {trip.traveler.ratingAverage > 0 ? trip.traveler.ratingAverage.toFixed(1) : "New"}
              </span>
              <span className="flex items-center gap-1">
                {trip.originCity} <ArrowRight className="h-3 w-3" /> {trip.destinationCity}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatTripDate(trip.departureDate)} — {formatTripDate(trip.arrivalDate)}
            </p>
          </div>
        </CardContent>
      </Card>

      {step === 0 && (
        <div>
          {isCargo ? (
            <>
              <h2 className="text-base font-semibold text-foreground">
                Book this container
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Cargo trips are booked as a full container — 1 × {trip.containerSize} with
                up to {trip.remainingLbs.toLocaleString()} lbs capacity.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold text-foreground">
                How much do you want to send?
              </h2>
              <div className="mt-4 flex items-center justify-center gap-5">
                <button
                  type="button"
                  onClick={() => bumpWeight(-1)}
                  aria-label="Decrease weight"
                  className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-border text-foreground active:bg-muted"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <div className="text-center">
                  <span className="text-3xl font-bold text-foreground">{weight}</span>
                  <span className="ml-1 text-sm text-muted-foreground">lbs</span>
                </div>
                <button
                  type="button"
                  onClick={() => bumpWeight(1)}
                  aria-label="Increase weight"
                  className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-border text-foreground active:bg-muted"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Available: {trip.remainingLbs} lbs
              </p>
            </>
          )}

          <Card className="mt-5 rounded-xl">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Price Summary</p>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    {isCargo
                      ? `1 × ${trip.containerSize} container`
                      : `${weight} lbs × ${formatCurrency(trip.pricePerLb)}`}
                  </dt>
                  <dd className="font-medium">{formatCurrency(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Service fee (10%)</dt>
                  <dd className="font-medium">{formatCurrency(serviceFee)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5">
                  <dt className="font-semibold text-foreground">Total</dt>
                  <dd className="font-bold text-foreground">{formatCurrency(total)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Button onClick={next} className="mt-5 w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90">
            Continue
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label>Item Category</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {trip.allowedItemTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={itemCategory === type}
                  onClick={() => setItemCategory(type)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-xs font-medium",
                    itemCategory === type
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-white text-muted-foreground"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Men's clothes, shoes, and gifts."
              className="bg-white mt-1.5 min-h-20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="declaredValue">Declared Value (optional)</Label>
            <Input
              id="declaredValue"
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="$150"
              className="h-12 bg-white mt-1.5"
              value={declaredValue}
              onChange={(e) => setDeclaredValue(e.target.value)}
            />
          </div>

          <div className="pt-1 border-t border-border">
            <p className="text-sm font-semibold text-foreground mt-3 mb-1">Recipient</p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="recipientName">Recipient name</Label>
                <Input
                  id="recipientName"
                  placeholder="Fatou Njie"
                  className="h-12 bg-white mt-1.5"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="recipientPhone">Phone (optional)</Label>
                  <Input
                    id="recipientPhone"
                    type="tel"
                    placeholder="+220 123 4567"
                    className="h-12 bg-white mt-1.5"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="recipientCity">City (optional)</Label>
                  <Input
                    id="recipientCity"
                    placeholder="Serrekunda"
                    className="h-12 bg-white mt-1.5"
                    value={recipientCity}
                    onChange={(e) => setRecipientCity(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(0)} className="flex-1 h-12 border-2 font-semibold">
              Back
            </Button>
            <Button onClick={next} className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90">
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-foreground">
            How should the traveler pick up your package?
          </h2>
          <div className="space-y-3" role="radiogroup" aria-label="Pickup preference">
            {PICKUP_PREFERENCES.map((p) => {
              const selected = pickupPreference === p.value
              return (
                <button
                  key={p.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setPickupPreference(p.value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border-2 bg-white p-4 text-left",
                    selected ? "border-primary" : "border-border"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2",
                      selected ? "border-primary bg-primary" : "border-border"
                    )}
                  >
                    {selected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>

          <div>
            <Label htmlFor="pickupInstructions">Pickup Instructions (optional)</Label>
            <Textarea
              id="pickupInstructions"
              placeholder="I'm available after 5PM on weekdays."
              className="bg-white mt-1.5 min-h-20"
              value={pickupInstructions}
              onChange={(e) => setPickupInstructions(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 border-2 font-semibold">
              Back
            </Button>
            <Button onClick={next} className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90">
              Review
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-foreground">Review your booking</h2>
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <dl className="space-y-2 text-sm">
                {isCargo ? (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Container</dt>
                    <dd className="font-medium">1 × {trip.containerSize}</dd>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Weight (est.)</dt>
                      <dd className="font-medium">{weight} lbs</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Price per lb</dt>
                      <dd className="font-medium">{formatCurrency(trip.pricePerLb)}</dd>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-medium">{formatCurrency(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Service fee (10%)</dt>
                  <dd className="font-medium">{formatCurrency(serviceFee)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <dt className="font-semibold">Estimated Total</dt>
                  <dd className="font-bold">{formatCurrency(total)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-medium">{itemCategory}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Recipient</dt>
                  <dd className="font-medium">{recipientName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Pickup</dt>
                  <dd className="font-medium">
                    {PICKUP_PREFERENCES.find((p) => p.value === pickupPreference)?.title}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center">
            {isCargo
              ? "Container bookings are a flat price. You'll pay after the carrier accepts your booking."
              : "Final price is based on verified pickup weight. You'll pay after the traveler accepts and verifies your package."}
          </p>

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 border-2 font-semibold">
              Back
            </Button>
            <Button onClick={submit} disabled={busy} className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90">
              {busy ? "Booking…" : "Request Booking"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
