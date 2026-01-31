"use client";

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Zap } from "lucide-react"
import { UserContributions } from "@/components/user-contributions"

export default function Header() {
  const t = useTranslations('header');

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
            <UserContributions />
            <LanguageSwitcher />
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
