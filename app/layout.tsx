import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreatorOS",
  description: "Monetize your audience. No per-sale fees.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
