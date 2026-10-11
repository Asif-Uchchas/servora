import type { DiscountType } from "@prisma/client";

export function roundMoney(n: number) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}

interface PricedItem {
    price: number;
    offerPrice: number | null;
    discounts?: {
        discountType: DiscountType;
        discountValue: number;
        startDate: Date | string;
        endDate: Date | string;
        isActive: boolean;
    }[];
}

/**
 * The price a guest pays for one unit right now: the offer price if set, then
 * the best currently-running discount applied on top. Used by both the POS and
 * the public menu so they always agree.
 */
export function effectivePrice(item: PricedItem, now = new Date()) {
    const base = item.offerPrice ?? item.price;
    let best = base;
    for (const d of item.discounts ?? []) {
        if (!d.isActive || new Date(d.startDate) > now || new Date(d.endDate) < now) continue;
        const discounted =
            d.discountType === "PERCENTAGE" ? base * (1 - d.discountValue / 100) : base - d.discountValue;
        best = Math.min(best, Math.max(0, discounted));
    }
    return roundMoney(best);
}

export function computeTotals(subtotal: number, taxRatePercent: number, tip = 0) {
    const taxAmount = roundMoney((subtotal * taxRatePercent) / 100);
    const tipAmount = roundMoney(tip);
    return {
        subtotal: roundMoney(subtotal),
        taxAmount,
        tipAmount,
        totalAmount: roundMoney(subtotal + taxAmount + tipAmount),
    };
}
