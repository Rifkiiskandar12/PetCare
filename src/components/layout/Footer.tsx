import { Link } from 'react-router-dom';
import { PawPrint, Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-orange-500 p-1.5 rounded-lg">
                <PawPrint className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">PetCare</span>
            </Link>
            <p className="mt-4 text-sm text-gray-500 leading-relaxed">
              Memberikan perawatan terbaik untuk sahabat setia Anda. Kebutuhan anabul Anda adalah prioritas kami.
            </p>
            <div className="mt-6 flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Toko</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/shop" className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
                  Semua Produk
                </Link>
              </li>
              <li>
                <Link to="/shop?category=makanan" className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
                  Makanan
                </Link>
              </li>
              <li>
                <Link to="/shop?category=aksesoris" className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
                  Aksesoris
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Bantuan</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/about" className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
                  Kontak
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Kontak Kami</h3>
            <ul className="mt-4 space-y-4">
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-orange-500 shrink-0" />
                <span className="text-sm text-gray-500">Jl. Petshop No. 123, Jakarta Selatan</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-orange-500 shrink-0" />
                <span className="text-sm text-gray-500">+62 812 3456 7890</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-orange-500 shrink-0" />
                <span className="text-sm text-gray-500">info@petcare.test</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} PetCare Petshop. Seluruh hak cipta dilindungi.
          </p>
          <p className="mt-4 md:mt-0 text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
            Simulasi — Tidak ada uang sungguhan yang diproses.
          </p>
        </div>
      </div>
    </footer>
  );
}
