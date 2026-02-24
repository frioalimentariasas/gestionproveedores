'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { useRole } from '@/hooks/use-role';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Loader2, Search, Check, ListFilter, X } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { ComparisonView } from '@/components/comparison/comparison-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  categoryType?: 'Productos' | 'Servicios';
  sequenceId?: string;
}

export default function ComparisonPage() {
  const { isAdmin, isLoading } = useRole();
  const router = useRouter();
  const firestore = useFirestore();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const categoriesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'categories') : null),
    [firestore]
  );
  const { data: categories, isLoading: isLoadingCategories } =
    useCollection<Category>(categoriesQuery);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, isLoading, router]);

  const selectedCategoryData = categories?.find((c) => c.id === selectedCategory);

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    return categories
      .filter((cat) => {
        const search = searchTerm.toLowerCase();
        return (
          cat.name.toLowerCase().includes(search) ||
          cat.sequenceId?.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, searchTerm]);

  if (isLoading || isLoadingCategories) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
       <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto p-4 py-12">
        <div className="flex flex-col items-center gap-2 mb-8">
            <h1 className="text-4xl font-black tracking-tighter text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Comparador de Desempeño
            </h1>
            <p className="text-center text-muted-foreground max-w-lg">
                Selecciona una categoría técnica para analizar y comparar el cumplimiento ISO 9001 de los proveedores asociados.
            </p>
        </div>

        <div className="max-w-md mx-auto mb-12">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-14 justify-between border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all shadow-md group px-6"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                    <ListFilter className="h-5 w-5 text-primary shrink-0" />
                    <span className="truncate font-bold text-base">
                    {selectedCategory
                        ? selectedCategoryData?.name
                        : "Seleccionar Categoría Operativa..."}
                    </span>
                </div>
                <div className="bg-primary/10 p-1 rounded-md group-hover:bg-primary/20 transition-colors">
                    <Search className="h-4 w-4 text-primary" />
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-t-8 border-t-primary h-[80vh] flex flex-col">
              <DialogHeader className="p-6 pb-2 shrink-0">
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <ListFilter className="h-6 w-6 text-primary" />
                    Buscador de Categorías
                </DialogTitle>
                <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o ID (ej: 0001)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-12 text-base"
                        autoFocus
                    />
                    {searchTerm && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={() => setSearchTerm('')}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
              </DialogHeader>

              <ScrollArea className="flex-grow p-6 pt-2">
                <div className="space-y-2">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setIsModalOpen(false);
                          setSearchTerm('');
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left group",
                          selectedCategory === category.id 
                            ? "bg-primary text-primary-foreground border-primary shadow-md" 
                            : "hover:bg-muted hover:border-primary/50 bg-background"
                        )}
                      >
                        <div className="flex flex-col gap-1 overflow-hidden">
                          <span className="font-bold text-sm group-hover:translate-x-1 transition-transform truncate">
                            {category.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                                "text-[10px] font-mono",
                                selectedCategory === category.id ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              ID: {category.sequenceId || 'S/ID'}
                            </span>
                            {category.categoryType && (
                              <Badge 
                                variant={selectedCategory === category.id ? "outline" : "secondary"}
                                className={cn(
                                    "text-[9px] h-4 py-0 px-1.5 uppercase",
                                    selectedCategory === category.id && "border-primary-foreground text-primary-foreground"
                                )}
                              >
                                {category.categoryType}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {selectedCategory === category.id && (
                          <div className="bg-white/20 p-1 rounded-full">
                            <Check className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-muted/20 rounded-xl border-2 border-dashed">
                        <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No se encontraron categorías coincidentes.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-muted/10 shrink-0 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      Mostrando {filteredCategories.length} resultados
                  </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {selectedCategory ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-center gap-2 mb-8 bg-primary/5 py-3 px-6 rounded-full w-fit mx-auto border border-primary/10 shadow-sm">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Comparando:</span>
              <span className="text-base font-black text-primary">{selectedCategoryData?.name}</span>
            </div>
            <ComparisonView categoryId={selectedCategory} />
          </div>
        ) : (
          <div className="text-center py-24 border-2 border-dashed rounded-3xl bg-muted/10 max-w-2xl mx-auto flex flex-col items-center gap-4">
            <div className="bg-white p-6 rounded-full shadow-lg border border-primary/5">
                <Search className="h-12 w-12 text-primary/40" />
            </div>
            <h3 className="text-2xl font-bold">Inicia una comparación</h3>
            <p className="text-muted-foreground max-w-sm">
              Utiliza el buscador de arriba para seleccionar una categoría técnica y ver el ranking de cumplimiento ISO 9001 de los proveedores asociados.
            </p>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}