'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, ShieldCheck, Users, Settings, ClipboardCheck, BarChart3, Info, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ManualPage() {
  const images = PlaceHolderImages;

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
            Guía maestra para la gestión de proveedores, selección competitiva y evaluación de desempeño bajo el estándar ISO 9001:2015 de Frioalimentaria SAS.
          </p>
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
                <CardDescription className="text-lg">Instrucciones paso a paso para el registro, actualización y radicación de compromisos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-12">
                <Accordion type="single" collapsible className="w-full space-y-4">
                  <AccordionItem value="p1" className="border rounded-xl px-4 bg-muted/10">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline">1. Registro Inicial y Plazo de Ley</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4">
                      <p className="text-base leading-relaxed">
                        Todo proveedor nuevo debe registrarse con su <strong>NIT (sin dígito de verificación)</strong>. Al crear la cuenta, el sistema otorga automáticamente un plazo de <strong>8 días calendario</strong> para completar el perfil.
                      </p>
                      <div className="rounded-lg overflow-hidden border-4 border-white shadow-lg">
                        <Image src={images.find(i => i.id === 'manual-login')?.imageUrl || 'https://picsum.photos/seed/manual1/800/400'} alt="Login" width={800} height={400} data-ai-hint="login screen" className="w-full" />
                      </div>
                      <Alert className="bg-orange-50 border-orange-200">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <AlertDescription className="text-orange-800 font-medium">
                          Si no completa el formulario en 8 días, su cuenta será bloqueada. Deberá enviar una justificación técnica a través del portal para que un administrador habilite una extensión de tiempo.
                        </AlertDescription>
                      </Alert>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="p2" className="border rounded-xl px-4 bg-muted/10">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline">2. Diligenciamiento del Formulario FA-GFC-F04</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4">
                      <p className="text-base leading-relaxed">
                        El formulario se divide en 8 secciones obligatorias. El proveedor debe adjuntar documentos en PDF no mayores a 5MB:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-base text-muted-foreground">
                        <li><strong>RUT:</strong> Actualizado al año en curso.</li>
                        <li><strong>Cámara de Comercio:</strong> Con vigencia no superior a 30 días.</li>
                        <li><strong>Certificación Bancaria:</strong> Para el proceso de pagos electrónicos.</li>
                        <li><strong>HSEQ:</strong> Certificado de autoevaluación 0312 expedido por ARL.</li>
                      </ul>
                      <div className="rounded-lg overflow-hidden border-4 border-white shadow-lg">
                        <Image src={images.find(i => i.id === 'manual-form')?.imageUrl || 'https://picsum.photos/seed/manual2/800/400'} alt="Form" width={800} height={400} data-ai-hint="business form" className="w-full" />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="p3" className="border rounded-xl px-4 bg-muted/10">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline">3. Radicación de Compromisos de Mejora</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4">
                      <p className="text-base leading-relaxed">
                        Cuando un proveedor obtiene una calificación inferior al <strong>85% (4.25)</strong>, el sistema le notificará por correo. El proveedor debe entrar a <strong>&quot;Mis Evaluaciones ISO&quot;</strong> y radicar un compromiso técnico por cada hallazgo detectado por el auditor.
                      </p>
                      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 flex gap-4">
                        <Info className="h-6 w-6 text-primary shrink-0" />
                        <p className="text-sm italic text-muted-foreground">
                          &quot;La radicación del plan de mejora es un requisito obligatorio para asegurar la continuidad comercial con Frioalimentaria SAS.&quot;
                        </p>
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
                <CardDescription className="text-lg">Gestión del ciclo de vida del proveedor y auditorías técnicas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-12">
                <Accordion type="single" collapsible className="w-full space-y-4">
                  <AccordionItem value="a1" className="border rounded-xl px-4 bg-muted/10">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline">1. Auditoría de Registro y Activación</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4">
                      <p className="text-base">
                        Cuando un proveedor completa su registro, el estado cambia a <Badge variant="outline" className="bg-blue-100 text-blue-700">En Revisión</Badge>. El administrador debe:
                      </p>
                      <ol className="list-decimal pl-6 space-y-3 text-base">
                        <li>Ingresar a <strong>Gestión de Proveedores &gt; Gestionar</strong>.</li>
                        <li>Revisar los documentos adjuntos y la información tributaria.</li>
                        <li><strong>Asignar Categorías Operativas:</strong> Crucial para que el proveedor aparezca en el comparador de desempeño.</li>
                        <li><strong>Asignar Nivel de Criticidad:</strong> Determine si es <Badge variant="destructive">Crítico</Badge> o <Badge variant="outline">No Crítico</Badge>.</li>
                        <li>Aprobar o solicitar correcciones indicando los motivos específicos.</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="a2" className="border rounded-xl px-4 bg-muted/10">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline">2. Ejecución de Evaluaciones de Desempeño</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4">
                      <p className="text-base">
                        Al realizar una nueva evaluación, el sistema carga automáticamente la matriz de pesos parametrizada.
                      </p>
                      <div className="rounded-lg overflow-hidden border-4 border-white shadow-lg">
                        <Image src={images.find(i => i.id === 'manual-admin-eval')?.imageUrl || 'https://picsum.photos/seed/manual3/800/400'} alt="Eval" width={800} height={400} data-ai-hint="audit evaluation" className="w-full" />
                      </div>
                      <Alert className="bg-primary/5 border-primary">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                        <AlertTitle className="font-bold">Trazabilidad de Compromisos</AlertTitle>
                        <AlertDescription className="text-sm">
                          El sistema mostrará en pantalla qué prometió el proveedor en la evaluación anterior. El administrador debe validar el cumplimiento antes de asignar el nuevo puntaje.
                        </AlertDescription>
                      </Alert>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="a3" className="border rounded-xl px-4 bg-muted/10">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline">3. Comparador de Desempeño y Sustitución</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4">
                      <p className="text-base">
                        Utilice el <strong>Comparador de Desempeño</strong> para analizar el cumplimiento ISO 9001 de todos los proveedores en una categoría específica.
                      </p>
                      <div className="rounded-lg overflow-hidden border-4 border-white shadow-lg">
                        <Image src={images.find(i => i.id === 'manual-comparison')?.imageUrl || 'https://picsum.photos/seed/manual4/800/400'} alt="Compare" width={800} height={400} data-ai-hint="data analysis" className="w-full" />
                      </div>
                      <p className="text-base">
                        Si un proveedor reincide en fallas o mantiene un estado de <Badge variant="destructive">No Conforme</Badge>, el administrador puede iniciar un <strong>Nuevo Proceso de Selección</strong> directamente desde allí como acción correctiva de sustitución.
                      </p>
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
                <CardTitle className="text-3xl font-black uppercase text-emerald-700">Anexo Técnico: Matrices ISO 9001</CardTitle>
                <CardDescription className="text-lg">Estructura de ponderación y criterios de decisión técnica.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-12">
                
                {/* PRODUCT MATRIX */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-black flex items-center gap-2 text-primary uppercase">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    1. Matriz de Desempeño: PRODUCTOS
                  </h3>
                  <div className="border rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted">
                        <TableRow>
                          <TableHead className="w-1/2 font-black uppercase">Criterio / Indicador</TableHead>
                          <TableHead className="text-center font-black uppercase">Peso Crítico</TableHead>
                          <TableHead className="text-center font-black uppercase">Peso No Crítico</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Conformidad Técnica: Referencia técnica solicitada</TableCell>
                          <TableCell className="text-center font-bold">20%</TableCell>
                          <TableCell className="text-center font-bold">20%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Oportunidad y Logística: OTIF (On Time In Full)</TableCell>
                          <TableCell className="text-center font-bold text-emerald-700">30%</TableCell>
                          <TableCell className="text-center font-bold">20%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Gestión Documental: Fichas, certificados y facturación</TableCell>
                          <TableCell className="text-center font-bold">10%</TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Soporte y Garantía: Agilidad en cambios</TableCell>
                          <TableCell className="text-center font-bold">20%</TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Capacidad de Emergencia: Stock pedidos urgentes</TableCell>
                          <TableCell className="text-center font-bold">20%</TableCell>
                          <TableCell className="text-center font-bold text-emerald-700">30%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* SERVICES MATRIX */}
                <div className="space-y-4 pt-8">
                  <h3 className="text-2xl font-black flex items-center gap-2 text-primary uppercase">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    2. Matriz de Desempeño: SERVICIOS
                  </h3>
                  <div className="border rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted">
                        <TableRow>
                          <TableHead className="w-1/2 font-black uppercase">Criterio / Indicador</TableHead>
                          <TableHead className="text-center font-black uppercase">Peso Crítico</TableHead>
                          <TableHead className="text-center font-black uppercase">Peso No Crítico</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Eficacia de la Prestación: Funcionamiento 30 días s/fallas</TableCell>
                          <TableCell className="text-center font-bold text-emerald-700">40%</TableCell>
                          <TableCell className="text-center font-bold">30%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Competencia Personal: Certificaciones e idoneidad</TableCell>
                          <TableCell className="text-center font-bold">20%</TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Cumplimiento SST y Normativo: Planillas, EPP y permisos</TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                          <TableCell className="text-center font-bold text-emerald-700">25%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Trazabilidad e Información: Informes y bitácoras</TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Disponibilidad y Respuesta: Tiempo llegada emergencia</TableCell>
                          <TableCell className="text-center font-bold">10%</TableCell>
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
                    3. Guía de Decisión Técnica
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-l-8 border-l-green-500">
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg">Conforme</CardTitle>
                        <Badge className="bg-green-100 text-green-800 w-fit">{"> 85%"}</Badge>
                      </CardHeader>
                      <CardContent className="text-sm">
                        El proveedor mantiene su estatus de <strong>Aprobado</strong>. No se requieren acciones adicionales inmediatas.
                      </CardContent>
                    </Card>
                    <Card className="border-l-8 border-l-blue-500">
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg">En Observación</CardTitle>
                        <Badge className="bg-blue-100 text-blue-800 w-fit">{"70% - 84%"}</Badge>
                      </CardHeader>
                      <CardContent className="text-sm">
                        Requiere <strong>Plan de Mejora</strong>. El proveedor debe radicar compromisos en los criterios deficientes para asegurar continuidad.
                      </CardContent>
                    </Card>
                    <Card className="border-l-8 border-l-red-500">
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg">No Conforme</CardTitle>
                        <Badge className="bg-red-100 text-red-800 w-fit">{"< 70%"}</Badge>
                      </CardHeader>
                      <CardContent className="text-sm">
                        Apertura de <strong>No Conformidad</strong>. Se debe evaluar la sustitución inmediata del proveedor mediante un nuevo proceso de selección.
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
          <p className="mt-1 font-bold">Documento FA-GFC-M01 | Versión 1.0</p>
        </div>
      </div>
    </AuthGuard>
  );
}
