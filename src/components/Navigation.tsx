import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  className?: string;
}

const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className={`relative z-20 border-b border-white/10 bg-black/20 backdrop-blur-sm ${className}`}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-gaming rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">
              Dota Play Brasil
            </h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className={`transition-colors ${
                isActive('/') 
                  ? 'text-foreground hover:text-primary' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              Início
            </Link>
            <Link 
              to="/catalog" 
              className={`transition-colors ${
                isActive('/catalog') 
                  ? 'text-foreground hover:text-primary' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              Catálogo
            </Link>
            <Link 
              to="/sobre" 
              className={`transition-colors ${
                isActive('/sobre') 
                  ? 'text-foreground hover:text-primary' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              Sobre
            </Link>
            <Link 
              to="/faq" 
              className={`transition-colors ${
                isActive('/faq') 
                  ? 'text-foreground hover:text-primary' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              FAQ
            </Link>
            {isAdmin() && (
              <Link 
                to="/admin" 
                className={`transition-colors ${
                  isActive('/admin') 
                    ? 'text-foreground hover:text-primary' 
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                Admin
              </Link>
            )}
            
            {/* Auth Buttons */}
            <div className="flex items-center space-x-4 ml-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span className="text-gray-300">{user.email}</span>
                    {user.role === 'admin' && (
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-2 py-1 rounded-full text-xs font-semibold">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sair</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Login</span>
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navigation;