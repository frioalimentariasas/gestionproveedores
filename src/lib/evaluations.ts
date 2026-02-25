/**
 * @fileOverview Definiciones de criterios de evaluación alineados con ISO 9001:2015.
 * Basado en el control de proveedores (Sección 8.4) que exige evaluar calidad, entrega y capacidad técnica.
 */

export type CategoryType = 'Productos' | 'Servicios';

export interface CriterionDefinition {
  id: string;
  label: string;
  weightNormal: number;   // Peso estándar para proveedores No Críticos
  weightCritical: number; // Peso reforzado para proveedores Críticos
}

// Criterios ISO 9001 para PRODUCTOS
export const PRODUCTOS_ISO_CRITERIA: CriterionDefinition[] = [
  { 
    id: 'tech_conformity', 
    label: 'Conformidad Técnica: Cumplimiento estricto de la referencia técnica solicitada', 
    weightNormal: 0.20, 
    weightCritical: 0.20 
  },
  { 
    id: 'otif', 
    label: 'Oportunidad y Logística: OTIF (On Time In Full): Entrega en la fecha pactada y en las cantidades exactas', 
    weightNormal: 0.20, 
    weightCritical: 0.30 
  },
  { 
    id: 'doc_management', 
    label: 'Gestión Documental y Legal: Fichas técnicas, certificados de calidad/garantía por lote y facturación sin errores. Cumplimiento legal.', 
    weightNormal: 0.15, 
    weightCritical: 0.10 
  },
  { 
    id: 'support_warranty', 
    label: 'Soporte y Garantía: Agilidad en el proceso de devolución o cambio', 
    weightNormal: 0.15, 
    weightCritical: 0.20 
  },
  { 
    id: 'emergency_capacity', 
    label: 'Capacidad de Emergencia: Disponibilidad de stock para pedidos urgentes de repuestos críticos que afectan la operación', 
    weightNormal: 0.30, 
    weightCritical: 0.20 
  },
];

// Criterios ISO 9001 para SERVICIOS
export const SERVICIOS_ISO_CRITERIA: CriterionDefinition[] = [
  { 
    id: 'efficacy', 
    label: 'Eficacia de la Prestación: Equipo operativo sin fallas recurrentes (30 días). Ausencia de re-trabajos.', 
    weightNormal: 0.30, 
    weightCritical: 0.40 
  },
  { 
    id: 'staff_competence', 
    label: 'Competencia del Personal: Idoneidad (alturas, eléctrico, mecánico). Uso de herramientas adecuadas y calibradas.', 
    weightNormal: 0.15, 
    weightCritical: 0.20 
  },
  { 
    id: 'hseq_compliance', 
    label: 'Cumplimiento SST y Normativo: Planillas de seguridad social, uso de EPP, permisos de trabajo seguro y normas ambientales.', 
    weightNormal: 0.25, 
    weightCritical: 0.15 
  },
  { 
    id: 'traceability', 
    label: 'Trazabilidad e Información: Entrega de informes técnicos detallados, bitácoras de mantenimiento y certificados.', 
    weightNormal: 0.15, 
    weightCritical: 0.15 
  },
  { 
    id: 'response_time', 
    label: 'Disponibilidad y Respuesta: Tiempo transcurrido desde el llamado de emergencia hasta la presencia del técnico.', 
    weightNormal: 0.15, 
    weightCritical: 0.10 
  },
];

export const CRITERIA_BY_TYPE: Record<CategoryType, CriterionDefinition[]> = {
  'Productos': PRODUCTOS_ISO_CRITERIA,
  'Servicios': SERVICIOS_ISO_CRITERIA,
};

export const EVALUATION_TYPES = {
  'Productos': 'Evaluación de Desempeño ISO 9001 - Productos',
  'Servicios': 'Evaluación de Desempeño ISO 9001 - Servicios',
};

/**
 * Obtiene los criterios según el tipo y opcionalmente ajustados por criticidad.
 */
export function getCriteriaForType(type: CategoryType, isCritical: boolean = false) {
  const definitions = CRITERIA_BY_TYPE[type] || [];
  return definitions.map(d => ({
    id: d.id,
    label: d.label,
    defaultWeight: isCritical ? d.weightCritical : d.weightNormal
  }));
}

/**
 * Determina si una evaluación requiere plan de acción según el puntaje total (Escala 1-5).
 * ISO 9001: Puntajes inferiores a 85% requieren acciones correctivas o compromisos.
 */
export function requiresActionPlan(totalScore: number): boolean {
  return totalScore < 4.25; // Menos de 85% (4.25 de 5.0)
}

/**
 * Define el estado de desempeño basado en los umbrales de la Guía de Decisión Técnica de Frioalimentaria.
 */
export function getPerformanceStatus(score: number = 0) {
  const percentage = score * 20;
  if (percentage >= 85) {
    return {
      label: 'Conforme (Aprobado)',
      color: 'bg-green-100 text-green-800 border-green-200',
      isSuccess: true,
    };
  } else if (percentage >= 70) {
    return {
      label: 'En Observación (Plan de Mejora)',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      isSuccess: false,
    };
  } else {
    return {
      label: 'No Conforme (No Conformidad)',
      color: 'bg-red-100 text-red-800 border-red-200',
      isSuccess: false,
    };
  }
}
