-- Add new metrics for Fullstack Developer (keeping existing ones)
INSERT INTO department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000011', 'Pages created', 'number', 12),
  ('d1000000-0000-0000-0000-000000000011', 'Pages updated', 'number', 13),
  ('d1000000-0000-0000-0000-000000000011', 'Features updated', 'number', 14),
  ('d1000000-0000-0000-0000-000000000011', 'API updated', 'number', 15),
  ('d1000000-0000-0000-0000-000000000011', 'Issues and conflict resolved', 'number', 16),
  ('d1000000-0000-0000-0000-000000000011', 'Bug fixed', 'number', 17);
