import { useState, useEffect, FormEvent } from 'react';
import { useLocation } from 'wouter';
import { Lock, Save, ArrowLeft, Settings, Calendar, Clock, ToggleLeft, ToggleRight, CheckCircle2, Info, Mail, User, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { ExamSettings } from '../types';

export default function Admin() {
  const [, setLocation] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Password Reset State
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  const [settings, setSettings] = useState<ExamSettings>({
    isActive: true,
    examDate: '15/06/2026',
    deadlineDate: '10/06/2026'
  });

  useEffect(() => {
    const storedSettings = localStorage.getItem('examSettings');
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
    
    const adminSession = sessionStorage.getItem('adminSession');
    if (adminSession === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    // Pre-defined password
    if (password === 'admin123') {
      setIsLoggedIn(true);
      sessionStorage.setItem('adminSession', 'true');
      setError('');
    } else {
      setError('Senha incorreta');
    }
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    localStorage.setItem('examSettings', JSON.stringify(settings));
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleResetPassword = (e: FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    // In a real app, this would call an API.
    // For this demo, we'll store the reset in localStorage.
    const resets = JSON.parse(localStorage.getItem('passwordResets') || '{}');
    resets[resetEmail] = 'A123456b!';
    localStorage.setItem('passwordResets', JSON.stringify(resets));

    setResetSuccess(true);
    setResetEmail('');
    setResetError('');
    setTimeout(() => setResetSuccess(false), 5000);
  };

  if (!isLoggedIn) {
    return (
      <Layout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm mx-auto space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <Lock className="text-primary" size={32} />
            </div>
            <h2 className="text-2xl font-bold uppercase tracking-tight">Acesso Restrito</h2>
            <p className="text-white/40 text-sm">Digite a senha administrativa para continuar.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="password"
                placeholder="Senha administrativa"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-secondary/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
            {error && <p className="text-primary text-xs text-center font-bold">{error}</p>}
            <button
              type="submit"
              className="w-full bg-primary hover:bg-red-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              Entrar no Painel ADM
            </button>
          </form>

          <button
            onClick={() => setLocation('/')}
            className="w-full text-white/40 hover:text-white transition-colors text-xs uppercase font-bold tracking-widest"
          >
            Voltar para o Login
          </button>
        </motion.div>
      </Layout>
    );
  }

  return (
    <Layout showLogout onLogout={() => sessionStorage.removeItem('adminSession')}>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full space-y-6 max-w-lg mx-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Settings className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight">Painel ADM</h2>
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Configurações do Sistema</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-secondary/30 border border-white/10 rounded-3xl p-6 space-y-8">
          <div className="space-y-6">
            {/* Active Period Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="space-y-1">
                <p className="font-bold text-sm">Período de Exame Ativo</p>
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Habilita o botão para os alunos</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, isActive: !prev.isActive }))}
                className={`transition-colors ${settings.isActive ? 'text-green-500' : 'text-white/20'}`}
              >
                {settings.isActive ? <ToggleRight size={48} /> : <ToggleLeft size={48} />}
              </button>
            </div>

            {/* Exam Date */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-1 flex items-center gap-1">
                <Calendar size={12} />
                Data do Exame de Faixa
              </label>
              <input
                type="text"
                placeholder="Ex: 15/06/2026"
                value={settings.examDate}
                onChange={(e) => setSettings(prev => ({ ...prev, examDate: e.target.value }))}
                className="w-full bg-secondary/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>

            {/* Deadline Date */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-1 flex items-center gap-1">
                <Clock size={12} />
                Data Limite para Inscrições
              </label>
              <input
                type="text"
                placeholder="Ex: 10/06/2026"
                value={settings.deadlineDate}
                onChange={(e) => setSettings(prev => ({ ...prev, deadlineDate: e.target.value }))}
                className="w-full bg-secondary/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-red-700 text-white font-bold py-5 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-primary/30 flex items-center justify-center gap-2"
          >
            {success ? (
              <>
                <CheckCircle2 size={20} />
                Configurações Salvas!
              </>
            ) : (
              <>
                <Save size={20} />
                Salvar Alterações
              </>
            )}
          </button>
        </form>

        {/* Password Reset Card */}
        <div className="bg-secondary/30 border border-white/10 rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <ShieldAlert className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="font-bold uppercase tracking-tight">Resetar Senha de Aluno</h3>
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Forçar senha padrão para acesso</p>
            </div>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-1 flex items-center gap-1">
                <Mail size={12} />
                E-mail do Aluno / Responsável
              </label>
              <input
                type="email"
                placeholder="exemplo@email.com"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full bg-secondary/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>

            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
              <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">Nova Senha Temporária:</p>
              <p className="font-mono text-lg font-bold tracking-wider text-white">A123456b!</p>
            </div>

            <button
              type="submit"
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {resetSuccess ? (
                <>
                  <CheckCircle2 size={20} className="text-green-500" />
                  Senha Resetada com Sucesso!
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Resetar para Senha Padrão
                </>
              )}
            </button>
          </form>
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex gap-3">
          <Info size={20} className="text-white/40 shrink-0" />
          <p className="text-xs text-white/40 leading-relaxed">
            As alterações feitas aqui refletem instantaneamente para todos os alunos e senseis. 
            Certifique-se de que as datas estão no formato correto (DD/MM/AAAA).
          </p>
        </div>
      </motion.div>
    </Layout>
  );
}
