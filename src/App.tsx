/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import DishCard from './components/DishCard';
import Cart from './components/Cart';
import Chatbot from './components/Chatbot';
import { Dish, CartItem } from './types';

const DISHES: Dish[] = [
  { id: '1', name: 'Classic Burger', price: 10.99, description: 'Juicy beef patty with cheese.' },
  { id: '2', name: 'Margherita Pizza', price: 12.99, description: 'Fresh tomatoes, mozzarella.' },
  { id: '3', name: 'Caesar Salad', price: 8.99, description: 'Crispy romaine with dressing.' },
];

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (dish: Dish) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === dish.id);
      if (existing) {
        return prev.map(item => item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...dish, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8 font-sans">
      <header className="flex justify-between items-center mb-10 max-w-6xl mx-auto h-20 bg-white rounded-3xl px-8 shadow-sm border border-zinc-100">
        <h1 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Food Fix</h1>
        <button
          onClick={() => setIsCartOpen(true)}
          className="p-3 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors relative"
        >
          <ShoppingCart size={24} />
          {cartItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </header>
      <main className="max-w-6xl mx-auto space-y-6">
        {DISHES.map(dish => (
          <DishCard key={dish.id} dish={dish} onAddToCart={addToCart} />
        ))}
      </main>
      {isCartOpen && (
        <Cart cartItems={cartItems} onRemoveFromCart={removeFromCart} onCheckout={() => setIsCartOpen(false)} />
      )}
      <Chatbot />
    </div>
  );
}
