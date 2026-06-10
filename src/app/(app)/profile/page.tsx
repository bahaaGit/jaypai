import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { ProfileView } from "./ProfileView"

export default async function ProfilePage() {
  const current = await getCurrentUser()
  if (!current) redirect("/login")
  if (!current.dbUser) redirect("/onboarding")

  const u = current.dbUser
  return (
    <ProfileView
      user={{
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        role: u.role,
        city: u.city,
        country: u.country,
        trustScore: u.trustScore,
        ratingAverage: u.ratingAverage,
        completedTrips: u.completedTrips,
        isEmailVerified: u.isEmailVerified,
        isPhoneVerified: u.isPhoneVerified,
      }}
    />
  )
}
