import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Lock, Mail, Shield, Gamepad2, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [steamId, setSteamId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  // Definir título da página
  useEffect(() => {
    document.title = 'Login - Dotaplay';
  }, []);

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validações básicas
    if (isLogin) {
      if (!email || !password) {
        setError('Por favor, preencha todos os campos');
        setLoading(false);
        return;
      }
    } else {
      if (!email || !password || !confirmPassword || !name || !steamId) {
        setError('Por favor, preencha todos os campos');
        setLoading(false);
        return;
      }
      
      if (password !== confirmPassword) {
        setError('As senhas não coincidem');
        setLoading(false);
        return;
      }
      
      if (!/^\d+$/.test(steamId)) {
        setError('ID Steam/Dota 2 deve conter apenas números');
        setLoading(false);
        return;
      }
    }

    if (!email.includes('@')) {
      setError('Por favor, insira um email válido');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        result = await register(email, password, { name, steam_id: steamId });
      }

      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Erro desconhecido');
      }
    } catch (error) {
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setSteamId('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <Navigation />
      
      <div className="flex items-center justify-center min-h-screen pt-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="bg-black/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mb-4"
              >
                {isLogin ? <User className="w-8 h-8 text-white" /> : <Shield className="w-8 h-8 text-white" />}
              </motion.div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {isLogin ? 'Entrar' : 'Criar Conta'}
              </h1>
              <p className="text-gray-400">
                {isLogin 
                  ? 'Acesse sua conta para continuar' 
                  : 'Crie sua conta para começar'
                }
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              {/* Name Field - Only for registration */}
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Nome
                  </label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Steam ID Field - Only for registration */}
              {!isLogin && (
                <div>
                  <label htmlFor="steamId" className="block text-sm font-medium text-gray-300 mb-2">
                    ID Steam/ID Dota 2
                  </label>
                  <div className="relative">
                    <Gamepad2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="steamId"
                      type="text"
                      value={steamId}
                      onChange={(e) => setSteamId(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      placeholder="123456789"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field - Only for registration */}
              {!isLogin && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isLogin ? 'Entrando...' : 'Criando conta...'}
                  </div>
                ) : (
                  isLogin ? 'Entrar' : 'Criar Conta'
                )}
              </motion.button>
            </form>

            {/* Toggle Mode */}
            <div className="mt-6 text-center">
              <p className="text-gray-400">
                {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              </p>
              <button
                type="button"
                onClick={toggleMode}
                className="mt-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                {isLogin ? 'Criar nova conta' : 'Fazer login'}
              </button>
            </div>

            {/* Admin Info */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
              >
                <div className="flex items-center text-blue-400 text-sm">
                  <Shield className="w-4 h-4 mr-2" />
                  <span>A primeira conta criada terá privilégios de administrador</span>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;