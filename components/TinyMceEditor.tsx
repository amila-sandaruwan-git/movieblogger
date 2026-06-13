// components/TinyMceEditor.tsx
'use client'

import { useRef } from 'react'
import { Editor } from '@tinymce/tinymce-react'

interface TinyMceEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function TinyMceEditor({ value, onChange, placeholder = "Write your detailed review here..." }: TinyMceEditorProps) {
  const editorRef = useRef<any>(null)

  return (
    <div className="border border-gray-300 rounded-lg dark:border-gray-600 overflow-hidden">
      <Editor
        apiKey="mfzr4mh4ndtkqonfivh87wa41p994san0sy72a87lv2alpnr" // Get free API key from https://www.tiny.cloud/
        onInit={(_evt, editor) => (editorRef.current = editor)}
        value={value}
        onEditorChange={onChange}
        init={{
          height: 400,
          menubar: true,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount', 'emoticons'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help | link image media | emoticons',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }',
          placeholder: placeholder,
          skin: 'oxide-dark',
          content_css: 'dark',
          branding: false,
          promotion: false,
          image_advtab: true,
          link_assume_external_targets: true,
          link_title: false,
          target_list: false,
          media_dimensions: false,
          media_alt_source: false,
          media_poster: false,
          table_default_styles: {
            width: '100%',
          },
        }}
      />
    </div>
  )
}