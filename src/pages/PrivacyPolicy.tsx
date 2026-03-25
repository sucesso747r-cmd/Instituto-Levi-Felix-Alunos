import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion } from 'motion/react';
import Layout from '../components/Layout';

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto space-y-8 pb-12"
      >
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-4"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <ShieldCheck className="text-primary" size={24} />
            </div>
            <h1 className="text-3xl font-bold uppercase tracking-tight">Privacidade e LGPD</h1>
          </div>
          <p className="text-white/40 text-xs uppercase font-bold tracking-widest">Última atualização: 25 de Março de 2026</p>
          
          <div className="prose prose-invert max-w-none space-y-6 text-white/70 leading-relaxed text-sm">
            <section className="space-y-3">
              <h2 className="text-white font-bold text-lg uppercase tracking-tight">1. Coleta de Dados</h2>
              <p>
                O Instituto Levi Felix coleta dados pessoais necessários para a gestão acadêmica e administrativa do aluno, incluindo nome, e-mail, data de nascimento, graduação atual e histórico de exames.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-white font-bold text-lg uppercase tracking-tight">2. Finalidade do Tratamento</h2>
              <p>
                Os dados coletados são utilizados exclusivamente para:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Gestão de matrículas e presença;</li>
                <li>Processamento de inscrições em exames de faixa;</li>
                <li>Comunicação direta entre Sensei e aluno/responsável;</li>
                <li>Emissão de certificados e graduações.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-white font-bold text-lg uppercase tracking-tight">3. Segurança dos Dados</h2>
              <p>
                Adotamos medidas técnicas e administrativas adequadas para proteger seus dados pessoais contra acessos não autorizados, perda, alteração ou qualquer forma de tratamento inadequado ou ilícito, em conformidade com a Lei Geral de Proteção de Dados (LGPD).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-white font-bold text-lg uppercase tracking-tight">4. Compartilhamento de Dados</h2>
              <p>
                Não compartilhamos seus dados pessoais com terceiros para fins comerciais. Os dados podem ser compartilhados com federações de Karatê apenas para fins de registro oficial de graduação e participação em eventos.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-white font-bold text-lg uppercase tracking-tight">5. Seus Direitos</h2>
              <p>
                Conforme a LGPD, você tem direito a solicitar o acesso, correção, anonimização ou exclusão de seus dados pessoais. Para exercer esses direitos, entre em contato diretamente com a secretaria do Instituto.
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
