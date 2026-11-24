import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edulato Sales",
  description: "A lightweight sales and follow-up workspace for Edulato.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
