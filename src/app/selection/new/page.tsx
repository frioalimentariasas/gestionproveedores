'use client';

import AuthGuard from '@/components/auth/auth-guard';
import CreateSelectionForm from '@/components/selection/create-selection-form';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NewSelectionPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto max-w-2xl p-4 py-12">
        <div className="flex items-center mb-8">
            <Button variant="outline" size="icon" asChild>
                <Link href="/selection">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight text-center flex-grow">
                Nuevo Proceso de Selección
            </h1>
        </div>
        <CreateSelectionForm />
      </div>
    </AuthGuard>
  );
}

    