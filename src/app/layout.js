// app/layout.js
import Navbar from '@/components/Sidebar';
import '@/styles/globals.css';

import { Roboto } from 'next/font/google';

const roboto = Roboto({ //main font for the whole app
  weight: ['400', '500', '700'],
  subsets: ['latin'],
});

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
