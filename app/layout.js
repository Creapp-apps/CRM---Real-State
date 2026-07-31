import { Outfit, Inter } from "next/font/google";
import "./globals.css";

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
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${outfit.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
