import { notFound } from "next/navigation"
import {
  Star,
  BadgeCheck,
  ArrowRight,
  Scale,
  DollarSign,
  MapPin,
  Flag,
  Plane,
  Route,
} from "lucide-react"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { initialsOf, formatTripDate } from "@/components/trips/TripCard"
import { Badge } from "@/components/ui/badge"

export default async function TripDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const trip = await prisma.trip.findFirst({
    where: { id, status: "PUBLISHED" },
    include: {
      traveler: {
        select: {
          fullName: true,
          ratingAverage: true,
          completedTrips: true,
          isIdVerified: true,
          city: true,
          country: true,
        },
      },
    },
  })
  if (!trip) notFound()

  const t = trip.traveler
  const firstName = t.fullName.split(/\s+/)[0]

  const infoRows = [
    { icon: Scale, label: "Available Space", value: `${trip.availableWeightLbs} lbs` },
    { icon: DollarSign, label: "Price per lb", value: `$${trip.pricePerLb.toFixed(2)}` },
    ...(trip.pickupInstructions
      ? [{ icon: MapPin, label: "Pickup Location", value: trip.pickupInstructions }]
      : []),
    ...(trip.dropoffInstructions
      ? [{ icon: Flag, label: "Drop-off Location", value: trip.dropoffInstructions }]
      : []),
    ...(trip.airline ? [{ icon: Plane, label: "Airline", value: trip.airline }] : []),
    { icon: Route, label: "Trip Type", value: "One-way" },
  ]

  return (
    <div className="min-h-screen bg-background pb-28">
      <PageHeader title="" />
      <div className="px-4 max-w-sm mx-auto">
        {/* Traveler */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
            {initialsOf(t.fullName)}
          </div>
          <div>
            <p className="flex items-center gap-1 text-base font-semibold text-foreground">
              {t.fullName}
              {t.isIdVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {t.ratingAverage > 0 ? t.ratingAverage.toFixed(1) : "New"}
              {t.completedTrips > 0 && ` (${t.completedTrips} trips)`}
            </p>
          </div>
        </div>

        {/* Route */}
        <div className="mt-5 flex items-center gap-2 text-xl font-bold text-foreground">
          <span>{trip.originCity}</span>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
          <span>{trip.destinationCity}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatTripDate(trip.departureDate.toISOString())} —{" "}
          {formatTripDate(trip.arrivalDate.toISOString())}
        </p>

        {/* Info rows */}
        <Card className="mt-5 rounded-xl">
          <CardContent className="divide-y divide-border p-0">
            {infoRows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3">
                <Icon className="h-4 w-4 flex-shrink-0 text-primary" />
                <span className="flex-1 text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium text-foreground text-right max-w-[55%]">
                  {value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Allowed items */}
        {trip.allowedItemTypes.length > 0 && (
          <div className="mt-5">
            <h2 className="text-sm font-semibold text-foreground mb-2">Allowed Items</h2>
            <div className="flex flex-wrap gap-2">
              {trip.allowedItemTypes.map((item) => (
                <Badge
                  key={item}
                  className="bg-primary/10 text-primary border-0 font-medium"
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* About traveler */}
        <div className="mt-5">
          <h2 className="text-sm font-semibold text-foreground mb-2">About {firstName}</h2>
          <p className="text-sm text-muted-foreground">
            {t.completedTrips > 0
              ? `${firstName} has completed ${t.completedTrips} trip${t.completedTrips === 1 ? "" : "s"} on Jaypai`
              : `${firstName} is new to Jaypai`}
            {t.city || t.country
              ? ` and is based in ${[t.city, t.country].filter(Boolean).join(", ")}.`
              : "."}
          </p>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-16 left-0 right-0 border-t border-border bg-white p-4">
        <div className="max-w-sm mx-auto">
          <Button
            disabled
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
          >
            Book This Trip
          </Button>
          <p className="mt-1.5 text-center text-xs text-muted-foreground">
            Booking opens soon
          </p>
        </div>
      </div>
    </div>
  )
}
