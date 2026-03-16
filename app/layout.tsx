import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Culinary Cloud | Your Personal AI Cookbook",
  description:
    "Save recipes from anywhere on the web, build smart grocery lists, plan your meals, and keep your kitchen organized, all in one place.",
  metadataBase: new URL("https://www.culinary-cloud.com"),
  openGraph: {
    title: "Culinary Cloud | Your Personal AI Cookbook",
    description:
      "Save recipes from anywhere on the web, build smart grocery lists, plan your meals, and keep your kitchen organized.",
    url: "https://www.culinary-cloud.com",
    siteName: "Culinary Cloud",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Culinary Cloud | Your Personal AI Cookbook",
    description:
      "Save recipes from anywhere on the web, build smart grocery lists, and plan your meals.",
    creator: "@BasZak25",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "1762e98699a44b7db19bd9188fcef9fe"}'
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
