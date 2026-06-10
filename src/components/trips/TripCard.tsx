import Link from "next/link"
import { Star, BadgeCheck, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export interface TripCardData {
  id: string
  originCity: string
  originCountry: string
  destinationCity: string
  destinationCountry: string
  departureDate: string
  arrivalDate: string
  availableWeightLbs: number
  pricePerLb: number
  traveler: {
    fullName: string
    ratingAverage: number
    completedTrips: number
    isIdVerified: boolean
    profilePhoto: string | null
  }
}

export function formatTripDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function TripCard({ trip }: { trip: TripCardData }) {
  const t = trip.traveler
  return (
    <Link
      href={`/trips/${trip.id}`}
      aria-label={`View trip ${trip.originCity} to ${trip.destinationCity}`}
      className="block"
    >
      <Card
        className="rounded-xl border-border transition-colors active:bg-muted/50"
        data-testid="trip-card"
      >
        <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {initialsOf(t.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-sm font-semibold text-foreground truncate">
              {t.fullName}
              {t.isIdVerified && <BadgeCheck className="h-4 w-4 flex-shrink-0 text-primary" />}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {t.ratingAverage > 0 ? t.ratingAverage.toFixed(1) : "New"}
              {t.completedTrips > 0 && <span>· {t.completedTrips} trips</span>}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <span>{trip.originCity}</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <span>{trip.destinationCity}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatTripDate(trip.departureDate)} — {formatTripDate(trip.arrivalDate)}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
              {trip.availableWeightLbs} lbs available
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              ${trip.pricePerLb} / lb
            </span>
          </div>
          <span className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white">
            View
          </span>
        </div>
        </CardContent>
      </Card>
    </Link>
  )
}
