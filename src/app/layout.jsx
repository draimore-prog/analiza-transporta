import "./globals.css";

export const metadata = {
  title: "Bingo MotorFix | Transportna Flota & Servis",
  description:
    "Centralni informacioni sistem za upravljanje voznim parkom, skladišnom mehanizacijom, terenskim radnim nalozima i servisom Bingo d.o.o. Tuzla.",
  applicationName: "Bingo MotorFix",
  authors: [{ name: "Bingo d.o.o. - Sektor transporta i servisa" }],
  keywords: [
    "Bingo MotorFix",
    "Bingo d.o.o.",
    "Servis vozila",
    "Skladišna mehanizacija",
    "Viljuškari",
    "Teretni transport",
    "Terenski radni nalozi",
    "Vozni park",
    "Održavanje flote"
  ],
  icons: {
    icon: [
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.png", sizes: "192x192", type: "image/png" }
    ],
    apple: [
      { url: "/icon.png", sizes: "512x512", type: "image/png" }
    ]
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Bingo MotorFix | Transportna Flota & Servis",
    description: "Sistem za upravljanje voznim parkom, mehanizacijom i servisnim radnim nalozima",
    type: "website",
    locale: "bs_BA"
  }
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover"
};

export default function RootLayout({ children }) {
  return (
    <html lang="bs">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-gradient-to-br from-slate-50 via-indigo-50/40 to-blue-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-800 dark:text-slate-100 font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
