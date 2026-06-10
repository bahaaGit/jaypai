import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { OnboardingForm } from "./OnboardingForm"

export default async function OnboardingPage() {
  const current = await getCurrentUser()
  if (!current) redirect("/login")
  if (current.dbUser) redirect("/home")

  const defaultName =
    (current.authUser.user_metadata?.full_name as string | undefined) ?? ""

  return <OnboardingForm defaultName={defaultName} />
}
