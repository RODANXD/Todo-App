import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
export function formatDate(dateString) {
  try {
    return format(new Date(dateString), "MMM d")
  } catch (error) {
    return "Invalid date"
  }
}