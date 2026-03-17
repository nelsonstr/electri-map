"use client";

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Zap, AlertCircle, Bell } from "lucide-react";
import { UserContributions } from "@/components/user-contributions";
import { useState, useEffect } from 'react';
import type { CommunityAlert } from '@/types/community-alert';
import { AlertService } from '@/lib/services/emergency/alert-service';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AlertList } from '@/components/emergency/alert-list';
import { AlertSettings } from '@/components/emergency/alert-settings';

export default function Header() {
  const t = useTranslations('header');
  const [alerts, setAlerts] = useState<CommunityAlert[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(localStorage.getItem("electri_map_user_id"));
  }, []);

  useEffect(() => {
    // Fetch nearby alerts to show count
    const fetchAlerts = async () => {
      try {
        // Get user's location or use default
        const defaultLocation = { lat: 38.7223, lng: -9.1393 }; // Lisbon
        const alertService = new AlertService();
        const nearbyAlerts = await alertService.getNearbyAlerts(defaultLocation.lat, defaultLocation.lng, 10000);
        setAlerts(nearbyAlerts);
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      }
    };
    fetchAlerts();
  }, []);

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const totalCount = alerts.length;

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Zap className="h-6 w-6 text-yellow-500 fill-yellow-500" />
          <span className="font-bold text-xl tracking-tight">{t('siteName')}</span>
        </Link>
        <div className="flex items-center gap-2 md:gap-4">
          <nav className="hidden sm:flex items-center gap-1 md:gap-2 mr-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="font-medium">{t('nav.home')}</Button>
            </Link>
            <Link href="/blog">
              <Button variant="ghost" size="sm" className="font-medium">{t('nav.blog')}</Button>
            </Link>
            <Link href="/about">
              <Button variant="ghost" size="sm" className="font-medium">{t('nav.about')}</Button>
            </Link>

          </nav>
          <div className="flex items-center gap-2 border-l pl-2 md:pl-4">
            {/* Community Alerts Sheet */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label={t('communityAlert.notifications')} suppressHydrationWarning>
                  <Bell className="h-5 w-5" />
                  {totalCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {totalCount > 99 ? '99+' : totalCount}
                    </Badge>
                  )}
                  {criticalCount > 0 && (
                    <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px] h-full overflow-y-auto">
                <SheetHeader className="pb-4">
                  <SheetTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {t('communityAlert.title')}
                  </SheetTitle>
                </SheetHeader>
                
                {/* Tab selection */}
                <div className="flex gap-2 mb-4">
                  <Button 
                    variant={!showSettings ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setShowSettings(false)}
                    className="flex-1"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    {t('communityAlert.alertsTab')}
                  </Button>
                  <Button 
                    variant={showSettings ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setShowSettings(true)}
                    className="flex-1"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {t('communityAlert.settingsTab')}
                  </Button>
                </div>

                {showSettings ? (
                  userId ? (
                    <AlertSettings userId={userId} onClose={() => setSheetOpen(false)} />
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">Please sign in to manage settings.</div>
                  )
                ) : (
                  <AlertList 
                    userId={userId || ''}
                    onAlertClick={(alert) => {
                      // Could navigate to map or show details
                      console.log('Alert clicked:', alert);
                    }}
                  />
                )}
              </SheetContent>
            </Sheet>

            <UserContributions />
            <LanguageSwitcher />
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
