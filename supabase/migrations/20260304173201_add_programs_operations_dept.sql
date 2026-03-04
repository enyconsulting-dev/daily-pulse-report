-- Add Programs/Operations Manager department
INSERT INTO public.departments (id, name) VALUES
  ('d1000000-0000-0000-0000-000000000009', 'Programs/Operations Manager');

-- Seed metrics for Programs/Operations Manager
INSERT INTO public.department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000009', 'Confirmed enrollments', 'number', 1),
  ('d1000000-0000-0000-0000-000000000009', 'Daily revenue generated', 'number', 2),
  ('d1000000-0000-0000-0000-000000000009', 'Deferral requests', 'number', 3),
  ('d1000000-0000-0000-0000-000000000009', 'Escalated students queries handled', 'number', 4),
  ('d1000000-0000-0000-0000-000000000009', 'CBAP Applications completed', 'number', 5),
  ('d1000000-0000-0000-0000-000000000009', 'CBAP Applications approved', 'number', 6),
  ('d1000000-0000-0000-0000-000000000009', 'Cross-functional alignment meetings held', 'number', 7),
  ('d1000000-0000-0000-0000-000000000009', 'Operational issues received', 'number', 8),
  ('d1000000-0000-0000-0000-000000000009', 'Operational issues resolved', 'number', 9),
  ('d1000000-0000-0000-0000-000000000009', 'Staff absenteeism', 'number', 10);
