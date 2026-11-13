import type { MenuPackage } from "@/types/crm";
import { base } from "./_helpers";

const s = { isSample: true };
export const menuPackagesSeed: MenuPackage[] = [
  { ...base("menu-mughal-classic", s), name: "Mughal Classic", cuisine: "Mughal", perHead: 1450, published: true, items: ["Kacchi biryani", "Chicken roast", "Borhani", "Firni", "Salad"] },
  { ...base("menu-mughal-royal", s), name: "Mughal Royal", cuisine: "Mughal", perHead: 1850, published: true, items: ["Mutton kacchi", "Chicken roast", "Beef rezala", "Jali kabab", "Borhani", "Shahi tukra"] },
  { ...base("menu-continental", s), name: "Continental Buffet", cuisine: "Continental", perHead: 1650, published: true, items: ["Cream soup", "Grilled chicken", "Fish fillet", "Pasta", "Dessert bar"] },
  { ...base("menu-multi-grand", s), name: "Multi-Cuisine Grand", cuisine: "Multi-cuisine", perHead: 2200, published: true, items: ["Thai soup", "Kacchi", "Chinese vegetables", "Grilled fish", "Live dessert counter"] },
  { ...base("menu-corporate-lunch", s), name: "Corporate Lunch Box", cuisine: "Multi-cuisine", perHead: 650, published: true, items: ["Polao", "Chicken curry", "Vegetable", "Dessert", "Water"] },
  { ...base("menu-breakfast", s), name: "Breakfast", cuisine: "Breakfast", perHead: 350, published: true, items: ["Paratha", "Egg", "Vegetable", "Tea/Coffee"] },
  { ...base("menu-snacks", s), name: "Evening Snacks", cuisine: "Snacks", perHead: 280, published: true, items: ["Samosa", "Sandwich", "Pastry", "Tea/Coffee"] },
];
