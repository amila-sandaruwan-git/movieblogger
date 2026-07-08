// app/contact/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Mail, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Phone,
  MapPin,
  Clock,
  Globe,
  Users,
  Shield
} from 'lucide-react'

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export default function ContactPage() {
  const [user, setUser] = useState<any>(null)
  const [userWithProfile, setUserWithProfile] = useState<any>(null)
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, avatar_url, email')
          .eq('id', currentUser.id)
          .single()

        const name = profile?.name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || ''
        const email = profile?.email || currentUser.email || ''
        const avatar = profile?.avatar_url || currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null

        setUserWithProfile({
          ...currentUser,
          id: currentUser.id,
          user_metadata: {
            ...currentUser.user_metadata,
            name,
            email,
            avatar_url: avatar
          }
        })

        // Pre-fill form with user data if available
        if (name && email) {
          setFormData(prev => ({
            ...prev,
            name,
            email
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setSubmitMessage('')

    try {
      // Send message to admin panel (store in Supabase)
      const { error } = await supabase
        .from('contact_messages')
        .insert([{
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          user_id: user?.id || null,
          status: 'unread',
          created_at: new Date().toISOString()
        }])

      if (error) throw error

      // Send email notification (you can integrate with a real email service here)
      // For now, we'll just log it
      console.log('Contact message sent:', formData)

      // Show success message
      setSubmitStatus('success')
      setSubmitMessage('Thank you! Your message has been sent successfully. We\'ll get back to you soon.')

      // Reset form
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: ''
      })

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle')
        setSubmitMessage('')
      }, 5000)

    } catch (error: any) {
      console.error('Error submitting contact form:', error)
      setSubmitStatus('error')
      setSubmitMessage(error.message || 'Something went wrong. Please try again.')
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle')
        setSubmitMessage('')
      }, 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactInfo = [
    {
      icon: <Mail className="w-5 h-5" />,
      title: "Email",
      details: ["support@movieblogger.com", "feedback@movieblogger.com"],
      description: "We typically respond within 24 hours"
    },
    {
      icon: <Phone className="w-5 h-5" />,
      title: "Phone",
      details: ["+94 72 000-0000", "+94 70 000-6543"],
      description: "Monday to Friday, 9AM - 6PM EST"
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      title: "Office",
      details: ["No: 12", "Yahalamulla", "Walpala", "Imaduwa"],
      description: "By appointment only"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Response Time",
      details: ["General Inquiries: 24-48 hours", "Technical Support: 1-2 business days", "Feedback: 3-5 business days"],
      description: "We strive to respond as quickly as possible"
    }
  ]

  const faqs = [
    {
      question: "How can I report inappropriate content?",
      answer: "Use the 'Report' button on any review or comment, or email us at moderation@movieblogger.com with the content link and reason for reporting."
    },
    {
      question: "Can I request a feature for the platform?",
      answer: "Absolutely! We welcome all suggestions. Use the 'Feature Request' subject in the contact form or email features@movieblogger.com."
    },
    {
      question: "How do I become a featured reviewer?",
      answer: "Consistently post high-quality reviews and engage with the community. Our team regularly selects active members for featuring."
    },
    {
      question: "Is my data and privacy protected?",
      answer: "Yes, we follow strict privacy guidelines. Read our Privacy Policy for details on how we handle your information."
    }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20" />
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white">
                  Get in <span className="text-blue-600 dark:text-blue-400">Touch</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mt-4">
                  We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form & Info */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Send us a Message
                  </h2>
                </div>

                {/* Status Messages */}
                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <p className="text-green-700 dark:text-green-300">{submitMessage}</p>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <p className="text-red-700 dark:text-red-300">{submitMessage}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                        placeholder="Enter your name"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                    >
                      <option value="">Select a subject</option>
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Feedback">Feedback</option>
                      <option value="Report Content">Report Content</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors resize-none"
                      placeholder="Tell us how we can help..."
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      * Required fields
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Contact Information & FAQs */}
            <div className="lg:col-span-1 space-y-8">
              {/* Contact Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contactInfo.map((info, index) => (
                  <div 
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center mb-4">
                      <div className="text-blue-600 dark:text-blue-400">
                        {info.icon}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                      {info.title}
                    </h3>
                    <div className="space-y-2">
                      {info.details.map((detail, idx) => (
                        <p key={idx} className="text-gray-700 dark:text-gray-300">
                          {detail}
                        </p>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                      {info.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* FAQs Section */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-linear-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Frequently Asked Questions
                  </h2>
                </div>

                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div 
                      key={index}
                      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your privacy is important to us. We never share your personal information with third parties.
                    </p>
                  </div>
                </div>
              </div>

              {/* Social & Community */}
              <div className="bg-linear-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Join Our Community
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Connect with thousands of movie enthusiasts, share reviews, and participate in discussions.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link 
                      href="/reviews"
                      className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
                    >
                      Browse Reviews
                    </Link>
                    <Link 
                      href="/signup"
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-700 px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
                    >
                      Join Free
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map/Address Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Our Location
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">MovieBlogger HQ</p>
                      <p className="text-gray-600 dark:text-gray-300">No:12</p>
                      <p className="text-gray-600 dark:text-gray-300">Yahalamulla, Walpala</p>
                      <p className="text-gray-600 dark:text-gray-300">Imaduwa</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Global Community</p>
                      <p className="text-gray-600 dark:text-gray-300">Active users from 150+ countries</p>
                      <p className="text-gray-600 dark:text-gray-300">24/7 platform availability</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-2">
                {/* Placeholder for Google Maps or any map component */}
                <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-64 md:h-80 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      Interactive Map Location
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                      (You can integrate Google Maps API here)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-linear-to-br from-gray-900 to-black text-white py-16 dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="w-6 h-6 text-blue-400" />
                <span className="text-2xl font-bold">MovieBlogger Support</span>
              </div>
              <p className="text-gray-400 max-w-md">
                We're here to help. Whether you have questions about our platform, need technical support, 
                or want to provide feedback, we're always ready to assist.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Send className="w-4 h-4" />
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
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Newsletter
              </h4>
              <p className="text-gray-400 mb-4 text-sm">
                Stay updated with movie news, reviews, and platform updates.
              </p>
              <div className="flex flex-col space-y-3">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} MovieBlogger. All rights reserved.</p>
            <p className="text-sm mt-2">
              Support available 24/7 via email and community forums
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}