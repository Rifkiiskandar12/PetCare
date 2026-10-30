import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Database } from '../types/database';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, Package, ChevronRight, Clock, CheckCircle2, 
  Truck, XCircle, AlertCircle, Settings 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

type Order = Database['public']['Tables']['orders']['Row'];

export default function Profile() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }

  const getStatusInfo = (status: Order['status']) => {
    switch (status) {
      case 'pending_payment':
        return { label: 'Menunggu Pembayaran', color: 'text-orange-600 bg-orange-50', icon: Clock };
      case 'processing':
        return { label: 'Diproses', color: 'text-blue-600 bg-blue-50', icon: Package };
      case 'shipped':
        return { label: 'Dikirim', color: 'text-purple-600 bg-purple-50', icon: Truck };
      case 'completed':
        return { label: 'Selesai', color: 'text-green-600 bg-green-50', icon: CheckCircle2 };
      case 'cancelled':
        return { label: 'Dibatalkan', color: 'text-red-600 bg-red-50', icon: XCircle };
      default:
        return { label: status, color: 'text-gray-600 bg-gray-50', icon: AlertCircle };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Akun Saya</h1>
        <p className="mt-2 text-gray-500">Kelola informasi profil dan pantau pesanan Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden relative">
            <div className="relative z-10">
              <div className="h-20 w-20 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-orange-600">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{profile?.full_name || 'Tanpa Nama'}</h3>
              <p className="text-sm text-gray-500 mb-4">{user?.email}</p>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 capitalize">
                {profile?.role}
              </div>
            </div>
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-orange-50 rounded-full opacity-50" />
          </div>

          <nav className="space-y-1">
            <Link
              to="/profile"
              className={cn(
                "group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all",
                window.location.pathname === '/profile' ? "bg-orange-600 text-white shadow-lg shadow-orange-200" : "text-gray-500 hover:bg-orange-50 hover:text-orange-600"
              )}
            >
              <ShoppingBag className="mr-3 h-5 w-5" />
              Pesanan Saya
            </Link>
            <Link
              to="/profile/edit"
              className={cn(
                "group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all",
                window.location.pathname === '/profile/edit' ? "bg-orange-600 text-white shadow-lg shadow-orange-200" : "text-gray-500 hover:bg-orange-50 hover:text-orange-600"
              )}
            >
              <Settings className="mr-3 h-5 w-5" />
              Edit Profil
            </Link>
            {/* Additional profile links can go here */}
          </nav>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
            <div className="p-8 border-b border-gray-50">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Riwayat Pesanan</h2>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-500">Memuat pesanan...</div>
            ) : orders.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {orders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  return (
                    <Link
                      key={order.id}
                      to={`/profile/orders/${order.id}`}
                      className="block p-8 hover:bg-orange-50/30 transition-all group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-bold text-gray-900">{order.order_number}</span>
                            <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusInfo.color)}>
                              <statusInfo.icon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            Dipesan pada {new Date(order.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-8">
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Total Pembayaran</p>
                            <p className="text-sm font-bold text-gray-900">
                              Rp {order.total.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-orange-600 transition-colors" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500">Anda belum memiliki pesanan.</p>
                <Link to="/shop" className="text-orange-600 font-bold mt-4 inline-block hover:underline">
                  Mulai Belanja &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
