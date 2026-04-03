import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "KCMPICKS - Track Your Picks. Beat the Odds.",
  description: "Elite sports betting tracker for sharp bettors. NBA, NFL, MLB, Soccer, UFC, and College sports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} dark`}
    >
      <body className="min-h-full flex flex-col bg-surface text-on-surface font-body selection:bg-primary-container/30">
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
