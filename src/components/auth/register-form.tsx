'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useActionState, useEffect, useState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { register } from '@/app/actions';
import { RegisterSchema } from '@/lib/schemas';
import { locations } from '@/lib/locations';
import { countries } from '@/lib/countries';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, ChevronsUpDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Crear Cuenta
    </Button>
  );
}

const getFlagEmoji = (countryCode: string) => {
  if (!countryCode) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};


export function RegisterForm() {
  const [state, formAction] = useActionState(register, { message: '', errors: undefined });
  const [departments, setDepartments] = useState<{ name: string; cities: { name: string }[] }[]>([]);
  const [cities, setCities] = useState<{ name: string }[]>([]);
  const [phonePopoverOpen, setPhonePopoverOpen] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState('');

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      documentType: '',
      documentNumber: '',
      companyName: '',
      country: '',
      department: '',
      city: '',
      address: '',
      phoneCountryCode: '57', // Default to Colombia
      phoneNumber: '',
      email: '',
      password: '',
    },
  });

  const { setValue, watch } = form;
  const country = watch('country');
  const department = watch('department');
  const phoneCountryCode = watch('phoneCountryCode');

  const selectedCountryForPhone = useMemo(() => 
    countries.find((c) => c.phone === phoneCountryCode) || countries.find(c => c.code === 'CO'),
  [phoneCountryCode]);

  const filteredCountries = useMemo(() => {
    if (!phoneSearch) return countries;
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(phoneSearch.toLowerCase()) ||
        country.phone.includes(phoneSearch)
    );
  }, [phoneSearch]);

  useEffect(() => {
    const countryData = locations.find((c) => c.name === country);
    if (countryData) {
      setDepartments(countryData.departments);
    } else {
      setDepartments([]);
    }
    setValue('department', '');
    setValue('city', '');
  }, [country, setValue]);

  useEffect(() => {
    const departmentData = departments.find((d) => d.name === department);
    if (departmentData) {
      setCities(departmentData.cities);
    } else {
      setCities([]);
    }
    setValue('city', '');
  }, [department, departments, setValue]);


  useEffect(() => {
    if (state?.errors) {
      state.errors.forEach((error) => {
        form.setError(error.path[0] as keyof z.infer<typeof RegisterSchema>, {
          message: error.message,
        });
      });
    }
  }, [state, form]);

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="documentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de documento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Cédula de Ciudadanía">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="NIT">NIT</SelectItem>
                    <SelectItem value="Cédula de Extranjería">Cédula de Extranjería</SelectItem>
                    <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="documentNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de documento</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="123456789" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Razón social / Nombre</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Mi Empresa S.A.S." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un país" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locations.map((c) => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Departamento</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!country}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un departamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.name} value={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!department}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una ciudad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Calle 10 # 42-10" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Celular</FormLabel>
                  <div className="relative">
                     <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          placeholder={selectedCountryForPhone?.example}
                          className="pl-28" // Make space for the trigger
                        />
                      </FormControl>
                    <Popover open={phonePopoverOpen} onOpenChange={setPhonePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          role="combobox"
                          aria-expanded={phonePopoverOpen}
                          className="absolute left-1 top-1/2 h-8 -translate-y-1/2 w-24 justify-start text-left font-normal"
                        >
                          <span className="w-full truncate flex items-center gap-2">
                            {getFlagEmoji(selectedCountryForPhone?.code || '')} +{selectedCountryForPhone?.phone}
                          </span>
                           <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[320px] p-0">
                         <div className="p-2">
                           <Input 
                              placeholder="Buscar país..."
                              value={phoneSearch}
                              onChange={(e) => setPhoneSearch(e.target.value)}
                              className="h-9"
                           />
                         </div>
                         <ScrollArea className="h-64">
                           <div className="flex flex-col gap-y-1 p-1">
                            {filteredCountries.map((country) => (
                              <Button
                                key={country.code}
                                variant="ghost"
                                onClick={() => {
                                  setValue('phoneCountryCode', country.phone, { shouldValidate: true });
                                  setPhonePopoverOpen(false);
                                  setPhoneSearch('');
                                }}
                                className="w-full flex justify-start items-center gap-2 font-normal"
                              >
                                <span>{getFlagEmoji(country.code)}</span>
                                <span className="flex-1 text-left truncate">{country.name}</span>
                                <span className="text-muted-foreground text-sm">+{country.phone}</span>
                                <Check
                                  className={cn(
                                    'ml-auto h-4 w-4',
                                    phoneCountryCode === country.phone ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                              </Button>
                            ))}
                           </div>
                         </ScrollArea>
                      </PopoverContent>
                    </Popover>
                  </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="nombre@ejemplo.com" type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="••••••••" type="password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {state.message && !state.errors && (
           <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error de Registro</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        <SubmitButton />
      </form>
    </Form>
  );
}
