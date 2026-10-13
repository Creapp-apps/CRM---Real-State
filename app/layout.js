import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { getSiteContentCached } from "@/lib/siteContentServer";
import ThemeStyle from "@/components/ThemeStyle";

export const dynamic = "force-dynamic";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  metadataBase: new URL("https://cardosopropiedades.com.ar"),
  title: "Cardoso Propiedades | Inmobiliaria Premium",
  description:
    "Encontrá tu próximo hogar con Mónica Cardoso Propiedades. Venta, alquiler y tasaciones de propiedades premium.",
  keywords: [
    "inmobiliaria",
    "propiedades",
    "venta",
    "alquiler",
    "tasaciones",
    "Cardoso Propiedades",
  ],
  openGraph: {
    title: "Cardoso Propiedades | Inmobiliaria Premium",
    description:
      "Encontrá tu próximo hogar con Mónica Cardoso Propiedades. Venta, alquiler y tasaciones de propiedades premium.",
    url: "https://cardosopropiedades.com.ar",
    siteName: "Cardoso Propiedades",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cardoso Propiedades | Inmobiliaria Premium",
    description:
      "Encontrá tu próximo hogar con Mónica Cardoso Propiedades. Venta, alquiler y tasaciones de propiedades premium.",
  },
};

export default async function RootLayout({ children }) {
  const { theme } = await getSiteContentCached();
  return (
    <html lang="es">
      <head>
        <ThemeStyle theme={theme} />
      </head>
      <body className={`${outfit.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
