
export enum Season {
  WINTER = 'winter',
  SUMMER = 'summer'
}

export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number; // The original price
  hasDiscount: boolean;
  discountValue: number; // The percentage
  thumb: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  products: Product[];
}

export interface CatalogState {
  season: Season;
  whatsapp: string;
  wsText: string;
  wsColor: string;
  logo: string;
  title: string;
  subtitle: string;
  winter: Category[];
  summer: Category[];
}
