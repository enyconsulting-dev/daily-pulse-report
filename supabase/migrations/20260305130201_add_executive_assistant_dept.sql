-- Add Executive Assistant department
INSERT INTO departments (name) VALUES ('Executive Assistant') RETURNING id;

-- Add metrics for Executive Assistant (5 metrics)
WITH dept AS (
  SELECT id FROM departments WHERE name = 'Executive Assistant' LIMIT 1
)
INSERT INTO department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ((SELECT id FROM dept), 'Email correspondence', 'number', 1),
  ((SELECT id FROM dept), 'CEO''s Social Media outreach', 'number', 2),
  ((SELECT id FROM dept), 'CEO''s Social media DMs/ inquiries responded to', 'number', 3),
  ((SELECT id FROM dept), 'Meeting set-ups', 'number', 4),
  ((SELECT id FROM dept), 'Meeting reports drafted', 'number', 5);
