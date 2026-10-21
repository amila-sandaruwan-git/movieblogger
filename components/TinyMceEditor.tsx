'use client'

import { Editor } from '@tinymce/tinymce-react'
import tinymce from 'tinymce/tinymce'

// Core TinyMCE
import 'tinymce/models/dom/model'
import 'tinymce/themes/silver'
import 'tinymce/icons/default'

// Import the skin CSS directly (this is crucial for the blank box fix)
import 'tinymce/skins/ui/oxide/skin.min.css'

// Plugins
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
          skin: 'oxide', // Tells TinyMCE to use the oxide skin we imported above
          content_css: 'default', // Uses the default content styling
          branding: false,
          promotion: false,
          base_url: '/tinymce', // Points to the public folder for plugins
          suffix: '.min',
        }}
      />
    </div>
  )
}