import { useState, useEffect, FormEvent } from 'react';
import { useLocation } from 'wouter';
import { Lock, Save, Settings, Calendar, Clock, ToggleLeft, ToggleRight, CheckCircle2, Info, Mail, User, ShieldAlert, Users, ClipboardList, UserPlus, X, ChevronDown, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { apiRequest } from '../lib/queryClient';
import { BELT_SEQUENCE } from '../../shared/schema';

interface ExamPeriod {
  id: number;
  active: boolean;
  exam_date: string;
  registration_deadline: string;
  exam_price: string;
  pix_key: string;
}

interface AdminUser {
  id: number;
  student_name: string;
  email: string;
  current_belt: string;
  is_sensei: boolean;
}

interface Registration {
  id: number;
  student_name: string;
  target_belt: string;
  payment_status: string;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Password Reset State
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  // Per-user reset success/error maps
  const [userResetSuccess, setUserResetSuccess] = useState<Record<number, boolean>>({});
  const [userResetError, setUserResetError] = useState<Record<number, string>>({});

  // Payment feedback maps
  const [paymentSuccess, setPaymentSuccess] = useState<Record<number, boolean>>({});
  const [paymentError, setPaymentError] = useState<Record<number, string>>({});

  // New Student Form state
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newBelt, setNewBelt] = useState<string>(BELT_SEQUENCE[0]);
  const [newClassGroup, setNewClassGroup] = useState('');
  const [newIsSensei, setNewIsSensei] = useState(false);
  const [createUserSuccess, setCreateUserSuccess] = useState(false);
  const [createUserError, setCreateUserError] = useState('');

  const resetNewUserForm = () => {
    setNewStudentName('');
    setNewEmail('');
    setNewBelt(BELT_SEQUENCE[0]);
    setNewClassGroup('');
    setNewIsSensei(false);
    setCreateUserError('');
  };

  // Exam period form state
  const [formActive, setFormActive] = useState(true);
  const [formExamDate, setFormExamDate] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formPixKey, setFormPixKey] = useState('');

  // Fetch exam period — Bug 5: select must only return data, no setState side-effects
  const { data: examPeriod } = useQuery<ExamPeriod | null>({
    queryKey: ['admin', 'exam-period'],
    enabled: isLoggedIn,
    staleTime: 0,
    refetchOnMount: true,
    queryFn: async () => {
      const res = await apiRequest('/api/admin/exam-period');
      return res.json();
    },
    select: (data) => data,
  });

  // Bug 5: populate form via useEffect so it runs on every cache update
  useEffect(() => {
    if (examPeriod) {
      setFormActive(examPeriod.active);
      setFormExamDate(examPeriod.exam_date ?? '');
      setFormDeadline(examPeriod.registration_deadline ?? '');
      setFormPrice(examPeriod.exam_price ?? '');
      setFormPixKey(examPeriod.pix_key ?? '');
    }
  }, [examPeriod]);

  // Fetch users
  const { data: users = [] } = useQuery<AdminUser[]>({
    queryKey: ['admin', 'users'],
    enabled: isLoggedIn,
    queryFn: async () => {
      const res = await apiRequest('/api/admin/users');
      return res.json();
    },
  });

  // Fetch registrations
  const { data: registrations = [] } = useQuery<Registration[]>({
    queryKey: ['admin', 'registrations'],
    enabled: isLoggedIn,
    queryFn: async () => {
      const res = await apiRequest('/api/admin/registrations');
      return res.json();
    },
  });

  // Save exam period mutation — Bug 3: add onError feedback
  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/admin/exam-period', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active: formActive,
          examDate: formExamDate,
          registrationDeadline: formDeadline,
          examPrice: formPrice,
          pixKey: formPixKey,
        }),
      });
    },
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      qc.invalidateQueries({ queryKey: ['admin', 'exam-period'] });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar configurações';
      setSaveError(msg);
      setTimeout(() => setSaveError(''), 4000);
    },
  });

  // Confirm payment mutation — Bug 4: add success/error feedback
  const confirmPaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/admin/registrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'CONFIRMADO' }),
      });
    },
    onSuccess: (_data, variables) => {
      setPaymentSuccess((prev) => ({ ...prev, [variables]: true }));
      setTimeout(() => setPaymentSuccess((prev) => ({ ...prev, [variables]: false })), 3000);
      qc.invalidateQueries({ queryKey: ['admin', 'registrations'] });
    },
    onError: (err, variables) => {
      const msg = err instanceof Error ? err.message : 'Erro ao confirmar pagamento';
      setPaymentError((prev) => ({ ...prev, [variables]: msg }));
      setTimeout(() => setPaymentError((prev) => ({ ...prev, [variables]: '' })), 4000);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: newStudentName.trim(),
          email: newEmail.trim().toLowerCase(),
          currentBelt: newBelt,
          classGroup: newClassGroup || null,
          isSenseiFlag: newIsSensei,
        }),
      });
    },
    onSuccess: () => {
      setCreateUserSuccess(true);
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      setTimeout(() => {
        setCreateUserSuccess(false);
        setShowNewUserForm(false);
        resetNewUserForm();
      }, 2500);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar aluno';
      setCreateUserError(msg);
      setTimeout(() => setCreateUserError(''), 4000);
    },
  });

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      setIsLoggedIn(true);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Senha incorreta');
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/api/admin/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setIsLoggedIn(false);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    const user = users.find((u) => u.email === resetEmail);
    if (!user) {
      setResetError('Usuário não encontrado');
      setTimeout(() => setResetError(''), 4000);
      return;
    }
    try {
      await apiRequest(`/api/admin/users/${user.id}/reset-password`, { method: 'POST' });
      setResetSuccess(true);
      setResetEmail('');
      setResetError('');
      setTimeout(() => setResetSuccess(false), 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao resetar senha';
      setResetError(msg);
      setTimeout(() => setResetError(''), 4000);
    }
  };

  const handleCreateUser = (e: FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate();
  };

  const beltPillClass = (belt: string) => {
    const map: Record<string, string> = {
      Branca:  'bg-white/10 text-white',
      Amarela: 'bg-yellow-400/20 text-yellow-300',
      Vermelha:'bg-red-500/20 text-red-400',
      Laranja: 'bg-orange-400/20 text-orange-300',
      Verde:   'bg-green-500/20 text-green-400',
      Roxa:    'bg-purple-500/20 text-purple-400',
      Marrom:  'bg-amber-800/30 text-amber-600',
      Preta:   'bg-white/5 text-white/60 border border-white/20',
    };
    return map[belt] ?? 'bg-white/10 text-white';
  };

  const handleUserResetPassword = async (userId: number) => {
    try {
      await apiRequest(`/api/admin/users/${userId}/reset-password`, { method: 'POST' });
      setUserResetSuccess((prev) => ({ ...prev, [userId]: true }));
      setTimeout(() => setUserResetSuccess((prev) => ({ ...prev, [userId]: false })), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao resetar senha';
      setUserResetError((prev) => ({ ...prev, [userId]: msg }));
      setTimeout(() => setUserResetError((prev) => ({ ...prev, [userId]: '' })), 4000);
    }
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
    <Layout showLogout onLogout={handleLogout}>
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

        {/* Exam Period Form */}
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
                onClick={() => setFormActive((prev) => !prev)}
                className={`transition-colors ${formActive ? 'text-green-500' : 'text-white/20'}`}
              >
                {formActive ? <ToggleRight size={48} /> : <ToggleLeft size={48} />}
              </button>
            </div>

            {/* Exam Date */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-1 flex items-center gap-1">
                <Calendar size={12} />
                Data do Exame de Faixa
              </label>
              <input
                type="date"
                value={formExamDate}
                onChange={(e) => setFormExamDate(e.target.value)}
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
                type="date"
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
                className="w-full bg-secondary/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>

            {/* Exam Price — Bug 2: placeholder uses comma */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-1 flex items-center gap-1">
                <Info size={12} />
                Valor do Exame (R$)
              </label>
              <input
                type="text"
                placeholder="Ex: 150,00"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full bg-secondary/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>

            {/* PIX Key */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-1 flex items-center gap-1">
                <Info size={12} />
                Chave PIX
              </label>
              <input
                type="text"
                placeholder="Ex: contato@academia.com"
                value={formPixKey}
                onChange={(e) => setFormPixKey(e.target.value)}
                className="w-full bg-secondary/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
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
            {saveError && <p className="text-red-400 text-xs font-bold text-center">{saveError}</p>}
          </div>
        </form>

        {/* Users Section */}
        <div className="bg-secondary/30 border border-white/10 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg border border-primary/20"><Users className="text-primary" size={24} /></div>
              <div>
                <h3 className="font-bold uppercase tracking-tight">Alunos Cadastrados</h3>
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Gerenciar usuários do sistema</p>
              </div>
            </div>
            <button type="button" onClick={() => { setShowNewUserForm(p => !p); if (showNewUserForm) resetNewUserForm(); }} className={`flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl border transition-all ${showNewUserForm ? 'bg-white/10 border-white/20 text-white/70' : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'}`}>
              {showNewUserForm ? <><X size={14}/> Cancelar</> : <><UserPlus size={14}/> Cadastrar Novo Aluno</>}
            </button>
          </div>

          <AnimatePresence>
            {showNewUserForm && (
              <motion.form key="new-user-form" initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} transition={{duration:0.25}} onSubmit={handleCreateUser} className="overflow-hidden">
                <div className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">Senha padrão: <span className="font-mono text-white/70">A123456b!</span></p>
                  <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-white/40">Nome do Aluno</label><input type="text" placeholder="Ex: João Silva" required value={newStudentName} onChange={e=>setNewStudentName(e.target.value)} className="w-full bg-secondary/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-all text-sm"/></div>
                  <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-white/40">E-mail do Responsável</label><input type="email" placeholder="Ex: pai@email.com" required value={newEmail} onChange={e=>setNewEmail(e.target.value)} className="w-full bg-secondary/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-all text-sm"/></div>
                  <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-white/40">Faixa Atual</label><select required value={newBelt} onChange={e=>setNewBelt(e.target.value)} className="w-full bg-secondary/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-all text-sm">{BELT_SEQUENCE.map(b=><option key={b} value={b} className="bg-gray-900">{b}</option>)}</select></div>
                  <div className="space-y-1.5"><label className="text-[10px] uppercase font-bold tracking-widest text-white/40">Turma (opcional)</label><input type="text" placeholder="Ex: Infantil, Adulto..." value={newClassGroup} onChange={e=>setNewClassGroup(e.target.value)} className="w-full bg-secondary/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-all text-sm"/></div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5"><p className="text-sm font-bold">É Sensei?</p><button type="button" onClick={()=>setNewIsSensei(p=>!p)} className={`transition-colors ${newIsSensei?'text-primary':'text-white/20'}`}>{newIsSensei?<ToggleRight size={36}/>:<ToggleLeft size={36}/>}</button></div>
                  {createUserError && <p className="text-red-400 text-xs font-bold">{createUserError}</p>}
                  <button type="submit" disabled={createUserMutation.isPending} className="w-full bg-primary hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm">
                    {createUserSuccess ? <><CheckCircle2 size={18}/> Aluno Cadastrado!</> : createUserMutation.isPending ? 'Cadastrando...' : <><UserPlus size={16}/> Cadastrar Aluno</>}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

        </div>

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

            {resetError && <p className="text-red-400 text-xs font-bold">{resetError}</p>}

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

        {/* Registrations Section — navigate to dedicated page */}
        <button
          type="button"
          onClick={() => setLocation('/admin/registrations')}
          className="w-full bg-secondary/30 hover:bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-4 transition-all active:scale-[0.98] group"
        >
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20 group-hover:bg-primary/20 transition-colors">
            <ClipboardList className="text-primary" size={24} />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-bold uppercase tracking-tight">Inscrições</h3>
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">
              Gerenciar pagamentos de inscrições
            </p>
          </div>
          <ArrowRight size={20} className="text-white/20 group-hover:text-white transition-colors" />
        </button>
      </motion.div>
    </Layout>
  );
}
