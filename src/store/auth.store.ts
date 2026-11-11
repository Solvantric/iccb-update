"use client";
// Demo auth — no real authentication, dashboard is always accessible
export const DEMO_USER = {
  id: "user-1",
  name: "Admin User",
  email: "admin@iccb.demo",
  role: "admin" as const,
};
