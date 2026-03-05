-- Restore all department metrics

-- Sales/Enrollment Specialist metrics
INSERT INTO department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ((SELECT id FROM departments WHERE name = 'Sales/Enrollment Specialist'), 'New Enrollments', 'number', 1),
  ((SELECT id FROM departments WHERE name = 'Sales/Enrollment Specialist'), 'Enrollment inquiries handled', 'number', 2),
  ((SELECT id FROM departments WHERE name = 'Sales/Enrollment Specialist'), 'Proposal documents sent', 'number', 3),
  ((SELECT id FROM departments WHERE name = 'Sales/Enrollment Specialist'), 'Payment installments set up', 'number', 4),
  ((SELECT id FROM departments WHERE name = 'Sales/Enrollment Specialist'), 'Follow-up calls made', 'number', 5),
  ((SELECT id FROM departments WHERE name = 'Sales/Enrollment Specialist'), 'Conversion Rate', 'percentage', 6),
  ((SELECT id FROM departments WHERE name = 'Sales/Enrollment Specialist'), 'Customer satisfaction score', 'number', 7),
  ((SELECT id FROM departments WHERE name = 'Sales/Enrollment Specialist'), 'USD revenue generated (new payments)', 'number', 8),
  ((SELECT id FROM departments WHERE name = 'Sales/Enrollment Specialist'), 'USD revenue generated (balance payments)', 'number', 9),
  ((SELECT id FROM departments WHERE name = 'Sales/Enrollment Specialist'), 'CAD revenue generated (new payments)', 'number', 10),
  ((SELECT id FROM departments WHERE name = 'Sales/Enrollment Specialist'), 'CAD revenue generated (balance payments)', 'number', 11),
  ((SELECT id FROM departments WHERE name = 'Sales/Enrollment Specialist'), 'Naira revenue generated (new payments)', 'number', 12),
  ((SELECT id FROM departments WHERE name = 'Sales/Enrollment Specialist'), 'Naira revenue generated (balance payments)', 'number', 13);

-- Programs/Operations Manager metrics (original 10 + 3 new)
INSERT INTO department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ((SELECT id FROM departments WHERE name = 'Programs/Operations Manager'), 'Confirmed enrollments', 'number', 1),
  ((SELECT id FROM departments WHERE name = 'Programs/Operations Manager'), 'Daily revenue generated', 'number', 2),
  ((SELECT id FROM departments WHERE name = 'Programs/Operations Manager'), 'Deferral requests', 'number', 3),
  ((SELECT id FROM departments WHERE name = 'Programs/Operations Manager'), 'Escalated students queries handled', 'number', 4),
  ((SELECT id FROM departments WHERE name = 'Programs/Operations Manager'), 'CBAP Applications completed', 'number', 5),
  ((SELECT id FROM departments WHERE name = 'Programs/Operations Manager'), 'CBAP Applications approved', 'number', 6),
  ((SELECT id FROM departments WHERE name = 'Programs/Operations Manager'), 'Cross-functional alignment meetings held', 'number', 7),
  ((SELECT id FROM departments WHERE name = 'Programs/Operations Manager'), 'Operational issues received', 'number', 8),
  ((SELECT id FROM departments WHERE name = 'Programs/Operations Manager'), 'Operational issues resolved', 'number', 9),
  ((SELECT id FROM departments WHERE name = 'Programs/Operations Manager'), 'Staff absenteeism', 'number', 10),
  ((SELECT id FROM departments WHERE name = 'Programs/Operations Manager'), 'Team trainings held', 'number', 11),
  ((SELECT id FROM departments WHERE name = 'Programs/Operations Manager'), 'Webinars held', 'number', 12),
  ((SELECT id FROM departments WHERE name = 'Programs/Operations Manager'), 'Cross-functional team collaborations', 'number', 13);

-- Automation Specialist metrics
INSERT INTO department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ((SELECT id FROM departments WHERE name = 'Automation Specialist'), 'Workflows created', 'number', 1),
  ((SELECT id FROM departments WHERE name = 'Automation Specialist'), 'Workflow bugs fixed', 'number', 2),
  ((SELECT id FROM departments WHERE name = 'Automation Specialist'), 'Manual processes automated', 'number', 3),
  ((SELECT id FROM departments WHERE name = 'Automation Specialist'), 'Hours saved through automation', 'number', 4),
  ((SELECT id FROM departments WHERE name = 'Automation Specialist'), 'API integrations completed', 'number', 5),
  ((SELECT id FROM departments WHERE name = 'Automation Specialist'), 'Data sync tasks managed', 'number', 6),
  ((SELECT id FROM departments WHERE name = 'Automation Specialist'), 'Automation documentation updated', 'number', 7),
  ((SELECT id FROM departments WHERE name = 'Automation Specialist'), 'Team training sessions held', 'number', 8),
  ((SELECT id FROM departments WHERE name = 'Automation Specialist'), 'Support tickets resolved', 'number', 9);

-- Fullstack Developer metrics
INSERT INTO department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ((SELECT id FROM departments WHERE name = 'Fullstack Developer'), 'Features developed', 'number', 1),
  ((SELECT id FROM departments WHERE name = 'Fullstack Developer'), 'Bugs fixed', 'number', 2),
  ((SELECT id FROM departments WHERE name = 'Fullstack Developer'), 'Code reviews completed', 'number', 3),
  ((SELECT id FROM departments WHERE name = 'Fullstack Developer'), 'Pull requests submitted', 'number', 4),
  ((SELECT id FROM departments WHERE name = 'Fullstack Developer'), 'Pull requests merged', 'number', 5),
  ((SELECT id FROM departments WHERE name = 'Fullstack Developer'), 'Unit tests written', 'number', 6),
  ((SELECT id FROM departments WHERE name = 'Fullstack Developer'), 'Test coverage increased', 'percentage', 7),
  ((SELECT id FROM departments WHERE name = 'Fullstack Developer'), 'API endpoints developed', 'number', 8),
  ((SELECT id FROM departments WHERE name = 'Fullstack Developer'), 'Database migrations completed', 'number', 9),
  ((SELECT id FROM departments WHERE name = 'Fullstack Developer'), 'Performance optimizations', 'number', 10),
  ((SELECT id FROM departments WHERE name = 'Fullstack Developer'), 'Documentation updated', 'number', 11);

-- Executive Assistant metrics
INSERT INTO department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ((SELECT id FROM departments WHERE name = 'Executive Assistant'), 'Email correspondence', 'number', 1),
  ((SELECT id FROM departments WHERE name = 'Executive Assistant'), 'CEO''s Social Media outreach', 'number', 2),
  ((SELECT id FROM departments WHERE name = 'Executive Assistant'), 'CEO''s Social media DMs/ inquiries responded to', 'number', 3),
  ((SELECT id FROM departments WHERE name = 'Executive Assistant'), 'Meeting set-ups', 'number', 4),
  ((SELECT id FROM departments WHERE name = 'Executive Assistant'), 'Meeting reports drafted', 'number', 5);
