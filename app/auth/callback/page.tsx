"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function syncProfile() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (user) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!existing) {
          await supabase.from("profiles").insert({
            id: user.id,
            username: user.email?.split("@")[0] || "Joueur",
          });
        }
      }

      router.push("/");
    }

    syncProfile();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p>Connexion en cours...</p>
    </main>
  );
}
