import './env.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY;

export const publicBucket = process.env.SUPABASE_BUCKET || 'portfolio-uploads';
export const privateBucket = process.env.SUPABASE_PRIVATE_BUCKET || 'portfolio-private';
export const downloadTtlSeconds = Number(process.env.DOWNLOAD_URL_TTL_SECONDS || 900);
export const downloadTokenTtlHours = Number(process.env.DOWNLOAD_TOKEN_TTL_HOURS || 72);
export const downloadTokenMaxUses = Number(process.env.DOWNLOAD_TOKEN_MAX_USES || 3);

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  const keyType = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? 'service role'
    : 'anon (uploads podem falhar por RLS)';
  console.log(`✅ Supabase conectado (${keyType})`);
} else {
  console.warn('⚠️  Variáveis Supabase não configuradas (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)');
}

export function getSupabase() {
  return supabase;
}

export function sanitizeFileName(originalName) {
  return originalName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/__+/g, '_')
    .toLowerCase();
}

export async function uploadPublicImage(buffer, mimetype, originalName, folder = 'portfolio') {
  if (!supabase) throw new Error('Armazenamento não configurado');

  const fileName = `${Date.now()}-${sanitizeFileName(originalName)}`;
  const filePath = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from(publicBucket)
    .upload(filePath, buffer, { contentType: mimetype, upsert: false });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = error.statusCode;
    err.rlsBlocked =
      error.statusCode === '403' ||
      error.message?.includes('row-level security');
    throw err;
  }

  const { data: urlData } = supabase.storage.from(publicBucket).getPublicUrl(filePath);
  if (!urlData?.publicUrl) throw new Error('Erro ao gerar URL da imagem');

  return { filePath, publicUrl: urlData.publicUrl };
}

export async function uploadPrivatePdf(buffer, originalName, bookId) {
  if (!supabase) throw new Error('Armazenamento não configurado');

  const fileName = `${Date.now()}-${sanitizeFileName(originalName)}`;
  const filePath = `books/${bookId}/${fileName}`;

  const { error } = await supabase.storage
    .from(privateBucket)
    .upload(filePath, buffer, { contentType: 'application/pdf', upsert: false });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = error.statusCode;
    err.rlsBlocked =
      error.statusCode === '403' ||
      error.message?.includes('row-level security');
    throw err;
  }

  return filePath;
}

export async function createSignedDownloadUrl(filePath) {
  if (!supabase) throw new Error('Armazenamento não configurado');

  const { data, error } = await supabase.storage
    .from(privateBucket)
    .createSignedUrl(filePath, downloadTtlSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Erro ao gerar URL assinada');
  }

  return data.signedUrl;
}
