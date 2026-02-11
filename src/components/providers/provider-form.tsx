'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { providerFormSchema } from '@/lib/schemas';
import { Country, State, City, IState, ICity } from 'country-state-city';
import {
  useFirestore,
  useUser,
  useDoc,
  useMemoFirebase,
  useCollection,
} from '@/firebase';
import { doc, setDoc, collection, query } from 'firebase/firestore';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Info, Loader2, Search } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { notifyAdminOfFormUpdate } from '@/actions/email';
import { ScrollArea } from '@/components/ui/scroll-area';

type ProviderFormValues = z.infer<typeof providerFormSchema>;

interface Category {
  id: string;
  name: string;
  categoryType: 'Bienes' | 'Servicios (Contratista)';
}

const initialFormValues: ProviderFormValues = {
  providerType: [],
  categoryIds: [],
  documentType: '',
  documentNumber: '',
  businessName: '',
  personType: '',
  city: '',
  department: '',
  country: '',
  address: '',
  fax: '',
  phone: '',
  website: '',
  providerContactName: '',
  providerContactTitle: '',
  providerContactEmail: '',
  paymentContactName: '',
  paymentContactTitle: '',
  paymentContactEmail: '',
  email: '',
  taxRegimeType: '',
  isLargeTaxpayer: '',
  largeTaxpayerResolution: '',
  isIncomeSelfRetainer: '',
  incomeSelfRetainerResolution: '',
  isIcaSelfRetainer: '',
  icaSelfRetainerMunicipality: '',
  icaSelfRetainerResolution: '',
  ciiuCode: '',
  icaCode: '',
  declarationCity: '',
  icaPercentage: '',
  implementsEnvironmentalMeasures: '',
  environmentalMeasuresDescription: '',
  legalRepresentativeName: '',
  legalRepresentativeDocumentType: '',
  legalRepresentativeDocumentNumber: '',
  bankName: '',
  accountType: '',
  accountNumber: '',
  beneficiaryName: '',
  hseqSgsst: '',
  sarlaftAccepted: false,
  formLocked: false,
  disabled: false,
  rutFileUrl: '',
  camaraComercioFileUrl: '',
  cedulaRepresentanteLegalFileUrl: '',
  certificacionBancariaFileUrl: '',
  estadosFinancierosFileUrl: '',
  declaracionRentaFileUrl: '',
};

const documentTypes = ['NIT', 'CC', 'CE', 'Pasaporte'];
const personTypes = ['Persona Natural', 'Persona Jurídica'];
const taxRegimeTypes = ['Simplificado', 'Común'];
const yesNoOptions = ['Sí', 'No'];
const legalRepDocTypes = ['CC', 'CE', 'Pasaporte'];

const providerTypeOptions = [
  { id: 'Bienes', label: 'Bienes' },
  { id: 'Servicios (Contratista)', label: 'Servicios (Contratista)' },
] as const;


export default function ProviderForm() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [persistedData, setPersistedData] =
    useState<ProviderFormValues | null>(null);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  const getAutoSaveKey = (userId: string) =>
    `provider-form-autosave-${userId}`;

  const providerDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'providers', user.uid);
  }, [user, firestore]);

  const { data: providerData, isLoading: isProviderDataLoading } =
    useDoc<ProviderFormValues>(providerDocRef);

  const categoriesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'categories')) : null),
    [firestore]
  );
  const { data: categories, isLoading: isCategoriesLoading } =
    useCollection<Category>(categoriesQuery);

  const isLocked = providerData?.formLocked ?? false;

  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: initialFormValues,
  });
  const { reset } = form;

  const watchedProviderType = form.watch('providerType');
  const watchedImplementsEnvironmentalMeasures = form.watch(
    'implementsEnvironmentalMeasures'
  );
  const watchedPersonType = form.watch('personType');
  const watchedTaxRegimeType = form.watch('taxRegimeType');
  const watchedIsLargeTaxpayer = form.watch('isLargeTaxpayer');
  const watchedIsIncomeSelfRetainer = form.watch('isIncomeSelfRetainer');
  const watchedIsIcaSelfRetainer = form.watch('isIcaSelfRetainer');

  // Check for auto-saved data on initial load
  useEffect(() => {
    if (user && !isProviderDataLoading && !providerData?.formLocked) {
      const autoSaveKey = getAutoSaveKey(user.uid);
      const savedDataString = localStorage.getItem(autoSaveKey);
      if (savedDataString) {
        try {
          const savedData = JSON.parse(savedDataString);
          setPersistedData(savedData);
          setShowRestoreDialog(true);
        } catch (e) {
          console.error('Error parsing autosaved form data:', e);
          localStorage.removeItem(autoSaveKey);
        }
      }
    }
  }, [user, isProviderDataLoading, providerData]);

  // Auto-save form data to local storage
  const watchedValues = form.watch();
  useEffect(() => {
    if (isLocked || !user) {
      return;
    }

    const autoSaveKey = getAutoSaveKey(user.uid);

    const handler = setTimeout(() => {
      const dataToSave = { ...watchedValues };
      delete (dataToSave as any).rutFile;
      delete (dataToSave as any).camaraComercioFile;
      delete (dataToSave as any).cedulaRepresentanteLegalFile;
      delete (dataToSave as any).certificacionBancariaFile;
      localStorage.setItem(autoSaveKey, JSON.stringify(dataToSave));
    }, 1000); // Debounce saving

    return () => {
      clearTimeout(handler);
    };
  }, [watchedValues, isLocked, user]);

  // Effect to populate form with data from Firestore
  const stableReset = useCallback(reset, []);
  useEffect(() => {
    if (providerData) {
      const { country, department } = providerData;
      if (country) {
        const countryData = Country.getAllCountries().find(c => c.name === country);
        if (countryData) {
          const countryStates = State.getStatesOfCountry(countryData.isoCode);
          setStates(countryStates || []);
          if (department) {
            const stateData = countryStates?.find(s => s.name === department);
            if (stateData) {
              setCities(City.getCitiesOfState(countryData.isoCode, stateData.isoCode) || []);
            }
          }
        }
      }
      stableReset({ ...initialFormValues, ...providerData });
    }
  }, [providerData, stableReset]);

  // Filter categories based on provider type selection
  const categoryOptions = useMemo(
    () =>
      categories
        ? categories.map((c) => ({ value: c.id, label: c.name, type: c.categoryType }))
        : [],
    [categories]
  );
  
  const filteredCategoryOptions = useMemo(() => {
    if (!watchedProviderType || watchedProviderType.length === 0) {
      return [];
    }
    // Filter categories where the category's type is included in the array of selected provider types.
    return categoryOptions.filter(
      (opt) => opt.type && watchedProviderType.includes(opt.type)
    );
  }, [watchedProviderType, categoryOptions]);

  const searchableCategoryOptions = useMemo(() => {
    if (!categorySearchTerm) {
      return filteredCategoryOptions;
    }
    return filteredCategoryOptions.filter((opt) =>
      opt.label.toLowerCase().includes(categorySearchTerm.toLowerCase())
    );
  }, [filteredCategoryOptions, categorySearchTerm]);


  // Clear selected categories if they are no longer in the filtered list
  useEffect(() => {
    const currentCategoryIds = form.getValues('categoryIds');
    if (currentCategoryIds && currentCategoryIds.length > 0) {
      const filteredIds = new Set(filteredCategoryOptions.map(opt => opt.value));
      const newCategoryIds = currentCategoryIds.filter(id => filteredIds.has(id));
      if (newCategoryIds.length !== currentCategoryIds.length) {
        form.setValue('categoryIds', newCategoryIds);
      }
    }
  }, [filteredCategoryOptions, form]);


  const uploadFile = async (
    file: File,
    userId: string,
    fileName: string
  ): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('fileName', fileName);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload file.');
    }

    const { url } = await response.json();
    return url;
  };

  async function onSubmit(values: ProviderFormValues) {
    if (!user || !providerDocRef) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes iniciar sesión para guardar tus datos.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const fileUploadPromises: Promise<void>[] = [];
      const updatedFileUrls: Partial<ProviderFormValues> = {};

      const fileFields: (keyof ProviderFormValues)[] = [
        'rutFile',
        'camaraComercioFile',
        'cedulaRepresentanteLegalFile',
        'certificacionBancariaFile',
        'estadosFinancierosFile',
        'declaracionRentaFile',
      ];

      const fileNames: { [key: string]: string } = {
        rutFile: 'rut.pdf',
        camaraComercioFile: 'camara_comercio.pdf',
        cedulaRepresentanteLegalFile: 'cedula_representante.pdf',
        certificacionBancariaFile: 'certificacion_bancaria.pdf',
        estadosFinancierosFile: 'estados_financieros.pdf',
        declaracionRentaFile: 'declaracion_renta.pdf',
      };

      for (const field of fileFields) {
        const fileList = values[field as keyof typeof values] as
          | FileList
          | undefined;
        if (fileList && fileList.length > 0) {
          const file = fileList[0];
          const urlField = `${field}Url` as keyof ProviderFormValues;
          const promise = uploadFile(file, user.uid, fileNames[field]).then((url) => {
            updatedFileUrls[urlField] = url;
          });
          fileUploadPromises.push(promise);
        }
      }

      await Promise.all(fileUploadPromises);

      const dataToSave = {
        ...values,
        ...updatedFileUrls,
        id: user.uid,
        formLocked: true,
      };

      // Exclude email from updates to prevent accidental overwrite.
      delete (dataToSave as any).email;
      
      fileFields.forEach((field) => delete (dataToSave as any)[field]);

      await setDoc(providerDocRef, dataToSave, { merge: true });
      
      // Notify admin about the form update (fire-and-forget)
      if(providerData?.email) {
          notifyAdminOfFormUpdate({
            businessName: dataToSave.businessName,
            email: providerData.email,
          }).catch(console.error);
      }


      // Clear autosaved data on successful submission
      if (user) {
        localStorage.removeItem(getAutoSaveKey(user.uid));
      }

      toast({
        title: '¡Información guardada!',
        description:
          'Tus datos han sido guardados y bloqueados. Contacta a un administrador para realizar cambios.',
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: error.message || 'Ha ocurrido un error inesperado al guardar tus datos.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleRestoreData = () => {
    if (persistedData) {
      form.reset(persistedData);
      toast({
        title: 'Datos restaurados',
        description:
          'Se ha cargado la información que tenías diligenciada.',
      });
    }
    setShowRestoreDialog(false);
  };

  const handleClearData = () => {
    if (user) {
      const autoSaveKey = getAutoSaveKey(user.uid);
      localStorage.removeItem(autoSaveKey);
      toast({
        title: 'Formulario limpiado',
        description: 'Puedes empezar a diligenciar tus datos desde cero.',
      });
    }
    setShowRestoreDialog(false);
  };

  if (isProviderDataLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restaurar datos no guardados?</AlertDialogTitle>
            <AlertDialogDescription>
              Detectamos que tienes información diligenciada que no ha sido
              guardada. ¿Deseas restaurarla y continuar donde la dejaste o
              prefieres empezar de nuevo con un formulario limpio?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleClearData}>
              Limpiar Formulario
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreData}>
              Restaurar Datos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {isLocked && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Formulario Bloqueado</AlertTitle>
            <AlertDescription>
              Tus datos ya han sido guardados. Para realizar modificaciones, por
              favor contacta a un administrador para que habilite la edición de
              tu formulario.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>1. Información del Proveedor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Tipo de Documento</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex space-x-4"
                        disabled={isLocked}
                      >
                        {documentTypes.map((type) => (
                          <FormItem
                            key={type}
                            className="flex items-center space-x-2 space-y-0"
                          >
                            <FormControl>
                              <RadioGroupItem value={type} />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {type}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documentNumber"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLocked} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Razón social o nombre</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLocked} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="personType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Persona</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-1"
                        disabled={isLocked}
                      >
                        {personTypes.map((type) => (
                          <FormItem
                            key={type}
                            className="flex items-center space-x-2"
                          >
                            <FormControl>
                              <RadioGroupItem value={type} />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {type}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="providerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Proveedor</FormLabel>
                  <div className="flex flex-col space-y-2 pt-2 sm:flex-row sm:space-y-0 sm:space-x-4">
                    {providerTypeOptions.map((item) => (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-center space-x-2 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={(field.value as string[])?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              const currentValue = (field.value as string[]) || [];
                              return checked
                                ? field.onChange([...currentValue, item.id])
                                : field.onChange(
                                    currentValue.filter((value) => value !== item.id)
                                  );
                            }}
                            disabled={isLocked}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{item.label}</FormLabel>
                      </FormItem>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="categoryIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categorías</FormLabel>
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar categorías..."
                                value={categorySearchTerm}
                                onChange={(e) => setCategorySearchTerm(e.target.value)}
                                className="pl-10"
                                disabled={isLocked}
                            />
                        </div>
                        <ScrollArea className="h-60 rounded-md border">
                            <div className="p-4 space-y-4">
                                {searchableCategoryOptions.length > 0 ? (
                                    searchableCategoryOptions.map((option) => (
                                    <FormItem
                                        key={option.value}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                        <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(option.value)}
                                            onCheckedChange={(checked) => {
                                            const currentValue = field.value || [];
                                            return checked
                                                ? field.onChange([...currentValue, option.value])
                                                : field.onChange(
                                                    currentValue.filter(
                                                        (value) => value !== option.value
                                                    )
                                                );
                                            }}
                                            disabled={isLocked}
                                        />
                                        </FormControl>
                                        <FormLabel className="font-normal cursor-pointer">
                                        {option.label}
                                        </FormLabel>
                                    </FormItem>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center">
                                    {isCategoriesLoading
                                        ? 'Cargando categorías...'
                                        : 'No se encontraron categorías. Selecciona un "Tipo de Proveedor" o ajusta tu búsqueda.'}
                                    </p>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isLocked ? (
                <>
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <FormControl>
                      <Input value={form.getValues('country') || ''} disabled />
                    </FormControl>
                  </FormItem>
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <FormControl>
                      <Input value={form.getValues('department') || ''} disabled />
                    </FormControl>
                  </FormItem>
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Input value={form.getValues('city') || ''} disabled />
                    </FormControl>
                  </FormItem>
                </>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>País</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            const country = Country.getAllCountries().find((c) => c.name === value);
                            setStates(country ? State.getStatesOfCountry(country.isoCode) : []);
                            setCities([]);
                            form.setValue('department', '');
                            form.setValue('city', '');
                          }}
                          value={field.value}
                          disabled={isLocked}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un país..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Country.getAllCountries().map((country) => (
                              <SelectItem
                                key={country.isoCode}
                                value={country.name}
                              >
                                {country.name}
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
                          onValueChange={(value) => {
                            field.onChange(value);
                            const countryName = form.getValues('country');
                            const country = Country.getAllCountries().find((c) => c.name === countryName);
                            const state = country ? State.getStatesOfCountry(country.isoCode)?.find((s) => s.name === value) : undefined;
                            setCities(country && state ? City.getCitiesOfState(country.isoCode, state.isoCode) : []);
                            form.setValue('city', '');
                          }}
                          value={field.value}
                          disabled={isLocked || !form.getValues('country')}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {states.map((state) => (
                              <SelectItem key={state.isoCode} value={state.name}>
                                {state.name}
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
                          disabled={isLocked || !form.getValues('department')}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cities.map((city) => (
                              <SelectItem key={city.name} value={city.name}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLocked} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono Celular</FormLabel>
                    <FormControl>
                      <PhoneInput
                        country={'co'}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLocked}
                        inputClass="form-control"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fax</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLocked} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pag web</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLocked} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="providerContactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del contacto del proveedor</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLocked} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="providerContactTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLocked} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="providerContactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} disabled={isLocked} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="paymentContactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nombre de la persona para notificar pago
                  </FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLocked} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="paymentContactTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLocked} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentContactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email para notificación pago</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} disabled={isLocked} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email para Notificaciones</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormDescription>
                    Este es el email principal para notificaciones y no puede ser modificado.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
              <CardTitle>2. Información Tributaria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="taxRegimeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Régimen</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLocked}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {taxRegimeTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedTaxRegimeType === 'Común' && (
                <div className="space-y-6 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <FormField
                      control={form.control}
                      name="isLargeTaxpayer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gran Contribuyente</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isLocked}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {yesNoOptions.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {watchedIsLargeTaxpayer === 'Sí' && (
                      <FormField
                        control={form.control}
                        name="largeTaxpayerResolution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resolución No</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isLocked} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {watchedPersonType === 'Persona Jurídica' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <FormField
                        control={form.control}
                        name="isIncomeSelfRetainer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Autorretenedor Renta</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isLocked}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {yesNoOptions.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {watchedIsIncomeSelfRetainer === 'Sí' && (
                        <FormField
                          control={form.control}
                          name="incomeSelfRetainerResolution"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Resolución No</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={isLocked} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}

                  {watchedIsLargeTaxpayer === 'Sí' && (
                    <div className="space-y-6 pt-4 border-t">
                      <FormField
                          control={form.control}
                          name="isIcaSelfRetainer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Autorretenedor ICA</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isLocked}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {yesNoOptions.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                      {watchedIsIcaSelfRetainer === 'Sí' && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="icaSelfRetainerMunicipality"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Indique municipio</FormLabel>
                                    <FormControl>
                                      <Input {...field} disabled={isLocked} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="icaSelfRetainerResolution"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Resolución No</FormLabel>
                                    <FormControl>
                                      <Input {...field} disabled={isLocked} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="icaCode"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Código actividad económica ICA</FormLabel>
                                    <FormControl>
                                      <Input {...field} disabled={isLocked} type="number" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            <FormField
                                control={form.control}
                                name="icaPercentage"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Porcentaje según ICA (%)</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        disabled={isLocked}
                                        type="number"
                                        step="0.01"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="ciiuCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código actividad económica CIIU</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLocked} type="number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="declarationCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciudad donde declara</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLocked} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

            </CardContent>
          </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Información Ambiental</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <FormField
                control={form.control}
                name="implementsEnvironmentalMeasures"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      ¿La empresa implementa medidas a favor del medio ambiente?
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex space-x-4"
                        disabled={isLocked}
                      >
                        {yesNoOptions.map((type) => (
                          <FormItem
                            key={type}
                            className="flex items-center space-x-2 space-y-0"
                          >
                            <FormControl>
                              <RadioGroupItem value={type} />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {type}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="environmentalMeasuresDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>¿Cuáles?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describa las medidas..."
                        {...field}
                        disabled={
                          isLocked ||
                          watchedImplementsEnvironmentalMeasures !== 'Sí'
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {watchedPersonType === 'Persona Jurídica' && (
          <Card>
            <CardHeader>
              <CardTitle>4. Datos del Representante Legal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="legalRepresentativeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Representante Legal</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLocked} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="legalRepresentativeDocumentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Documento</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex space-x-4"
                          disabled={isLocked}
                        >
                          {legalRepDocTypes.map((type) => (
                            <FormItem
                              key={type}
                              className="flex items-center space-x-2 space-y-0"
                            >
                              <FormControl>
                                <RadioGroupItem value={type} />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {type}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="legalRepresentativeDocumentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isLocked} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {watchedPersonType === 'Persona Jurídica' ? '5' : '4'}.
              Inscripción de cuenta para pago electrónico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="beneficiaryName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Autorizamos consignar en nuestra cuenta bancaria a nombre
                    de:
                  </FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLocked} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Cuenta</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex space-x-4 pt-2"
                        disabled={isLocked}
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Corriente" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Cta. corriente
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Ahorros" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Cta. de ahorros
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No de cuenta:</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLocked} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banco:</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLocked} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {watchedPersonType === 'Persona Jurídica' ? '6' : '5'}. Documentos
            </CardTitle>
            <CardDescription>
              Adjunta los siguientes documentos en formato PDF (máximo 5MB cada
              uno).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(
              [
                'rutFile',
                'camaraComercioFile',
                'estadosFinancierosFile',
                'declaracionRentaFile',
                'cedulaRepresentanteLegalFile',
                'certificacionBancariaFile',
              ] as const
            ).map((fieldName) => {
              const labels: Record<string, string> = {
                rutFile: 'RUT',
                camaraComercioFile: 'Cámara de Comercio',
                cedulaRepresentanteLegalFile: 'Cédula Representante Legal',
                certificacionBancariaFile: 'Certificación Bancaria',
                estadosFinancierosFile: 'Estados Financieros',
                declaracionRentaFile: 'Declaración de Renta',
              };
              const urlField = `${fieldName}Url` as keyof ProviderFormValues;
              const fileUrl = providerData?.[urlField];
              return (
                <FormField
                  key={fieldName}
                  control={form.control}
                  name={fieldName}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labels[fieldName]}</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="application/pdf"
                          {...form.register(fieldName)}
                          disabled={isLocked}
                        />
                      </FormControl>
                      {fieldName === 'rutFile' && (
                        <FormDescription>Actualizado</FormDescription>
                      )}
                      {fieldName === 'camaraComercioFile' && (
                        <FormDescription>No mayor a 60 días</FormDescription>
                      )}
                      {fileUrl && typeof fileUrl === 'string' && (
                        <FormDescription>
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 underline"
                          >
                            Ver documento actual
                          </a>
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {watchedPersonType === 'Persona Jurídica' ? '7' : '6'}.
              INFORMACION HSEQ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="hseqSgsst"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>
                    Su empresa cuenta con SG-SST acorde al Decreto 1072, con
                    resultado de evaluación de la resolución 0312/19, por encima
                    del 60%
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                      disabled={isLocked}
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Sí" />
                        </FormControl>
                        <FormLabel className="font-normal">Sí</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="No" />
                        </FormControl>
                        <FormLabel className="font-normal">No</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {watchedPersonType === 'Persona Jurídica' ? '8' : '7'}.
              DECLARACION SARLAFT Y AUTORIZACION PARA EL MANEJO Y PROTECCION DE
              DATOS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="sarlaftAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLocked}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Acepto la declaración de origen de fondos y la política de
                      tratamiento de datos
                    </FormLabel>
                    <FormDescription className="space-y-4 text-xs">
                      <div>
                        De manera voluntaria y dando certeza de que todo lo aquí
                        consignado es cierto, realizo la siguiente declaración
                        de origen de fondos a FRIOALIMENTARIA SAS., con el
                        propósito de dar cumplimiento a lo señalado en el
                        Estatuto Orgánico del Sistema Financiero (Decreto 663 de
                        1993), ley 190 de 1995 (Estatuto Anticorrupción) y demás
                        normas legales concordantes: 1. La actividad de la
                        empresa es lícita y se ejerce dentro del marco legal y
                        los recursos que posee no provienen de actividades
                        ilícitas de las contempladas en el Código Penal
                        Colombiano. 2. Los recursos comprometidos para el
                        desarrollo del objeto social de la compañía provienen de
                        fuentes lícitas. 3. Los recursos que se deriven del
                        desarrollo de este contrato no se destinarán a la
                        financiación del terrorismo, grupos terroristas o
                        actividades terroristas.
                      </div>
                      <div>
                        En virtud de la Ley 1581 de 2012 y sus normas
                        reglamentarias, el titular de la información personal,
                        declara que la entrega en forma libre y voluntaria y
                        autoriza que la misma entre a formar parte de las bases
                        de datos de la empresa FRIOALIMENTARIA SAS., para el
                        tratamiento de servicio de los datos en actividades del
                        objeto social de FRIOALIMENTARIA SAS acuerdo con la
                        legislación vigente. Así mismo, manifiesta que los datos
                        personales de los colaboradores de la persona jurídica
                        que representa, lo han autorizado para entregarlos a
                        terceros, en el desarrollo del objeto social propio.
                        FRIOALIMENTARIA SAS. garantiza el cumplimiento de los
                        principios señalados en la ley 1581 de 2.012 y sus
                        decretos reglamentarios, en particular lo relacionado
                        con la seguridad y la confidencialidad con la que se
                        manejan los datos recibidos. El titular manifiesta que
                        ha sido informado que tiene el derecho a acceder,
                        modificar, rectificar, suprimir, solicitar la copia de
                        su autorización, a formular quejas, reclamos y consultas
                        frente al tratamiento que haga FRIOALIMENTARIA SAS de
                        sus datos personales. Para ejercer esos derechos puede
                        contactarse al correo electrónico:
                        contabilidad@frioalimentaria.com.co, al telefono: (+5)
                        6424342 ext 100 o mediante documento escrito a la
                        siguiente dirección: Variante Cartagena Turbaco Zona
                        Franca Parque Central Lote 69.
                      </div>
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {!isLocked && (
          <Button
            type="submit"
            className="w-full md:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              'Guardar y Bloquear Formulario'
            )}
          </Button>
        )}
      </form>
    </Form>
  );
}
