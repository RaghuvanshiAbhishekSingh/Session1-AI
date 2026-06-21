import { CartItem } from '../types';
import { X, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';

interface CartProps {
  cartItems: CartItem[];
  onRemoveFromCart: (id: string) => void;
  onCheckout: () => void;
}

export default function Cart({ cartItems, onRemoveFromCart, onCheckout }: CartProps) {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl p-8 z-50 overflow-y-auto border-l border-zinc-100 rounded-l-3xl"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
          <ShoppingBag className="text-zinc-900" /> Your Cart
        </h2>
        <button onClick={onCheckout} className="text-zinc-400 hover:text-zinc-600">
          <X size={24} />
        </button>
      </div>

      {cartItems.length === 0 ? (
        <p className="text-zinc-500 text-center mt-10">Your cart is empty.</p>
      ) : (
        <>
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-zinc-50 rounded-2xl">
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="text-xs text-zinc-500">
                    {item.quantity} x ${item.price.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveFromCart(item.id)}
                  className="text-red-500 hover:text-red-700 font-semibold text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-zinc-100 pt-6">
            <div className="flex justify-between font-black text-xl mb-6">
              <span>Total</span>
              <span className="text-orange-600">${total.toFixed(2)}</span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black hover:bg-orange-500 transition-colors shadow-lg shadow-orange-500/20"
            >
              Place Order Now
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
