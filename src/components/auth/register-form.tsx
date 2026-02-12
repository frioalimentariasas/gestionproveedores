'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { registerSchema } from '@/lib/schemas';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { notifyAdminOfNewProvider } from '@/actions/email';

const documentTypes = [
  'NIT',
  'Cédula de Ciudadanía',
  'Cédula de Extranjería',
  'Pasaporte',
];

export function RegisterForm() {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      businessName: '',
      documentType: '',
      documentNumber: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    if (!auth || !firestore) return;
    setIsSubmitting(true);
    const eventId = searchParams.get('eventId');

    try {
      // Use the NIT (documentNumber) to create a synthetic email for auth
      const syntheticEmail = `${values.documentNumber}@proveedores.frioalimentaria.com.co`;
      
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        syntheticEmail,
        values.password
      );
      const user = userCredential.user;

      const providerData: any = {
        id: user.uid,
        email: values.email, // Real email for communication
        businessName: values.businessName,
        documentType: values.documentType,
        documentNumber: values.documentNumber, // This is the NIT, used as username
        formLocked: false,
      };

      if (eventId) {
        providerData.originSelectionEventId = eventId;
      }

      // Create a partial provider profile in Firestore
      await setDoc(
        doc(firestore, 'providers', user.uid),
        providerData,
        { merge: true }
      );
      
      // Notify admin about the new provider (fire-and-forget)
      notifyAdminOfNewProvider({
        businessName: values.businessName,
        documentNumber: values.documentNumber,
        email: values.email,
      }).catch(console.error);


      toast({
        title: '¡Registro exitoso!',
        description: 'Ahora puedes completar tu perfil de proveedor.',
      });
      router.push('/providers/form');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error en el registro',
        description:
          error.code === 'auth/email-already-in-use'
            ? 'El NIT ya se encuentra registrado.'
            : 'Ha ocurrido un error inesperado.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Razón Social / Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Nombre de tu empresa" {...field} />
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo..." />
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
              <FormLabel>Número de Documento (Será tu usuario)</FormLabel>
              <FormControl>
                <Input placeholder="Tu número de documento (sin dígito de verif.)" {...field} />
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
              <FormLabel>Email (Para notificaciones)</FormLabel>
              <FormControl>
                <Input
                  placeholder="tu@email.com"
                  {...field}
                  type="email"
                  autoComplete="email"
                />
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
                <Input
                  placeholder="********"
                  {...field}
                  type="password"
                  autoComplete="new-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Contraseña</FormLabel>
              <FormControl>
                <Input placeholder="********" {...field} type="password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Registrarse'
          )}
        </Button>
        <div className="text-center text-sm">
          ¿Ya tienes una cuenta?{' '}
          <Button variant="link" asChild className="p-0 h-auto">
            <Link href="/auth/login">Inicia Sesión</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}

    