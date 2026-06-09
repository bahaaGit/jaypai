import { BottomNav } from "@/components/layout/BottomNav"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}
