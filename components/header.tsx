import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Zap, BarChart2 } from "lucide-react"

export default function Header() {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500" />
          <span className="font-bold text-xl">ElectriMap</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/blog">
            <Button variant="ghost">Blog</Button>
          </Link>
          <Link href="/about">
            <Button variant="ghost">About</Button>
          </Link>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
