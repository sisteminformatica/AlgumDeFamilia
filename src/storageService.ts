export async function uploadFile(uid: string, base64: string, path: string): Promise<string> {
  const uploadUrl = '/api/upload';
  console.log(`[Storage] Starting upload for uid: ${uid}, path: ${path} to ${uploadUrl}`);
  
  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64,
        path: `${uid}/${path}`
      }),
    });

    const contentType = response.headers.get("content-type");
    if (!response.ok) {
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      } else {
        const text = await response.text();
        console.error(`[Storage] Server returned non-JSON error (${response.status}):`, text.substring(0, 200));
        throw new Error(`Erro no servidor (${response.status}). O servidor pode estar fora do ar ou o arquivo é muito grande.`);
      }
    }

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      console.log(`[Storage] Upload successful, URL: ${data.url}`);
      return data.url;
    } else {
      throw new Error("O servidor retornou uma resposta inválida (não-JSON).");
    }
  } catch (error: any) {
    console.error('[Storage] Error in uploadFile:', error);
    throw error;
  }
}

export async function deleteFile(url: string): Promise<void> {
  if (!url || !url.includes('public.blob.vercel-storage.com')) return;
  
  try {
    const response = await fetch('/api/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error deleting file from Vercel Blob:', errorData.error);
    }
  } catch (error) {
    console.error('Error deleting file from Vercel Blob:', error);
  }
}
