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
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Info, Loader2 } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

type ProviderFormValues = z.infer<typeof providerFormSchema>;

const initialFormValues: ProviderFormValues = {
  serviceDescription: '',
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
  bankName: '',
  accountType: '',
  accountNumber: '',
  beneficiaryName: '',
  sarlaftAccepted: false,
  formLocked: false,
  rutFileUrl: '',
  camaraComercioFileUrl: '',
  estadosFinancierosFileUrl: '',
  declaracionRentaFileUrl: '',
  cedulaRepresentanteLegalFileUrl: '',
  certificacionBancariaFileUrl: '',
};

const documentTypes = ['NIT', 'CC', 'CE', 'Pasaporte'];
const personTypes = ['Persona Natural', 'Persona Jurídica'];
const taxRegimeTypes = ['Simplificado', 'Común'];
const yesNoOptions = ['Sí', 'No'];
const accountTypes = ['Ahorros', 'Corriente'];

export default function ProviderForm() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = getStorage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);

  const providerDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'providers', user.uid);
  }, [user, firestore]);

  const { data: providerData, isLoading: isProviderDataLoading } =
    useDoc<ProviderFormValues>(providerDocRef);

  const isLocked = providerData?.formLocked ?? false;

  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: initialFormValues,
  });

  const watchedCountry = form.watch('country');
  const watchedDepartment = form.watch('department');

  useEffect(() => {
    const country = Country.getAllCountries().find(c => c.name === watchedCountry);
    setStates(country ? State.getStatesOfCountry(country.isoCode) : []);
    setCities([]);
  }, [watchedCountry]);

  useEffect(() => {
    const country = Country.getAllCountries().find(c => c.name === watchedCountry);
    const state = country ? State.getStatesOfCountry(country.isoCode)?.find(s => s.name === watchedDepartment) : undefined;
    setCities(country && state ? City.getCitiesOfState(country.isoCode, state.isoCode) : []);
  }, [watchedCountry, watchedDepartment]);

  useEffect(() => {
    if (providerData) {
      const populatedValues = { ...initialFormValues, ...providerData };
      form.reset(populatedValues);
    }
  }, [providerData, form]);

  const uploadFile = async (
    file: File,
    fileName: string
  ): Promise<string> => {
    if (!user) throw new Error('Usuario no autenticado');
    const fileRef = ref(storage, `providers/${user.uid}/${fileName}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
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
        'estadosFinancierosFile',
        'declaracionRentaFile',
        'cedulaRepresentanteLegalFile',
        'certificacionBancariaFile',
      ];

      const fileNames: { [key: string]: string } = {
        rutFile: 'rut.pdf',
        camaraComercioFile: 'camara_comercio.pdf',
        estadosFinancierosFile: 'estados_financieros.pdf',
        declaracionRentaFile: 'declaracion_renta.pdf',
        cedulaRepresentanteLegalFile: 'cedula_representante.pdf',
        certificacionBancariaFile: 'certificacion_bancaria.pdf',
      };

      for (const field of fileFields) {
        const fileList = values[field as keyof typeof values] as FileList | undefined;
        if (fileList && fileList.length > 0) {
          const file = fileList[0];
          const urlField = `${field}Url` as keyof ProviderFormValues;
          const promise = uploadFile(file, fileNames[field]).then((url) => {
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
        email: user.email, // Ensure login email is saved
        formLocked: true,
      };

      fileFields.forEach((field) => delete (dataToSave as any)[field]);

      await setDoc(providerDocRef, dataToSave, { merge: true });

      toast({
        title: '¡Información guardada!',
        description:
          'Tus datos han sido guardados y bloqueados. Contacta a un administrador para realizar cambios.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'Ha ocurrido un error inesperado al guardar tus datos.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isProviderDataLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
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

        <div>
          <div className="bg-primary text-primary-foreground font-bold text-center p-3 rounded-t-lg">
            OBLIGATORIO DILIGENCIAMIENTO POR PARTE DEL PROVEEDOR
          </div>
          <Card className="rounded-t-none">
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="serviceDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Breve descripción del bien y/o servicio ofrecido:
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detalla los productos o servicios que tu empresa provee..."
                        {...field}
                        disabled={isLocked}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
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
                          <SelectItem key={country.isoCode} value={country.name}>
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
                        form.setValue('city', '');
                      }}
                      value={field.value}
                      disabled={isLocked || !watchedCountry}
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
                      disabled={isLocked || !watchedDepartment}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cities.map(
                          (city) => (
                            <SelectItem key={city.name} value={city.name}>
                              {city.name}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                  <FormLabel>Email de Inicio de Sesión</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormDescription>
                    Este es el email asociado a tu cuenta y no se puede
                    modificar.
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <FormField
                control={form.control}
                name="incomeSelfRetainerResolution"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Resolución No</FormLabel>
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Información Financiera para Pagos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entidad Bancaria</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLocked} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Cuenta</FormLabel>
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
                      {accountTypes.map((type) => (
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
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Cuenta</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLocked} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="beneficiaryName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Titular de la Cuenta</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLocked} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Documentos</CardTitle>
            <CardDescription>
              Adjunta los siguientes documentos en formato PDF (máximo 2MB cada
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
                estadosFinancierosFile: 'Estados Financieros',
                declaracionRentaFile: 'Declaración de Renta',
                cedulaRepresentanteLegalFile: 'Cédula Representante Legal',
                certificacionBancariaFile: 'Certificación Bancaria',
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
            <CardTitle>5. SARLAFT y Aceptación</CardTitle>
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
                    <FormLabel>Declaración y Autorización</FormLabel>
                    <FormDescription>
                      Declaro que los recursos que componen mi patrimonio no
                      provienen de lavado de activos, financiación del
                      terrorismo, narcotráfico, captación ilegal de dineros y en
                      general de cualquier actividad ilícita. Autorizo a Frio
                      Alimentaria S.A.S para que verifique la información
                      suministrada.
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
