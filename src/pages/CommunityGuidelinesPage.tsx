import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'

/**
 * Community Guidelines have been consolidated into the Terms & Conditions page.
 * This redirect page ensures backward compatibility with bookmarks and links.
 */
export default function CommunityGuidelinesPage() {
  useEffect(() => {
    // Redirect to consolidated Terms & Conditions page
    window.location.href = '/terms-conditions'
  }, [])

  // Fallback UI during redirect
  return (
    <Navigate to="/terms-conditions" replace />
  )
}
