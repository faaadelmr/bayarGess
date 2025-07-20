import BillSplitter from '@/components/bill-splitter';
import { Logo } from '@/components/logo';
import logof from '../../public/breathing.png';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-8">
        <div className="flex items-center gap-2">
        <a href="https://bayargess.vercel.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 no-underline text-foreground">
          <Logo />
          <h1 className="text-2xl font-bold tracking-tight font-headline">
            bayarGess
          </h1>
        </a>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <BillSplitter />
      </main>
      <footer className="flex items-center justify-center p-4 border-t">
            <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
                    <div className="mb-2 sm:mb-0">
              <p className="text-xs text-base-content/80">
                &copy; {new Date().getFullYear()}{" "}
                <span className="font-medium text-red-600">bayarGess</span>. All rights
                reserved.
                        </p>
                    </div>
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-base-content/70">Crafted with </span>
              <div className="flex items-center justify-center">
                  <Image
                    src={logof}
                    alt="logo craft"
                  />
                </div> 
              <a href="https://github.com/faaadelmr" className="text-red-500 hover:text-red-600 transition-colors duration-300">
                faaadelmr
              </a>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
