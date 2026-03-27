import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Linkedin, Twitter, Instagram, Upload, Camera } from 'lucide-react';
import { Contact } from '../types';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingContact: Contact | null;
  formData: any;
  setFormData: (data: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
  statusMessage: { type: 'success' | 'error', text: string } | null;
  avatarInputRef: React.RefObject<HTMLInputElement>;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingAvatar: boolean;
  user: any;
  handleLogin: () => void;
}

export function ContactModal({ 
  isOpen, 
  onClose, 
  editingContact, 
  formData, 
  setFormData, 
  handleSubmit, 
  statusMessage,
  avatarInputRef,
  handleAvatarUpload,
  isUploadingAvatar,
  user,
  handleLogin
}: ContactModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingContact ? 'Editar Familiar' : 'Família'}
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>

            {statusMessage && (
              <div className={`px-6 py-3 text-sm font-medium flex flex-col gap-2 ${statusMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                <p>{statusMessage.text}</p>
                {statusMessage.text.includes('logado') && !user && (
                  <button 
                    type="button"
                    onClick={handleLogin}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-primary/90 transition-all w-fit shadow-md"
                  >
                    Fazer Login agora
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex flex-col items-center mb-4">
                <div className="relative group">
                  <div className="size-24 rounded-full overflow-hidden border-4 border-primary/20 bg-slate-100 dark:bg-slate-900 flex items-center justify-center shadow-inner">
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(formData.name || 'Familiar')}`} alt="Default" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all border-2 border-white dark:border-slate-800"
                    title="Upload Foto"
                  >
                    <Camera size={16} />
                  </button>
                  <input 
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-2">Avatar</p>
                {isUploadingAvatar && <p className="text-[10px] text-primary animate-pulse mt-1">Processando imagem...</p>}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Avatar URL (Opcional)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="https://example.com/photo.jpg"
                      className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({...formData, avatar_url: e.target.value})}
                    />
                    <button 
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                      title="Upload"
                    >
                      <Upload size={18} />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 italic">Você pode colar um link ou fazer upload de uma imagem.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">NOME</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">LOCAL TRABALHO</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Phone</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">DATA ANIVERSÁRIO</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <input 
                      type="date" 
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Status</label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as Contact['status']})}
                  >
                    <option value="Em casa">Em casa</option>
                    <option value="No Trabalho">No Trabalho</option>
                    <option value="Na Praia">Na Praia</option>
                    <option value="Fazendo Bagunça">Fazendo Bagunça</option>
                    <option value="Dormindo">Dormindo</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-3">Social Media</h4>
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Linkedin size={16} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="LinkedIn URL or username"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({...formData, linkedin: e.target.value})}
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Twitter size={16} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Twitter URL or username"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      value={formData.twitter}
                      onChange={(e) => setFormData({...formData, twitter: e.target.value})}
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Instagram size={16} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Instagram URL or username"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      value={formData.instagram}
                      onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-3">Custom Data (JSON)</h4>
                <textarea 
                  placeholder='{"key": "value"}'
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-mono h-24"
                  value={formData.metadata}
                  onChange={(e) => setFormData({...formData, metadata: e.target.value})}
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">Store any additional information in JSON format.</p>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 cursor-pointer"
                >
                  {editingContact ? 'Salvar Alterações' : 'Adicionar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
