import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "วงเล่น | เกมสำหรับวงเพื่อน",
  description: "เลือกเกมวงไพ่หรือทอยลูกเต๋า 3D แล้วสนุกด้วยกันในวงเพื่อน",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
