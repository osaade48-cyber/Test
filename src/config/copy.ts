/**
 * Wording that must be identical everywhere it appears. Import from here —
 * never retype these sentences in a component.
 */
import { AUTO_CONFIRM_DAYS, BUYER_FEE_CAP, BUYER_FEE_FIXED, BUYER_FEE_PERCENT, FREE_SHIPPING_THRESHOLD } from "./business";
import { formatMoney } from "@/lib/format";

export const PAYOUT_RULE_POST = `Your payment is held securely and released to the seller when the buyer confirms they've received the item — or automatically ${AUTO_CONFIRM_DAYS} days after delivery if the buyer doesn't raise an issue.`;

export const PAYOUT_RULE_MEETUP = "For pickups and meetups, payment is released when the buyer scans the handover QR code.";

export const BUYER_FEE_RULE = `Buyers pay a protection fee of ${BUYER_FEE_PERCENT}% + ${formatMoney(BUYER_FEE_FIXED)}, capped at ${formatMoney(BUYER_FEE_CAP)} per order. Sellers pay nothing.`;

export const SHIPPING_RULE = `Shipping is calculated per seller. Spend ${formatMoney(FREE_SHIPPING_THRESHOLD)} or more with one seller and postage is free (covered by the seller). Pickups and meetups have no postage. Large items (prams, cots, high chairs) are pickup, meetup or calculated shipping only.`;

export const SELLER_SHIPPING_NOTE = `If a buyer spends ${formatMoney(FREE_SHIPPING_THRESHOLD)} or more with you in one order, you cover the postage. Large items are never included in free shipping.`;

export const NO_FEES_LINE = "No listing fees. No seller commissions.";

export const SAFETY_BADGE = "Safety checklist completed";
export const SAFETY_LINE = "Seller completed safety checklist";
export const SAFETY_EXPLAINER =
  "The seller answered Kindo's safety checklist for this type of item. It's their own declaration — Kindo hasn't inspected the item. Always check it yourself before you confirm a handover or delivery.";

export const SIGN_IN_LINE = "Secure sign-in with Google";

export const HANDOVER_WARNING = "Only confirm once you've checked the item. Confirming releases your payment to the seller and can't be undone.";
