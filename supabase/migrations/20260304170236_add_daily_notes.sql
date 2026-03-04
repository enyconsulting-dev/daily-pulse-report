-- Add daily notes columns to daily_reports table
ALTER TABLE public.daily_reports
ADD COLUMN completed_tasks TEXT,
ADD COLUMN blockers TEXT,
ADD COLUMN uncompleted_tasks TEXT;
