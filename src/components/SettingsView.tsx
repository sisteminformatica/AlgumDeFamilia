import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

interface SettingsViewProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  user: any;
  handleLogout: () => void;
}

export function SettingsView({ isDarkMode, setIsDarkMode, user, handleLogout }: SettingsViewProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
        <p className="text-slate-500 dark:text-slate-400">Manage your application preferences.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Appearance</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Customize how the application looks.</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Dark Mode</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Switch between light and dark themes.</p>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isDarkMode ? 'bg-primary' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <button
              onClick={() => setIsDarkMode(false)}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
                !isDarkMode 
                  ? 'border-primary bg-primary/5 text-primary' 
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <Sun size={24} />
              <span className="text-sm font-medium">Light</span>
            </button>

            <button
              onClick={() => setIsDarkMode(true)}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
                isDarkMode 
                  ? 'border-primary bg-primary/5 text-primary' 
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <Moon size={24} />
              <span className="text-sm font-medium">Dark</span>
            </button>

            <button
              disabled
              className="flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
            >
              <Monitor size={24} />
              <span className="text-sm font-medium">System</span>
            </button>
          </div>
        </div>
      </div>

      {user && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Account</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage your session and account details.</p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt={user.displayName || ''} className="size-12 rounded-full border-2 border-white dark:border-slate-700 shadow-sm object-cover" referrerPolicy="no-referrer" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{user.displayName || (user.isAnonymous ? 'Visitante Anônimo' : 'Usuário')}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{user.email || (user.isAnonymous ? 'Modo Nuvem Ativado' : '')}</p>
                </div>
              </div>
              {!user.isAnonymous && (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-200 dark:shadow-red-900/20"
                >
                  Sair da Conta
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
