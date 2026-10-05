import { redirect } from "next/navigation";

export default function RootPage() {
  // This should never be reached because middleware handles all redirects
  // But as a safety fallback, redirect to login
  redirect("/login");
}
