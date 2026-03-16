-- Add metrics for Programs/Operations Manager
INSERT INTO public.department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000009', 'Total Revenue generated (USD)', 'number', 15),
  ('d1000000-0000-0000-0000-000000000009', 'Total Revenue generated (NGN)', 'number', 16),
  ('d1000000-0000-0000-0000-000000000009', 'Total Revenue generated (CAD)', 'number', 17);

-- Add metrics for Automation Specialist
INSERT INTO public.department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000010', 'Work flow updated', 'number', 10),
  ('d1000000-0000-0000-0000-000000000010', 'Form created', 'number', 11),
  ('d1000000-0000-0000-0000-000000000010', 'Form updated', 'number', 12);