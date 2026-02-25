'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  BookOpen, 
  ShieldCheck, 
  Users, 
  Settings, 
  ClipboardCheck, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Gavel, 
  Wrench, 
  ShieldAlert, 
  Clock, 
  Image as ImageIcon, 
  Upload, 
  Loader2, 
  RefreshCw, 
  Lock, 
  Unlock,
  Maximize2,
  Settings2,
  LayoutDashboard,
  Tags,
  BarChart3,
  Mail,
  FileSearch,
  TrendingUp,
  Scale,
  CircleDollarSign,
  Truck,
  GraduationCap,
  HardHat,
  Target,
  FileDown
} from 'lucide-react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useRole } from '@/hooks/use-role';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function ManualPage() {
  const { isAdmin, isLoading: isRoleLoading } = useRole();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [uploadingId, setUploadingingId] = useState<string | null>(null);
  const [globalEditMode, setGlobalEditMode] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const [localImages] = useState(PlaceHolderImages);

  const configDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'settings', 'manual_images') : null),
    [firestore]
  );
  const { data: remoteConfig } = useDoc<any>(configDocRef);

  const getImageUrl = (id: string) => {
    const remoteUrl = remoteConfig?.imageUrls?.[id];
    const localUrl = localImages.find(i => i.id === id)?.imageUrl;
    return remoteUrl || localUrl || null;
  };

  const handleImageUpload = async (id: string, file: File) => {
    if (!firestore || !isAdmin) return;
    
    setUploadingingId(id);
    try {
      const isPdf = file.type === 'application/pdf';
      const extension = isPdf ? 'pdf' : 'png';
      const fileName = `manual_screenshot_${id}_${Date.now()}.${extension}`;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', 'system_admin');
      formData.append('fileName', `manual_screenshots/${fileName}`);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Error al subir el archivo.');
      const { url } = await response.json();

      if (!remoteConfig) {
        await setDoc(configDocRef!, { imageUrls: { [id]: url } });
      } else {
        await updateDoc(configDocRef!, { [`imageUrls.${id}`]: url });
      }

      toast({
        title: 'Recurso Actualizado',
        description: `El archivo ha sido incorporado al manual.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error de Carga',
        description: error.message,
      });
    } finally {
      setUploadingingId(null);
    }
  };

  const handleResetImage = async (id: string) => {
    if (!firestore || !isAdmin || !remoteConfig?.imageUrls?.[id]) return;
    
    try {
        const newUrls = { ...remoteConfig.imageUrls };
        delete newUrls[id];
        await updateDoc(configDocRef!, { imageUrls: newUrls });
        toast({
            title: 'Imagen Restablecida',
            description: 'Se ha vuelto a la imagen por defecto.',
        });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo restablecer la imagen.' });
    }
  };

  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    const { default: jsPDF } = await import('jspdf');
    const { format } = await import('date-fns');

    try {
        const doc = new jsPDF();
        const margin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = margin;

        const getBase64FromUrl = async (url: string): Promise<string | null> => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                return null;
            }
        };

        const drawHeader = () => {
            doc.setFontSize(8);
            doc.setDrawColor(0);
            const boxX = pageWidth - margin - 50;
            const boxY = 12;
            const boxWidth = 50;
            const boxHeight = 15;
            doc.rect(boxX, boxY, boxWidth, boxHeight);
            doc.text('Codigo: FA-GFC-M01', boxX + 2, boxY + 4);
            doc.line(boxX, boxY + 5, boxX + boxWidth, boxY + 5);
            doc.text('Version: 1', boxX + 2, boxY + 9);
            doc.line(boxX, boxY + 10, boxX + boxWidth, boxY + 10);
            doc.text('Vigencia: 12/06/2025', boxX + 2, boxY + 14);
        };

        const drawWatermark = () => {
            const originalColor = doc.getTextColor();
            doc.setTextColor(245, 245, 245);
            doc.setFontSize(60);
            doc.setFont(undefined, 'bold');
            doc.text('REPORTE ISO 9001', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
            doc.setTextColor(originalColor);
        };

        const safeAddPage = () => {
            doc.addPage();
            yPos = margin + 25;
            drawHeader();
            drawWatermark();
        };

        const addImageToPdf = async (id: string) => {
            const url = getImageUrl(id);
            if (!url || url.toLowerCase().includes('.pdf')) return;
            
            const base64 = await getBase64FromUrl(url);
            if (base64) {
                if (yPos > pageHeight - 80) safeAddPage();
                try {
                    doc.addImage(base64, 'JPEG', margin, yPos, pageWidth - margin * 2, 80);
                    yPos += 85;
                } catch (e) {
                    console.warn("Failed to add image", id);
                }
            }
        };

        // --- PORTADA ---
        drawHeader();
        drawWatermark();
        yPos = pageHeight / 3;
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.text('MANUAL DE OPERACIÓN Y PROCEDIMIENTOS', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
        doc.setFontSize(16);
        doc.text('SISTEMA DE GESTIÓN DE PROVEEDORES', pageWidth / 2, yPos, { align: 'center' });
        yPos += 20;
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text('FRIOALIMENTARIA SAS', pageWidth / 2, yPos, { align: 'center' });
        doc.text('Norma ISO 9001:2015', pageWidth / 2, yPos + 7, { align: 'center' });
        doc.text(`Generado por: Administrador`, pageWidth / 2, yPos + 20, { align: 'center' });
        doc.text(`Fecha: ${format(new Date(), 'dd/MM/yyyy')}`, pageWidth / 2, pageHeight - 30, { align: 'center' });

        // --- SECCIÓN 1: GUÍA PROVEEDOR ---
        safeAddPage();
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('1. GUÍA PARA EL PROVEEDOR', margin, yPos);
        yPos += 10;
        doc.setTextColor(0);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('1.1 Registro Inicial y Control de Plazo (8 Días)', margin, yPos);
        yPos += 6;
        doc.setFont(undefined, 'normal');
        const p1Text = "Todo proveedor nuevo debe registrarse con su NIT. El sistema inicia un contador de 8 días calendario para completar la información oficial FA-GFC-F04. Pasado este tiempo, el acceso se bloquea automáticamente.";
        const splitP1 = doc.splitTextToSize(p1Text, pageWidth - margin * 2);
        doc.text(splitP1, margin, yPos);
        yPos += splitP1.length * 5 + 5;
        await addImageToPdf('manual-login');

        yPos += 5;
        doc.setFont(undefined, 'bold');
        doc.text('1.2 Diligenciamiento del Formulario Oficial', margin, yPos);
        yPos += 6;
        doc.setFont(undefined, 'normal');
        const p2Text = "El formulario consta de 8 secciones (Tributaria, Ambiental, Legal, Financiera, HSEQ y SARLAFT). Es obligatorio adjuntar documentos en PDF.";
        const splitP2 = doc.splitTextToSize(p2Text, pageWidth - margin * 2);
        doc.text(splitP2, margin, yPos);
        yPos += splitP2.length * 5 + 5;
        await addImageToPdf('manual-form-sections');

        // --- SECCIÓN 2: MANUAL ADMINISTRADOR ---
        safeAddPage();
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('2. MANUAL DEL ADMINISTRADOR', margin, yPos);
        yPos += 10;
        doc.setTextColor(0);

        const adminSections = [
            { id: 'manual-dashboard', title: '2.1 Dashboard de Control', desc: 'Resumen en tiempo real de proveedores activos e inactivos, distribución por categorías y trazabilidad de auditorías.' },
            { id: 'manual-selection-list', title: '2.2 Procesos de Selección', desc: 'Gestión de licitaciones competitivas bajo ISO 9001. Incluye definición de criticidad y adjudicación oficial.' },
            { id: 'manual-provider-list', title: '2.3 Gestión de Proveedores', desc: 'Módulo central para auditar registros, aprobar perfiles, asignar categorías y realizar evaluaciones técnicas.' },
            { id: 'manual-categories-table', title: '2.4 Gestión de Categorías', desc: 'Organización de la base de suministros e importación masiva desde Excel.' },
            { id: 'manual-comparison-tool', title: '2.5 Comparador de Desempeño', desc: 'Análisis de ranking sectorial para identificar los mejores proveedores y gestionar sustituciones técnicas.' },
            { id: 'manual-criteria-weights', title: '2.6 Configuración de Pesos ISO', desc: 'Parametrización dinámica de la rigurosidad de auditoría por sector y nivel de impacto.' },
            { id: 'manual-email-templates', title: '2.7 Plantillas de Notificación', desc: 'Control de comunicaciones transaccionales automatizadas.' }
        ];

        for (const sec of adminSections) {
            if (yPos > pageHeight - 40) safeAddPage();
            doc.setFont(undefined, 'bold');
            doc.setFontSize(11);
            doc.text(sec.title, margin, yPos);
            yPos += 6;
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            const splitDesc = doc.splitTextToSize(sec.desc, pageWidth - margin * 2);
            doc.text(splitDesc, margin, yPos);
            yPos += splitDesc.length * 5 + 5;
            await addImageToPdf(sec.id);
            yPos += 5;
        }

        // --- SECCIÓN 3: ANEXO TÉCNICO ---
        safeAddPage();
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 102, 51);
        doc.text('3. ANEXO TÉCNICO: MATRICES ISO 9001', margin, yPos);
        yPos += 10;
        doc.setTextColor(0);

        const drawMatrixTable = (title: string, headers: string[], rows: any[], colWidths: number[]) => {
            if (yPos > pageHeight - 60) safeAddPage();
            doc.setFont(undefined, 'bold');
            doc.setFontSize(10);
            doc.setFillColor(230, 230, 230);
            doc.rect(margin, yPos - 5, pageWidth - margin * 2, 8, 'F');
            doc.text(title, margin + 2, yPos);
            yPos += 10;

            doc.setFontSize(8);
            let currentX = margin;
            headers.forEach((h, i) => {
                doc.text(h, currentX + 2, yPos);
                currentX += colWidths[i];
            });
            yPos += 4;
            doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);

            rows.forEach(row => {
                if (yPos > pageHeight - 15) safeAddPage();
                doc.setFont(undefined, 'normal');
                let rowX = margin;
                let maxHeight = 0;
                
                const splitContents = row.map((cell: string, i: number) => {
                    const split = doc.splitTextToSize(cell, colWidths[i] - 4);
                    maxHeight = Math.max(maxHeight, split.length * 4);
                    return split;
                });

                splitContents.forEach((content: string[], i: number) => {
                    doc.text(content, rowX + 2, yPos);
                    rowX += colWidths[i];
                });
                
                yPos += maxHeight + 4;
            });
            yPos += 5;
        };

        const drawSelectionGuide = () => {
            if (yPos > pageHeight - 40) safeAddPage();
            doc.setFont(undefined, 'bold');
            doc.setFontSize(9);
            doc.text('Guía de Decisión de Selección', margin, yPos);
            yPos += 6;
            doc.setFontSize(8);
            const guide = [
                ['≥ 85% (4.25)', 'Aprobado'],
                ['70 - 84% (3.5)', 'Aprobado Condicionado'],
                ['60 - 69% (3.0)', 'Requiere análisis gerencial'],
                ['< 60% (3.0)', 'No Aprobado']
            ];
            guide.forEach(line => {
                doc.setFont(undefined, 'bold');
                doc.text(line[0], margin + 5, yPos);
                doc.setFont(undefined, 'normal');
                doc.text(line[1], margin + 40, yPos);
                yPos += 5;
            });
            doc.setFontSize(7);
            doc.text('* El sistema multiplica el puntaje (1-5) por 20 para obtener el equivalente porcentual.', margin, yPos);
            yPos += 10;
        };

        // --- 3.1 SELECCIÓN PRODUCTOS ---
        const selProdHeaders = ['Dimensión ISO', 'Qué se evalúa (Indicador)', 'Crit (%)', 'Norm (%)'];
        const selProdRows = [
            ['Capacidad Legal', 'Validación de Cámara de Comercio, RUT actualizado, Planilla PILA y Certificado SG-SST vigente.', '20%', '20%'],
            ['Capacidad Técnica', 'Experiencia comprobada, fichas técnicas de productos, certificaciones INVIMA/ONAC y visita técnica obligatoria.', '40%', '35%'],
            ['Capacidad Operativa', 'Infraestructura logística, disponibilidad de flota, tiempos de entrega y capacidad de almacenamiento.', '15%', '20%'],
            ['Capacidad Comercial', 'Estabilidad financiera (Estados), precios competitivos en el mercado y condiciones de pago (crédito).', '10%', '15%'],
            ['Riesgo y Continuidad', 'Plan de contingencia ante fallas de suministro y pólizas de cumplimiento/responsabilidad civil.', '15%', '10%']
        ];
        drawMatrixTable('3.1 MATRIZ DE SELECCIÓN - SECTOR PRODUCTOS', selProdHeaders, selProdRows, [40, 100, 20, 20]);
        drawSelectionGuide();

        // --- 3.2 SELECCIÓN SERVICIOS ---
        const selServHeaders = ['Dimensión ISO', 'Qué se evalúa (Indicador)', 'Crit (%)', 'Norm (%)'];
        const selServRows = [
            ['Capacidad Legal', 'Representación legal, RUT, cumplimiento de para-fiscales y certificación HSEQ superior al 60%.', '20%', '20%'],
            ['Idoneidad Técnica', 'Personal certificado (alturas, eléctrico), equipos calibrados y portafolio técnico especializado.', '40%', '35%'],
            ['Respuesta Operativa', 'Disponibilidad de staff para emergencias 24/7 y cobertura geográfica del servicio.', '15%', '20%'],
            ['Solidez Comercial', 'Referencias comerciales, estabilidad financiera y flexibilidad en las tarifas de servicio.', '10%', '15%'],
            ['Gestión de Riesgos', 'Cumplimiento de protocolos de seguridad en sitio y coberturas de seguros para daños a terceros.', '15%', '10%']
        ];
        drawMatrixTable('3.2 MATRIZ DE SELECCIÓN - SECTOR SERVICIOS', selServHeaders, selServRows, [40, 100, 20, 20]);
        drawSelectionGuide();

        // --- 3.3 DESEMPEÑO PRODUCTOS ---
        safeAddPage();
        const perfProdHeaders = ['Criterio', 'Detalle del Indicador (Evidencia)', 'Crit (%)', 'Norm (%)'];
        const perfProdRows = [
            ['Conformidad Técnica', 'Cero devoluciones por especificaciones técnicas incorrectas o defectos de fábrica.', '20%', '20%'],
            ['OTIF (Oportunidad)', 'Entregas 100% completas y en la fecha pactada. Cruce con órdenes de compra.', '30%', '20%'],
            ['Gestión Documental', 'Facturación electrónica sin errores y entrega de certificados de calidad por lote.', '10%', '15%'],
            ['Soporte y Garantía', 'Tiempos de respuesta menores a 48h ante reclamos técnicos.', '20%', '15%'],
            ['Capacidad Emergencia', 'Respuesta ante solicitudes de repuestos críticos fuera de horario habitual.', '20%', '30%']
        ];
        drawMatrixTable('3.3 MATRIZ DE DESEMPEÑO - PRODUCTOS', perfProdHeaders, perfProdRows, [40, 100, 20, 20]);

        // --- 3.4 DESEMPEÑO SERVICIOS ---
        const perfServHeaders = ['Criterio', 'Detalle del Indicador (Evidencia)', 'Crit (%)', 'Norm (%)'];
        const perfServRows = [
            ['Eficacia Prestación', 'Ausencia de re-trabajos o fallas recurrentes en los 30 días posteriores al servicio.', '40%', '30%'],
            ['Competencia Personal', 'Validación de carnés de alturas, perfiles técnicos y uso de herramientas calibradas.', '20%', '15%'],
            ['Cumplimiento SST', 'Uso correcto de EPP, permisos de trabajo en caliente/alturas y planilla PILA.', '15%', '25%'],
            ['Trazabilidad', 'Entrega de informes técnicos detallados y bitácoras de mantenimiento.', '15%', '15%'],
            ['Disponibilidad', 'Tiempo de llegada al sitio tras reporte de falla crítica en planta.', '10%', '15%']
        ];
        drawMatrixTable('3.4 MATRIZ DE DESEMPEÑO - SERVICIOS', perfServHeaders, perfServRows, [40, 100, 20, 20]);

        // --- 3.5 GUÍA DE DECISIÓN TÉCNICA (AUDITORÍA) ---
        if (yPos > pageHeight - 60) safeAddPage();
        doc.setFont(undefined, 'bold');
        doc.setFontSize(11);
        doc.text('3.5 GUÍA DE DECISIÓN TÉCNICA (AUDITORÍA DE DESEMPEÑO)', margin, yPos);
        yPos += 10;

        const auditGuide = [
            { label: 'CONFORME (> 85%)', desc: 'El proveedor mantiene su estatus activo. Se valida el cumplimiento de estándares normativos. No requiere planes de mejora inmediatos.' },
            { label: 'EN OBSERVACIÓN (70% - 84%)', desc: 'Requiere Plan de Acción ISO. El proveedor debe radicar compromisos obligatorios para subsanar los hallazgos.' },
            { label: 'NO CONFORME (< 70%)', desc: 'No Conformidad Grave. El sistema alerta al administrador para iniciar el Protocolo de Sustitución técnica.' }
        ];

        auditGuide.forEach(g => {
            doc.setFont(undefined, 'bold');
            doc.setFontSize(9);
            doc.text(g.label, margin + 5, yPos);
            yPos += 5;
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);
            const splitG = doc.splitTextToSize(g.desc, pageWidth - margin * 2 - 10);
            doc.text(splitG, margin + 5, yPos);
            yPos += splitG.length * 4 + 5;
        });

        // Final numeration
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Página ${i} de ${totalPages} | Manual FA-GFC-M01 | Frioalimentaria SAS`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        doc.save(`Manual_Operativo_FAL_${format(new Date(), 'yyyyMMdd')}.pdf`);
        toast({ title: 'PDF Generado', description: 'El manual completo se ha exportado con éxito.' });
    } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: 'Fallo al generar el PDF técnico.' });
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const ManualImageSlot = ({ id, alt }: { id: string; alt: string }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditingInSlot, setIsEditingInSlot] = useState(false);
    const url = getImageUrl(id);
    const isUploading = uploadingId === id;
    const hasRemote = !!remoteConfig?.imageUrls?.[id];
    
    const isPdf = url?.toLowerCase().includes('.pdf');
    const canShowEditControls = isAdmin && globalEditMode;

    return (
      <div className="relative group rounded-lg overflow-hidden border-4 border-white shadow-lg bg-muted/20 my-6 min-h-[200px] flex flex-col items-center justify-center">
        {url ? (
          <div className="relative w-full">
            {isPdf ? (
              <div className="w-full h-[400px] bg-white">
                  <iframe 
                      src={`${url}#toolbar=0`} 
                      className="w-full h-full border-none"
                      title={alt}
                  />
              </div>
            ) : (
              <div className="relative w-full h-auto">
                  <Image 
                    src={url} 
                    alt={alt} 
                    width={800} 
                    height={400} 
                    className="w-full h-auto object-cover min-h-[200px]" 
                  />
              </div>
            )}

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="rounded-full shadow-md bg-white/90 hover:bg-white text-primary"
                  >
                    <Maximize2 className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className={cn(
                  "max-w-[95vw] p-0 overflow-hidden bg-black/90 border-none flex flex-col items-center justify-center",
                  isPdf ? "h-[95vh]" : "max-h-[95vh]"
                )}>
                  <DialogHeader className="sr-only">
                    <DialogTitle>Vista ampliada de {alt}</DialogTitle>
                  </DialogHeader>
                  <div className="relative w-full h-full flex items-center justify-center p-4">
                    {isPdf ? (
                      <iframe 
                        src={url} 
                        className="w-full h-full border-none rounded-lg"
                        title={alt}
                      />
                    ) : (
                      <div className="relative w-full h-full max-h-[85vh] aspect-video">
                        <Image 
                          src={url} 
                          alt={alt} 
                          fill
                          className="object-contain"
                          priority
                        />
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ) : (
          <div className="w-full h-[250px] flex flex-col items-center justify-center bg-muted/50 gap-2">
            <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground font-medium italic">Pendiente por cargar recurso real</p>
          </div>
        )}
        
        {canShowEditControls && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 p-6 z-30 transition-all duration-300">
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept="image/*,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                    handleImageUpload(id, file);
                    setIsEditingInSlot(false);
                }
              }}
            />

            {!isEditingInSlot && url ? (
                <Button 
                    size="lg" 
                    variant="secondary"
                    className="font-bold gap-2 shadow-xl" 
                    onClick={() => setIsEditingInSlot(true)}
                >
                    <Unlock className="h-4 w-4" /> Habilitar Edición / Reemplazar
                </Button>
            ) : (
                <div className="flex flex-col items-center gap-4 w-full max-w-xs bg-white p-6 rounded-lg shadow-2xl">
                    <h4 className="font-bold text-primary text-sm flex items-center gap-2">
                        <Settings2 className="h-4 w-4" /> Gestor de Recurso
                    </h4>
                    
                    <div className="flex gap-2 w-full">
                        <Button 
                            className="flex-1 font-bold gap-2" 
                            disabled={isUploading}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            Cargar
                        </Button>
                        
                        {hasRemote && (
                            <Button 
                                variant="destructive" 
                                size="icon"
                                onClick={() => {
                                    handleResetImage(id);
                                    setIsEditingInSlot(false);
                                }}
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {url && (
                        <Button 
                            variant="outline" 
                            className="w-full font-bold border-primary text-primary hover:bg-primary hover:text-white"
                            onClick={() => setIsEditingInSlot(false)}
                        >
                            <Lock className="h-4 w-4 mr-2" /> Fijar y Proteger
                        </Button>
                    )}
                </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const SelectionGuide = () => (
    <Card className="mt-6 border shadow-sm">
        <CardHeader className="py-4 bg-muted/30 border-b">
            <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Guía de Decisión de Selección
            </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-1 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Puntaje (%)</span>
                <span>Decisión</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-green-700">
                <span>&ge; 85% (4.25)</span>
                <span>Aprobado</span>
            </div>
            <div className="flex justify-between items-center text-xs font-medium text-blue-700">
                <span>70 - 84% (3.5)</span>
                <span>Aprobado Cond.</span>
            </div>
            <div className="flex justify-between items-center text-xs font-medium text-yellow-700">
                <span>60 - 69% (3.0)</span>
                <span>Req. Análisis</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-red-700">
                <span>&lt; 60% (3.0)</span>
                <span>No Aprobado</span>
            </div>
            <div className="text-[9px] text-muted-foreground mt-4 italic leading-tight">
                * El sistema multiplica el puntaje (1-5) por 20 para obtener el equivalente porcentual.
            </div>
        </CardContent>
    </Card>
  );

  if (isRoleLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto p-4 py-12 max-w-6xl">
        <div className="flex flex-col items-center gap-4 mb-12 text-center">
          <div className="bg-primary/10 p-4 rounded-full">
            <BookOpen className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent uppercase">
            Manual de Operación y Procedimientos
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Documento FA-GFC-M01: Guía integral para la gestión de proveedores bajo el estándar ISO 9001:2015 en Frioalimentaria SAS.
          </p>
          
          {isAdmin && (
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 bg-muted/50 p-6 rounded-2xl border border-primary/10 shadow-inner">
                <div className="flex items-center gap-4 border-r pr-6">
                    <div className="flex flex-col items-end">
                        <Label htmlFor="edit-mode" className="font-black uppercase text-[10px] tracking-widest text-primary">Modo Edición de Recursos</Label>
                        <span className="text-[9px] text-muted-foreground font-bold leading-none">Actualización de pantallazos reales</span>
                    </div>
                    <Switch 
                        id="edit-mode" 
                        checked={globalEditMode} 
                        onCheckedChange={setGlobalEditMode}
                        className="data-[state=checked]:bg-primary"
                    />
                </div>
                <Button 
                    onClick={handleExportPdf} 
                    disabled={isGeneratingPdf}
                    className="font-bold gap-2 uppercase tracking-tighter shadow-md"
                >
                    {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                    Exportar Manual Completo PDF
                </Button>
            </div>
          )}
        </div>

        <Tabs defaultValue="provider" className="space-y-8">
          <TabsList className={cn(
            "grid w-full h-14 bg-muted/50 p-1 border",
            isAdmin ? "grid-cols-3" : "grid-cols-1"
          )}>
            <TabsTrigger value="provider" className="text-base font-bold gap-2">
              <Users className="h-5 w-5" /> Guía para el Proveedor
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="admin" className="text-base font-bold gap-2">
                  <Settings className="h-5 w-5" /> Manual del Administrador
                </TabsTrigger>
                <TabsTrigger value="technical" className="text-base font-bold gap-2">
                  <ShieldCheck className="h-5 w-5" /> Anexo Técnico ISO 9001
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="provider" className="animate-in fade-in duration-500">
            <Card className="border-t-8 border-t-accent shadow-xl">
              <CardHeader>
                <CardTitle className="text-3xl font-black uppercase text-accent">Instrucciones para el Proveedor</CardTitle>
                <CardDescription className="text-lg">Proceso de registro oficial y mantenimiento de la relación comercial.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-12">
                <Accordion type="single" collapsible className="w-full space-y-4">
                  <AccordionItem value="p1" className="border rounded-xl px-4 bg-muted/5">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline text-left">1. Registro Inicial y Control de Plazo (8 Días)</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4">
                      <div className="space-y-4 leading-relaxed text-muted-foreground text-sm">
                        <div>Todo proveedor nuevo o invitado debe registrarse utilizando su <strong>NIT (sin dígito de verificación)</strong>. Al crear la cuenta, el sistema inicia un contador de <strong>8 días calendario</strong> para completar la información oficial.</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-white rounded border border-primary/10 shadow-sm">
                                <span className="font-bold block text-primary text-[10px] uppercase mb-1">Usuario de Acceso</span>
                                <span className="text-sm font-medium text-foreground">Su NIT (Ej: 900123456)</span>
                            </div>
                            <div className="p-4 bg-white rounded border border-primary/10 shadow-sm">
                                <span className="font-bold block text-primary text-[10px] uppercase mb-1">Control Normativo</span>
                                <span className="text-sm font-medium text-foreground">Contador visual de 8 días</span>
                            </div>
                        </div>
                      </div>
                      <ManualImageSlot id="manual-login" alt="Interfaz de Acceso al Portal" />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="p2" className="border rounded-xl px-4 bg-muted/5">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline text-left">2. Diligenciamiento del Formulario FA-GFC-F04</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4">
                      <div className="space-y-4 leading-relaxed text-muted-foreground text-sm">
                        <div>El formulario oficial consta de 8 secciones alineadas con ISO 9001. Es obligatorio adjuntar los documentos soporte únicamente en formato <strong>PDF (máx. 5MB)</strong>.</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg bg-white shadow-sm">
                            <div className="font-bold flex items-center gap-2 mb-2 text-primary uppercase text-[10px] tracking-tight">
                                <CheckCircle2 className="h-4 w-4" /> Datos Críticos
                            </div>
                            <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4 font-medium">
                              <li>Información Tributaria Completa.</li>
                              <li>Contactos Comerciales y de Pagos.</li>
                              <li>Certificación Bancaria (Vigente).</li>
                              <li>Certificado HSEQ 0312 (Evaluación &gt; 60%).</li>
                            </ul>
                          </div>
                          <div className="p-4 border rounded-lg bg-white shadow-sm">
                            <div className="font-bold flex items-center gap-2 mb-2 text-primary uppercase text-[10px] tracking-tight">
                                <Gavel className="h-4 w-4" /> SARLAFT Digital
                            </div>
                            <div className="text-xs text-muted-foreground leading-relaxed font-medium">
                              Al marcar la aceptación, firma digitalmente su compromiso de transparencia bajo la Ley 1581 de 2012.
                            </div>
                          </div>
                        </div>
                      </div>
                      <ManualImageSlot id="manual-form-sections" alt="Estructura del Formulario de Registro" />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <>
              <TabsContent value="admin" className="animate-in fade-in duration-500">
                <Card className="border-t-8 border-t-primary shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-3xl font-black uppercase text-primary">Manual Operativo del Administrador</CardTitle>
                    <CardDescription className="text-lg">Gestión de módulos del Sistema de Gestión de Proveedores FAL.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-12">
                    <Accordion type="single" collapsible className="w-full space-y-4">
                      <AccordionItem value="a-dash" className="border rounded-xl px-4 bg-muted/5">
                        <AccordionTrigger className="text-xl font-bold hover:no-underline text-left flex gap-3">
                            <LayoutDashboard className="h-6 w-6 text-primary" /> 1. Dashboard de Control
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6 pt-4">
                          <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
                            <p>Visualización en tiempo real de la salud de la cadena de suministros:</p>
                            <ul className="list-disc pl-6 space-y-2 text-sm font-medium">
                                <li><strong>Resumen de Proveedores:</strong> Estado de activación de las cuentas.</li>
                                <li><strong>Proveedores por Categoría:</strong> Concentración de proveedores por sector operativo.</li>
                                <li><strong>Evaluaciones Recientes:</strong> Trazabilidad de las últimas auditorías ISO ejecutadas.</li>
                            </ul>
                          </div>
                          <ManualImageSlot id="manual-dashboard" alt="Módulo de Dashboard Administrativo" />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="a-selection" className="border rounded-xl px-4 bg-muted/5">
                        <AccordionTrigger className="text-xl font-bold hover:no-underline text-left flex gap-3">
                            <ClipboardCheck className="h-6 w-6 text-primary" /> 2. Procesos de Selección
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6 pt-4">
                          <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
                            <p>Módulo para la selección competitiva de proveedores:</p>
                            <ol className="list-decimal pl-6 space-y-3 text-sm font-medium">
                                <li><strong>Definición:</strong> Establecer sector y nivel de criticidad inicial.</li>
                                <li><strong>Criterios ISO:</strong> Parametrizar pesos (deben sumar 100%).</li>
                                <li><strong>Evaluación:</strong> Cargar cotizaciones y asignar puntajes (1-5) con sustento en bitácora.</li>
                                <li><strong>Adjudicación:</strong> Cierre del proceso y envío de invitación automática al ganador.</li>
                            </ol>
                          </div>
                          <ManualImageSlot id="manual-selection-detail" alt="Matriz de Selección y Adjudicación" />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="a-providers" className="border rounded-xl px-4 bg-muted/5">
                        <AccordionTrigger className="text-xl font-bold hover:no-underline text-left flex gap-3">
                            <Users className="h-6 w-6 text-primary" /> 3. Gestión de Proveedores
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6 pt-4">
                          <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
                            <p>Centro de control de la base de datos oficial:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-white border rounded-lg shadow-sm">
                                    <h5 className="font-bold text-primary text-[10px] uppercase mb-2">Auditoría de Registro</h5>
                                    <div className="text-xs leading-tight font-medium">Revisión de documentos PDF y aprobación formal del perfil para el estatus 'Aprobado'.</div>
                                </div>
                                <div className="p-4 bg-white border rounded-lg shadow-sm">
                                    <h5 className="font-bold text-primary text-[10px] uppercase mb-2">Evaluación Técnica</h5>
                                    <div className="text-xs leading-tight font-medium">Ejecución de auditorías periódicas basadas en los criterios del Anexo Técnico.</div>
                                </div>
                            </div>
                          </div>
                          <ManualImageSlot id="manual-provider-list" alt="Panel de Gestión de Proveedores" />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="a-categories" className="border rounded-xl px-4 bg-muted/5">
                        <AccordionTrigger className="text-xl font-bold hover:no-underline text-left flex gap-3">
                            <Tags className="h-6 w-6 text-primary" /> 4. Gestión de Categorías
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6 pt-4">
                          <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
                            <p>Organización de la base de suministros por especialidad operativa:</p>
                            <ul className="list-disc pl-6 space-y-2 text-sm font-medium">
                                <li><strong>IDs Secuenciales:</strong> Asignación de códigos de 4 dígitos para trazabilidad en ERP.</li>
                                <li><strong>Importación:</strong> Carga masiva de sectores mediante archivos Excel.</li>
                            </ul>
                          </div>
                          <ManualImageSlot id="manual-categories-table" alt="Gestión de Categorías e Importación" />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="a-compare" className="border rounded-xl px-4 bg-muted/5">
                        <AccordionTrigger className="text-xl font-bold hover:no-underline text-left flex gap-3">
                            <BarChart3 className="h-6 w-6 text-primary" /> 5. Comparador de Desempeño
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6 pt-4">
                          <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
                            <p>Herramienta para el análisis de riesgo y sustitución:</p>
                            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 flex gap-4">
                                <TrendingUp className="h-6 w-6 text-primary shrink-0" />
                                <div className="text-sm italic font-medium">
                                    Permite comparar el cumplimiento de todos los proveedores en una misma categoría. Si un proveedor cae en 'No Conforme', habilita la apertura de una nueva selección para sustitución técnica.
                                </div>
                            </div>
                          </div>
                          <ManualImageSlot id="manual-comparison-tool" alt="Ranking de Desempeño Sectorial" />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="a-weights" className="border rounded-xl px-4 bg-muted/5">
                        <AccordionTrigger className="text-xl font-bold hover:no-underline text-left flex gap-3">
                            <Settings className="h-6 w-6 text-primary" /> 6. Configuración de Pesos ISO
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6 pt-4">
                          <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
                            <p>Parametrización dinámica de la rigurosidad de auditoría:</p>
                            <ul className="list-disc pl-6 space-y-2 text-sm font-medium">
                                <li><strong>Ajuste Fino:</strong> Cambiar los pesos por defecto para cada sector.</li>
                                <li><strong>Refuerzo Crítico:</strong> Los proveedores marcados como 'Críticos' reciben automáticamente una ponderación más estricta.</li>
                            </ul>
                          </div>
                          <ManualImageSlot id="manual-criteria-weights" alt="Parametrización de la Matriz de Calidad" />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="a-emails" className="border rounded-xl px-4 bg-muted/5">
                        <AccordionTrigger className="text-xl font-bold hover:no-underline text-left flex gap-3">
                            <Mail className="h-6 w-6 text-primary" /> 7. Plantillas de Notificación
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6 pt-4">
                          <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
                            <p>Control de comunicaciones transaccionales:</p>
                            <ul className="list-disc pl-6 space-y-2 text-sm font-medium">
                                <li><strong>Personalización:</strong> Edición de cuerpo HTML y asunto.</li>
                                <li><strong>Variables Dinámicas:</strong> Uso de marcadores como <code>{"{{providerName}}"}</code> para automatizar los mensajes.</li>
                            </ul>
                          </div>
                          <ManualImageSlot id="manual-email-templates" alt="Gestión de Plantillas de Correo" />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="technical" className="animate-in fade-in duration-500">
                <Card className="border-t-8 border-t-emerald-600 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-3xl font-black uppercase text-emerald-700">Anexo Técnico: Matrices ISO 9001</CardTitle>
                    <CardDescription className="text-lg">Configuración oficial de pesos, indicadores y guías de decisión técnica.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-16">
                    
                    <div className="space-y-8">
                      <div className="text-2xl font-black flex items-center gap-2 text-primary uppercase border-b-2 border-emerald-100 pb-2">
                        <Scale className="h-7 w-7 text-emerald-600" />
                        <span>1. Matrices de Selección (Evaluación Inicial)</span>
                      </div>

                      <div className="space-y-12">
                        <div className="space-y-4">
                            <Badge className="bg-primary text-white uppercase text-[10px] px-3 py-1 flex w-fit gap-2">
                                <Truck className="h-3 w-3" /> Sector: PRODUCTOS
                            </Badge>
                            <div className="border rounded-xl overflow-hidden shadow-md">
                                <Table>
                                    <TableHeader className="bg-muted">
                                        <TableRow>
                                            <TableHead className="font-black uppercase text-xs w-[25%]">Dimensión ISO</TableHead>
                                            <TableHead className="font-black uppercase text-xs w-[45%]">Qué se evalúa (Indicador)</TableHead>
                                            <TableHead className="text-center font-black uppercase text-xs bg-red-50 text-red-700">Crítico (%)</TableHead>
                                            <TableHead className="text-center font-black uppercase text-xs">No Crítico (%)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="font-bold text-xs">Capacidad Legal</TableCell>
                                            <TableCell className="text-xs text-muted-foreground leading-relaxed italic">Validación de Cámara de Comercio, RUT actualizado, Planilla PILA y Certificado SG-SST vigente.</TableCell>
                                            <TableCell className="text-center font-black">20%</TableCell>
                                            <TableCell className="text-center font-bold">20%</TableCell>
                                        </TableRow>
                                        <TableRow className="bg-blue-50/20">
                                            <TableCell className="font-bold text-xs">Capacidad Técnica</TableCell>
                                            <TableCell className="text-xs text-muted-foreground leading-relaxed italic">Experiencia comprobada, fichas técnicas de productos, certificaciones INVIMA/ONAC y visita técnica obligatoria.</TableCell>
                                            <TableCell className="text-center font-black text-red-700">40%</TableCell>
                                            <TableCell className="text-center font-bold">35%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-bold text-xs">Capacidad Operativa</TableCell>
                                            <TableCell className="text-xs text-muted-foreground leading-relaxed italic">Infraestructura logística, disponibilidad de flota, tiempos de entrega y capacidad de almacenamiento.</TableCell>
                                            <TableCell className="text-center font-black">15%</TableCell>
                                            <TableCell className="text-center font-bold">20%</TableCell>
                                        </TableRow>
                                        <TableRow className="bg-green-50/20">
                                            <TableCell className="font-bold text-xs">Capacidad Comercial</TableCell>
                                            <TableCell className="text-xs text-muted-foreground leading-relaxed italic">Estabilidad financiera (Estados), precios competitivos en el mercado y condiciones de pago (crédito).</TableCell>
                                            <TableCell className="text-center font-black">10%</TableCell>
                                            <TableCell className="text-center font-bold">15%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-bold text-xs">Riesgo y Continuidad</TableCell>
                                            <TableCell className="text-xs text-muted-foreground leading-relaxed italic">Plan de contingencia ante fallas de suministro y pólizas de cumplimiento/responsabilidad civil.</TableCell>
                                            <TableCell className="text-center font-black text-red-700">15%</TableCell>
                                            <TableCell className="text-center font-bold">10%</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="max-w-xs ml-auto">
                                <SelectionGuide />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Badge className="bg-accent text-white uppercase text-[10px] px-3 py-1 flex w-fit gap-2">
                                <HardHat className="h-3 w-3" /> Sector: SERVICIOS
                            </Badge>
                            <div className="border rounded-xl overflow-hidden shadow-md">
                                <Table>
                                    <TableHeader className="bg-muted">
                                        <TableRow>
                                            <TableHead className="font-black uppercase text-xs w-[25%]">Dimensión ISO</TableHead>
                                            <TableHead className="font-black uppercase text-xs w-[45%]">Qué se evalúa (Indicador)</TableHead>
                                            <TableHead className="text-center font-black uppercase text-xs bg-red-50 text-red-700">Crítico (%)</TableHead>
                                            <TableHead className="text-center font-black uppercase text-xs">No Crítico (%)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="font-bold text-xs">Capacidad Legal</TableCell>
                                            <TableCell className="text-xs text-muted-foreground leading-relaxed italic">Representación legal, RUT, cumplimiento de para-fiscales y certificación HSEQ superior al 60%.</TableCell>
                                            <TableCell className="text-center font-black">20%</TableCell>
                                            <TableCell className="text-center font-bold">20%</TableCell>
                                        </TableRow>
                                        <TableRow className="bg-blue-50/20">
                                            <TableCell className="font-bold text-xs">Idoneidad Técnica</TableCell>
                                            <TableCell className="text-xs text-muted-foreground leading-relaxed italic">Personal certificado (alturas, eléctrico), equipos calibrados y portafolio técnico especializado.</TableCell>
                                            <TableCell className="text-center font-black text-red-700">40%</TableCell>
                                            <TableCell className="text-center font-bold">35%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-bold text-xs">Respuesta Operativa</TableCell>
                                            <TableCell className="text-xs text-muted-foreground leading-relaxed italic">Disponibilidad de staff para emergencias 24/7 y cobertura geográfica del servicio.</TableCell>
                                            <TableCell className="text-center font-black">15%</TableCell>
                                            <TableCell className="text-center font-bold">20%</TableCell>
                                        </TableRow>
                                        <TableRow className="bg-green-50/20">
                                            <TableCell className="font-bold text-xs">Solidez Comercial</TableCell>
                                            <TableCell className="text-xs text-muted-foreground leading-relaxed italic">Referencias comerciales, estabilidad financiera y flexibilidad en las tarifas de servicio.</TableCell>
                                            <TableCell className="text-center font-black">10%</TableCell>
                                            <TableCell className="text-center font-bold">15%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-bold text-xs">Gestión de Riesgos</TableCell>
                                            <TableCell className="text-xs text-muted-foreground leading-relaxed italic">Cumplimiento de protocolos de seguridad en sitio y coberturas de seguros para daños a terceros.</TableCell>
                                            <TableCell className="text-center font-black text-red-700">15%</TableCell>
                                            <TableCell className="text-center font-bold">10%</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="max-w-xs ml-auto">
                                <SelectionGuide />
                            </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="text-2xl font-black flex items-center gap-2 text-primary uppercase border-b-2 border-emerald-100 pb-2">
                        <ClipboardCheck className="h-7 w-7 text-emerald-600" />
                        <span>2. Matrices de Evaluación de Desempeño (Auditoría)</span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-12">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-primary text-white uppercase text-[10px] px-3 py-1">PRODUCTOS</Badge>
                                <span className="text-xs font-bold text-muted-foreground uppercase">Matriz de Calidad de Insumos</span>
                            </div>
                            <div className="border rounded-xl overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-muted">
                                        <TableRow>
                                            <TableHead className="text-xs font-black uppercase w-[20%]">Criterio</TableHead>
                                            <TableHead className="text-xs font-black uppercase w-[50%]">Detalle del Indicador (Evidencia)</TableHead>
                                            <TableHead className="text-center text-[10px] font-black uppercase bg-red-50 text-red-700">Crítico</TableHead>
                                            <TableHead className="text-center text-[10px] font-black uppercase">No Crit.</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="text-xs font-bold">Conformidad Técnica</TableCell>
                                            <TableCell className="text-xs text-muted-foreground italic">Cero devoluciones por especificaciones técnicas incorrectas o defectos de fábrica.</TableCell>
                                            <TableCell className="text-center text-xs font-bold">20%</TableCell>
                                            <TableCell className="text-center text-xs">20%</TableCell>
                                        </TableRow>
                                        <TableRow className="bg-red-50/30">
                                            <TableCell className="text-xs font-bold">OTIF (Oportunidad)</TableCell>
                                            <TableCell className="text-xs text-muted-foreground italic">Entregas 100% completas y en la fecha pactada. Cruce con órdenes de compra.</TableCell>
                                            <TableCell className="text-center text-xs font-black text-red-700">30%</TableCell>
                                            <TableCell className="text-center text-xs">20%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="text-xs font-bold">Gestión Documental</TableCell>
                                            <TableCell className="text-xs text-muted-foreground italic">Facturación electrónica sin errores y entrega de certificados de calidad por lote.</TableCell>
                                            <TableCell className="text-center text-xs font-bold">10%</TableCell>
                                            <TableCell className="text-center text-xs">15%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="text-xs font-bold">Soporte y Garantía</TableCell>
                                            <TableCell className="text-xs text-muted-foreground italic">Tiempos de respuesta menores a 48h ante reclamos técnicos.</TableCell>
                                            <TableCell className="text-center text-xs font-bold">20%</TableCell>
                                            <TableCell className="text-center text-xs">15%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="text-xs font-bold">Capacidad Emergencia</TableCell>
                                            <TableCell className="text-xs text-muted-foreground italic">Respuesta ante solicitudes de repuestos críticos fuera de horario habitual.</TableCell>
                                            <TableCell className="text-center text-xs font-bold">20%</TableCell>
                                            <TableCell className="text-center text-xs font-black">30%</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-accent text-white uppercase text-[10px] px-3 py-1">SERVICIOS</Badge>
                                <span className="text-xs font-bold text-muted-foreground uppercase">Matriz de Eficacia Técnica</span>
                            </div>
                            <div className="border rounded-xl overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-muted">
                                        <TableRow>
                                            <TableHead className="text-xs font-black uppercase w-[20%]">Criterio</TableHead>
                                            <TableHead className="text-xs font-black uppercase w-[50%]">Detalle del Indicador (Evidencia)</TableHead>
                                            <TableHead className="text-center text-[10px] font-black uppercase bg-red-50 text-red-700">Crítico</TableHead>
                                            <TableHead className="text-center text-[10px] font-black uppercase">No Crit.</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow className="bg-red-50/30">
                                            <TableCell className="text-xs font-bold">Eficacia Prestación</TableCell>
                                            <TableCell className="text-xs text-muted-foreground italic">Ausencia de re-trabajos o fallas recurrentes en los 30 días posteriores al servicio.</TableCell>
                                            <TableCell className="text-center text-xs font-black text-red-700">40%</TableCell>
                                            <TableCell className="text-center text-xs font-black">30%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="text-xs font-bold">Competencia Personal</TableCell>
                                            <TableCell className="text-xs text-muted-foreground italic">Validación de carnés de alturas, perfiles técnicos y uso de herramientas calibradas.</TableCell>
                                            <TableCell className="text-center text-xs font-bold">20%</TableCell>
                                            <TableCell className="text-center text-xs">15%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="text-xs font-bold">Cumplimiento SST</TableCell>
                                            <TableCell className="text-xs text-muted-foreground italic">Uso correcto de EPP, permisos de trabajo en caliente/alturas y planilla PILA.</TableCell>
                                            <TableCell className="text-center text-xs font-bold">15%</TableCell>
                                            <TableCell className="text-center text-xs font-black">25%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="text-xs font-bold">Trazabilidad</TableCell>
                                            <TableCell className="text-xs text-muted-foreground italic">Entrega de informes técnicos detallados y bitácoras de mantenimiento.</TableCell>
                                            <TableCell className="text-center text-xs font-bold">15%</TableCell>
                                            <TableCell className="text-center text-xs">15%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="text-xs font-bold">Disponibilidad</TableCell>
                                            <TableCell className="text-xs text-muted-foreground italic">Tiempo de llegada al sitio tras reporte de falla crítica en planta.</TableCell>
                                            <TableCell className="text-center text-xs font-bold">10%</TableCell>
                                            <TableCell className="text-center text-xs">15%</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 pt-8">
                      <div className="text-2xl font-black flex items-center gap-2 text-primary uppercase border-b-2 border-emerald-100 pb-2">
                        <Target className="h-7 w-7 text-emerald-600" />
                        <span>3. Guía de Decisión Técnica (Escala ISO)</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-l-8 border-l-green-500 shadow-lg">
                          <CardHeader className="py-4">
                            <CardTitle className="text-lg uppercase font-black text-green-700">Conforme</CardTitle>
                            <Badge className="bg-green-100 text-green-800 w-fit font-bold font-mono">&gt; 85% (4.25)</Badge>
                          </CardHeader>
                          <CardContent className="text-xs leading-relaxed text-muted-foreground font-medium">
                            El proveedor mantiene su estatus activo. Se valida el cumplimiento de estándares normativos. No requiere planes de mejora inmediatos.
                          </CardContent>
                        </Card>
                        <Card className="border-l-8 border-l-blue-500 shadow-lg">
                          <CardHeader className="py-4">
                            <CardTitle className="text-lg uppercase font-black text-blue-700">En Observación</CardTitle>
                            <Badge className="bg-blue-100 text-blue-800 w-fit font-bold font-mono">70% - 84% (3.5)</Badge>
                          </CardHeader>
                          <CardContent className="text-xs leading-relaxed text-muted-foreground font-medium">
                            <strong>Requiere Plan de Acción ISO.</strong> El proveedor debe radicar compromisos obligatorios para subsanar los hallazgos.
                          </CardContent>
                        </Card>
                        <Card className="border-l-8 border-l-red-500 shadow-lg">
                          <CardHeader className="py-4">
                            <CardTitle className="text-lg uppercase font-black text-red-700">No Conforme</CardTitle>
                            <Badge className="bg-red-100 text-red-800 w-fit font-bold font-mono">&lt; 70%</Badge>
                          </CardHeader>
                          <CardContent className="text-xs leading-relaxed text-muted-foreground font-medium">
                            <strong>No Conformidad Grave.</strong> El sistema alerta al administrador para iniciar el Protocolo de Sustitución técnica.
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>

        <div className="mt-12 text-center text-muted-foreground text-xs border-t pt-8">
          <p>© {new Date().getFullYear()} Frioalimentaria SAS - Sistema de Gestión de Proveedores</p>
          <p className="mt-1 font-bold">Documento FA-GFC-M01 | Versión 1.0 | Vigencia: 12/06/2025</p>
        </div>
      </div>
    </AuthGuard>
  );
}
