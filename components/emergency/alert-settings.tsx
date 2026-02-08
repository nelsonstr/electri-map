'use client'

/**
 * Alert Settings Component
 * ER-003: Community Alert System
 * 
 * Settings UI for configuring alert preferences including radius, severity filters,
 * notification channels, and quiet hours.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { AlertService } from '@/lib/services/emergency/alert-service'
import { PushNotificationService } from '@/lib/services/emergency/push-notification-service'
import type {
  UserAlertPreferences,
  CommunityAlertSeverity,
} from '@/types/community-alert'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Loader2, Bell, Smartphone, Mail, Clock, ShieldAlert, Save } from 'lucide-react'

interface AlertSettingsProps {
  userId: string
  onClose?: () => void
}

export function AlertSettings({ userId, onClose }: AlertSettingsProps) {
  const t = useTranslations('alerts.settings')
  const tCommon = useTranslations('common')

  // Create service instances (only on client side)
  const alertService = useMemo(() => new AlertService(), [])
  const pushService = useMemo(() => new PushNotificationService(), [])

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [preferences, setPreferences] = useState<UserAlertPreferences | null>(null)
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [localLocation, setLocalLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)

  // Form state
  const [alertRadius, setAlertRadius] = useState(5000)
  const [enabledSeverities, setEnabledSeverities] = useState<CommunityAlertSeverity[]>([
    'informational',
    'warning',
    'critical',
  ])
  const [pushEnabled, setPushEnabled] = useState(true)
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false)
  const [quietHoursStart, setQuietHoursStart] = useState('22:00')
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00')
  const [criticalOverride, setCriticalOverride] = useState(true)
  const [smsPhone, setSmsPhone] = useState('')

  // Fetch initial preferences
  useEffect(() => {
    async function loadPreferences() {
      try {
        setIsLoading(true)
        const [prefs, pushStatus] = await Promise.all([
          alertService.getUserPreferences(userId),
          pushService.isSubscribed(userId),
        ])

        setPreferences(prefs)
        setPushSubscribed(pushStatus)

        // Set form values from preferences
        setAlertRadius(prefs.alertRadius)
        setEnabledSeverities(prefs.enabledSeverities)
        setPushEnabled(prefs.channels.push)
        setSmsEnabled(prefs.channels.sms)
        setEmailEnabled(prefs.channels.email)
        if (prefs.quietHours) {
          setQuietHoursEnabled(prefs.quietHours.enabled)
          setQuietHoursStart(prefs.quietHours.start)
          setQuietHoursEnd(prefs.quietHours.end)
        }
        setCriticalOverride(prefs.criticalAlertsOverride)
        if (prefs.smsOptIn.phoneNumber) {
          setSmsPhone(prefs.smsOptIn.phoneNumber)
        }

        // Get current location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocalLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              })
            },
            (error) => {
              console.warn('Error getting location:', error)
            }
          )
        }
      } catch (error) {
        console.error('Error loading preferences:', error)
        toast.error(t('errors.loadFailed'))
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [userId, t, alertService, pushService])

  // Handle severity toggle
  const toggleSeverity = useCallback(
    (severity: CommunityAlertSeverity) => {
      setEnabledSeverities((prev) => {
        if (prev.includes(severity)) {
          // Don't allow disabling critical alerts
          if (severity === 'critical') {
            return prev
          }
          return prev.filter((s) => s !== severity)
        }
        return [...prev, severity]
      })
    },
    []
  )

  // Handle save
  const handleSave = async () => {
    try {
      setIsSaving(true)

      // Subscribe/unsubscribe from push if needed
      if (pushEnabled && !pushSubscribed) {
        const result = await pushService.subscribe(userId)
        if (!result.success) {
          toast.error(t('errors.pushSubscribeFailed'))
          setPushEnabled(false)
        } else {
          setPushSubscribed(true)
        }
      } else if (!pushEnabled && pushSubscribed) {
        await pushService.unsubscribe(userId)
        setPushSubscribed(false)
      }

      // Save preferences
      await alertService.updateUserPreferences(userId, {
        location: localLocation || undefined,
        alertRadius,
        enabledSeverities,
        channels: {
          push: pushEnabled,
          sms: smsEnabled,
          email: emailEnabled,
        },
        quietHours: quietHoursEnabled
          ? {
              enabled: true,
              start: quietHoursStart,
              end: quietHoursEnd,
            }
          : undefined,
        criticalAlertsOverride: criticalOverride,
        smsOptIn: smsEnabled
          ? {
              enabled: true,
              phoneNumber: smsPhone || undefined,
            }
          : { enabled: false },
      })

      toast.success(t('saveSuccess'))
      onClose?.()
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error(t('errors.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  // Format distance for display
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${Math.round(meters)} m`
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Alert Radius */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="alert-radius" className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              {t('radius.label')}
            </Label>
            <span className="text-sm font-medium text-muted-foreground">
              {formatDistance(alertRadius)}
            </span>
          </div>
          <Slider
            id="alert-radius"
            min={500}
            max={10000}
            step={500}
            value={[alertRadius]}
            onValueChange={([value]) => setAlertRadius(value)}
            aria-label={t('radius.label')}
          />
          <p className="text-xs text-muted-foreground">{t('radius.description')}</p>
        </div>

        <Separator />

        {/* Severity Filters */}
        <div className="space-y-3">
          <Label>{t('severity.label')}</Label>
          <p className="text-xs text-muted-foreground">{t('severity.description')}</p>

          <div className="grid grid-cols-1 gap-3">
            {(['informational', 'warning', 'critical'] as CommunityAlertSeverity[]).map(
              (severity) => (
                <div
                  key={severity}
                  className="flex items-center space-x-3"
                >
                  <Checkbox
                    id={`severity-${severity}`}
                    checked={enabledSeverities.includes(severity)}
                    onCheckedChange={() => toggleSeverity(severity)}
                    disabled={severity === 'critical'}
                  />
                  <Label
                    htmlFor={`severity-${severity}`}
                    className={`flex items-center gap-2 ${
                      severity === 'critical' ? 'opacity-50' : ''
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        severity === 'informational'
                          ? 'bg-blue-500'
                          : severity === 'warning'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                    />
                    {t(`severity.${severity}`)}
                  </Label>
                </div>
              )
            )}
          </div>
        </div>

        <Separator />

        {/* Notification Channels */}
        <div className="space-y-4">
          <Label>{t('channels.label')}</Label>

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications" className="text-sm">
                  {t('channels.push.label')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {pushSubscribed ? t('channels.push.subscribed') : t('channels.push.notSubscribed')}
                </p>
              </div>
            </div>
            <Switch
              id="push-notifications"
              checked={pushEnabled}
              onCheckedChange={setPushEnabled}
            />
          </div>

          {/* SMS Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 text-muted-foreground font-bold text-sm">SMS</span>
              <div className="space-y-0.5">
                <Label htmlFor="sms-notifications" className="text-sm">
                  {t('channels.sms.label')}
                </Label>
                <p className="text-xs text-muted-foreground">{t('channels.sms.description')}</p>
              </div>
            </div>
            <Switch
              id="sms-notifications"
              checked={smsEnabled}
              onCheckedChange={setSmsEnabled}
            />
          </div>

          {/* Phone number input (shown when SMS is enabled) */}
          {smsEnabled && (
            <div className="pl-7 space-y-2">
              <Label htmlFor="phone-number">{t('channels.sms.phoneLabel')}</Label>
              <Input
                id="phone-number"
                type="tel"
                placeholder="+351123456789"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
              />
            </div>
          )}

          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="text-sm">
                  {t('channels.email.label')}
                </Label>
                <p className="text-xs text-muted-foreground">{t('channels.email.description')}</p>
              </div>
            </div>
            <Switch
              id="email-notifications"
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
            />
          </div>
        </div>

        <Separator />

        {/* Quiet Hours */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <Label>{t('quietHours.label')}</Label>
            </div>
            <Switch
              checked={quietHoursEnabled}
              onCheckedChange={setQuietHoursEnabled}
            />
          </div>

          {quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">{t('quietHours.start')}</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={quietHoursStart}
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end">{t('quietHours.end')}</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={quietHoursEnd}
                  onChange={(e) => setQuietHoursEnd(e.target.value)}
                />
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">{t('quietHours.description')}</p>
        </div>

        {/* Critical Alerts Override */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="critical-override" className="text-sm">
              {t('criticalOverride.label')}
            </Label>
            <p className="text-xs text-muted-foreground">{t('criticalOverride.description')}</p>
          </div>
          <Switch
            id="critical-override"
            checked={criticalOverride}
            onCheckedChange={setCriticalOverride}
          />
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          {tCommon('cancel')}
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {tCommon('saving')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {tCommon('save')}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
