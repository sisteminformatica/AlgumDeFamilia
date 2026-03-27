export interface Contact {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status: 'Em casa' | 'No Trabalho' | 'Na Praia' | 'Fazendo Bagunça' | 'Dormindo';
  last_contacted: string;
  avatar_url: string;
  birth_date?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  metadata?: any;
  created_at?: string;
  uid?: string;
}

export interface Media {
  id: string;
  title: string;
  url: string;
  type: 'image' | 'video';
  category?: string;
  created_at: string;
  uid: string;
}

export interface Task {
  id: string;
  user_id?: number;
  title: string;
  description: string;
  due_date: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Completed';
  created_at: string;
  uid?: string;
}
