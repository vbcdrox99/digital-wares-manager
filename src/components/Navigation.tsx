import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useIsMobile } from '../hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface NavigationProps {
  className?: string;
}

const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sellerApproved, setSellerApproved] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Fechar o menu mobile ao navegar para outra rota
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;
    const checkSeller = async () => {
      if (!user?.email) {
        setSellerApproved(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('sellers')
          .select('status')
          .eq('email', user.email)
          .maybeSingle();
        if (!cancelled) {
          setSellerApproved(!!data && (data as any).status === 'approved');
        }
      } catch (_) {
        if (!cancelled) setSellerApproved(false);
      }
    };
    checkSeller();
    return () => { cancelled = true; };
  }, [user?.email]);

  return (
    <div className={cn("fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-300 pointer-events-none", isScrolled ? "pt-4" : "pt-0")}>
      <header 
        className={cn(
          "pointer-events-auto transition-all duration-500 ease-in-out border-white/10 backdrop-blur-md bg-black/20",
          isScrolled 
            ? "w-[90%] md:w-[80%] rounded-2xl border shadow-lg shadow-black/20" 
            : "w-full border-b",
          className
        )}
      >
        <div className={cn("container mx-auto px-6 transition-all duration-300", isScrolled ? "py-1" : "py-4")}>
          <div className="flex items-center justify-between">
            <Link
              to="/"
              aria-label="Ir para página inicial"
              className="flex items-center hover:opacity-90 transition-opacity"
            >
              <div className={cn(
                "bg-gradient-gaming rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20 transition-all duration-300",
                isScrolled ? "w-7 h-7" : "w-8 h-8"
              )}>
                <Package className="h-5 w-5 text-white" />
              </div>
              <h1 className={cn(
                "font-bold text-white drop-shadow-lg tracking-tight transition-all duration-300 overflow-hidden whitespace-nowrap",
                isScrolled ? "text-lg md:text-xl" : "text-xl md:text-2xl",
                isScrolled && isMobile ? "max-w-0 opacity-0 ml-0" : "max-w-[300px] opacity-100 ml-2"
              )}>
                Dota Play Brasil
              </h1>
            </Link>
          {/* Navegação Desktop */}
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
              to="/sorteio" 
              className={`transition-colors ${
                isActive('/sorteio') 
                  ? 'text-foreground hover:text-primary' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              Sorteio
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
              to="/quero-vender" 
              className={`transition-colors ${
                isActive('/quero-vender') 
                  ? 'text-foreground hover:text-primary' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              Quero Vender
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
            {sellerApproved && (
              <Link 
                to="/area-do-vendedor" 
                className={`transition-colors ${
                  isActive('/area-do-vendedor') 
                    ? 'text-foreground hover:text-primary' 
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                Área do Vendedor
              </Link>
            )}
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
                  className={cn(
                    "flex items-center space-x-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all",
                    isScrolled ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm font-medium"
                  )}
                >
                  <User className={cn("transition-all", isScrolled ? "w-3 h-3" : "w-4 h-4")} />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </nav>

          {/* Controles Mobile (hamburger + auth) */}
          <div className="flex md:hidden items-center space-x-3">
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-300 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Sair</span>
              </button>
            ) : (
              <Link
                to="/login"
                className={cn(
                  "flex items-center space-x-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all text-sm",
                  isScrolled ? "px-2 py-1" : "px-3 py-1.5"
                )}
              >
                <User className={cn("transition-all", isScrolled ? "w-3 h-3" : "w-4 h-4")} />
                <span className="font-medium">Login</span>
              </Link>
            )}
            <button
              aria-label="Abrir menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileOpen((v) => !v)}
              className={cn(
                "rounded-md border border-white/10 text-white hover:bg-white/10 transition-all",
                isScrolled ? "p-1" : "p-2"
              )}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menu Mobile Dropdown */}
        {mobileOpen && (
          <div
            id="mobile-menu"
            className="md:hidden mt-4 grid grid-cols-1 gap-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-4"
          >
            <Link
              to="/"
              className={`block px-2 py-2 rounded-md transition-colors ${
                isActive('/') ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:bg-white/5'
              }`}
            >
              Início
            </Link>
            <Link
              to="/catalog"
              className={`block px-2 py-2 rounded-md transition-colors ${
                isActive('/catalog') ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:bg-white/5'
              }`}
            >
              Catálogo
            </Link>
            <Link
              to="/sorteio"
              className={`block px-2 py-2 rounded-md transition-colors ${
                isActive('/sorteio') ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:bg-white/5'
              }`}
            >
              Sorteio
            </Link>
            <Link
              to="/sobre"
              className={`block px-2 py-2 rounded-md transition-colors ${
                isActive('/sobre') ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:bg-white/5'
              }`}
            >
              Sobre
            </Link>
            <Link
              to="/quero-vender"
              className={`block px-2 py-2 rounded-md transition-colors ${
                isActive('/quero-vender') ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:bg-white/5'
              }`}
            >
              Quero Vender
            </Link>
            <Link
              to="/faq"
              className={`block px-2 py-2 rounded-md transition-colors ${
                isActive('/faq') ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:bg-white/5'
              }`}
            >
              FAQ
            </Link>
            {sellerApproved && (
              <Link
                to="/area-do-vendedor"
                className={`block px-2 py-2 rounded-md transition-colors ${
                  isActive('/area-do-vendedor') ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:bg-white/5'
                }`}
              >
                Área do Vendedor
              </Link>
            )}
            {isAdmin() && (
              <Link
                to="/admin"
                className={`block px-2 py-2 rounded-md transition-colors ${
                  isActive('/admin') ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:bg-white/5'
                }`}
              >
                Admin
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
    </div>
  );
};

export default Navigation;