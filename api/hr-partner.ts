import type { VercelRequest, VercelResponse } from '@vercel/node';
import FormData from 'form-data';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.HR_PARTNER_API_KEY;
  
  if (!apiKey) {
    console.error('HR_PARTNER_API_KEY environment variable is not set');
    return res.status(500).json({ 
      error: 'Missing HR Partner API configuration',
      details: 'HR_PARTNER_API_KEY environment variable not found'
    });
  }

  const urlPath = req.url?.replace(/^\/api\/hr-partner\/?/, '') || '';
  const targetUrl = `https://api.hrpartner.io/${urlPath}`;

  console.log(`Proxying ${req.method} request to: ${targetUrl}`);
  console.log(`Request content-type:`, req.headers['content-type']);

  try {
    const options: RequestInit = {
      method: req.method,
      headers: {
        'x-api-key': apiKey,
      },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const contentType = req.headers['content-type'] || '';
      
      if (contentType.includes('multipart/form-data')) {
        // Reconstruct FormData from request body
        const formData = new FormData();
        
        // req.body should have the parsed form fields
        if (typeof req.body === 'object' && req.body !== null) {
          // Explicitly append fields
          if (req.body.employee_code) {
            formData.append('employee_code', String(req.body.employee_code));
          }
          if (req.body.start_time) {
            formData.append('start_time', String(req.body.start_time));
          }
          if (req.body.end_time) {
            formData.append('end_time', String(req.body.end_time));
          }
          if (req.body.notes) {
            formData.append('notes', String(req.body.notes));
          }
        }
        
        (options as any).body = formData;
        // FormData will set the proper Content-Type with boundary
        Object.assign(options.headers, formData.getHeaders());
        console.log(`Forwarding FormData with fields:`, Object.keys(req.body || {}));
      } else {
        (options.headers as any)['Content-Type'] = 'application/json';
        options.body = JSON.stringify(req.body);
      }
    }

    const response = await fetch(targetUrl, options);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`Response status: ${response.status}`, data);
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      console.log(`Response status: ${response.status}`, text);
      return res.status(response.status).send(text);
    }
  } catch (error: any) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Failed to proxy request', details: error.message });
  }
}
