
// Define all possible criteria with their default weights for Productos
export const PRODUCTOS_CRITERIA_DEFINITIONS = {
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

// Define which criteria apply to which sector
export const CRITERIA_BY_TYPE = {
  'Productos': Object.values(PRODUCTOS_CRITERIA_DEFINITIONS),
  'Servicios': Object.values(SERVICIOS_CRITERIA_DEFINITIONS),
};

export const EVALUATION_TYPES = {
  'Productos': 'Evaluación de Desempeño de Proveedor de Productos',
  'Servicios': 'Evaluación de Desempeño de Contratista de Servicios',
};

export type CategoryType = keyof typeof CRITERIA_BY_TYPE;
export type Criterion = { id: string; label: string; defaultWeight: number };

// Helper function to get the criteria definitions for a given sector
export function getCriteriaForType(type: CategoryType): Criterion[] {
  return CRITERIA_BY_TYPE[type] || [];
}
