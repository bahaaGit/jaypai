import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/layout/PageHeader"
import { TripForm, type TripFormValues } from "@/components/trips/TripForm"

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const current = await getCurrentUser()
  if (!current?.dbUser) redirect("/login")

  const trip = await prisma.trip.findUnique({ where: { id } })
  if (!trip) notFound()
  if (trip.travelerId !== current.dbUser.id && current.dbUser.role !== "ADMIN") {
    redirect("/trips/mine")
  }

  const initial: TripFormValues = {
    originCity: trip.originCity,
    originCountry: trip.originCountry,
    destinationCity: trip.destinationCity,
    destinationCountry: trip.destinationCountry,
    departureDate: trip.departureDate.toISOString().slice(0, 10),
    arrivalDate: trip.arrivalDate.toISOString().slice(0, 10),
    airline: trip.airline ?? "",
    availableWeightLbs: String(trip.availableWeightLbs),
    pricePerLb: String(trip.pricePerLb),
    pickupInstructions: trip.pickupInstructions ?? "",
    dropoffInstructions: trip.dropoffInstructions ?? "",
    allowedItemTypes: trip.allowedItemTypes,
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Edit Trip" />
      <TripForm initial={initial} tripId={trip.id} />
    </div>
  )
}
