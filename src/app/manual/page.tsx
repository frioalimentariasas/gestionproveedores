
'use client';

import AuthGuard from '@/components/auth/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, ShieldCheck, Users, Settings, ClipboardCheck, BarChart3, Info, AlertTriangle, CheckCircle2, FileText, Gavel, Wrench, ShieldAlert } from 'lucide-react';
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
            Documento FA-GFC-M01: Guía integral para la gestión de proveedores bajo el estándar ISO 9001:2015 en Frioalimentaria SAS.
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
                <CardDescription className="text-lg">Proceso de registro, actualización y cumplimiento de compromisos de mejora.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-12">
                <Accordion type="single" collapsible className="w-full space-y-4">
                  <AccordionItem value="p1" className="border rounded-xl px-4 bg-muted/10">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline">1. Registro Inicial y Control de Plazo (8 Días)</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4 text-base leading-relaxed">
                      <div>
                        Todo proveedor nuevo o invitado debe registrarse utilizando su <strong>NIT (sin dígito de verificación)</strong>. Al crear la cuenta, el sistema inicia un contador de <strong>8 días calendario</strong>.
                      </div>
                      <div className="rounded-lg overflow-hidden border-4 border-white shadow-lg">
                        <Image src={images.find(i => i.id === 'manual-login')?.imageUrl || 'https://picsum.photos/seed/manual1/800/400'} alt="Login" width={800} height={400} data-ai-hint="login screen" className="w-full" />
                      </div>
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
                      <div>
                        El formulario se compone de 8 secciones críticas. Es obligatorio adjuntar los siguientes documentos en formato <strong>PDF (máx. 5MB)</strong>:
                      </div>
                      <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                        <li><strong>RUT:</strong> Documento actualizado al año vigente.</li>
                        <li><strong>Cámara de Comercio:</strong> Con fecha de expedición no mayor a 30 días (solo Jurídicas).</li>
                        <li><strong>Certificación Bancaria:</strong> No mayor a 90 días para el proceso de pagos.</li>
                        <li><strong>Certificado HSEQ 0312:</strong> Expedido por ARL o Ministerio del Trabajo.</li>
                      </ul>
                      <div className="rounded-lg overflow-hidden border-4 border-white shadow-lg">
                        <Image src={images.find(i => i.id === 'manual-form-sections')?.imageUrl || 'https://picsum.photos/seed/manual2/800/400'} alt="Form" width={800} height={400} data-ai-hint="business form" className="w-full" />
                      </div>
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm italic">
                        <strong>Nota SARLAFT:</strong> Al aceptar el checkbox final, el sistema genera dinámicamente una declaración juramentada con su nombre y documento, la cual tiene plena validez legal ante Frioalimentaria SAS.
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="p3" className="border rounded-xl px-4 bg-muted/10">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline">3. Radicación de Compromisos ISO 9001</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4 text-base leading-relaxed">
                      <div>
                        Si su puntaje en una evaluación es inferior al <strong>85% (4.25)</strong>, recibirá una notificación de "Hallazgos". Deberá:
                      </div>
                      <ol className="list-decimal pl-6 space-y-2">
                        <li>Ingresar a <strong>"Mis Evaluaciones ISO"</strong>.</li>
                        <li>Abrir el detalle de la auditoría marcada en rojo o azul.</li>
                        <li>Radicar un <strong>Compromiso de Mejora</strong> por cada criterio calificado con bajo desempeño.</li>
                      </ol>
                      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 flex gap-4">
                        <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                        <div className="text-sm italic text-muted-foreground">
                          La radicación oportuna de planes de acción es requisito indispensable para la continuidad del vínculo comercial.
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
                    <AccordionContent className="space-y-6 pt-4 text-base">
                      <div>
                        Cuando un proveedor bloquea su formulario, el estado cambia a <Badge variant="outline" className="bg-blue-100 text-blue-700">En Revisión</Badge>. Pasos de aprobación:
                      </div>
                      <ol className="list-decimal pl-6 space-y-3">
                        <li><strong>Verificar Documentación:</strong> Validar que los PDFs coincidan con los datos digitados.</li>
                        <li><strong>Asignar Criticidad:</strong> Clasificar como <Badge variant="destructive">Crítico</Badge> si impacta directamente la calidad del producto final, o <Badge variant="outline">No Crítico</Badge> para insumos de soporte.</li>
                        <li><strong>Asignar Categorías:</strong> Crucial para que el proveedor aparezca en los comparadores de desempeño sectoriales.</li>
                        <li><strong>Aprobación:</strong> Si todo es conforme, dar el aval para activar al proveedor. Si no, solicitar correcciones indicando los motivos.</li>
                      </ol>
                      <div className="rounded-lg overflow-hidden border-4 border-white shadow-lg">
                        <Image src={images.find(i => i.id === 'manual-admin-panel')?.imageUrl || 'https://picsum.photos/seed/manual3/800/400'} alt="Admin" width={800} height={400} data-ai-hint="audit management" className="w-full" />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="a2" className="border rounded-xl px-4 bg-muted/10">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline">2. Ejecución de Evaluaciones de Desempeño</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4 text-base">
                      <div>
                        Al realizar una nueva auditoría, el sistema cargará automáticamente la matriz de pesos (Crítico vs No Crítico) configurada.
                      </div>
                      <div className="rounded-lg overflow-hidden border-4 border-white shadow-lg">
                        <Image src={images.find(i => i.id === 'manual-evaluation-modal')?.imageUrl || 'https://picsum.photos/seed/manual4/800/400'} alt="Eval" width={800} height={400} data-ai-hint="evaluation form" className="w-full" />
                      </div>
                      <Alert className="bg-primary/5 border-primary">
                        <ShieldAlert className="h-5 w-5 text-primary" />
                        <AlertTitle className="font-bold">Seguimiento de Compromisos</AlertTitle>
                        <AlertDescription className="text-sm">
                          <strong>Trazabilidad:</strong> El sistema mostrará en pantalla qué prometió el proveedor en la evaluación previa. Es obligatorio validar si el hallazgo fue subsanado antes de asignar la nueva calificación.
                        </AlertDescription>
                      </Alert>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="a3" className="border rounded-xl px-4 bg-muted/10">
                    <AccordionTrigger className="text-xl font-bold hover:no-underline">3. Herramienta de Comparación y Ranking</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4 text-base leading-relaxed">
                      <div>
                        Utilice el <strong>Comparador de Desempeño</strong> para analizar la solvencia técnica de todos los proveedores de una misma categoría.
                      </div>
                      <div className="rounded-lg overflow-hidden border-4 border-white shadow-lg">
                        <Image src={images.find(i => i.id === 'manual-comparison-tool')?.imageUrl || 'https://picsum.photos/seed/manual5/800/400'} alt="Compare" width={800} height={400} data-ai-hint="data analysis" className="w-full" />
                      </div>
                      <div className="bg-muted p-4 rounded-lg border flex items-center gap-4">
                        <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
                        <div className="text-sm">
                          <strong>Acción Correctiva:</strong> Si un proveedor reincide en fallas o mantiene un estado <Badge variant="destructive">No Conforme (&lt; 70%)</Badge>, podrá iniciar un <strong>Nuevo Proceso de Selección</strong> directamente desde esta vista para sustituir al suministrador.
                        </div>
                      </div>
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
                <CardDescription className="text-lg">Configuración de pesos, indicadores y escala de calificación de Frioalimentaria SAS.</CardDescription>
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
                          <TableCell>
                            <div className="font-bold">Conformidad Técnica</div>
                            <div className="text-[10px] text-muted-foreground">Cumplimiento estricto de la referencia técnica solicitada.</div>
                          </TableCell>
                          <TableCell className="text-center font-bold">20%</TableCell>
                          <TableCell className="text-center font-bold">20%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Oportunidad y Logística (OTIF)</div>
                            <div className="text-[10px] text-muted-foreground">Entrega en fecha pactada y cantidades exactas.</div>
                          </TableCell>
                          <TableCell className="text-center font-bold text-emerald-700">30%</TableCell>
                          <TableCell className="text-center font-bold">20%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Gestión Documental y Legal</div>
                            <div className="text-[10px] text-muted-foreground">Fichas técnicas, certificados de calidad y facturación sin errores.</div>
                          </TableCell>
                          <TableCell className="text-center font-bold">10%</TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Soporte y Garantía</div>
                            <div className="text-[10px] text-muted-foreground">Agilidad en el proceso de devolución o cambio.</div>
                          </TableCell>
                          <TableCell className="text-center font-bold">20%</TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Capacidad de Emergencia</div>
                            <div className="text-[10px] text-muted-foreground">Disponibilidad de stock para pedidos urgentes.</div>
                          </TableCell>
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
                          <TableCell>
                            <div className="font-bold">Eficacia de la Prestación</div>
                            <div className="text-[10px] text-muted-foreground">Equipo operativo sin fallas recurrentes (30 días). Ausencia de re-trabajos.</div>
                          </TableCell>
                          <TableCell className="text-center font-bold text-emerald-700">40%</TableCell>
                          <TableCell className="text-center font-bold">30%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Competencia del Personal</div>
                            <div className="text-[10px] text-muted-foreground">Idoneidad certificada (alturas, eléctrico, mecánico) y herramientas calibradas.</div>
                          </TableCell>
                          <TableCell className="text-center font-bold">20%</TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Cumplimiento SST y Normativo</div>
                            <div className="text-[10px] text-muted-foreground">Seguridad social, EPP, permisos de trabajo y normas ambientales.</div>
                          </TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                          <TableCell className="text-center font-bold text-emerald-700">25%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Trazabilidad e Información</div>
                            <div className="text-[10px] text-muted-foreground">Informes técnicos detallados y bitácoras de mantenimiento.</div>
                          </TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                          <TableCell className="text-center font-bold">15%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold">Disponibilidad y Respuesta</div>
                            <div className="text-[10px] text-muted-foreground">Tiempo de llegada desde el llamado de emergencia.</div>
                          </TableCell>
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
                    3. Escala de Decisión Normativa
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-l-8 border-l-green-500">
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg">Conforme (Aprobado)</CardTitle>
                        <div className="flex gap-2 items-center">
                            <Badge className="bg-green-100 text-green-800 w-fit">{"> 85%"}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm">
                        El proveedor mantiene su estatus de **Aprobado**. No se requieren acciones adicionales inmediatas. Se envía correo de felicitación.
                      </CardContent>
                    </Card>
                    <Card className="border-l-8 border-l-blue-500">
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg">En Observación</CardTitle>
                        <div className="flex gap-2 items-center">
                            <Badge className="bg-blue-100 text-blue-800 w-fit">{"70% - 84%"}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm">
                        Requiere **Plan de Mejora** (Acción Correctiva). El proveedor debe radicar compromisos obligatorios para asegurar continuidad comercial.
                      </CardContent>
                    </Card>
                    <Card className="border-l-8 border-l-red-500">
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg">No Conforme</CardTitle>
                        <div className="flex gap-2 items-center">
                            <Badge className="bg-red-100 text-red-800 w-fit">{"< 70%"}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm">
                        Apertura de **No Conformidad**. Se debe evaluar la sustitución inmediata del proveedor mediante un nuevo proceso de selección.
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
