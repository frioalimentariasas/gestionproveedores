
export const EVALUATION_CRITERIA = {
  provider_selection: [
    { id: 'quality', label: 'Calidad del producto', weight: 0.20 },
    { id: 'price', label: 'Precio', weight: 0.15 },
    { id: 'deliveryTime', label: 'Tiempo de entrega', weight: 0.20 },
    { id: 'paymentConditions', label: 'Condiciones de pago', weight: 0.15 },
    { id: 'reputation', label: 'Reputación/referencias', weight: 0.20 },
    { id: 'afterSalesService', label: 'Soporte y servicio Post venta', weight: 0.10 },
  ],
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
  provider_selection: 'Evaluación de Selección de Proveedor',
  provider_performance: 'Evaluación de Desempeño de Proveedor',
  contractor_evaluation: 'Evaluación y Selección de Contratista',
};
