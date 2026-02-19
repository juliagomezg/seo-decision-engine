import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "SEO Decision Engine — Decisiones de contenido SEO con IA",
  description:
    "Analiza keywords, elige ángulos de contenido y genera landing pages optimizadas para SEO local con gates de aprobación humana. Optimizado para AEO y GEO.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "SEO Decision Engine",
    description:
      "Genera contenido SEO local optimizado para featured snippets y asistentes IA con aprobación humana en cada paso.",
    type: "website",
    locale: "es_MX",
    siteName: "SEO Decision Engine",
  },
  twitter: {
    card: "summary_large_image",
    title: "SEO Decision Engine",
    description:
      "Genera contenido SEO local optimizado para featured snippets y asistentes IA.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
