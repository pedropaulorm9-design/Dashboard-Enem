'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  TrendingUp, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  BarChart3, 
  Calendar, 
  Filter,
  Trash2,
  AlertCircle,
  Moon,
  Sun
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subWeeks, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { QuestionRecord, Subject } from '@/lib/types';

const SUBJECTS: Subject[] = ['Linguagens', 'Matemática', 'Ciências da Natureza', 'Ciências Humanas'];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function EnemTracker() {
  const [records, setRecords] = useState<QuestionRecord[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterSubject, setFilterSubject] = useState<Subject | 'Todos'>('Todos');
  const [isLoaded, setIsLoaded] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Form state
  const [formData, setFormData] = useState({
    subject: 'Matemática' as Subject,
    topic: '',
    total: 0,
    correct: 0,
  });

  // Load data on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('enem_records');
      const savedTheme = localStorage.getItem('enem_theme') as 'light' | 'dark';
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setRecords(parsed);
        } catch (e) {
          console.error('Failed to parse records', e);
        }
      }

      if (savedTheme) {
        setTheme(savedTheme);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      }
    }
    setIsLoaded(true);
  }, []);

  // Theme effect
  useEffect(() => {
    if (isLoaded) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('enem_theme', theme);
    }
  }, [theme, isLoaded]);

  // Save data
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('enem_records', JSON.stringify(records));
    }
  }, [records, isLoaded]);

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 dark:bg-slate-950">Carregando...</div>;
  }

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic || formData.total <= 0) return;

    const newRecord: QuestionRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      subject: formData.subject,
      topic: formData.topic,
      total: formData.total,
      correct: formData.correct,
      wrong: formData.total - formData.correct,
    };

    setRecords([newRecord, ...records]);
    setFormData({ subject: 'Matemática', topic: '', total: 0, correct: 0 });
    setIsFormOpen(false);
  };

  const deleteRecord = (id: string) => {
    setRecords(records.filter(r => r.id !== id));
  };

  const filteredRecords = filterSubject === 'Todos' 
    ? records 
    : records.filter(r => r.subject === filterSubject);

  // Stats calculations
  const totalQuestions = filteredRecords.reduce((acc, r) => acc + r.total, 0);
  const totalCorrect = filteredRecords.reduce((acc, r) => acc + r.correct, 0);
  const totalWrong = filteredRecords.reduce((acc, r) => acc + r.wrong, 0);
  const overallPercentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  // Chart Data: Performance by Subject
  const subjectData = SUBJECTS.map(s => {
    const subRecords = records.filter(r => r.subject === s);
    const total = subRecords.reduce((acc, r) => acc + r.total, 0);
    const correct = subRecords.reduce((acc, r) => acc + r.correct, 0);
    return {
      name: s,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
      total
    };
  }).filter(d => d.total > 0);

  // Chart Data: Performance by Topic
  const topicPerformance = records.reduce((acc: any, r) => {
    if (!acc[r.topic]) {
      acc[r.topic] = { name: r.topic, total: 0, correct: 0, subject: r.subject };
    }
    acc[r.topic].total += r.total;
    acc[r.topic].correct += r.correct;
    return acc;
  }, {});

  const topicData = Object.values(topicPerformance)
    .map((t: any) => ({
      ...t,
      percentage: Math.round((t.correct / t.total) * 100)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Worst Topics
  const worstTopics = Object.values(topicPerformance)
    .map((t: any) => ({
      ...t,
      percentage: Math.round((t.correct / t.total) * 100)
    }))
    .filter((t: any) => t.total >= 5) // Only topics with at least 5 questions
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 5);

  // Weekly Evolution
  const last4Weeks = Array.from({ length: 4 }).map((_, i) => {
    const start = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
    const end = endOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
    const weekRecords = records.filter(r => {
      const d = parseISO(r.date);
      return d >= start && d <= end;
    });
    const total = weekRecords.reduce((acc, r) => acc + r.total, 0);
    const correct = weekRecords.reduce((acc, r) => acc + r.correct, 0);
    return {
      name: `${format(start, 'dd/MM')} - ${format(end, 'dd/MM')}`,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
      date: start
    };
  }).reverse();

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">ENEM dashboard</h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Acompanhe seu progresso e domine as matérias.</p>
          </div>
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all md:hidden"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={toggleTheme}
            className="hidden md:flex p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95"
          >
            <Plus size={20} />
            <span className="whitespace-nowrap">Registrar Questões</span>
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <BookOpen size={18} />
            <span className="text-xs font-medium uppercase tracking-wider">Total de Questões</span>
          </div>
          <div className="text-3xl font-bold dark:text-white">{totalQuestions}</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-2">
            <CheckCircle2 size={18} />
            <span className="text-xs font-medium uppercase tracking-wider">Acertos</span>
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{totalCorrect}</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-2">
            <XCircle size={18} />
            <span className="text-xs font-medium uppercase tracking-wider">Erros</span>
          </div>
          <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">{totalWrong}</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 mb-2">
            <TrendingUp size={18} />
            <span className="text-xs font-medium uppercase tracking-wider">Aproveitamento</span>
          </div>
          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{overallPercentage.toFixed(1)}%</div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Charts Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Performance by Subject */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 dark:text-white">
              <BarChart3 size={20} className="text-indigo-600 dark:text-indigo-400" />
              Desempenho por Matéria (%)
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: theme === 'dark' ? '#0f172a' : '#f8fafc' }}
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#0f172a' : '#fff',
                      borderRadius: '12px', 
                      border: theme === 'dark' ? '1px solid #1e293b' : 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      color: theme === 'dark' ? '#fff' : '#000'
                    }}
                  />
                  <Bar dataKey="percentage" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Performance by Topic */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 dark:text-white">
              <BarChart3 size={20} className="text-emerald-600 dark:text-emerald-400" />
              Desempenho por Assunto (%)
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10 }} width={100} />
                  <Tooltip 
                    cursor={{ fill: theme === 'dark' ? '#0f172a' : '#f8fafc' }}
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#0f172a' : '#fff',
                      borderRadius: '12px', 
                      border: theme === 'dark' ? '1px solid #1e293b' : 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      color: theme === 'dark' ? '#fff' : '#000'
                    }}
                  />
                  <Bar dataKey="percentage" fill="#10b981" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Weekly Evolution */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 dark:text-white">
              <Calendar size={20} className="text-indigo-600 dark:text-indigo-400" />
              Evolução Semanal (%)
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={last4Weeks}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#0f172a' : '#fff',
                      borderRadius: '12px', 
                      border: theme === 'dark' ? '1px solid #1e293b' : 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      color: theme === 'dark' ? '#fff' : '#000'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: theme === 'dark' ? '#0f172a' : '#fff' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Records List */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
                <Filter size={20} className="text-indigo-600 dark:text-indigo-400" />
                Histórico de Questões
              </h3>
              <select 
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              >
                <option value="Todos">Todas as Matérias</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-medium">Data</th>
                    <th className="px-6 py-3 font-medium">Matéria</th>
                    <th className="px-6 py-3 font-medium">Assunto</th>
                    <th className="px-6 py-3 font-medium text-center">Qtd</th>
                    <th className="px-6 py-3 font-medium text-center">Acertos</th>
                    <th className="px-6 py-3 font-medium text-center">%</th>
                    <th className="px-6 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                        Nenhum registro encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {format(parseISO(record.date), 'dd/MM/yy')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight ${
                            record.subject === 'Matemática' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            record.subject === 'Linguagens' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                            record.subject === 'Ciências da Natureza' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          }`}>
                            {record.subject}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-200">{record.topic}</td>
                        <td className="px-6 py-4 text-sm text-center text-slate-600 dark:text-slate-400">{record.total}</td>
                        <td className="px-6 py-4 text-sm text-center font-semibold text-emerald-600 dark:text-emerald-400">{record.correct}</td>
                        <td className="px-6 py-4 text-sm text-center font-bold dark:text-white">
                          {Math.round((record.correct / record.total) * 100)}%
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => deleteRecord(record.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          {/* Worst Topics List */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 dark:text-white">
              <AlertCircle size={20} className="text-rose-600 dark:text-rose-400" />
              Assuntos Críticos
            </h3>
            <div className="space-y-4">
              {worstTopics.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 italic">Registre mais questões para ver insights.</p>
              ) : (
                worstTopics.map((topic: any) => (
                  <div key={topic.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{topic.name}</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">{topic.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-rose-500 dark:bg-rose-400 h-full rounded-full" 
                        style={{ width: `${topic.percentage}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {topic.subject} • {topic.total} questões
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Performance by Topic (Top 10) */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 dark:text-white">
              <TrendingUp size={20} className="text-indigo-600 dark:text-indigo-400" />
              Top Assuntos Estudados
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topicData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="total"
                  >
                    {topicData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#0f172a' : '#fff',
                      borderRadius: '12px', 
                      border: theme === 'dark' ? '1px solid #1e293b' : 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      color: theme === 'dark' ? '#fff' : '#000'
                    }}
                  />
                  <Legend wrapperStyle={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-bold dark:text-white">Registrar Novo Estudo</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Adicione as questões feitas hoje.</p>
              </div>
              
              <form onSubmit={handleAddRecord} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Matéria</label>
                  <select 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value as Subject})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Assunto</label>
                  <input 
                    type="text"
                    placeholder="Ex: Estequiometria, Funções, etc."
                    value={formData.topic}
                    onChange={(e) => setFormData({...formData, topic: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white placeholder:text-slate-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Total de Questões</label>
                    <input 
                      type="number"
                      min="1"
                      value={formData.total || ''}
                      onChange={(e) => setFormData({...formData, total: parseInt(e.target.value) || 0})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Acertos</label>
                    <input 
                      type="number"
                      min="0"
                      max={formData.total}
                      value={formData.correct || ''}
                      onChange={(e) => setFormData({...formData, correct: parseInt(e.target.value) || 0})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:text-white"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 dark:shadow-none"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
