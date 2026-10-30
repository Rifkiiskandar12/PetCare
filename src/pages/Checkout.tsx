import { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { MapPin, Phone, CreditCard, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    try {
      // Call the checkout_cart RPC
      const { data: orderId, error } = await (supabase as any).rpc('checkout_cart', {
        p_shipping_address: address,
        p_contact_phone: phone,
      });

      if (error) throw error;

      if (!orderId) throw new Error('Gagal mendapatkan ID pesanan.');

      toast.success('Pesanan berhasil dibuat!');
      clearCart();
      navigate(`/profile/orders/${orderId}`);
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'Gagal melakukan checkout. Periksa stok produk.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Keranjang Anda Kosong</h2>
          <Button onClick={() => navigate('/shop')}>Kembali ke Toko</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-orange-600" />
              Informasi Pengiriman
            </h2>
            <form onSubmit={handleCheckout} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                <textarea
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent sm:text-sm"
                  placeholder="Jl. Nama Jalan No. 123, Kelurahan, Kecamatan, Kota..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent sm:text-sm"
                    placeholder="081234567890"
                  />
                </div>
              </div>

              <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 space-y-4">
                <div className="flex items-center space-x-3 text-orange-800">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-bold">Metode Pembayaran</span>
                </div>
                <p className="text-sm text-orange-700 leading-relaxed">
                  <strong>Simulated Bank Transfer</strong><br />
                  Metode ini hanya simulasi untuk tugas akademik. Anda akan diminta mengunggah bukti transfer dummy setelah pesanan dibuat.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full py-4 text-lg rounded-full shadow-lg"
                isLoading={loading}
              >
                Konfirmasi Pesanan
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <ShoppingBag className="mr-2 h-5 w-5 text-orange-600" />
              Ringkasan Pesanan
            </h2>
            <div className="space-y-4 max-h-[40vh] overflow-y-auto mb-6 pr-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-lg bg-gray-50 overflow-hidden shrink-0">
                      {item.products.image_path && (
                        <img src={item.products.image_path} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.products.name}</p>
                      <p className="text-xs text-gray-500">{item.quantity}x @ Rp {item.products.price.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    Rp {(item.products.price * item.quantity).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-bold">Rp {total.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Biaya Pengiriman</span>
                <span className="text-green-600 font-bold">Gratis</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold text-gray-900">Total Pembayaran</span>
                <span className="text-3xl font-extrabold text-orange-600 tracking-tight">
                  Rp {total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start space-x-3">
              <ShieldCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">
                Stok Anda sudah di-reservasi sementara. Selesaikan pembayaran dalam 24 jam untuk mengamankan pesanan Anda.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
