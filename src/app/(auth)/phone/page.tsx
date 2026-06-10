"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { phoneSchema } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/layout/PageHeader"

const OTP_LENGTH = 6

export default function PhonePage() {
  const router = useRouter()
  const [step, setStep] = useState<"phone" | "code">("phone")
  const [phone, setPhone] = useState("")
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  const sendCode = async () => {
    setError(null)
    const parsed = phoneSchema.safeParse(phone)
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }
    setBusy(true)
    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: parsed.data,
    })
    setBusy(false)
    if (otpError) {
      setError(
        /sms|provider|disabled/i.test(otpError.message)
          ? "Phone sign-in isn't available yet. Please use email instead."
          : otpError.message
      )
      return
    }
    setPhone(parsed.data)
    setStep("code")
  }

  const verifyCode = async (token: string) => {
    setError(null)
    setBusy(true)
    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    })
    setBusy(false)
    if (verifyError) {
      setError("That code didn't match. Try again.")
      setDigits(Array(OTP_LENGTH).fill(""))
      inputsRef.current[0]?.focus()
      return
    }
    router.push("/onboarding")
    router.refresh()
  }

  const onDigitChange = (index: number, value: string) => {
    const v = value.replace(/\D/g, "").slice(-1)
    const next = [...digits]
    next[index] = v
    setDigits(next)
    if (v && index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus()
    const full = next.join("")
    if (full.length === OTP_LENGTH) verifyCode(full)
  }

  const onDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="" className="bg-background border-b-0" />
      <div className="px-6 pt-2 pb-10 max-w-sm mx-auto">
        {step === "phone" ? (
          <>
            <h1 className="text-2xl font-bold text-foreground">Continue with phone</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              We&apos;ll text you a 6-digit code to verify your number.
            </p>

            <div className="mt-6 space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                placeholder="+220 123 4567"
                autoComplete="tel"
                className="h-12 bg-white"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {error && (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button
              onClick={sendCode}
              disabled={busy}
              className="mt-5 w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
            >
              {busy ? "Sending…" : "Send Code"}
            </Button>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Prefer email?{" "}
              <Link href="/signup" className="font-medium text-primary underline">
                Sign up with email
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground">Verify your phone</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Enter the 6-digit code sent to{" "}
              <span className="font-medium text-foreground">{phone}</span>
            </p>

            <div className="mt-6 flex justify-between gap-2">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el
                  }}
                  value={d}
                  onChange={(e) => onDigitChange(i, e.target.value)}
                  onKeyDown={(e) => onDigitKeyDown(i, e)}
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  aria-label={`Digit ${i + 1}`}
                  className="h-14 w-12 rounded-xl border border-border bg-white text-center text-xl font-semibold text-foreground focus:border-primary focus:outline-none"
                />
              ))}
            </div>

            {error && (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button
              onClick={() => verifyCode(digits.join(""))}
              disabled={busy || digits.join("").length !== OTP_LENGTH}
              className="mt-6 w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
            >
              {busy ? "Verifying…" : "Verify Code"}
            </Button>

            <button
              onClick={() => {
                setStep("phone")
                setDigits(Array(OTP_LENGTH).fill(""))
                setError(null)
              }}
              className="mt-4 w-full text-center text-sm font-medium text-primary"
            >
              Use a different number
            </button>
          </>
        )}
      </div>
    </div>
  )
}
