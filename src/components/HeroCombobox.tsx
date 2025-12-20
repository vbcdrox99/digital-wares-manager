import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { dota2Heroes } from "@/data/dota2Heroes"
import { Check, ChevronsUpDown } from 'lucide-react';

interface HeroComboboxProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
}

export const HeroCombobox = ({ value, onChange, id, className }: HeroComboboxProps) => {
  const [open, setOpen] = useState(false);
  
  // Find hero that matches value (case insensitive)
  const selectedHero = dota2Heroes.find(hero => hero.toLowerCase() === value.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between bg-secondary/50", className)}
          id={id}
        >
          {selectedHero || (value ? value : "Selecione um herói...")}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Buscar herói..." />
          <CommandList>
            <CommandEmpty>Nenhum herói encontrado.</CommandEmpty>
            <CommandGroup>
              {dota2Heroes.map((hero) => (
                <CommandItem
                  key={hero}
                  value={hero}
                  onSelect={(currentValue) => {
                    onChange(hero)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.toLowerCase() === hero.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {hero}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
