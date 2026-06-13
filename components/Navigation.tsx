// components/Navigation.tsx - UPDATED TO MATCH POST PAGE
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ClientProfileDropdown } from '@/components/ClientProfileDropdown'

export async function Navigation() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo - Left Corner */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-gray-900 dark:text-white">MovieReel</span>
        </Link>
        
        {/* Center Navigation Links - Updated styling */}
        <div className="hidden md:flex items-center space-x-6 ml-8">
          <Link href="/" className="text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white text-sm font-medium">
            Home
          </Link>
          <Link href="/reviews" className="text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white text-sm font-medium">
            Reviews
          </Link>
          <Link href="/about_us" className="text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white text-sm font-medium">
            About Us
          </Link>
          <Link href="/Contact" className="text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white text-sm font-medium">
            Contact
          </Link>
          {user && (
            <Link href="/dashboard" className="text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white text-sm font-medium">
              Dashboard
            </Link>
          )}
        </div>

        {/* Right Corner - Profile/Auth */}
        <div className="flex items-center space-x-4">
          {user ? (
            <ClientProfileDropdown user={user} />
          ) : (
            <div className="flex space-x-3">
              <Link href="/login" className="text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white text-sm">
                Login
              </Link>
              <Link href="/signup" className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm dark:bg-white dark:text-black">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="container mx-auto px-4 py-2 md:hidden border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-around items-center">
          <Link href="/" className="text-gray-600 hover:text-black text-sm font-medium transition-colors dark:text-gray-300 dark:hover:text-white">
            Home
          </Link>
          <Link href="/reviews" className="text-gray-600 hover:text-black text-sm font-medium transition-colors dark:text-gray-300 dark:hover:text-white">
            Reviews
          </Link>
          <Link href="/about_us" className="text-gray-600 hover:text-black text-sm font-medium transition-colors dark:text-gray-300 dark:hover:text-white">
            About Us
          </Link>
          <Link href="/contact" className="text-gray-600 hover:text-black text-sm font-medium transition-colors dark:text-gray-300 dark:hover:text-white">
            Contact
          </Link>
          {user && (
            <Link href="/dashboard" className="text-gray-600 hover:text-black text-sm font-medium transition-colors dark:text-gray-300 dark:hover:text-white">
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}