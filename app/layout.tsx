import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import CustomCursor from "@/components/effects/CustomCursor";
import GrainOverlay from "@/components/effects/GrainOverlay";
import ScrollProgress from "@/components/effects/ScrollProgress";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GetAJobFaster",
  description: "Automated job application filler powered by Claude AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sourceSerif.variable} ${GeistMono.variable}`}>
      <body>
        <ScrollProgress />
        <GrainOverlay />
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
