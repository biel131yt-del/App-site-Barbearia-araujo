import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utilitário padrão shadcn/ui — junta classes Tailwind sem conflito
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
