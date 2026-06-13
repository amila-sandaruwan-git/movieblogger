// hooks/useEdgeFix.ts
'use client'

import { useEffect, useRef } from 'react'

export function useEdgeFix() {
  const isEdgeRef = useRef(false)

  useEffect(() => {
    // Detect Microsoft Edge
    const userAgent = window.navigator.userAgent
    const isMicrosoftEdge = /Edg/.test(userAgent)
    isEdgeRef.current = isMicrosoftEdge

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
      
      // Fix for Edge's container widths
      const fixContainers = () => {
        const containers = document.querySelectorAll('.container, .mx-auto')
        containers.forEach(container => {
          if (container instanceof HTMLElement) {
            container.style.width = '100%'
            container.style.maxWidth = '100%'
            if (container.classList.contains('container')) {
              container.style.paddingLeft = '1rem'
              container.style.paddingRight = '1rem'
            }
          }
        })
        
        // Fix grid layouts
        const grids = document.querySelectorAll('.grid')
        grids.forEach(grid => {
          if (grid instanceof HTMLElement) {
            grid.style.width = '100%'
            grid.style.maxWidth = '100%'
            grid.style.overflowX = 'hidden'
          }
        })
        
        // Fix flex layouts
        const flexContainers = document.querySelectorAll('.flex')
        flexContainers.forEach(container => {
          if (container instanceof HTMLElement) {
            container.style.flexWrap = 'wrap'
          }
        })
      }
      
      fixContainers()
      
      // Handle resize
      const handleResize = () => {
        setVh()
        fixContainers()
      }
      
      window.addEventListener('resize', handleResize)
      
      // Force reflow on load
      setTimeout(fixContainers, 100)
      
      return () => {
        document.body.classList.remove('is-edge')
        window.removeEventListener('resize', setVh)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  return { isEdge: isEdgeRef.current }
}