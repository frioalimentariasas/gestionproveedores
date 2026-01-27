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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { providerFormSchema } from '@/lib/schemas';
import { colombiaDepartments, colombiaCities } from '@/lib/countries';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Info, Loader2 } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type ProviderFormValues = z.infer<typeof providerFormSchema>;

const documentTypes = [
  'NIT',
  'Cédula de Ciudadanía',
  'Cédula de Extranjería',
  'Pasaporte',
];
const personTypes = ['Persona Natural', 'Persona Jurídica'];
const taxRegimes = ['Responsable de IVA', 'No Responsable de IVA'];
const yesNoOptions = ['Sí', 'No'];
const accountTypes = ['Ahorros', 'Corriente'];

export default function ProviderForm() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = getStorage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const providerDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'providers', user.uid);
  }, [user, firestore]);

  const { data: providerData, isLoading: isProviderDataLoading } =
    useDoc<ProviderFormValues>(providerDocRef);

  const isLocked = providerData?.formLocked ?? false;

  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: {
      serviceDescription: '',
      businessName: '',
      documentType: '',
      documentNumber: '',
      address: '',
      department: '',
      city: '',
      phone: '',
      email: '',
      personType: '',
      taxRegime: '',
      isIcaAgent: '',
      icaTariff: '',
      isIncomeTaxAgent: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      bankName: '',
      accountType: '',
      accountNumber: '',
      beneficiaryName: '',
      sarlaftAccepted: false,
    },
  });

  useEffect(() => {
    if (providerData) {
      form.reset(providerData);
      if (providerData.department) {
        setSelectedDepartment(providerData.department);
      }
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
        const fileList = values[field] as FileList | undefined;
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
        email: user.email, // Ensure email is saved
        formLocked: true,
      };

      // Remove file fields before saving to Firestore
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

        {/* Service Description Section */}
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

        {/* Section 1 */}
        <Card>
          <CardHeader>
            <CardTitle>1. Información del Proveedor</CardTitle>
            <CardDescription>
              Diligencia la información básica de tu empresa o actividad
              comercial.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razón Social / Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Documento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {documentTypes.map((type) => (
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
              name="documentNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIT/CC/CE/PASAPORTE</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
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
                    <Input {...field} disabled={isLocked} />
                  </FormControl>
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
                      setSelectedDepartment(value);
                      form.setValue('city', '');
                    }}
                    value={field.value}
                    disabled={isLocked}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {colombiaDepartments.map((dep) => (
                        <SelectItem key={dep} value={dep}>
                          {dep}
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
                    disabled={isLocked || !selectedDepartment}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un departamento primero..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(colombiaCities[selectedDepartment] || []).map(
                        (city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLocked} />
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
                  <FormLabel>Email para Facturación Electrónica</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLocked} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 2 */}
        <Card>
          <CardHeader>
            <CardTitle>2. Información Tributaria</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="personType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Persona</FormLabel>
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
                      {personTypes.map((type) => (
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
              name="taxRegime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Régimen de IVA</FormLabel>
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
                      {taxRegimes.map((type) => (
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
              name="isIcaAgent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>¿Agente Retenedor de ICA?</FormLabel>
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
              name="icaTariff"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tarifa ICA (si aplica)</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLocked} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isIncomeTaxAgent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>¿Agente Retenedor de Renta?</FormLabel>
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
          </CardContent>
        </Card>

        {/* Section 3 */}
        <Card>
          <CardHeader>
            <CardTitle>3. Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Contacto Comercial</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLocked} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono Contacto</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLocked} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Contacto</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" disabled={isLocked} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 4 */}
        <Card>
          <CardHeader>
            <CardTitle>4. Información Financiera para Pagos</CardTitle>
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

        {/* Section 5 */}
        <Card>
          <CardHeader>
            <CardTitle>5. Documentos</CardTitle>
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

        {/* Section 6 */}
        <Card>
          <CardHeader>
            <CardTitle>6. SARLAFT y Aceptación</CardTitle>
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
