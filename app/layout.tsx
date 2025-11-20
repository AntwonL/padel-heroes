// app/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Padel Heroes",
  description: "Gagne des points en checkant tes sessions de padel.",
  // PWA
  manifest: "/manifest.json",
  themeColor: "#0BA197",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Padel Heroes",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-[#0BA197] text-white antialiased">
        {children}

        {/* Enregistrement du Service Worker PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ("serviceWorker" in navigator) {
                window.addEventListener("load", () => {
                  navigator.serviceWorker
                    .register("/sw.js")
                    .catch(() => {
                      console.log("SW registration failed");
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
