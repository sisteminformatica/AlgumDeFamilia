import { Contact, Task, Media } from './types';
import { 
  db, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  handleFirestoreError,
  OperationType
} from './firebase';
import { uploadFile, deleteFile } from './storageService';

export const contactService = {
  async getAll(uid: string, search: string = ''): Promise<Contact[]> {
    try {
      const q = query(
        collection(db, 'contacts'),
        where('uid', '==', uid)
      );
      const snapshot = await getDocs(q);
      let contacts = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          ...data, 
          id: doc.id,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at 
        } as Contact;
      });
      
      // Sort in-memory to avoid index requirement
      contacts.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
      
      if (search) {
        const lowerSearch = search.toLowerCase();
        contacts = contacts.filter(c => 
          c.name.toLowerCase().includes(lowerSearch) || 
          c.company?.toLowerCase().includes(lowerSearch) || 
          c.email?.toLowerCase().includes(lowerSearch)
        );
      }
      return contacts;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'contacts');
      return [];
    }
  },

  subscribe(uid: string, callback: (contacts: Contact[]) => void) {
    if (!uid || uid === 'loading') return () => {};
    const q = query(
      collection(db, 'contacts'),
      where('uid', '==', uid)
    );
    
    return onSnapshot(q, (snapshot) => {
      const contacts = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          ...data, 
          id: doc.id,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at 
        } as Contact;
      });
      
      // Sort in-memory
      contacts.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
      
      callback(contacts);
    }, (error) => {
      console.error('Contacts subscription error:', error);
      // Don't throw here to avoid crashing the app in a loop
    });
  },

  async create(uid: string, contact: Partial<Contact>): Promise<void> {
    const path = 'contacts';
    try {
      const newDocRef = doc(collection(db, path));
      const last_contacted = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      let avatar_url = contact.avatar_url;
      // If it's a base64 string, upload to storage
      if (avatar_url && avatar_url.startsWith('data:')) {
        avatar_url = await uploadFile(uid, avatar_url, 'avatars');
      }
      
      await setDoc(newDocRef, {
        ...contact,
        id: newDocRef.id,
        uid,
        last_contacted,
        avatar_url: avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(contact.name || 'Familiar')}`,
        created_at: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async update(id: string, updates: Partial<Contact>): Promise<void> {
    const path = `contacts/${id}`;
    try {
      const docRef = doc(db, 'contacts', id);
      
      let avatar_url = updates.avatar_url;
      // If it's a base64 string, upload to storage
      if (avatar_url && avatar_url.startsWith('data:')) {
        // Find existing doc to delete old image if needed
        // (For simplicity, we'll just upload the new one)
        avatar_url = await uploadFile(updates.uid || 'unknown', avatar_url, 'avatars');
      }
      
      await updateDoc(docRef, { ...updates, avatar_url });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async delete(id: string): Promise<void> {
    const path = `contacts/${id}`;
    try {
      // Optional: Delete from storage first
      // const docSnap = await getDoc(doc(db, 'contacts', id));
      // const data = docSnap.data();
      // if (data?.avatar_url) await deleteFile(data.avatar_url);
      
      await deleteDoc(doc(db, 'contacts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};

export const taskService = {
  async getAll(uid: string): Promise<Task[]> {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('uid', '==', uid)
      );
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          ...data, 
          id: doc.id,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at 
        } as Task;
      });

      // Sort in-memory
      tasks.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      return tasks;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
      return [];
    }
  },

  subscribe(uid: string, callback: (tasks: Task[]) => void) {
    if (!uid || uid === 'loading') return () => {};
    const q = query(
      collection(db, 'tasks'),
      where('uid', '==', uid)
    );
    
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          ...data, 
          id: doc.id,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at 
        } as Task;
      });

      // Sort in-memory
      tasks.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      callback(tasks);
    }, (error) => {
      console.error('Tasks subscription error:', error);
    });
  },

  async create(uid: string, task: Partial<Task>): Promise<void> {
    const path = 'tasks';
    try {
      const newDocRef = doc(collection(db, path));
      await setDoc(newDocRef, {
        ...task,
        id: newDocRef.id,
        uid,
        status: 'Pending',
        created_at: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async update(id: string, updates: Partial<Task>): Promise<void> {
    const path = `tasks/${id}`;
    try {
      const docRef = doc(db, 'tasks', id);
      await updateDoc(docRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async delete(id: string): Promise<void> {
    const path = `tasks/${id}`;
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};

export const mediaService = {
  subscribe(uid: string, callback: (media: Media[]) => void) {
    if (!uid || uid === 'loading') return () => {};
    const q = query(
      collection(db, 'media'),
      where('uid', '==', uid)
    );
    
    return onSnapshot(q, (snapshot) => {
      const media = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          ...data, 
          id: doc.id,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at 
        } as Media;
      });

      // Sort in-memory
      media.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      callback(media);
    }, (error) => {
      console.error('Media subscription error:', error);
    });
  },

  async create(uid: string, media: Partial<Media>): Promise<void> {
    console.log(`[MediaService] Creating media for uid: ${uid}, type: ${media.type}`);
    const path = 'media';
    try {
      let url = media.url;
      // If it's a base64 string, upload to storage
      if (url && url.startsWith('data:')) {
        console.log('[MediaService] Data URL detected, uploading to storage...');
        url = await uploadFile(uid, url, 'gallery');
        console.log(`[MediaService] File uploaded, new URL: ${url}`);
      }
      
      console.log('[MediaService] Adding document to Firestore...');
      const newDocRef = doc(collection(db, path));
      await setDoc(newDocRef, {
        ...media,
        url,
        id: newDocRef.id,
        uid,
        created_at: serverTimestamp()
      });
      console.log(`[MediaService] Document added with ID: ${newDocRef.id}`);
    } catch (error) {
      console.error('[MediaService] Error in create:', error);
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async delete(id: string): Promise<void> {
    const path = `media/${id}`;
    try {
      await deleteDoc(doc(db, 'media', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
