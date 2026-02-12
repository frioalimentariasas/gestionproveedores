

// Define all possible criteria with their default weights for Bienes
export const BIENES_CRITERIA_DEFINITIONS = {
  price: { id: 'price', label: 'Precio', defaultWeight: 0.10 },
  creditPolicies: { id: 'creditPolicies', label: 'Políticas de crédito y descuento', defaultWeight: 0.10 },
  deliveryTime: { id: 'deliveryTime', label: 'Tiempo de entrega del producto', defaultWeight: 0.20 },
  warrantyPolicies: { id: 'warrantyPolicies', label: 'Políticas de garantía', defaultWeight: 0.10 },
  customerService: { id: 'customerService', label: 'Atención al cliente', defaultWeight: 0.10 },
  responsiveness: { id: 'responsiveness', label: 'Capacidad de respuesta a los requerimientos', defaultWeight: 0.20 },
  availability: { id: 'availability', label: 'Disponibilidad de los productos o servicios', defaultWeight: 0.20 },
};

// Define all possible criteria with their default weights for Servicios
export const SERVICIOS_CRITERIA_DEFINITIONS = {
  experience: { id: 'experience', label: 'Experiencia en la prestación del servicio', defaultWeight: 0.20 },
  price: { id: 'price', label: 'Precio', defaultWeight: 0.15 },
  paymentPolicies: { id: 'paymentPolicies', label: 'Políticas de pago', defaultWeight: 0.15 },
  responsiveness: { id: 'responsiveness', label: 'Capacidad para los atender requerimientos', defaultWeight: 0.20 },
  availability: { id: 'availability', label: 'Disponibilidad de los servicios que presta', defaultWeight: 0.20 },
  customerService: { id: 'customerService', label: 'Atención al cliente', defaultWeight: 0.10 },
};

// Define which criteria apply to which type
export const CRITERIA_BY_TYPE = {
  'Bienes': Object.values(BIENES_CRITERIA_DEFINITIONS),
  'Servicios (Contratista)': Object.values(SERVICIOS_CRITERIA_DEFINITIONS),
};

export const EVALUATION_TYPES = {
  'Bienes': 'Evaluación de Desempeño de Proveedor de Bienes',
  'Servicios (Contratista)': 'Evaluación de Desempeño de Contratista',
};

export type CategoryType = keyof typeof CRITERIA_BY_TYPE;
export type Criterion = { id: string; label: string; defaultWeight: number };

// Helper function to get the criteria definitions for a given category type
export function getCriteriaForType(type: CategoryType): Criterion[] {
  return CRITERIA_BY_TYPE[type] || [];
}
