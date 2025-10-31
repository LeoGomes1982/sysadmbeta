-- Create appointments table for storing appointments/meetings
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  tipo TEXT NOT NULL,
  descricao TEXT,
  responsaveis TEXT[] DEFAULT '{}',
  prioridade TEXT DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
  ON public.appointments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for faster queries by date
CREATE INDEX IF NOT EXISTS idx_appointments_data ON public.appointments(data);

-- Create index for faster queries by tipo
CREATE INDEX IF NOT EXISTS idx_appointments_tipo ON public.appointments(tipo);

-- Add comment to table
COMMENT ON TABLE public.appointments IS 'Stores appointments, meetings, and scheduled events';
