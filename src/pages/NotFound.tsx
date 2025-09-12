import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Package } from "lucide-react";
import Navigation from "../components/Navigation";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0.6))]" />
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10" />
      
      {/* Navigation */}
      <Navigation />
      
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4 text-white">404</h1>
          <p className="text-xl text-gray-300 mb-8">Oops! Página não encontrada</p>
          <Link to="/" className="inline-flex items-center px-6 py-3 bg-gradient-gaming text-white rounded-lg hover:opacity-90 transition-opacity">
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
