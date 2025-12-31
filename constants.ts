
import { CatalogState, Season } from './types';

export const INITIAL_STATE: CatalogState = {
  season: Season.WINTER,
  whatsapp: '51999888777',
  wsText: 'Pedir por WhatsApp',
  wsColor: '#25D366',
  logo: 'https://cdn-icons-png.flaticon.com/512/6103/6103079.png',
  title: 'MI CATÁLOGO PRO',
  subtitle: 'Calidad y exclusividad en cada detalle',
  winter: [
    {
      id: 'w1',
      name: "EDREDONES",
      icon: "https://cdn-icons-png.flaticon.com/512/2917/2917242.png",
      products: [
        { id: 'p1', name: "Edredón Premium King", description: "Máxima suavidad y confort para noches perfectas", basePrice: 250, hasDiscount: true, discountValue: 15, thumb: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=500&fit=crop" },
        { id: 'p2', name: "Edredón Nórdico", description: "Ideal para clima frío, relleno de plumas", basePrice: 320, hasDiscount: true, discountValue: 20, thumb: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=500&fit=crop" }
      ]
    },
    {
      id: 'w2',
      name: "COBIJAS",
      icon: "https://cdn-icons-png.flaticon.com/512/2917/2917331.png",
      products: [
        { id: 'p3', name: "Cobija Polar XL", description: "Extra cálida, perfecta para invierno", basePrice: 120, hasDiscount: false, discountValue: 0, thumb: "https://images.unsplash.com/photo-1608532848419-0ecb3b2846d5?w=400&h=500&fit=crop" }
      ]
    }
  ],
  summer: [
    {
      id: 's1',
      name: "SÁBANAS",
      icon: "https://cdn-icons-png.flaticon.com/512/2912/2912810.png",
      products: [
        { id: 'p4', name: "Sábanas de Algodón", description: "Frescas y transpirables para verano", basePrice: 80, hasDiscount: true, discountValue: 10, thumb: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400&h=500&fit=crop" }
      ]
    }
  ]
};
