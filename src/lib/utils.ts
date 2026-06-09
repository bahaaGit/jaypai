import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function formatWeight(lbs: number): string {
  return `${lbs} lbs`
}

export function calculateServiceFee(subtotal: number, rate = 0.1): number {
  return Math.round(subtotal * rate * 100) / 100
}

export function calculateTotal(weightLbs: number, pricePerLb: number): {
  subtotal: number
  serviceFee: number
  total: number
} {
  const subtotal = Math.round(weightLbs * pricePerLb * 100) / 100
  const serviceFee = calculateServiceFee(subtotal)
  const total = Math.round((subtotal + serviceFee) * 100) / 100
  return { subtotal, serviceFee, total }
}
