import Link from "next/link"
import { redirect } from "next/navigation"
import { Plane } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { canPostTrips } from "@/lib/validations/trip"
import { PageHeader } from "@/components/layout/PageHeader"
import { TripForm } from "@/components/trips/TripForm"

export default async function PostTripPage() {
  const current = await getCurrentUser()
  if (!current?.dbUser) redirect("/login")

  if (!canPostTrips(current.dbUser.role)) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Post a Trip" />
        <div className="flex flex-col items-center px-6 pt-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Plane className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-foreground">Become a traveler</h1>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Your account is set up as a sender. Switch to Traveler or Both in your
            profile to post trips and earn money from your luggage space.
          </p>
          <Link
            href="/profile"
            className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Update account type
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Post a Trip" />
      <TripForm />
    </div>
  )
}
