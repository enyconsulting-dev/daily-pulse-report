-- Update Graphics/Funnel Designer metrics to specific order
-- Update Programs/Operations Manager metrics by excluding only Total revenue generated

-- First, update Graphics/Funnel Designer metrics
DELETE FROM public.department_metrics
WHERE department_id = 'd1000000-0000-0000-0000-000000000006';

INSERT INTO public.department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000006', 'Number of program flyers designed', 'number', 1),
  ('d1000000-0000-0000-0000-000000000006', 'Number of carousels designed', 'number', 2),
  ('d1000000-0000-0000-0000-000000000006', 'Total Number of marketing creatives designed (carousels, flyers, email headers etc)', 'number', 3),
  ('d1000000-0000-0000-0000-000000000006', 'Number of presentation content requests fulfilled', 'number', 4),
  ('d1000000-0000-0000-0000-000000000006', 'Number of new funnels built', 'number', 5),
  ('d1000000-0000-0000-0000-000000000006', 'Number of old funnels updated', 'number', 6),
  ('d1000000-0000-0000-0000-000000000006', '% of projects delivered on/before deadline', 'percentage', 7);

-- Second, update Programs/Operations Manager metrics (excluding only Total revenue generated)
DELETE FROM public.department_metrics
WHERE department_id = 'd1000000-0000-0000-0000-000000000009';

INSERT INTO public.department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000009', 'Confirmed enrollments', 'number', 1),
  ('d1000000-0000-0000-0000-000000000009', 'Escalated students queries handled', 'number', 2),
  ('d1000000-0000-0000-0000-000000000009', 'CBAP Applications completed', 'number', 3),
  ('d1000000-0000-0000-0000-000000000009', 'CBAP Applications approved', 'number', 4),
  ('d1000000-0000-0000-0000-000000000009', 'Operational issues received', 'number', 5),
  ('d1000000-0000-0000-0000-000000000009', 'Operational issues resolved', 'number', 6),
  ('d1000000-0000-0000-0000-000000000009', 'Staff absenteeism', 'number', 7),
  ('d1000000-0000-0000-0000-000000000009', 'Team trainings held', 'number', 8),
  ('d1000000-0000-0000-0000-000000000009', 'Webinars held', 'number', 9),
  ('d1000000-0000-0000-0000-000000000009', 'Cross-functional team collaborations', 'number', 10),
  ('d1000000-0000-0000-0000-000000000009', 'Total Revenue generated (USD)', 'number', 11),
  ('d1000000-0000-0000-0000-000000000009', 'Total Revenue generated (NGN)', 'number', 12),
  ('d1000000-0000-0000-0000-000000000009', 'Total Revenue generated (CAD)', 'number', 13);