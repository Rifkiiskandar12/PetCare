import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Database } from '../types/database';
import { Button } from '../components/ui/Button';
import { 
  ArrowLeft, Clock, CheckCircle2, Truck, XCircle, Package, 
  MapPin, Phone, CreditCard, Upload, AlertTriangle, FileText, Info, Image as ImageIcon
} from 'lucide-react';

function ProofThumbnail({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    async function getUrl() {
      try {
        const { data, error } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 3600);
        if (error) throw error;
        setUrl(data.signedUrl);
      } catch (err) {
        console.error('Error fetching proof thumbnail:', err);
      }
    }
    getUrl();
  }, [path]);

  if (!url) return <div className="w-full h-full flex items-center justify-center bg-gray-50"><ImageIcon className="h-4 w-4 text-gray-300" /></div>;
  return <img src={url} className="w-full h-full object-cover" />;
}

import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { motion } from 'motion/react';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];
type Payment = Database['public']['Tables']['payments']['Row'];

const statusIcons: Record<string, any> = {
  pending_payment: { label: 'Menunggu Pembayaran', icon: Clock, color: 'text-orange-600 bg-orange-50' },
  processing: { label: 'Sedang Diproses', icon: Package, color: 'text-blue-600 bg-blue-50' },
  shipped: { label: 'Dikirim', icon: Truck, color: 'text-purple-600 bg-purple-50' },
  completed: { label: 'Selesai', icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
  cancelled: { label: 'Dibatalkan', icon: XCircle, color: 'text-red-600 bg-red-50' },
};

function CountdownTimer({ createdAt }: { createdAt: string }) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const expiry = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000;
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Waktu Habis');
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h}j ${m}m ${s}d`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return <span className="font-mono text-xs bg-red-600 text-white px-2 py-0.5 rounded-md ml-2">{timeLeft}</span>;
}

export default function OrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (user && orderId) {
      fetchOrderDetails();
    }
  }, [user, orderId]);

  async function fetchOrderDetails() {
    setLoading(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId!)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId!);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId!)
        .order('attempt_no', { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);
    } catch (err: any) {
      toast.error('Gagal memuat detail pesanan');
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orderId || !user) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${orderId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: rpcError } = await (supabase as any).rpc('submit_payment_proof', {
        p_order_id: orderId,
        p_proof_path: filePath,
      });

      if (rpcError) throw rpcError;

      toast.success('Bukti pembayaran berhasil diunggah!');
      fetchOrderDetails();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunggah bukti pembayaran');
    } finally {
      setUploading(false);
    }
  };

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancelOrder = async () => {
    if (!orderId) return;
    
    if (!showCancelConfirm) {
      setShowCancelConfirm(true);
      toast('Klik tombol sekali lagi untuk mengonfirmasi pembatalan', { icon: '⚠️' });
      setTimeout(() => setShowCancelConfirm(false), 3000); // Reset after 3s
      return;
    }

    setCancelling(true);
    try {
      const { data, error } = await (supabase as any).rpc('cancel_pending_order', {
        p_order_id: orderId,
      });
      
      if (error) throw error;
      
      toast.success('Pesanan berhasil dibatalkan');
      setShowCancelConfirm(false);
      await fetchOrderDetails();
    } catch (err: any) {
      console.error('Cancellation error:', err);
      toast.error(err.message || 'Gagal membatalkan pesanan');
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmReceived = async () => {
    if (!orderId) return;
    try {
      const { error } = await (supabase as any).rpc('confirm_order_received', {
        p_order_id: orderId,
      });
      if (error) throw error;
      toast.success('Pesanan selesai! Terima kasih sudah berbelanja.');
      fetchOrderDetails();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengonfirmasi penerimaan');
    }
  };

  if (loading) return <div className="p-12 text-center">Memuat detail pesanan...</div>;
  if (!order) return <div className="p-12 text-center">Pesanan tidak ditemukan</div>;

  const latestPayment = payments[0];
  const isPending = order.status === 'pending_payment';
  const isAwaitingVerification = latestPayment?.status === 'pending_verification';
  const canUpload = isPending && (!latestPayment || latestPayment.status === 'not_submitted' || latestPayment.status === 'rejected' || isAwaitingVerification);

  const paymentStatusLabels: Record<string, string> = {
    not_submitted: 'Belum diunggah',
    pending_verification: 'Menunggu Verifikasi Admin',
    approved: 'Pembayaran Disetujui',
    rejected: 'Pembayaran Ditolak',
  };

  const currentStatus = statusIcons[order.status];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/profile" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-orange-600 mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Pesanan Saya
      </Link>

      <div className="space-y-8">
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
          <div className="p-8 sm:p-10 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{order.order_number}</h1>
                <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider', currentStatus.color)}>
                  <currentStatus.icon className="h-3.5 w-3.5 mr-1.5" />
                  {currentStatus.label}
                  {order.status === 'pending_payment' && <CountdownTimer createdAt={order.created_at} />}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Dipesan pada {new Date(order.created_at).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            
            {isPending && !isAwaitingVerification && (
              <Button 
                variant={showCancelConfirm ? "primary" : "danger"} 
                size="sm" 
                onClick={handleCancelOrder}
                isLoading={cancelling}
              >
                {showCancelConfirm ? "Klik Lagi untuk Batal" : "Batalkan Pesanan"}
              </Button>
            )}
            {order.status === 'shipped' && (
              <Button variant="primary" onClick={handleConfirmReceived}>
                Konfirmasi Diterima
              </Button>
            )}
          </div>

          <div className="p-8 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-orange-500" />
                  Alamat Pengiriman
                </h3>
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed">{order.shipping_address}</p>
                  <div className="mt-4 flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {order.contact_phone}
                  </div>
                </div>
              </section>

              {order.tracking_number && (
                <section>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center">
                    <Truck className="h-4 w-4 mr-2 text-orange-500" />
                    Informasi Pengiriman
                  </h3>
                  <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100">
                    <p className="text-xs text-purple-700 uppercase font-bold tracking-widest mb-1">Nomor Resi</p>
                    <p className="text-lg font-mono font-bold text-purple-900">{order.tracking_number}</p>
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-orange-500" />
                  Pembayaran (Simulasi)
                </h3>
                <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-orange-800">Status Pembayaran</span>
                    <span className="text-sm font-bold text-orange-900">
                      {latestPayment ? paymentStatusLabels[latestPayment.status] : 'Belum Ada'}
                    </span>
                  </div>
                  
                  {latestPayment?.rejection_reason && (
                    <div className="bg-red-100 p-3 rounded-xl mb-4 flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 font-medium">
                        Ditolak: {latestPayment.rejection_reason}
                      </p>
                    </div>
                  )}

                  {canUpload ? (
                    <div className="space-y-4">
                      {isAwaitingVerification ? (
                        <div className="p-3 bg-orange-100/50 rounded-xl border border-orange-200 flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <Info className="h-4 w-4 text-orange-600" />
                            <p className="text-[10px] text-orange-800 font-bold uppercase tracking-tighter">
                              Bukti sedang diverifikasi.
                            </p>
                          </div>
                          
                          {latestPayment?.proof_path && (
                            <div className="flex items-center space-x-3 bg-white p-2 rounded-xl border border-orange-100">
                              <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-50 border shrink-0">
                                <ProofThumbnail path={latestPayment.proof_path} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[8px] text-gray-400 uppercase font-bold tracking-widest">File Terunggah</p>
                                <p className="text-[10px] text-gray-600 truncate font-mono">
                                  {latestPayment.proof_path.split('/').pop()}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          <p className="text-[9px] text-orange-700 italic">
                            * Anda masih bisa menggantinya jika salah unggah.
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-orange-700 leading-relaxed italic">
                          * Silakan transfer Rp {order.total.toLocaleString('id-ID')} ke rekening simulasi kami dan unggah bukti transfer.
                        </p>
                      )}
                      
                      <div className="relative">
                        <label className="block">
                          <span className="sr-only">Pilih file</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="block w-full text-xs text-orange-700 
                              file:mr-4 file:py-2.5 file:px-6 
                              file:rounded-full file:border-0 
                              file:text-xs file:font-black
                              file:bg-orange-600 file:text-white 
                              hover:file:bg-orange-700 
                              file:transition-all cursor-pointer
                              file:shadow-lg file:shadow-orange-200"
                          />
                        </label>
                      </div>
                      {uploading && (
                        <div className="flex items-center space-x-2 text-orange-600 animate-pulse">
                          <div className="h-2 w-2 bg-orange-600 rounded-full animate-bounce" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Sedang mengunggah...</p>
                        </div>
                      )}
                    </div>
                  ) : latestPayment?.status === 'approved' && (

                    <div className="p-4 bg-green-100 rounded-xl flex items-center space-x-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-xs text-green-800 font-bold">Pembayaran telah terverifikasi.</span>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          <div className="p-8 sm:p-10 bg-gray-50 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-orange-500" />
              Rincian Produk
            </h3>
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0 border border-gray-100">
                      <Package className="h-6 w-6 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{item.product_name_snapshot}</p>
                      <p className="text-xs text-gray-500">SKU: {item.sku_snapshot}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      Rp {(item.unit_price_snapshot * item.quantity).toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-gray-400">{item.quantity}x @ Rp {item.unit_price_snapshot.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 border-t border-gray-200 pt-8 flex flex-col items-end space-y-2">
              <div className="flex justify-between w-full max-w-xs text-gray-500">
                <span className="text-sm">Subtotal</span>
                <span className="font-bold">Rp {order.subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between w-full max-w-xs text-gray-500">
                <span className="text-sm">Biaya Pengiriman</span>
                <span className="font-bold text-green-600">Rp 0</span>
              </div>
              <div className="flex justify-between w-full max-w-xs pt-4 border-t border-gray-100">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-extrabold text-orange-600">
                  Rp {order.total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
