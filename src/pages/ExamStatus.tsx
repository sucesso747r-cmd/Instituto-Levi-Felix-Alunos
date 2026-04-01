import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Clock, Check, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import useAuth from '../hooks/useAuth';
import { apiRequest } from '../lib/queryClient';

interface ExamPeriod {
  id: number;
  active: boolean;
  exam_date: string;
  registration_deadline: string;
  exam_price: number;
  pix_key: string;
}

interface ExamCurrentResponse {
  period: ExamPeriod | null;
  evaluation: { is_eligible: boolean } | null;
  registration: { payment_status: 'PENDENTE' | 'CONFIRMADO' } | null;
}

const getNextBelt = (currentBelt: string) => {
  const belts: string[] = ['Branca', 'Amarela', 'Vermelha', 'Laranja', 'Verde', 'Roxa', 'Marrom', 'Preta'];
  const currentIndex = belts.indexOf(currentBelt);
  if (currentIndex !== -1 && currentIndex < belts.length - 1) {
    return belts[currentIndex + 1];
  }
  return currentBelt;
};

const getRemainingDays = (deadlineStr: string) => {
  // deadlineStr is in YYYY-MM-DD format
  const [year, month, day] = deadlineStr.split('-').map(Number);
  const deadline = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export default function ExamStatusPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();

  const { data, isLoading: examLoading } = useQuery<ExamCurrentResponse>({
    queryKey: ['exam', 'current'],
    queryFn: async () => {
      const res = await apiRequest('/api/exam/current');
      return res.json();
    },
    enabled: !!user,
  });

  const period = data?.period ?? null;

  useEffect(() => {
    if (!examLoading && data !== undefined && (!period || !period.active)) {
      setLocation('/exam-inactive');
    }
  }, [examLoading, data, period, setLocation]);

  if (authLoading || examLoading || !user || !data) return null;
  if (!period || !period.active) return null;

  const evaluation = data.evaluation;
  const registration = data.registration;

  const isEligible = evaluation?.is_eligible === true;
  const nextBelt = getNextBelt(user.current_belt);
  const remainingDays = getRemainingDays(period.registration_deadline);
  const examDateDisplay = formatDate(period.exam_date);
  const deadlineDateDisplay = formatDate(period.registration_deadline);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full space-y-6"
      >
        <button
          onClick={() => setLocation('/home')}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-2"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Exame de Faixa</h2>
          <p className="text-white/50 text-sm">Acompanhe sua elegibilidade e status de inscrição.</p>
        </div>

        <div className="bg-secondary/30 border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div className="flex flex-col gap-1">
              <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Sua Faixa Atual</span>
              <span className="font-bold text-xl">{user.current_belt}</span>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Pretendida</span>
              <span className="font-bold text-xl">{nextBelt}</span>
            </div>
            <Award className="text-primary/50" size={32} />
          </div>

          <div className="p-6 space-y-8">
            {registration === null ? (
              <div className="space-y-8">
                <div className="text-center space-y-6">
                  {isEligible ? (
                    <div className="space-y-4">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full border border-green-500/20">
                        <CheckCircle2 size={40} className="text-green-500" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-medium leading-relaxed">
                          Você está <span className="text-green-500 font-black uppercase tracking-tight">APTO</span> para fazer o exame para a Faixa <span className="text-white font-bold">{nextBelt}</span> no dia <span className="text-white font-bold">{examDateDisplay}</span>.
                        </p>
                        <p className="text-white/40 text-sm">Avaliação realizada pelo Sensei</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full border border-primary/20">
                        <XCircle size={40} className="text-primary" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-medium leading-relaxed">
                          Você está <span className="text-primary font-black uppercase tracking-tight">INAPTO</span> para fazer o exame no dia <span className="text-white font-bold">{examDateDisplay}</span>.
                        </p>
                        <p className="text-white/40 text-sm">Avaliação realizada pelo Sensei</p>
                      </div>
                    </div>
                  )}
                </div>

                {isEligible && (
                  <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                      <AlertCircle size={20} className="text-primary" />
                    </div>
                    <p className="text-primary text-sm font-semibold">
                      Atenção: Inscrições abertas até o dia <span className="underline decoration-2 underline-offset-4">{deadlineDateDisplay}</span> (você tem mais <span className="font-bold">{remainingDays} dias</span> para concluir sua inscrição!)
                    </p>
                  </div>
                )}

                {isEligible ? (
                  <button
                    onClick={() => setLocation('/exam-registration')}
                    className="w-full bg-primary hover:bg-red-700 text-white font-bold py-5 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-primary/30 flex items-center justify-center gap-2"
                  >
                    Quero me inscrever para o Exame de Faixa
                    <ArrowLeft size={20} className="rotate-180" />
                  </button>
                ) : (
                  <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center">
                    <p className="text-white/70 text-base leading-relaxed">
                      Continue se dedicando e converse com o Sensei. <br/>
                      <span className="text-white font-bold">Faça seu planejamento com ele(a).</span>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                <div className="text-center space-y-6">
                  <div className="space-y-2">
                    <p className="text-white/60 text-sm uppercase font-bold tracking-widest">Inscrição Confirmada</p>
                    <p className="text-lg">
                      Você está inscrito(a) para o Exame de Faixa do dia <span className="font-bold text-white">{examDateDisplay}</span>.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-white/40 text-xs uppercase font-bold">Status do Pagamento</p>
                    {registration.payment_status === 'PENDENTE' ? (
                      <div className="flex flex-col items-center gap-3 p-6 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl">
                        <Clock size={32} className="text-yellow-500 animate-pulse" />
                        <span className="text-yellow-500 font-black uppercase text-xl tracking-tighter">PENDENTE DE PAGAMENTO</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 p-6 bg-green-500/5 border border-green-500/20 rounded-2xl">
                        <Check size={32} className="text-green-500" />
                        <span className="text-green-500 font-black uppercase text-xl tracking-tighter">OK CONFIRMADO</span>
                      </div>
                    )}
                  </div>
                </div>

                {registration.payment_status === 'PENDENTE' && (
                  <button
                    onClick={() => setLocation('/exam-registration')}
                    className="w-full bg-white text-black hover:bg-white/90 font-bold py-5 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    Ver dados de pagamento (PIX)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
