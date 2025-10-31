-- Habilitar Realtime para todas as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients_suppliers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.extra_services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.data_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_dependents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_evaluations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_inspections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_sanctions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.positions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.laws;
