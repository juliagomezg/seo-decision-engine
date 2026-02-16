'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function BackButton({ onClick, disabled = false }: BackButtonProps) {
  return (
    <Button
      variant="ghost"
      size="default"
      onClick={onClick}
      disabled={disabled}
      className="gap-2 text-muted-foreground hover:text-foreground min-h-[44px]"
    >
      <ArrowLeft className="w-4 h-4" />
      Volver
    </Button>
  );
}
