
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
  Stethoscope,
  Target
} from 'lucide-react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

  const ManualImageSlot = ({ id, alt }: { id: string; alt: string }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditingInSlot, setIsEditingInSlot] = useState(false);
    const url = getImageUrl(id);
    const isUploading = uploadingId === id;
    const hasRemote = !!remoteConfig?.imageUrls?.[id];
    
    const isPdf = url?.toLowerCase().includes('.pdf');
    const canShowEditControls = isAdmin && globalEditMode;

    return (
      <div className="relative group rounded-lg overflow-hidden border shadow-sm bg-muted/10 my-8 min-h-[200px] flex flex-col items-center justify-center">
        {url ? (
          <div className="relative w-full">
            {isPdf ? (
              <div className="w-full h-[500px] bg-white">
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
                    size="lg" 
                    variant="secondary" 
                    className="rounded-full shadow-2xl h-14 w-14 bg-white/95 hover:bg-white text-primary border-2 border-primary/20 scale-90 hover:scale-100 transition-transform"
                  >
                    <Maximize2 className="h-6 w-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent className={cn(
                  "max-w-[95vw] p-0 overflow-hidden bg-black/90 border-none flex flex-col items-center justify-center",
                  isPdf ? "h-[95vh]" : "max-h-[95vh]"
                )}>
                  <DialogHeader className="sr-only">
                    <DialogTitle>Vista ampliada: {alt}</DialogTitle>
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
          <div className="w-full h-[300px] flex flex-col items-center justify-center bg-muted/50 gap-4">
            <ImageIcon className="h-12 w-12 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Recurso no disponible</p>
          </div>
        )}
        
        {canShowEditControls && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 p-6 z-30 animate-in fade-in duration-200">
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
                <div className="flex flex-col items-center gap-4">
                    <div className="bg-green-500/20 text-green-400 border border-green-500/50 px-4 py-2 rounded-full flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                        <Lock className="h-3.5 w-3.5" /> Recurso Protegido
                    </div>
                    <Button 
                        size="lg" 
                        variant="secondary"
                        className="font-black gap-2 uppercase tracking-tighter shadow-xl" 
                        onClick={() => setIsEditingInSlot(true)}
                    >
                        <Unlock className="h-4 w-4" /> Habilitar Edición / Reemplazar
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4 w-full max-w-sm bg-white p-6 rounded-xl shadow-2xl">
                    <h4 className="font-black text-primary uppercase text-xs tracking-widest flex items-center gap-2">
                        <Settings2 className="h-4 w-4" /> Configuración de Imagen
                    </h4>
                    
                    <div className="flex gap-2 w-full">
                        <Button 
                            className="flex-1 font-bold gap-2" 
                            disabled={isUploading}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            Subir Archivo
                        </Button>
                        
                        {hasRemote && (
                            <Button 
                                variant="destructive" 
                                size="icon"
                                className="shrink-0"
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
                            className="w-full font-black uppercase tracking-widest border-primary text-primary hover:bg-primary hover:text-white"
                            onClick={() => setIsEditingInSlot(false)}
                        >
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Finalizar y Fijar
                        </Button>
                    )}
                </div>
            )}
          </div>
        )}
      </div>
    );
  };

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
              <div className="mt-8 flex items-center gap-4 bg-muted/50 p-4 rounded-2xl border border-primary/10 shadow-inner">
                  <div className="flex flex-col items-end">
                      <Label htmlFor="edit-mode" className="font-black uppercase text-[10px] tracking-widest text-primary">Modo Administrador</Label>
                      <span className="text-[9px] text-muted-foreground font-bold">Permitir carga de recursos reales</span>
                  </div>
                  <Switch 
                    id="edit-mode" 
                    checked={globalEditMode} 
                    onCheckedChange={setGlobalEditMode}
                    className="data-[state=checked]:bg-primary"
                  />
              </div>
          )}
        </div>

        <Tabs defaultValue="provider" className="space-y-8">
          <TabsList className={cn(
            "grid w-full h-14 bg-muted/50 p-1 border",
            isAdmin ? "grid-cols-3" : "grid-cols-1"
          )}>
            <TabsTrigger value="provider" className="text-base font-bold gap-2">
              <Users className="h-5 w-5" /> Manual del Proveedor
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
                <CardTitle className="text-3xl font-black uppercase text-accent">Guía para el Proveedor</CardTitle>
                <CardDescription className="text-lg">Proceso de registro, actualización y cumplimiento de compromisos de mejora.</CardDescription>
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
                                <span className="font-bold block text-primary text-xs uppercase mb-1">Usuario</span>
                                <span className="text-sm font-medium text-foreground">Su NIT (Ej: 900123456)</span>
                            </div>
                            <div className="p-4 bg-white rounded border border-primary/10 shadow-sm">
                                <span className="font-bold block text-primary text-xs uppercase mb-1">Control</span>
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
                            <div className="font-bold flex items-center gap-2 mb-2 text-primary uppercase text-xs tracking-tight">
                                <CheckCircle2 className="h-4 w-4" /> Datos Requeridos
                            </div>
                            <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4 font-medium">
                              <li>Información Tributaria (Régimen, CIIU).</li>
                              <li>Certificación Bancaria (Vigente).</li>
                              <li>Certificado HSEQ 0312 (Evaluación &gt; 60%).</li>
                            </ul>
                          </div>
                          <div className="p-4 border rounded-lg bg-white shadow-sm">
                            <div className="font-bold flex items-center gap-2 mb-2 text-primary uppercase text-xs tracking-tight">
                                <Gavel className="h-4 w-4" /> SARLAFT Digital
                            </div>
                            <div className="text-xs text-muted-foreground leading-relaxed font-medium">
                              Al marcar la aceptación, firma digitalmente su compromiso bajo la Ley 1581 de 2012.
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
                    <CardTitle className="text-3xl font-black uppercase text-primary">Guía para el Administrador</CardTitle>
                    <CardDescription className="text-lg">Gestión detallada por módulos del Sistema de Gestión de Proveedores.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-12">
                    <Accordion type="single" collapsible className="w-full space-y-4">
                      <AccordionItem value="a-dash" className="border rounded-xl px-4 bg-muted/5">
                        <AccordionTrigger className="text-xl font-bold hover:no-underline text-left flex gap-3">
                            <LayoutDashboard className="h-6 w-6 text-primary" /> 1. Dashboard: Control Gerencial
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6 pt-4">
                          <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
                            <p>El tablero principal permite una visualización rápida de la salud de la cadena de suministro:</p>
                            <ul className="list-disc pl-6 space-y-2 text-sm font-medium">
                                <li><strong>Resumen de Proveedores:</strong> Gráfico circular que muestra la relación entre cuentas activas e inactivas.</li>
                                <li><strong>Proveedores por Categoría:</strong> Histograma que identifica la concentración de suministros por sector operativo.</li>
                                <li><strong>Evaluaciones Recientes:</strong> Trazabilidad inmediata de las últimas 5 auditorías realizadas, permitiendo acceso directo al perfil del proveedor.</li>
                            </ul>
                          </div>
                          <ManualImageSlot id="manual-dashboard" alt="Módulo de Dashboard Administrativo" />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="a-selection" className="border rounded-xl px-4 bg-muted/5">
                        <AccordionTrigger className="text-xl font-bold hover:no-underline text-left flex gap-3">
                            <ClipboardCheck className="h-6 w-6 text-primary" /> 2. Procesos de Selección ISO 9001
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6 pt-4">
                          <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
                            <p>Módulo para la selección competitiva de nuevos proveedores bajo el marco de calidad:</p>
                            <ol className="list-decimal pl-6 space-y-3 text-sm font-medium">
                                <li><strong>Creación:</strong> Definir nombre, sector y nivel de criticidad. El sistema ajustará los pesos sugeridos automáticamente.</li>
                                <li><strong>Parametrización de Criterios:</strong> Ajuste de los pesos porcentuales (suma 100%). Se evalúan capacidades legales, técnicas, operativas y financieras.</li>
                                <li><strong>Evaluación de Competidores:</strong> Carga de cotizaciones (PDF) y asignación de puntajes (1-5). Es <strong>obligatorio</strong> registrar la "Bitácora de Verificación" para sustentar cada nota ante auditorías externas.</li>
                                <li><strong>Cierre y Adjudicación:</strong> El sistema genera un Acta de Selección (PDF) y envía automáticamente una invitación de registro al ganador.</li>
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
                            <p>Centro de control para la auditoría y mantenimiento de la base de datos oficial:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-white border rounded-lg shadow-sm">
                                    <h5 className="font-bold text-primary text-xs uppercase mb-2">Auditoría de Registro</h5>
                                    <div className="text-[10px] leading-tight">Usa el botón "Gestionar" para revisar documentos. Puedes aprobar el registro o solicitar correcciones desbloqueando el formulario automáticamente.</div>
                                </div>
                                <div className="p-4 bg-white border rounded-lg shadow-sm">
                                    <h5 className="font-bold text-primary text-xs uppercase mb-2">Evaluación de Desempeño</h5>
                                    <div className="text-[10px] leading-tight">Realiza auditorías periódicas usando las matrices oficiales. El sistema notifica al proveedor si el puntaje es &lt; 85% para que radique compromisos.</div>
                                </div>
                            </div>
                          </div>
                          <ManualImageSlot id="manual-provider-list" alt="Panel de Gestión de Proveedores" />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="a-categories" className="border rounded-xl px-4 bg-muted/5">
                        <AccordionTrigger className="text-xl font-bold hover:no-underline text-left flex gap-3">
                            <Tags className="h-6 w-6 text-primary" /> 4. Categorías Técnicas
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6 pt-4">
                          <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
                            <p>Organización de la base de suministros por especialidad operativa:</p>
                            <ul className="list-disc pl-6 space-y-2 text-sm font-medium">
                                <li><strong>ID Secuencial:</strong> El sistema asigna un código único de 4 dígitos para trazabilidad en ERP.</li>
                                <li><strong>Importación Masiva:</strong> Permite cargar cientos de categorías mediante archivos Excel pre-formateados.</li>
                                <li><strong>Asociación:</strong> Las categorías son la base para el comparador de desempeño sectorial.</li>
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
                            <p>Herramienta analítica para mitigar riesgos en la cadena de suministro:</p>
                            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 flex gap-4 shadow-inner">
                                <TrendingUp className="h-6 w-6 text-primary shrink-0" />
                                <div className="text-sm italic font-medium">
                                    Permite visualizar qué proveedor tiene el mejor cumplimiento ISO 9001 en una categoría específica. Si un proveedor cae en "No Conforme", habilita la opción de "Iniciar Sustitución" abriendo un nuevo proceso de selección competitivo.
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
                            <p>Parametrización dinámica de la rigurosidad de las evaluaciones:</p>
                            <ul className="list-disc pl-6 space-y-2 text-sm font-medium">
                                <li><strong>Ajuste Fino:</strong> Permite cambiar los pesos por defecto de los criterios de evaluación.</li>
                                <li><strong>Refuerzo Crítico:</strong> Los proveedores marcados como "Críticos" reciben automáticamente una ponderación más estricta en factores de riesgo.</li>
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
                            <p>Control de la comunicación institucional automatizada:</p>
                            <ul className="list-disc pl-6 space-y-2 text-sm font-medium">
                                <li><strong>Personalización:</strong> Edición de asunto y cuerpo en formato HTML.</li>
                                <li><strong>Variables Dinámicas:</strong> Uso de marcadores como <code>{"{{providerName}}"}</code> o <code>{"{{score}}"}</code> para insertar datos reales del sistema en el correo.</li>
                            </ul>
                          </div>
                          <ManualImageSlot id="manual-email-templates" alt="Gestión de Comunicaciones Transaccionales" />
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
                    <CardDescription className="text-lg">Configuración oficial de pesos, indicadores y guías de decisión técnica de Frioalimentaria SAS.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-16">
                    
                    {/* SECTION 1: SELECTION MATRIX (DETAILED) */}
                    <div className="space-y-8">
                      <div className="text-2xl font-black flex items-center gap-2 text-primary uppercase border-b-2 border-emerald-100 pb-2">
                        <Scale className="h-7 w-7 text-emerald-600" />
                        <span>1. Matriz de Selección (Evaluación Inicial)</span>
                      </div>

                      <div className="space-y-12">
                        {/* PRODUCTOS SELECTION */}
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
                                            <TableCell className="font-bold text-xs"><Gavel className="h-3.5 w-3.5 inline mr-2 text-primary" /> Capacidad Legal</TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground leading-relaxed italic">Validación de Cámara de Comercio, RUT actualizado, Planilla PILA y Certificado SG-SST vigente.</TableCell>
                                            <TableCell className="text-center font-black">20%</TableCell>
                                            <TableCell className="text-center font-bold">20%</TableCell>
                                        </TableRow>
                                        <TableRow className="bg-blue-50/20">
                                            <TableCell className="font-bold text-xs"><Wrench className="h-3.5 w-3.5 inline mr-2 text-primary" /> Capacidad Técnica</TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground leading-relaxed italic">Experiencia comprobada, fichas técnicas de productos, certificaciones INVIMA/ONAC y visita técnica obligatoria para críticos.</TableCell>
                                            <TableCell className="text-center font-black text-red-700">40%</TableCell>
                                            <TableCell className="text-center font-bold">35%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-bold text-xs"><Truck className="h-3.5 w-3.5 inline mr-2 text-primary" /> Capacidad Operativa</TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground leading-relaxed italic">Infraestructura logística, disponibilidad de flota, tiempos de entrega y capacidad de almacenamiento.</TableCell>
                                            <TableCell className="text-center font-black">15%</TableCell>
                                            <TableCell className="text-center font-bold">20%</TableCell>
                                        </TableRow>
                                        <TableRow className="bg-green-50/20">
                                            <TableCell className="font-bold text-xs"><CircleDollarSign className="h-3.5 w-3.5 inline mr-2 text-primary" /> Capacidad Comercial</TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground leading-relaxed italic">Estabilidad financiera (Estados), precios competitivos en el mercado y condiciones de pago (crédito).</TableCell>
                                            <TableCell className="text-center font-black">10%</TableCell>
                                            <TableCell className="text-center font-bold">15%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-bold text-xs"><ShieldAlert className="h-3.5 w-3.5 inline mr-2 text-primary" /> Riesgo y Continuidad</TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground leading-relaxed italic">Plan de contingencia ante fallas de suministro y pólizas de cumplimiento/responsabilidad civil.</TableCell>
                                            <TableCell className="text-center font-black text-red-700">15%</TableCell>
                                            <TableCell className="text-center font-bold">10%</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* SERVICIOS SELECTION */}
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
                                            <TableCell className="font-bold text-xs"><Gavel className="h-3.5 w-3.5 inline mr-2 text-primary" /> Capacidad Legal</TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground leading-relaxed italic">Representación legal, RUT, cumplimiento de para-fiscales y certificación HSEQ superior al 60%.</TableCell>
                                            <TableCell className="text-center font-black">20%</TableCell>
                                            <TableCell className="text-center font-bold">20%</TableCell>
                                        </TableRow>
                                        <TableRow className="bg-blue-50/20">
                                            <TableCell className="font-bold text-xs"><GraduationCap className="h-3.5 w-3.5 inline mr-2 text-primary" /> Idoneidad Técnica</TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground leading-relaxed italic">Personal certificado en áreas críticas (alturas, eléctrico), equipos calibrados y portafolio técnico especializado.</TableCell>
                                            <TableCell className="text-center font-black text-red-700">40%</TableCell>
                                            <TableCell className="text-center font-bold">35%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-bold text-xs"><Clock className="h-3.5 w-3.5 inline mr-2 text-primary" /> Respuesta Operativa</TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground leading-relaxed italic">Disponibilidad de staff para emergencias 24/7 y cobertura geográfica del servicio.</TableCell>
                                            <TableCell className="text-center font-black">15%</TableCell>
                                            <TableCell className="text-center font-bold">20%</TableCell>
                                        </TableRow>
                                        <TableRow className="bg-green-50/20">
                                            <TableCell className="font-bold text-xs"><CircleDollarSign className="h-3.5 w-3.5 inline mr-2 text-primary" /> Solidez Comercial</TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground leading-relaxed italic">Referencias comerciales, estabilidad financiera y flexibilidad en las tarifas de servicio.</TableCell>
                                            <TableCell className="text-center font-black">10%</TableCell>
                                            <TableCell className="text-center font-bold">15%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-bold text-xs"><ShieldAlert className="h-3.5 w-3.5 inline mr-2 text-primary" /> Gestión de Riesgos</TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground leading-relaxed italic">Cumplimiento de protocolos de seguridad en sitio y coberturas de seguros para daños a terceros.</TableCell>
                                            <TableCell className="text-center font-black text-red-700">15%</TableCell>
                                            <TableCell className="text-center font-bold">10%</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: PERFORMANCE EVALUATION (AUDIT) */}
                    <div className="space-y-8">
                      <div className="text-2xl font-black flex items-center gap-2 text-primary uppercase border-b-2 border-emerald-100 pb-2">
                        <ClipboardCheck className="h-7 w-7 text-emerald-600" />
                        <span>2. Matriz de Evaluación de Desempeño (Auditoría)</span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-12">
                        {/* PRODUCTOS PERFORMANCE */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-primary text-white uppercase text-[10px] px-3 py-1">PRODUCTOS</Badge>
                                <span className="text-xs font-bold text-muted-foreground">Matriz de Calidad de Insumos</span>
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
                                            <TableCell className="text-[10px] text-muted-foreground italic">Cero devoluciones por especificaciones técnicas incorrectas o defectos de fábrica.</TableCell>
                                            <TableCell className="text-center text-xs font-bold">20%</TableCell>
                                            <TableCell className="text-center text-xs">20%</TableCell>
                                        </TableRow>
                                        <TableRow className="bg-red-50/30">
                                            <TableCell className="text-xs font-bold">OTIF (Oportunidad)</TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground italic">Entregas 100% completas y en la fecha pactada. Cruce con órdenes de compra.</TableCell>
                                            <TableCell className="text-center text-xs font-black text-red-700">30%</TableCell>
                                            <TableCell className="text-center text-xs">20%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="text-xs font-bold">Gestión Documental</TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground italic">Facturación electrónica sin errores y entrega de certificados de calidad por lote.</TableCell>
                                            <TableCell className="text-center text-xs font-bold">10%</TableCell>
                                            <TableCell className="text-center text-xs">15%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="text-xs font-bold">Soporte y Garantía</TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground italic">Tiempos de respuesta menores a 48h ante reclamos técnicos.</TableCell>
                                            <TableCell className="text-center text-xs font-bold">20%</TableCell>
                                            <TableCell className="text-center text-xs">15%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="text-xs font-bold">Capacidad Emergencia</TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground italic">Respuesta ante solicitudes de repuestos críticos fuera de horario habitual.</TableCell>
                                            <TableCell className="text-center text-xs font-bold">20%</TableCell>
                                            <TableCell className="text-center text-xs font-black">30%</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* SERVICIOS PERFORMANCE */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-accent text-white uppercase text-[10px] px-3 py-1">SERVICIOS</Badge>
                                <span className="text-xs font-bold text-muted-foreground">Matriz de Eficacia Técnica</span>
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
                                            <TableCell className="text-[10px] text-muted-foreground italic">Ausencia de re-trabajos o fallas recurrentes en los 30 días posteriores al servicio.</TableCell>
                                            <TableCell className="text-center text-xs font-black text-red-700">40%</TableCell>
                                            <TableCell className="text-center text-xs font-black">30%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="text-xs font-bold">Competencia Personal</TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground italic">Validación de carnés de alturas, perfiles técnicos y uso de herramientas calibradas.</TableCell>
                                            <TableCell className="text-center text-xs font-bold">20%</TableCell>
                                            <TableCell className="text-center text-xs">15%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="text-xs font-bold">Cumplimiento SST</TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground italic">Uso correcto de EPP, permisos de trabajo en caliente/alturas y planilla PILA.</TableCell>
                                            <TableCell className="text-center text-xs font-bold">15%</TableCell>
                                            <TableCell className="text-center text-xs font-black">25%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="text-xs font-bold">Trazabilidad</TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground italic">Entrega de informes técnicos fotográficos detallados y bitácoras de mantenimiento.</TableCell>
                                            <TableCell className="text-center text-xs font-bold">15%</TableCell>
                                            <TableCell className="text-center text-xs">15%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="text-xs font-bold">Disponibilidad</TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground italic">Tiempo de llegada al sitio tras reporte de falla crítica en planta.</TableCell>
                                            <TableCell className="text-center text-xs font-bold">10%</TableCell>
                                            <TableCell className="text-center text-xs">15%</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: DECISION GUIDE */}
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
                            El proveedor mantiene su estatus activo. Se valida el cumplimiento de estándares FA-GFC-F04. No requiere planes de mejora inmediatos.
                          </CardContent>
                        </Card>
                        <Card className="border-l-8 border-l-blue-500 shadow-lg">
                          <CardHeader className="py-4">
                            <CardTitle className="text-lg uppercase font-black text-blue-700">En Observación</CardTitle>
                            <Badge className="bg-blue-100 text-blue-800 w-fit font-bold font-mono">70% - 84% (3.5)</Badge>
                          </CardHeader>
                          <CardContent className="text-xs leading-relaxed text-muted-foreground font-medium">
                            <strong>Requiere Plan de Acción ISO.</strong> El proveedor debe radicar compromisos obligatorios en el sistema para subsanar los hallazgos en la siguiente auditoría.
                          </CardContent>
                        </Card>
                        <Card className="border-l-8 border-l-red-500 shadow-lg">
                          <CardHeader className="py-4">
                            <CardTitle className="text-lg uppercase font-black text-red-700">No Conforme</CardTitle>
                            <Badge className="bg-red-100 text-red-800 w-fit font-bold font-mono">&lt; 70%</Badge>
                          </CardHeader>
                          <CardContent className="text-xs leading-relaxed text-muted-foreground font-medium">
                            <strong>Apertura de No Conformidad Grave.</strong> El sistema alerta al administrador para iniciar el Protocolo de Sustitución abriendo un nuevo Proceso de Selección.
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

        <div className="mt-12 text-center text-muted-foreground text-sm border-t pt-8">
          <p>© {new Date().getFullYear()} Frioalimentaria SAS - Sistema de Gestión de Proveedores</p>
          <p className="mt-1 font-bold">Documento FA-GFC-M01 | Versión 1.0 | Vigencia: 12/06/2025</p>
        </div>
      </div>
    </AuthGuard>
  );
}
