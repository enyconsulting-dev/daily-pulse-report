import { useQuery, useMutation } from "@tanstack/react-query";

const BASE_URL = '/api/hr-partner';

export interface HREmployee {
  id: number;
  code: string;
  first_names: string;
  last_name: string;
  full_name: string;
  email: string;
  department: string;
  position: string;
  is_active: boolean;
  avatar?: string;
}

export function useHREmployees() {
  return useQuery({
    queryKey: ["hr_employees"],
    queryFn: async () => {
      const response = await fetch(`${BASE_URL}/employees`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data)
      return data as HREmployee[];
    },
  });
}

/**
 * Dummy submit hook for future expansion
 */
export function useHRSubmit() {
  return useMutation({
    mutationFn: async (data: any) => {
      console.log('Dummy HR submit:', data);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    }
  });
}
