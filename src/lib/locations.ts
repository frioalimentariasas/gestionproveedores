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
        {
            name: 'New York',
            cities: [{ name: 'New York City' }, { name: 'Buffalo' }, { name: 'Rochester' }],
        },
        {
            name: 'Texas',
            cities: [{ name: 'Houston' }, { name: 'Dallas' }, { name: 'Austin' }],
        },
    ]
  },
    {
      name: 'Mexico',
      departments: [
          {
              name: 'Jalisco',
              cities: [{ name: 'Guadalajara' }],
          },
          {
              name: 'Nuevo León',
              cities: [{ name: 'Monterrey' }],
          },
          {
              name: 'Ciudad de México',
              cities: [{ name: 'Ciudad de México' }],
          }
      ]
  },
  {
      name: 'Spain',
      departments: [
          {
              name: 'Comunidad de Madrid',
              cities: [{ name: 'Madrid' }],
          },
          {
              name: 'Cataluña',
              cities: [{ name: 'Barcelona' }],
          },
          {
              name: 'Andalucía',
              cities: [{ name: 'Sevilla' }, { name: 'Málaga' }],
          }
      ]
  },
    {
      name: 'Argentina',
      departments: [
          {
              name: 'Buenos Aires',
              cities: [{ name: 'La Plata' }],
          },
          {
              name: 'Ciudad Autónoma de Buenos Aires',
              cities: [{ name: 'Buenos Aires' }],
          },
          {
              name: 'Córdoba',
              cities: [{ name: 'Córdoba' }],
          }
      ]
  }
];
