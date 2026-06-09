import Link from "next/link"
import { Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-white">
        <div>
          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Jaypai</p>
          <h1 className="text-xl font-bold text-foreground mt-0.5">
            Send packages<br />with trusted<br />travelers.
          </h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-3">
        <Button asChild className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90">
          <Link href="/trips/search">
            <Search className="h-5 w-5 mr-2" />
            Find a Trip
          </Link>
        </Button>

        <Button asChild variant="outline" className="w-full h-12 text-base font-semibold border-2">
          <Link href="/trips/post">
            <Plus className="h-5 w-5 mr-2" />
            Post a Trip
          </Link>
        </Button>
      </div>

      {/* How it works */}
      <div className="px-4 mt-2">
        <h2 className="text-sm font-semibold text-foreground mb-3">How it works</h2>
        <div className="space-y-3">
          {[
            { step: "1", title: "Find a Trip", desc: "Search for travelers going to your destination." },
            { step: "2", title: "Book & Pay", desc: "Agree on weight, pay securely and get your delivery pass." },
            { step: "3", title: "Pickup & Deliver", desc: "Your package is delivered safely to the recipient." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">{step}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
