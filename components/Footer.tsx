// components/Footer.tsx - SIMPLIFIED
'use client'

import Link from 'next/link'
import { Film, Zap, Heart } from 'lucide-react'
import SubscribeForm from '@/components/SubscribeForm'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  
  // ONLY show footer on homepage
  const isHomepage = pathname === '/'
  
  console.log('🔍 Footer Debug:', { pathname, isHomepage })
  
  if (!isHomepage) {
    return null
  }

  return (
    <footer className="bg-linear-to-br from-gray-900 to-black text-white py-16 dark:from-gray-800 dark:to-gray-900 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Film className="w-6 h-6 text-blue-400" />
              <span className="text-2xl font-bold">MovieBlogger</span>
            </div>
            <p className="text-gray-400 max-w-md text-sm">
              Your ultimate guide to the world of cinema. Discover reviews, news, and hidden gems from passionate movie lovers.
            </p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.99h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.104c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0021.524-11.53c0-.23-.005-.46-.015-.69.985-.704 1.84-1.58 2.518-2.58z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022zM9.754 8.956v6.088L15.5 12 9.754 8.956z"/>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Quick Links
            </h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link href="/reviews" className="hover:text-white transition-colors flex items-center gap-2 group">
                  <span className="w-0 h-0 rounded-full bg-blue-500 group-hover:w-2 group-hover:h-2 transition-all" />
                  Reviews
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors flex items-center gap-2 group">
                  <span className="w-0 h-0 rounded-full bg-blue-500 group-hover:w-2 group-hover:h-2 transition-all" />
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors flex items-center gap-2 group">
                  <span className="w-0 h-0 rounded-full bg-blue-500 group-hover:w-2 group-hover:h-2 transition-all" />
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors flex items-center gap-2 group">
                  <span className="w-0 h-0 rounded-full bg-blue-500 group-hover:w-2 group-hover:h-2 transition-all" />
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Subscribe Section */}
          <div className="md:col-span-2">
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              Stay Updated
            </h4>
            <p className="text-gray-400 mb-4 text-sm">
              Get the latest movie news and reviews delivered to your inbox.
            </p>
            
            <SubscribeForm />
            
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
              By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>© {new Date().getFullYear()} MovieBlogger. All rights reserved.</p>
          <p className="text-sm mt-2">Made with ❤️ for the love of cinema</p>
        </div>
      </div>
    </footer>
  )
}