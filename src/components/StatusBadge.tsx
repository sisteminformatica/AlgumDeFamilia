import React from 'react';
import { Contact } from '../types';

export function StatusBadge({ status }: { status: Contact['status'] }) {
  const styles = {
    'Em casa': 'bg-amber-100 text-amber-800',
    'No Trabalho': 'bg-blue-100 text-blue-800',
    'Na Praia': 'bg-emerald-100 text-emerald-800',
    'Fazendo Bagunça': 'bg-purple-100 text-purple-800',
    'Dormindo': 'bg-slate-100 text-slate-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}
