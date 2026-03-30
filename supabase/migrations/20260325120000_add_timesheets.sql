-- Timesheets table for tracking hourly work entries
CREATE TABLE public.timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  timesheet_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read timesheets" ON public.timesheets FOR SELECT USING (true);
CREATE POLICY "Anyone can insert timesheets" ON public.timesheets FOR INSERT WITH CHECK (true);
