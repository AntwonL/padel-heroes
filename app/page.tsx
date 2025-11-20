"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const CLUB_ID = "5337ea63-f5ab-4d50-bf22-ce0cb82c8a85"; // ⬅️ à remplacer
const WEEKLY_GOAL = 2;

export default function HomePage() {
  const [profile, setProfile] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [weeklyPlayed, setWeeklyPlayed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        window.location.href = "/login";
        return;
      }

      const { data: p } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", auth.user.id)
        .maybeSingle();

      setProfile(p?.username ?? "Joueur");

      const { data: pts } = await supabase
        .from("points")
        .select("total_points")
        .eq("user_id", auth.user.id)
        .eq("club_id", CLUB_ID)
        .maybeSingle();

      setPoints(pts?.total_points ?? 0);

      const now = new Date();
      const monday = new Date(now);
      const day = now.getDay() || 7;
      monday.setDate(now.getDate() - day + 1);
      monday.setHours(0, 0, 0, 0);

      const { data: w } = await supabase
        .from("checkins")
        .select("id")
        .eq("user_id", auth.user.id)
        .eq("club_id", CLUB_ID)
        .gte("created_at", monday.toISOString());

      setWeeklyPlayed(w?.length ?? 0);

      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0BA197] flex items-center justify-center text-white text-sm">
        Chargement...
      </main>
    );
  }

  const NEXT_REWARD = 100;
  const progress = Math.min(100, Math.round((points / NEXT_REWARD) * 100));
  const pointsLeft = Math.max(0, NEXT_REWARD - points);

  return (
    <main className="min-h-screen bg-[#0BA197] flex justify-center px-5 py-8 text-white">
      <div className="w-full max-w-sm space-y-6">
        {/* ---- CARD 1 ---- */}
        <div className="bg-[#0F8A84] rounded-3xl p-6 shadow-xl space-y-5">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-white/80">Bonjour</p>
              <p className="text-2xl font-semibold">{profile}</p>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full bg-white/15 border border-white/20">
              BETA
            </span>
          </div>

          <p className="text-[14px] leading-relaxed text-white/90">
            Scanne le QR code du court pour commencer à jouer et gagner des
            points.
          </p>

          <Link
            href="/checkin"
            className="block w-full bg-white text-[#0F8A84] rounded-xl font-semibold text-center py-3 text-[16px] shadow-md active:scale-[0.97]"
          >
            SCANNER
          </Link>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="rounded-2xl p-4 space-y-1 bg-white/12 border border-white/15 shadow-sm">
              <p className="text-xs text-white/85">Points</p>
              <p className="text-3xl font-bold">{points}</p>
              <p className="text-[11px] text-white/80">
                {pointsLeft} pts avant récompense
              </p>
            </div>
            <div className="rounded-2xl p-4 space-y-1 bg-white/12 border border-white/15 shadow-sm">
              <p className="text-xs text-white/85">Sessions semaine</p>
              <p className="text-3xl font-bold">
                {weeklyPlayed} / {WEEKLY_GOAL}
              </p>
              <p className="text-[11px] text-white/80">
                Objectif : {WEEKLY_GOAL}
              </p>
            </div>
          </div>
        </div>

        {/* ---- CARD 2 ---- */}
        <div className="bg-[#0F8A84] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between text-xs text-white/85">
            <span>Prochaine récompense</span>
            <span>{NEXT_REWARD} pts</span>
          </div>

          {/* Barre de progression plus visible */}
          <div className="w-full h-[14px] bg-white/28 rounded-full overflow-hidden flex items-center">
            <div
              className="h-[10px] ml-[2px] mr-[2px] rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-[11px] text-white/85 leading-relaxed">
            Continue de scanner à chaque session pour monter dans le classement
            de ton club.
          </p>
        </div>

        {/* ---- BOT BUTTONS ---- */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={`/club/${CLUB_ID}/leaderboard`}
            className="bg-[#0F8A84] rounded-2xl p-4 shadow-md space-y-1 hover:bg-[#0E7C7C] transition"
          >
            <p className="text-xs text-white/80">Classement</p>
            <p className="text-sm font-semibold">Voir ta position</p>
            <p className="text-[11px] text-white/70">Top joueurs du club</p>
          </Link>

          <div className="bg-[#0F8A84]/95 rounded-2xl p-4 shadow-md space-y-1">
            <p className="text-xs text-white/80">Récompenses</p>
            <p className="text-sm font-semibold">Bientôt dispo</p>
            <p className="text-[11px] text-white/70">En préparation</p>
          </div>
        </div>
      </div>
    </main>
  );
}
