"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(
    searchParams.get("error") === "auth"
      ? "That link expired or was already used. Please log in."
      : null
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginInput) => {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    if (error) {
      setServerError(
        error.message === "Invalid login credentials"
          ? "Wrong email or password."
          : error.message
      )
      return
    }
    router.push("/home")
    router.refresh()
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
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
          {isSubmitting ? "Logging in…" : "Log In"}
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
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Brand hero */}
      <div className="bg-primary px-6 pt-16 pb-10 rounded-b-3xl text-center">
        <h1 className="text-3xl font-bold text-white">Jaypai</h1>
        <p className="text-white/80 mt-2 text-sm">Send packages with trusted travelers.</p>
      </div>

      <div className="px-6 py-8 max-w-sm mx-auto w-full flex-1">
        <h2 className="text-xl font-bold text-foreground mb-5">Welcome back</h2>
        <Suspense>
          <LoginForm />
        </Suspense>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          New to Jaypai?{" "}
          <Link href="/signup" className="font-semibold text-primary underline">
            Get Started
          </Link>
        </p>
      </div>
    </div>
  )
}
