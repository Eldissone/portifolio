-- Executar no Supabase: SQL Editor → New query → Run
-- Alternativa se `npm run db:push` continuar a travar

ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;

UPDATE "Service" SET "order" = 0 WHERE title = 'Domínio + Email Profissional';
UPDATE "Service" SET "order" = 1 WHERE title = 'Site Institucional';
UPDATE "Service" SET "order" = 2 WHERE title = 'Plataforma de Gestão';
UPDATE "Service" SET "order" = 3 WHERE title = 'Landing Page';
UPDATE "Service" SET "order" = 4 WHERE title = 'App com Integração de IA';
UPDATE "Service" SET "order" = 5 WHERE title = 'Consultoria & Mentoria';
