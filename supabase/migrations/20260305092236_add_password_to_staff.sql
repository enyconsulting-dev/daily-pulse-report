-- Add password column to staff_members table (optional - nullable)
ALTER TABLE public.staff_members ADD COLUMN password_hash TEXT;

-- Add index for efficient lookups
CREATE INDEX idx_staff_members_password_hash ON public.staff_members(password_hash);
