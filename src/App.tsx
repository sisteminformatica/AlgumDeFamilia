import React, { useState, useEffect, Component, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  LayoutDashboard, 
  Handshake, 
  CheckSquare, 
  Settings, 
  BarChart3, 
  Plus, 
  Search, 
  Bell, 
  Menu, 
  X, 
  Database,
  Trash2,
  LogOut,
  LogIn,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { Contact } from './types';
import { contactService } from './dataService';
import { compressImage } from './utils/imageCompression';
import { DashboardView } from './components/DashboardView';
import { DealsView } from './components/DealsView';
import { TasksView } from './components/TasksView';
import { ContactsView } from './components/ContactsView';
import { SettingsView } from './components/SettingsView';
import { ContactModal } from './components/ContactModal';
import { auth, googleProvider, signInWithPopup, signInAnonymously, signOut, onAuthStateChanged, User } from './firebase';
import configFromFile from '../firebase-applet-config.json';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let message = "Something went wrong.";
      message = this.state.error?.message || message;

      return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
          <div className="size-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
            <X size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Error</h1>
          <p className="text-slate-500 mb-8 max-w-md">{message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'contacts' | 'deals' | 'tasks' | 'settings'>('dashboard');
  useEffect(() => {
    console.log('Current view changed to:', currentView);
  }, [currentView]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const displayUser = user || {
    uid: 'loading',
    displayName: 'Carregando...',
    email: '',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Loading'
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'Em casa' as Contact['status'],
    birth_date: '',
    avatar_url: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    metadata: '{}'
  });

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const reader = new FileReader();
      const readFile = () => new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
        reader.readAsDataURL(file);
      });

      let base64String = await readFile();
      
      // Compress if it's an image
      if (file.type.startsWith('image')) {
        base64String = await compressImage(base64String);
        
        // Final check after compression (Firestore limit is 1MB, but we'll use Storage now)
        // We still keep a reasonable limit for base64 before upload
        if (base64String.length > 2000 * 1024) {
          throw new Error('A imagem é muito grande. Tente uma foto menor.');
        }
      }
      
      setFormData(prev => ({ ...prev, avatar_url: base64String }));
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setStatusMessage({ type: 'error', text: `Erro no upload da foto: ${error.message || 'Falha desconhecida'}` });
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? (firebaseUser.isAnonymous ? 'Anonymous' : firebaseUser.email) : 'No user');
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsAuthReady(true);
      } else {
        // Sign in anonymously if no user is present to ensure cloud storage works
        signInAnonymously(auth).catch(err => {
          console.error('Anonymous auth error:', err);
          setIsAuthReady(true);
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    const unsubscribe = contactService.subscribe(user.uid, (data) => {
      let filteredData = data;
      if (search) {
        const lowerSearch = search.toLowerCase();
        filteredData = data.filter(c => 
          c.name.toLowerCase().includes(lowerSearch) || 
          c.company.toLowerCase().includes(lowerSearch) || 
          c.email.toLowerCase().includes(lowerSearch)
        );
      }
      setContacts(filteredData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, search]);

  const handleLogin = async () => {
    console.log('Starting login process...');
    setIsLoggingIn(true);
    setLoginError(null);
    
    // Set a timeout to show a troubleshooting message if it takes too long
    const timeoutId = setTimeout(() => {
      if (isLoggingIn) {
        setLoginError('Login is taking longer than expected. Please check if a popup window opened behind this one or if your browser blocked it.');
      }
    }, 8000);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Login successful for:', result.user.email);
      clearTimeout(timeoutId);
      setLoginError(null);
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Login error:', error);
      
      if (error.code === 'auth/popup-blocked') {
        setLoginError('O popup de login foi bloqueado pelo seu navegador. Por favor, permita popups para este site e tente novamente.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setLoginError('O login foi cancelado. Por favor, tente novamente.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setLoginError('A janela de login foi fechada antes da conclusão. Se ela fechou sozinha, verifique se o domínio está autorizado no Firebase Console.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setLoginError('Domínio não autorizado. O login é opcional para sincronização na nuvem, mas os dados estão sendo salvos localmente.');
      } else if (error.message?.includes('third-party cookies')) {
        setLoginError('Cookies de terceiros bloqueados. O login é opcional para sincronização na nuvem, mas os dados estão sendo salvos localmente.');
      } else {
        setLoginError(`Erro no login: ${error.message || 'Falha ao entrar com Google'}. Os dados estão sendo salvos localmente.`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const openAddModal = () => {
    setEditingContact(null);
    setFormData({ 
      name: '', 
      company: '', 
      email: '', 
      phone: '', 
      status: 'Em casa', 
      birth_date: '',
      avatar_url: '',
      linkedin: '',
      twitter: '',
      instagram: '',
      metadata: '{}'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      company: contact.company,
      email: contact.email,
      phone: contact.phone,
      status: contact.status,
      birth_date: contact.birth_date || '',
      avatar_url: contact.avatar_url || '',
      linkedin: contact.linkedin || '',
      twitter: contact.twitter || '',
      instagram: contact.instagram || '',
      metadata: JSON.stringify(contact.metadata || {}, null, 2)
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setStatusMessage(null);
    try {
      let parsedMetadata = {};
      try {
        parsedMetadata = JSON.parse(formData.metadata || '{}');
      } catch (e) {
        setStatusMessage({ type: 'error', text: 'JSON inválido nos campos personalizados.' });
        return;
      }

      const payload = {
        ...formData,
        metadata: parsedMetadata
      };

      if (editingContact) {
        await contactService.update(editingContact.id, payload);
        setStatusMessage({ type: 'success', text: 'Familiar atualizado com sucesso!' });
      } else {
        await contactService.create(user.uid, payload);
        setStatusMessage({ type: 'success', text: 'Familiar adicionado com sucesso!' });
      }
      
      setTimeout(() => {
        setIsModalOpen(false);
        setStatusMessage(null);
      }, 1500);
    } catch (error: any) {
      console.error('Error saving contact:', error);
      let errorMessage = error.message || 'Falha desconhecida';
      if (errorMessage.includes('Missing or insufficient permissions')) {
        errorMessage = 'Erro de permissão. Tente fazer login novamente.';
      }
      setStatusMessage({ type: 'error', text: `Erro ao salvar: ${errorMessage}` });
    }
  };

  const confirmDelete = (id: string) => {
    setContactToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!contactToDelete) return;
    try {
      await contactService.delete(contactToDelete);
      setIsDeleteModalOpen(false);
      setContactToDelete(null);
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Login screen disabled as requested. 
  // The app will now always render the main layout using a guest profile if not logged in.

  return (
    <ErrorBoundary>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
        {/* Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            />
          )}
        </AnimatePresence>
        {/* ... rest of the component ... */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-transform duration-300 transform
          lg:translate-x-0 lg:static lg:inset-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* ... sidebar content ... */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-8 bg-primary rounded flex items-center justify-center text-white">
                <Database size={20} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">Album de Família</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 lg:hidden">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            <NavItem 
              icon={<LayoutDashboard size={20} />} 
              label="Aniversariante" 
              active={currentView === 'dashboard'} 
              onClick={() => { 
                console.log('Switching to dashboard');
                setCurrentView('dashboard'); 
                setIsSidebarOpen(false); 
              }}
            />
            <NavItem 
              icon={<Users size={20} />} 
              label="Família" 
              active={currentView === 'contacts'} 
              onClick={() => { 
                console.log('Switching to contacts');
                setCurrentView('contacts'); 
                setIsSidebarOpen(false); 
              }}
            />
            <NavItem 
              icon={<ImageIcon size={20} />} 
              label="Fotos/Vídeos" 
              active={currentView === 'deals'} 
              onClick={() => { 
                console.log('Switching to deals');
                setCurrentView('deals'); 
                setIsSidebarOpen(false); 
              }} 
            />
            <NavItem 
              icon={<CheckSquare size={20} />} 
              label="Agenda/Dia" 
              active={currentView === 'tasks'} 
              onClick={() => { 
                console.log('Switching to tasks');
                setCurrentView('tasks'); 
                setIsSidebarOpen(false); 
              }}
            />
            <NavItem icon={<BarChart3 size={20} />} label="Reports" />
            
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
              <NavItem 
                icon={<Settings size={20} />} 
                label="Configurações" 
                active={currentView === 'settings'}
                onClick={() => { setCurrentView('settings'); setIsSidebarOpen(false); }}
              />
              {isAuthReady && (
                <>
                  {!user ? (
                    <button 
                      onClick={handleLogin}
                      disabled={isLoggingIn}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all mt-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                      <LogIn size={20} />
                      <span className="text-sm font-bold">{isLoggingIn ? 'Entrando...' : 'Entrar com Google'}</span>
                    </button>
                  ) : (
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-1 cursor-pointer"
                    >
                      <LogOut size={20} />
                      <span className="text-sm font-medium">Sair da Conta</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </nav>

          <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
            <div className="flex items-center gap-3 px-2">
              <div className="relative">
                <img src={displayUser.photoURL || ''} alt={displayUser.displayName || ''} className="size-9 rounded-full border-2 border-white dark:border-slate-700 shadow-sm object-cover" referrerPolicy="no-referrer" />
                {user && !user.isAnonymous && (
                  <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayUser.displayName || (user?.isAnonymous ? 'Visitante' : 'Usuário')}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{displayUser.email || (user?.isAnonymous ? 'Modo Nuvem Ativado' : '')}</p>
              </div>
              {isAuthReady && (
                <>
                  {user ? (
                    <button 
                      onClick={handleLogout}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                      title="Sair"
                    >
                      <LogOut size={16} />
                    </button>
                  ) : (
                    <button 
                      onClick={handleLogin}
                      className="p-1.5 text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                      title="Entrar"
                    >
                      <LogIn size={16} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Global Error Banner */}
          <AnimatePresence>
            {loginError && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-red-500 text-white px-4 py-3 flex flex-col gap-2 shadow-lg z-40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertCircle size={18} />
                    <span>{loginError}</span>
                  </div>
                  <button onClick={() => setLoginError(null)} className="p-1 hover:bg-white/20 rounded transition-colors">
                    <X size={18} />
                  </button>
                </div>
                {loginError.includes('fechada') || loginError.includes('autorizado') || loginError.includes('cookies') ? (
                  <div className="text-xs bg-white/10 p-2 rounded border border-white/20 flex flex-col gap-1">
                    <p className="font-bold">Nota:</p>
                    <p>O armazenamento agora é <strong>Nuvem</strong>. Você pode usar o app normalmente.</p>
                    <p>O login serve para sincronizar seus dados entre dispositivos.</p>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-8 shrink-0">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg lg:hidden">
                <Menu size={20} />
              </button>
              <div className="relative group flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-slate-400" />
                </div>
                <input 
                  type="text"
                  placeholder="Search..."
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all sm:text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4 ml-4">
              <button className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors hidden sm:block">
                <Bell size={20} />
              </button>
              <div className="lg:hidden size-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                <img src={displayUser.photoURL || ''} alt={displayUser.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <button 
                onClick={openAddModal}
                className="bg-primary text-white p-2 lg:px-4 lg:py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-sm"
              >
                <Plus size={16} />
                <span className="hidden lg:inline">Família</span>
              </button>
            </div>
          </header>

          {/* Page Content */}
          <div className={`flex-1 overflow-auto ${currentView === 'deals' ? 'p-0' : 'p-4 lg:p-8'}`}>
            {currentView === 'dashboard' && <DashboardView contacts={contacts} />}
            {currentView === 'deals' && <DealsView user={displayUser as any} handleLogin={handleLogin} />}
            {currentView === 'tasks' && <TasksView user={displayUser as any} handleLogin={handleLogin} />}
            {currentView === 'settings' && (
              <SettingsView 
                isDarkMode={isDarkMode} 
                setIsDarkMode={setIsDarkMode} 
                user={user}
                handleLogout={handleLogout}
              />
            )}
            {currentView === 'contacts' && (
              <ContactsView 
                contacts={contacts} 
                isLoading={isLoading} 
                openEditModal={openEditModal} 
                confirmDelete={confirmDelete} 
              />
            )}
          </div>
        </main>

        {/* Modals */}
        <ContactModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          editingContact={editingContact}
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          statusMessage={statusMessage}
          avatarInputRef={avatarInputRef}
          handleAvatarUpload={handleAvatarUpload}
          isUploadingAvatar={isUploadingAvatar}
          user={user}
          handleLogin={handleLogin}
        />

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
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Confirm Delete</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Are you sure you want to delete this contact? This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 dark:shadow-red-900/20"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${active ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
