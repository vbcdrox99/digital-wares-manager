import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Lock, Mail, Shield, Gamepad2, UserCheck, IdCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
  const [cpf, setCpf] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Definir título da página
  useEffect(() => {
    document.title = isLogin ? 'Login - Dotaplay' : 'Cadastro de Vendedor - Dotaplay';
  }, [isLogin]);

  // Página de cadastro não redireciona automaticamente

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      if (!email || !password) {
        setError('Por favor, informe email e senha');
        setLoading(false);
        return;
      }
    } else {
      // Validações básicas de cadastro de vendedor
      if (!email || !password || !confirmPassword || !name || !steamId || !cpf) {
        setError('Por favor, preencha todos os campos');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('As senhas não coincidem');
        setLoading(false);
        return;
      }

      if (!/^\d{11}$/.test(cpf)) {
        setError('CPF deve conter exatamente 11 dígitos numéricos');
        setLoading(false);
        return;
      }

      if (!/^\d{17}$/.test(steamId)) {
        setError('A conta Steam deve conter exatamente 17 dígitos (ex: 76561198262445629)');
        setLoading(false);
        return;
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
    }

    try {
      if (isLogin) {
        const result = await login(email, password);
        if (result.success) {
          // Após login, verificar se é vendedor aprovado para redirecionar
          try {
            const { data: seller } = await supabase
              .from('sellers')
              .select('status')
              .eq('email', email)
              .maybeSingle();

            if (seller && seller.status === 'approved') {
              navigate('/area-do-vendedor');
            } else {
              navigate('/');
            }
          } catch (_) {
            navigate('/');
          }
        } else {
          setError(result.error || 'Falha no login');
        }
      } else {
        // 1) Criar conta de autenticação do usuário no Supabase (signUp)
        // Isso garante que o login funcione depois, evitando "Invalid login credentials"
        const regResult = await register(email, password, { name, steam_id: steamId });

        if (!regResult.success) {
          // Se já existir usuário, seguimos com o cadastro de vendedor
          const msg = (regResult.error || '').toLowerCase();
          const alreadyExistsHints = ['already', 'existe', 'registered', 'registrado'];
          const isAlreadyRegistered = alreadyExistsHints.some(h => msg.includes(h));

          if (!isAlreadyRegistered) {
            setError(regResult.error || 'Erro ao criar conta de acesso.');
            setLoading(false);
            return;
          }
        }

        // 2) Inserir solicitação de cadastro na tabela sellers com status pendente
        const { error: insertError } = await supabase
          .from('sellers')
          .insert({
            name,
            email,
            cpf,
            steam_id: steamId,
            status: 'pending',
            approved: false
          });

        if (insertError) {
          console.error('Erro ao cadastrar vendedor:', insertError);
          // Tratamento amigável para violação de unique
          if ((insertError as any).code === '23505') {
            const msg = (insertError.message || '').toLowerCase();
            if (msg.includes('sellers_email_unique')) {
              setError('Este email já está cadastrado como vendedor.');
            } else if (msg.includes('sellers_cpf_unique')) {
              setError('Este CPF já está cadastrado como vendedor.');
            } else if (msg.includes('sellers_steam_id_unique')) {
              setError('Esta conta Steam já está cadastrada como vendedor.');
            } else {
              setError('Cadastro já existente (dados duplicados).');
            }
          } else {
            setError(insertError.message || 'Erro ao enviar cadastro');
          }
        } else {
          setSuccess('Cadastro enviado! Aguarde aprovação no painel ADMIN.');
          // Observação: se sua instância do Supabase exigir confirmação de email,
          // o login só funcionará após o usuário confirmar o email.
          // Caso deseje, posso ajustar para desabilitar a confirmação em dev ou usar magic link.
          // Limpar formulário
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setName('');
          setSteamId('');
          setCpf('');
          // Redirecionar após breve delay
          setTimeout(() => navigate('/'), 1500);
        }
      }
    } catch (error) {
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const formatCpfInput = (value: string) => value.replace(/\D/g, '').slice(0, 11);

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
                <Shield className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {isLogin ? 'Entrar' : 'Cadastro de Vendedor'}
              </h1>
              <p className="text-gray-400">
                {isLogin ? 'Acesse sua conta para continuar' : 'Preencha seus dados para solicitar aprovação como vendedor.'}
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

              {/* Nome */}
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

              {/* CPF */}
              {!isLogin && (
              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-300 mb-2">
                  CPF (apenas dígitos)
                </label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="cpf"
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(formatCpfInput(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    placeholder="Ex.: 12345678901"
                    maxLength={11}
                    required
                  />
                </div>
              </div>
              )}

              {/* Steam ID Field */}
              {!isLogin && (
              <div>
                <label htmlFor="steamId" className="block text-sm font-medium text-gray-300 mb-2">
                  Conta Steam (17 dígitos)
                </label>
                <div className="relative">
                  <Gamepad2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="steamId"
                    type="text"
                    value={steamId}
                    onChange={(e) => setSteamId(e.target.value.replace(/\D/g, '').slice(0, 17))}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    placeholder="Ex.: 76561198262445629"
                    maxLength={17}
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

              {/* Confirmar Senha */}
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

              {/* Success Message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm"
                >
                  {success}
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
                    {isLogin ? 'Entrando...' : 'Enviando cadastro...'}
                  </div>
                ) : (
                  isLogin ? 'Entrar' : 'Cadastrar como Vendedor'
                )}
              </motion.button>
            </form>

            {/* Info */}
            {!isLogin && (
              <div className="mt-6 text-center text-gray-400 text-sm">
                Seu cadastro ficará pendente até aprovação no painel ADMIN.
              </div>
            )}

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
                  <span>Solicitações são avaliadas e aprovadas pelo ADMIN.</span>
                </div>
              </motion.div>
            )}

            {/* Toggle Mode */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
                className="mt-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                {isLogin ? 'Quero me cadastrar como vendedor' : 'Já tenho conta, fazer login'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;