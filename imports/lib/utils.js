import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fonction utilitaire pour combiner les classes CSS
 * - clsx : combine les classes conditionnellement
 * - twMerge : évite les conflits entre classes Tailwind
 * 
 * Exemple d'utilisation :
 * cn("px-4 py-2", condition && "bg-blue-500", "bg-red-500")
 * Résultat : "px-4 py-2 bg-red-500" (pas de conflit bg)
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
} 