"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Plane, BookOpen, MessageCircle, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/trips", label: "Trips", icon: Plane },
  { href: "/bookings", label: "Bookings", icon: BookOpen },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
