import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = '9e200e2c3a9411cdc20939706bb69c61d4eaadb4';
  const urlPath = req.url?.replace(/^\/api\/hr-partner\/?/, '') || '';
  const targetUrl = `https://api.hrpartner.io/${urlPath}`;

  console.log(`Proxying ${req.method} request to: ${targetUrl}`);

  try {
    const options: RequestInit = {
      method: req.method,
      headers: {
        'x-api-key': apiKey,
      },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (urlPath === 'timeclock') {
        const formData = new FormData();
        for (const key in req.body) {
          formData.append(key, req.body[key]);
        }
        options.body = formData;
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
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      return res.status(response.status).send(text);
    }
  } catch (error: any) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Failed to proxy request', details: error.message });
  }
}
