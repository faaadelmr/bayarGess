import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  title: 'BayarGess | AI Splitbill by faaadelmr',
  description: 'Kalo kamu abis makan-makan terus ribet buat bagi-bagiin tagihan ke temen2🙈 laknat!? pakai app ini untuk mempermudah pembagian nya.',
  keywords: ['split bill', 'bayar patungan', 'bagi tagihan', 'patungan', 'bill splitter', 'ai split bill', 'bayargess'],
  openGraph: {
    title: 'BayarGess | AI Splitbill Cerdas & Mudah',
    description: 'Bagi tagihan makan jadi gampang! Upload struk, BayarGess akan hitung secara otomatis dan adil pakai AI. Coba sekarang!',
    url: 'https://bayargess.vercel.app',
    siteName: 'BayarGess',
    images: [
      {
        url: 'https://bayargess.vercel.app/og-image.png', 
        height: 826,
        alt: 'BayarGess - AI Split Bill',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BayarGess | AI Splitbill Cerdas & Mudah',
    description: 'Bagi tagihan makan jadi gampang! Upload struk, BayarGess akan hitung secara otomatis dan mudah pakai AI. Coba sekarang!',
    images: ['https://bayargess.vercel.app/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet"></link>
      </head>
      <body className="font-body antialiased">
        {children}
        <SpeedInsights />
        <Toaster />
      </body>
    </html>
  );
}
