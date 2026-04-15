const API_KEY = '9e200e2c3a9411cdc20939706bb69c61d4eaadb4';

async function submitTimesheet() {
    try {
        const payloads = [
            {
                "employee_code": "EMP0035",
                "start_time": "2026-03-23 09:00",
                "end_time": "2026-03-23 10:00",
                "notes": "Start of week meeting"
            },
            {
                "employee_code": "EMP0035",
                "start_time": "2026-03-23 10:00",
                "end_time": "2026-03-23 11:00",
                "notes": "Added appointments to Google Calendar and sent initial notification emails to respective parties."
            },
            {
                "employee_code": "EMP0035",
                "start_time": "2026-03-23 11:00",
                "end_time": "2026-03-23 12:00",
                "notes": "Configured GHL email reminders (24h, 3h, 10m prior to calls)."
            },
            {
                "employee_code": "EMP0035",
                "start_time": "2026-03-23 12:00",
                "end_time": "2026-03-23 13:00",
                "notes": "Created 2 Workflows."
            },
            {
                "employee_code": "EMP0035",
                "start_time": "2026-03-23 13:00",
                "end_time": "2026-03-23 14:00",
                "notes": "Completed 1 API integration."
            },
            {
                "employee_code": "EMP0035",
                "start_time": "2026-03-23 14:00",
                "end_time": "2026-03-23 15:00",
                "notes": "Created 1 Form."
            },
            {
                "employee_code": "EMP0035",
                "start_time": "2026-03-23 15:00",
                "end_time": "2026-03-23 16:00",
                "notes": "Saved qualified candidate data to a tracking spreadsheet."
            },
            {
                "employee_code": "EMP0035",
                "start_time": "2026-03-23 16:00",
                "end_time": "2026-03-23 17:00",
                "notes": "Finalized candidate data tracking and end of day wrap-up."
            }
        ];
        
        for (const payload of payloads) {
            console.log(`Submitting timesheet for ${payload.start_time} - ${payload.end_time}...`);
            const formData = new FormData();
            formData.append("employee_code", payload.employee_code);
            formData.append("start_time", payload.start_time);
            formData.append("end_time", payload.end_time);
            formData.append("notes", payload.notes);

            const response = await fetch('https://daily-pulse-report.vercel.app/api/hr-partner/timeclock', {
                method: 'POST',
                headers: {
                    'x-api-key': API_KEY
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP error! status: ${response.status}`, errorText);
            } else {
                const data = await response.json();
                console.log('Timesheet submitted successfully:', data);
            }
        }
    } catch (error) {
        console.error('Error submitting timesheet:', error);
    }
}
submitTimesheet();
