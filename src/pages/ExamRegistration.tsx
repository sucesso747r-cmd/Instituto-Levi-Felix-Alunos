import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Copy, Check, Info, Mail, Phone } from 'lucide-react';
import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { User } from '../types';

export default function ExamRegistration() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);

  const pixKey = '19998098584'; // Example Pix key (phone number)
  const examPrice = 'R$ 290,00'; // Updated price

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setLocation('/');
    }
  }, [setLocation]);

  if (!user) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isWhiteToYellow = user.currentBelt === 'Branca';

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
              <span className="font-bold text-lg">{user.name}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white/40 text-xs uppercase tracking-wider">Graduação Atual</span>
              <span className="font-bold text-lg">{user.currentBelt}</span>
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
                Só para os faixas branca: Atenção, vá à secretaria do Instituto e preencha a ficha da FPK - Federação Paulista de Karatê. É uma exigência para as faixas Amarela e posteriores.
              </p>
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
