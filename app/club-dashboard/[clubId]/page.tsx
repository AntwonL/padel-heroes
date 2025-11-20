"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ClubStats = {
  totalCheckins: number;
  weeklyCheckins: number;
  monthlyCheckins: number;
  uniquePlayers: number;
};

type LeaderRow = {
  user_id: string;
  username: string;
  total_points: number;
};

const CLUB_ID_DEFAULT = "5337ea63-f5ab-4d50-bf22-ce0cb82c8a85"; // ⬅️ même UUID que partout ailleurs

export default function ClubDashboardPage() {
  const params = useParams();
  const router = useRouter();

  const clubIdFromUrl = params?.clubId as string | undefined;
  const clubId = clubIdFromUrl || CLUB_ID_DEFAULT;

  const [stats, setStats] = useState<ClubStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        // Auth simple : on exige un user connecté (V0)
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) {
          console.error(authError);
          setError("Impossible de récupérer l'utilisateur.");
          return;
        }

        const user = authData.user;
        if (!user) {
          router.push("/login");
          return;
        }

        // === 1) Statistiques de checkins ===

        // Total checkins club
        const { data: totalCheckinsData, error: totalCheckinsError } =
          await supabase
            .from("checkins")
            .select("id, created_at, user_id")
            .eq("club_id", clubId);

        if (totalCheckinsError) {
          console.error(totalCheckinsError);
          setError("Impossible de récupérer les check-ins du club.");
          return;
        }

        const allCheckins = totalCheckinsData ?? [];
        const totalCheckins = allCheckins.length;

        // Joueurs uniques
        const uniquePlayers = new Set(
          allCheckins.map((c) => c.user_id)
        ).size;

        // Début de semaine (lundi)
        const now = new Date();
        const jsDay = now.getDay(); // 0 dimanche, 1 lundi...
        const diffToMonday = jsDay === 0 ? -6 : 1 - jsDay;
        const weekStart = new Date(now);
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(now.getDate() + diffToMonday);

        // Début de mois
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);

        const weeklyCheckins = allCheckins.filter((c) => {
          const d = new Date(c.created_at);
          return d >= weekStart;
        }).length;

        const monthlyCheckins = allCheckins.filter((c) => {
          const d = new Date(c.created_at);
          return d >= monthStart;
        }).length;

        setStats({
          totalCheckins,
          weeklyCheckins,
          monthlyCheckins,
          uniquePlayers,
        });

        // === 2) Leaderboard top 10 ===

        const {
          data: pointsData,
          error: pointsError,
        } = await supabase
          .from("points")
          .select("user_id, total_points")
          .eq("club_id", clubId)
          .order("total_points", { ascending: false })
          .limit(10);

        if (pointsError) {
          console.error(pointsError);
          setError("Impossible de récupérer le classement du club.");
          return;
        }

        const points = pointsData ?? [];
        const userIds = [...new Set(points.map((p) => p.user_id))];

        let usernamesMap: Record<string, string> = {};
        if (userIds.length > 0) {
          const {
            data: profilesData,
            error: profilesError,
          } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", userIds);

          if (profilesError) {
            console.error(profilesError);
            setError("Impossible de récupérer les profils joueurs.");
            return;
          }

          usernamesMap = Object.fromEntries(
            (profilesData ?? []).map((p) => [
              p.id,
              p.username || "Joueur",
            ])
          );
        }

        const mappedLeaderboard: LeaderRow[] = points.map((p) => ({
          user_id: p.user_id,
          total_points: p.total_points,
          username: usernamesMap[p.user_id] ?? "Joueur",
        }));

        setLeaderboard(mappedLeaderboard);
      } catch (err: any) {
        console.error(err);
        setError("Une erreur est survenue lors du chargement du dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [clubId, router]);

  // === UI Wrapper Style A ===
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <main className="min-h-screen bg-gradient-to-b from-[#042A2A] to-[#0A7E7E] text-white flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );

  if (loading) {
    return (
      <Wrapper>
        <div className="rounded-3xl bg-black/30 border border-white/15 px-5 py-6 flex flex-col items-center gap-4 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
          <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold">
              Chargement du dashboard club...
            </p>
            <p className="text-[11px] text-white/70">
              On récupère les statistiques du club.
            </p>
          </div>
        </div>
      </Wrapper>
    );
  }

  if (error || !stats) {
    return (
      <Wrapper>
        <div className="rounded-3xl bg-black/35 border border-red-300/40 px-5 py-6 flex flex-col gap-4 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-red-500/30 flex items-center justify-center border border-red-300/50">
              <span className="text-lg">⚠️</span>
            </div>
            <div>
              <p className="text-sm font-semibold">Oups...</p>
              <p className="text-[11px] text-white/75">
                {error || "Impossible de charger les statistiques du club."}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/")}
            className="mt-1 w-full rounded-2xl bg-white text-[#0A7E7E] font-semibold py-2.5 text-sm"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </Wrapper>
    );
  }

  // === UI Principal ===

  return (
    <Wrapper>
      <div className="space-y-5">
        {/* Header */}
        <header className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-[11px] text-white/70 hover:text-white flex items-center gap-1"
          >
            ← Accueil
          </button>
          <span className="px-2.5 py-1 rounded-full text-[10px] bg-white/10 border border-white/20">
            Dashboard club (BETA)
          </span>
        </header>

        {/* Titre */}
        <div>
          <h1 className="text-2xl font-bold leading-tight">
            Statistiques du club
          </h1>
          <p className="text-[11px] text-white/70 mt-1">
            Vue d&apos;ensemble de l&apos;activité PadelHeroes dans ce club.
          </p>
        </div>

        {/* Stat cards */}
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-black/25 border border-white/20 px-3 py-3">
            <p className="text-[10px] text-white/60">Check-ins totaux</p>
            <p className="text-xl font-semibold leading-tight">
              {stats.totalCheckins}
            </p>
            <p className="text-[10px] text-white/50 mt-1">
              Depuis le lancement
            </p>
          </div>
          <div className="rounded-2xl bg-black/25 border border-white/20 px-3 py-3">
            <p className="text-[10px] text-white/60">
              Joueurs ayant scanné
            </p>
            <p className="text-xl font-semibold leading-tight">
              {stats.uniquePlayers}
            </p>
            <p className="text-[10px] text-white/50 mt-1">
              Joueurs uniques
            </p>
          </div>
          <div className="rounded-2xl bg-black/25 border border-white/20 px-3 py-3">
            <p className="text-[10px] text-white/60">
              Check-ins cette semaine
            </p>
            <p className="text-xl font-semibold leading-tight">
              {stats.weeklyCheckins}
            </p>
            <p className="text-[10px] text-white/50 mt-1">
              Depuis lundi
            </p>
          </div>
          <div className="rounded-2xl bg-black/25 border border-white/20 px-3 py-3">
            <p className="text-[10px] text-white/60">
              Check-ins ce mois-ci
            </p>
            <p className="text-xl font-semibold leading-tight">
              {stats.monthlyCheckins}
            </p>
            <p className="text-[10px] text-white/50 mt-1">
              Depuis le 1er du mois
            </p>
          </div>
        </section>

        {/* Leaderboard top 10 */}
        <section className="rounded-3xl bg-black/25 border border-white/20 shadow-[0_18px_45px_rgba(0,0,0,0.45)] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <p className="text-sm font-semibold">Top 10 joueurs</p>
            <p className="text-[10px] text-white/60">
              Basé sur les points du club
            </p>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-4 text-[11px] text-white/70 text-center">
              Aucun joueur n&apos;a encore gagné de points dans ce club.
            </div>
          ) : (
            <ul className="divide-y divide-white/10">
              {leaderboard.map((row, index) => (
                <li
                  key={row.user_id}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 text-center text-sm">
                      {index + 1}.
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {row.username}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {row.total_points} pts
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-[9px] text-white/55 text-center mt-1">
          Dashboard club lite — V0 pour tests pilotes. Les données sont
          automatiquement mises à jour à chaque check-in.
        </p>
      </div>
    </Wrapper>
  );
}
