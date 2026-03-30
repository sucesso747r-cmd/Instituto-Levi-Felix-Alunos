import { useLocation } from 'wouter';
import { BookOpen, Award, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import useAuth from '../hooks/useAuth';
import { apiRequest } from '../lib/queryClient';

interface ExamPeriod {
  id: number;
  active: boolean;
  exam_date: string;
  deadline_date: string;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: period, isLoading: examLoading } = useQuery<ExamPeriod | null>({
    queryKey: ['exam', 'current'],
    queryFn: async () => {
      const res = await fetch('/api/exam/current', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch exam period');
      }
      return res.json();
    },
    staleTime: 60_000,
  });

  if (authLoading || examLoading) return null;
  if (!user) return null;

  const handleLogout = async () => {
    await apiRequest('/api/auth/logout', { method: 'POST' });
    queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    setLocation('/');
  };

  const firstName = user.student_name.split(' ')[0];
  const examActive = period !== null && period !== undefined && period.active === true;

  return (
    <Layout showLogout onLogout={handleLogout}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Bem-vindo, {firstName}!</h2>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white/70">
            <ShieldCheck size={14} className="text-primary" />
            Graduação Atual: <span className="text-white font-bold">{user.current_belt}</span>
          </div>
        </div>

        <div className="grid gap-4">
          <button
            onClick={() => window.open('https://i9star.com.br', '_blank')}
            className="group w-full bg-secondary/50 hover:bg-white/10 border border-white/10 rounded-2xl p-6 flex items-center gap-5 transition-all active:scale-[0.98]"
          >
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <BookOpen size={28} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-lg">Guia do Karatê</h3>
              <p className="text-white/40 text-sm">Acesse o guia exclusivo para alunos do Instituto.</p>
            </div>
            <ArrowRight size={20} className="text-white/20 group-hover:text-white transition-colors" />
          </button>

          {!user.is_sensei && (
            <button
              onClick={() => setLocation(examActive ? '/exam-status' : '/exam-inactive')}
              className="group w-full bg-secondary/50 hover:bg-white/10 border border-white/10 rounded-2xl p-6 flex items-center gap-5 transition-all active:scale-[0.98]"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <Award size={28} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg">Exame de Faixa</h3>
                <p className="text-white/40 text-sm">
                  {examActive
                    ? 'Confira seu status e inscreva-se para o próximo exame.'
                    : 'Período de exame indisponível no momento.'}
                </p>
              </div>
              <ArrowRight size={20} className="text-white/20 group-hover:text-white transition-colors" />
            </button>
          )}

          {user.is_sensei && (
            <button
              onClick={() => setLocation('/sensei-dashboard')}
              className="group w-full bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-2xl p-6 flex items-center gap-5 transition-all active:scale-[0.98]"
            >
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-white">
                <ShieldCheck size={28} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg">Painel do Sensei</h3>
                <p className="text-white/40 text-sm">Gerencie os exames de faixa dos seus alunos.</p>
              </div>
              <ArrowRight size={20} className="text-white/20 group-hover:text-white transition-colors" />
            </button>
          )}
        </div>
      </motion.div>
    </Layout>
  );
}
