import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Upload, Image as ImageIcon, Film, X, Youtube, Link } from 'lucide-react';
import { mediaService } from '../dataService';
import { Media } from '../types';
import { compressImage } from '../utils/imageCompression';

interface DealsViewProps {
  user: {
    uid: string;
    displayName: string;
    email: string;
  };
  handleLogin: () => void;
}

export function DealsView({ user, handleLogin }: DealsViewProps) {
  console.log('Rendering DealsView for user:', user.uid);
  const [media, setMedia] = useState<Media[]>([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);
  const [deletedMediaIds, setDeletedMediaIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('deleted_media_ids');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('deleted_media_ids', JSON.stringify(deletedMediaIds));
  }, [deletedMediaIds]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Geral');
  const [uploadCategory, setUploadCategory] = useState('Geral');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<{ id: string, isDefault: boolean } | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const uploadInProgress = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = mediaService.subscribe(user.uid, (data) => {
      console.log('Media subscription update, count:', data.length);
      setMedia(data);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const categories = ['Geral', 'Cecília', 'Carolzinha', 'Camilinha', 'Robson', 'Breno', 'Vanvan', 'Berim'];

  const images = React.useMemo(() => media.filter(m => m.type === 'image'), [media]);
  const videos = React.useMemo(() => media.filter(m => m.type === 'video'), [media]);

  // Fallback data if none uploaded
  const defaultImages = React.useMemo(() => [
    { id: 'def1', url: 'https://picsum.photos/seed/deal1/1200/600', title: 'Corporate Headquarters Deal', type: 'image' as const, category: 'Geral' },
    { id: 'def2', url: 'https://picsum.photos/seed/deal2/1200/600', title: 'Tech Hub Expansion', type: 'image' as const, category: 'Geral' },
  ], []);

  const defaultVideos = React.useMemo(() => [
    { id: 'defv5', url: 'https://www.youtube.com/embed/UL9-2W7Zeys', title: 'Novo Vídeo Família', type: 'video' as const, category: 'Geral' },
    { id: 'defv4', url: 'https://www.youtube.com/embed/Q01MsEkvhUw', title: 'Novo Destaque Família', type: 'video' as const, category: 'Geral' },
    { id: 'defv3', url: 'https://www.youtube.com/embed/OvYLe1gnC3I', title: 'Vídeo Principal Família', type: 'video' as const, category: 'Geral' },
    { id: 'defv1', url: 'https://www.youtube.com/embed/UL9-2W7Zeys', title: 'Família Highlights 1', type: 'video' as const, category: 'Geral' },
    { id: 'defv2', url: 'https://www.youtube.com/embed/9bZkp7q19f0', title: 'Família Highlights 2', type: 'video' as const, category: 'Geral' },
  ], []);

  const displayImages = React.useMemo(() => 
    [...images, ...defaultImages].filter(m => !deletedMediaIds.includes(m.id) && (m.category === selectedCategory || (!m.category && selectedCategory === 'Geral'))),
    [images, defaultImages, deletedMediaIds, selectedCategory]
  );

  const displayVideos = React.useMemo(() => 
    [...videos, ...defaultVideos].filter(m => !deletedMediaIds.includes(m.id) && (m.category === selectedCategory || (!m.category && selectedCategory === 'Geral'))),
    [videos, defaultVideos, deletedMediaIds, selectedCategory]
  );

  useEffect(() => {
    if (imageIndex >= displayImages.length && displayImages.length > 0) {
      setImageIndex(0);
    }
  }, [displayImages.length]);

  useEffect(() => {
    if (videoIndex >= displayVideos.length && displayVideos.length > 0) {
      setVideoIndex(0);
    }
  }, [displayVideos.length]);

  const nextImage = () => setImageIndex((prev) => (prev + 1) % displayImages.length);
  const prevImage = () => setImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);

  const nextVideo = () => setVideoIndex((prev) => (prev + 1) % displayVideos.length);
  const prevVideo = () => setVideoIndex((prev) => (prev - 1 + displayVideos.length) % displayVideos.length);

  const handleAddYoutubeLink = async () => {
    if (!youtubeUrl || isUploading || uploadInProgress.current) return;
    
    // Simple YouTube URL to Embed URL conversion
    let embedUrl = youtubeUrl;
    if (youtubeUrl.includes('youtube.com/watch?v=')) {
      embedUrl = youtubeUrl.replace('watch?v=', 'embed/').split('&')[0];
    } else if (youtubeUrl.includes('youtu.be/')) {
      embedUrl = youtubeUrl.replace('youtu.be/', 'youtube.com/embed/').split('?')[0];
    }
    
    if (!embedUrl.includes('youtube.com/embed/')) {
      setUploadError('URL do YouTube inválida. Use o formato: https://www.youtube.com/watch?v=... ou https://youtu.be/...');
      return;
    }

    try {
      uploadInProgress.current = true;
      setIsUploading(true);
      setUploadError(null);
      
      await mediaService.create(user.uid, {
        title: youtubeTitle || 'Vídeo do YouTube',
        url: embedUrl,
        type: 'video',
        category: uploadCategory
      });
      
      setShowYoutubeModal(false);
      setYoutubeUrl('');
      setYoutubeTitle('');
    } catch (error: any) {
      console.error('Error adding YouTube link:', error);
      setUploadError(error.message || 'Erro ao adicionar link do YouTube');
    } finally {
      uploadInProgress.current = false;
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading || uploadInProgress.current) {
      console.log('Upload already in progress, ignoring file selection');
      return;
    }
    
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log('File selected for upload:', file.name);
    setPendingFile(file);
    setShowUploadModal(true);
    
    // Clear input value so same file can be selected again if needed
    if (e.target) e.target.value = '';
  };

  const confirmFileUpload = async () => {
    if (!pendingFile || uploadInProgress.current) {
      console.log('Upload already in progress or no file pending');
      return;
    }
    
    const file = pendingFile;
    const isImage = file.type.startsWith('image');
    const isVideo = file.type.startsWith('video');

    // For videos, we still need a hard limit as client-side compression is complex
    if (isVideo && file.size > 800 * 1024) {
      setUploadError('O vídeo é muito grande. O limite para vídeos é de 800KB.');
      resetUploadState();
      return;
    }

    console.group('File Upload Process');
    try {
      uploadInProgress.current = true;
      setIsUploading(true);
      setUploadError(null);

      console.log('Reading file:', file.name);
      const reader = new FileReader();
      
      const readFile = () => new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
        reader.readAsDataURL(file);
      });

      let base64String = await readFile();
      console.log('File read, length:', base64String.length);
      
      if (isImage) {
        if (file.size > 300 * 1024 || base64String.length > 400 * 1024) {
          console.log('Compressing image...');
          base64String = await compressImage(base64String);
          console.log('Image compressed, new length:', base64String.length);
          
          if (base64String.length > 5000 * 1024) {
             throw new Error('O arquivo é muito grande. Tente um arquivo menor.');
          }
        }
      }
      
      console.log('Saving to mediaService...');
      await mediaService.create(user.uid, {
        title: file.name,
        url: base64String,
        type: isVideo ? 'video' : 'image',
        category: uploadCategory
      });
      console.log('Upload complete');
    } catch (error: any) {
      console.error('Error in confirmFileUpload:', error);
      let errorMessage = error.message || 'Erro ao fazer upload do arquivo.';
      if (errorMessage.includes('Missing or insufficient permissions')) {
        errorMessage = 'Você não tem permissão para salvar na nuvem. Por favor, faça login com Google.';
      }
      setUploadError(errorMessage);
    } finally {
      resetUploadState();
      console.groupEnd();
    }
  };

  const resetUploadState = () => {
    console.log('Resetting upload state');
    uploadInProgress.current = false;
    setIsUploading(false);
    setShowUploadModal(false);
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMediaToDelete({ id, isDefault: id.startsWith('def') });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!mediaToDelete) return;
    
    const { id, isDefault } = mediaToDelete;
    
    if (isDefault) {
      setDeletedMediaIds(prev => [...prev, id]);
    } else {
      await mediaService.delete(id);
    }
    
    setShowDeleteModal(false);
    setMediaToDelete(null);
  };

  return (
    <div className="space-y-8 sm:space-y-12 w-full pb-12 m-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 p-4 sm:p-8 lg:p-12 pb-0 sm:pb-0 lg:pb-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Fotos/Vídeos</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">Galeria de fotos e vídeos da Família.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <input 
            type="file" 
            ref={videoInputRef}
            onChange={handleFileUpload}
            accept="video/*"
            className="hidden"
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <ImageIcon size={18} className="text-primary" />
            Foto
          </button>

          <button 
            onClick={() => videoInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Film size={18} className="text-primary" />
            Vídeo
          </button>

          <button 
            onClick={() => setShowYoutubeModal(true)}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer"
          >
            <Youtube size={18} />
            Link YouTube
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 sm:px-8 lg:px-12 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
              selectedCategory === cat 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="text-primary" />
                  Upload de Mídia
                </h3>
                <button onClick={resetUploadState} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Arquivo selecionado: <span className="font-bold text-slate-900 dark:text-white">{pendingFile?.name}</span>
                </p>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Selecione o Sub-grupo (Evento)</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setUploadCategory(cat)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                          uploadCategory === cat 
                            ? 'bg-primary text-white' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                <button 
                  onClick={resetUploadState}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmFileUpload}
                  disabled={isUploading}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isUploading ? 'Enviando...' : 'Confirmar Upload'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showYoutubeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Youtube className="text-red-500" />
                  Adicionar Vídeo
                </h3>
                <button onClick={() => setShowYoutubeModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sub-grupo (Evento)</label>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setUploadCategory(cat)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                          uploadCategory === cat 
                            ? 'bg-primary text-white' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Título do Vídeo</label>
                  <input 
                    type="text"
                    value={youtubeTitle}
                    onChange={(e) => setYoutubeTitle(e.target.value)}
                    placeholder="Ex: Highlights da Partida"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">URL do YouTube</label>
                  <div className="relative">
                    <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Dica: Você também pode fazer upload de arquivos curtos (&lt;800KB) usando o botão "Vídeo".</p>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                <button 
                  onClick={() => setShowYoutubeModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddYoutubeLink}
                  disabled={!youtubeUrl || isUploading}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isUploading ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {uploadError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Image Carousel */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-4 sm:px-8 lg:px-12">
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <ImageIcon size={20} className="text-primary" />
            Galeria de Fotos
          </h3>
          <div className="flex gap-2 items-center">
            {displayImages.length > 0 && displayImages[imageIndex] && !displayImages[imageIndex].id?.startsWith('def') && (
              <button 
                onClick={(e) => handleDelete(displayImages[imageIndex]!.id, e)}
                className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all border border-red-100 dark:border-red-900/30 mr-2 cursor-pointer"
                title="Excluir Foto Atual"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Excluir</span>
              </button>
            )}
            <button onClick={prevImage} className="p-1.5 sm:p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm dark:text-white cursor-pointer">
              <ChevronLeft size={18} />
            </button>
            <button onClick={nextImage} className="p-1.5 sm:p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm dark:text-white cursor-pointer">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        
        <div className="relative aspect-video sm:aspect-[21/9] overflow-hidden bg-slate-100 dark:bg-slate-900 group">
          {displayImages.length > 0 ? (
            <AnimatePresence mode="wait">
            <motion.div
              key={displayImages[imageIndex]?.id || 'empty-image'}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <img 
                src={displayImages[imageIndex]?.url} 
                alt={displayImages[imageIndex]?.title}
                className="w-full h-full min-w-full min-h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 inset-x-0 p-4 sm:p-8 bg-gradient-to-t from-black/80 to-transparent text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg sm:text-2xl font-bold">{displayImages[imageIndex]?.title}</h4>
                    <p className="text-xs sm:text-base text-white/70">
                      {displayImages[imageIndex]?.id?.startsWith('def') ? 'Exemplo de mídia' : `Adicionado em ${new Date((displayImages[imageIndex] as any)?.created_at || Date.now()).toLocaleDateString()}`}
                    </p>
                  </div>
                  {displayImages[imageIndex] && (
                    <button 
                      onClick={(e) => handleDelete(displayImages[imageIndex]!.id, e)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg backdrop-blur-sm transition-colors cursor-pointer"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
              <ImageIcon size={48} className="mb-4 opacity-20" />
              <p>Nenhuma imagem na galeria</p>
            </div>
          )}
        </div>
      </section>

      {/* Video Carousel */}
      <section className="space-y-4 w-full">
        <div className="flex items-center justify-between px-4 sm:px-8 lg:px-12">
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Film size={20} className="text-primary" />
            Galeria de Vídeos
          </h3>
          <div className="flex gap-2 items-center">
            {displayVideos.length > 0 && displayVideos[videoIndex] && !displayVideos[videoIndex].id?.startsWith('def') && (
              <button 
                onClick={(e) => handleDelete(displayVideos[videoIndex]!.id, e)}
                className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all border border-red-100 dark:border-red-900/30 mr-2 cursor-pointer"
                title="Excluir Vídeo Atual"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Excluir</span>
              </button>
            )}
            <button onClick={prevVideo} className="p-1.5 sm:p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm dark:text-white cursor-pointer">
              <ChevronLeft size={18} />
            </button>
            <button onClick={nextVideo} className="p-1.5 sm:p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm dark:text-white cursor-pointer">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        
        <div className="relative w-full aspect-video overflow-hidden bg-black group">
          {displayVideos.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={displayVideos[videoIndex]?.id || 'empty-video'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 w-full h-full"
              >
              {displayVideos[videoIndex]?.url?.includes('youtube.com') ? (
                <iframe 
                  src={displayVideos[videoIndex]?.url} 
                  className="absolute inset-0 w-full h-full z-10 border-0"
                  title={displayVideos[videoIndex]?.title}
                  width="100%"
                  height="100%"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  <div className="absolute inset-0 overflow-hidden">
                    <video 
                      src={displayVideos[videoIndex]?.url} 
                      className="w-full h-full object-cover blur-2xl opacity-30 scale-110"
                      muted
                    />
                  </div>
                  <video 
                    src={displayVideos[videoIndex]?.url} 
                    className="w-full h-full object-cover relative z-10"
                    controls
                  />
                </>
              )}
              
              <div className="absolute top-2 left-2 sm:top-4 sm:left-4 right-2 sm:right-4 flex items-center justify-between pointer-events-none">
                <div className="px-3 py-1 sm:px-4 sm:py-2 bg-black/50 backdrop-blur-md rounded-full text-white text-[10px] sm:text-sm font-semibold">
                  {displayVideos[videoIndex]?.title}
                </div>
                {displayVideos[videoIndex] && (
                  <button 
                    onClick={(e) => handleDelete(displayVideos[videoIndex]!.id, e)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg backdrop-blur-sm transition-colors cursor-pointer pointer-events-auto"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <Film size={48} className="mb-4 opacity-20" />
              <p>Nenhum vídeo na galeria</p>
            </div>
          )}
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center"
            >
              <div className="size-16 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Confirmar Exclusão</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Tem certeza que deseja excluir esta mídia? Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
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
