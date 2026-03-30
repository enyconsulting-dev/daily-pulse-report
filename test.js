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

fetchEmployees();