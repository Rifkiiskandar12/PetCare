import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';
import { Button } from '../components/ui/Button';
import { 
  LayoutDashboard, ShoppingBag, Package, FolderTree, Users, 
  ChevronRight, Check, X, Truck, AlertCircle, Search, ExternalLink,
  Edit, Trash2, Calendar, FileText, TrendingUp, Clock
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { Skeleton } from '../components/ui/Skeleton';

type Order = Database['public']['Tables']['orders']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Payment = Database['public']['Tables']['payments']['Row'];

type Tab = 'overview' | 'orders' | 'products' | 'categories' | 'users' | 'audit';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: pendingCount } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending_verification');

      setStats({
        totalOrders: orderCount || 0,
        totalProducts: productCount || 0,
        totalUsers: userCount || 0,
        pendingPayments: pendingCount || 0
      });
    } finally {
      setLoading(false);
    }
  }

  const { profile } = useAuth();

  const menuItems = [
    { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'orders', label: 'Pesanan', icon: ShoppingBag },
    { id: 'products', label: 'Produk', icon: Package },
    { id: 'categories', label: 'Kategori', icon: FolderTree },
    ...(profile?.role === 'admin' ? [
      { id: 'users', label: 'Pengguna', icon: Users },
      { id: 'audit', label: 'Audit Log', icon: FileText },
    ] : []),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="lg:w-64 shrink-0">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-6 sticky top-24">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 px-4">Panel Admin</h2>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={cn(
                    'w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200',
                    activeTab === item.id
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-200'
                      : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex-grow">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden min-h-[600px]">
            {activeTab === 'overview' && <OverviewTab stats={stats} />}
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'products' && <ProductsTab />}
            {activeTab === 'categories' && <CategoriesTab />}
            {activeTab === 'users' && profile?.role === 'admin' && <UsersTab />}
            {activeTab === 'audit' && profile?.role === 'admin' && <AuditLogsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ stats }: { stats: any }) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  async function fetchRevenueData() {
    setLoadingChart(true);
    try {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { data, error } = await supabase
        .from('orders')
        .select('created_at, total')
        .gte('created_at', sevenDaysAgo)
        .neq('status', 'cancelled');

      if (error) throw error;

      const grouped = (data as any[] || []).reduce((acc: any, order) => {
        const date = format(new Date(order.created_at), 'dd MMM');
        acc[date] = (acc[date] || 0) + Number(order.total);
        return acc;
      }, {});

      const formatted = Object.keys(grouped).map(date => ({
        date,
        revenue: grouped[date]
      }));

      setChartData(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChart(false);
    }
  }

  const cards = [
    { label: 'Total Pesanan', value: stats.totalOrders, color: 'text-blue-600 bg-blue-50', icon: ShoppingBag },
    { label: 'Total Produk', value: stats.totalProducts, color: 'text-purple-600 bg-purple-50', icon: Package },
    { label: 'Total Pengguna', value: stats.totalUsers, color: 'text-green-600 bg-green-50', icon: Users },
    { label: 'Verifikasi Pending', value: stats.pendingPayments, color: 'text-orange-600 bg-orange-50', icon: Clock },
  ];

  return (
    <div className="p-10 space-y-12">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Ringkasan Operasional</h2>
        <div className="flex items-center space-x-2 text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
          <TrendingUp className="h-3 w-3 text-green-500" />
          <span>7 HARI TERAKHIR</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className={cn('p-6 rounded-3xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02] flex flex-col', card.color)}>
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{card.label}</p>
              <card.icon className="h-4 w-4 opacity-50" />
            </div>
            <p className="text-3xl font-extrabold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-8 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-orange-500" />
          Pendapatan Mingguan
        </h3>
        <div className="h-64 w-full">
          {loadingChart ? (
            <div className="h-full w-full space-y-4">
              <div className="flex items-end justify-between h-48 gap-2">
                {[...Array(7)].map((_, i) => (
                  <Skeleton key={i} className="w-full" style={{ height: `${Math.random() * 100}%` }} />
                ))}
              </div>
              <div className="flex justify-between">
                {[...Array(7)].map((_, i) => (
                  <Skeleton key={i} className="h-3 w-10" />
                ))}
              </div>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(value) => `Rp${(value / 1000)}k`} />
                <Tooltip cursor={{ fill: '#fff7ed' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400 italic text-sm">Belum ada data transaksi minggu ini.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    let query = supabase.from('orders').select('*, profiles(full_name), payments(*)').order('created_at', { ascending: false });
    if (dateRange.start) query = query.gte('created_at', startOfDay(new Date(dateRange.start)).toISOString());
    if (dateRange.end) query = query.lte('created_at', endOfDay(new Date(dateRange.end)).toISOString());
    const { data, error } = await query;
    if (!error) setOrders(data || []);
    setLoading(false);
  }

  const handleVerify = async (paymentId: string, approve: boolean) => {
    try {
      const { error } = await (supabase as any).rpc('verify_simulated_payment', { p_payment_id: paymentId, p_approve: approve, p_rejection_reason: approve ? null : 'Bukti pembayaran tidak valid.' });
      if (error) throw error;
      toast.success(approve ? 'Pembayaran disetujui' : 'Pembayaran ditolak');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    console.log('Admin attempting to cancel order:', orderId);
    try {
      const { data, error } = await (supabase as any).rpc('cancel_pending_order', { p_order_id: orderId });
      
      if (error) {
        console.error('Admin cancellation RPC error:', error);
        throw error;
      }
      
      console.log('Admin cancellation result:', data);
      toast.success('Pesanan berhasil dibatalkan');
      fetchOrders();
    } catch (err: any) {
      console.error('Admin cancellation catch error:', err);
      toast.error(err.message || 'Gagal membatalkan pesanan');
    }
  };

  const [shippingOrderId, setShippingOrderId] = useState<string | null>(null);
  const [resiValue, setResiValue] = useState('');
  const [shippingLoading, setShippingLoading] = useState(false);

  const handleShip = async () => {
    if (!shippingOrderId || !resiValue) return;
    setShippingLoading(true);
    try {
      const { error } = await (supabase as any).rpc('ship_order', { p_order_id: shippingOrderId, p_tracking_number: resiValue });
      if (error) throw error;
      toast.success('Pesanan berhasil dikirim');
      setShippingOrderId(null);
      setResiValue('');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setShippingLoading(false);
    }
  };

  const viewProof = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 60);
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
        <h2 className="text-2xl font-extrabold text-gray-900">Kelola Pesanan</h2>
        <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-xl border border-gray-100 text-xs">
          <Calendar className="h-3 w-3 text-gray-400" />
          <input type="date" value={dateRange.start} onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))} className="bg-transparent outline-none" />
          <span>-</span>
          <input type="date" value={dateRange.end} onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))} className="bg-transparent outline-none" />
          <Button size="sm" variant="ghost" onClick={fetchOrders} className="h-6 w-6 p-0"><Search className="h-3 w-3" /></Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
              <th className="pb-4 px-4">Order</th>
              <th className="pb-4 px-4">Pelanggan</th>
              <th className="pb-4 px-4">Status</th>
              <th className="pb-4 px-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="py-4 px-4"><Skeleton className="h-10 w-24" /></td>
                  <td className="py-4 px-4"><Skeleton className="h-10 w-32" /></td>
                  <td className="py-4 px-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                  <td className="py-4 px-4"><Skeleton className="h-8 w-8 rounded-lg" /></td>
                </tr>
              ))
            ) : orders.map((order) => (
              <tr key={order.id} className="text-sm">
                <td className="py-4 px-4">
                  <p className="font-bold">{order.order_number}</p>
                  <p className="text-[10px] text-gray-400">{format(new Date(order.created_at), 'dd/MM/yy')}</p>
                </td>
                <td className="py-4 px-4">{order.profiles?.full_name}</td>
                <td className="py-4 px-4"><span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold">{order.status}</span></td>
                 <td className="py-4 px-4">
                  <div className="flex space-x-2">
                    {/* Shipping Action */}
                    {order.status === 'processing' && (
                      <button 
                        onClick={() => setShippingOrderId(order.id)} 
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Input Nomor Resi"
                      >
                        <Truck className="h-4 w-4" />
                      </button>
                    )}

                    {/* Payment Verification Actions */}
                    {order.payments?.some((p: any) => p.status === 'pending_verification') && (
                      <>
                        <button 
                          onClick={() => viewProof(order.payments.find((p: any) => p.status === 'pending_verification').proof_path)} 
                          className="p-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
                          title="Lihat Bukti Transfer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleVerify(order.payments.find((p: any) => p.status === 'pending_verification').id, true)} 
                          className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          title="Setujui Pembayaran"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleVerify(order.payments.find((p: any) => p.status === 'pending_verification').id, false)} 
                          className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Tolak Pembayaran"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {/* General Cancellation Action */}
                    {(order.status === 'pending_payment' || order.status === 'processing') && (
                      <button 
                        onClick={() => handleCancelOrder(order.id)} 
                        className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all"
                        title="Batalkan Pesanan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shipping Modal */}
      {shippingOrderId && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full space-y-4">
            <h3 className="font-bold text-lg">Input Nomor Resi</h3>
            <p className="text-xs text-gray-500">Masukkan nomor resi pengiriman untuk pesanan ini.</p>
            <input 
              autoFocus
              placeholder="Contoh: JNE123456789" 
              value={resiValue} 
              onChange={e => setResiValue(e.target.value)} 
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" 
            />
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShippingOrderId(null); setResiValue(''); }}>Batal</Button>
              <Button className="flex-1" onClick={handleShip} isLoading={shippingLoading}>Kirim</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', sku: '', price: '', category_id: '', description: '', image_path: '', stock_on_hand: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').eq('is_active', true);
    setCategories(data || []);
  }

  async function fetchProducts() {
    const { data, error } = await supabase.from('products').select('*, categories(name)').order('name');
    if (!error) setProducts(data || []);
  }

  const [searchQuery, setSearchQuery] = useState('');
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalImagePath = formData.image_path;

      // Upload image if a new file is selected
      if (imageFile) {
        setUploading(true);
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);
        
        finalImagePath = publicUrl;
      }

      const p = { 
        ...formData, 
        price: Number(formData.price), 
        stock_on_hand: Number(formData.stock_on_hand),
        image_path: finalImagePath 
      };
      const { error } = editingId 
        ? await (supabase.from('products') as any).update(p).eq('id', editingId)
        : await (supabase.from('products') as any).insert([p]);
      if (error) throw error;
      toast.success('Produk berhasil disimpan');
      setIsModalOpen(false);
      setImageFile(null);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan produk');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const handleDelete = async (id: string, currentlyActive: boolean) => {
    if (!productToDelete || productToDelete !== id) {
      setProductToDelete(id);
      toast('Klik sampah sekali lagi untuk mengubah status aktif', { icon: '⚠️' });
      setTimeout(() => setProductToDelete(null), 3000);
      return;
    }

    const action = currentlyActive ? 'Nonaktifkan' : 'Aktifkan';
    try {
      const { error } = await (supabase.from('products') as any).update({ is_active: !currentlyActive }).eq('id', id);
      if (error) throw error;
      toast.success(`Produk berhasil di${action.toLowerCase()}`); 
      setProductToDelete(null);
      fetchProducts(); 
    } catch (err: any) { 
      toast.error(err.message || 'Gagal mengubah status produk'); 
    }
  };

  const handleQuickAdjust = async (id: string, delta: number) => {
    try {
      const { error } = await (supabase as any).rpc('adjust_stock', { 
        p_product_id: id, 
        p_quantity_delta: delta, 
        p_reason: 'Quick Adjust Admin' 
      });
      if (error) throw error;
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
        <h2 className="text-2xl font-extrabold text-gray-900">Produk</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari nama atau SKU..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none w-64"
            />
          </div>
          <Button size="sm" onClick={() => { 
            setEditingId(null); 
            setFormData({ name: '', sku: '', price: '', category_id: '', description: '', image_path: '', stock_on_hand: '0' }); 
            setIsModalOpen(true); 
          }}>Tambah</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {filteredProducts.map(p => (
          <div key={p.id} className={cn("p-4 bg-white border rounded-2xl flex justify-between items-center group transition-all", p.is_active ? "border-gray-100" : "border-red-100 bg-red-50/30")}>
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                {p.image_path ? <img src={p.image_path} className="w-full h-full object-cover" /> : <Package className="h-full w-full p-2 text-gray-300" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">{p.name}</p>
                  {!p.is_active && <span className="text-[8px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">Nonaktif</span>}
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-[10px] text-gray-400">SKU: {p.sku} | Stok: {p.stock_on_hand} (Res: {p.stock_reserved})</p>
                  {(p.stock_on_hand - p.stock_reserved) <= 5 && (p.stock_on_hand - p.stock_reserved) > 0 && (
                    <span className="text-[8px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">Low Stock</span>
                  )}
                  {(p.stock_on_hand - p.stock_reserved) <= 0 && (
                    <span className="text-[8px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">Out of Stock</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                <button 
                  onClick={() => handleQuickAdjust(p.id, -1)}
                  className="p-2 hover:bg-red-50 hover:text-red-600 transition-colors border-r border-gray-100"
                >
                  -
                </button>
                <div className="px-3 py-1 text-center min-w-[3rem]">
                  <p className="text-[10px] font-bold text-gray-400 leading-none mb-1 uppercase tracking-tighter">Stock</p>
                  <p className="text-sm font-black text-gray-900 leading-none">{p.stock_on_hand}</p>
                </div>
                <button 
                  onClick={() => handleQuickAdjust(p.id, 1)}
                  className="p-2 hover:bg-green-50 hover:text-green-600 transition-colors border-l border-gray-100"
                >
                  +
                </button>
              </div>

              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                <button onClick={() => { 
                  setEditingId(p.id); 
                  setFormData({ 
                    name: p.name, 
                    sku: p.sku, 
                    price: p.price.toString(), 
                    category_id: p.category_id, 
                    description: p.description || '', 
                    image_path: p.image_path || '',
                    stock_on_hand: p.stock_on_hand.toString()
                  }); 
                  setIsModalOpen(true); 
                }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete(p.id, p.is_active)} 
                  className={cn(
                    "p-2 rounded-xl transition-all", 
                    productToDelete === p.id 
                      ? "bg-red-600 text-white shadow-lg" 
                      : p.is_active 
                        ? "text-red-600 hover:bg-red-50" 
                        : "text-green-600 hover:bg-green-50"
                  )}
                >
                  {productToDelete === p.id ? <Trash2 className="h-4 w-4 animate-pulse" /> : p.is_active ? <Trash2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="space-y-4">
              <input required placeholder="Nama Produk" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-2">SKU Produk</label>
                  <input required placeholder="Contoh: PET-001" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-2">Harga (Rp)</label>
                  <input required type="number" placeholder="Contoh: 50000" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                <label className="block text-sm font-bold text-orange-900 mb-2 flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Stok Awal
                </label>
                <input 
                  required 
                  type="number" 
                  placeholder="Jumlah stok saat ini" 
                  value={formData.stock_on_hand} 
                  onChange={e => setFormData({ ...formData, stock_on_hand: e.target.value })} 
                  className="w-full p-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white" 
                />
                <p className="mt-2 text-[10px] text-orange-600 italic leading-relaxed">
                  * Masukkan jumlah stok fisik yang tersedia di gudang/toko Anda.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-2">Kategori</label>
                <select required value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white">
                  <option value="">Pilih Kategori</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Foto Produk</label>
                <div className="flex items-center space-x-4">
                  {(imageFile || formData.image_path) && (
                    <div className="h-16 w-16 rounded-xl border overflow-hidden bg-gray-50">
                      <img 
                        src={imageFile ? URL.createObjectURL(imageFile) : formData.image_path} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="flex-grow text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  />
                </div>
              </div>

              <textarea placeholder="Deskripsi Produk" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" rows={3} />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="submit" className="flex-1 rounded-xl" isLoading={saving || uploading}>Simpan</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function CategoriesTab() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCategories(); }, []);
  async function fetchCategories() { const { data } = await supabase.from('categories').select('*').order('name'); setCategories(data || []); }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const slug = formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      const { error } = editingId 
        ? await (supabase.from('categories') as any).update(formData).eq('id', editingId)
        : await (supabase.from('categories') as any).insert([{ ...formData, slug }]);
      if (error) throw error;
      setIsModalOpen(false); fetchCategories();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!categoryToDelete || categoryToDelete !== id) {
      setCategoryToDelete(id);
      toast('Klik sampah sekali lagi untuk menghapus permanen', { icon: '⚠️' });
      setTimeout(() => setCategoryToDelete(null), 3000);
      return;
    }

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      toast.success('Kategori berhasil dihapus');
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err: any) {
      toast.error('Gagal: Pastikan tidak ada produk yang menggunakan kategori ini.');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between mb-8">
        <h2 className="text-2xl font-extrabold text-gray-900">Kategori</h2>
        <Button size="sm" onClick={() => { setEditingId(null); setFormData({ name: '', description: '' }); setIsModalOpen(true); }}>Tambah</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(c => (
          <div key={c.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex justify-between items-center group">
            <div><p className="font-bold">{c.name}</p><p className="text-[10px] text-gray-400">{c.is_active ? 'Aktif' : 'Nonaktif'}</p></div>
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditingId(c.id); setFormData({ name: c.name, description: c.description || '' }); setIsModalOpen(true); }} className="p-1.5 text-blue-600"><Edit className="h-4 w-4" /></button>
              <button 
                onClick={() => handleDelete(c.id)} 
                className={cn(
                  "p-1.5 transition-all rounded-lg",
                  categoryToDelete === c.id ? "bg-red-600 text-white shadow-lg" : "text-red-600 hover:bg-red-50"
                )}
              >
                <Trash2 className={cn("h-4 w-4", categoryToDelete === c.id && "animate-pulse")} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl max-w-md w-full space-y-4">
            <h3 className="font-bold">{editingId ? 'Edit' : 'Tambah'} Kategori</h3>
            <input required placeholder="Nama" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border rounded-xl" />
            <textarea placeholder="Deskripsi" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-2 border rounded-xl" rows={3} />
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="submit" className="flex-1" isLoading={saving}>Simpan</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const { user: currentUser } = useAuth();
  useEffect(() => { fetchUsers(); }, []);
  async function fetchUsers() { const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }); setUsers(data || []); }

  const [searchQuery, setSearchQuery] = useState('');
  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSetRole = async (userId: string, role: string, isActive: boolean) => {
    if (userId === currentUser?.id) { toast.error('Dilarang mengubah diri sendiri'); return; }
    const { error } = await (supabase as any).rpc('admin_set_user_access', { p_target_user_id: userId, p_role: role, p_is_active: isActive });
    if (!error) { toast.success('Ok'); fetchUsers(); } else toast.error(error.message);
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
        <h2 className="text-2xl font-extrabold text-gray-900">Pengguna</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari nama atau telepon..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none w-64"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="text-[10px] font-bold text-gray-400 uppercase border-b border-gray-50"><th className="pb-4 px-4">Nama</th><th className="pb-4 px-4">Peran</th><th className="pb-4 px-4">Status</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filteredUsers.map(u => (
              <tr key={u.id} className="text-sm">
                <td className="py-4 px-4 font-bold">{u.full_name || 'No Name'}</td>
                <td className="py-4 px-4">
                  <select value={u.role} disabled={u.id === currentUser?.id} onChange={e => handleSetRole(u.id, e.target.value, u.is_active)} className="bg-gray-50 border rounded-lg px-2 py-1 text-xs">
                    <option value="customer">Customer</option><option value="staff">Staff</option><option value="admin">Admin</option>
                  </select>
                </td>
                <td className="py-4 px-4"><button onClick={() => handleSetRole(u.id, u.role, !u.is_active)} disabled={u.id === currentUser?.id} className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', u.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}>{u.is_active ? 'Aktif' : 'Off'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditLogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchLogs(); }, []);
  async function fetchLogs() { const { data } = await supabase.from('audit_logs').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(30); setLogs(data || []); setLoading(false); }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-8">Audit Log</h2>
      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))
        ) : logs.map(log => (
          <div key={log.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
            <div className="flex justify-between font-bold mb-1">
              <span className={cn(
                "px-2 py-0.5 rounded-md",
                log.action.includes('delete') ? "bg-red-100 text-red-600" : 
                log.action.includes('update') ? "bg-blue-100 text-blue-600" :
                "bg-green-100 text-green-600"
              )}>
                {log.action.toUpperCase()}
              </span>
              <span className="text-gray-400">{format(new Date(log.created_at), 'HH:mm dd/MM/yy')}</span>
            </div>
            <p className="text-gray-700 font-medium mb-1">
              Aktor: {log.profiles?.full_name || 'System'} | Entitas: <span className="font-bold">{log.entity_type}</span>
            </p>
            {log.metadata && Object.keys(log.metadata as object).length > 0 && (
              <div className="mt-2 p-2 bg-white rounded-lg border border-gray-100 font-mono text-[10px] text-gray-500 overflow-x-auto">
                <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
