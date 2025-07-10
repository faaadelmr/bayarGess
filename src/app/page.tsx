import BillSplitter from '@/components/bill-splitter';
import { Logo } from '@/components/logo';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-8">
        <div className="flex items-center gap-2">
          <Logo />
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-headline">
            BillSplit Buddy
          </h1>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <BillSplitter />
      </main>
      <footer className="flex items-center justify-center p-4 border-t">
        <p className="text-sm text-muted-foreground">
          Fairly splitting bills with the power of AI
        </p>
      </footer>
    </div>
  );
}
