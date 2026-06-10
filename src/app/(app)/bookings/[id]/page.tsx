import { notFound, redirect } from "next/navigation"
import { ArrowRight, Star, BadgeCheck } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatTripDate, initialsOf } from "@/components/trips/TripCard"
import { formatCurrency, cn } from "@/lib/utils"
import { PICKUP_PREFERENCES } from "@/lib/validations/booking"

const STATUS_LABEL: Record<string, { label: string; style: string }> = {
  PENDING_TRAVELER_ACCEPTANCE: { label: "Pending acceptance", style: "bg-amber-100 text-amber-700" },
  PACKAGE_ACCEPTED: { label: "Package accepted", style: "bg-primary/10 text-primary" },
  WEIGHT_VERIFIED: { label: "Weight verified", style: "bg-primary/10 text-primary" },
  PAYMENT_AUTHORIZED: { label: "Paid", style: "bg-primary/10 text-primary" },
  DELIVERY_PASS_GENERATED: { label: "Delivery pass ready", style: "bg-primary/10 text-primary" },
  IN_TRANSIT: { label: "In transit", style: "bg-blue-100 text-blue-700" },
  ARRIVED: { label: "Arrived", style: "bg-blue-100 text-blue-700" },
  RECIPIENT_VERIFIED: { label: "Recipient verified", style: "bg-primary/10 text-primary" },
  DELIVERED: { label: "Delivered", style: "bg-primary/10 text-primary" },
  CANCELLED: { label: "Cancelled", style: "bg-destructive/10 text-destructive" },
  DISPUTED: { label: "Disputed", style: "bg-destructive/10 text-destructive" },
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const current = await getCurrentUser()
  if (!current?.dbUser) redirect("/login")

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      trip: {
        select: {
          originCity: true,
          destinationCity: true,
          departureDate: true,
          arrivalDate: true,
          airline: true,
        },
      },
      sender: { select: { id: true, fullName: true } },
      traveler: {
        select: { id: true, fullName: true, ratingAverage: true, isIdVerified: true },
      },
    },
  })

  const me = current.dbUser
  if (
    !booking ||
    (booking.senderId !== me.id && booking.travelerId !== me.id && me.role !== "ADMIN")
  ) {
    notFound()
  }

  const status = STATUS_LABEL[booking.status] ?? {
    label: booking.status,
    style: "bg-muted text-muted-foreground",
  }
  const iAmSender = booking.senderId === me.id
  const otherParty = iAmSender ? booking.traveler : booking.sender
  const pickupLabel =
    PICKUP_PREFERENCES.find((p) => p.value === booking.pickupPreference)?.title ??
    booking.pickupPreference

  return (
    <div className="min-h-screen bg-background pb-10">
      <PageHeader title={`Booking ${booking.bookingCode}`} />
      <div className="px-4 py-4 max-w-sm mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base font-bold text-foreground">
            <span>{booking.trip.originCity}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span>{booking.trip.destinationCity}</span>
          </div>
          <Badge className={cn("border-0 text-xs", status.style)}>{status.label}</Badge>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">
          {formatTripDate(booking.trip.departureDate.toISOString())} —{" "}
          {formatTripDate(booking.trip.arrivalDate.toISOString())}
          {booking.trip.airline && ` · ${booking.trip.airline}`}
        </p>

        {/* Other party */}
        <Card className="rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {initialsOf(otherParty.fullName)}
            </div>
            <div>
              <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
                {otherParty.fullName}
                {iAmSender && booking.traveler.isIdVerified && (
                  <BadgeCheck className="h-4 w-4 text-primary" />
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {iAmSender ? (
                  <span className="flex items-center gap-1">
                    Traveler
                    {booking.traveler.ratingAverage > 0 && (
                      <span className="flex items-center gap-0.5">
                        · <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {booking.traveler.ratingAverage.toFixed(1)}
                      </span>
                    )}
                  </span>
                ) : (
                  "Sender"
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Package + price */}
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Estimated weight</dt>
                <dd className="font-medium">{booking.estimatedWeightLbs} lbs</dd>
              </div>
              {booking.verifiedWeightLbs != null && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Verified weight</dt>
                  <dd className="font-medium">{booking.verifiedWeightLbs} lbs</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Price per lb</dt>
                <dd className="font-medium">{formatCurrency(booking.pricePerLb)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Service fee</dt>
                <dd className="font-medium">{formatCurrency(booking.serviceFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="font-semibold">
                  {booking.finalTotal != null ? "Final total" : "Estimated total"}
                </dt>
                <dd className="font-bold">
                  {formatCurrency(booking.finalTotal ?? booking.estimatedTotal)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <dl className="space-y-2 text-sm">
              {booking.packageDescription && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground flex-shrink-0">Package</dt>
                  <dd className="font-medium text-right">{booking.packageDescription}</dd>
                </div>
              )}
              {booking.declaredValue != null && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Declared value</dt>
                  <dd className="font-medium">{formatCurrency(booking.declaredValue)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Recipient</dt>
                <dd className="font-medium">{booking.recipientName}</dd>
              </div>
              {booking.recipientCity && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Recipient city</dt>
                  <dd className="font-medium">{booking.recipientCity}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Pickup</dt>
                <dd className="font-medium">{pickupLabel}</dd>
              </div>
              {booking.pickupInstructions && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground flex-shrink-0">Instructions</dt>
                  <dd className="font-medium text-right">{booking.pickupInstructions}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {booking.status === "PENDING_TRAVELER_ACCEPTANCE" && iAmSender && (
          <p className="text-center text-xs text-muted-foreground">
            Waiting for {booking.traveler.fullName} to accept your package. Final
            price is based on verified pickup weight.
          </p>
        )}
      </div>
    </div>
  )
}
