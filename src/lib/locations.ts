interface City {
  name: string;
}

interface Department {
  name: string;
  cities: City[];
}

interface Country {
  name: string;
  departments: Department[];
}

export const locations: Country[] = [
  {
    name: 'Colombia',
    departments: [
      {
        name: 'Antioquia',
        cities: [{ name: 'Medellín' }, { name: 'Envigado' }, { name: 'Itagüí' }],
      },
      {
        name: 'Cundinamarca',
        cities: [{ name: 'Bogotá' }, { name: 'Soacha' }, { name: 'Zipaquirá' }],
      },
      {
        name: 'Valle del Cauca',
        cities: [{ name: 'Cali' }, { name: 'Buenaventura' }, { name: 'Palmira' }],
      },
    ],
  },
  {
    name: 'United States',
    departments: [
        {
            name: 'California',
            cities: [{ name: 'Los Angeles' }, { name: 'San Francisco' }, { name: 'San Diego' }],
        },
        {
            name: 'Florida',
            cities: [{ name: 'Miami' }, { name: 'Orlando' }, { name: 'Tampa' }],
        },
    ]
  }
];
