import { Dish } from '../types';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface DishCardProps {
  key?: string;
  dish: Dish;
  onAddToCart: (dish: Dish) => void;
}

export default function DishCard({ dish, onAddToCart }: DishCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-3xl border border-zinc-200 flex justify-between items-center transition-colors hover:border-orange-500"
    >
      <div>
        <h3 className="font-semibold text-lg text-gray-900">{dish.name}</h3>
        <p className="text-gray-500 text-sm">{dish.description}</p>
        <p className="font-bold text-gray-900 mt-1">${dish.price.toFixed(2)}</p>
      </div>
      <button
        onClick={() => onAddToCart(dish)}
        className="p-3 bg-orange-600 text-white rounded-full hover:bg-orange-500 transition-colors"
      >
        <Plus size={20} />
      </button>
    </motion.div>
  );
}
