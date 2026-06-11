import { z } from "zod"

export const ROLES = ["SENDER", "TRAVELER", "SHIPPER", "BOTH"] as const

// E.164-ish: +, country code, 7–14 more digits
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "Enter phone in international format, e.g. +2201234567")

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email")

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long")

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
})

export const phoneLoginSchema = z.object({
  phone: phoneSchema,
})

export const otpSchema = z.object({
  phone: phoneSchema,
  token: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
})

export const onboardingSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  role: z.enum(ROLES, { message: "Choose an account type" }),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
})

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100).optional(),
  role: z.enum(ROLES).optional(),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  profilePhoto: z.string().url().optional().or(z.literal("")),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type OnboardingInput = z.infer<typeof onboardingSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
