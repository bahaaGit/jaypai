"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, MailCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { signupSchema, type SignupInput } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/layout/PageHeader"

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) })

  const onSubmit = async (values: SignupInput) => {
    setServerError(null)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        data: { full_name: values.fullName },
      },
    })

    if (error) {
      setServerError(error.message)
      return
    }

    // Email confirmation enabled → user must click the link first.
    if (data.user && !data.session) {
      setEmailSent(values.email)
      return
    }

    router.push("/onboarding")
    router.refresh()
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
          <MailCheck className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Check your email</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">
          We sent a confirmation link to <span className="font-medium text-foreground">{emailSent}</span>.
          Tap it to finish creating your account.
        </p>
        <Link href="/login" className="mt-6 text-sm font-medium text-primary underline">
          Back to log in
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="" className="bg-background border-b-0" />
      <div className="px-6 pt-2 pb-10 max-w-sm mx-auto">
        <h1 className="text-2xl font-bold text-foreground">Create your account</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              autoComplete="name"
              className="h-12 bg-white"
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              className="h-12 bg-white"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                autoComplete="new-password"
                className="h-12 bg-white pr-11"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? "Creating account…" : "Sign Up"}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or continue with</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button asChild variant="outline" className="mt-4 w-full h-12 font-medium border-2">
          <Link href="/phone">Phone number</Link>
        </Button>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
