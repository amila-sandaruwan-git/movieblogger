'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Film, Facebook, Twitter, Instagram, Youtube } from 'lucide-react'
import SubscribeForm from '@/components/SubscribeForm'

const social = [
  { label: 'Facebook', Icon: Facebook },
  { label: 'Twitter', Icon: Twitter },
  { label: 'Instagram', Icon: Instagram },
  { label: 'YouTube', Icon: Youtube },
]

const explore = [
  { href: '/reviews', label: 'Reviews' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
]

const account = [
  { href: '/login', label: 'Login' },
  { href: '/signup', label: 'Sign Up' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/notifications', label: 'Notifications' },
]

export default function Footer() {
  const pathname = usePathname()
  // The admin area has a fixed 16rem sidebar, so the footer is offset to sit beside it instead of underneath it
  const inAdmin = pathname.startsWith('/admin')

  return (
    <footer className={`relative border-t border-white/10 bg-ink-950 text-white ${inAdmin ? 'md:pl-64' : ''}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />

      <div className="mb-container py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400 text-ink-950">
                <Film size={18} />
              </span>
              <span className="mb-display text-2xl font-semibold">MovieBlogger</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-400">
              Your ultimate guide to the world of cinema. Discover reviews, news, and hidden gems from passionate movie lovers.
            </p>
            <div className="mt-5 flex gap-2">
              {social.map(({ label, Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-gray-400 transition hover:border-gold-400/50 hover:text-gold-300"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <nav className="md:col-span-2" aria-label="Explore">
            <h4 className="mb-eyebrow mb-4">Explore</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              {explore.map(l => (
                <li key={l.href}><Link href={l.href} className="transition hover:text-white">{l.label}</Link></li>
              ))}
            </ul>
          </nav>

          <nav className="md:col-span-2" aria-label="Account">
            <h4 className="mb-eyebrow mb-4">Account</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              {account.map(l => (
                <li key={l.href}><Link href={l.href} className="transition hover:text-white">{l.label}</Link></li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-4">
            <h4 className="mb-eyebrow mb-4">Stay updated</h4>
            <p className="mb-4 text-sm text-gray-400">
              Get the latest movie news and reviews delivered to your inbox.
            </p>
            <SubscribeForm />
            <p className="mt-3 text-xs text-gray-500">
              By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
            </p>
          </div>
        </div>

        {/* CHANGED: justify-center and md:flex-row to center the copyright text */}
        <div className="mt-14 flex flex-col items-center justify-center gap-2 border-t border-white/10 pt-6 text-xs text-gray-500 md:flex-row">
          <p>© {new Date().getFullYear()} MovieBlogger. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}