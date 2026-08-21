-- Bucket publico para los videos institucionales que se muestran en
-- /sobre-nosotros. Los mp4 no van al repo: pesan varios MB y el repo es
-- publico. Correr en el SQL Editor de Supabase.

-- 1. El bucket. `public = true` sirve los objetos por URL sin firmar, que es
--    lo que necesita el <video> del navegador. 20 MB de tope alcanza de sobra:
--    los tres videos comprimidos suman menos de 10 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 20971520, array['video/mp4'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. Lectura publica. Un bucket `public` ya se sirve por el endpoint
--    /object/public/, pero la policy deja explicito que anon solo lee: no hay
--    ninguna de insert, update ni delete, asi que subir archivos sigue siendo
--    cosa del dashboard o de la service role.
drop policy if exists "videos_public_read" on storage.objects;
create policy "videos_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'videos');

-- 3. Verificacion.
select id, public, file_size_limit from storage.buckets where id = 'videos';

-- Despues de correr esto hay que subir los archivos al bucket (Storage ->
-- videos -> Upload), con estos nombres exactos, que son los que espera
-- lib/videos.ts:
--   teclab-carreras.mp4
--   identidad-diplomaturas.mp4
--   cau-institucional.mp4        (todavia sin renderizar)
