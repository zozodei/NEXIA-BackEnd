-- ============================================================
-- MIGRACIÓN — Configuración de usuario
-- Agrega a public.usuario los campos de preferencias que
-- alimentan la pantalla "Configuración": foto de perfil,
-- tema, idioma, notificaciones por email y fechas de auditoría.
--
-- Idempotente: puede ejecutarse más de una vez sin error.
-- Ejecutar contra la base de Supabase (SQL Editor o psql).
-- ============================================================

-- Foto de perfil — URL a la imagen (el binario NO se guarda en la DB)
ALTER TABLE public.usuario
  ADD COLUMN IF NOT EXISTS foto_perfil_url text;

-- Tema (claro / oscuro)
ALTER TABLE public.usuario
  ADD COLUMN IF NOT EXISTS tema character varying NOT NULL DEFAULT 'claro';

-- Idioma (código tipo 'es', 'en' — pensado para futura expansión multi-idioma)
ALTER TABLE public.usuario
  ADD COLUMN IF NOT EXISTS idioma character varying NOT NULL DEFAULT 'es';

-- Preferencia de notificaciones por email
ALTER TABLE public.usuario
  ADD COLUMN IF NOT EXISTS notificaciones_email boolean NOT NULL DEFAULT true;

-- Fecha de última actualización (auditoría / invalidación de caché)
ALTER TABLE public.usuario
  ADD COLUMN IF NOT EXISTS fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Fecha de creación del usuario
ALTER TABLE public.usuario
  ADD COLUMN IF NOT EXISTS fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- Restricción de valores válidos para "tema".
-- Se agrega sólo si aún no existe (ADD CONSTRAINT no admite IF NOT EXISTS).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usuario_tema_check'
  ) THEN
    ALTER TABLE public.usuario
      ADD CONSTRAINT usuario_tema_check CHECK (tema IN ('claro', 'oscuro'));
  END IF;
END $$;
