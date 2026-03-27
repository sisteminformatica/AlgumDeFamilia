export const compressImage = (base64Str: string, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Explicitly use window.Image to avoid conflicts with other 'Image' variables
    if (typeof window === 'undefined' || !window.Image) {
      reject(new Error('Ambiente não suporta construtor de Imagem (window.Image)'));
      return;
    }
    
    const img = new window.Image();
    img.src = base64Str;
    img.onerror = () => reject(new Error('Erro ao carregar imagem para compressão'));
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível obter o contexto do canvas'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        const result = canvas.toDataURL('image/jpeg', quality);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
  });
};
