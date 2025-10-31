-- Add points field to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Add birth certificate file URL to employee_dependents table  
ALTER TABLE employee_dependents ADD COLUMN IF NOT EXISTS birth_certificate_url TEXT;

-- Add file URL to employee_documents table
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add comment
COMMENT ON COLUMN employees.points IS 'Points earned/lost from positive/negative history events';
COMMENT ON COLUMN employee_dependents.birth_certificate_url IS 'URL of birth certificate file stored in Vercel Blob';
COMMENT ON COLUMN employee_documents.file_url IS 'URL of document file stored in Vercel Blob';
