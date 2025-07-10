import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-8">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-48" />
      </header>
      <main className="flex-1 p-4 md:p-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </div>
      </main>
    </div>
  );
}
