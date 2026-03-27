import React from 'react';
import { Linkedin, Twitter, Instagram, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Contact } from '../types';
import { StatusBadge } from './StatusBadge';

interface ContactsViewProps {
  contacts: Contact[];
  isLoading: boolean;
  openEditModal: (contact: Contact) => void;
  confirmDelete: (id: string) => void;
}

export function ContactsView({ contacts, isLoading, openEditModal, confirmDelete }: ContactsViewProps) {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Família</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Visualize e gerencie a lista da Família.</p>
      </div>

      {/* Table / Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">NOME</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">LOCAL TRABALHO</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Social</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Contacted</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">Loading contacts...</td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">No contacts found.</td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="relative overflow-hidden rounded-full size-9 border border-slate-200 dark:border-slate-700 group/avatar">
                          <img 
                            src={contact.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(contact.name)}`} 
                            alt={contact.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover/avatar:scale-110"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">{contact.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{contact.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{contact.company}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {contact.linkedin && (
                          <a href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 dark:text-slate-500 hover:text-[#0077b5] transition-colors">
                            <Linkedin size={16} />
                          </a>
                        )}
                        {contact.twitter && (
                          <a href={contact.twitter.startsWith('http') ? contact.twitter : `https://${contact.twitter}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 dark:text-slate-500 hover:text-[#1da1f2] transition-colors">
                            <Twitter size={16} />
                          </a>
                        )}
                        {contact.instagram && (
                          <a href={contact.instagram.startsWith('http') ? contact.instagram : `https://${contact.instagram}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 dark:text-slate-500 hover:text-[#e4405f] transition-colors">
                            <Instagram size={16} />
                          </a>
                        )}
                        {!contact.linkedin && !contact.twitter && !contact.instagram && <span className="text-slate-300 dark:text-slate-700 text-xs">-</span>}
                        {contact.metadata && Object.keys(contact.metadata).length > 0 && (
                          <div className="ml-2 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded text-[10px] font-bold uppercase tracking-wider" title={JSON.stringify(contact.metadata, null, 2)}>
                            JSON
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={contact.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{contact.last_contacted}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(contact)}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(contact.id)}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
          {isLoading ? (
            <div className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">No contacts found.</div>
          ) : (
            contacts.map((contact) => (
              <div key={contact.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative overflow-hidden rounded-full size-10 border border-slate-200 dark:border-slate-700 group/avatar">
                      <img 
                        src={contact.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(contact.name)}`} 
                        alt={contact.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/avatar:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{contact.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{contact.email}</div>
                    </div>
                  </div>
                  <StatusBadge status={contact.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{contact.company}</span>
                  <span>Last: {contact.last_contacted}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    {contact.linkedin && (
                      <a href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 dark:text-slate-500">
                        <Linkedin size={16} />
                      </a>
                    )}
                    {contact.twitter && (
                      <a href={contact.twitter.startsWith('http') ? contact.twitter : `https://${contact.twitter}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 dark:text-slate-500">
                        <Twitter size={16} />
                      </a>
                    )}
                    {contact.instagram && (
                      <a href={contact.instagram.startsWith('http') ? contact.instagram : `https://${contact.instagram}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 dark:text-slate-500">
                        <Instagram size={16} />
                      </a>
                    )}
                    {contact.metadata && Object.keys(contact.metadata).length > 0 && (
                      <div className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded text-[10px] font-bold uppercase tracking-wider">
                        JSON
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openEditModal(contact)}
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-primary"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => confirmDelete(contact.id)}
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between mt-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Showing <span className="font-medium text-slate-700 dark:text-slate-300">1</span> to <span className="font-medium text-slate-700 dark:text-slate-300">{contacts.length}</span> of <span className="font-medium text-slate-700 dark:text-slate-300">{contacts.length}</span> results
        </div>
        <div className="flex gap-1">
          <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors" disabled>
            <ChevronLeft size={16} />
          </button>
          <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white">1</button>
          <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
