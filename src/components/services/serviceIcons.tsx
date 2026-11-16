"use client";
import { createElement, type ComponentType } from "react";
import {
  Buildings, ForkKnife, Sparkle, CalendarCheck, Crown, Package, Users, Car, SlidersHorizontal, Lightning,
  UserCircleCheck, CookingPot, BowlFood, ShieldCheck, ChefHat, Receipt, Cake, Flower, Lightbulb, FrameCorners,
  Palette, Ruler, SpeakerHigh, IdentificationCard, Camera, ClipboardText, Door, Storefront, SquaresFour, Truck,
  Globe, Megaphone, UsersThree, type IconProps,
} from "@phosphor-icons/react";

const ICONS: Record<string, ComponentType<IconProps>> = {
  Buildings, ForkKnife, Sparkle, CalendarCheck, Crown, Package, Users, Car, SlidersHorizontal, Lightning,
  UserCircleCheck, CookingPot, BowlFood, ShieldCheck, ChefHat, Receipt, Cake, Flower, Lightbulb, FrameCorners,
  Palette, Ruler, SpeakerHigh, IdentificationCard, Camera, ClipboardText, Door, Storefront, SquaresFour, Truck,
  Globe, Megaphone, UsersThree,
};

/** Renders a service icon by name (static lookup, safe to use in render). */
export function ServiceIcon({ name, ...props }: IconProps & { name: string }) {
  return createElement(ICONS[name] ?? Sparkle, props);
}
