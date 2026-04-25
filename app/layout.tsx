import type { Metadata } from "next";
import "./globals.css";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: {
    default: "CreatorOS",
    template: "%s | CreatorOS",
  },
  description: "Monetize your audience. No per-sale fees.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>
          {children}
          <Analytics />
        </PostHogProvider>
      </body>
    </html>
  );
}
