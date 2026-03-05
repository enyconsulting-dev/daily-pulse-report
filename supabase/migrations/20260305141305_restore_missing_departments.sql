-- Restore missing departments and their metrics

-- First, ensure all original departments exist
INSERT INTO departments (id, name) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Business Support Specialist'),
  ('d1000000-0000-0000-0000-000000000002', 'Learning Support Specialist'),
  ('d1000000-0000-0000-0000-000000000003', 'Customer Success Specialist'),
  ('d1000000-0000-0000-0000-000000000004', 'Career Consultant'),
  ('d1000000-0000-0000-0000-000000000005', 'Programs/Operations'),
  ('d1000000-0000-0000-0000-000000000006', 'Graphics/Funnel Designer'),
  ('d1000000-0000-0000-0000-000000000007', 'Videographer')
ON CONFLICT (name) DO NOTHING;

-- Restore metrics for Business Support Specialist
INSERT INTO department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ((SELECT id FROM departments WHERE name = 'Business Support Specialist'), 'Emails sent', 'number', 1),
  ((SELECT id FROM departments WHERE name = 'Business Support Specialist'), 'Social media posts published', 'number', 2),
  ((SELECT id FROM departments WHERE name = 'Business Support Specialist'), 'New followers/subscribers gained', 'number', 3),
  ((SELECT id FROM departments WHERE name = 'Business Support Specialist'), 'Support tickets received', 'number', 4),
  ((SELECT id FROM departments WHERE name = 'Business Support Specialist'), 'Support tickets resolved', 'number', 5),
  ((SELECT id FROM departments WHERE name = 'Business Support Specialist'), 'Support tickets escalated', 'number', 6),
  ((SELECT id FROM departments WHERE name = 'Business Support Specialist'), 'Social media outreaches conducted', 'number', 7),
  ((SELECT id FROM departments WHERE name = 'Business Support Specialist'), 'Support / DMs / Comments responded to', 'number', 8),
  ((SELECT id FROM departments WHERE name = 'Business Support Specialist'), 'Organic impressions generated (Instagram, Facebook, Tiktok, Linkedin)', 'number', 9),
  ((SELECT id FROM departments WHERE name = 'Business Support Specialist'), 'Email open rate (%)', 'percentage', 10),
  ((SELECT id FROM departments WHERE name = 'Business Support Specialist'), 'Email click-through rate (%)', 'percentage', 11)
ON CONFLICT DO NOTHING;

-- Restore metrics for Learning Support Specialist
INSERT INTO department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ((SELECT id FROM departments WHERE name = 'Learning Support Specialist'), 'Class recordings uploaded', 'number', 1),
  ((SELECT id FROM departments WHERE name = 'Learning Support Specialist'), 'New enrollments recorded', 'number', 2),
  ((SELECT id FROM departments WHERE name = 'Learning Support Specialist'), 'Students contract sent', 'number', 3),
  ((SELECT id FROM departments WHERE name = 'Learning Support Specialist'), 'Signed students contracts received', 'number', 4),
  ((SELECT id FROM departments WHERE name = 'Learning Support Specialist'), 'Total outstanding payment received (Old enrollments)', 'number', 5),
  ((SELECT id FROM departments WHERE name = 'Learning Support Specialist'), 'Total new payment received (New enrollments)', 'number', 6),
  ((SELECT id FROM departments WHERE name = 'Learning Support Specialist'), 'Student motivation campaign sent', 'number', 7),
  ((SELECT id FROM departments WHERE name = 'Learning Support Specialist'), 'Students check-in conducted', 'number', 8),
  ((SELECT id FROM departments WHERE name = 'Learning Support Specialist'), 'Support tickets received', 'number', 9),
  ((SELECT id FROM departments WHERE name = 'Learning Support Specialist'), 'Support tickets resolved', 'number', 10),
  ((SELECT id FROM departments WHERE name = 'Learning Support Specialist'), 'Support tickets escalated', 'number', 11)
ON CONFLICT DO NOTHING;

-- Restore metrics for Customer Success Specialist
INSERT INTO department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ((SELECT id FROM departments WHERE name = 'Customer Success Specialist'), 'Students check-in conducted', 'number', 1),
  ((SELECT id FROM departments WHERE name = 'Customer Success Specialist'), 'Students inquiries/tickets received', 'number', 2),
  ((SELECT id FROM departments WHERE name = 'Customer Success Specialist'), 'Students inquiries/tickets resolved', 'number', 3),
  ((SELECT id FROM departments WHERE name = 'Customer Success Specialist'), 'Students inquiries/tickets escalated', 'number', 4),
  ((SELECT id FROM departments WHERE name = 'Customer Success Specialist'), 'New students onboarded', 'number', 5),
  ((SELECT id FROM departments WHERE name = 'Customer Success Specialist'), 'Correspondence with coaches', 'number', 6),
  ((SELECT id FROM departments WHERE name = 'Customer Success Specialist'), 'Orientation conducted', 'number', 7),
  ((SELECT id FROM departments WHERE name = 'Customer Success Specialist'), 'Open House conducted', 'number', 8),
  ((SELECT id FROM departments WHERE name = 'Customer Success Specialist'), 'Students'' testimonials captured', 'number', 9),
  ((SELECT id FROM departments WHERE name = 'Customer Success Specialist'), 'Students resource document created', 'number', 10),
  ((SELECT id FROM departments WHERE name = 'Customer Success Specialist'), 'Students resource document updated', 'number', 11),
  ((SELECT id FROM departments WHERE name = 'Customer Success Specialist'), 'Program upsells', 'number', 12),
  ((SELECT id FROM departments WHERE name = 'Customer Success Specialist'), 'Ambassador correspondence', 'number', 13),
  ((SELECT id FROM departments WHERE name = 'Customer Success Specialist'), 'Client retention rate (%)', 'percentage', 14),
  ((SELECT id FROM departments WHERE name = 'Customer Success Specialist'), 'NPS score', 'number', 15),
  ((SELECT id FROM departments WHERE name = 'Customer Success Specialist'), 'Churn rate (%)', 'percentage', 16),
  ((SELECT id FROM departments WHERE name = 'Customer Success Specialist'), 'Avg. CSAT score (%)', 'percentage', 17),
  ((SELECT id FROM departments WHERE name = 'Customer Success Specialist'), 'Students Class Attendance (%)', 'percentage', 18),
  ((SELECT id FROM departments WHERE name = 'Customer Success Specialist'), 'Ongoing Programs', 'number', 19)
ON CONFLICT DO NOTHING;

-- Restore metrics for Career Consultant
INSERT INTO department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ((SELECT id FROM departments WHERE name = 'Career Consultant'), 'Career Coaching Classes held', 'number', 1),
  ((SELECT id FROM departments WHERE name = 'Career Consultant'), 'One-on-one consultations', 'number', 2),
  ((SELECT id FROM departments WHERE name = 'Career Consultant'), 'Resumes revamped', 'number', 3),
  ((SELECT id FROM departments WHERE name = 'Career Consultant'), 'Linkedin pages optimized', 'number', 4),
  ((SELECT id FROM departments WHERE name = 'Career Consultant'), 'Webinars conducted', 'number', 5),
  ((SELECT id FROM departments WHERE name = 'Career Consultant'), 'Resources documents created/updated', 'number', 6)
ON CONFLICT DO NOTHING;

-- Restore metrics for Programs/Operations
INSERT INTO department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ((SELECT id FROM departments WHERE name = 'Programs/Operations'), 'Team meetings conducted', 'number', 1),
  ((SELECT id FROM departments WHERE name = 'Programs/Operations'), 'Students queries resolved', 'number', 2)
ON CONFLICT DO NOTHING;

-- Restore metrics for Graphics/Funnel Designer
INSERT INTO department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ((SELECT id FROM departments WHERE name = 'Graphics/Funnel Designer'), 'Number of program flyers designed', 'number', 1),
  ((SELECT id FROM departments WHERE name = 'Graphics/Funnel Designer'), 'Number of carousels designed', 'number', 2),
  ((SELECT id FROM departments WHERE name = 'Graphics/Funnel Designer'), 'Total Number of marketing creatives designed (carousels, flyers, email headers etc)', 'number', 3),
  ((SELECT id FROM departments WHERE name = 'Graphics/Funnel Designer'), 'Number of presentation content requests fulfilled', 'number', 4),
  ((SELECT id FROM departments WHERE name = 'Graphics/Funnel Designer'), 'Number of new funnels built', 'number', 5),
  ((SELECT id FROM departments WHERE name = 'Graphics/Funnel Designer'), 'Number of old funnels updated', 'number', 6),
  ((SELECT id FROM departments WHERE name = 'Graphics/Funnel Designer'), '% of projects delivered on/before deadline', 'percentage', 7)
ON CONFLICT DO NOTHING;

-- Restore metrics for Videographer
INSERT INTO department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ((SELECT id FROM departments WHERE name = 'Videographer'), 'Number of video contents shot', 'number', 1),
  ((SELECT id FROM departments WHERE name = 'Videographer'), 'Number of long form videos produced/edited', 'number', 2),
  ((SELECT id FROM departments WHERE name = 'Videographer'), 'Number of short form videos produced/edited', 'number', 3),
  ((SELECT id FROM departments WHERE name = 'Videographer'), '% of projects delivered on/before deadline', 'percentage', 4)
ON CONFLICT DO NOTHING;
