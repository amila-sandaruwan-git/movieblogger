'use client'

import { Editor } from '@tinymce/tinymce-react'
import { useEffect, useState } from 'react'

// 1. Import the core tinymce module
import tinymce from 'tinymce/tinymce'

// 2. Import models and themes
import 'tinymce/models/dom/model'
import 'tinymce/themes/silver'
import 'tinymce/icons/default'

// 3. Import the skin CSS (essential for styling)
import 'tinymce/skins/ui/oxide/skin.min.css'

// 4. Import plugins
import 'tinymce/plugins/advlist'
import 'tinymce/plugins/autolink'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/link'
import 'tinymce/plugins/image'
import 'tinymce/plugins/charmap'
import 'tinymce/plugins/preview'
import 'tinymce/plugins/anchor'
import 'tinymce/plugins/searchreplace'
import 'tinymce/plugins/visualblocks'
import 'tinymce/plugins/code'
import 'tinymce/plugins/fullscreen'
import 'tinymce/plugins/insertdatetime'
import 'tinymce/plugins/media'
import 'tinymce/plugins/table'
import 'tinymce/plugins/help'
import 'tinymce/plugins/wordcount'
import 'tinymce/plugins/emoticons'

export default function TinyMceEditor({ value, onChange, placeholder }: {
  value: string
  onChange: (c: string) => void
  placeholder?: string
}) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // 5. Explicitly attach tinymce to the window object
    if (typeof window !== 'undefined') {
      (window as any).tinymce = tinymce
      setIsReady(true)
    }
  }, [])

  if (!isReady) {
    return <div className="w-full h-[400px] border rounded-lg animate-pulse bg-gray-700" />
  }

  return (
    <div className="border rounded-lg overflow-hidden dark:border-gray-600">
      <Editor
        value={value}
        onEditorChange={onChange}
        init={{
          height: 400,
          menubar: true,
          plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons'],
          toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright | bullist numlist | link image media | emoticons',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }',
          placeholder,
          skin: 'oxide',
          content_css: 'default',
          branding: false,
          promotion: false,
          base_url: '/tinymce', // This must point to your public folder
          suffix: '.min',
        }}
      />
    </div>
  )
}