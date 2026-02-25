
'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, ShieldCheck, Users, Settings, ClipboardCheck, Info, AlertTriangle, CheckCircle2, FileText, Gavel, Wrench, ShieldAlert, Clock, Image as ImageIcon, Upload, Loader2, RefreshCw } from 'lucide-react';
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

export default function ManualPage() {
  const { isAdmin } = useRole();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [uploadingId, setUploadingingId] = useState<string | null>(null);
  
  // Use state for images to allow dynamic updates
  const [localImages, setLocalImages] = useState(PlaceHolderImages);

  const configDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'settings', 'manual_images') : null),
    [firestore]
  );
  const { data: remoteConfig } = useDoc<any>(configDocRef);

  const getImageUrl = (id: string) => {
    return remoteConfig?.imageUrls?.[id] || localImages.find(i => i.id === id)?.imageUrl || '';
  };

  const handleImageUpload = async (id: string, file: File) => {
    if (!firestore || !isAdmin) return;
    
    setUploadingingId(id);
    try {
      const fileName = `manual_screenshot_${id}_${Date.now()}.pdf`;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', 'system_admin');
      formData.append('fileName', `manual_screenshots/${fileName}`);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Error al subir la imagen.');
      const { url } = await response.json();

      // Update Firestore config
      if (!remoteConfig) {
        await setDoc(configDocRef!, { imageUrls: { [id]: url } });
      } else {
        await updateDoc(configDocRef!, { [`imageUrls.${id}`]: url });
      }

      toast({
        title: 'Imagen Actualizada',
        description: 'El pantallazo real ha sido incorporado al manual.',
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
    const url = getImageUrl(id);
    const isUploading = uploadingId === id;
    const hasRemote = !!remoteConfig?.imageUrls?.[id];

    return (
      <div className="relative group rounded-lg overflow-hidden border-4 border-white shadow-lg bg-muted/20">
        <Image 
          src={url} 
          alt={alt} 
          width={800} 
          height={400} 
          data-ai-hint="business software interface" 
          className="w-full h-auto object-cover min-h-[200px]" 
        />
        
        {isAdmin && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept="image/*,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(id, file);
              }}
            />
            <Button 
              size="sm" 
              className="font-bold gap-2" 
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Cargar Pantallazo Real
            </Button>
            {hasRemote && (
                <Button 
                    size="sm" 
                    variant="destructive" 
                    className="font-bold gap-2" 
                    onClick={() => handleResetImage(id)}
                >
                    <RefreshCw className="h-4 w-4" />
                    Usar por Defecto
                </Button>
            )}
            <p className="text-[10px] text-white/80 text-center uppercase tracking-widest font-black">
                Personaliza esta sección con una captura real de la plataforma
            </p>
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
          {isAdmin && (
              <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase bg-accent/10 text-accent px-4 py-2 rounded-full border border-accent/20 animate-pulse">
                  <ImageIcon className="h-3 w-3" /> Modo Edición de Manual Activado: Puedes subir tus propios pantallazos
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

          {/* SECTION: PROVIDER MANUAL */}
          <TabsContent value="provider" className="animate-in fade-in duration-500">
            <Card className="border-t-8 border-t-accent shadow-xl">
              <CardHeader>
                <CardTitle className="text-3xl font-black uppercase text-accent">Guía para el Proveedor</CardTitle>
                <CardDescription className="text-lg">Proceso de registro, actualización y cumplimiento de compromisos de mejora.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-12">
                <Accordion type="single" collapsible className="w-full space-y-4">
                  <AccordionItem value="p1" className="border rounded-xl px-4 bg-muted/10">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline">1. Registro Inicial y Control de Plazo (8 Días)</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4 text-base leading-relaxed">
                      <div className="space-y-4">
                        <p>Todo proveedor nuevo o invitado debe registrarse utilizando su <strong>NIT (sin dígito de verificación)</strong>. Al crear la cuenta, el sistema inicia un contador de <strong>8 días calendario</strong>.</p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                          <li><strong>Usuario:</strong> Su NIT (Ej: 900123456).</li>
                          <li><strong>Contraseña:</strong> La asignada durante el registro.</li>
                          <li><strong>Plazo:</strong> Verá un contador en la parte superior del formulario indicando el tiempo restante.</li>
                        </ul>
                      </div>
                      
                      <ManualImageSlot id="manual-login" alt="Acceso al Portal" />

                      <Alert className="bg-orange-50 border-orange-200">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <AlertDescription className="text-orange-800 font-medium">
                          <strong>Bloqueo Automático:</strong> Si el formulario no es guardado y bloqueado en el plazo de 8 días, la cuenta se inhabilitará. Deberá radicar una justificación técnica para solicitar una extensión al administrador.
                        </AlertDescription>
                      </Alert>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="p2" className="border rounded-xl px-4 bg-muted/10">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline">2. Diligenciamiento del Formulario FA-GFC-F04</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4 text-base leading-relaxed">
                      <div className="space-y-4">
                        <p>El formulario se compone de 8 secciones críticas. Es obligatorio adjuntar los documentos en formato <strong>PDF (máx. 5MB)</strong>.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg bg-white">
                            <h4 className="font-bold flex items-center gap-2 mb-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Datos Requeridos</h4>
                            <ul className="text-xs space-y-1 text-muted-foreground">
                              <li>Información Tributaria (Régimen, CIIU).</li>
                              <li>Contactos Comerciales y de Pagos.</li>
                              <li>Certificación Bancaria (No mayor a 90 días).</li>
                              <li>Certificado HSEQ 0312 (Vigente).</li>
                            </ul>
                          </div>
                          <div className="p-4 border rounded-lg bg-white">
                            <h4 className="font-bold flex items-center gap-2 mb-2"><Gavel className="h-4 w-4 text-primary" /> SARLAFT Jurídico</h4>
                            <p className="text-xs text-muted-foreground">
                              El sistema genera una declaración dinámica con sus datos. Al marcar el checkbox, está firmando digitalmente su compromiso de origen de fondos.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <ManualImageSlot id="manual-form-sections" alt="Secciones del Formulario" />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="p3" className="border rounded-xl px-4 bg-muted/10">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline">3. Radicación de Compromisos ISO 9001</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4 text-base leading-relaxed">
                      <div className="space-y-4">
                        <p>Si su puntaje en una evaluación es inferior al <strong>85% (4.25)</strong>, recibirá una notificación de "Hallazgos". Pasos:</p>
                        <ol className="list-decimal pl-6 space-y-2">
                          <li>Ingresar al menú <strong>"Mis Evaluaciones ISO"</strong>.</li>
                          <li>Abrir el detalle de la auditoría marcada como "En Observación" o "No Conforme".</li>
                          <li>Identificar los criterios en rojo (hallazgos).</li>
                          <li>Redactar un <strong>Compromiso de Mejora</strong> para cada uno y hacer clic en <strong>"Radicar Compromiso"</strong>.</li>
                        </ol>
                      </div>
                      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 flex gap-4">
                        <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                        <div className="text-sm italic text-muted-foreground">
                          La radicación oportuna de planes de mejora es requisito indispensable para la continuidad del vínculo comercial según la norma ISO 9001:2015.
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECTION: ADMIN MANUAL */}
          <TabsContent value="admin" className="animate-in fade-in duration-500">
            <Card className="border-t-8 border-t-primary shadow-xl">
              <CardHeader>
                <CardTitle className="text-3xl font-black uppercase text-primary">Guía para el Administrador</CardTitle>
                <CardDescription className="text-lg">Gestión de auditoría, evaluación técnica y comparador de desempeño.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-12">
                <Accordion type="single" collapsible className="w-full space-y-4">
                  <AccordionItem value="a1" className="border rounded-xl px-4 bg-muted/10">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline">1. Auditoría de Registro y Aprobación</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4 text-base leading-relaxed">
                      <div className="space-y-4">
                        <p>Cuando un proveedor bloquea su formulario, el estado cambia a <strong>En Revisión</strong>. Usted debe:</p>
                        <ol className="list-decimal pl-6 space-y-3">
                          <li><strong>Verificar Documentación:</strong> Validar que los PDFs (RUT, Cámara, etc.) sean legibles y vigentes.</li>
                          <li><strong>Asignar Criticidad:</strong> Determinar si el proveedor es <strong>Crítico</strong> (afecta la calidad del producto final) o <strong>No Crítico</strong>.</li>
                          <li><strong>Asignar Categorías:</strong> Crucial para clasificarlo en el comparador de desempeño sectorial.</li>
                          <li><strong>Aval de Calidad:</strong> Aprobar para activar la cuenta o solicitar correcciones indicando los motivos técnicos.</li>
                        </ol>
                      </div>
                      
                      <ManualImageSlot id="manual-admin-panel" alt="Panel Administrativo" />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="a2" className="border rounded-xl px-4 bg-muted/10">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline">2. Ejecución de Evaluaciones de Desempeño</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4 text-base">
                      <div className="space-y-4">
                        <p>Al realizar una auditoría, el sistema carga automáticamente la matriz de pesos basada en la criticidad asignada.</p>
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex items-start gap-3">
                          <ShieldAlert className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                          <div className="text-xs text-orange-800">
                            <strong>Trazabilidad de Compromisos:</strong> Antes de calificar, el sistema mostrará qué prometió el proveedor en la evaluación anterior. Es obligatorio verificar si el hallazgo fue subsanado.
                          </div>
                        </div>
                      </div>
                      
                      <ManualImageSlot id="manual-evaluation-modal" alt="Proceso de Evaluación" />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="a3" className="border rounded-xl px-4 bg-muted/10">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline">3. Comparador de Desempeño y Sustitución</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4 text-base leading-relaxed">
                      <div className="space-y-4">
                        <p>Utilice esta herramienta para ver el ranking de proveedores por categoría técnica.</p>
                        <ul className="list-disc pl-6 space-y-2">
                          <li><strong>Verde (&gt; 85%):</strong> Proveedor confiable.</li>
                          <li><strong>Azul (70-84%):</strong> Requiere seguimiento a planes de mejora.</li>
                          <li><strong>Rojo (&lt; 70%):</strong> Riesgo operativo. El sistema habilita el botón <strong>"Iniciar Sustitución"</strong> para abrir un nuevo proceso de selección competitivo.</li>
                        </ul>
                      </div>
                      
                      <ManualImageSlot id="manual-comparison-tool" alt="Comparador de Desempeño" />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECTION: TECHNICAL ANNEX */}
          <TabsContent value="technical" className="animate-in fade-in duration-500">
            <Card className="border-t-8 border-t-emerald-600 shadow-xl">
              <CardHeader>
                <CardTitle className="text-3xl font-black uppercase text-emerald-700">Anexo Técnico: Matrices ISO 9001:2015</CardTitle>
                <CardDescription className="text-lg">Configuración de pesos, indicadores y escala de calificación oficial.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-12">
                
                {/* PRODUCT MATRIX */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-black flex items-center gap-2 text-primary uppercase">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    1. Matriz de Desempeño: PRODUCTOS
                  </h3>
                  <div className="border rounded-xl overflow-hidden shadow-sm">
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
                            <div className="text-[10px] text-muted-foreground uppercase">Cumplimiento estricto de la referencia técnica solicitada.</div>
                          </TableCell>
                          <TableCell className="text-center font-bold bg-red-50/30">20%</TableCell>
                          <TableCell className="text-center font-bold">20%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Oportunidad y Logística (OTIF)</div>
                            <div className="text-[10px] text-muted-foreground uppercase">Entrega en fecha pactada y en las cantidades exactas.</div>
                          </TableCell>
                          <TableCell className="text-center font-bold bg-red-50/30 text-red-700">30%</TableCell>
                          <TableCell className="text-center font-bold">20%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Gestión Documental y Legal</div>
                            <div className="text-[10px] text-muted-foreground uppercase">Fichas técnicas, certificados de calidad por lote y facturación sin errores.</div>
                          </TableCell>
                          <TableCell className="text-center font-bold bg-red-50/30">10%</TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Soporte y Garantía</div>
                            <div className="text-[10px] text-muted-foreground uppercase">Agilidad en el proceso de devolución o cambio.</div>
                          </TableCell>
                          <TableCell className="text-center font-bold bg-red-50/30">20%</TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Capacidad de Emergencia</div>
                            <div className="text-[10px] text-muted-foreground uppercase">Disponibilidad de stock para pedidos urgentes de repuestos críticos.</div>
                          </TableCell>
                          <TableCell className="text-center font-bold bg-red-50/30">20%</TableCell>
                          <TableCell className="text-center font-bold text-emerald-700">30%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* SERVICES MATRIX */}
                <div className="space-y-4 pt-8">
                  <h3 className="text-2xl font-black flex items-center gap-2 text-primary uppercase">
                    <Wrench className="h-6 w-6 text-emerald-600" />
                    2. Matriz de Desempeño: SERVICIOS
                  </h3>
                  <div className="border rounded-xl overflow-hidden shadow-sm">
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
                            <div className="text-[10px] text-muted-foreground uppercase">Equipo operativo sin fallas recurrentes (30 días). Ausencia de re-trabajos.</div>
                          </TableCell>
                          <TableCell className="text-center font-bold bg-red-50/30 text-red-700">40%</TableCell>
                          <TableCell className="text-center font-bold">30%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Competencia del Personal</div>
                            <div className="text-[10px] text-muted-foreground uppercase">Idoneidad certificada (alturas, eléctrico, mecánico) y herramientas calibradas.</div>
                          </TableCell>
                          <TableCell className="text-center font-bold bg-red-50/30">20%</TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Cumplimiento SST y Normativo</div>
                            <div className="text-[10px] text-muted-foreground uppercase">Seguridad social, EPP, permisos de trabajo seguro y normas ambientales.</div>
                          </TableCell>
                          <TableCell className="text-center font-bold bg-red-50/30">15%</TableCell>
                          <TableCell className="text-center font-bold text-emerald-700">25%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Trazabilidad e Información</div>
                            <div className="text-[10px] text-muted-foreground uppercase">Entrega de informes técnicos detallados y bitácoras de mantenimiento.</div>
                          </TableCell>
                          <TableCell className="text-center font-bold bg-red-50/30">15%</TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Disponibilidad y Respuesta</div>
                            <div className="text-[10px] text-muted-foreground uppercase">Tiempo transcurrido desde el llamado hasta la presencia del técnico.</div>
                          </TableCell>
                          <TableCell className="text-center font-bold bg-red-50/30">10%</TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* DECISION SCALE */}
                <div className="space-y-4 pt-8">
                  <h3 className="text-2xl font-black flex items-center gap-2 text-primary uppercase">
                    <FileText className="h-6 w-6 text-emerald-600" />
                    3. Escala de Decisión Normativa (1.00 - 5.00)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-l-8 border-l-green-500 shadow-md">
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg">Conforme (Aprobado)</CardTitle>
                        <div className="flex gap-2 items-center">
                            <Badge className="bg-green-100 text-green-800 w-fit">{"> 85% (4.25)"}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm leading-relaxed">
                        El proveedor mantiene su estatus de <strong>Aprobado</strong>. No se requieren acciones adicionales inmediatas. El sistema envía automáticamente un correo de felicitación.
                      </CardContent>
                    </Card>
                    <Card className="border-l-8 border-l-blue-500 shadow-md">
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg">En Observación</CardTitle>
                        <div className="flex gap-2 items-center">
                            <Badge className="bg-blue-100 text-blue-800 w-fit">{"70% - 84% (3.5 - 4.2)"}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm leading-relaxed">
                        Requiere <strong>Plan de Mejora</strong> (Acción Correctiva). El proveedor debe radicar compromisos obligatorios por cada hallazgo para asegurar la continuidad comercial.
                      </CardContent>
                    </Card>
                    <Card className="border-l-8 border-l-red-500 shadow-md">
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg">No Conforme</CardTitle>
                        <div className="flex gap-2 items-center">
                            <Badge className="bg-red-100 text-red-800 w-fit">{"< 70% (3.5)"}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm leading-relaxed">
                        Apertura de <strong>No Conformidad Grave</strong>. El administrador debe evaluar la sustitución inmediata del suministrador mediante un nuevo proceso de selección competitivo.
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
