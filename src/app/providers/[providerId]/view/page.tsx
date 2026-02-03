
'use client';

import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { providerFormSchema } from '@/lib/schemas';
import AuthGuard from '@/components/auth/auth-guard';
import { useRole } from '@/hooks/use-role';
import { Loader2, ArrowLeft, FileDown, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { type z } from 'zod';
import * as XLSX from 'xlsx';

type ProviderData = z.infer<typeof providerFormSchema>;

const InfoField = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean | null;
}) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const displayValue = typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value;
  return (
    <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
      <p className="font-semibold text-muted-foreground md:col-span-1">
        {label}:
      </p>
      <p className="md:col-span-2">{String(displayValue)}</p>
    </div>
  );
};

const FileLinkField = ({
  label,
  url,
}: {
  label: string;
  url?: string | null;
}) => {
  if (!url) return null;
  return (
    <div className="grid grid-cols-1 items-center gap-2 text-sm md:grid-cols-3">
      <p className="font-semibold text-muted-foreground md:col-span-1">
        {label}:
      </p>
      <Button
        variant="link"
        asChild
        className="h-auto justify-start p-0 md:col-span-2"
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Ver Documento
        </a>
      </Button>
    </div>
  );
};

export default function ProviderViewPage({
  params,
}: {
  params: { providerId: string };
}) {
  const { providerId } = params;
  const firestore = useFirestore();
  const router = useRouter();
  const { isAdmin, isLoading: isRoleLoading } = useRole();

  const providerDocRef = useMemoFirebase(
    () =>
      firestore && providerId ? doc(firestore, 'providers', providerId) : null,
    [firestore, providerId]
  );

  const { data: providerData, isLoading: isProviderLoading } =
    useDoc<ProviderData>(providerDocRef);

  useEffect(() => {
    if (!isRoleLoading && !isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, isRoleLoading, router]);

  const handleExport = () => {
    if (!providerData) return;

    const data = [
      {
        Section: 'Descripción',
        Field: 'Descripción del bien y/o servicio',
        Value: providerData.serviceDescription,
      },

      { Section: '1. Información del Proveedor' },
      { Section: '', Field: 'Razón social o nombre', Value: providerData.businessName },
      { Section: '', Field: 'Tipo de Documento', Value: providerData.documentType },
      { Section: '', Field: 'Número', Value: providerData.documentNumber },
      { Section: '', Field: 'Tipo de Persona', Value: providerData.personType },
      { Section: '', Field: 'País', Value: providerData.country },
      { Section: '', Field: 'Departamento', Value: providerData.department },
      { Section: '', Field: 'Ciudad', Value: providerData.city },
      { Section: '', Field: 'Dirección', Value: providerData.address },
      { Section: '', Field: 'Teléfono Celular', Value: providerData.phone },
      { Section: '', Field: 'Fax', Value: providerData.fax },
      { Section: '', Field: 'Pag web', Value: providerData.website },
      { Section: '', Field: 'Nombre del contacto del proveedor', Value: providerData.providerContactName },
      { Section: '', Field: 'Cargo (Contacto)', Value: providerData.providerContactTitle },
      { Section: '', Field: 'Email (Contacto)', Value: providerData.providerContactEmail },
      { Section: '', Field: 'Nombre de la persona para notificar pago', Value: providerData.paymentContactName },
      { Section: '', Field: 'Cargo (Pagos)', Value: providerData.paymentContactTitle },
      { Section: '', Field: 'Email para notificación pago', Value: providerData.paymentContactEmail },
      { Section: '', Field: 'Email de Inicio de Sesión', Value: providerData.email },

      { Section: '2. Información Tributaria' },
      { Section: '', Field: 'Tipo de Régimen', Value: providerData.taxRegimeType },
      { Section: '', Field: 'Gran Contribuyente', Value: providerData.isLargeTaxpayer },
      { Section: '', Field: 'Resolución No (Gran Contribuyente)', Value: providerData.largeTaxpayerResolution },
      { Section: '', Field: 'Autorretenedor Renta', Value: providerData.isIncomeSelfRetainer },
      { Section: '', Field: 'Resolución No (Renta)', Value: providerData.incomeSelfRetainerResolution },
      { Section: '', Field: 'Autorretenedor ICA', Value: providerData.isIcaSelfRetainer },
      { Section: '', Field: 'Indique municipio (ICA)', Value: providerData.icaSelfRetainerMunicipality },
      { Section: '', Field: 'Resolución No (ICA)', Value: providerData.icaSelfRetainerResolution },
      { Section: '', Field: 'Código actividad económica CIIU', Value: providerData.ciiuCode },
      { Section: '', Field: 'Código actividad económica ICA', Value: providerData.icaCode },
      { Section: '', Field: 'Ciudad donde declara', Value: providerData.declarationCity },
      { Section: '', Field: 'Porcentaje según ICA (%)', Value: providerData.icaPercentage },

      { Section: '3. Información Ambiental' },
      { Section: '', Field: '¿Implementa medidas ambientales?', Value: providerData.implementsEnvironmentalMeasures },
      { Section: '', Field: '¿Cuáles?', Value: providerData.environmentalMeasuresDescription },

      { Section: '4. Datos del Representante Legal' },
      { Section: '', Field: 'Nombre del Representante Legal', Value: providerData.legalRepresentativeName },
      { Section: '', Field: 'Tipo de Documento', Value: providerData.legalRepresentativeDocumentType },
      { Section: '', Field: 'Número', Value: providerData.legalRepresentativeDocumentNumber },

      { Section: '5. Inscripción de cuenta para pago electrónico' },
      { Section: '', Field: 'Consignar a nombre de', Value: providerData.beneficiaryName },
      { Section: '', Field: 'Tipo de Cuenta', Value: providerData.accountType },
      { Section: '', Field: 'No de cuenta:', Value: providerData.accountNumber },
      { Section: '', Field: 'Banco:', Value: providerData.bankName },
      
      { Section: '6. Documentos' },
      { Section: '', Field: 'RUT', Value: providerData.rutFileUrl },
      { Section: '', Field: 'Cámara de Comercio', Value: providerData.camaraComercioFileUrl },
      { Section: '', Field: 'Cédula Representante Legal', Value: providerData.cedulaRepresentanteLegalFileUrl },
      { Section: '', Field: 'Certificación Bancaria', Value: providerData.certificacionBancariaFileUrl },
      
      { Section: '7. INFORMACION HSEQ' },
      { Section: '', Field: 'Cuenta con SG-SST > 60%', Value: providerData.hseqSgsst },
      
      { Section: '8. SARLAFT' },
      { Section: '', Field: 'Aceptó términos', Value: providerData.sarlaftAccepted ? 'Sí' : 'No' },
    ].filter(item => item.Value !== undefined && item.Value !== null && item.Value !== '');

    const worksheet = XLSX.utils.json_to_sheet(data, { skipHeader: true });
    XLSX.utils.sheet_add_aoa(worksheet, [['Sección', 'Campo', 'Valor']], {
      origin: 'A1',
    });
    worksheet['!cols'] = [{ wch: 30 }, { wch: 40 }, { wch: 50 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos Proveedor');
    XLSX.writeFile(
      workbook,
      `Proveedor_${providerData.documentNumber || providerId}.xlsx`
    );
  };

  const isLoadingCombined = isRoleLoading || isProviderLoading;

  if (isLoadingCombined) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <p>No tienes permiso para ver esta página.</p>
      </div>
    );
  }

  if (!providerData) {
    return (
      <div className="container mx-auto p-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Proveedor no encontrado</h1>
        <p className="text-muted-foreground">
          No se pudo encontrar la información para el proveedor solicitado.
        </p>
        <Button onClick={() => router.push('/providers')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la lista
        </Button>
      </div>
    );
  }

  const watchedPersonType = providerData?.personType;

  return (
    <AuthGuard>
      <div className="container mx-auto max-w-5xl p-4 py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Button variant="outline" onClick={() => router.push('/providers')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la lista
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Detalles del Proveedor
            </h1>
            <p className="text-muted-foreground">
              {providerData.businessName}
            </p>
          </div>
          <Button onClick={handleExport}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar a Excel
          </Button>
        </div>

        <div className="space-y-8">
          <div className="rounded-t-lg bg-primary p-3 text-center font-bold text-primary-foreground">
            OBLIGATORIO DILIGENCIAMIENTO POR PARTE DEL PROVEEDOR
          </div>
          <Card className="-mt-8 rounded-t-none">
            <CardContent className="pt-6">
              <p className="text-sm">{providerData.serviceDescription}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>1. Información del Proveedor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoField
                label="Razón Social o nombre"
                value={providerData.businessName}
              />
              <InfoField
                label="Tipo de Documento"
                value={providerData.documentType}
              />
              <InfoField label="Número" value={providerData.documentNumber} />
              <InfoField
                label="Tipo de Persona"
                value={providerData.personType}
              />
              <InfoField label="País" value={providerData.country} />
              <InfoField label="Departamento" value={providerData.department} />
              <InfoField label="Ciudad" value={providerData.city} />
              <InfoField label="Dirección" value={providerData.address} />
              <InfoField
                label="Teléfono Celular"
                value={providerData.phone}
              />
              <InfoField label="Fax" value={providerData.fax} />
              <InfoField label="Pag web" value={providerData.website} />
              <InfoField
                label="Nombre del contacto del proveedor"
                value={providerData.providerContactName}
              />
              <InfoField
                label="Cargo (Contacto)"
                value={providerData.providerContactTitle}
              />
              <InfoField
                label="Email (Contacto)"
                value={providerData.providerContactEmail}
              />
              <InfoField
                label="Nombre de la persona para notificar pago"
                value={providerData.paymentContactName}
              />
              <InfoField
                label="Cargo (Pagos)"
                value={providerData.paymentContactTitle}
              />
              <InfoField
                label="Email para notificación pago"
                value={providerData.paymentContactEmail}
              />
              <InfoField
                label="Email de Inicio de Sesión"
                value={providerData.email}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Información Tributaria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoField
                label="Tipo de Régimen"
                value={providerData.taxRegimeType}
              />
              <InfoField
                label="Gran Contribuyente"
                value={providerData.isLargeTaxpayer}
              />
              <InfoField
                label="Resolución No (Gran Contribuyente)"
                value={providerData.largeTaxpayerResolution}
              />
              <InfoField
                label="Autorretenedor Renta"
                value={providerData.isIncomeSelfRetainer}
              />
              <InfoField
                label="Resolución No (Renta)"
                value={providerData.incomeSelfRetainerResolution}
              />
              <InfoField
                label="Autorretenedor ICA"
                value={providerData.isIcaSelfRetainer}
              />
              <InfoField
                label="Indique municipio (ICA)"
                value={providerData.icaSelfRetainerMunicipality}
              />
              <InfoField
                label="Resolución No (ICA)"
                value={providerData.icaSelfRetainerResolution}
              />
              <InfoField
                label="Código actividad económica CIIU"
                value={providerData.ciiuCode}
              />
              <InfoField
                label="Código actividad económica ICA"
                value={providerData.icaCode}
              />
              <InfoField
                label="Ciudad donde declara"
                value={providerData.declarationCity}
              />
              <InfoField
                label="Porcentaje según ICA (%)"
                value={providerData.icaPercentage}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Información Ambiental</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoField
                label="¿La empresa implementa medidas a favor del medio ambiente?"
                value={providerData.implementsEnvironmentalMeasures}
              />
              <InfoField
                label="¿Cuáles?"
                value={providerData.environmentalMeasuresDescription}
              />
            </CardContent>
          </Card>

          {watchedPersonType === 'Persona Jurídica' && (
            <Card>
              <CardHeader>
                <CardTitle>4. Datos del Representante Legal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoField
                  label="Nombre del Representante Legal"
                  value={providerData.legalRepresentativeName}
                />
                <InfoField
                  label="Tipo de Documento"
                  value={providerData.legalRepresentativeDocumentType}
                />
                <InfoField
                  label="Número"
                  value={providerData.legalRepresentativeDocumentNumber}
                />
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
            <CardContent className="space-y-3">
              <InfoField
                label="Autorizamos consignar en nuestra cuenta bancaria a nombre de:"
                value={providerData.beneficiaryName}
              />
              <InfoField
                label="Tipo de Cuenta"
                value={providerData.accountType}
              />
              <InfoField
                label="No de cuenta:"
                value={providerData.accountNumber}
              />
              <InfoField label="Banco:" value={providerData.bankName} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {watchedPersonType === 'Persona Jurídica' ? '6' : '5'}.
                Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FileLinkField label="RUT" url={providerData.rutFileUrl} />
              <FileLinkField
                label="Cámara de Comercio"
                url={providerData.camaraComercioFileUrl}
              />
              <FileLinkField
                label="Cédula Representante Legal"
                url={providerData.cedulaRepresentanteLegalFileUrl}
              />
              <FileLinkField
                label="Certificación Bancaria"
                url={providerData.certificacionBancariaFileUrl}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {watchedPersonType === 'Persona Jurídica' ? '7' : '6'}.
                INFORMACION HSEQ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoField
                label="Su empresa cuenta con SG-SST acorde al Decreto 1072, con resultado de evaluación de la resolución 0312/19, por encima del 60%"
                value={providerData.hseqSgsst}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {watchedPersonType === 'Persona Jurídica' ? '8' : '7'}.
                DECLARACION SARLAFT Y AUTORIZACION
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoField
                label="Aceptó la declaración de origen de fondos y la política de tratamiento de datos"
                value={providerData.sarlaftAccepted}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
