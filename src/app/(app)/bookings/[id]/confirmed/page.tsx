import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Check, ArrowRight } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatTripDate } from "@/components/trips/TripCard"
import { formatCurrency } from "@/lib/utils"

export default async function BookingConfirmedPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const current = await getCurrentUser()
  if (!current?.dbUser) redirect("/login")

  const booking = await prisma.booking.findFirst({
    where: { id, senderId: current.dbUser.id },
    include: {
      trip: {
        select: {
          originCity: true,
          destinationCity: true,
          departureDate: true,
          arrivalDate: true,
        },
      },
      traveler: { select: { fullName: true } },
    },
  })
  if (!booking) notFound()

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
        <Check className="h-9 w-9 text-primary" />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-white">Booking Requested!</h1>
      <p className="mt-2 max-w-xs text-sm text-white/85">
        Your package is booked with {booking.traveler.fullName}. You&apos;ll be
        notified when they accept your package.
      </p>

      <div className="mt-6 w-full max-w-xs rounded-2xl bg-white/10 p-4 text-left">
        <p className="text-xs font-medium text-white/70">Booking {booking.bookingCode}</p>
        <div className="mt-1.5 flex items-center gap-2 text-base font-bold text-white">
          <span>{booking.trip.originCity}</span>
          <ArrowRight className="h-4 w-4 text-white/70" />
          <span>{booking.trip.destinationCity}</span>
        </div>
        <p className="mt-0.5 text-xs text-white/80">
          {formatTripDate(booking.trip.departureDate.toISOString())} —{" "}
          {formatTripDate(booking.trip.arrivalDate.toISOString())}
        </p>
        <p className="mt-1.5 text-sm font-medium text-white">
          {booking.estimatedWeightLbs} lbs · est. {formatCurrency(booking.estimatedTotal)}
        </p>
      </div>

      <div className="mt-8 flex w-full max-w-xs gap-3">
        <Link
          href={`/bookings/${booking.id}`}
          className="flex-1 rounded-xl bg-white py-3 text-sm font-semibold text-primary"
        >
          View Booking
        </Link>
        <Link
          href="/home"
          className="flex-1 rounded-xl border-2 border-white/40 py-3 text-sm font-semibold text-white"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
