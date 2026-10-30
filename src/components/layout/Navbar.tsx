import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu, X, PawPrint } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { cn } from '../../lib/utils';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { items } = useCart();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const navigation = [
    { name: 'Beranda', href: '/' },
    { name: 'Toko', href: '/shop' },
    { name: 'Tentang Kami', href: '/about' },
  ];

  if (profile?.role === 'admin' || profile?.role === 'staff') {
    navigation.push({ name: 'Dashboard', href: '/admin' });
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-orange-500 p-1.5 rounded-lg">
                <PawPrint className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">PetCare</span>
            </Link>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200',
                    location.pathname === item.href
                      ? 'text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            <Link
              to="/cart"
              className="p-2 text-gray-500 hover:text-orange-600 transition-colors relative group"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-orange-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white group-hover:scale-110 transition-transform">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span>{profile?.full_name || 'Profil'}</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-orange-600 hover:bg-orange-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Masuk
              </Link>
            )}
          </div>

          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn('sm:hidden', isMenuOpen ? 'block' : 'hidden')}>
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'block pl-3 pr-4 py-2 border-l-4 text-base font-medium',
                location.pathname === item.href
                  ? 'bg-orange-50 border-orange-500 text-orange-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <Link
            to="/cart"
            className="flex items-center pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
            onClick={() => setIsMenuOpen(false)}
          >
            <ShoppingCart className="h-5 w-5 mr-3" />
            Keranjang ({cartItemCount})
          </Link>
          {!user && (
            <Link
              to="/auth"
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
              onClick={() => setIsMenuOpen(false)}
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
