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

// Criterios ISO 9001 para Productos
export const PRODUCTOS_ISO_CRITERIA: CriterionDefinition[] = [
  { 
    id: 'quality', 
    label: 'Calidad del Producto (Especificaciones técnicas y estado)', 
    weightNormal: 0.35, 
    weightCritical: 0.45 
  },
  { 
    id: 'delivery', 
    label: 'Cumplimiento en Entregas (Tiempos y cantidades)', 
    weightNormal: 0.30, 
    weightCritical: 0.30 
  },
  { 
    id: 'service', 
    label: 'Servicio Post-venta y Soporte Técnico', 
    weightNormal: 0.20, 
    weightCritical: 0.15 
  },
  { 
    id: 'price_terms', 
    label: 'Precio y Condiciones Comerciales', 
    weightNormal: 0.15, 
    weightCritical: 0.10 
  },
];

// Criterios ISO 9001 para Servicios
export const SERVICIOS_ISO_CRITERIA: CriterionDefinition[] = [
  { 
    id: 'compliance', 
    label: 'Cumplimiento de Requisitos (ISO 9001 / Legales)', 
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
    label: 'Competencia del Personal / Idoneidad técnica', 
    weightNormal: 0.20, 
    weightCritical: 0.20 
  },
  { 
    id: 'price_terms', 
    label: 'Precio y Políticas de Pago', 
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
 * ISO 9001 requiere acciones correctivas para proveedores con desempeño insatisfactorio.
 */
export function requiresActionPlan(totalScore: number): boolean {
  return totalScore < 3.5; // Menos de 70% (3.5 de 5.0)
}
