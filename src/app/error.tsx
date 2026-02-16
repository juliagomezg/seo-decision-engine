'use client';

import { Button } from '@/components/ui/button';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-semibold text-foreground">Algo salió mal</h2>
        <p className="text-muted-foreground">
          Ocurrió un error inesperado. Intenta de nuevo.
        </p>
        <Button onClick={reset} variant="default">
          Reintentar
        </Button>
      </div>
    </div>
  );
}
