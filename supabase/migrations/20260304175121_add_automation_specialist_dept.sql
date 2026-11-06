-- Add Automation Specialist department
INSERT INTO public.departments (id, name) VALUES
  ('d1000000-0000-0000-0000-000000000010', 'Automation Specialist');

-- Seed metrics for Automation Specialist
INSERT INTO public.department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000010', 'Support tickets received', 'number', 1),
  ('d1000000-0000-0000-0000-000000000010', 'Support tickets resolved', 'number', 2),
  ('d1000000-0000-0000-0000-000000000010', 'Training conducted', 'number', 3),
  ('d1000000-0000-0000-0000-000000000010', 'Pipelines created', 'number', 4),
  ('d1000000-0000-0000-0000-000000000010', 'Number of bugs fixed', 'number', 5),
  ('d1000000-0000-0000-0000-000000000010', 'Documentations recorded (How Tos & Guides)', 'number', 6),
  ('d1000000-0000-0000-0000-000000000010', 'Workflows optimized', 'number', 7),
  ('d1000000-0000-0000-0000-000000000010', 'New workflows created', 'number', 8),
  ('d1000000-0000-0000-0000-000000000010', 'CRM optimized', 'number', 9);

