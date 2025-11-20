"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";

export default function ClubQrPage() {
  const params = useParams();
  const router = useRouter();

  // Récupération du clubId depuis l'URL
  const clubIdParam = params?.clubId as string | undefined;

  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    if (!clubIdParam) return;
    if (typeof window === "undefined") return;

    const origin = window.location.origin;
    const url = `${origin}/checkin?clubId=${clubIdParam}`;
    setQrUrl(url);
  }, [clubIdParam]);

  if (!clubIdParam) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white border border-slate-300 rounded-2xl px-6 py-4 shadow-sm">
          <p className="text-sm text-slate-800">
            Aucun clubId fourni dans l&apos;URL.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-3 text-xs text-white bg-slate-800 rounded-lg px-3 py-1.5"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-4 py-6 print:bg-white">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-300 shadow-md p-6 flex flex-col gap-6 print:shadow-none print:border-0">
        {/* Bandeau haut */}
        <header className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#0A7E7E]/10 flex items-center justify-center border border-[#0A7E7E]/30">
              <span className="text-xl">🎾</span>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-slate-900">
                PadelHeroes
              </p>
              <p className="text-[11px] text-slate-500 -mt-0.5">
                Scan &amp; gagne des points
              </p>
            </div>
          </div>
          <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Court lié au club
          </span>
        </header>

        {/* Bloc principal avec QR */}
        <section className="flex flex-col items-center gap-4">
          <p className="text-center text-sm font-semibold text-slate-900">
            Scanne ce QR code avant ta session
          </p>
          <p className="text-center text-[11px] text-slate-600 max-w-sm">
            Ouvre l&apos;appareil photo de ton téléphone, pointe-le vers ce QR
            code et suis le lien pour valider ta présence. Tu gagneras des
            points dans le classement du club.
          </p>

          <div className="mt-2 p-4 rounded-3xl border border-slate-200 bg-slate-50">
            {qrUrl ? (
              <QRCodeCanvas
                value={qrUrl}
                size={220}
                includeMargin={true}
                level="H"
              />
            ) : (
              <div className="w-[220px] h-[220px] flex items-center justify-center text-xs text-slate-500">
                Génération du QR...
              </div>
            )}
          </div>

          <div className="text-center text-[11px] text-slate-500 mt-1">
            Lien :{" "}
            <span className="break-all font-mono text-[10px]">
              {qrUrl || "en cours de génération..."}
            </span>
          </div>
        </section>

        {/* Instructions joueur */}
        <section className="border-t border-slate-200 pt-4">
          <p className="text-[11px] font-semibold text-slate-800 mb-1">
            Rappel pour les joueurs
          </p>
          <ol className="list-decimal list-inside text-[11px] text-slate-600 space-y-0.5">
            <li>Scanne ce QR au début de ta session.</li>
            <li>Connecte-toi si ce n&apos;est pas déjà fait.</li>
            <li>Valide la session pour gagner des points dans ce club.</li>
          </ol>
        </section>

        {/* Zone actions (non imprimée) */}
        <section className="flex items-center justify-between gap-3 mt-1 print:hidden">
          <button
            onClick={() => router.push("/")}
            className="text-xs text-slate-700 border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 hover:bg-slate-100"
          >
            Retour à l&apos;accueil
          </button>
          <button
            onClick={() => window.print()}
            className="text-xs text-white bg-[#0A7E7E] rounded-xl px-3 py-2 font-semibold hover:bg-[#0b8f8f]"
          >
            Imprimer cette affiche
          </button>
        </section>

        <footer className="mt-2 text-center text-[9px] text-slate-400 print:text-[8px]">
          PadelHeroes — Gamification des clubs de padel. Collez cette affiche
          près de l&apos;entrée du court.
        </footer>
      </div>
    </main>
  );
}
