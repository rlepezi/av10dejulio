// API para extraer logos automáticamente
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { companyName, website } = req.body;

  try {
    // Buscar logo en el sitio web
    const response = await fetch(website);
    const html = await response.text();
    
    // Buscar diferentes tipos de logo
    const logoPatterns = [
      /<link[^>]+rel=["']icon["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']icon["']/i,
      /<img[^>]+class=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i,
      /<img[^>]+src=["']([^"']+)["'][^>]+class=["'][^"']*logo[^"']*["']/i,
      /<img[^>]+alt=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i
    ];
    
    let logoUrl = null;
    
    for (const pattern of logoPatterns) {
      const match = html.match(pattern);
      if (match) {
        logoUrl = match[1];
        // Convertir URL relativa a absoluta
        if (logoUrl.startsWith('/')) {
          const urlObj = new URL(website);
          logoUrl = `${urlObj.protocol}//${urlObj.host}${logoUrl}`;
        }
        break;
      }
    }
    
    // Si no encontramos logo, buscar favicon
    if (!logoUrl) {
      const faviconUrl = `${new URL(website).origin}/favicon.ico`;
      try {
        const faviconResponse = await fetch(faviconUrl, { method: 'HEAD' });
        if (faviconResponse.ok) {
          logoUrl = faviconUrl;
        }
      } catch (e) {
        console.log('No favicon found');
      }
    }

    res.status(200).json({
      logoUrl,
      extractedFrom: website,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error extracting logo:', error);
    res.status(500).json({
      error: error.message,
      logoUrl: null
    });
  }
}
