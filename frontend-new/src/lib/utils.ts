import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Return a valid Date or null — never produces an Invalid Date.
 */
export function safeDate(value?: string | Date | null): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Return an ISO string or null — never throws "Invalid time value".
 */
export function safeISO(value?: string | Date | null): string | null {
  const d = safeDate(value);
  return d ? d.toISOString() : null;
}
