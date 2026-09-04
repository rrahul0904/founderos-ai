import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "FounderOS — Evidence to Product",
  description: "An evidence-first AI operating system for building products."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
