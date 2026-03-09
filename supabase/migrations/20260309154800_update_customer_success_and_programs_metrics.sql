-- Add 'Student deferral requests' metric to Customer Success Specialist
INSERT INTO department_metrics (department_id, metric_name, metric_type, sort_order)
VALUES (
  (SELECT id FROM departments WHERE name = 'Customer Success Specialist'),
  'Student deferral requests',
  'number',
  20
)
ON CONFLICT DO NOTHING;

-- Remove specified metrics from Programs/Operations Manager
DELETE FROM department_metrics
WHERE department_id = (SELECT id FROM departments WHERE name = 'Programs/Operations Manager')
  AND metric_name IN (
    'Student deferral requests',
    'Deferral requests',
    'Cross-functional alignment meetings held',
    'Daily revenue generated'
  );

-- Add 'Total revenue generated' to Programs/Operations Manager
INSERT INTO department_metrics (department_id, metric_name, metric_type, sort_order)
VALUES (
  (SELECT id FROM departments WHERE name = 'Programs/Operations Manager'),
  'Total revenue generated',
  'number',
  14
)
ON CONFLICT DO NOTHING;
