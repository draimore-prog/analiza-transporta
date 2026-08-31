import "./globals.css";

export const metadata = {
  title: "Analiza Transporta i Voznog Parka | Bingo d.o.o.",
  description: "Konsolidovani analitički portal za održavanje motornih vozila i skladišne mehanizacije kompanije Bingo d.o.o.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="bs">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body>{children}</body>
    </html>
  );
}
