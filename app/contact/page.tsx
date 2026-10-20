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
  Shield,
  ChevronDown
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
        name: userWithProfile?.user_metadata?.name || '',
        email: userWithProfile?.user_metadata?.email || user?.email || '',
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
    <div className="min-h-screen bg-ink-950 text-white">
      {/* ================= HERO ================= */}
      <header className="relative isolate overflow-hidden border-b border-white/10">
        <div className="mb-vignette absolute inset-0 -z-10" />
        <div className="mb-container animate-fade-up py-16 text-center sm:py-24">
          <p className="mb-eyebrow mb-4 inline-flex items-center gap-2"><MessageSquare size={14} /> Contact</p>
          <h1 className="mb-display text-4xl font-semibold sm:text-6xl">
            Get in <span className="text-gold-400">Touch</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-300">
            We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
          </p>
        </div>
      </header>

      <div className="mb-container py-14">
        <div className="grid gap-10 lg:grid-cols-5">
          {/* ---------- Form ---------- */}
          <div className="lg:col-span-3">
            <div className="mb-surface p-6 sm:p-8">
              <div className="mb-7 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-400 text-ink-950">
                  <Send size={20} />
                </span>
                <h2 className="mb-display text-2xl font-semibold">Send us a Message</h2>
              </div>

              {submitStatus === 'success' && (
                <div role="status" className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" /> <p>{submitMessage}</p>
                </div>
              )}
              {submitStatus === 'error' && (
                <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-crimson-500/30 bg-crimson-500/10 p-4 text-sm text-red-300">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> <p>{submitMessage}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-label">Your Name *</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required className="mb-input" placeholder="Enter your name" />
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-label">Email Address *</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required className="mb-input" placeholder="your.email@example.com" />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="mb-label">Subject *</label>
                  <select id="subject" name="subject" value={formData.subject} onChange={handleInputChange} required className="mb-input">
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
                  <label htmlFor="message" className="mb-label">Your Message *</label>
                  <textarea id="message" name="message" value={formData.message} onChange={handleInputChange} required rows={6} className="mb-input resize-none" placeholder="Tell us how we can help..." />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-gray-500">* Required fields</p>
                  <button type="submit" disabled={isSubmitting} className="mb-btn-primary !px-8 !py-3">
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ---------- Info ---------- */}
          <aside className="space-y-6 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {contactInfo.map((info, index) => (
                <div key={index} className="flex gap-4 rounded-2xl border border-white/10 bg-ink-800/60 p-5 transition hover:border-gold-400/30">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-400/10 text-gold-400">
                    {info.icon}
                  </span>
                  <div className="min-w-0">
                    <h3 className="mb-display font-semibold text-white">{info.title}</h3>
                    <div className="mt-1.5 space-y-0.5 text-sm text-gray-300">
                      {info.details.map((detail, idx) => (
                        <p key={idx} className="break-words">{detail}</p>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">{info.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>

        {/* ---------- FAQ ---------- */}
        <section className="mt-20">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="mb-eyebrow mb-3 inline-flex items-center gap-2"><Users size={14} /> FAQ</p>
            <h2 className="mb-section-title">Frequently Asked Questions</h2>
          </div>
          <div className="mx-auto max-w-3xl space-y-3">
            {faqs.map((faq, index) => (
              <details key={index} className="group rounded-2xl border border-white/10 bg-ink-800/60 transition open:border-gold-400/30">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-white [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronDown size={18} className="shrink-0 text-gold-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-gray-400">{faq.answer}</p>
              </details>
            ))}
          </div>
          <p className="mx-auto mt-6 flex max-w-3xl items-center justify-center gap-2 text-center text-sm text-gray-500">
            <Shield className="h-4 w-4 shrink-0" />
            Your privacy is important to us. We never share your personal information with third parties.
          </p>
        </section>

        {/* ---------- Location ---------- */}
        <section className="mt-20 rounded-3xl border border-white/10 bg-ink-900/60 p-6 sm:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-3">
            <div>
              <h2 className="mb-display mb-5 text-2xl font-semibold">Our Location</h2>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-gold-400" />
                  <div className="text-sm text-gray-300">
                    <p className="font-medium text-white">MovieBlogger HQ</p>
                    <p>No:12</p>
                    <p>Yahalamulla, Walpala</p>
                    <p>Imaduwa</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="mt-1 h-5 w-5 shrink-0 text-gold-400" />
                  <div className="text-sm text-gray-300">
                    <p className="font-medium text-white">Global Community</p>
                    <p>Active users from 150+ countries</p>
                    <p>24/7 platform availability</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              {/* Placeholder for Google Maps or any map component */}
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-ink-800/60 md:h-80">
                <div className="text-center">
                  <MapPin className="mx-auto mb-3 h-10 w-10 text-gray-600" />
                  <p className="font-medium text-gray-400">Interactive Map Location</p>
                  <p className="mt-1 text-xs text-gray-600">(You can integrate Google Maps API here)</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Community CTA ---------- */}
        <section className="mt-20 rounded-3xl border border-gold-400/30 bg-gradient-to-br from-gold-500/15 via-ink-800 to-ink-900 p-10 text-center">
          <h3 className="mb-display text-2xl font-semibold">Join Our Community</h3>
          <p className="mx-auto mt-3 max-w-xl text-gray-300">
            Connect with thousands of movie enthusiasts, share reviews, and participate in discussions.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/reviews" className="mb-btn-primary">Browse Reviews</Link>
            <Link href="/signup" className="mb-btn-ghost">Join Free</Link>
          </div>
        </section>
      </div>
    </div>
  )
}