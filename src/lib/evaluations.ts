
export const EVALUATION_CRITERIA = {
  provider_performance: [
    { id: 'price', label: 'Precio', weight: 0.10 },
    { id: 'creditPolicies', label: 'Políticas de crédito y descuento', weight: 0.10 },
    { id: 'deliveryTime', label: 'Tiempo de entrega del producto', weight: 0.20 },
    { id: 'warrantyPolicies', label: 'Políticas de garantía', weight: 0.10 },
    { id: 'customerService', label: 'Atención al cliente', weight: 0.10 },
    { id: 'responsiveness', label: 'Capacidad de respuesta a los requerimientos', weight: 0.20 },
    { id: 'availability', label: 'Disponibilidad de los productos o servicios', weight: 0.20 },
  ],
  contractor_evaluation: [
    { id: 'experience', label: 'Experiencia en la prestación del servicio', weight: 0.20 },
    { id: 'price', label: 'Precio', weight: 0.15 },
    { id: 'paymentPolicies', label: 'Políticas de pago', weight: 0.15 },
    { id: 'responsiveness', label: 'Capacidad para los atender requerimientos', weight: 0.20 },
    { id: 'availability', label: 'Disponibilidad de los servicios que presta', weight: 0.20 },
    { id: 'customerService', label: 'Atención al cliente', weight: 0.10 },
  ],
};

export type EvaluationType = keyof typeof EVALUATION_CRITERIA;

export const EVALUATION_TYPE_NAMES: { [key in EvaluationType]: string } = {
  provider_performance: 'Evaluación de Desempeño de Proveedor',
  contractor_evaluation: 'Evaluación y Selección de Contratista',
};
