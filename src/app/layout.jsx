import "./globals.css";

export const metadata = {
  title: "Servis motornih vozila - Održavanje voznog parka",
  description: "Interaktivna analitika održavanja voznog parka, skladišne mehanizacije i KPI komparacija"
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
      </head>
      <body className="bg-gradient-to-br from-slate-50 via-indigo-50/40 to-blue-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-800 dark:text-slate-100 font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
