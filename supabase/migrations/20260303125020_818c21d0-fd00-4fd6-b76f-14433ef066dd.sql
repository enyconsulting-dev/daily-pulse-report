
-- Departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read departments" ON public.departments FOR SELECT USING (true);

-- Staff members table
CREATE TABLE public.staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read staff" ON public.staff_members FOR SELECT USING (true);
CREATE POLICY "Anyone can insert staff" ON public.staff_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update staff" ON public.staff_members FOR UPDATE USING (true);

-- Department metrics table
CREATE TABLE public.department_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL DEFAULT 'number' CHECK (metric_type IN ('number', 'percentage')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.department_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read metrics" ON public.department_metrics FOR SELECT USING (true);

-- Daily reports table
CREATE TABLE public.daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(staff_id, report_date)
);
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reports" ON public.daily_reports FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reports" ON public.daily_reports FOR INSERT WITH CHECK (true);

-- Report entries table
CREATE TABLE public.report_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  metric_id UUID NOT NULL REFERENCES public.department_metrics(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.report_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read entries" ON public.report_entries FOR SELECT USING (true);
CREATE POLICY "Anyone can insert entries" ON public.report_entries FOR INSERT WITH CHECK (true);

-- Seed departments
INSERT INTO public.departments (id, name) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Business Support Specialist'),
  ('d1000000-0000-0000-0000-000000000002', 'Learning Support Specialist'),
  ('d1000000-0000-0000-0000-000000000003', 'Customer Success Specialist'),
  ('d1000000-0000-0000-0000-000000000004', 'Career Consultant'),
  ('d1000000-0000-0000-0000-000000000005', 'Programs/Operations'),
  ('d1000000-0000-0000-0000-000000000006', 'Graphics/Funnel Designer'),
  ('d1000000-0000-0000-0000-000000000007', 'Videographer');
  ('d1000000-0000-0000-0000-000000000008', 'Sales/Enrollment Specialist');
  ('d1000000-0000-0000-0000-000000000009', 'Programs/Operations Manager');


-- Seed metrics for Business Support Specialist
INSERT INTO public.department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Emails sent', 'number', 1),
  ('d1000000-0000-0000-0000-000000000001', 'Social media posts published', 'number', 2),
  ('d1000000-0000-0000-0000-000000000001', 'New followers/subscribers gained', 'number', 3),
  ('d1000000-0000-0000-0000-000000000001', 'Support tickets received', 'number', 4),
  ('d1000000-0000-0000-0000-000000000001', 'Support tickets resolved', 'number', 5),
  ('d1000000-0000-0000-0000-000000000001', 'Support tickets escalated', 'number', 6),
  ('d1000000-0000-0000-0000-000000000001', 'Social media outreaches conducted', 'number', 7),
  ('d1000000-0000-0000-0000-000000000001', 'Support / DMs / Comments responded to', 'number', 8),
  ('d1000000-0000-0000-0000-000000000001', 'Organic impressions generated (Instagram, Facebook, Tiktok, Linkedin)', 'number', 9),
  ('d1000000-0000-0000-0000-000000000001', 'Email open rate (%)', 'percentage', 10),
  ('d1000000-0000-0000-0000-000000000001', 'Email click-through rate (%)', 'percentage', 11);

-- Seed metrics for Learning Support Specialist
INSERT INTO public.department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000002', 'Class recordings uploaded', 'number', 1),
  ('d1000000-0000-0000-0000-000000000002', 'New enrollments recorded', 'number', 2),
  ('d1000000-0000-0000-0000-000000000002', 'Students contract sent', 'number', 3),
  ('d1000000-0000-0000-0000-000000000002', 'Signed students contracts received', 'number', 4),
  ('d1000000-0000-0000-0000-000000000002', 'Total outstanding payment received (Old enrollments)', 'number', 5),
  ('d1000000-0000-0000-0000-000000000002', 'Total new payment received (New enrollments)', 'number', 6),
  ('d1000000-0000-0000-0000-000000000002', 'Student motivation campaign sent', 'number', 7),
  ('d1000000-0000-0000-0000-000000000002', 'Students check-in conducted', 'number', 8),
  ('d1000000-0000-0000-0000-000000000002', 'Support tickets received', 'number', 9),
  ('d1000000-0000-0000-0000-000000000002', 'Support tickets resolved', 'number', 10),
  ('d1000000-0000-0000-0000-000000000002', 'Support tickets escalated', 'number', 11);

-- Seed metrics for Customer Success Specialist
INSERT INTO public.department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000003', 'Students check-in conducted', 'number', 1),
  ('d1000000-0000-0000-0000-000000000003', 'Students inquiries/tickets received', 'number', 2),
  ('d1000000-0000-0000-0000-000000000003', 'Students inquiries/tickets resolved', 'number', 3),
  ('d1000000-0000-0000-0000-000000000003', 'Students inquiries/tickets escalated', 'number', 4),
  ('d1000000-0000-0000-0000-000000000003', 'New students onboarded', 'number', 5),
  ('d1000000-0000-0000-0000-000000000003', 'Correspondence with coaches', 'number', 6),
  ('d1000000-0000-0000-0000-000000000003', 'Orientation conducted', 'number', 7),
  ('d1000000-0000-0000-0000-000000000003', 'Open House conducted', 'number', 8),
  ('d1000000-0000-0000-0000-000000000003', 'Students'' testimonials captured', 'number', 9),
  ('d1000000-0000-0000-0000-000000000003', 'Students resource document created', 'number', 10),
  ('d1000000-0000-0000-0000-000000000003', 'Students resource document updated', 'number', 11),
  ('d1000000-0000-0000-0000-000000000003', 'Program upsells', 'number', 12),
  ('d1000000-0000-0000-0000-000000000003', 'Ambassador correspondence', 'number', 13),
  ('d1000000-0000-0000-0000-000000000003', 'Client retention rate (%)', 'percentage', 14),
  ('d1000000-0000-0000-0000-000000000003', 'NPS score', 'number', 15),
  ('d1000000-0000-0000-0000-000000000003', 'Churn rate (%)', 'percentage', 16),
  ('d1000000-0000-0000-0000-000000000003', 'Avg. CSAT score (%)', 'percentage', 17),
  ('d1000000-0000-0000-0000-000000000003', 'Students Class Attendance (%)', 'percentage', 18),
  ('d1000000-0000-0000-0000-000000000003', 'Ongoing Programs', 'number', 19);

-- Seed metrics for Career Consultant
INSERT INTO public.department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000004', 'Career Coaching Classes held', 'number', 1),
  ('d1000000-0000-0000-0000-000000000004', 'One-on-one consultations', 'number', 2),
  ('d1000000-0000-0000-0000-000000000004', 'Resumes revamped', 'number', 3),
  ('d1000000-0000-0000-0000-000000000004', 'Linkedin pages optimized', 'number', 4),
  ('d1000000-0000-0000-0000-000000000004', 'Webinars conducted', 'number', 5),
  ('d1000000-0000-0000-0000-000000000004', 'Resources documents created/updated', 'number', 6);

-- Seed metrics for Programs/Operations
INSERT INTO public.department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000005', 'Team meetings conducted', 'number', 1),
  ('d1000000-0000-0000-0000-000000000005', 'Students queries resolved', 'number', 2);

-- Seed metrics for Graphics/Funnel Designer
INSERT INTO public.department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000006', 'Number of program flyers designed', 'number', 1),
  ('d1000000-0000-0000-0000-000000000006', 'Number of carousels designed', 'number', 2),
  ('d1000000-0000-0000-0000-000000000006', 'Total Number of marketing creatives designed (carousels, flyers, email headers etc)', 'number', 3),
  ('d1000000-0000-0000-0000-000000000006', 'Number of presentation content requests fulfilled', 'number', 4),
  ('d1000000-0000-0000-0000-000000000006', 'Number of new funnels built', 'number', 5),
  ('d1000000-0000-0000-0000-000000000006', 'Number of old funnels updated', 'number', 6),
  ('d1000000-0000-0000-0000-000000000006', '% of projects delivered on/before deadline', 'percentage', 7);

-- Seed metrics for Videographer
INSERT INTO public.department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000007', 'Number of video contents shot', 'number', 1),
  ('d1000000-0000-0000-0000-000000000007', 'Number of long form videos produced/edited', 'number', 2),
  ('d1000000-0000-0000-0000-000000000007', 'Number of short form videos produced/edited', 'number', 3),
  ('d1000000-0000-0000-0000-000000000007', '% of projects delivered on/before deadline', 'percentage', 4);

-- Seed departments (added later for new department)
INSERT INTO public.departments (id, name) VALUES
  ('d1000000-0000-0000-0000-000000000008', 'Sales/Enrollment Specialist');

-- Seed metrics for Sales/Enrollment Specialist
INSERT INTO public.department_metrics (department_id, metric_name, metric_type, sort_order) VALUES
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
