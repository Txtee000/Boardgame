import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "วงไพ่ | เกมไพ่สำหรับวงเพื่อน",
  description: "จั่วไพ่ ส่งตา และสนุกกับกฎใหม่ในวงเพื่อน",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
