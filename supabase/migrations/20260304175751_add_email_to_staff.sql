-- Add email column to staff_members table
ALTER TABLE public.staff_members ADD COLUMN email TEXT;

-- Add unique constraint on email (optional, but good for data integrity)
ALTER TABLE public.staff_members ADD CONSTRAINT staff_members_email_unique UNIQUE(email);
