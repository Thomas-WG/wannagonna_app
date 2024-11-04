
import Navbar from '@/components/Sidebar';
import '@/styles/globals.css';
import { siteConfig } from '@/constant/config';

import { Roboto } from 'next/font/google';

const roboto = Roboto({ //main font for the whole app
  weight: ['400', '500', '700'],
  subsets: ['latin'],
});

export const metadata = {//this is to manage the metadata of the website (favicon, description...)
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.title}`,
  },
  description: siteConfig.description,
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon/favicon.ico',
    shortcut: '/favicon/favicon-96x96.png',
    apple: '/favicon/apple-touch-icon.png',
  },
  manifest: '/favicon/site.webmanifest',

   authors: [
    {
     name: 'Thomas BERTIN',
     url: 'https://www.wannagonna.org',
   },
 ],
};


export default function RootLayout({ children }) {
  return (
    <html lang="en" className={roboto.className}>
      <body className="h-screen flex overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
