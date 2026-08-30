import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import { LanguageProvider } from "@/context/LanguageContext";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  metadataBase: new URL(
    "https://kiranaprakashsharma9.github.io/kiranaprakashsharma9/"
  ),

  title: {
    default: "Kiranaprakashsharma | Authentic Vedic Purohit in Srirangapatna",
    template: "%s | Kiranaprakashsharma",
  },

  description:
    "Book expert Vedic Purohit Kiranaprakashsharma in Srirangapatna for Shuba & Ashuba ceremonies: Vivaha, Gruhapravesha, Narayana Bali, and Asthi Visarjana.",

  keywords: [
    "Purohit in Srirangapatna",
    "Vedic rituals",
    "Shuba events",
    "Ashuba events",
    "Gruhapravesha pooja",
    "Asthi Visarjana Srirangapatna",
    "Hindu priest",
    "Narayana Bali pooja",
    "Pitru Dosha Parihara",
    "Srirangapatna pandit",
  ],

  authors: [
    {
      name: "Kiranaprakashsharma",
    },
  ],

  creator: "Kiranaprakashsharma",

  publisher: "Kiranaprakashsharma",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  alternates: {
    canonical: "/",
  },

  icons: [
    { rel: "icon", url: "/Koundinya_maharshi.jpeg", type: "image/jpeg" },
    { rel: "shortcut icon", url: "/Koundinya_maharshi.jpeg", type: "image/jpeg" },
    { rel: "apple-touch-icon", url: "/Koundinya_maharshi.jpeg", type: "image/jpeg" },
  ],

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kiranaprakashsharma9.github.io/kiranaprakashsharma9/",
    siteName: "Kiranaprakashsharma9",

    title:
      "Kiranaprakashsharma9 | Authentic Vedic Purohit in Srirangapatna",

    description:
      "Book expert Vedic Purohit Kiranaprakashsharma in Srirangapatna for Shuba & Ashuba ceremonies: Vivaha, Gruhapravesha, Narayana Bali, and Asthi Visarjana.",

    images: [
      {
        url: "/preview_img.png",
        width: 1200,
        height: 630,
        alt: "Kiranaprakashsharma9 | Authentic Vedic Purohit",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title:
      "Kiranaprakashsharma9 | Authentic Vedic Purohit in Srirangapatna",

    description:
      "Book expert Vedic Purohit Kiranaprakashsharma in Srirangapatna for Shuba & Ashuba ceremonies: Vivaha, Gruhapravesha, Narayana Bali, and Asthi Visarjana.",

    images: ["/preview_img.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-LTVTD5BZM0"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LTVTD5BZM0');
          `,
        }} />
      </head>
      {/* Added overflow-x-hidden and max-w-full to prevent horizontal scrolling */}
      <body className="overflow-x-hidden max-w-full pt-16" suppressHydrationWarning>
        <LanguageProvider>
          <Navbar />

          {children}

          <Footer />

          <FloatingActions />
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
