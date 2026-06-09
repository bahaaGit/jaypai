import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-white">GambiaBridge</h1>
        <p className="text-white/80 mt-2 text-sm">Send packages with trusted travelers.</p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <Button asChild className="w-full h-12 bg-white text-primary hover:bg-white/90 font-semibold text-base">
          <Link href="/signup">Get Started</Link>
        </Button>
        <p className="text-center text-white/70 text-sm">
          Already have an account?{" "}
          <Link href="/signup" className="text-white font-medium underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
