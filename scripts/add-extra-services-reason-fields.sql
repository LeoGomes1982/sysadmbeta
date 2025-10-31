-- Add new columns to extra_services table for service reason and related information
ALTER TABLE extra_services
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS absent_employee_name TEXT,
ADD COLUMN IF NOT EXISTS certificate_employee_name TEXT,
ADD COLUMN IF NOT EXISTS certificate_date DATE,
ADD COLUMN IF NOT EXISTS extra_cleaning_client TEXT,
ADD COLUMN IF NOT EXISTS other_reason_text TEXT;

-- Add comment to explain the columns
COMMENT ON COLUMN extra_services.reason IS 'Reason for extra service: falta, atestado, evento, limpeza_extra, outro';
COMMENT ON COLUMN extra_services.absent_employee_name IS 'Name of employee who was absent (when reason is falta)';
COMMENT ON COLUMN extra_services.certificate_employee_name IS 'Name of employee with medical certificate (when reason is atestado)';
COMMENT ON COLUMN extra_services.certificate_date IS 'Date of medical certificate (when reason is atestado)';
COMMENT ON COLUMN extra_services.extra_cleaning_client IS 'Client name for extra cleaning (when reason is limpeza_extra)';
COMMENT ON COLUMN extra_services.other_reason_text IS 'Description for other reasons (when reason is evento or outro)';
