import React from "react"

const VoiceIcon = React.memo(() => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 20 20" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Voice icon"
  >
    <rect x="3" y="6" width="2" height="8" rx="1" fill="#EF4444" />
    <rect x="9" y="3" width="2" height="14" rx="1" fill="#3B82F6" />
    <rect x="15" y="5" width="2" height="10" rx="1" fill="#8B5CF6" />
  </svg>
))

VoiceIcon.displayName = "VoiceIcon"

export default VoiceIcon