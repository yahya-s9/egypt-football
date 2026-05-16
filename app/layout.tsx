import type { Metadata } from "next";
import { Rajdhani } from "next/font/google";
import NavBar from "@/components/NavBar";
import "./globals.css";

const rajdhani = Rajdhani({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-rajdhani",
});

export const metadata: Metadata = {
  title: { default: "Egypt Football — All-Time Database", template: "%s | Egypt Football" },
  description: "The complete historical record of the Egyptian national football team.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${rajdhani.variable} h-full`}>
      <body
        className="min-h-full flex flex-col bg-eg-bg text-eg-text"
        style={{ fontFamily: "var(--font-rajdhani), system-ui, sans-serif" }}
      >
        <NavBar />
        <div className="flex-1">{children}</div>
        <footer className="mt-12 border-t border-eg-border bg-white py-8 text-center text-xs text-eg-muted">
          Egypt National Football Team — Historical Database
        </footer>
      </body>
    </html>
  );
}
