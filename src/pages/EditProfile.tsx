import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { User, Phone, Mail, Shield, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function EditProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        avatar_url: (profile as any).avatar_url || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let finalAvatarUrl = formData.avatar_url;

      if (avatarFile) {
        setUploading(true);
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        finalAvatarUrl = publicUrl;
      }

      const { error } = await (supabase
        .from('profiles') as any)
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      
      await refreshProfile();
      toast.success('Profil berhasil diperbarui!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/profile" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-orange-600 mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Akun Saya
      </Link>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
        <div className="p-8 sm:p-10 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Edit Profil</h1>
            <p className="mt-2 text-gray-500">Perbarui informasi pribadi Anda agar kami bisa menghubungi Anda dengan mudah.</p>
          </div>

          <div className="flex items-center space-x-6">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full border-4 border-orange-50 overflow-hidden bg-gray-100 shadow-inner">
                {avatarFile ? (
                  <img src={URL.createObjectURL(avatarFile)} className="w-full h-full object-cover" />
                ) : formData.avatar_url ? (
                  <img src={formData.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-10 w-10 text-gray-300" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-orange-600 rounded-full text-white shadow-lg cursor-pointer hover:bg-orange-700 transition-colors">
                <Save className="h-4 w-4" />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2 text-orange-500" />
                  Nama Lengkap
                </label>
                <input
                  required
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-orange-500" />
                  Nomor WhatsApp
                </label>
                <input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  placeholder="081234567890"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  Email (Tidak dapat diubah)
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-500 cursor-not-allowed">
                  {user?.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-gray-400" />
                  Peran Akun
                </label>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-50 text-orange-700">
                  {profile?.role}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 flex justify-end">
            <Button
              type="submit"
              size="lg"
              className="rounded-full px-10 shadow-lg shadow-orange-100"
              isLoading={loading || uploading}
            >
              <Save className="h-5 w-5 mr-2" />
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-8 p-6 bg-orange-50 rounded-3xl border border-orange-100 flex items-start space-x-4">
        <Shield className="h-6 w-6 text-orange-600 shrink-0 mt-1" />
        <p className="text-sm text-orange-800 leading-relaxed">
          <strong>Catatan:</strong> Informasi ini digunakan untuk keperluan pengiriman dan verifikasi pesanan Anda. Kami menjamin kerahasiaan data pribadi anabul dan pemiliknya.
        </p>
      </div>
    </div>
  );
}
