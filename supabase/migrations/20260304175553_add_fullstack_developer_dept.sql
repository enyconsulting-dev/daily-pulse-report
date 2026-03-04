-- Add Fullstack Developer department
INSERT INTO public.departments (id, name) VALUES
  ('d1000000-0000-0000-0000-000000000011', 'Fullstack Developer');

-- Seed metrics for Fullstack Developer
INSERT INTO public.department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000011', 'Internal Support tickets resolved', 'number', 1),
  ('d1000000-0000-0000-0000-000000000011', 'Issues & Conflict resolved', 'number', 2),
  ('d1000000-0000-0000-0000-000000000011', 'Features completed', 'number', 3),
  ('d1000000-0000-0000-0000-000000000011', 'Features updated', 'number', 4),
  ('d1000000-0000-0000-0000-000000000011', 'APIs integrated', 'number', 5),
  ('d1000000-0000-0000-0000-000000000011', 'APIs completed', 'number', 6),
  ('d1000000-0000-0000-0000-000000000011', 'APIs updated', 'number', 7),
  ('d1000000-0000-0000-0000-000000000011', 'Bugs Fixed', 'number', 8),
  ('d1000000-0000-0000-0000-000000000011', 'PR created', 'number', 9),
  ('d1000000-0000-0000-0000-000000000011', 'Number of pages done', 'number', 10),
  ('d1000000-0000-0000-0000-000000000011', 'Number of pages updated', 'number', 11);
