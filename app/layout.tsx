import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import CustomCursor from "@/components/effects/CustomCursor";
import GrainOverlay from "@/components/effects/GrainOverlay";
import ScrollProgress from "@/components/effects/ScrollProgress";
import ThemeToggle from "@/components/effects/ThemeToggle";
import { AppProvider } from "@/components/AppProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/layout/Navbar";

// Runs before paint: applies the saved theme so there is no flash of the wrong
// palette. Kept tiny and synchronous.
const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

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
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${sourceSerif.variable} ${GeistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <ThemeProvider>
          <AppProvider>
            <ScrollProgress />
            <GrainOverlay />
            <CustomCursor />
            <ThemeToggle />
            <Navbar />
            {children}
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
