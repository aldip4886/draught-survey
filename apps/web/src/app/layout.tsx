import type { ReactNode } from "react";
import "./globals.css";

export const metadata = { title: "Draught Survey VR", description: "Simulasi pelatihan draught survey" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
