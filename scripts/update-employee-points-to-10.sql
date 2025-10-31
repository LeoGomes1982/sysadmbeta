-- Update all employees with 0 or NULL points to have 10 points
UPDATE employees 
SET points = 10 
WHERE points IS NULL OR points = 0;

-- Set default value for points column to 10 for new employees
ALTER TABLE employees 
ALTER COLUMN points SET DEFAULT 10;

COMMENT ON COLUMN employees.points IS 'Employee points: starts at 10, +5 for positive history, -10 for negative history, +10 when status changes to Destaque';
