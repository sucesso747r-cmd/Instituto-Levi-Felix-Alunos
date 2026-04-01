import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, CheckCircle2, XCircle, Search, ShieldCheck } from 'lucide-react';
import ExcelJS from 'exceljs';
import { motion } from 'motion/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Layout from '../components/Layout';
import useAuth from '../hooks/useAuth';
import { apiRequest, queryClient } from '../lib/queryClient';

interface SenseiStudent {
  user: {
    id: number;
    student_name: string;
    current_belt: string;
    class_group: string | null;
  };
  evaluation: { is_eligible: boolean } | null;
  registration: { payment_status: string } | null;
}

interface ExamPeriodResponse {
  period: { exam_date: string } | null;
}

function getNextBelt(belt: string): string {
  const belts = ['Branca', 'Amarela', 'Vermelha', 'Laranja', 'Verde', 'Roxa', 'Marrom', 'Preta'];
  const idx = belts.indexOf(belt);
  if (idx === -1 || idx === belts.length - 1) return belt;
  return belts[idx + 1];
}

function getRegistrationStatus(registration: { payment_status: string } | null): string {
  if (!registration) return 'N';
  if (registration.payment_status === 'CONFIRMADO') return 'S';
  if (registration.payment_status === 'PENDENTE') return 'PENDENCIA';
  return 'N';
}

function formatExamDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export default function SenseiDashboard() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  const { data: students = [], isLoading: studentsLoading } = useQuery<SenseiStudent[]>({
    queryKey: ['sensei', 'students'],
    queryFn: async () => {
      const res = await apiRequest('/api/sensei/students');
      return res.json();
    },
  });

  const { data: examData } = useQuery<ExamPeriodResponse>({
    queryKey: ['exam', 'current'],
    queryFn: async () => {
      const res = await apiRequest('/api/exam/current');
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ userId, isEligible }: { userId: number; isEligible: boolean }) => {
      await apiRequest('/api/sensei/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isEligible }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensei', 'students'] });
    },
  });

  if (!user || studentsLoading) return null;

  const examDate = examData?.period?.exam_date
    ? formatExamDate(examData.period.exam_date)
    : '—';

  const getBeltColorClass = (belt: string) => {
    switch (belt) {
      case 'Branca': return 'text-white';
      case 'Amarela': return 'text-yellow-400';
      case 'Vermelha': return 'text-red-500';
      case 'Laranja': return 'text-orange-500';
      case 'Verde': return 'text-green-500';
      case 'Roxa': return 'text-purple-500';
      case 'Marrom': return 'text-amber-600';
      case 'Preta': return 'text-white';
      default: return 'text-white/30';
    }
  };

  const getBeltBadgeStyle = (belt: string) => {
    switch (belt) {
      case 'Branca': return 'bg-white/10 border-white/20 text-white';
      case 'Amarela': return 'bg-yellow-400/20 border-yellow-400/30 text-yellow-400';
      case 'Vermelha': return 'bg-red-500/20 border-red-500/30 text-red-500';
      case 'Laranja': return 'bg-orange-500/20 border-orange-500/30 text-orange-500';
      case 'Verde': return 'bg-green-500/20 border-green-500/30 text-green-500';
      case 'Roxa': return 'bg-purple-500/20 border-purple-500/30 text-purple-500';
      case 'Marrom': return 'bg-amber-900/40 border-amber-900/50 text-amber-500';
      case 'Preta': return 'bg-zinc-800 border-white/20 text-white';
      default: return 'bg-white/5 border-white/10 text-white/60';
    }
  };

  const filteredStudents = students.filter(s =>
    s.user.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.user.class_group ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Alunos');
    ws.columns = [
      { header: 'Aluno', key: 'Aluno' },
      { header: 'Turma', key: 'Turma' },
      { header: 'Faixa Atual', key: 'Faixa Atual' },
      { header: 'Faixa Pretendida', key: 'Faixa Pretendida' },
      { header: 'Apto', key: 'Apto' },
      { header: 'Inscrito', key: 'Inscrito' },
    ];
    filteredStudents.forEach(s => {
      ws.addRow({
        'Aluno': s.user.student_name,
        'Turma': s.user.class_group ?? '—',
        'Faixa Atual': s.user.current_belt,
        'Faixa Pretendida': getNextBelt(s.user.current_belt),
        'Apto': (s.evaluation?.is_eligible ?? false) ? 'Sim' : 'Não',
        'Inscrito': getRegistrationStatus(s.registration),
      });
    });
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alunos-sensei-${today}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout subtitle="Área do Sensei">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-6 max-w-4xl mx-auto"
      >
        <button
          onClick={() => setLocation('/home')}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-4"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Olá Sensei {user.student_name.split(' ')[0]}
              <ShieldCheck className="text-primary" size={24} />
            </h2>
            <p className="text-white/40 text-sm">
              Gerencie a relação de alunos para o Exame de Faixa ({examDate})
            </p>
          </div>

          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Buscar aluno ou turma..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end mb-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-secondary/50 border border-white/10 hover:border-white/30 text-white/60 hover:text-white transition-all text-xs px-3 py-2 rounded-lg"
          >
            Exportar .XLS
          </button>
        </div>

        <div className="bg-secondary/20 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-white/40">Aluno</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-white/40">Turma</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-white/40">Faixa Atual</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-white/40 text-center">Apto?</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-white/40 text-center">Inscrito</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStudents.map((student) => {
                  const isEligible = student.evaluation?.is_eligible ?? false;
                  const intendedBelt = getNextBelt(student.user.current_belt);
                  const registrationStatus = getRegistrationStatus(student.registration);
                  return (
                    <tr key={student.user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold">{student.user.student_name}</div>
                        <div className={`text-[10px] uppercase font-medium ${getBeltColorClass(intendedBelt)}`}>
                          Pretendida: {intendedBelt}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white/60">{student.user.class_group ?? '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 border rounded text-[10px] font-bold ${getBeltBadgeStyle(student.user.current_belt)}`}>
                          {student.user.current_belt}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleMutation.mutate({ userId: student.user.id, isEligible: !isEligible })}
                          className={`p-2 rounded-lg transition-all ${isEligible ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}
                        >
                          {isEligible ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {registrationStatus === 'S' && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-500 border border-green-500/30 rounded text-[10px] font-bold">S</span>
                        )}
                        {registrationStatus === 'N' && (
                          <span className="px-2 py-1 bg-white/10 text-white/40 border border-white/20 rounded text-[10px] font-bold">N</span>
                        )}
                        {registrationStatus === 'PENDENCIA' && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 rounded text-[10px] font-bold">PENDÊNCIA</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredStudents.length === 0 && (
            <div className="p-12 text-center text-white/20 italic">
              Nenhum aluno encontrado para esta busca.
            </div>
          )}
        </div>
      </motion.div>
    </Layout>
  );
}
