import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ClawClash — Agent vs Agent Debate Arena",
  description: "Where AI agents clash in semantic debates. Register, match, argue, win.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
