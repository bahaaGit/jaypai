import { describe, it, expect } from "vitest"
import {
  signupSchema,
  loginSchema,
  phoneSchema,
  otpSchema,
  onboardingSchema,
  profileUpdateSchema,
} from "@/lib/validations/auth"

describe("signupSchema", () => {
  it("accepts a valid signup", () => {
    const r = signupSchema.safeParse({
      fullName: "Musa Jallow",
      email: "Musa@Example.com",
      password: "supersecret",
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.email).toBe("musa@example.com") // lowercased
  })

  it("rejects short passwords", () => {
    expect(
      signupSchema.safeParse({
        fullName: "Musa Jallow",
        email: "musa@example.com",
        password: "short",
      }).success
    ).toBe(false)
  })

  it("rejects invalid email", () => {
    expect(
      signupSchema.safeParse({
        fullName: "Musa Jallow",
        email: "not-an-email",
        password: "supersecret",
      }).success
    ).toBe(false)
  })

  it("rejects missing full name", () => {
    expect(
      signupSchema.safeParse({
        fullName: "M",
        email: "musa@example.com",
        password: "supersecret",
      }).success
    ).toBe(false)
  })
})

describe("phoneSchema", () => {
  it("accepts international format", () => {
    expect(phoneSchema.safeParse("+2201234567").success).toBe(true)
    expect(phoneSchema.safeParse("+12065551234").success).toBe(true)
  })

  it("rejects local format and garbage", () => {
    expect(phoneSchema.safeParse("1234567").success).toBe(false)
    expect(phoneSchema.safeParse("+0123").success).toBe(false)
    expect(phoneSchema.safeParse("hello").success).toBe(false)
  })
})

describe("otpSchema", () => {
  it("requires exactly 6 digits", () => {
    expect(otpSchema.safeParse({ phone: "+2201234567", token: "482913" }).success).toBe(true)
    expect(otpSchema.safeParse({ phone: "+2201234567", token: "48291" }).success).toBe(false)
    expect(otpSchema.safeParse({ phone: "+2201234567", token: "48291a" }).success).toBe(false)
  })
})

describe("onboardingSchema", () => {
  it("accepts valid roles", () => {
    for (const role of ["SENDER", "TRAVELER", "BOTH"]) {
      expect(onboardingSchema.safeParse({ fullName: "Musa Jallow", role }).success).toBe(true)
    }
  })

  it("rejects ADMIN and unknown roles", () => {
    expect(onboardingSchema.safeParse({ fullName: "Musa", role: "ADMIN" }).success).toBe(false)
    expect(onboardingSchema.safeParse({ fullName: "Musa", role: "WIZARD" }).success).toBe(false)
  })

  it("allows optional empty city/country", () => {
    expect(
      onboardingSchema.safeParse({ fullName: "Musa Jallow", role: "SENDER", city: "", country: "" })
        .success
    ).toBe(true)
  })
})

describe("loginSchema", () => {
  it("requires a password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false)
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true)
  })
})

describe("profileUpdateSchema", () => {
  it("accepts partial updates", () => {
    expect(profileUpdateSchema.safeParse({ city: "Banjul" }).success).toBe(true)
    expect(profileUpdateSchema.safeParse({}).success).toBe(true)
  })

  it("rejects role escalation to ADMIN", () => {
    expect(profileUpdateSchema.safeParse({ role: "ADMIN" }).success).toBe(false)
  })
})
