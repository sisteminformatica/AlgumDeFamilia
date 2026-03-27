import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Cake, Gift } from 'lucide-react';
import { Contact } from '../types';

export function DashboardView({ contacts }: { contacts: Contact[] }) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Calendar logic
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // Birthday logic
  const birthdaysThisMonth = contacts.filter(contact => {
    if (!contact.birth_date) return false;
    const monthPart = contact.birth_date.split('-')[1];
    return parseInt(monthPart) === currentMonth + 1;
  }).sort((a, b) => {
    const dayA = parseInt(a.birth_date!.split('-')[2]);
    const dayB = parseInt(b.birth_date!.split('-')[2]);
    return dayA - dayB;
  });

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Aniversariante</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Visão geral dos aniversariantes e eventos da Família.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Section */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="text-primary" size={20} />
              {monthNames[currentMonth]} {currentYear}
            </h3>
          </div>
          
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase py-2">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day[0]}</span>
              </div>
            ))}
            {blanks.map(blank => (
              <div key={`blank-${blank}`} className="aspect-square" />
            ))}
            {days.map(day => {
              const isToday = day === today.getDate();
              const hasBirthday = birthdaysThisMonth.some(c => parseInt(c.birth_date!.split('-')[2]) === day);
              
              return (
                <div 
                  key={day} 
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl border transition-all relative
                    ${isToday ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-slate-900/50 border-transparent dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'}
                  `}
                >
                  <span className="text-sm font-semibold">{day}</span>
                  {hasBirthday && !isToday && (
                    <div className="absolute bottom-1.5 size-1.5 bg-pink-500 rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Birthdays Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Cake className="text-pink-500" size={20} />
            Birthdays in {monthNames[currentMonth]}
          </h3>
          
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {birthdaysThisMonth.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="size-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 mb-3">
                  <Gift size={24} />
                </div>
                <p className="text-slate-400 dark:text-slate-500 text-sm italic">No birthdays this month.</p>
              </div>
            ) : (
              birthdaysThisMonth.map(contact => {
                const day = parseInt(contact.birth_date!.split('-')[2]);
                const isToday = day === today.getDate();
                
                return (
                  <motion.div 
                    key={contact.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-xl border transition-all flex items-center gap-4
                      ${isToday ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-100 dark:border-pink-900/30 ring-1 ring-pink-200 dark:ring-pink-900/50' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700'}
                    `}
                  >
                    <div className="relative">
                      <img 
                        src={contact.avatar_url} 
                        alt={contact.name} 
                        className="size-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute -bottom-1 -right-1 size-5 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm">
                        <Cake size={10} className="text-pink-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{contact.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{contact.company}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Day</p>
                      <p className={`text-lg font-black leading-none ${isToday ? 'text-pink-600 dark:text-pink-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {day}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
