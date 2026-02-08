'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, MapPin, Phone, Users, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createSOSAlert, type SOSAlertInput } from '@/lib/services/emergency/sos-service'

/**
 * SOS Alert Dialog Component
 * 
 * Multi-step dialog for creating SOS alerts:
 * 1. Select emergency type
 * 2. Confirm location
 * 3. Select emergency contacts (optional)
 * 4. Confirm and submit
 * 
 * Features:
 * - Confirmation flow to prevent accidental activation
 * - Location confirmation with GPS coordinates
 * - Emergency contact selection
 * - Progress indicator
 * - WCAG 2.1 AA compliant
 */
const sosFormSchema = z.object({
  emergencyType: z.enum([
    'fire',
    'flooding',
    'electrocution_hazard',
    'building_collapse',
    'medical_emergency'
  ]),
  description: z.string().min(10).max(500).optional(),
  locationConfirmed: z.boolean().refine(val => val === true, {
    message: 'Location must be confirmed',
  }),
  notifyContacts: z.boolean().default(false),
})

type SOSFormData = z.infer<typeof sosFormSchema>

// Step configuration
const STEPS = [
  { key: 'type', titleKey: 'steps.emergencyType' },
  { key: 'location', titleKey: 'steps.location' },
  { key: 'contacts', titleKey: 'steps.contacts' },
  { key: 'confirm', titleKey: 'steps.confirm' },
]

export function SosAlertDialog({
  open,
  onOpenChange,
  currentLocation,
  onComplete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentLocation?: { latitude: number; longitude: number }
  onComplete?: (result: { id: string; incidentNumber: string }) => void
}) {
  const t = useTranslations('sos')
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [locationStatus, setLocationStatus] = useState<'unknown' | 'confirming' | 'confirmed'>('unknown')
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)

  const form = useForm<SOSFormData>({
    resolver: zodResolver(sosFormSchema),
    defaultValues: {
      emergencyType: undefined,
      description: '',
      locationConfirmed: false,
      notifyContacts: false,
    } as any,
  })

  const { register, watch, setValue, trigger, handleSubmit, formState: { errors } } = form


  const formValues = watch()

  // Get user location when dialog opens
  useEffect(() => {
    if (open && !currentLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
          },
          (error) => {
            console.warn('Geolocation error:', error)
            setError(t('errors.locationError'))
          }
        )
      }
    } else if (currentLocation) {
      setUserLocation(currentLocation)
    }
  }, [open, currentLocation, t])

  const handleConfirmLocation = useCallback(() => {
    setLocationStatus('confirming')
    
    // Simulate location confirmation delay
    setTimeout(() => {
      setLocationStatus('confirmed')
      setValue('locationConfirmed', true)
    }, 1000)
  }, [setValue])

  const handleNextStep = useCallback(async () => {
    let fieldsToValidate: (keyof SOSFormData)[] = []
    
    switch (currentStep) {
      case 0:
        fieldsToValidate = ['emergencyType']
        break
      case 1:
        fieldsToValidate = ['locationConfirmed']
        break
      case 2:
        // Contact selection is optional
        break
      case 3:
        fieldsToValidate = ['emergencyType', 'locationConfirmed']
        break
    }
    
    const isValid = await trigger(fieldsToValidate)
    if (isValid || currentStep === 2) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
    }
  }, [currentStep, trigger])

  const handlePrevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }, [])

  const onSubmit = async (data: SOSFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const location = userLocation || currentLocation
      
      if (!location) {
        throw new Error(t('errors.locationRequired'))
      }

      const input: SOSAlertInput = {
        emergencyType: data.emergencyType,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        description: data.description,
        notifyContacts: data.notifyContacts,
      }

      const result = await createSOSAlert(input)
      
      setSuccess(true)
      
      // Delay before closing dialog
      setTimeout(() => {
        onComplete?.({ id: result.id, incidentNumber: result.incidentNumber })
        handleClose()
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.submissionError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = useCallback(() => {
    setCurrentStep(0)
    setError(null)
    setSuccess(false)
    setLocationStatus('unknown')
    onOpenChange(false)
  }, [onOpenChange])

  // Emergency type options based on requirements
  const emergencyTypes = [
    { value: 'fire', labelKey: 'emergencyTypes.fire', icon: '🔥' },
    { value: 'flooding', labelKey: 'emergencyTypes.flooding', icon: '🌊' },
    { value: 'electrocution_hazard', labelKey: 'emergencyTypes.electrocution', icon: '⚡' },
    { value: 'building_collapse', labelKey: 'emergencyTypes.collapse', icon: '🏢' },
    { value: 'medical_emergency', labelKey: 'emergencyTypes.medical', icon: '🚑' },
  ]

  const currentStepData = STEPS[currentStep]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" aria-describedby="sos-dialog-description">
        {/* Success State */}
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-600 mb-2">
              {t('success.title')}
            </h3>
            <p className="text-gray-600">
              {t('success.message')}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                {t('dialog.title')}
              </DialogTitle>
            </DialogHeader>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-4" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
              {STEPS.map((step, index) => (
                <div key={step.key} className="flex items-center">
                  <div 
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${index < currentStep ? 'bg-green-600 text-white' : ''}
                      ${index === currentStep ? 'bg-red-600 text-white' : ''}
                      ${index > currentStep ? 'bg-gray-200 text-gray-600' : ''}
                    `}
                    aria-current={index === currentStep ? 'step' : undefined}
                  >
                    {index < currentStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 ${index < currentStep ? 'bg-green-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step Title */}
            <h4 className="text-lg font-medium mb-4">
              {t(currentStepData.titleKey)}
            </h4>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <XCircle className="h-4 w-4" />
                <AlertTitle>{t('errors.title')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Form Content */}
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 1: Emergency Type */}
              {currentStep === 0 && (
                <div className="space-y-3" role="group" aria-labelledby="emergency-type-group">
                  <div id="emergency-type-group" className="sr-only">
                    {t('steps.emergencyType')}
                  </div>
                  {emergencyTypes.map((type) => (
                    <label
                      key={type.value}
                      className={`
                        flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors
                        ${formValues.emergencyType === type.value 
                          ? 'border-red-600 bg-red-50' 
                          : 'border-gray-200 hover:border-gray-300'}
                      `}
                    >
                      <input
                        type="radio"
                        value={type.value}
                        {...register('emergencyType')}
                        className="sr-only"
                        aria-describedby={`${type.value}-description`}
                      />
                      <span className="text-2xl">{type.icon}</span>
                      <span className="font-medium">{t(type.labelKey)}</span>
                    </label>
                  ))}
                  {errors.emergencyType && (
                    <p className="text-sm text-red-600" role="alert">
                      {t(errors.emergencyType.message || 'errors.selectType')}
                    </p>
                  )}
                </div>
              )}

              {/* Step 2: Location Confirmation */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="font-medium">{t('location.currentLocation')}</p>
                          <p className="text-sm text-gray-500">
                            {userLocation 
                              ? `${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}`
                              : t('location.fetching')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button
                    type="button"
                    variant={locationStatus === 'confirmed' ? 'outline' : 'default'}
                    className="w-full"
                    onClick={handleConfirmLocation}
                    disabled={locationStatus === 'confirming' || !userLocation}
                  >
                    {locationStatus === 'unknown' && (
                      <>
                        <MapPin className="w-4 h-4 mr-2" />
                        {t('location.confirmButton')}
                      </>
                    )}
                    {locationStatus === 'confirming' && (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        {t('location.confirming')}
                      </>
                    )}
                    {locationStatus === 'confirmed' && (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {t('location.confirmed')}
                      </>
                    )}
                  </Button>

                  {errors.locationConfirmed && (
                    <p className="text-sm text-red-600" role="alert">
                      {t(errors.locationConfirmed.message || 'errors.confirmLocation')}
                    </p>
                  )}
                </div>
              )}

              {/* Step 3: Emergency Contacts */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <Alert>
                    <Users className="h-4 w-4" />
                    <AlertTitle>{t('contacts.optional')}</AlertTitle>
                    <AlertDescription>
                      {t('contacts.description')}
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{t('contacts.notify')}</p>
                        <p className="text-sm text-gray-500">
                          {formValues.notifyContacts ? t('contacts.enabled') : t('contacts.disabled')}
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      {...register('notifyContacts')}
                      className="w-5 h-5 text-red-600 rounded"
                      aria-label={t('contacts.toggleLabel')}
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{t('confirm.summary')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('confirm.type')}</span>
                        <span className="font-medium">
                          {t(emergencyTypes.find(t => t.value === formValues.emergencyType)?.labelKey || '')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('confirm.location')}</span>
                        <span className="font-medium">{t('confirm.confirmed')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('confirm.contacts')}</span>
                        <span className="font-medium">
                          {formValues.notifyContacts ? t('confirm.yes') : t('confirm.no')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('confirm.warningTitle')}</AlertTitle>
                    <AlertDescription>
                      {t('confirm.warningMessage')}
                    </AlertDescription>
                  </Alert>

                  <input type="hidden" {...register('emergencyType')} />
                  <input type="hidden" {...register('locationConfirmed')} />
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                >
                  {t('buttons.back')}
                </Button>

                {currentStep < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                  >
                    {t('buttons.next')}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        {t('buttons.submitting')}
                      </>
                    ) : (
                      t('buttons.confirmSOS')
                    )}
                  </Button>
                )}
              </div>
            </form>
          </>
        )}

        {/* Dialog Description */}
        <p id="sos-dialog-description" className="sr-only">
          {t('dialog.description')}
        </p>
      </DialogContent>
    </Dialog>
  )
}
