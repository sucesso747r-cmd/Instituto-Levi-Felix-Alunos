import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Copy, Check, Info, Phone } from 'lucide-react';
import { motion } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import useAuth from '../hooks/useAuth';
import { apiRequest } from '../lib/queryClient';

interface ExamPeriod {
  exam_price: string;
  pix_key: string;
  exam_date: string;
}

interface ExamCurrentResponse {
  period: ExamPeriod | null;
  evaluation: unknown;
  registration: { payment_status: string } | null;
}

export default function ExamRegistration() {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ExamCurrentResponse>({
    queryKey: ['exam', 'current'],
    queryFn: async () => {
      const res = await apiRequest('/api/exam/current');
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/exam/register', { method: 'POST' });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['exam', 'current'] });
      setLocation('/exam-status');
    },
    onError: (error: Error) => {
      setMutationError(error.message);
    },
  });

  useEffect(() => {
    if (!isLoading && data && !data.period) {
      setLocation('/exam-inactive');
    }
  }, [isLoading, data, setLocation]);

  if (isLoading || !user) return null;

  const period = data?.period;
  const registration = data?.registration ?? null;
  if (!period) return null;

  const pixKey = period.pix_key;
  const examPrice = `R$ ${parseFloat(period.exam_price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isWhiteToYellow = user.current_belt === 'Branca';

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full space-y-6"
      >
        <button
          onClick={() => setLocation('/exam-status')}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-4"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        <div className="bg-secondary/30 border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-white/40 text-xs uppercase tracking-wider">Nome do Aluno</span>
              <span className="font-bold text-lg">{user.student_name}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white/40 text-xs uppercase tracking-wider">Graduação Atual</span>
              <span className="font-bold text-lg">{user.current_belt}</span>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 space-y-4">
            <h3 className="font-bold text-lg">Siga as instruções abaixo:</h3>
            <div className="text-white/60 text-sm space-y-2">
              <p>O preço para realizar o Exame de Faixa é de <span className="text-white font-bold">{examPrice}</span>.</p>
              <p>1. Faça o pix para a chave abaixo:</p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
              <p className="text-xs text-white/40 uppercase font-bold">Chave PIX (Celular)</p>
              <div className="flex items-center justify-between bg-background/40 p-3 rounded-lg border border-white/5">
                <span className="font-mono text-lg">{pixKey}</span>
                <button
                  onClick={copyToClipboard}
                  className={`p-2 rounded-md transition-all ${copied ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-red-700'}`}
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
              <p className="text-[10px] text-white/30 text-center">Clique no botão para copiar a chave</p>
            </div>

            <p className="text-white/60 text-sm">
              2. Envie o comprovante para o <a href="https://wa.me/5519998098584?text=Olá,%20estou%20enviando%20o%20comprovante%20do%20Exame%20de%20Faixa." target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">Whatsapp (19) 99809-8584</a>.
            </p>
          </div>

          {isWhiteToYellow && (
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl flex gap-3">
              <Info size={24} className="text-primary shrink-0" />
              <p className="text-sm font-medium text-primary">
                Atenção, vá à secretaria do Instituto com 2 (duas) fotos 3x4 e preencha a ficha da FPK - Federação Paulista de Karatê. É uma exigência da FPK.
              </p>
            </div>
          )}

          {mutationError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-sm text-red-400">{mutationError}</p>
            </div>
          )}

          {registration === null ? (
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'Aguarde...' : 'Confirmar Inscrição'}
            </button>
          ) : (
            <div className="w-full py-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center justify-center gap-2">
              <Check size={20} className="text-green-400" />
              <span className="text-green-400 font-bold">Inscrição já confirmada!</span>
            </div>
          )}

          <div className="border-t border-white/5 pt-6 space-y-4">
            <p className="text-white/40 text-xs italic">
              OBS: Em caso de dúvida, mandamos essas instruções para o e-mail <span className="text-white/60">{user.email}</span> ou contate a recepção no WhatsApp:
            </p>
            <a
              href="https://wa.me/5519998098584?text=Olá,%20estou%20com%20dúvida%20na%20inscrição%20do%20Exame%20de%20Faixa."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm font-bold hover:text-primary transition-colors"
            >
              <Phone size={16} className="text-primary" />
              (19) 99809-8584
            </a>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
