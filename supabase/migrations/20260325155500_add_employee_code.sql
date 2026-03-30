-- Add employee_code column to staff_members table
ALTER TABLE public.staff_members ADD COLUMN employee_code TEXT UNIQUE;
