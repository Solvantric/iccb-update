import type { Metadata } from "next";
import { SignInPage } from "@/components/dashboard/pages/SignInPage";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return <SignInPage />;
}
