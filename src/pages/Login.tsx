import { useState, FormEvent } from 'react';
import { useLocation } from 'wouter';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { apiRequest } from '../lib/queryClient';

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setForgotSuccess(false);
    setLoading(true);
    try {
      await apiRequest('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setLocation('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Digite seu e-mail para recuperar a senha');
      setForgotSuccess(false);
      return;
    }
    setError('');
    setForgotSuccess(false);
    try {
      await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setForgotSuccess(true);
      setError('E-mail de recuperação enviado!');
    } catch (err) {
      setForgotSuccess(false);
      setError(err instanceof Error ? err.message : 'Erro ao enviar e-mail');
    }
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="email"
                placeholder="E-mail do responsável"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-secondary/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-secondary/50 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-3 border rounded-xl text-xs font-bold text-center ${
                forgotSuccess
                  ? 'bg-green-500/10 border-green-500/20 text-green-500'
                  : 'bg-primary/10 border-primary/20 text-primary'
              }`}
            >
              {error}
            </motion.div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-white/50 text-xs hover:text-white transition-colors"
            >
              Esqueceu a senha?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-red-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Acessar Área do Aluno
            <ArrowRight size={20} />
          </button>
        </form>

        <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-2xl text-center">
          <p className="text-white/60 text-sm mb-3">Ainda não tem acesso?</p>
          <a
            href="https://wa.me/5519998098584?text=Olá,%20quero%20acessar%20a%20Área%20dos%20Alunos%20do%20Site"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white font-medium hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto"
          >
            Solicite seu cadastro clicando aqui
            <ArrowRight size={16} />
          </a>
        </div>
      </motion.div>
    </Layout>
  );
}
