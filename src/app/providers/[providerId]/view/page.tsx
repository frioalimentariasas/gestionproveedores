'use client';

import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { providerFormSchema } from '@/lib/schemas';
import AuthGuard from '@/components/auth/auth-guard';
import { useRole } from '@/hooks/use-role';
import { Loader2, ArrowLeft, FileDown, FileText, Printer, ClipboardList } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { type z } from 'zod';
import * as XLSX from 'xlsx';
import Link from 'next/link';

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
    <div className="grid grid-cols-1 md:grid-cols-5 border-t first:border-t-0 text-sm">
      <p className="col-span-1 md:col-span-2 border-b md:border-b-0 md:border-r bg-muted/50 p-3 font-semibold">
        {label}
      </p>
      <p className="col-span-1 md:col-span-3 p-3 flex items-center">{String(displayValue)}</p>
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
    <div className="grid grid-cols-1 md:grid-cols-5 border-t first:border-t-0 text-sm">
      <p className="col-span-1 md:col-span-2 border-b md:border-b-0 md:border-r bg-muted/50 p-3 font-semibold">
        {label}
      </p>
      <div className="col-span-1 md:col-span-3 p-2 flex items-center">
        <Button
          variant="link"
          asChild
          className="h-auto justify-start p-0"
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
    </div>
  );
};

export default function ProviderViewPage() {
  const params = useParams();
  const providerId = params.providerId as string;
  const firestore = useFirestore();
  const router = useRouter();
  const { isAdmin, isLoading: isRoleLoading } = useRole();
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  const providerDocRef = useMemoFirebase(
    () =>
      firestore && providerId && isAdmin
        ? doc(firestore, 'providers', providerId)
        : null,
    [firestore, providerId, isAdmin]
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
      { Section: '1. Información del Proveedor' },
      { Section: '', Field: 'Razón social o nombre', Value: providerData.businessName },
      { Section: '', Field: 'Tipo de Proveedor', Value: providerData.providerType?.join(', ') },
      { Section: '', Field: 'Nivel de Criticidad', Value: providerData.criticalityLevel || 'Pendiente' },
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
      { Section: '', Field: 'Estados Financieros', Value: providerData.estadosFinancierosFileUrl },
      { Section: '', Field: 'Declaración de Renta', Value: providerData.declaracionRentaFileUrl },
      { Section: '', Field: 'Cédula Representante Legal', Value: providerData.cedulaRepresentanteLegalFileUrl },
      { Section: '', Field: 'Certificación Bancaria', Value: providerData.certificacionBancariaFileUrl },
      
      { Section: '7. INFORMACIÓN HSEQ' },
      { Section: '', Field: 'Cuenta con SG-SST > 60%', Value: providerData.hseqSgsst },
      { Section: '', Field: 'Certificado 0312', Value: providerData.hseqCertFileUrl },
      
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
  
    const handleExportPdf = async () => {
    if (!providerData) return;
    setIsPdfGenerating(true);

    const { default: jsPDF } = await import('jspdf');
    const { format } = await import('date-fns');

    try {
        const doc = new jsPDF();
        const margin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = margin;

        const getLogoBase64 = async () => {
            const response = await fetch('/logo.png');
            const blob = await response.blob();
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        };
        const logoBase64 = await getLogoBase64();

        // Background Watermark Function (Image based)
        const getWatermarkBase64 = async () => {
            const logoDataUrl = await getLogoBase64(); 
            const img = new Image();
            await new Promise(resolve => {
                img.onload = resolve;
                img.src = logoDataUrl;
            });
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return logoDataUrl;
            ctx.globalAlpha = 0.03; // Máxima transparencia posible
            ctx.drawImage(img, 0, 0);
            return canvas.toDataURL('image/png');
        };
        const watermarkBase64 = await getWatermarkBase64();

        const drawWatermark = () => {
            const watermarkWidth = 120;
            const watermarkHeight = (watermarkWidth / 40) * 13;
            const watermarkX = (pageWidth - watermarkWidth) / 2;
            const watermarkY = (pageHeight - watermarkHeight) / 2;
            doc.addImage(watermarkBase64, 'PNG', watermarkX, watermarkY, watermarkWidth, watermarkHeight);
        };

        const safeAddPage = () => {
            doc.addPage();
            yPos = margin;
            drawWatermark();
        };

        // Draw watermark on first page BEFORE content
        drawWatermark();

        doc.addImage(logoBase64, 'PNG', margin, 12, 40, 13);

        doc.setFontSize(8);
        doc.setDrawColor(0);
        const boxX = pageWidth - margin - 50;
        const boxY = 12;
        const boxWidth = 50;
        const boxHeight = 15;
        doc.rect(boxX, boxY, boxWidth, boxHeight);
        doc.text('Codigo: FA-GFC-F04', boxX + 2, boxY + 4);
        doc.line(boxX, boxY + 5, boxX + boxWidth, boxY + 5);
        doc.text('Version: 3', boxX + 2, boxY + 9);
        doc.line(boxX, boxY + 10, boxX + boxWidth, boxY + 10);
        doc.text('Vigencia: 12/06/2025', boxX + 2, boxY + 14);
        
        yPos += 20;

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(
            'REGISTRO O ACTUALIZACION DE PROVEEDORES Y/O CONTRATISTAS',
            pageWidth / 2,
            yPos,
            { align: 'center' }
        );
        yPos += 15;

        const addSection = (title: string, fields: { label: string; value?: any }[]) => {
            if (yPos > pageHeight - margin - 20) safeAddPage();
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setFillColor(220, 220, 220);
            doc.rect(margin, yPos - 5, pageWidth - margin * 2, 8, 'F');
            doc.setTextColor(0, 0, 0);
            doc.text(title, margin + 2, yPos);
            yPos += 8;
            
            const col1Width = 85;
            const col2X = margin + col1Width;
            const col2Width = pageWidth - col2X - margin;
            doc.setDrawColor(200, 200, 200);

            fields.forEach(field => {
                const value = field.value;
                if (value !== undefined && value !== null && value !== '') {
                    let displayValue = '';
                    let linkUrl = '';

                    // Detect link object for documents
                    if (typeof value === 'object' && value.text && value.url) {
                        displayValue = value.text;
                        linkUrl = value.url;
                    } else {
                        displayValue = typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value);
                    }

                    const rowPadding = 4;
                    const lineHeight = 5;

                    if (!field.label) {
                        doc.setFontSize(9);
                        doc.setFont(undefined, 'normal');
                        const valueLines = doc.splitTextToSize(displayValue, pageWidth - margin * 2 - (rowPadding*2));
                        const rowHeight = valueLines.length * lineHeight + (rowPadding * 2);

                        if (yPos + rowHeight > pageHeight - margin) safeAddPage();

                        doc.rect(margin, yPos, pageWidth - margin * 2, rowHeight);
                        doc.text(valueLines, margin + rowPadding, yPos + lineHeight + rowPadding/2);
                        yPos += rowHeight;

                    } else {
                        doc.setFontSize(9);
                        doc.setFont(undefined, 'bold');
                        const labelLines = doc.splitTextToSize(field.label, col1Width - (rowPadding*2));

                        doc.setFont(undefined, 'normal');
                        const valueLines = doc.splitTextToSize(displayValue, col2Width - (rowPadding*2));
                        
                        const rowHeight = Math.max(labelLines.length, valueLines.length) * lineHeight + (rowPadding * 2);

                        if (yPos + rowHeight > pageHeight - margin) safeAddPage();
                        
                        doc.rect(margin, yPos, col1Width, rowHeight);
                        doc.rect(col2X, yPos, col2Width, rowHeight);

                        doc.setFont(undefined, 'bold');
                        doc.text(labelLines, margin + rowPadding, yPos + lineHeight + rowPadding/2);

                        if (linkUrl) {
                            doc.setTextColor(0, 51, 153); // Corporate blue
                            doc.setFont(undefined, 'bold');
                            doc.text(valueLines, col2X + rowPadding, yPos + lineHeight + rowPadding/2, { link: { url: linkUrl } });
                            doc.setTextColor(0, 0, 0); // Reset
                        } else {
                            doc.setFont(undefined, 'normal');
                            doc.text(valueLines, col2X + rowPadding, yPos + lineHeight + rowPadding/2);
                        }
                        
                        yPos += rowHeight;
                    }
                }
            });
            yPos += 5;
        };

        const sectionsData = [
            { title: "1. Información del Proveedor", fields: [
                { label: "Razón Social o nombre", value: providerData.businessName },
                { label: "Nivel de Criticidad", value: providerData.criticalityLevel || 'No Asignado' },
                { label: "Tipo de Proveedor", value: providerData.providerType?.join(', ') },
                { label: "Tipo de Documento", value: providerData.documentType },
                { label: "Número", value: providerData.documentNumber },
                { label: "Tipo de Persona", value: providerData.personType },
                { label: "País", value: providerData.country },
                { label: "Departamento", value: providerData.department },
                { label: "Ciudad", value: providerData.city },
                { label: "Dirección", value: providerData.address },
                { label: "Teléfono Celular", value: providerData.phone },
                { label: "Fax", value: providerData.fax },
                { label: "Pag web", value: providerData.website },
                { label: "Nombre del contacto del proveedor", value: providerData.providerContactName },
                { label: "Cargo (Contacto)", value: providerData.providerContactTitle },
                { label: "Email (Contacto)", value: providerData.providerContactEmail },
                { label: "Nombre de la persona para notificar pago", value: providerData.paymentContactName },
                { label: "Cargo (Pagos)", value: providerData.paymentContactTitle },
                { label: "Email para notificación pago", value: providerData.paymentContactEmail },
                { label: "Email de Inicio de Sesión", value: providerData.email },
            ] },
            { title: "2. Información Tributaria", fields: [
                { label: 'Tipo de Régimen', value: providerData.taxRegimeType },
                { label: 'Gran Contribuyente', value: providerData.isLargeTaxpayer },
                { label: 'Resolución No (Gran Contribuyente)', value: providerData.largeTaxpayerResolution },
                { label: 'Autorretenedor Renta', value: providerData.isIncomeSelfRetainer },
                { label: 'Resolución No (Renta)', value: providerData.incomeSelfRetainerResolution },
                { label: 'Autorretenedor ICA', value: providerData.isIcaSelfRetainer },
                { label: 'Indique municipio (ICA)', value: providerData.icaSelfRetainerMunicipality },
                { label: 'Resolución No (ICA)', value: providerData.icaSelfRetainerResolution },
                { label: 'Código actividad económica CIIU', value: providerData.ciiuCode },
                { label: 'Código actividad económica ICA', value: providerData.icaCode },
                { label: 'Ciudad donde declara', value: providerData.declarationCity },
                { label: 'Porcentaje según ICA (%)', value: providerData.icaPercentage },
            ] },
            { title: "3. Información Ambiental", fields: [
                { label: '¿La empresa implementa medidas a favor del medio ambiente?', value: providerData.implementsEnvironmentalMeasures },
                { label: '¿Cuáles?', value: providerData.environmentalMeasuresDescription },
            ] },
            ...(providerData.personType === 'Persona Jurídica' ? [{ title: "4. Datos del Representante Legal", fields: [
                { label: 'Nombre del Representante Legal', value: providerData.legalRepresentativeName },
                { label: 'Tipo de Documento', value: providerData.legalRepresentativeDocumentType },
                { label: 'Número', value: providerData.legalRepresentativeDocumentNumber },
            ] }] : []),
            { title: `${providerData.personType === 'Persona Jurídica' ? '5' : '4'}. Inscripción de cuenta para pago electrónico`, fields: [
                { label: 'Autorizamos consignar en nuestra cuenta bancaria a nombre de', value: providerData.beneficiaryName },
                { label: 'Tipo de Cuenta', value: providerData.accountType },
                { label: 'No de cuenta', value: providerData.accountNumber },
                { label: 'Banco', value: providerData.bankName },
            ] },
            { title: `${providerData.personType === 'Persona Jurídica' ? '6' : '5'}. Documentos`, fields: [
                { label: "RUT", value: providerData.rutFileUrl ? { text: 'VER RUT (CLIC AQUÍ)', url: providerData.rutFileUrl } : 'No Adjuntado' },
                { label: "Cámara de Comercio", value: providerData.camaraComercioFileUrl ? { text: 'VER CÁMARA DE COMERCIO (CLIC AQUÍ)', url: providerData.camaraComercioFileUrl } : 'No Adjuntado' },
                { label: "Estados Financieros", value: providerData.estadosFinancierosFileUrl ? { text: 'VER ESTADOS FINANCIEROS (CLIC AQUÍ)', url: providerData.estadosFinancierosFileUrl } : 'No Adjuntado' },
                { label: "Declaración de Renta", value: providerData.declaracionRentaFileUrl ? { text: 'VER DECLARACIÓN DE RENTA (CLIC AQUÍ)', url: providerData.declaracionRentaFileUrl } : 'No Adjuntado' },
                { label: "Cédula Representante Legal", value: providerData.cedulaRepresentanteLegalFileUrl ? { text: 'VER CÉDULA (CLIC AQUÍ)', url: providerData.cedulaRepresentanteLegalFileUrl } : 'No Adjuntado' },
                { label: "Certificación Bancaria", value: providerData.certificacionBancariaFileUrl ? { text: 'VER CERTIFICACIÓN BANCARIA (CLIC AQUÍ)', url: providerData.certificacionBancariaFileUrl } : 'No Adjuntado' },
            ] },
            { title: `${providerData.personType === 'Persona Jurídica' ? '7' : '6'}. INFORMACIÓN HSEQ`, fields: [
                { label: 'Su empresa cuenta con SG-SST acorde al Decreto 1072, con resultado de evaluación de la resolución 0312/19, por encima del 60%', value: providerData.hseqSgsst },
                { label: 'Certificado Autoevaluación 0312', value: providerData.hseqCertFileUrl ? { text: 'VER CERTIFICADO HSEQ 0312 (CLIC AQUÍ)', url: providerData.hseqCertFileUrl } : 'No Adjuntado' },
            ] },
            { title: `${providerData.personType === 'Persona Jurídica' ? '8' : '7'}. DECLARACION SARLAFT Y AUTORIZACION`, fields: [
                { label: 'Aceptó la declaración de origen de fondos y la política de tratamiento de datos', value: providerData.sarlaftAccepted },
            ] },
        ];
        
        sectionsData.forEach(section => addSection(section.title, section.fields));

        // Page Numbers
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
        const safeBusinessName = providerData.businessName.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `FA-GFC-F04_Formato_de_Registro_o_Actualizacion_de_Proveedores_y_Contratistas_${safeBusinessName}_${timestamp}.pdf`;

        doc.save(fileName);
    } catch(e) {
        console.error("Error generating PDF:", e);
    } finally {
        setIsPdfGenerating(false);
    }
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
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Button variant="outline" onClick={() => router.push('/providers')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div className="text-center flex-grow">
            <h1 className="text-3xl font-bold tracking-tight">
              Detalles del Proveedor
            </h1>
            <p className="text-muted-foreground">
              {providerData.businessName}
            </p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" asChild>
                <Link href={`/providers/${providerId}/evaluations`}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Ver Evaluaciones
                </Link>
              </Button>
            <Button onClick={handleExportPdf} disabled={isPdfGenerating}>
              {isPdfGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                  <Printer className="mr-2 h-4 w-4" />
              )}
              Exportar a PDF
            </Button>
            <Button onClick={handleExport}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar a Excel
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-t-lg bg-primary p-3 text-center font-bold text-primary-foreground">
            OBLIGATORIO DILIGENCIAMIENTO POR PARTE DEL PROVEEDOR
          </div>

          <Card>
            <CardHeader>
              <CardTitle>1. Información del Proveedor</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="border rounded-lg overflow-hidden">
                <InfoField
                  label="Razón Social o nombre"
                  value={providerData.businessName}
                />
                <InfoField
                  label="Nivel de Criticidad"
                  value={providerData.criticalityLevel || 'No asignado'}
                />
                 <InfoField
                  label="Tipo de Proveedor"
                  value={providerData.providerType?.join(', ') || ''}
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Información Tributaria</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="border rounded-lg overflow-hidden">
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Información Ambiental</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="border rounded-lg overflow-hidden">
                <InfoField
                  label="¿La empresa implementa medidas a favor del medio ambiente?"
                  value={providerData.implementsEnvironmentalMeasures}
                />
                <InfoField
                  label="¿Cuáles?"
                  value={providerData.environmentalMeasuresDescription}
                />
              </div>
            </CardContent>
          </Card>

          {watchedPersonType === 'Persona Jurídica' && (
            <Card>
              <CardHeader>
                <CardTitle>4. Datos del Representante Legal</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="border rounded-lg overflow-hidden">
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
            <CardContent className="pt-0">
              <div className="border rounded-lg overflow-hidden">
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {watchedPersonType === 'Persona Jurídica' ? '6' : '5'}.
                Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="border rounded-lg overflow-hidden">
                <FileLinkField label="RUT" url={providerData.rutFileUrl} />
                <FileLinkField
                  label="Cámara de Comercio"
                  url={providerData.camaraComercioFileUrl}
                />
                <FileLinkField
                  label="Estados Financieros"
                  url={providerData.estadosFinancierosFileUrl}
                />
                <FileLinkField
                  label="Declaración de Renta"
                  url={providerData.declaracionRentaFileUrl}
                />
                <FileLinkField
                  label="Cédula Representante Legal"
                  url={providerData.cedulaRepresentanteLegalFileUrl}
                />
                <FileLinkField
                  label="Certificación Bancaria"
                  url={providerData.certificacionBancariaFileUrl}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {watchedPersonType === 'Persona Jurídica' ? '7' : '6'}.
                INFORMACIÓN HSEQ
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="border rounded-lg overflow-hidden">
                <InfoField
                  label="Su empresa cuenta con SG-SST acorde al Decreto 1072, con resultado de evaluación de la resolución 0312/19, por encima del 60%"
                  value={providerData.hseqSgsst}
                />
                <FileLinkField label="Certificado autoevaluación 0312" url={providerData.hseqCertFileUrl} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {watchedPersonType === 'Persona Jurídica' ? '8' : '7'}.
                DECLARACION SARLAFT Y AUTORIZACION
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="border rounded-lg overflow-hidden">
                <InfoField
                  label="Aceptó la declaración de origen de fondos y la política de tratamiento de datos"
                  value={providerData.sarlaftAccepted}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
