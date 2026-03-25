import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion } from 'motion/react';
import Layout from '../components/Layout';

export default function TermsOfUse() {
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
          <h1 className="text-3xl font-bold uppercase tracking-tight">Termos de Uso</h1>
          <p className="text-white/40 text-xs uppercase font-bold tracking-widest">Última atualização: 25 de Março de 2026</p>
          
          <div className="prose prose-invert max-w-none space-y-6 text-white/70 leading-relaxed text-sm">
            <section className="space-y-3">
              <h2 className="text-white font-bold text-lg uppercase tracking-tight">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e usar a Área do Aluno do Instituto Levi Felix, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá acessar o serviço.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-white font-bold text-lg uppercase tracking-tight">2. Uso do Serviço</h2>
              <p>
                Este portal é destinado exclusivamente a alunos devidamente matriculados e seus responsáveis legais. O acesso é pessoal e intransferível. Você é responsável por manter a confidencialidade de sua senha.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-white font-bold text-lg uppercase tracking-tight">3. Conduta do Usuário</h2>
              <p>
                O usuário compromete-se a utilizar a plataforma de forma ética, respeitando os princípios do Karatê-Dô. É proibido qualquer tentativa de burlar a segurança do sistema ou utilizar dados de terceiros sem autorização.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-white font-bold text-lg uppercase tracking-tight">4. Exames de Faixa</h2>
              <p>
                As inscrições para exames de faixa realizadas através deste portal estão sujeitas à avaliação técnica do Sensei e ao cumprimento dos requisitos de carência e frequência estabelecidos pela federação.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-white font-bold text-lg uppercase tracking-tight">5. Alterações nos Termos</h2>
              <p>
                O Instituto Levi Felix reserva-se o direito de modificar estes termos a qualquer momento. Alterações significativas serão notificadas através da plataforma.
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
