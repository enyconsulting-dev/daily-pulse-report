const API_KEY = '9e200e2c3a9411cdc20939706bb69c61d4eaadb4';

async function fetchEmployees() {
    try {
        const response = await fetch('https://api.hrpartner.io/employees', {
            method: 'GET',
            headers: {
                'x-api-key': API_KEY
            }
        });

        if (!response.ok) {
            // throw new Error(HTTP error! status: ${response.status});
            console.log(error)
        }

        const data = await response.json();
        console.log('Employees:', data);
        return data;
    } catch (error) {
        console.error('Error fetching employees:', error);
    }
}

async function submitTimesheet() {
    try {
        const payload = {
            "employee_code": "EMP0035",
            "start_time": "2026-03-30 13:30",
            "end_time": "2026-03-30 14:00",
            "notes": "Met with clients"
        };
        
        console.log('Submitting timesheet...', payload);
        const response = await fetch('https://api.hrpartner.io/timesheet', {
            method: 'POST',
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error! status: ${response.status}`, errorText);
            return;
        }

        const data = await response.json();
        console.log('Timesheet submitted successfully:', data);
        return data;
    } catch (error) {
        console.error('Error submitting timesheet:', error);
    }
}

async function runTests() {
    await fetchEmployees();
    await submitTimesheet();
}

runTests();