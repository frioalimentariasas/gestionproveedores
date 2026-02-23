'use client';

import AuthGuard from '@/components/auth/auth-guard';
import CreateSelectionForm from '@/components/selection/create-selection-form';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NewSelectionPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto max-w-2xl p-4 py-12">
        <div className="flex items-center mb-6">
            <Button variant="outline" size="icon" asChild>
                <Link href="/selection">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <div className="flex-grow text-center">
                <h1 className="text-3xl font-bold tracking-tight">
                    Nuevo Proceso de Selección
                </h1>
                <p className="text-xs font-bold text-primary uppercase mt-1 flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Marco Normativo ISO 9001:2015
                </p>
            </div>
        </div>
        <CreateSelectionForm />
      </div>
    </AuthGuard>
  );
}
