import { ShoppingCart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Database } from '../types/database';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface ProductCardProps {
  product: Product & { categories: Category };
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const isOutOfStock = product.stock_on_hand - product.stock_reserved <= 0;

  return (
    <div className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {product.image_path ? (
          <img
            src={product.image_path}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-orange-600 shadow-sm backdrop-blur-sm uppercase tracking-wider">
            {product.categories.name}
          </span>
          {!isOutOfStock && (product.stock_on_hand - product.stock_reserved) <= 5 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-600 text-white shadow-sm uppercase tracking-wider animate-pulse">
              Stok Menipis
            </span>
          )}
        </div>
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider">
              Habis
            </span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex-grow">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">
            {product.description}
          </p>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-xl font-extrabold text-orange-600">
              Rp {product.price.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="mt-2 flex items-center space-x-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isOutOfStock ? "bg-red-500" : (product.stock_on_hand - product.stock_reserved) <= 5 ? "bg-orange-500" : "bg-green-500"
            )} />
            <p className="text-xs text-gray-400">
              Stok: {Math.max(0, product.stock_on_hand - product.stock_reserved)} tersedia
            </p>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <Button
            className="flex-grow py-3 rounded-2xl shadow-md active:scale-95 transition-transform"
            disabled={isOutOfStock}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart(product);
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Beli
          </Button>
          <Link
            to={`/product/${product.id}`}
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl border border-gray-100 text-gray-400 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-100 transition-all active:scale-90"
            title="Lihat Detail"
          >
            <Eye className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
