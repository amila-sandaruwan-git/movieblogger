// components/TinyMceEditor.tsx

'use client'

import { Editor } from '@tinymce/tinymce-react'

export default function TinyMceEditor({ value, onChange, placeholder }: {
  value: string
  onChange: (c: string) => void
  placeholder?: string
}) {
  return (
    <div className="border rounded-lg overflow-hidden dark:border-gray-600">
      <Editor
        apiKey="mfzr4mh4ndtkqonfivh87wa41p994san0sy72a87lv2alpnr"
        value={value}
        onEditorChange={onChange}
        init={{
          height: 400,
          menubar: true,
          plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons'],
          toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright | bullist numlist | link image media | emoticons',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }',
          placeholder,
          skin: 'oxide-dark',
          content_css: 'dark',
          branding: false,
          promotion: false,
        }}
      />
    </div>
  )
}