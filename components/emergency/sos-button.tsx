'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { AlertCircle, Phone, MapPin } from 'lucide-react'
import { SosAlertDialog } from './sos-alert-dialog'

/**
 * SOSButton Component
 * 
 * A prominent, one-tap SOS button for emergency situations.
 * Features:
 * - Floating action button (FAB) style with pulsing animation
 * - WCAG 2.1 AA compliant with keyboard navigation and ARIA labels
 * - Mobile-first responsive design
 * - Max 3 taps to complete emergency alert
 * 
 * @example
 * ```tsx
 * <SOSButton 
 *   currentLocation={{ latitude: 40.7128, longitude: -74.0060 }}
 *   onSOSCreated={(incident) => console.log('SOS created:', incident)}
 * />
 * ```
 */
export function SOSButton({
  currentLocation,
  onSOSCreated,
  className = ''
}: {
  currentLocation?: { latitude: number; longitude: number }
  onSOSCreated?: (incident: { id: string; incidentNumber: string }) => void
  className?: string
}) {
  const t = useTranslations('sos')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [tapCount, setTapCount] = useState(0)

  const handlePress = useCallback(() => {
    setIsPressed(true)
    setTapCount(prev => prev + 1)
    
    // Reset pressed state after animation
    setTimeout(() => setIsPressed(false), 200)
  }, [])

  const handleSOSComplete = useCallback((result: { id: string; incidentNumber: string }) => {
    setIsDialogOpen(false)
    setTapCount(0)
    onSOSCreated?.(result)
  }, [onSOSCreated])

  const handleOpenDialog = useCallback(() => {
    setIsDialogOpen(true)
  }, [])

  return (
    <>
      {/* SOS Button - Floating Action Button Style */}
      <button
        type="button"
        onClick={handleOpenDialog}
        onMouseDown={handlePress}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleOpenDialog()
          }
        }}
        aria-label={t('button.ariaLabel')}
        aria-describedby="sos-button-description"
        className={`
          relative
          flex items-center justify-center
          w-16 h-16 md:w-20 md:h-20
          rounded-full
          bg-red-600 hover:bg-red-700
          focus:outline-none focus:ring-4 focus:ring-red-400/50
          focus:ring-offset-2 focus:ring-offset-gray-900
          transition-all duration-200
          shadow-lg shadow-red-600/40
          ${isPressed ? 'scale-95' : 'scale-100'}
          ${className}
        `}
        style={{
          animation: 'sos-pulse 2s ease-in-out infinite',
        }}
      >
        {/* Pulsing ring effect */}
        <span 
          className="absolute inset-0 rounded-full animate-ping bg-red-600/30"
          aria-hidden="true"
        />
        
        {/* Button content */}
        <div className="relative flex flex-col items-center">
          <AlertCircle 
            className="w-8 h-8 md:w-10 md:h-10 text-white" 
            aria-hidden="true"
          />
          <span className="sr-only">{t('button.label')}</span>
        </div>
        
        {/* Tap counter indicator */}
        {tapCount > 0 && (
          <div 
            className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 bg-white rounded-full text-red-600 text-xs font-bold"
            aria-label={t('button.tapCount', { count: tapCount })}
          >
            {tapCount}
          </div>
        )}
      </button>

      {/* Screen reader description */}
      <div id="sos-button-description" className="sr-only">
        {t('button.description')}
      </div>

      {/* SOS Alert Dialog */}
      <SosAlertDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        currentLocation={currentLocation}
        onComplete={handleSOSComplete}
      />

      {/* CSS Animation for pulsing effect */}
      <style jsx global>{`
        @keyframes sos-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
          }
          50% {
            box-shadow: 0 0 0 15px rgba(220, 38, 38, 0);
          }
        }
      `}</style>
    </>
  )
}

/**
 * EmergencyQuickActions Component
 * Quick access buttons for common emergency actions
 */
export function EmergencyQuickActions({
  currentLocation,
  onCallEmergency,
  onViewMap
}: {
  currentLocation?: { latitude: number; longitude: number }
  onCallEmergency?: () => void
  onViewMap?: () => void
}) {
  const t = useTranslations('sos')

  return (
    <div 
      className="flex gap-2"
      role="group"
      aria-label={t('quickActions.label')}
    >
      {/* Call Emergency Button */}
      <button
        type="button"
        onClick={onCallEmergency}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
        aria-label={t('quickActions.callEmergency')}
      >
        <Phone className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t('quickActions.call')}</span>
      </button>

      {/* View on Map Button */}
      <button
        type="button"
        onClick={onViewMap}
        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
        aria-label={t('quickActions.viewOnMap')}
      >
        <MapPin className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t('quickActions.location')}</span>
      </button>
    </div>
  )
}
