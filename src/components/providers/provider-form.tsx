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
import { doc, setDoc, collection, query, Timestamp } from 'firebase/firestore';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Eye, Info, Loader2, Search, Clock, Send, ShieldAlert, AlertTriangle, FileText } from 'lucide-react';
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
import { notifyAdminOfFormUpdate, notifyAdminOfReactivationRequest, notifyProviderPendingForm, notifyProviderFormSubmitted } from '@/actions/email';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';

type ProviderFormValues = z.infer<typeof providerFormSchema>;

interface Category {
  id: string;
  name: string;
  categoryType: 'Productos' | 'Servicios';
}

const initialFormValues: ProviderFormValues = {
  serviceDescription: '',
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
  { id: 'Productos', label: 'Productos' },
  { id: 'Servicios', label: 'Servicios' },
] as const;


export default function ProviderForm({ previewMode = false }: { previewMode?: boolean }) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [persistedData, setPersistedData] = useState<ProviderFormValues | null>(null);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [isSendingJustification, setIsSendingJustification] = useState(false);
  const [justification, setJustification] = useState('');

  const getAutoSaveKey = (userId: string) => `provider-form-autosave-${userId}`;
  const getWelcomeKey = (userId: string) => `provider-welcome-shown-${userId}`;

  const providerDocRef = useMemoFirebase(() => {
    if (!user || !firestore || previewMode) return null;
    return doc(firestore, 'providers', user.uid);
  }, [user, firestore, previewMode]);

  const { data: providerData, isLoading: isProviderDataLoading } = useDoc<any>(providerDocRef);

  const categoriesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'categories')) : null),
    [firestore]
  );
  const { data: categories, isLoading: isCategoriesLoading } = useCollection<Category>(categoriesQuery);

  const daysSinceRegistration = useMemo(() => {
    if (!providerData?.createdAt) return 0;
    const createdAt = (providerData.createdAt as Timestamp).toDate();
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [providerData]);

  const isBlockedByTime = useMemo(() => {
    if (previewMode || providerData?.formLocked) return false;
    return daysSinceRegistration >= 9;
  }, [daysSinceRegistration, providerData, previewMode]);

  const daysLeft = Math.max(0, 8 - daysSinceRegistration);
  const isLocked = previewMode ? false : (providerData?.formLocked ?? false);

  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: initialFormValues,
  });
  
  const { reset } = form;
  const watchedProviderType = form.watch('providerType');
  const watchedPersonType = form.watch('personType');
  const watchedTaxRegimeType = form.watch('taxRegimeType');
  const watchedIsLargeTaxpayer = form.watch('isLargeTaxpayer');
  const watchedImplementsEnvironmentalMeasures = form.watch('implementsEnvironmentalMeasures');

  useEffect(() => {
    if (user && !isProviderDataLoading && !previewMode && !isBlockedByTime && !providerData?.formLocked) {
      const welcomeKey = getWelcomeKey(user.uid);
      if (!localStorage.getItem(welcomeKey)) {
        setShowWelcomeDialog(true);
        localStorage.setItem(welcomeKey, 'true');
      }
    }
  }, [user, isProviderDataLoading, previewMode, isBlockedByTime, providerData]);

  useEffect(() => {
    if (user && !isProviderDataLoading && !providerData?.formLocked && !previewMode && !isBlockedByTime) {
      const autoSaveKey = getAutoSaveKey(user.uid);
      const savedDataString = localStorage.getItem(autoSaveKey);
      if (savedDataString) {
        try {
          const savedData = JSON.parse(savedDataString);
          setPersistedData(savedData);
          setShowRestoreDialog(true);
        } catch (e) {
          localStorage.removeItem(autoSaveKey);
        }
      }
    }
  }, [user, isProviderDataLoading, providerData, previewMode, isBlockedByTime]);

  const watchedValues = form.watch();
  useEffect(() => {
    if (isLocked || !user || previewMode || isBlockedByTime) return;
    const autoSaveKey = getAutoSaveKey(user.uid);
    const handler = setTimeout(() => {
      const dataToSave = { ...watchedValues };
      // Don't autosave large FileList objects
      delete (dataToSave as any).rutFile;
      delete (dataToSave as any).camaraComercioFile;
      delete (dataToSave as any).cedulaRepresentanteLegalFile;
      delete (dataToSave as any).certificacionBancariaFile;
      delete (dataToSave as any).estadosFinancierosFile;
      delete (dataToSave as any).declaracionRentaFile;
      localStorage.setItem(autoSaveKey, JSON.stringify(dataToSave));
    }, 1000);
    return () => clearTimeout(handler);
  }, [watchedValues, isLocked, user, previewMode, isBlockedByTime]);

  const stableReset = useCallback(reset, []);
  useEffect(() => {
    if (providerData && !previewMode) {
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
  }, [providerData, stableReset, previewMode]);

  const categoryOptions = useMemo(
    () => (categories ? categories.map((c) => ({ value: c.id, label: c.name, type: c.categoryType })) : []),
    [categories]
  );
  
  const filteredCategoryOptions = useMemo(() => {
    if (!watchedProviderType || watchedProviderType.length === 0) return [];
    return categoryOptions.filter((opt) => opt.type && watchedProviderType.includes(opt.type));
  }, [watchedProviderType, categoryOptions]);

  const searchableCategoryOptions = useMemo(() => {
    if (!categorySearchTerm) return filteredCategoryOptions;
    return filteredCategoryOptions.filter((opt) => opt.label.toLowerCase().includes(categorySearchTerm.toLowerCase()));
  }, [filteredCategoryOptions, categorySearchTerm]);

  const uploadFile = async (file: File, userId: string, fileName: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('fileName', fileName);
    const response = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!response.ok) throw new Error((await response.json()).error || 'Failed to upload file.');
    return (await response.json()).url;
  };

  async function onSubmit(values: ProviderFormValues) {
    if (previewMode || isBlockedByTime) return;
    if (!user || !providerDocRef) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const fileUploadPromises: Promise<void>[] = [];
      const updatedFileUrls: Partial<ProviderFormValues> = {};
      const fileFields: (keyof ProviderFormValues)[] = ['rutFile', 'camaraComercioFile', 'cedulaRepresentanteLegalFile', 'certificacionBancariaFile', 'estadosFinancierosFile', 'declaracionRentaFile'];
      const fileNames: { [key: string]: string } = { rutFile: 'rut.pdf', camaraComercioFile: 'camara_comercio.pdf', cedulaRepresentanteLegalFile: 'cedula_representante.pdf', certificacionBancariaFile: 'certificacion_bancaria.pdf', estadosFinancierosFile: 'estados_financieros.pdf', declaracionRentaFile: 'declaracion_renta.pdf' };

      for (const field of fileFields) {
        const fileList = values[field as keyof typeof values] as FileList | undefined;
        if (fileList && fileList.length > 0) {
          const file = fileList[0];
          const urlField = `${field}Url` as keyof ProviderFormValues;
          fileUploadPromises.push(uploadFile(file, user.uid, fileNames[field]).then((url) => { updatedFileUrls[urlField] = url; }));
        }
      }

      await Promise.all(fileUploadPromises);
      const dataToSave = { ...values, ...updatedFileUrls, id: user.uid, formLocked: true };
      delete (dataToSave as any).email;
      fileFields.forEach((field) => delete (dataToSave as any)[field]);

      await setDoc(providerDocRef, dataToSave, { merge: true });
      
      const providerEmail = providerData?.email;
      if(providerEmail) {
          notifyAdminOfFormUpdate({ businessName: dataToSave.businessName, email: providerEmail }).catch(console.error);
          notifyProviderFormSubmitted({ providerEmail: providerEmail, providerName: dataToSave.businessName }).catch(console.error);
      }

      localStorage.removeItem(getAutoSaveKey(user.uid));
      toast({ title: '¡Información guardada!', description: 'Tus datos han sido guardados y bloqueados para revisión.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al guardar', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleSendJustification = async () => {
    if (!justification.trim() || !providerData) return;
    setIsSendingJustification(true);
    try {
      const result = await notifyAdminOfReactivationRequest({
        providerEmail: providerData.email,
        businessName: providerData.businessName,
        justification: justification
      });
      if (result.success) {
        toast({ title: 'Justificación Enviada', description: 'El administrador revisará tu solicitud.' });
        setJustification('');
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error al enviar', description: e.message });
    } finally {
      setIsSendingJustification(false);
    }
  };

  if (isProviderDataLoading && !previewMode) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isBlockedByTime) {
    return (
      <div className="container mx-auto max-w-2xl p-4 py-12">
        <Card className="border-destructive/50 border-t-8 border-t-destructive">
          <CardHeader className="text-center">
            <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-destructive animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-black uppercase text-destructive">Formulario Bloqueado por Tiempo</CardTitle>
            <CardDescription className="text-base pt-2">
              Han pasado {daysSinceRegistration} días desde tu registro inicial. Según nuestras políticas ISO 9001, el plazo máximo de diligenciamiento es de 8 días.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg border space-y-4">
              <Label className="font-bold flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Solicitar Extensión de Plazo
              </Label>
              <Textarea 
                placeholder="Explica brevemente por qué no pudiste completar el formulario a tiempo..."
                className="min-h-[120px] bg-background"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
              />
            </div>
            <Button className="w-full" disabled={!justification.trim() || isSendingJustification} onClick={handleSendJustification}>
              {isSendingJustification ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Enviar Justificación al Administrador
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Form {...form}>
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Restaurar datos?</AlertDialogTitle><AlertDialogDescription>Detectamos información no guardada. ¿Deseas restaurarla?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => { localStorage.removeItem(getAutoSaveKey(user!.uid)); setShowRestoreDialog(false); }}>Limpiar</AlertDialogCancel><AlertDialogAction onClick={() => { if (persistedData) form.reset(persistedData); setShowRestoreDialog(false); }}>Restaurar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <AlertDialogContent className="border-t-8 border-t-primary">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-primary mb-2">
                <Clock className="h-6 w-6" />
                <AlertDialogTitle className="text-xl">Importante: Plazo de Registro</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base text-foreground">
              Bienvenido al portal de proveedores. Para asegurar la agilidad de nuestros procesos ISO 9001, cuentas con un plazo máximo de <strong>8 días calendario</strong> para completar este formulario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogAction className="w-full">Empezar registro</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {!previewMode && !isLocked && (
            <div className={cn(
                "sticky top-24 z-40 p-4 rounded-lg border shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4",
                daysLeft <= 2 ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
            )}>
                <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5" />
                    <span className="font-bold uppercase tracking-wider text-sm">Plazo Restante de Registro: {daysLeft} Días</span>
                </div>
            </div>
        )}

        {isLocked && !previewMode && (
          <Alert className="border-primary bg-primary/5">
            <ShieldAlert className="h-4 w-4 text-primary" />
            <AlertTitle className="font-bold">Formulario en Revisión</AlertTitle>
            <AlertDescription>Tus datos han sido bloqueados para auditoría. Si necesitas realizar cambios, solicita el desbloqueo al administrador.</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader><CardTitle>Descripción Inicial</CardTitle></CardHeader>
          <CardContent>
            <FormField control={form.control} name="serviceDescription" render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción detallada del bien y/o servicio que ofrece</FormLabel>
                <FormControl><Textarea placeholder="Indique claramente qué suministra o qué servicios presta..." {...field} disabled={isLocked} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>1. Información del Proveedor</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
              <FormField control={form.control} name="documentType" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Tipo de Documento</FormLabel>
                    <FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4" disabled={isLocked}>{documentTypes.map((type) => (<FormItem key={type} className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value={type} /></FormControl><FormLabel className="font-normal">{type}</FormLabel></FormItem>))}</RadioGroup></FormControl><FormMessage />
                  </FormItem>
                )} />
              <FormField control={form.control} name="documentNumber" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Número</FormLabel><FormControl><Input {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={form.control} name="businessName" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Razón social o nombre completo</FormLabel><FormControl><Input {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="personType" render={({ field }) => (
                  <FormItem><FormLabel>Tipo de Persona</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-1" disabled={isLocked}>{personTypes.map((type) => (<FormItem key={type} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={type} /></FormControl><FormLabel className="font-normal">{type}</FormLabel></FormItem>))}</RadioGroup></FormControl><FormMessage /></FormItem>
                )} />
            </div>
            <FormField control={form.control} name="providerType" render={({ field }) => (
                <FormItem><FormLabel>Sector</FormLabel><div className="flex flex-col space-y-2 pt-2 sm:flex-row sm:space-y-0 sm:space-x-4">{providerTypeOptions.map((item) => (<FormItem key={item.id} className="flex row items-center space-x-2 space-y-0"><FormControl><Checkbox checked={(field.value as string[])?.includes(item.id)} onCheckedChange={(checked) => { const currentValue = (field.value as string[]) || []; return checked ? field.onChange([...currentValue, item.id]) : field.onChange(currentValue.filter((value) => value !== item.id)); }} disabled={isLocked} /></FormControl><FormLabel className="font-normal">{item.label}</FormLabel></FormItem>))}</div><FormMessage /></FormItem>
              )} />
            <FormField control={form.control} name="categoryIds" render={({ field }) => (
                <FormItem><FormLabel>Categorías de Suministro</FormLabel><div className="space-y-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Filtrar categorías..." value={categorySearchTerm} onChange={(e) => setCategorySearchTerm(e.target.value)} className="pl-10" disabled={isLocked} /></div><ScrollArea className="h-60 rounded-md border"><div className="p-4 space-y-4">{searchableCategoryOptions.length > 0 ? (searchableCategoryOptions.map((option) => (<FormItem key={option.value} className="flex row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(option.value)} onCheckedChange={(checked) => { const currentValue = field.value || []; return checked ? field.onChange([...currentValue, option.value]) : field.onChange(currentValue.filter((value) => value !== option.value)); }} disabled={isLocked} /></FormControl><FormLabel className="font-normal cursor-pointer">{option.label}</FormLabel></FormItem>))) : (<p className="text-sm text-muted-foreground text-center">Seleccione un sector arriba.</p>)}</div></ScrollArea></div><FormMessage /></FormItem>
              )} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={form.control} name="country" render={({ field }) => (<FormItem><FormLabel>País</FormLabel><Select onValueChange={(value) => { field.onChange(value); const country = Country.getAllCountries().find((c) => c.name === value); setStates(country ? State.getStatesOfCountry(country.isoCode) : []); setCities([]); form.setValue('department', ''); form.setValue('city', ''); }} value={field.value} disabled={isLocked}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl><SelectContent>{Country.getAllCountries().map((country) => (<SelectItem key={country.isoCode} value={country.name}>{country.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="department" render={({ field }) => (<FormItem><FormLabel>Departamento</FormLabel><Select onValueChange={(value) => { field.onChange(value); const countryName = form.getValues('country'); const country = Country.getAllCountries().find((c) => c.name === countryName); const state = country ? State.getStatesOfCountry(country.isoCode)?.find((s) => s.name === value) : undefined; setCities(country && state ? City.getCitiesOfState(country.isoCode, state.isoCode) : []); form.setValue('city', ''); }} value={field.value} disabled={isLocked || !form.getValues('country')}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl><SelectContent>{states.map((state) => (<SelectItem key={state.isoCode} value={state.name}>{state.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>Ciudad</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isLocked || !form.getValues('department')}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl><SelectContent>{cities.map((city) => (<SelectItem key={city.name} value={city.name}>{city.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Teléfono Celular</FormLabel><FormControl><PhoneInput country={'co'} value={field.value} onChange={field.onChange} disabled={isLocked} inputClass="form-control" /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="fax" render={({ field }) => (<FormItem><FormLabel>Fax (Opcional)</FormLabel><FormControl><Input {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="website" render={({ field }) => (<FormItem><FormLabel>Sitio Web</FormLabel><FormControl><Input {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="providerContactName" render={({ field }) => (<FormItem><FormLabel>Nombre Contacto Comercial</FormLabel><FormControl><Input {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="providerContactEmail" render={({ field }) => (<FormItem><FormLabel>Email Contacto Comercial</FormLabel><FormControl><Input type="email" {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="paymentContactName" render={({ field }) => (<FormItem><FormLabel>Contacto para Notificación de Pago</FormLabel><FormControl><Input {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="paymentContactEmail" render={({ field }) => (<FormItem><FormLabel>Email Notificación de Pago</FormLabel><FormControl><Input type="email" {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />
            </div>
          </CardContent>
        </Card>

        {watchedPersonType === 'Persona Jurídica' && (
          <Card>
            <CardHeader><CardTitle>4. Datos del Representante Legal</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="legalRepresentativeName" render={({ field }) => (<FormItem><FormLabel>Nombre del Representante Legal</FormLabel><FormControl><Input {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="legalRepresentativeDocumentType" render={({ field }) => (<FormItem><FormLabel>Tipo de Documento</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isLocked}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl><SelectContent>{legalRepDocTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="legalRepresentativeDocumentNumber" render={({ field }) => (<FormItem><FormLabel>Número de Documento</FormLabel><FormControl><Input {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>2. Información Tributaria</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="taxRegimeType" render={({ field }) => (<FormItem><FormLabel>Tipo de Régimen</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isLocked}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl><SelectContent>{taxRegimeTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
            {watchedTaxRegimeType === 'Común' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="isLargeTaxpayer" render={({ field }) => (<FormItem><FormLabel>¿Es Gran Contribuyente?</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4" disabled={isLocked}>{yesNoOptions.map((opt) => (<FormItem key={type} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={opt} /></FormControl><Label className="font-normal">{opt}</Label></FormItem>))}</RadioGroup></FormControl><FormMessage /></FormItem>)} />
                {watchedIsLargeTaxpayer === 'Sí' && <FormField control={form.control} name="largeTaxpayerResolution" render={({ field }) => (<FormItem><FormLabel>Resolución No.</FormLabel><FormControl><Input {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>3. Información Ambiental</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="implementsEnvironmentalMeasures" render={({ field }) => (<FormItem><FormLabel>¿La empresa implementa medidas a favor del medio ambiente?</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4" disabled={isLocked}>{yesNoOptions.map((opt) => (<FormItem key={opt} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={opt} /></FormControl><Label className="font-normal">{opt}</Label></FormItem>))}</RadioGroup></FormControl><FormMessage /></FormItem>)} />
            {watchedImplementsEnvironmentalMeasures === 'Sí' && <FormField control={form.control} name="environmentalMeasuresDescription" render={({ field }) => (<FormItem><FormLabel>Descripción de las medidas</FormLabel><FormControl><Textarea {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>5. Inscripción de cuenta para pago electrónico</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="beneficiaryName" render={({ field }) => (<FormItem><FormLabel>Autorizamos consignar en nuestra cuenta bancaria a nombre de:</FormLabel><FormControl><Input {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={form.control} name="bankName" render={({ field }) => (<FormItem><FormLabel>Banco</FormLabel><FormControl><Input {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="accountType" render={({ field }) => (<FormItem><FormLabel>Tipo de Cuenta</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4 pt-2" disabled={isLocked}><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Ahorros" /></FormControl><Label className="font-normal">Ahorros</Label></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Corriente" /></FormControl><Label className="font-normal">Corriente</Label></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="accountNumber" render={({ field }) => (<FormItem><FormLabel>Número de Cuenta</FormLabel><FormControl><Input {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>6. Documentos Adjuntos (PDF)</CardTitle><CardDescription>Cargue los documentos requeridos para su validación.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="rutFile" render={() => (<FormItem><FormLabel>RUT (Actualizado)</FormLabel><FormControl><Input type="file" accept="application/pdf" {...form.register('rutFile')} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="certificacionBancariaFile" render={() => (<FormItem><FormLabel>Certificación Bancaria (No mayor a 30 días)</FormLabel><FormControl><Input type="file" accept="application/pdf" {...form.register('certificacionBancariaFile')} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />
            {watchedPersonType === 'Persona Jurídica' && (
              <>
                <FormField control={form.control} name="camaraComercioFile" render={() => (<FormItem><FormLabel>Cámara de Comercio (Vigente)</FormLabel><FormControl><Input type="file" accept="application/pdf" {...form.register('camaraComercioFile')} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="estadosFinancierosFile" render={() => (<FormItem><FormLabel>Estados Financieros</FormLabel><FormControl><Input type="file" accept="application/pdf" {...form.register('estadosFinancierosFile')} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="declaracionRentaFile" render={() => (<FormItem><FormLabel>Declaración de Renta</FormLabel><FormControl><Input type="file" accept="application/pdf" {...form.register('declaracionRentaFile')} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="cedulaRepresentanteLegalFile" render={() => (<FormItem><FormLabel>Cédula del Representante Legal</FormLabel><FormControl><Input type="file" accept="application/pdf" {...form.register('cedulaRepresentanteLegalFile')} disabled={isLocked} /></FormControl><FormMessage /></FormItem>)} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>7. INFORMACION HSEQ</CardTitle></CardHeader>
          <CardContent>
            <FormField control={form.control} name="hseqSgsst" render={({ field }) => (
              <FormItem>
                <FormLabel>¿Su empresa cuenta con SG-SST acorde al Decreto 1072, con resultado de evaluación de la resolución 0312/19, por encima del 60%?</FormLabel>
                <FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4" disabled={isLocked}>{yesNoOptions.map((opt) => (<FormItem key={opt} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={opt} /></FormControl><Label className="font-normal">{opt}</Label></FormItem>))}</RadioGroup></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>8. SARLAFT Y PROTECCIÓN DE DATOS</CardTitle></CardHeader>
          <CardContent>
            <FormField control={form.control} name="sarlaftAccepted" render={({ field }) => (<FormItem className="flex row items-start space-x-3 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isLocked} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Acepto la declaración de origen de fondos y la política de tratamiento de datos personales.</FormLabel></div></FormItem>)} />
          </CardContent>
        </Card>

        {!isLocked && !previewMode && (
          <div className="flex justify-end pb-12">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="animate-spin mr-2" /> Guardando y Subiendo...</> : 'Guardar y Bloquear Formulario'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
