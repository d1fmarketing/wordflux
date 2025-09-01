import { Inter, Poppins } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-body',
  display: 'swap'
})

const poppins = Poppins({ 
  weight: ['600', '700'], 
  subsets: ['latin'], 
  variable: '--font-display',
  display: 'swap'
})

export const metadata = { 
  title: "WordFlux", 
  description: "Clarity in motion - AI-powered board organization with GPT-5" 
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="bg-wf-navy text-wf-soft antialiased">
        {children}
      </body>
    </html>
  )
}