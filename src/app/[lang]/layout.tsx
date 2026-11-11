import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Inter, Noto_Sans_KR } from "next/font/google";
import "../globals.css";
import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { SITE_NAME, siteUrl } from "@/lib/seo";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SiteAnalytics } from "@/components/site-analytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// Variable fonts: one file per character range for every weight, instead of one per weight (about a third of the CSS).
// Korean is needed on every page (clinic names). Japanese and Chinese use system fonts: see globals.css.
const notoKr = Noto_Sans_KR({ variable: "--font-noto-kr", display: "swap", preload: false });

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    metadataBase: new URL(siteUrl()),
    // The template applies to child pages; pages in this segment (the home page) use the default.
    title: { default: dict.meta.title, template: `%s | ${SITE_NAME}` },
    description: dict.meta.description,
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <html
      lang={lang === "zh" ? "zh-CN" : lang}
      className={`${inter.variable} ${notoKr.variable}`}
    >
      <body className="min-h-dvh flex flex-col">
        <Suspense fallback={<div className="h-[72px] border-b border-border md:h-[88px]" />}>
          <Header lang={lang} dict={dict} />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Footer lang={lang} dict={dict} />
        <SiteAnalytics />
      </body>
    </html>
  );
}
