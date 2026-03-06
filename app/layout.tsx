import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'ENEM Tracker - Meu Desempenho',
  description: 'Acompanhe seu progresso nos estudos para o ENEM',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
