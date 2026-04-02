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

export function useHRSubmit() {
  return useMutation({
    mutationFn: async (data: any) => {
      const { employee_code, timesheet_date, timesheet_data } = data;
      
      const promises = timesheet_data.map((entry: any) => {
        const payload = {
          employee_code,
          start_time: `${timesheet_date} ${entry.start_time}`,
          end_time: `${timesheet_date} ${entry.end_time}`,
          notes: entry.notes
        };

        const formData = new FormData();
        formData.append("employee_code", payload.employee_code);
        formData.append("start_time", payload.start_time);
        formData.append("end_time", payload.end_time);
        formData.append("notes", payload.notes);

        
        return fetch(`${BASE_URL}/timeclock`, {
          method: 'POST',
          body: formData
        });
      });
      
      const responses = await Promise.all(promises);
      
      for (const response of responses) {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      
      return { success: true };
    }
  });
}
