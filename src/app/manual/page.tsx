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
  Eye
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
  const { isAdmin } = useRole();
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
    const finalUrl = remoteUrl || localUrl || null;
    return finalUrl === "" ? null : finalUrl;
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
        description: `El ${isPdf ? 'PDF' : 'pantallazo'} ha sido incorporado al manual.`,
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
    const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
    const url = getImageUrl(id);
    const isUploading = uploadingId === id;
    const hasRemote = !!remoteConfig?.imageUrls?.[id];
    
    const isPdf = url?.toLowerCase().includes('.pdf');

    // Editing is only possible if Global Mode is ON
    const canShowEditControls = isAdmin && globalEditMode;

    return (
      <div className="relative group rounded-lg overflow-hidden border shadow-sm bg-muted/10 my-8 min-h-[200px] flex flex-col items-center justify-center">
        {url ? (
          isPdf ? (
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
                  data-ai-hint="business software interface" 
                  className="w-full h-auto object-cover min-h-[200px]" 
                />
                
                {/* Fullscreen Button - Visible on Hover for EVERYONE, but hidden if edit controls are actively showing */}
                {!isEditingInSlot && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="lg" 
                          variant="secondary" 
                          className="rounded-full shadow-2xl h-14 w-14 bg-white/95 hover:bg-white text-primary border-2 border-primary/20 scale-90 hover:scale-100 transition-transform"
                        >
                          <Maximize2 className="h-6 w-6" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/90 border-none flex items-center justify-center">
                        <div className="relative w-full h-full flex items-center justify-center p-4">
                          <div className="relative w-full h-full max-h-[85vh] aspect-video">
                            <Image 
                              src={url} 
                              alt={alt} 
                              fill
                              className="object-contain"
                              priority
                            />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
            </div>
          )
        ) : (
          <div className="w-full h-[300px] flex flex-col items-center justify-center bg-muted/50 gap-4">
            <ImageIcon className="h-12 w-12 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Recurso no disponible</p>
          </div>
        )}
        
        {/* ADMINISTRATIVE OVERLAY - Only shows if Global Edit Mode is ON */}
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

                    <p className="text-[9px] text-muted-foreground text-center uppercase font-bold">
                        JPG, PNG o PDF (Máx 5MB)
                    </p>
                </div>
            )}
          </div>
        )}
      </div>
    );
  };

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
          
          {/* GLOBAL EDIT TOGGLE - Only for Admins */}
          {isAdmin && (
              <div className="mt-8 flex items-center gap-4 bg-muted/50 p-4 rounded-2xl border border-primary/10 shadow-inner">
                  <div className="flex flex-col items-end">
                      <Label htmlFor="edit-mode" className="font-black uppercase text-[10px] tracking-widest text-primary">Modo Administrador</Label>
                      <span className="text-[9px] text-muted-foreground font-bold">Permitir carga de pantallazos reales</span>
                  </div>
                  <Switch 
                    id="edit-mode" 
                    checked={globalEditMode} 
                    onCheckedChange={setGlobalEditMode}
                    className="data-[state=checked]:bg-primary"
                  />
                  {globalEditMode && (
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-accent animate-pulse px-3 border-l ml-2">
                          <Settings className="h-3 w-3 animate-spin-slow" /> Edición Activa
                      </div>
                  )}
              </div>
          )}
        </div>

        <Tabs defaultValue="provider" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 h-14 bg-muted/50 p-1 border">
            <TabsTrigger value="provider" className="text-base font-bold gap-2">
              <Users className="h-5 w-5" /> Manual del Proveedor
            </TabsTrigger>
            <TabsTrigger value="admin" className="text-base font-bold gap-2">
              <Settings className="h-5 w-5" /> Manual del Administrador
            </TabsTrigger>
            <TabsTrigger value="technical" className="text-base font-bold gap-2">
              <ShieldCheck className="h-5 w-5" /> Anexo Técnico ISO 9001
            </TabsTrigger>
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
                      <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
                        <div>Todo proveedor nuevo o invitado debe registrarse utilizando su <strong>NIT (sin dígito de verificación)</strong>. Al crear la cuenta, el sistema inicia un contador de <strong>8 días calendario</strong> para completar la información oficial.</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-white rounded border border-primary/10 shadow-sm">
                                <span className="font-bold block text-primary text-xs uppercase mb-1">Usuario</span>
                                <span className="text-sm font-medium text-foreground">Su NIT (Ej: 900123456)</span>
                            </div>
                            <div className="p-4 bg-white rounded border border-primary/10 shadow-sm">
                                <span className="font-bold block text-primary text-xs uppercase mb-1">Contraseña</span>
                                <span className="text-sm font-medium text-foreground">La asignada en el registro</span>
                            </div>
                            <div className="p-4 bg-white rounded border border-primary/10 shadow-sm">
                                <span className="font-bold block text-primary text-xs uppercase mb-1">Control</span>
                                <span className="text-sm font-medium text-foreground">Contador visual de 8 días</span>
                            </div>
                        </div>
                      </div>
                      
                      <ManualImageSlot id="manual-login" alt="Interfaz de Acceso al Portal" />

                      <Alert className="bg-orange-50 border-orange-200">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <AlertDescription className="text-orange-800 font-medium">
                          <strong>Bloqueo Automático:</strong> Si el formulario no es guardado y bloqueado en el plazo de 8 días, la cuenta se inhabilitará automáticamente por seguridad normativa.
                        </AlertDescription>
                      </Alert>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="p2" className="border rounded-xl px-4 bg-muted/5">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline text-left">2. Diligenciamiento del Formulario FA-GFC-F04</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4">
                      <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
                        <div>El formulario oficial consta de 8 secciones alineadas con ISO 9001. Es obligatorio adjuntar los documentos soporte únicamente en formato <strong>PDF (máx. 5MB)</strong>.</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg bg-white shadow-sm">
                            <div className="font-bold flex items-center gap-2 mb-2 text-primary uppercase text-xs tracking-tight">
                                <CheckCircle2 className="h-4 w-4" /> Datos Requeridos
                            </div>
                            <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4 font-medium">
                              <li>Información Tributaria (Régimen, CIIU).</li>
                              <li>Contactos Comerciales y de Pagos.</li>
                              <li>Certificación Bancaria (Vigente).</li>
                              <li>Certificado HSEQ 0312 (Evaluación > 60%).</li>
                            </ul>
                          </div>
                          <div className="p-4 border rounded-lg bg-white shadow-sm">
                            <div className="font-bold flex items-center gap-2 mb-2 text-primary uppercase text-xs tracking-tight">
                                <Gavel className="h-4 w-4" /> SARLAFT Digital
                            </div>
                            <div className="text-xs text-muted-foreground leading-relaxed font-medium">
                              El sistema genera una declaración legal dinámica con sus datos reales. Al marcar la aceptación, firma digitalmente su compromiso bajo la Ley 1581 de 2012.
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <ManualImageSlot id="manual-form-sections" alt="Estructura del Formulario de Registro" />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="p3" className="border rounded-xl px-4 bg-muted/5">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline text-left">3. Radicación de Compromisos ISO 9001</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4">
                      <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
                        <div>Si el resultado de una auditoría es inferior al <strong>85% (4.25)</strong>, deberá radicar un plan de mejora:</div>
                        <ol className="list-decimal pl-6 space-y-3 text-sm font-medium">
                          <li>Ingrese al menú <strong>"Mis Evaluaciones ISO"</strong>.</li>
                          <li>Identifique los criterios marcados en <span className="text-destructive font-black">ROJO</span>.</li>
                          <li>Haga clic en <strong>"Radicar Planes de Acción"</strong>.</li>
                          <li>Redacte un compromiso específico para cada hallazgo y envíe el formulario para revisión del administrador.</li>
                        </ol>
                      </div>
                      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 flex gap-4 shadow-inner">
                        <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                        <div className="text-sm italic text-muted-foreground font-medium">
                          La radicación de compromisos es obligatoria para garantizar la continuidad comercial bajo los estándares de calidad de Frioalimentaria SAS.
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin" className="animate-in fade-in duration-500">
            <Card className="border-t-8 border-t-primary shadow-xl">
              <CardHeader>
                <CardTitle className="text-3xl font-black uppercase text-primary">Guía para el Administrador</CardTitle>
                <CardDescription className="text-lg">Gestión de auditoría de registros, evaluación técnica y comparador de desempeño.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-12">
                <Accordion type="single" collapsible className="w-full space-y-4">
                  <AccordionItem value="a1" className="border rounded-xl px-4 bg-muted/5">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline text-left">1. Auditoría de Registro y Activación</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4">
                      <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
                        <div>Cuando un proveedor completa su registro, el estado cambia a <Badge className="bg-blue-100 text-blue-700 ml-1">En Revisión</Badge>. Procedimiento oficial:</div>
                        <ol className="list-decimal pl-6 space-y-3 text-sm font-medium">
                          <li>Ingrese a <strong>Gestión de Proveedores &gt; Gestionar</strong>.</li>
                          <li><strong>Verificar Documentación:</strong> Valide que los PDFs cargados coincidan con la información digital.</li>
                          <li><strong>Asignar Criticidad:</strong> Determine si es <Badge variant="destructive" className="mx-1">Crítico</Badge> o <Badge variant="outline" className="mx-1 border-green-600 text-green-600">No Crítico</Badge> para ajustar la matriz de pesos.</li>
                          <li><strong>Asignar Categorías:</strong> Clasifíquelo correctamente para el comparador de ranking sectorial.</li>
                          <li><strong>Aprobar Registro:</strong> El sistema enviará automáticamente el correo de bienvenida y activación.</li>
                        </ol>
                      </div>
                      
                      <ManualImageSlot id="manual-admin-panel" alt="Panel de Gestión Administrativa" />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="a2" className="border rounded-xl px-4 bg-muted/5">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline text-left">2. Ejecución de Evaluaciones de Desempeño</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4">
                      <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
                        <div>Al realizar una auditoría, el sistema carga automáticamente la matriz oficial (Productos o Servicios) según el sector del proveedor.</div>
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex items-start gap-3 shadow-sm">
                          <ShieldAlert className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                          <div className="text-xs text-orange-800 font-bold leading-relaxed uppercase">
                            <strong>Trazabilidad Obligatoria:</strong> Antes de calificar, el sistema muestra el compromiso radicado por el proveedor en la evaluación anterior. Verifique su cumplimiento antes de asignar la nueva nota.
                          </div>
                        </div>
                      </div>
                      
                      <ManualImageSlot id="manual-evaluation-modal" alt="Proceso de Auditoría Técnica" />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="a3" className="border rounded-xl px-4 bg-muted/5">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline text-left">3. Comparador de Desempeño y Sustitución</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4">
                      <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
                        <div>Herramienta de análisis para el control de la cadena de suministro por categorías técnicas:</div>
                        <ul className="list-disc pl-6 space-y-3 text-sm font-medium">
                          <li><Badge className="bg-green-100 text-green-800 mr-2">Conforme (&gt; 85%)</Badge> Proveedor confiable bajo norma.</li>
                          <li><Badge className="bg-blue-100 text-blue-800 mr-2">En Observación (70-84%)</Badge> Requiere seguimiento estricto a compromisos.</li>
                          <li><Badge className="bg-red-100 text-red-800 mr-2">No Conforme (&lt; 70%)</Badge> <span className="text-destructive font-black">Riesgo Grave.</span> El sistema habilita la <strong>Sustitución de Proveedor</strong> como acción correctiva.</li>
                        </ul>
                      </div>
                      
                      <ManualImageSlot id="manual-comparison-tool" alt="Comparador de Desempeño y Ranking" />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technical" className="animate-in fade-in duration-500">
            <Card className="border-t-8 border-t-emerald-600 shadow-xl">
              <CardHeader>
                <CardTitle className="text-3xl font-black uppercase text-emerald-700">Anexo Técnico: Matrices ISO 9001:2015</CardTitle>
                <CardDescription className="text-lg">Configuración oficial de pesos, indicadores y escala de calificación de Frioalimentaria.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-12">
                <div className="space-y-4">
                  <div className="text-2xl font-black flex items-center gap-2 text-primary uppercase">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    <span>1. Matriz de Desempeño: PRODUCTOS</span>
                  </div>
                  <div className="border rounded-xl overflow-hidden shadow-md">
                    <Table>
                      <TableHeader className="bg-muted">
                        <TableRow>
                          <TableHead className="w-1/2 font-black uppercase">Criterio / Indicador Técnico</TableHead>
                          <TableHead className="text-center font-black uppercase bg-red-50 text-red-700">Peso Crítico</TableHead>
                          <TableHead className="text-center font-black uppercase">Peso No Crítico</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Conformidad Técnica</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-medium">Cumplimiento estricto de la referencia técnica solicitada.</div>
                          </TableCell>
                          <TableCell className="text-center font-black bg-red-50/30">20%</TableCell>
                          <TableCell className="text-center font-bold">20%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Oportunidad y Logística (OTIF)</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-medium">Entrega en fecha pactada y en las cantidades exactas.</div>
                          </TableCell>
                          <TableCell className="text-center font-black bg-red-50/30 text-red-700">30%</TableCell>
                          <TableCell className="text-center font-bold">20%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Gestión Documental y Legal</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-medium">Fichas técnicas, certificados de calidad por lote y facturación sin errores.</div>
                          </TableCell>
                          <TableCell className="text-center font-black bg-red-50/30">10%</TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Soporte y Garantía</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-medium">Agilidad en el proceso de devolución o cambio.</div>
                          </TableCell>
                          <TableCell className="text-center font-black bg-red-50/30">20%</TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Capacidad de Emergencia</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-medium">Disponibilidad de stock para pedidos urgentes de repuestos críticos.</div>
                          </TableCell>
                          <TableCell className="text-center font-black bg-red-50/30">20%</TableCell>
                          <TableCell className="text-center font-black text-emerald-700">30%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="space-y-4 pt-8">
                  <div className="text-2xl font-black flex items-center gap-2 text-primary uppercase">
                    <Wrench className="h-6 w-6 text-emerald-600" />
                    <span>2. Matriz de Desempeño: SERVICIOS</span>
                  </div>
                  <div className="border rounded-xl overflow-hidden shadow-md">
                    <Table>
                      <TableHeader className="bg-muted">
                        <TableRow>
                          <TableHead className="w-1/2 font-black uppercase">Criterio / Indicador Técnico</TableHead>
                          <TableHead className="text-center font-black uppercase bg-red-50 text-red-700">Peso Crítico</TableHead>
                          <TableHead className="text-center font-black uppercase">Peso No Crítico</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Eficacia de la Prestación</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-medium">Equipo operativo sin fallas recurrentes (30 días). Ausencia de re-trabajos.</div>
                          </TableCell>
                          <TableCell className="text-center font-black bg-red-50/30 text-red-700">40%</TableCell>
                          <TableCell className="text-center font-bold">30%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Competencia del Personal</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-medium">Idoneidad certificada (alturas, eléctrico, mecánico) y herramientas calibradas.</div>
                          </TableCell>
                          <TableCell className="text-center font-black bg-red-50/30">20%</TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Cumplimiento SST y Normativo</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-medium">Seguridad social, EPP, permisos de trabajo seguro y normas ambientales.</div>
                          </TableCell>
                          <TableCell className="text-center font-black bg-red-50/30">15%</TableCell>
                          <TableCell className="text-center font-black text-emerald-700">25%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Trazabilidad e Información</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-medium">Entrega de informes técnicos detallados y bitácoras de mantenimiento.</div>
                          </TableCell>
                          <TableCell className="text-center font-black bg-red-50/30">15%</TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Disponibilidad y Respuesta</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-medium">Tiempo transcurrido desde el llamado hasta la presencia del técnico.</div>
                          </TableCell>
                          <TableCell className="text-center font-black bg-red-50/30">10%</TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="space-y-4 pt-8">
                  <div className="text-2xl font-black flex items-center gap-2 text-primary uppercase">
                    <FileText className="h-6 w-6 text-emerald-600" />
                    <span>3. Escala de Calificación Desempeño (1.00 - 5.00)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-l-8 border-l-green-500 shadow-lg">
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg uppercase font-black">Conforme (Aprobado)</CardTitle>
                        <div className="flex gap-2 items-center">
                            <Badge className="bg-green-100 text-green-800 w-fit font-bold">{"> 85% (4.25)"}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm leading-relaxed text-muted-foreground font-medium">
                        El proveedor mantiene su estatus de <strong>Aprobado</strong>. El sistema envía automáticamente un correo de felicitación.
                      </CardContent>
                    </Card>
                    <Card className="border-l-8 border-l-blue-500 shadow-lg">
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg uppercase font-black">En Observación</CardTitle>
                        <div className="flex gap-2 items-center">
                            <Badge className="bg-blue-100 text-blue-800 w-fit font-bold">{"70% - 84% (3.5 - 4.2)"}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm leading-relaxed text-muted-foreground font-medium">
                        Requiere <strong>Plan de Mejora</strong>. El proveedor debe radicar compromisos obligatorios por cada hallazgo detectado.
                      </CardContent>
                    </Card>
                    <Card className="border-l-8 border-l-red-500 shadow-lg">
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg uppercase font-black">No Conforme</CardTitle>
                        <div className="flex gap-2 items-center">
                            <Badge className="bg-red-100 text-red-800 w-fit font-bold">{"< 70% (3.5)"}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm leading-relaxed text-muted-foreground font-medium">
                        Apertura de <strong>No Conformidad Grave</strong>. El administrador evalúa la sustitución inmediata mediante un nuevo proceso de selección competitivo.
                      </CardContent>
                    </Card>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-12 text-center text-muted-foreground text-sm border-t pt-8">
          <p>© {new Date().getFullYear()} Frioalimentaria SAS - Sistema de Gestión de Proveedores</p>
          <p className="mt-1 font-bold">Documento FA-GFC-M01 | Versión 1.0 | Vigencia: 12/06/2025</p>
        </div>
      </div>
    </AuthGuard>
  );
}
