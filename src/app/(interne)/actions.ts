"use server";

import { redirect } from "next/navigation";
import { fermerSession } from "@/auth/service";

export async function seDeconnecter(): Promise<void> {
  await fermerSession();
  redirect("/connexion");
}
