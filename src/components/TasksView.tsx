import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, CheckCircle2, Circle, Clock, Trash2, X, AlertCircle } from 'lucide-react';
import { Task } from '../types';
import { taskService } from '../dataService';
import { User } from '../firebase';

interface TasksViewProps {
  user: User;
  handleLogin: () => void;
}

export function TasksView({ user, handleLogin }: TasksViewProps) {
  console.log('Rendering TasksView for user:', user.uid);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'Medium' as Task['priority']
  });

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = taskService.subscribe(user.uid, (data) => {
      setTasks(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const openAddModal = () => {
    setEditingTask(null);
    setFormData({ title: '', description: '', due_date: '', priority: 'Medium' });
    setIsModalOpen(true);
  };

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingTask) {
        await taskService.update(editingTask.id, formData);
      } else {
        await taskService.create(user.uid, formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving task:', err);
      let errorMessage = err.message || 'Falha ao salvar tarefa.';
      if (errorMessage.includes('Missing or insufficient permissions')) {
        errorMessage = 'Você não tem permissão para salvar na nuvem. Por favor, faça login.';
      }
      setError(errorMessage);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    try {
      await taskService.update(task.id, { status: task.status === 'Completed' ? 'Pending' : 'Completed' });
    } catch (error) {
      console.error('Error toggling task status:', error);
    }
  };

  const confirmDeleteTask = (id: string) => {
    setTaskToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await taskService.delete(taskToDelete);
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Agenda/Dia</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">Gerencie as atividades diárias e compromissos da Família.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-primary text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 cursor-pointer"
        >
          <Plus size={20} />
          <span className="sm:inline">New Task</span>
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <AlertCircle size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
            <p className="text-slate-400 dark:text-slate-500">No tasks found. Create one to get started!</p>
          </div>
        ) : (
          tasks.map(task => (
            <motion.div 
              key={task.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group bg-white dark:bg-slate-800 p-5 rounded-2xl border transition-all flex items-start gap-4
                ${task.status === 'Completed' ? 'border-slate-100 dark:border-slate-700 opacity-60' : 'border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary/20 dark:hover:border-primary/40'}
              `}
            >
              <button 
                onClick={() => toggleTaskStatus(task)}
                className={`mt-1 transition-colors cursor-pointer ${task.status === 'Completed' ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600 group-hover:text-primary'}`}
              >
                {task.status === 'Completed' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </button>
              
              <div className="flex-1 min-w-0">
                <h4 className={`text-lg font-bold leading-tight mb-1 ${task.status === 'Completed' ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                  {task.title}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-3 line-clamp-2">{task.description}</p>
                
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                    <Clock size={14} />
                    <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                    ${task.priority === 'High' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 
                      task.priority === 'Medium' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 
                      'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}
                  `}>
                    {task.priority}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => confirmDeleteTask(task.id)}
                className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">New Task</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Title</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Description</label>
                  <textarea 
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-24"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Due Date</label>
                    <input 
                      required
                      type="date" 
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Priority</label>
                    <select 
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value as Task['priority']})}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 mt-4"
                >
                  Create Task
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-center"
            >
              <div className="size-16 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Confirmar Exclusão</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteTask}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 dark:shadow-red-900/20"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
