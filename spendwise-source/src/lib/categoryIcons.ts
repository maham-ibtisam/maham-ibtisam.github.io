import {
  Car,
  Film,
  GraduationCap,
  HeartPulse,
  Home,
  Package,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Users,
  Utensils,
  Zap,
  type LucideIcon,
} from 'lucide-react'

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'shopping-cart': ShoppingCart,
  car: Car,
  home: Home,
  zap: Zap,
  utensils: Utensils,
  users: Users,
  'shopping-bag': ShoppingBag,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  film: Film,
  sparkles: Sparkles,
  package: Package,
}

export function iconFor(key: string): LucideIcon {
  return CATEGORY_ICONS[key] ?? Package
}

export const ICON_OPTIONS = Object.keys(CATEGORY_ICONS)
