import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Shield, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Verificando autenticação...</p>
        </motion.div>
      </div>
    );
  }

  // Redirecionar para login se não estiver autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar se precisa ser admin e o usuário não é admin
  if (requireAdmin && !isAdmin()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-md"
        >
          <div className="bg-black/40 backdrop-blur-sm border border-red-500/20 rounded-2xl p-8 shadow-2xl">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full mb-6"
            >
              <Lock className="w-8 h-8 text-white" />
            </motion.div>
            
            <h1 className="text-2xl font-bold text-white mb-4">
              Acesso Negado
            </h1>
            
            <p className="text-gray-400 mb-6">
              Você não tem permissão para acessar esta área. 
              Apenas administradores podem visualizar esta página.
            </p>
            
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-6">
              <Shield className="w-4 h-4" />
              <span>Área restrita para administradores</span>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all"
            >
              Voltar
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Se passou por todas as verificações, renderizar o conteúdo
  return <>{children}</>;
};

export default ProtectedRoute;