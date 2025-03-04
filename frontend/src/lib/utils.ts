import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNow, isToday, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPostDate(dateString?: string): string {
  if (!dateString) return "Just now"; // Default for undefined values

  try {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, "dd/MM/yyyy");
  } catch (error) {
    console.log("Error parsing date:", dateString, error);
    return "Invalid date";
  }
}
