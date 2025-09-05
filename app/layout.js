import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { getBoard } from './lib/board'

// Force dynamic rendering to avoid static pre-render of home
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

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

export default async function RootLayout({ children }) {
  let initialBoard = null
  try {
    initialBoard = await getBoard(true)
  } catch {}
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="">
        <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
        {initialBoard ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__WF_INITIAL_BOARD = ${JSON.stringify(initialBoard).replace(/</g, '\\u003c')};`,
            }}
          />
        ) : null}
        {children}
      </body>
    </html>
  )
}
