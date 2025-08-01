"use client";

import BillSplitter from '@/components/bill-splitter';
import { Logo } from '@/components/logo';
import logof from '../../public/breathing.png';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { FileText, LifeBuoy, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import 'intro.js/introjs.css';

export default function Home() {
  const [reportName, setReportName] = useState('');
  const [reportProblem, setReportProblem] = useState('');
  const [generatedReport, setGeneratedReport] = useState('');
  const [receiptDataUriForReport, setReceiptDataUriForReport] = useState<string | null>(null);
  const { toast } = useToast();

  const [typedText, setTypedText] = useState('#Coba');
  const words = ['AjaDulu', 'Lagi', 'AjaDulu', 'Mulai', 'AjaDulu', 'Berani', 'AjaDulu', 'Gagal', 'AjaDulu', 'Kawan'];

  const [tourEnabled, setTourEnabled] = useState(false);

  useEffect(() => {
    let wordIndex = 0;
    let isDeleting = false;
    let currentWord = '';
    let timeoutId: NodeJS.Timeout;

    const type = () => {
      const fullWord = words[wordIndex];
      
      if (isDeleting) {
        currentWord = fullWord.substring(0, currentWord.length - 1);
      } else {
        currentWord = fullWord.substring(0, currentWord.length + 1);
      }
      
      setTypedText(`#Coba${currentWord}`);
      
      let typeSpeed = isDeleting ? 100 : 150;

      if (!isDeleting && currentWord === fullWord) {
        typeSpeed = 1000; // Pause at end
        isDeleting = true;
      } else if (isDeleting && currentWord === '') {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        typeSpeed = 500; // Pause before new word
      }

      timeoutId = setTimeout(type, typeSpeed);
    };

    type();

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 md:px-8">
        <div className="flex items-center gap-2">
        <a href="https://bayargess.vercel.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 no-underline text-foreground">
          <Logo />
          <h1 className="text-2xl font-bold tracking-tight font-headline">
            bayarGess
          </h1>
        </a>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={() => setTourEnabled(true)}>
           Tutorial<HelpCircle className="h-4 w-4" />
           </Button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <BillSplitter 
          tourEnabled={tourEnabled}
          onTourExit={() => setTourEnabled(false)}
        />
      </main>
      <footer className="flex items-center justify-center p-4 border-t">
            <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
                    <div className="mb-2 sm:mb-0">
              <p className="text-xs text-base-content/80">
                &copy; {new Date().getFullYear()}{" "}
                <span className="font-medium text-red-600">bayarGess</span>. All rights
                reserved.<span className="animated-highlight-text text-black">{typedText}</span>
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
