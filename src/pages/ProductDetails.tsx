import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';
import { Button } from '../components/ui/Button';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { 
  ArrowLeft, ShoppingCart, ShieldCheck, Truck, 
  RotateCcw, Info, Package, Tag, Loader2 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'motion/react';
import { Skeleton } from '../components/ui/Skeleton';

type Product = Database['public']['Tables']['products']['Row'] & {
  categories: Database['public']['Tables']['categories']['Row'];
};

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  async function fetchProduct() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('id', id!)
        .single();

      if (error) throw error;
      setProduct(data as Product);
    } catch (err: any) {
      toast.error('Produk tidak ditemukan');
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  }

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Silakan masuk terlebih dahulu');
      navigate('/auth');
      return;
    }
    if (!product) return;
    await addToCart(product.id, quantity);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Skeleton className="h-6 w-32 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <Skeleton className="aspect-square rounded-[3rem]" />
          <div className="space-y-6">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-32 w-full rounded-3xl" />
            <div className="space-y-4 pt-4">
              <Skeleton className="h-12 w-1/2 rounded-full" />
              <Skeleton className="h-14 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const availableStock = product.stock_on_hand - product.stock_reserved;
  const isOutOfStock = availableStock <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/shop" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-orange-600 mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Toko
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Product Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative aspect-square rounded-[3rem] overflow-hidden bg-gray-100 border border-gray-100 shadow-2xl"
        >
          {product.image_path ? (
            <img
              src={product.image_path}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
              <Package className="h-20 w-20 mb-4" />
              <span>Tidak ada gambar</span>
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <span className="bg-red-600 text-white px-8 py-3 rounded-full text-xl font-bold uppercase tracking-widest">
                Stok Habis
              </span>
            </div>
          )}
        </motion.div>

        {/* Product Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <div className="mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-600 mb-4">
              <Tag className="h-3 w-3 mr-1.5" />
              {product.categories.name}
            </span>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
              {product.name}
            </h1>
            <p className="text-sm text-gray-400 font-mono">SKU: {product.sku}</p>
          </div>

          <div className="mb-8">
            <p className="text-3xl font-extrabold text-orange-600">
              Rp {product.price.toLocaleString('id-ID')}
            </p>
            <p className="text-sm text-gray-500 mt-2 flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Stok tersedia: <span className="font-bold text-gray-900 ml-1">{Math.max(0, availableStock)} unit</span>
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 mb-8">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center">
              <Info className="h-4 w-4 mr-2 text-orange-500" />
              Deskripsi Produk
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              {product.description || 'Tidak ada deskripsi untuk produk ini.'}
            </p>
          </div>

          {!isOutOfStock && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-bold text-gray-700">Jumlah:</span>
                <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors text-gray-600"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors text-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  size="lg"
                  className="flex-1 rounded-full py-4 text-lg shadow-xl shadow-orange-100"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Tambah ke Keranjang
                </Button>
              </div>
            </div>
          )}

          {/* Trust Badges */}
          <div className="mt-12 grid grid-cols-3 gap-4 border-t border-gray-100 pt-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-50 p-2 rounded-xl mb-2">
                <ShieldCheck className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Original<br/>Guaranteed</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-50 p-2 rounded-xl mb-2">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Fast<br/>Shipping</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-purple-50 p-2 rounded-xl mb-2">
                <RotateCcw className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Easy<br/>Returns</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
