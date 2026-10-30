import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { Button } from '../components/ui/Button';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function Cart() {
  const { items, updateQuantity, removeItem, total, loading } = useCart();
  const navigate = useNavigate();

  if (items.length === 0 && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 max-w-2xl mx-auto"
        >
          <div className="bg-orange-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-orange-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Keranjang Anda Kosong
          </h2>
          <p className="text-gray-500 mb-10 text-lg">
            Sepertinya Anda belum memilih produk apapun untuk anabul kesayangan.
          </p>
          <Button size="lg" className="rounded-full px-8">
            <Link to="/shop" className="flex items-center">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Mulai Belanja
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center space-x-4 mb-8">
        <div className="bg-orange-500 p-2 rounded-xl">
          <ShoppingBag className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Keranjang Belanja</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-6"
            >
              <div className="h-24 w-24 rounded-2xl overflow-hidden bg-gray-50 shrink-0">
                {item.products.image_path ? (
                  <img
                    src={item.products.image_path}
                    alt={item.products.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-300">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div className="flex-grow min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">
                  {item.products.name}
                </h3>
                <p className="text-sm text-gray-500 truncate mb-2">
                  SKU: {item.products.sku}
                </p>
                <p className="text-orange-600 font-bold">
                  Rp {item.products.price.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="flex flex-col items-end space-y-4">
                <div className="flex items-center bg-gray-100 rounded-full p-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1.5 rounded-full hover:bg-white transition-all text-gray-600"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 text-sm font-bold text-gray-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1.5 rounded-full hover:bg-white transition-all text-gray-600"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-700 p-1 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">Ringkasan Pesanan</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium">Rp {total.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Biaya Pengiriman</span>
                <span className="text-green-600 font-medium">Gratis</span>
              </div>
              <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-extrabold text-orange-600">
                  Rp {total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <Button
              className="w-full py-4 text-lg rounded-full shadow-lg"
              onClick={() => navigate('/checkout')}
            >
              Lanjut ke Checkout
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <p className="mt-6 text-xs text-center text-gray-400">
              * Stok akan diverifikasi kembali saat checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
