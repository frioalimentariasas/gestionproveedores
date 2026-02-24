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

// Criterios ISO 9001 para Productos - Control de Salidas (8.4.2)
export const PRODUCTOS_ISO_CRITERIA: CriterionDefinition[] = [
  { 
    id: 'quality', 
    label: 'Calidad del Producto (Cumplimiento de especificaciones y estado)', 
    weightNormal: 0.35, 
    weightCritical: 0.45 
  },
  { 
    id: 'delivery', 
    label: 'Cumplimiento en Entregas (Oportunidad y cantidades)', 
    weightNormal: 0.30, 
    weightCritical: 0.30 
  },
  { 
    id: 'service', 
    label: 'Servicio Post-venta y Soporte Técnico (Capacidad de respuesta)', 
    weightNormal: 0.20, 
    weightCritical: 0.15 
  },
  { 
    id: 'price_terms', 
    label: 'Precio y Condiciones Comerciales (Eficiencia económica)', 
    weightNormal: 0.15, 
    weightCritical: 0.10 
  },
];

// Criterios ISO 9001 para Servicios - Control de Prestación (8.4.2)
export const SERVICIOS_ISO_CRITERIA: CriterionDefinition[] = [
  { 
    id: 'compliance', 
    label: 'Cumplimiento de Requisitos (ISO 9001 / Legales / SST)', 
    weightNormal: 0.35, 
    weightCritical: 0.45 
  },
  { 
    id: 'timing', 
    label: 'Oportunidad en la Prestación (Cumplimiento de cronogramas)', 
    weightNormal: 0.30, 
    weightCritical: 0.25 
  },
  { 
    id: 'competence', 
    label: 'Competencia del Personal (Idoneidad técnica y formación)', 
    weightNormal: 0.20, 
    weightCritical: 0.20 
  },
  { 
    id: 'price_terms', 
    label: 'Precio y Políticas de Pago (Sostenibilidad)', 
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
 * ISO 9001 requiere acciones correctivas para proveedores con desempeño insatisfactorio (< 70%).
 */
export function requiresActionPlan(totalScore: number): boolean {
  return totalScore < 3.5; // Menos de 70% (3.5 de 5.0)
}

/**
 * Define el estado de desempeño basado en los umbrales de la Guía de Decisión Técnica.
 */
export function getPerformanceStatus(score: number = 0) {
  const percentage = score * 20;
  if (percentage >= 85) {
    return {
      label: 'Sobresaliente',
      color: 'bg-green-100 text-green-800 border-green-200',
      isSuccess: true,
    };
  } else if (percentage >= 70) {
    return {
      label: 'Satisfactorio',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      isSuccess: false,
    };
  } else if (percentage >= 60) {
    return {
      label: 'En Observación',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      isSuccess: false,
    };
  } else {
    return {
      label: 'Crítico',
      color: 'bg-red-100 text-red-800 border-red-200',
      isSuccess: false,
    };
  }
}
