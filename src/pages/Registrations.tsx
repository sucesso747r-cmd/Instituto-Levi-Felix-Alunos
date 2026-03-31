import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, Clock, Check } from 'lucide-react';
import Layout from '../components/Layout';
import { apiRequest } from '../lib/queryClient';

interface RegistrationItem {
  registration: {
    id: number;
    target_belt: string;
    payment_status: string;
    confirmed_at: string | null;
  };
  user: {
    id: number;
    student_name: string;
    email: string;
    current_belt: string;
    class_group: string | null;
  };
}

export default function Registrations() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

  const [paymentSuccess, setPaymentSuccess] = useState<Record<number, boolean>>({});
  const [paymentError, setPaymentError] = useState<Record<number, string>>({});

  // Auth guard: verify admin session on mount
  const { isError } = useQuery({
    queryKey: ['admin', 'exam-period'],
    enabled: true,
    retry: false,
    queryFn: async () => {
      const res = await apiRequest('/api/admin/exam-period');
      return res.json();
    },
  });

  useEffect(() => {
    if (isError) {
      setLocation('/admin');
    }
  }, [isError, setLocation]);

  const { data: registrations = [], isLoading } = useQuery<RegistrationItem[]>({
    queryKey: ['admin', 'registrations'],
    queryFn: async () => {
      const res = await apiRequest('/api/admin/registrations');
      return res.json();
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/admin/registrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'CONFIRMADO' }),
      });
    },
    onSuccess: (_data, id) => {
      setPaymentSuccess((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => setPaymentSuccess((prev) => ({ ...prev, [id]: false })), 3000);
      qc.invalidateQueries({ queryKey: ['admin', 'registrations'] });
    },
    onError: (err, id) => {
      const msg = err instanceof Error ? err.message : 'Erro ao confirmar pagamento';
      setPaymentError((prev) => ({ ...prev, [id]: msg }));
      setTimeout(() => setPaymentError((prev) => ({ ...prev, [id]: '' })), 4000);
    },
  });

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-bold"
          >
            <ArrowLeft size={16} />
            Painel ADM
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <Clock className="text-primary" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight">Inscrições</h2>
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">
              Gerenciar pagamentos de inscrições
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-secondary/30 border border-white/10 rounded-3xl p-6">
          {isLoading && (
            <p className="text-white/40 text-sm text-center py-8">Carregando...</p>
          )}

          {!isLoading && registrations.length === 0 && (
            <p className="text-white/40 text-sm text-center py-8">
              Nenhuma inscrição encontrada.
            </p>
          )}

          {!isLoading && registrations.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-[10px] uppercase font-bold tracking-widest text-white/40 pb-3 pr-4 whitespace-nowrap">
                      Aluno
                    </th>
                    <th className="text-left text-[10px] uppercase font-bold tracking-widest text-white/40 pb-3 pr-4 whitespace-nowrap">
                      Faixa Atual
                    </th>
                    <th className="text-left text-[10px] uppercase font-bold tracking-widest text-white/40 pb-3 pr-4 whitespace-nowrap">
                      Faixa Pretendida
                    </th>
                    <th className="text-left text-[10px] uppercase font-bold tracking-widest text-white/40 pb-3 pr-4 whitespace-nowrap">
                      Turma
                    </th>
                    <th className="text-left text-[10px] uppercase font-bold tracking-widest text-white/40 pb-3 pr-4 whitespace-nowrap">
                      Pagamento
                    </th>
                    <th className="text-left text-[10px] uppercase font-bold tracking-widest text-white/40 pb-3 whitespace-nowrap">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {registrations.map(({ registration, user }) => (
                    <tr key={registration.id} className="align-middle">
                      <td className="py-4 pr-4 whitespace-nowrap">
                        <p className="font-bold truncate max-w-[160px]">{user.student_name}</p>
                        <p className="text-white/40 text-xs truncate max-w-[160px]">{user.email}</p>
                      </td>
                      <td className="py-4 pr-4 whitespace-nowrap text-white/70">
                        {user.current_belt}
                      </td>
                      <td className="py-4 pr-4 whitespace-nowrap text-white/70">
                        {registration.target_belt}
                      </td>
                      <td className="py-4 pr-4 whitespace-nowrap text-white/40">
                        {user.class_group ?? '—'}
                      </td>
                      <td className="py-4 pr-4 whitespace-nowrap">
                        {registration.payment_status === 'CONFIRMADO' ? (
                          <span className="inline-flex items-center gap-1 bg-green-500/15 text-green-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-green-500/20">
                            <Check size={10} />
                            CONFIRMADO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-yellow-400/15 text-yellow-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-yellow-400/20">
                            <Clock size={10} />
                            PENDENTE
                          </span>
                        )}
                      </td>
                      <td className="py-4 whitespace-nowrap">
                        {registration.payment_status === 'PENDENTE' ? (
                          <div className="space-y-1">
                            {paymentSuccess[registration.id] ? (
                              <span className="flex items-center gap-1 text-green-400 text-xs font-bold">
                                <CheckCircle2 size={14} />
                                Confirmado!
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => confirmPaymentMutation.mutate(registration.id)}
                                disabled={confirmPaymentMutation.isPending}
                                className="flex items-center gap-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 text-xs font-bold py-2 px-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
                              >
                                <CheckCircle2 size={14} />
                                Confirmar Pagamento
                              </button>
                            )}
                            {paymentError[registration.id] && (
                              <p className="text-red-400 text-[10px] font-bold">
                                {paymentError[registration.id]}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-white/20 text-xs font-bold">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </Layout>
  );
}
