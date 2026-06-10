import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CAPACITY_HOLDING_STATUSES } from "@/lib/validations/booking"
import { PageHeader } from "@/components/layout/PageHeader"
import { BookingForm } from "@/components/bookings/BookingForm"

export default async function BookTripPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const current = await getCurrentUser()
  if (!current?.dbUser) redirect("/login")

  const trip = await prisma.trip.findFirst({
    where: { id, status: "PUBLISHED", departureDate: { gte: new Date() } },
    include: {
      traveler: { select: { fullName: true, ratingAverage: true } },
    },
  })
  if (!trip) notFound()

  if (trip.travelerId === current.dbUser.id) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Book This Trip" />
        <div className="px-6 pt-20 text-center">
          <h1 className="text-lg font-bold text-foreground">This is your trip</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You can&apos;t book your own trip.
          </p>
          <Link
            href="/trips/mine"
            className="mt-5 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Manage my trips
          </Link>
        </div>
      </div>
    )
  }

  const reserved = await prisma.booking.aggregate({
    where: { tripId: trip.id, status: { in: [...CAPACITY_HOLDING_STATUSES] } },
    _sum: { estimatedWeightLbs: true },
  })
  const remainingLbs = Math.max(
    0,
    trip.availableWeightLbs - (reserved._sum.estimatedWeightLbs ?? 0)
  )

  if (remainingLbs < 1) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Book This Trip" />
        <div className="px-6 pt-20 text-center">
          <h1 className="text-lg font-bold text-foreground">Trip is fully booked</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All the space on this trip has been reserved.
          </p>
          <Link
            href="/trips"
            className="mt-5 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Find another trip
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Book This Trip" />
      <BookingForm
        trip={{
          id: trip.id,
          originCity: trip.originCity,
          destinationCity: trip.destinationCity,
          departureDate: trip.departureDate.toISOString(),
          arrivalDate: trip.arrivalDate.toISOString(),
          pricePerLb: trip.pricePerLb,
          remainingLbs,
          allowedItemTypes: trip.allowedItemTypes,
          traveler: trip.traveler,
        }}
      />
    </div>
  )
}
