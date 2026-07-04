import type { Metadata } from "next";
import "@shopify/polaris/build/esm/styles.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Shopify AI Dynamic Pricing Assistant",
  description: "AI-powered Shopify dynamic pricing assessment app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
