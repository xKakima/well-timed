import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Well Timed Collective — A considered watch marketplace",
    template: "%s | Well Timed Collective",
  },
  description:
    "A more considered way to discover, collect, and consign exceptional timepieces.",
  applicationName: "Well Timed Collective",
  openGraph: {
    title: "Well Timed Collective — A considered watch marketplace",
    description:
      "A more considered way to discover, collect, and consign exceptional timepieces.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f2ed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
