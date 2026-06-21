export interface Dish {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface CartItem extends Dish {
  quantity: number;
}
