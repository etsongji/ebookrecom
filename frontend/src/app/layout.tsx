import type { Metadata } from "next";
import { Caveat, Cormorant_Garamond, Gowun_Batang, IBM_Plex_Mono, IBM_Plex_Sans_KR } from "next/font/google";
import SiteHeader from "../components/SiteHeader";
import "./globals.css";

// Korean faces ship only latin subsets for preloading; their Hangul glyphs load on demand.
const plexKr = IBM_Plex_Sans_KR({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-plex-kr",
  display: "swap",
  preload: false,
});

const gowun = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-gowun",
  display: "swap",
  preload: false,
});

const cormorant = Cormorant_Garamond({
  weight: ["500", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});

const caveat = Caveat({
  weight: ["500", "700"],
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "구텐베르크 원서 서재",
  description: "Project Gutenberg의 무료 영어 원서를 수준별로 고르고 명문장을 따라 써 보는 독서·필사 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontVars = [plexKr, gowun, cormorant, plexMono, caveat].map((f) => f.variable).join(" ");

  return (
    <html lang="ko" className={fontVars}>
      <body>
        <div className="sheet">
          <SiteHeader />
          {children}
          <footer className="page site-footer">
            <p>
              <a href="https://www.gutenberg.org" target="_blank" rel="noopener noreferrer">
                Project Gutenberg
              </a>
              의 저작권이 만료된 공개 도서를 활용한 교육용 프로젝트입니다.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
