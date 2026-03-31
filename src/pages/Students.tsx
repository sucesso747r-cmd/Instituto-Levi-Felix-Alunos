import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { ArrowLeft, User, Lock, CheckCircle2, ShieldAlert } from 'lucide-react';
import Layout from '../components/Layout';
import { apiRequest } from '../lib/queryClient';

interface AdminUser {
  id: number;
  student_name: string;
  email: string;
  current_belt: string;
  class_group: string;
  is_sensei: boolean;
}

export default function Students() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

  const [userResetSuccess, setUserResetSuccess] = useState<Record<number, boolean>>({});
  const [userResetError, setUserResetError] = useState<Record<number, string>>({});

  // Verify admin session — redirect to /admin on error
  useQuery({
    queryKey: ['admin', 'exam-period'],
    retry: false,
    queryFn: async () => {
      const res = await apiRequest('/api/admin/exam-period');
      return res.json();
    },
    throwOnError: false,
    meta: {
      onError: () => setLocation('/admin'),
    },
  });

  const { data: users = [] } = useQuery<AdminUser[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await apiRequest('/api/admin/users');
      return res.json();
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest(`/api/admin/users/${userId}/reset-password`, { method: 'POST' });
      return userId;
    },
    onSuccess: (userId) => {
      setUserResetSuccess((prev) => ({ ...prev, [userId]: true }));
      setTimeout(() => setUserResetSuccess((prev) => ({ ...prev, [userId]: false })), 3000);
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err, userId) => {
      const msg = err instanceof Error ? err.message : 'Erro ao resetar senha';
      setUserResetError((prev) => ({ ...prev, [userId]: msg }));
      setTimeout(() => setUserResetError((prev) => ({ ...prev, [userId]: '' })), 4000);
    },
  });

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

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full space-y-6 max-w-lg mx-auto"
      >
        <button
          onClick={() => setLocation('/admin')}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-4"
        >
          <ArrowLeft size={16} />
          Painel ADM
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <ShieldAlert className="text-primary" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight">Alunos e Senseis</h2>
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Gerenciar usuários do sistema</p>
          </div>
        </div>

        <div className="bg-secondary/30 border border-white/10 rounded-3xl p-6 space-y-4">
          {users.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-4">Nenhum usuário cadastrado.</p>
          ) : (
            users.map((u) => (
              <div key={u.id} className="space-y-1">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1 min-w-0 mr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User size={14} className="text-white/40 shrink-0" />
                      <p className="font-bold text-sm truncate">{u.student_name}</p>
                      {u.is_sensei && (
                        <span className="text-[9px] uppercase font-bold tracking-wider text-primary border border-primary/30 rounded px-1">Sensei</span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${beltPillClass(u.current_belt)}`}>
                        {u.current_belt}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs ml-5">{u.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => resetMutation.mutate(u.id)}
                    disabled={resetMutation.isPending}
                    className="shrink-0 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all active:scale-[0.98] flex items-center gap-1 disabled:opacity-50"
                  >
                    {userResetSuccess[u.id] ? (
                      <>
                        <CheckCircle2 size={14} className="text-green-500" />
                        OK
                      </>
                    ) : (
                      <>
                        <Lock size={12} />
                        Resetar Senha
                      </>
                    )}
                  </button>
                </div>
                {userResetError[u.id] && (
                  <p className="text-red-400 text-xs font-bold px-1">{userResetError[u.id]}</p>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </Layout>
  );
}
