'use client';

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { X, Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

export type Option = Record<'value' | 'label', string>;

interface MultiSelectProps {
  options: Option[];
  selected: Option[];
  onChange: React.Dispatch<React.SetStateAction<Option[]>>;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select options',
  className,
  isLoading,
}: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const handleSelect = React.useCallback(
    (option: Option) => {
      onChange((prev) =>
        prev.some((p) => p.value === option.value)
          ? prev.filter((p) => p.value !== option.value)
          : [...prev, option]
      );
      inputRef.current?.focus();
    },
    [onChange]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (input.value === '' && selected.length > 0) {
            onChange((prev) => prev.slice(0, -1));
          }
        }
        if (e.key === 'Escape') {
          input.blur();
        }
      }
    },
    [onChange, selected]
  );

  const filteredOptions = options.filter(
    (option) =>
      !selected.some((s) => s.value === option.value) &&
      option.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Command
      onKeyDown={handleKeyDown}
      className={cn('overflow-visible bg-transparent', className)}
    >
      <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1">
          {selected.map((option) => (
            <Badge key={option.value} variant="secondary">
              {option.label}
              <button
                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSelect(option);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => handleSelect(option)}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
          <CommandPrimitive.Input
            ref={inputRef}
            value={query}
            onValueChange={setQuery}
            onBlur={() => setIsOpen(false)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="relative mt-2">
        <CommandList>
          {isOpen && (
            <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
              {isLoading ? (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  Cargando...
                </div>
              ) : (
                <CommandGroup className="h-full overflow-auto">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onSelect={() => {
                          setQuery('');
                          handleSelect(option);
                        }}
                        className={'cursor-pointer'}
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
                    ))
                  ) : (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      No se encontraron resultados.
                    </div>
                  )}
                </CommandGroup>
              )}
            </div>
          )}
        </CommandList>
      </div>
    </Command>
  );
}
