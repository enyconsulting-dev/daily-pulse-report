import type { VercelRequest, VercelResponse } from '@vercel/node';

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let data = Buffer.alloc(0);
    
    req.on('data', (chunk: Buffer) => {
      data = Buffer.concat([data, chunk]);
    });
    
    req.on('end', () => {
      resolve(data);
    });
    
    req.on('error', reject);
  });
}

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
        // Read raw body and forward directly, preserving the multipart format and boundary
        const rawBody = await getRawBody(req);
        (options as any).body = rawBody;
        (options.headers as any)['Content-Type'] = contentType;
        console.log(`Forwarding raw multipart body, size: ${rawBody.length} bytes`);
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
