// components/PostContent.tsx
'use client'

import { useEffect, useRef } from 'react'

interface PostContentProps {
  content: string
}

export default function PostContent({ content }: PostContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current) {
      // Add interactivity to images
      const images = contentRef.current.querySelectorAll('img')
      images.forEach(img => {
        img.classList.add('rounded-lg', 'shadow-md', 'cursor-pointer', 'transition-transform', 'hover:scale-[1.02]')
        img.addEventListener('click', () => {
          window.open(img.src, '_blank')
        })
      })

      // Style tables
      const tables = contentRef.current.querySelectorAll('table')
      tables.forEach(table => {
        table.classList.add('min-w-full', 'divide-y', 'divide-gray-200', 'dark:divide-gray-700')
      })
    }
  }, [content])

  return (
    <div
      ref={contentRef}
      className="prose prose-lg max-w-none dark:prose-invert
        prose-headings:text-gray-900 dark:prose-headings:text-white
        prose-p:text-gray-700 dark:prose-p:text-gray-300
        prose-strong:text-gray-900 dark:prose-strong:text-white
        prose-em:text-gray-600 dark:prose-em:text-gray-400
        prose-blockquote:border-l-4 prose-blockquote:border-blue-500 
        prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20
        prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300
        prose-code:bg-gray-100 dark:prose-code:bg-gray-800
        prose-pre:bg-gray-900 dark:prose-pre:bg-gray-800
        prose-li:text-gray-700 dark:prose-li:text-gray-300
        prose-hr:border-gray-200 dark:prose-hr:border-gray-700"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}