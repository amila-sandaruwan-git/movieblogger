// components/EdgeFix.tsx
'use client'

import { useEffect, useState } from 'react'

export function EdgeFix() {
  const [isEdge, setIsEdge] = useState(false)

  useEffect(() => {
    // Detect Microsoft Edge
    const userAgent = window.navigator.userAgent
    const isMicrosoftEdge = /Edg/.test(userAgent)
    setIsEdge(isMicrosoftEdge)

    if (isMicrosoftEdge) {
      // Add Edge-specific class to body
      document.body.classList.add('is-edge')
      
      // Fix for Edge's 100vh issue
      const setVh = () => {
        const vh = window.innerHeight * 0.01
        document.documentElement.style.setProperty('--vh', `${vh}px`)
      }
      
      setVh()
      window.addEventListener('resize', setVh)
      
      // Fix for Edge's scrollbar width causing layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`)
      
      // Fix grid layouts for Edge
      const fixGridLayouts = () => {
        const grids = document.querySelectorAll('.grid')
        grids.forEach(grid => {
          if (grid instanceof HTMLElement) {
            grid.style.width = '100%'
            grid.style.maxWidth = '100%'
          }
        })
        
        const containers = document.querySelectorAll('.container')
        containers.forEach(container => {
          if (container instanceof HTMLElement) {
            container.style.width = '100%'
            container.style.maxWidth = '100%'
          }
        })
      }
      
      fixGridLayouts()
      
      // Handle resize events
      const handleResize = () => {
        setVh()
        fixGridLayouts()
      }
      
      window.addEventListener('resize', handleResize)
      
      return () => {
        document.body.classList.remove('is-edge')
        window.removeEventListener('resize', setVh)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  useEffect(() => {
    // Fix for Edge's flexbox/grid rendering issues
    if (isEdge) {
      // Force reflow on all grid containers
      const grids = document.querySelectorAll('.grid, .flex')
      grids.forEach(grid => {
        const computedStyle = window.getComputedStyle(grid)
        if (computedStyle.display === 'grid' || computedStyle.display === 'flex') {
          // Trigger reflow
          grid.classList.add('edge-force-reflow')
          setTimeout(() => {
            grid.classList.remove('edge-force-reflow')
          }, 0)
        }
      })
    }
  }, [isEdge])

  return null
}