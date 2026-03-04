-- Add department_id column to daily_reports table
ALTER TABLE public.daily_reports ADD COLUMN department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE;

-- Create unique constraint to prevent duplicate reports for same staff+department+date
ALTER TABLE public.daily_reports DROP CONSTRAINT IF EXISTS daily_reports_staff_id_report_date_key;
ALTER TABLE public.daily_reports ADD CONSTRAINT daily_reports_staff_id_department_id_report_date_key UNIQUE(staff_id, department_id, report_date);

-- Create index for faster queries
CREATE INDEX idx_daily_reports_department_id ON public.daily_reports(department_id);
