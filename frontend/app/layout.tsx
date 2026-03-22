import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import { Theme } from "@radix-ui/themes";
import "./globals.css";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Career Advisor',
  description: 'โค้ชอาชีพส่วนตัวด้วย AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <Theme>
          {children}
        </Theme>
      </body>
    </html>
  )
}