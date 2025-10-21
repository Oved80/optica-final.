-- =====================================
-- 🔧 Creación del tipo ENUM seguro
-- =====================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_enum') THEN
        CREATE TYPE rol_enum AS ENUM ('paciente', 'administrador', 'especialista');
    END IF;
END;
$$;

-- =====================================
-- 🧍 Tabla de usuarios
-- =====================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  rol rol_enum NOT NULL,
  telefono TEXT,
  direccion TEXT,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- =====================================
-- 👩‍⚕️ Tabla de pacientes
-- =====================================
CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  documento TEXT UNIQUE NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  direccion TEXT,
  observaciones TEXT,
  telefono TEXT,
  nombre TEXT NOT NULL
);

-- =====================================
-- 🩺 Tabla de especialistas
-- =====================================
CREATE TABLE IF NOT EXISTS especialistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  especialidad TEXT NOT NULL CHECK (especialidad IN ('ortopedista', 'optometra'))
);

-- =====================================
-- 📄 Tabla de exámenes
-- =====================================
CREATE TABLE IF NOT EXISTS examenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  especialista_id UUID REFERENCES especialistas(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  notas TEXT,
  pdf_path TEXT
);

-- =====================================
-- 📅 Tabla de citas
-- =====================================
CREATE TABLE IF NOT EXISTS citas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  especialista_id UUID REFERENCES especialistas(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  motivo TEXT,
  estado TEXT NOT NULL CHECK (estado IN ('agendada', 'cancelada'))
);

-- =====================================
-- ✅ Índices adicionales recomendados
-- =====================================
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_pacientes_usuario_id ON pacientes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha);
CREATE INDEX IF NOT EXISTS idx_examenes_fecha ON examenes(fecha);

-- =====================================
-- 🔐 Políticas RLS para la tabla examenes
-- =====================================

-- 1️⃣ Habilitar Row Level Security
ALTER TABLE IF EXISTS public.examenes ENABLE ROW LEVEL SECURITY;

-- 2️⃣ Eliminar políticas previas (para evitar conflictos si ya existen)
DROP POLICY IF EXISTS select_admin_or_owner ON public.examenes;
DROP POLICY IF EXISTS insert_by_especialista_or_admin ON public.examenes;
DROP POLICY IF EXISTS update_by_especialista_or_admin ON public.examenes;
DROP POLICY IF EXISTS delete_by_especialista_or_admin ON public.examenes;

-- 3️⃣ SELECT: admin, especialista o paciente dueño
CREATE POLICY select_admin_or_owner ON public.examenes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.rol = 'administrador')
    OR EXISTS (SELECT 1 FROM public.especialistas e WHERE e.usuario_id = auth.uid() AND e.id = examenes.especialista_id)
    OR EXISTS (SELECT 1 FROM public.pacientes p WHERE p.usuario_id = auth.uid() AND p.id = examenes.paciente_id)
  );

-- 4️⃣ INSERT: admin o especialista dueño del examen
CREATE POLICY insert_by_especialista_or_admin ON public.examenes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.rol = 'administrador')
    OR EXISTS (SELECT 1 FROM public.especialistas e WHERE e.usuario_id = auth.uid() AND e.id = examenes.especialista_id)
  );

-- 5️⃣ UPDATE: admin o especialista propietario
CREATE POLICY update_by_especialista_or_admin ON public.examenes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.rol = 'administrador')
    OR EXISTS (SELECT 1 FROM public.especialistas e WHERE e.usuario_id = auth.uid() AND e.id = examenes.especialista_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.rol = 'administrador')
    OR EXISTS (SELECT 1 FROM public.especialistas e WHERE e.usuario_id = auth.uid() AND e.id = examenes.especialista_id)
  );

-- 6️⃣ DELETE: admin o especialista propietario
CREATE POLICY delete_by_especialista_or_admin ON public.examenes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.rol = 'administrador')
    OR EXISTS (SELECT 1 FROM public.especialistas e WHERE e.usuario_id = auth.uid() AND e.id = examenes.especialista_id)
  );

-- Activa Row Level Security (si no está activo)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
