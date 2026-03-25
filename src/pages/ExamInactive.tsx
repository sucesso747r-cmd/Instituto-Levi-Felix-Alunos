import { useLocation } from 'wouter';
import { ArrowLeft, BookOpen, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import Layout from '../components/Layout';

export default function ExamInactive() {
  const [, setLocation] = useLocation();

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-8 text-center"
      >
        <button
          onClick={() => setLocation('/home')}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-4 mx-auto"
        >
          <ArrowLeft size={16} />
          Voltar para o Início
        </button>

        <div className="bg-secondary/30 border border-white/10 rounded-3xl p-8 space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
            <Clock className="text-primary" size={40} />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-bold uppercase tracking-tight">Período Inativo</h2>
            <p className="text-white/60 leading-relaxed">
              Não estamos no período de Exame de Faixa.
            </p>
            <p className="text-white/60 leading-relaxed">
              Enquanto aguarda, acesse o Guia do Karatê para estudar a teoria.
            </p>
            <p className="text-primary font-bold text-xl mt-4">Oss!</p>
          </div>

          <button
            onClick={() => window.open('https://i9star.com.br', '_blank')}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 flex items-center justify-center gap-4 transition-all active:scale-[0.98] group"
          >
            <BookOpen size={24} className="text-primary group-hover:scale-110 transition-transform" />
            <span className="font-bold uppercase tracking-widest text-sm">Acessar Guia do Karatê</span>
          </button>
        </div>
      </motion.div>
    </Layout>
  );
}
