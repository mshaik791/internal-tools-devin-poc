"use server";

import { signIn, signOut } from "@internal/core/auth/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  await signIn(String(formData.get("sub")));
  const next = String(formData.get("next") ?? "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  await signOut();
  redirect("/login");
}
