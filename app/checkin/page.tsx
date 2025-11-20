"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const DEFAULT_CLUB_ID = "5337ea63-f5ab-4d50-bf22-ce0cb82c8a85"; // ⬅️ remplace

type Status = "loading" | "success" | "tooSoon" | "error";

export default function CheckinPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<Status>("loading");
  const [pointsAdded] = useState(10);
  const [totalPoints, setTotalPoints] = useState(0);
  const [minutesLeft, setMinutesLeft] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function handleCheckin() {
      try {
        setStatus("loading");
        setErrorMessage("");

        const { data: authData } = await supabase.auth.getUser();
        const user = authData.user;

        if (!user) {
          router.push("/login");
          return;
        }

        const clubIdFromUrl = searchParams.get("clubId");
        const clubId = clubIdFromUrl || DEFAULT_CLUB_ID;

        // Dernier checkin
        const { data: lastCheckin } = await supabase
          .from("checkins")
          .select("created_at")
          .eq("user_id", user.id)
          .eq("club_id", clubId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastCheckin?.created_at) {
          const lastDate = new Date(lastCheckin.created_at);
          const now = new Date();
          const diffMinutes =
            (now.getTime() - lastDate.getTime()) / (1000 * 60);

          const LIMIT_MINUTES = 120;
          if (diffMinutes < LIMIT_MINUTES) {
            setStatus("tooSoon");
            setMinutesLeft(
              Math.max(1, Math.round(LIMIT_MINUTES - diffMinutes))
            );
            return;
          }
        }

        // Nouveau checkin
        const { error: insertError } = await supabase.from("checkins").insert({
          user_id: user.id,
          club_id: clubId,
        });

        if (insertError) {
          console.error(insertError);
          setStatus("error");
          setErrorMessage(
            "Impossible d'enregistrer ta session. Réessaie dans un instant."
          );
          return;
        }

        // Points
        const { data: existingPoints } = await supabase
          .from("points")
          .select("total_points")
          .eq("user_id", user.id)
          .eq("club_id", clubId)
          .maybeSingle();

        const currentPoints = existingPoints?.total_points ?? 0;
        const newTotal = currentPoints + pointsAdded;

        if (existingPoints) {
          const { error: updateError } = await supabase
            .from("points")
            .update({ total_points: newTotal })
            .eq("user_id", user.id)
            .eq("club_id", clubId);

          if (updateError) console.error(updateError);
        } else {
          const { error: insertPointsError } = await supabase
            .from("points")
            .insert({
              user_id: user.id,
              club_id: clubId,
              total_points: newTotal,
            });

          if (insertPointsError) console.error(insertPointsError);
        }

        setTotalPoints(newTotal);
        setStatus("success");
      } catch (err: any) {
        console.error(err);
        setStatus("error");
        setErrorMessage(
          "Une erreur est survenue pendant le check-in. Réessaie dans un instant."
        );
      }
    }

    handleCheckin();
  }, [searchParams, router, pointsAdded]);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <main className="min-h-screen bg-[#0BA197] flex items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm text-white">{children}</div>
    </main>
  );

  if (status === "loading") {
    return (
      <Wrapper>
        <div className="bg-[#0F8A84] rounded-3xl p-6 shadow-xl flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold">Validation de ta session...</p>
            <p className="text-[11px] text-white/85">
              Ne ferme pas la page, on enregistre ton check-in et tes points.
            </p>
          </div>
        </div>
      </Wrapper>
    );
  }

  if (status === "error") {
    return (
      <Wrapper>
        <div className="bg-[#0F8A84] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center">
              <span className="text-lg">⚠️</span>
            </div>
            <div>
              <p className="text-sm font-semibold">Oups...</p>
              <p className="text-[11px] text-white/85">
                {errorMessage ||
                  "Impossible d'enregistrer ta session pour le moment."}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/")}
            className="w-full rounded-xl bg-white text-[#0F8A84] font-semibold py-2.5 text-sm"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </Wrapper>
    );
  }

  if (status === "tooSoon") {
    return (
      <Wrapper>
        <div className="bg-[#0F8A84] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center">
              <span className="text-lg">⏱️</span>
            </div>
            <div>
              <p className="text-sm font-semibold">Session déjà validée</p>
              <p className="text-[11px] text-white/85">
                Tu as déjà enregistré une session récemment dans ce club.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-white/85">
            Tu pourras re-scanner un court dans environ{" "}
            <span className="font-semibold">
              {minutesLeft} minute{minutesLeft > 1 ? "s" : ""}
            </span>
            . Cette limite permet d&apos;éviter les abus et de garder le
            classement fair-play.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full rounded-xl bg-white text-[#0F8A84] font-semibold py-2.5 text-sm"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </Wrapper>
    );
  }

  if (status === "success") {
    return (
      <Wrapper>
        <div className="bg-[#0F8A84] rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs uppercase tracking-[0.16em] text-white/85">
                Session validée
              </p>
              <p className="text-3xl font-extrabold leading-tight">
                +{pointsAdded} pts
              </p>
              <p className="text-[11px] text-white/85">
                Tes points ont bien été ajoutés pour cette session.
              </p>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-white/12 border border-white/15 space-y-1">
            <p className="text-[11px] text-white/85">
              Total actuel dans ce club
            </p>
            <p className="text-2xl font-semibold">{totalPoints} pts</p>
            <p className="text-[11px] text-white/80">
              Continue de scanner avant tes matchs pour grimper dans le
              classement.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push("/")}
              className="w-full rounded-xl bg-white text-[#0F8A84] font-semibold py-2.5 text-sm"
            >
              Retour à l&apos;accueil
            </button>
            <button
              onClick={() =>
                router.push(`/club/${DEFAULT_CLUB_ID}/leaderboard`)
              }
              className="w-full rounded-xl border border-white/40 bg-transparent text-white font-semibold py-2.5 text-sm"
            >
              Voir le classement du club
            </button>
          </div>
        </div>
      </Wrapper>
    );
  }

  return null;
}
