
import Link from 'next/link';
import { Map, Settings2, HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Map className="h-7 w-7 text-primary" />
          <span className="font-bold text-xl text-primary">TacNavigator</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/">
              <HomeIcon className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/admin">
              <Settings2 className="h-4 w-4 mr-2" />
              Admin Panel
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
