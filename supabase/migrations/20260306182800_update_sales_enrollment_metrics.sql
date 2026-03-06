-- Delete existing metrics for Sales/Enrollment Specialist
DELETE FROM department_metrics
WHERE department_id = 'd1000000-0000-0000-0000-000000000008';

-- Insert updated metrics for Sales/Enrollment Specialist
INSERT INTO department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000008', 'Total outreach to new leads via phone calls', 'number', 1),
  ('d1000000-0000-0000-0000-000000000008', 'Total outreach to new leads via WhatsApp DMs/Emails', 'number', 2),
  ('d1000000-0000-0000-0000-000000000008', 'Number of inquiries received (Calls/WhatsApp/Calendar booking)', 'number', 3),
  ('d1000000-0000-0000-0000-000000000008', 'Number of actual conversations with new leads (outreach/inquiries)', 'number', 4),
  ('d1000000-0000-0000-0000-000000000008', 'Number of follow-ups with warm/hot leads', 'number', 5),
  ('d1000000-0000-0000-0000-000000000008', 'Number of conversations held during follow-up with warm/hot leads', 'number', 6),
  ('d1000000-0000-0000-0000-000000000008', 'Total number of warm leads', 'number', 7),
  ('d1000000-0000-0000-0000-000000000008', 'Total number of hot leads', 'number', 8),
  ('d1000000-0000-0000-0000-000000000008', 'Number of enrollments closed', 'number', 9),
  ('d1000000-0000-0000-0000-000000000008', 'Naira revenue generated (new payments)', 'number', 10),
  ('d1000000-0000-0000-0000-000000000008', 'Naira revenue generated (balance payments)', 'number', 11),
  ('d1000000-0000-0000-0000-000000000008', 'USD revenue generated (new payments)', 'number', 12),
  ('d1000000-0000-0000-0000-000000000008', 'USD revenue generated (balance payments)', 'number', 13),
  ('d1000000-0000-0000-0000-000000000008', 'CAD revenue generated (new payments)', 'number', 14),
  ('d1000000-0000-0000-0000-000000000008', 'CAD revenue generated (balance payments)', 'number', 15);
