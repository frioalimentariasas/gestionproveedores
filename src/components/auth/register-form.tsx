'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useActionState, useEffect, useState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { register } from '@/app/actions';
import { RegisterSchema } from '@/lib/schemas';
import { countries as phoneCountries } from '@/lib/countries';
import { cn } from '@/lib/utils';
import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';

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

  // State for location data
  const [allCountries, setAllCountries] = useState<ICountry[]>([]);
  const [allStates, setAllStates] = useState<IState[]>([]);
  const [allCities, setAllCities] = useState<ICity[]>([]);

  // State for popovers and searches
  const [phonePopoverOpen, setPhonePopoverOpen] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState('');

  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const [departmentPopoverOpen, setDepartmentPopoverOpen] = useState(false);
  const [departmentSearch, setDepartmentSearch] = useState('');

  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');

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
  const selectedCountryName = watch('country');
  const selectedStateName = watch('department');
  const phoneCountryCode = watch('phoneCountryCode');
  
  // Load countries on mount
  useEffect(() => {
    setAllCountries(Country.getAllCountries());
  }, []);

  // Memo for phone country selector
  const selectedCountryForPhone = useMemo(() => 
    phoneCountries.find((c) => c.phone === phoneCountryCode) || phoneCountries.find(c => c.code === 'CO'),
  [phoneCountryCode]);

  const filteredPhoneCountries = useMemo(() => {
    if (!phoneSearch) return phoneCountries;
    return phoneCountries.filter(
      (country) =>
        country.name.toLowerCase().includes(phoneSearch.toLowerCase()) ||
        country.phone.includes(phoneSearch)
    );
  }, [phoneSearch]);

  // Memos for location selectors
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return allCountries;
    return allCountries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()));
  }, [countrySearch, allCountries]);

  const filteredStates = useMemo(() => {
    if (!departmentSearch) return allStates;
    return allStates.filter(d => d.name.toLowerCase().includes(departmentSearch.toLowerCase()));
  }, [departmentSearch, allStates]);

  const filteredCities = useMemo(() => {
    if (!citySearch) return allCities;
    return allCities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()));
  }, [citySearch, allCities]);

  // Effect for cascading dropdowns
  useEffect(() => {
    const countryData = allCountries.find((c) => c.name === selectedCountryName);
    if (countryData) {
      setAllStates(State.getStatesOfCountry(countryData.isoCode));
      setAllCities([]);
    } else {
      setAllStates([]);
      setAllCities([]);
    }
    setValue('department', '');
    setValue('city', '');
  }, [selectedCountryName, allCountries, setValue]);

  useEffect(() => {
    const countryData = allCountries.find((c) => c.name === selectedCountryName);
    const stateData = allStates.find((d) => d.name === selectedStateName);
    if (countryData && stateData) {
      setAllCities(City.getCitiesOfState(countryData.isoCode, stateData.isoCode));
    } else {
      setAllCities([]);
    }
    setValue('city', '');
  }, [selectedStateName, allStates, selectedCountryName, allCountries, setValue]);

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
              <FormItem className="flex flex-col">
                <FormLabel>País</FormLabel>
                <Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? allCountries.find(
                              (c) => c.name === field.value
                            )?.name
                          : "Seleccione un país"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Input
                        placeholder="Buscar país..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="h-9 rounded-b-none border-x-0 border-t-0"
                      />
                    <ScrollArea className="h-64">
                      {filteredCountries.map((c) => (
                        <Button
                          key={c.isoCode}
                          variant="ghost"
                          onClick={() => {
                            setValue('country', c.name, { shouldValidate: true });
                            setCountryPopoverOpen(false);
                            setCountrySearch('');
                          }}
                          className="w-full flex justify-start items-center gap-2 font-normal"
                        >
                          {c.name}
                          <Check
                            className={cn(
                              'ml-auto h-4 w-4',
                              field.value === c.name ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                        </Button>
                      ))}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Departamento</FormLabel>
                <Popover open={departmentPopoverOpen} onOpenChange={setDepartmentPopoverOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={!selectedCountryName || allStates.length === 0}
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value || "Seleccione un departamento"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Input
                      placeholder="Buscar departamento..."
                      value={departmentSearch}
                      onChange={(e) => setDepartmentSearch(e.target.value)}
                      className="h-9 rounded-b-none border-x-0 border-t-0"
                    />
                    <ScrollArea className="h-64">
                      {filteredStates.map((d) => (
                        <Button
                          key={d.isoCode}
                          variant="ghost"
                          onClick={() => {
                            setValue('department', d.name, { shouldValidate: true });
                            setDepartmentPopoverOpen(false);
                            setDepartmentSearch('');
                          }}
                          className="w-full flex justify-start items-center gap-2 font-normal"
                        >
                          {d.name}
                          <Check
                            className={cn(
                              'ml-auto h-4 w-4',
                              field.value === d.name ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                        </Button>
                      ))}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Ciudad</FormLabel>
                <Popover open={cityPopoverOpen} onOpenChange={setCityPopoverOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={!selectedStateName || allCities.length === 0}
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value || "Seleccione una ciudad"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Input
                      placeholder="Buscar ciudad..."
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      className="h-9 rounded-b-none border-x-0 border-t-0"
                    />
                    <ScrollArea className="h-64">
                      {filteredCities.length > 0 ? (
                        filteredCities.map((c) => (
                          <Button
                            key={c.name}
                            variant="ghost"
                            onClick={() => {
                              setValue('city', c.name, { shouldValidate: true });
                              setCityPopoverOpen(false);
                              setCitySearch('');
                            }}
                            className="w-full flex justify-start items-center gap-2 font-normal"
                          >
                            {c.name}
                            <Check
                              className={cn(
                                'ml-auto h-4 w-4',
                                field.value === c.name ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                          </Button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">No hay ciudades disponibles.</div>
                      )}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
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
                          className="pl-[8.5rem]"
                        />
                      </FormControl>
                    <Popover open={phonePopoverOpen} onOpenChange={setPhonePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          role="combobox"
                          aria-expanded={phonePopoverOpen}
                          className="absolute left-1 top-1/2 h-8 -translate-y-1/2 w-32 justify-start text-left font-normal"
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
                            {filteredPhoneCountries.map((country) => (
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
