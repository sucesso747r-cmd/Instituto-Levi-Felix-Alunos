import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, CheckCircle2, XCircle, Users, Search, Filter, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { User, StudentExamInfo } from '../types';

export default function SenseiDashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock student data
    const [students, setStudents] = useState<StudentExamInfo[]>([
    { id: '1', name: 'Ana Souza', class: 'Turma A', currentBelt: 'Branca', intendedBelt: 'Amarela', isEligible: true, registrationStatus: 'S' },
    { id: '2', name: 'Bruno Lima', class: 'Turma B', currentBelt: 'Amarela', intendedBelt: 'Vermelha', isEligible: false, registrationStatus: 'N' },
    { id: '3', name: 'Carla Dias', class: 'Turma A', currentBelt: 'Vermelha', intendedBelt: 'Laranja', isEligible: true, registrationStatus: 'PENDENCIA' },
    { id: '4', name: 'Daniel Alves', class: 'Turma C', currentBelt: 'Laranja', intendedBelt: 'Verde', isEligible: true, registrationStatus: 'S' },
    { id: '5', name: 'Eduarda Rocha', class: 'Turma B', currentBelt: 'Verde', intendedBelt: 'Roxa', isEligible: false, registrationStatus: 'N' },
    { id: '6', name: 'Pedro Santos', class: 'Turma Verde', currentBelt: 'Verde', intendedBelt: 'Roxa', isEligible: false, registrationStatus: 'N' },
  ]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && JSON.parse(storedUser).role === 'sensei') {
      setUser(JSON.parse(storedUser));
    } else {
      setLocation('/');
    }
  }, [setLocation]);

  if (!user) return null;

  const toggleEligibility = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, isEligible: !s.isEligible } : s));
  };

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
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
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
              Olá Sensei {user.name.split(' ')[0]}
              <ShieldCheck className="text-primary" size={24} />
            </h2>
            <p className="text-white/40 text-sm">
              Gerencie a relação de alunos para o Exame de Faixa (15/06/2026)
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
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold">{student.name}</div>
                      <div className={`text-[10px] uppercase font-medium ${getBeltColorClass(student.intendedBelt)}`}>
                        Pretendida: {student.intendedBelt}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/60">{student.class}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 border rounded text-[10px] font-bold ${getBeltBadgeStyle(student.currentBelt)}`}>
                        {student.currentBelt}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleEligibility(student.id)}
                        className={`p-2 rounded-lg transition-all ${student.isEligible ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}
                      >
                        {student.isEligible ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {student.registrationStatus === 'S' && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-500 border border-green-500/30 rounded text-[10px] font-bold">S</span>
                      )}
                      {student.registrationStatus === 'N' && (
                        <span className="px-2 py-1 bg-white/10 text-white/40 border border-white/20 rounded text-[10px] font-bold">N</span>
                      )}
                      {student.registrationStatus === 'PENDENCIA' && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 rounded text-[10px] font-bold">PENDÊNCIA</span>
                      )}
                    </td>
                  </tr>
                ))}
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
