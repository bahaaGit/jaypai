import { describe, it, expect } from "vitest"
import { calculateTotal, calculateServiceFee, formatCurrency, formatWeight } from "@/lib/utils"

describe("calculateServiceFee", () => {
  it("calculates 10% fee correctly", () => {
    expect(calculateServiceFee(100)).toBe(10)
    expect(calculateServiceFee(137.5)).toBe(13.75)
  })
})

describe("calculateTotal", () => {
  it("calculates subtotal, service fee and total for weight + price/lb", () => {
    const result = calculateTotal(25, 5)
    expect(result.subtotal).toBe(125)
    expect(result.serviceFee).toBe(12.5)
    expect(result.total).toBe(137.5)
  })

  it("rounds to 2 decimal places", () => {
    const result = calculateTotal(27, 5)
    expect(result.subtotal).toBe(135)
    expect(result.serviceFee).toBe(13.5)
    expect(result.total).toBe(148.5)
  })
})

describe("formatCurrency", () => {
  it("formats USD amounts", () => {
    expect(formatCurrency(137.5)).toBe("$137.50")
    expect(formatCurrency(0)).toBe("$0.00")
  })
})

describe("formatWeight", () => {
  it("appends lbs label", () => {
    expect(formatWeight(25)).toBe("25 lbs")
  })
})
