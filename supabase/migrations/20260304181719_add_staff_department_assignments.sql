-- Create staff_department_assignments junction table for many-to-many relationship
CREATE TABLE public.staff_department_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(staff_id, department_id)
);

-- Migrate existing department_id data to the junction table
INSERT INTO public.staff_department_assignments (staff_id, department_id)
SELECT id, department_id FROM public.staff_members
WHERE department_id IS NOT NULL;

-- Drop the old department_id column from staff_members
ALTER TABLE public.staff_members DROP COLUMN department_id;

-- Create index for faster queries
CREATE INDEX idx_staff_department_assignments_staff_id ON public.staff_department_assignments(staff_id);
CREATE INDEX idx_staff_department_assignments_department_id ON public.staff_department_assignments(department_id);
