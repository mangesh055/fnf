import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'

/**
 * Grievance Redressal Policy has been consolidated into the Terms & Conditions page.
 * This redirect page ensures backward compatibility with bookmarks and links.
 */
export default function GrievanceRedressalPage() {
  useEffect(() => {
    window.location.href = '/terms-conditions'
  }, [])

  return <Navigate to="/terms-conditions" replace />
}
