import { createSupabaseServer } from "./supabase-server";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export async function requireBuyer(): Promise<User> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");
  return user;
}

export async function getBuyer(): Promise<User | null> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
