-- Create employee_updates table
CREATE TABLE IF NOT EXISTS employee_updates (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  update_date DATE NOT NULL,
  update_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_employee_updates_employee_id ON employee_updates(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_updates_date ON employee_updates(update_date DESC);

-- Enable RLS
ALTER TABLE employee_updates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Enable all operations for employee_updates" ON employee_updates
  FOR ALL
  USING (true)
  WITH CHECK (true);
