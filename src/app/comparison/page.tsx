'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { useRole } from '@/hooks/use-role';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, Search, Check, ChevronsUpDown } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { ComparisonView } from '@/components/comparison/comparison-view';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Category {
  id: string;
  name: string;
  categoryType?: string;
  sequenceId?: string;
}

export default function ComparisonPage() {
  const { isAdmin, isLoading } = useRole();
  const router = useRouter();
  const firestore = useFirestore();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [open, setOpen] = useState(false);

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
        <h1 className="text-3xl font-bold tracking-tight text-center mb-2">
          Comparador de Desempeño
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Busca y selecciona una categoría operativa para comparar el desempeño técnico de sus proveedores.
        </p>

        <div className="max-w-md mx-auto mb-12 flex justify-center">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between h-12 text-base border-primary/20 hover:border-primary transition-all shadow-sm"
              >
                <span className="truncate">
                  {selectedCategory
                    ? selectedCategoryData?.name
                    : "Escribe para buscar categoría..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command filter={(value, search) => {
                // Personalizamos el filtro para que busque en nombre e ID
                if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                return 0;
              }}>
                <CommandInput 
                  placeholder="Nombre o ID (ej: 0001)..." 
                  className="h-12" 
                />
                <CommandList className="max-h-72 overflow-y-auto overflow-x-hidden">
                  <CommandEmpty>No se encontraron coincidencias.</CommandEmpty>
                  <CommandGroup>
                    {categories?.sort((a, b) => a.name.localeCompare(b.name)).map((category) => (
                      <CommandItem
                        key={category.id}
                        value={`${category.name} ${category.sequenceId || ''}`}
                        onSelect={() => {
                          setSelectedCategory(category.id);
                          setOpen(false);
                        }}
                        className="flex items-center justify-between py-3 cursor-pointer aria-selected:bg-primary aria-selected:text-primary-foreground group"
                      >
                        <div className="flex flex-col gap-0.5 w-full">
                          <span className="font-bold text-foreground group-aria-selected:text-primary-foreground">
                            {category.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground group-aria-selected:text-primary-foreground/70 font-mono">
                              ID: {category.sequenceId || 'S/ID'}
                            </span>
                            {category.categoryType && (
                              <Badge variant="outline" className="text-[9px] h-4 py-0 px-1 uppercase group-aria-selected:border-primary-foreground group-aria-selected:text-primary-foreground">
                                {category.categoryType}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4 shrink-0",
                            selectedCategory === category.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {selectedCategory ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-center gap-2 mb-8 bg-muted/30 py-2 px-4 rounded-full w-fit mx-auto border">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Comparando:</span>
              <span className="text-sm font-black text-primary">{selectedCategoryData?.name}</span>
            </div>
            <ComparisonView categoryId={selectedCategory} />
          </div>
        ) : (
          <div className="text-center py-24 border-2 border-dashed rounded-2xl bg-muted/10">
            <Search className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">Inicia una comparación</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              Utiliza el buscador de arriba para seleccionar una categoría técnica y ver el ranking de cumplimiento ISO 9001 de los proveedores asociados.
            </p>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
