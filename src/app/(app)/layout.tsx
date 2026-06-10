import { redirect } from "next/navigation"
import { BottomNav } from "@/components/layout/BottomNav"
import { getCurrentUser } from "@/lib/auth"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser()
  if (!current) redirect("/login")
  if (!current.dbUser) redirect("/onboarding")

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}
