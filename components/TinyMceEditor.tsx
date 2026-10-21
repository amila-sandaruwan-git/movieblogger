'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the Editor with SSR disabled
const Editor = dynamic(
  () => import('@tinymce/tinymce-react').then((mod) => mod.Editor),
  { ssr: false }
)

export default function TinyMceEditor({ value, onChange, placeholder }: {
  value: string
  onChange: (c: string) => void
  placeholder?: string
}) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // If already loaded, proceed
    if ((window as any).tinymce) {
      setIsReady(true)
      return
    }

    // Manually load the script to guarantee it exists before React mounts
    const script = document.createElement('script')
    script.src = '/tinymce/tinymce.min.js'
    script.async = true
    script.onload = () => setIsReady(true)
    script.onerror = () => console.error('Failed to load TinyMCE script')
    
    document.head.appendChild(script)
  }, [])

  if (!isReady) {
    return (
      <div className="w-full h-[400px] border rounded-lg flex items-center justify-center bg-gray-900">
        <div className="text-gray-400">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden dark:border-gray-600">
      <Editor
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        value={value}
        onEditorChange={onChange}
        init={{
          height: 400,
          menubar: true,
          plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons'],
          toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright | bullist numlist | link image media | emoticons',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }',
          placeholder,
          // Explicitly point to the correct paths in your public folder
          base_url: '/tinymce',
          skin_url: '/tinymce/skins/ui/oxide',
          content_css: '/tinymce/skins/content/dark/content.min.css',
          branding: false,
          promotion: false,
        }}
      />
    </div>
  )
}