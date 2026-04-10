import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { ArrowLeft, User, Users, Lock, CheckCircle2, ShieldAlert, Pencil, Trash2, Save, X, ToggleRight, ToggleLeft } from 'lucide-react';
import Layout from '../components/Layout';
import { apiRequest } from '../lib/queryClient';
import { BELT_SEQUENCE } from '../../shared/schema';

interface AdminUser {
  id: number;
  student_name: string;
  email: string;
  current_belt: string;
  class_group: string;
  is_sensei: boolean;
}

interface Assignment {
  assignment: { id: number; user_id: number; sensei_id: number; exam_period_id: number };
  student: { id: number; email: string; student_name: string; current_belt: string; class_group: string };
}

interface ExamPeriod { id: number; active: boolean; exam_date: string }

export default function Students() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

  const [userResetSuccess, setUserResetSuccess] = useState<Record<number, boolean>>({});
  const [userResetError, setUserResetError] = useState<Record<number, string>>({});

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editBelt, setEditBelt] = useState('');
  const [editClassGroup, setEditClassGroup] = useState('');
  const [editIsSensei, setEditIsSensei] = useState(false);

  // Delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const startEdit = (u: AdminUser) => {
    setEditingId(u.id);
    setEditName(u.student_name);
    setEditBelt(u.current_belt);
    setEditClassGroup(u.class_group ?? '');
    setEditIsSensei(u.is_sensei);
  };

  const { data: users = [] } = useQuery<AdminUser[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await apiRequest('/api/admin/users');
      return res.json();
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest(`/api/admin/users/${userId}/reset-password`, { method: 'POST' });
      return userId;
    },
    onSuccess: (userId) => {
      setUserResetSuccess((prev) => ({ ...prev, [userId]: true }));
      setTimeout(() => setUserResetSuccess((prev) => ({ ...prev, [userId]: false })), 3000);
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err, userId) => {
      const msg = err instanceof Error ? err.message : 'Erro ao resetar senha';
      setUserResetError((prev) => ({ ...prev, [userId]: msg }));
      setTimeout(() => setUserResetError((prev) => ({ ...prev, [userId]: '' })), 4000);
    },
  });

  const editMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: editName,
          currentBelt: editBelt,
          classGroup: editClassGroup,
          isSenseiFlag: editIsSensei,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest(`/api/admin/users/${userId}`, { method: 'DELETE' });
      return userId;
    },
    onSuccess: () => {
      setConfirmDeleteId(null);
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const { data: activePeriod = null } = useQuery<ExamPeriod | null>({
    queryKey: ['admin', 'exam-period'],
    queryFn: async () => {
      const res = await apiRequest('/api/admin/exam-period');
      return res.json();
    },
  });

  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ['admin', 'assignments'],
    queryFn: async () => {
      const res = await apiRequest('/api/admin/assignments');
      return res.json();
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ userId, senseiId }: { userId: number; senseiId: number }) => {
      const res = await apiRequest('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, senseiId, examPeriodId: activePeriod!.id }),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'assignments'] });
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/admin/assignments/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'assignments'] });
    },
  });

  const beltPillClass = (belt: string) => {
    const map: Record<string, string> = {
      Branca:  'bg-white/10 text-white',
      Amarela: 'bg-yellow-400/20 text-yellow-300',
      Vermelha:'bg-red-500/20 text-red-400',
      Laranja: 'bg-orange-400/20 text-orange-300',
      Verde:   'bg-green-500/20 text-green-400',
      Roxa:    'bg-purple-500/20 text-purple-400',
      Marrom:  'bg-amber-800/30 text-amber-600',
      Preta:   'bg-white/5 text-white/60 border border-white/20',
    };
    return map[belt] ?? 'bg-white/10 text-white';
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full space-y-6 max-w-lg mx-auto"
      >
        <button
          onClick={() => setLocation('/admin-home')}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-4"
        >
          <ArrowLeft size={16} />
          Painel ADM
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <ShieldAlert className="text-primary" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight">Alunos e Senseis</h2>
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Gerenciar usuários do sistema</p>
          </div>
        </div>

        <div className="bg-secondary/30 border border-white/10 rounded-3xl p-6 space-y-4">
          {users.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-4">Nenhum usuário cadastrado.</p>
          ) : (
            users.map((u) => (
              <div key={u.id} className="space-y-1">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1 min-w-0 mr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User size={14} className="text-white/40 shrink-0" />
                      <p className="font-bold text-sm truncate">{u.student_name}</p>
                      {u.is_sensei && (
                        <span className="text-[9px] uppercase font-bold tracking-wider text-primary border border-primary/30 rounded px-1">Sensei</span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${beltPillClass(u.current_belt)}`}>
                        {u.current_belt}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs ml-5">{u.email}</p>
                    {!u.is_sensei && (() => {
                      const asgn = assignments.find((a) => a.assignment.user_id === u.id);
                      const senseiName = asgn ? users.find((s) => s.id === asgn.assignment.sensei_id)?.student_name ?? '—' : '—';
                      return <p className="text-white/40 text-xs ml-5">Sensei: {senseiName}</p>;
                    })()}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => resetMutation.mutate(u.id)}
                      disabled={resetMutation.isPending}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all active:scale-[0.98] flex items-center gap-1 disabled:opacity-50"
                    >
                      {userResetSuccess[u.id] ? (
                        <>
                          <CheckCircle2 size={14} className="text-green-500" />
                          OK
                        </>
                      ) : (
                        <>
                          <Lock size={12} />
                          Resetar Senha
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(u)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white p-2 rounded-xl transition-all active:scale-[0.98]"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(u.id)}
                      className="bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-white/60 hover:text-red-400 p-2 rounded-xl transition-all active:scale-[0.98]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Inline edit panel */}
                {editingId === u.id && (
                  <div className="p-4 bg-white/5 rounded-2xl border border-primary/20 space-y-3">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nome"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/40"
                    />
                    <select
                      value={editBelt}
                      onChange={(e) => setEditBelt(e.target.value)}
                      className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/40"
                    >
                      {BELT_SEQUENCE.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    {!editIsSensei && (
                      <input
                        value={editClassGroup}
                        onChange={(e) => setEditClassGroup(e.target.value)}
                        placeholder="Turma (opcional)"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/40"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setEditIsSensei((v) => !v)}
                      className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {editIsSensei ? (
                        <ToggleRight size={20} className="text-primary" />
                      ) : (
                        <ToggleLeft size={20} className="text-white/30" />
                      )}
                      Sensei
                    </button>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1 text-xs text-white/40 hover:text-white border border-white/10 rounded-xl px-3 py-2 transition-all"
                      >
                        <X size={14} />
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => editMutation.mutate(u.id)}
                        disabled={editMutation.isPending}
                        className="flex items-center gap-1 text-xs font-bold text-white bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-xl px-3 py-2 transition-all disabled:opacity-50"
                      >
                        <Save size={14} />
                        Salvar
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete confirmation */}
                {confirmDeleteId === u.id && (
                  <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 space-y-3">
                    <p className="text-sm text-red-400 font-bold">Excluir <span className="text-white">{u.student_name}</span>? Esta ação não pode ser desfeita.</p>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="flex items-center gap-1 text-xs text-white/40 hover:text-white border border-white/10 rounded-xl px-3 py-2 transition-all"
                      >
                        <X size={14} />
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(u.id)}
                        disabled={deleteMutation.isPending}
                        className="flex items-center gap-1 text-xs font-bold text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl px-3 py-2 transition-all disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        Excluir
                      </button>
                    </div>
                  </div>
                )}

                {userResetError[u.id] && (
                  <p className="text-red-400 text-xs font-bold px-1">{userResetError[u.id]}</p>
                )}
              </div>
            ))
          )}
        </div>
        {/* ── Atribuições do Período Ativo ── */}
        <div className="flex items-center gap-3 mb-4 mt-2">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <Users className="text-primary" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight">Atribuições do Período Ativo</h2>
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">
              {activePeriod ? (() => {
                const [year, month, day] = activePeriod.exam_date.split('-');
                return `Exame de ${day}/${month}/${year}`;
              })() : 'Nenhum período ativo'}
            </p>
          </div>
        </div>

        <div className="bg-secondary/30 border border-white/10 rounded-3xl p-6 space-y-4">
          {!activePeriod ? (
            <p className="text-white/40 text-sm text-center py-4">Nenhum período de exame ativo.</p>
          ) : users.filter((u) => !u.is_sensei).length === 0 ? (
            <p className="text-white/40 text-sm text-center py-4">Nenhum aluno cadastrado.</p>
          ) : (
            users.filter((u) => !u.is_sensei).map((student) => {
              const found = assignments.find((a) => a.assignment.user_id === student.id);
              const senseis = users.filter((u) => u.is_sensei);

              return (
                <div key={student.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User size={14} className="text-white/40 shrink-0" />
                      <p className="font-bold text-sm truncate">{student.student_name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${beltPillClass(student.current_belt)}`}>
                        {student.current_belt}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!found && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/5 text-white/30 border border-white/10">
                        Sem sensei
                      </span>
                    )}
                    <select
                      value={found?.assignment.sensei_id ?? ''}
                      onChange={(e) => {
                        const senseiId = Number(e.target.value);
                        if (senseiId) assignMutation.mutate({ userId: student.id, senseiId });
                      }}
                      disabled={assignMutation.isPending}
                      className="bg-secondary border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary/40 disabled:opacity-50"
                    >
                      <option value="">Selecionar sensei</option>
                      {senseis.map((s) => (
                        <option key={s.id} value={s.id}>{s.student_name}</option>
                      ))}
                    </select>
                    {found && (
                      <button
                        type="button"
                        onClick={() => removeAssignmentMutation.mutate(found.assignment.id)}
                        disabled={removeAssignmentMutation.isPending}
                        className="bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-white/60 hover:text-red-400 p-1.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </Layout>
  );
}
