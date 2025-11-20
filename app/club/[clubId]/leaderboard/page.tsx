"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Row = {
  user_id: string;
  username: string;
  total_points: number;
};

const CLUB_ID_DEFAULT = "5337ea63-f5ab-4d50-bf22-ce0cb82c8a85"; // ⬅️ remplace par ton UUID de club

export default function LeaderboardPage() {
  const params = useParams();
  const router = useRouter();

  const clubIdFromUrl = params?.clubId as string | undefined;
  const clubId = clubIdFromUrl || CLUB_ID_DEFAULT;

  const [rows, setRows] = useState<Row[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        setError(null);

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
        setCurrentUserId(user.id);

        // Points du club
        const {
          data: pointsData,
          error: pointsError,
        } = await supabase
          .from("points")
          .select("user_id, total_points")
          .eq("club_id", clubId)
          .order("total_points", { ascending: false });

        if (pointsError) {
          console.error(pointsError);
          setError("Impossible de récupérer le classement du club.");
          return;
        }

        const points = pointsData ?? [];
        const userIds = [...new Set(points.map((p) => p.user_id))];

        // Profils (usernames)
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

        const mapped: Row[] = points.map((p) => ({
          user_id: p.user_id,
          total_points: p.total_points,
          username: usernamesMap[p.user_id] ?? "Joueur",
        }));

        setRows(mapped);
      } catch (err: any) {
        console.error(err);
        setError("Une erreur est survenue pendant le chargement.");
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, [clubId, router]);

  // Wrapper commun
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <main className="min-h-screen bg-[#0BA197] flex items-center justify-center px-5 py-8 text-white">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );

  if (loading) {
    return (
      <Wrapper>
        <div className="bg-[#0F8A84] rounded-3xl p-6 shadow-xl flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold">
              Chargement du classement...
            </p>
            <p className="text-[11px] text-white/85">
              On récupère les joueurs de ton club.
            </p>
          </div>
        </div>
      </Wrapper>
    );
  }

  if (error) {
    return (
      <Wrapper>
        <div className="bg-[#0F8A84] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center">
              <span className="text-lg">⚠️</span>
            </div>
            <div>
              <p className="text-sm font-semibold">Oups...</p>
              <p className="text-[11px] text-white/85">{error}</p>
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

  // Calcul de la position du joueur
  let playerRow: Row | null = null;
  let playerRank: number | null = null;

  rows.forEach((row, index) => {
    if (row.user_id === currentUserId) {
      playerRow = row;
      playerRank = index + 1;
    }
  });

  const NEXT_REWARD = 100;
  const playerPoints = playerRow?.total_points ?? 0;
  const progress =
    playerPoints > 0
      ? Math.min(100, Math.round((playerPoints / NEXT_REWARD) * 100))
      : 0;
  const pointsLeft = Math.max(0, NEXT_REWARD - playerPoints);

  return (
    <Wrapper>
      <div className="space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-[11px] text-white/90 hover:text-white flex items-center gap-1"
          >
            ← Accueil
          </button>
          <span className="px-2.5 py-1 rounded-full text-[10px] bg-white/15 border border-white/25">
            Classement du club
          </span>
        </header>

        <div className="bg-[#0F8A84] rounded-3xl p-6 shadow-xl space-y-4">
          <h1 className="text-xl font-semibold mb-1">Classement</h1>

          {/* Highlight du joueur */}
          {rows.length > 0 && playerRow && playerRank && (
            <div className="mb-3 p-4 bg-white/18 rounded-2xl border border-white/25 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/75">
                Ta position
              </p>
              <div className="flex items-center justify-between mt-2">
                <div className="space-y-0.5">
                  <p className="text-[13px] text-white/85">
                    Tu es{" "}
                    <span className="font-semibold text-white">
                      {playerRank}
                      <span className="align-super text-[9px]">ᵉ</span>
                    </span>{" "}
                    du club
                  </p>
                  <p className="text-[11px] text-white/80">
                    Score actuel :{" "}
                    <span className="font-semibold">
                      {playerPoints} pts
                    </span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-lg">
                  🏅
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[10px] text-white/80">
                  <span>Prochaine récompense</span>
                  <span>{NEXT_REWARD} pts</span>
                </div>
                <div className="w-full h-[10px] bg-white/20 rounded-full overflow-hidden flex items-center">
                  <div
                    className="h-[8px] ml-[1px] mr-[1px] rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-white/80 mt-1">
                  Plus que{" "}
                  <span className="font-semibold">
                    {pointsLeft} pts
                  </span>{" "}
                  pour atteindre le prochain palier.
                </p>
              </div>
            </div>
          )}

          {/* Liste des joueurs */}
          {rows.length === 0 ? (
            <p className="text-[12px] text-white/90">
              Aucun joueur n&apos;a encore de points dans ce club. Sois le
              premier à scanner un court !
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map((row, index) => {
                const isCurrent = row.user_id === currentUserId;
                return (
                  <li
                    key={row.user_id}
                    className={`flex items-center justify-between rounded-2xl px-3 py-2.5 ${
                      isCurrent
                        ? "bg-white/25 border border-white/35 shadow-md"
                        : "bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 text-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {row.username}
                        </span>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white text-[#0F8A84] font-semibold mt-1">
                            <span className="text-[11px]">⭐</span> Toi
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">
                        {row.total_points} pts
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Wrapper>
  );
}
