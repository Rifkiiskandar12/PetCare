import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { PawPrint, ShoppingBag, ShieldCheck, Truck, Heart, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Home() {
  const features = [
    {
      icon: Heart,
      title: 'Penuh Kasih Sayang',
      description: 'Kami memperlakukan setiap anabul seperti keluarga kami sendiri.',
      color: 'bg-red-100 text-red-600',
    },
    {
      icon: ShoppingBag,
      title: 'Produk Berkualitas',
      description: 'Hanya menyediakan makanan dan aksesoris terbaik untuk kesehatan hewan.',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Truck,
      title: 'Pengiriman Cepat',
      description: 'Layanan pengiriman yang aman dan handal sampai ke pintu rumah Anda.',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: ShieldCheck,
      title: 'Terpercaya',
      description: 'Sudah melayani ribuan pelanggan dengan tingkat kepuasan yang tinggi.',
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative bg-orange-50 pt-16 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                Cintai Anabul Anda dengan <span className="text-orange-600">Perawatan Terbaik</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-lg">
                PetCare menyediakan semua kebutuhan hewan peliharaan kesayangan Anda, mulai dari nutrisi harian hingga aksesoris menggemaskan.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button size="lg" className="rounded-full shadow-lg">
                  <Link to="/shop" className="flex items-center">
                    Belanja Sekarang
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="rounded-full">
                  <Link to="/about">Tentang Kami</Link>
                </Button>
              </div>
              <div className="mt-12 flex items-center space-x-8 text-sm text-gray-500">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-gray-900">5k+</span>
                  <span>Produk</span>
                </div>
                <div className="h-8 w-px bg-gray-300" />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-gray-900">10k+</span>
                  <span>Pelanggan</span>
                </div>
                <div className="h-8 w-px bg-gray-300" />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-gray-900">4.9/5</span>
                  <span>Rating</span>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800"
                  alt="Happy Dog"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl z-20 flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-xl">
                  <Heart className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Premium Food</p>
                  <p className="text-xs text-gray-500">100% Organic</p>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl z-20 flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-xl">
                  <ShieldCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Verified Seller</p>
                  <p className="text-xs text-gray-500">Trusted Shop</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Mengapa Memilih PetCare?</h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Kami berkomitmen untuk memberikan pengalaman belanja terbaik bagi Anda dan anabul Anda.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <div className={cn('p-3 rounded-2xl inline-flex mb-6', feature.color)}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-orange-600 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Siap Memberikan yang Terbaik?</h2>
            <p className="text-orange-100 text-lg mb-10 max-w-2xl mx-auto">
              Jelajahi ribuan produk berkualitas kami sekarang dan buat anabul Anda bahagia hari ini.
            </p>
            <Button size="lg" variant="secondary" className="rounded-full px-10 py-4 shadow-xl hover:scale-105 transition-transform">
              <Link to="/shop" className="flex items-center text-lg">
                Mulai Belanja
                <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
            </Button>
          </div>
          {/* Abstract backgrounds */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500 rounded-full opacity-20 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-400 rounded-full opacity-20 translate-x-1/2 translate-y-1/2" />
        </div>
      </section>
    </div>
  );
}
