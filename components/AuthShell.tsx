import Link from 'next/link'
import { Film } from 'lucide-react'

interface AuthShellProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  /** Headline shown on the cinematic side panel (desktop only) */
  headline?: React.ReactNode
  eyebrow?: string
}

/**
 * Shared two-panel layout for login / reset-password / any other auth page.
 * Left: cinematic banner panel (hidden on mobile). Right: the form.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
  eyebrow = 'MovieBlogger',
  headline = (
    <>
      Pick up where the <span className="text-gold-400">credits left off.</span>
    </>
  ),
}: AuthShellProps) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] bg-ink-950 lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden lg:block">
        <img src="/banner.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-ink-950" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400 text-ink-950">
              <Film size={18} />
            </span>
            <span className="mb-display text-xl font-semibold text-white">
              Movie<span className="text-gold-400">Blogger</span>
            </span>
          </Link>
          <div>
            <p className="mb-eyebrow mb-4">{eyebrow}</p>
            <h2 className="mb-display max-w-md text-4xl font-semibold leading-tight text-white">{headline}</h2>
          </div>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="animate-fade-up w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400 text-ink-950">
              <Film size={18} />
            </span>
            <span className="mb-display text-xl font-semibold text-white">
              Movie<span className="text-gold-400">Blogger</span>
            </span>
          </Link>

          <h1 className="mb-display text-3xl font-semibold text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-gray-400">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  )
}