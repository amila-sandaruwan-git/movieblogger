// components/ReportButton.tsx - Red Color Report Button + Dark Mode Popup
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Flag, AlertCircle, X, ChevronRight, CheckCircle, Send, ArrowLeft, Shield } from 'lucide-react'
import { createPortal } from 'react-dom'

interface ReportButtonProps {
  postId: string
  userId?: string
  isAuthenticated: boolean
}

export function ReportButton({ postId, userId, isAuthenticated }: ReportButtonProps) {
  const [isReporting, setIsReporting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedReason, setSelectedReason] = useState('')
  const [description, setDescription] = useState('')
  const [isPostAuthor, setIsPostAuthor] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [alreadyReported, setAlreadyReported] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [selectedReasonData, setSelectedReasonData] = useState<{ value: string; label: string; icon: string; description: string; fullDescription: string } | null>(null)
  const [currentStep, setCurrentStep] = useState<'reasons' | 'details' | 'success'>('reasons')
  const [mounted, setMounted] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef(0)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isAuthenticated && userId) {
      checkUserStatus()
    }
  }, [isAuthenticated, userId, postId])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        handleClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showModal])

  useEffect(() => {
    if (showModal) {
      scrollPositionRef.current = window.scrollY
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollPositionRef.current}px`
      document.body.style.width = '100%'
      document.body.style.left = '0'
      document.body.style.right = '0'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.left = ''
      document.body.style.right = ''
      window.scrollTo(0, scrollPositionRef.current)
    }
    
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.left = ''
      document.body.style.right = ''
    }
  }, [showModal])

  const checkUserStatus = async () => {
    if (!userId) return
    
    setIsChecking(true)
    const supabase = createClient()
    
    try {
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single()

      setIsPostAuthor(post?.user_id === userId)

      const { data: existingReport, error } = await supabase
        .from('reports')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single()

      setAlreadyReported(!error && !!existingReport)
    } catch (error) {
      console.error('Error checking user status:', error)
      setAlreadyReported(false)
    } finally {
      setIsChecking(false)
    }
  }

  if (!isAuthenticated || isChecking || isPostAuthor || alreadyReported) {
    return null
  }

  const handleOpenReport = () => {
    setShowModal(true)
    setCurrentStep('reasons')
    setSelectedReason('')
    setDescription('')
    setSelectedReasonData(null)
    setSubmitSuccess(false)
  }

  const handleClose = () => {
    setShowModal(false)
    setCurrentStep('reasons')
    setSelectedReason('')
    setDescription('')
    setSelectedReasonData(null)
    setSubmitSuccess(false)
  }

  const reportReasons = [
    { 
      value: 'spam', 
      label: 'Spam or misleading', 
      icon: '📢',
      description: 'Content that is promotional, repetitive, or misleading',
      fullDescription: 'This content appears to be spam, scam, or intentionally misleading. This includes fake reviews, promotional content, or clickbait.'
    },
    { 
      value: 'inappropriate', 
      label: 'Inappropriate content', 
      icon: '🚫',
      description: 'Content that is offensive, vulgar, or disturbing',
      fullDescription: 'This content contains offensive language, vulgar imagery, or is otherwise disturbing or inappropriate for our community.'
    },
    { 
      value: 'hate_speech', 
      label: 'Hate speech or discrimination', 
      icon: '⚠️',
      description: 'Content that promotes hatred or discrimination',
      fullDescription: 'This content promotes hatred, violence, or discrimination against individuals or groups based on race, ethnicity, religion, gender, sexual orientation, or disability.'
    },
    { 
      value: 'misinformation', 
      label: 'False information', 
      icon: '❌',
      description: 'Content that contains knowingly false information',
      fullDescription: 'This content contains knowingly false or misleading information. This includes conspiracy theories, fake news, or intentionally deceptive claims.'
    },
    { 
      value: 'copyright', 
      label: 'Copyright violation', 
      icon: '©️',
      description: 'Content that infringes on copyright',
      fullDescription: 'This content infringes on my copyright or someone else\'s copyright. I have not authorized this use of copyrighted material.'
    },
    { 
      value: 'harassment', 
      label: 'Harassment or bullying', 
      icon: '😔',
      description: 'Content that harasses, bullies, or threatens',
      fullDescription: 'This content harasses, bullies, or threatens me or someone else. This includes personal attacks, intimidation, or targeted negative behavior.'
    },
    { 
      value: 'other', 
      label: 'Other reason', 
      icon: '📝',
      description: 'Something else that violates our guidelines',
      fullDescription: 'This content violates community guidelines in a way not described above. Please provide details in the additional information field.'
    }
  ]

  const handleReasonSelect = (reason: typeof reportReasons[0]) => {
    setSelectedReason(reason.value)
    setSelectedReasonData(reason)
    setCurrentStep('details')
  }

  const handleBackToReasons = () => {
    setCurrentStep('reasons')
    setSelectedReason('')
    setSelectedReasonData(null)
    setDescription('')
  }

  const submitReport = async () => {
    if (!selectedReason) return

    setIsReporting(true)

    const supabase = createClient()

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('You must be logged in to report content')
        setIsReporting(false)
        return
      }

      let reporterIp = '127.0.0.1'
      try {
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        reporterIp = data.ip || '127.0.0.1'
      } catch (ipError) {
        console.log('Could not fetch IP, using fallback')
      }

      const { data: postData } = await supabase
        .from('posts')
        .select('movie_title, user_id')
        .eq('id', postId)
        .single()

      if (!postData) {
        alert('Post not found')
        setIsReporting(false)
        return
      }

      const { error: reportError } = await supabase
        .from('reports')
        .insert({
          post_id: postId,
          user_id: session.user.id,
          reporter_ip: reporterIp,
          reason: selectedReason,
          report_type: selectedReason,
          description: description.trim() || null,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (reportError) {
        console.error('Report insert error:', reportError)
        throw new Error(`Failed to submit report: ${reportError.message}`)
      }

      setCurrentStep('success')
      setAlreadyReported(true)
      
      setTimeout(() => {
        handleClose()
      }, 2000)
      
    } catch (error: any) {
      console.error('Error submitting report:', error)
      alert(`Failed to submit report: ${error.message || 'Please try again.'}`)
    } finally {
      setIsReporting(false)
    }
  }

  // Dark Mode Modal Content
  const ModalContent = () => (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.94)',
        backdropFilter: 'blur(12px)',
        zIndex: 99999,
      }}
      onClick={handleClose}
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-md mx-4 bg-[#0f0f0f] rounded-2xl shadow-2xl overflow-hidden border border-[#272727]"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#272727] bg-[#0f0f0f]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center">
              {currentStep === 'success' ? (
                <CheckCircle size={18} className="text-green-500" />
              ) : (
                <Flag size={18} className="text-red-500" />
              )}
            </div>
            <h2 className="text-lg font-semibold text-white">
              {currentStep === 'success' ? 'Report submitted' : 'Report this review'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-[#272727] transition-colors flex items-center justify-center"
          >
            <X size={18} className="text-[#aaa]" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* SUCCESS STATE */}
          {currentStep === 'success' && (
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/15 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Thanks for your report</h3>
              <p className="text-[#aaa] text-sm mb-5">
                Our team will review this content and take appropriate action.
              </p>
              <button
                onClick={handleClose}
                className="w-full px-4 py-2.5 bg-[#272727] text-white rounded-lg hover:bg-[#3f3f3f] transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          )}

          {/* REASONS SELECTION */}
          {currentStep === 'reasons' && (
            <div className="p-5">
              <div className="flex items-center justify-center gap-2 mb-5">
                <Shield size={16} className="text-[#888]" />
                <p className="text-center text-[#aaa] text-sm">
                  Help us keep MovieReel safe
                </p>
              </div>
              
              <div className="space-y-2">
                {reportReasons.map((reason) => (
                  <button
                    key={reason.value}
                    onClick={() => handleReasonSelect(reason)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1a1a1a] hover:bg-[#272727] transition-all duration-200 text-left group border border-transparent hover:border-red-500/30"
                  >
                    <span className="text-xl">{reason.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white group-hover:text-red-400 transition-colors text-sm">
                          {reason.label}
                        </span>
                        <ChevronRight size={14} className="text-[#555] group-hover:text-red-400 transition-colors" />
                      </div>
                      <p className="text-xs text-[#777] mt-0.5">{reason.description}</p>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="mt-5 pt-3 border-t border-[#272727] text-center">
                <p className="text-xs text-[#555] flex items-center justify-center gap-1">
                  <AlertCircle size={12} />
                  False reports may result in account restrictions
                </p>
              </div>
            </div>
          )}

          {/* DETAILS PAGE */}
          {currentStep === 'details' && selectedReasonData && (
            <div className="p-5">
              <button
                onClick={handleBackToReasons}
                className="flex items-center gap-1 text-xs text-[#888] hover:text-white transition-colors mb-4"
              >
                <ArrowLeft size={12} />
                Back
              </button>

              <div className="flex items-start gap-3 p-3 bg-[#1a1a1a] rounded-xl border border-[#272727] mb-5">
                <span className="text-2xl">{selectedReasonData.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{selectedReasonData.label}</p>
                  <p className="text-xs text-[#777] mt-1">{selectedReasonData.fullDescription}</p>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-medium text-[#aaa] mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#272727] rounded-xl text-white placeholder-[#555] focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 resize-none text-sm"
                  placeholder="Tell us more about why you're reporting this content..."
                  autoFocus
                />
                <p className="text-xs text-[#555] mt-2 flex items-center gap-1">
                  <AlertCircle size={10} />
                  Your report is anonymous
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBackToReasons}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#1a1a1a] text-[#aaa] hover:bg-[#272727] hover:text-white transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReport}
                  disabled={isReporting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isReporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Submit
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-[#272727]">
                <p className="text-xs text-[#555] text-center">
                  This report will be reviewed by our moderation team
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f3f;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  )

  return (
    <>
      {/* RED COLOR REPORT BUTTON */}
      <button
        onClick={handleOpenReport}
        disabled={isChecking}
        className="flex items-center gap-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-200 text-sm font-medium border border-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 dark:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <Flag size={16} className="group-hover:scale-110 transition-transform duration-200" />
        <span>{isChecking ? 'Checking...' : 'Report'}</span>
      </button>

      {/* Render modal using portal */}
      {mounted && showModal && createPortal(
        <ModalContent />,
        document.body
      )}
    </>
  )
}