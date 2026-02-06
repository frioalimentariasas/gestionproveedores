'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, X, ChevronsUpDown } from 'lucide-react';
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
import { Badge } from './badge';

export type Option = Record<'value' | 'label', string>;

interface MultiSelectProps {
  options: Option[];
  selected: Option[];
  onChange: React.Dispatch<React.SetStateAction<Option[]>>;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
}

function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Selecciona categorías...',
  className,
  isLoading,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (option: Option) => {
    onChange(selected.filter((s) => s.value !== option.value));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative', className)}>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10"
            onClick={() => setOpen(!open)}
          >
            <div className="flex gap-1 flex-wrap">
              {selected.length > 0 ? (
                selected.map((option) => (
                  <Badge
                    variant="secondary"
                    key={option.value}
                    className="mr-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnselect(option);
                    }}
                  >
                    {option.label}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground font-normal">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Buscar categoría..." />
          <CommandList>
            {isLoading ? (
              <div className="p-4 text-center text-sm">Cargando...</div>
            ) : (
              <>
                <CommandEmpty>No se encontró la categoría.</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      onSelect={() => {
                        const isSelected = selected.some(
                          (s) => s.value === option.value
                        );
                        if (isSelected) {
                          onChange(
                            selected.filter((s) => s.value !== option.value)
                          );
                        } else {
                          onChange([...selected, option]);
                        }
                        setOpen(true);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selected.some((s) => s.value === option.value)
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { MultiSelect };
