// API para validar sitios web
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ message: 'URL is required' });
  }

  try {
    const startTime = Date.now();
    
    // Verificar si el sitio responde
    const response = await fetch(url, {
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'AV10-Bot/1.0'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    // Si HEAD no funciona, intentar GET
    let pageContent = '';
    if (response.ok) {
      try {
        const fullResponse = await fetch(url, { timeout: 15000 });
        pageContent = await fullResponse.text();
      } catch (e) {
        console.log('Error getting page content:', e);
      }
    }
    
    // Extraer información básica
    const titleMatch = pageContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descriptionMatch = pageContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    
    // Detectar si es comercial
    const commercialKeywords = ['tienda', 'shop', 'comprar', 'venta', 'precio', 'producto', 'repuesto'];
    const isCommercial = commercialKeywords.some(keyword => 
      pageContent.toLowerCase().includes(keyword)
    );

    res.status(200).json({
      exists: response.ok,
      responding: response.status < 400,
      responseTime,
      status: response.status,
      title: titleMatch ? titleMatch[1].trim() : null,
      description: descriptionMatch ? descriptionMatch[1].trim() : null,
      isCommercial,
      lastChecked: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error validating website:', error);
    res.status(200).json({
      exists: false,
      responding: false,
      error: error.message,
      lastChecked: new Date().toISOString()
    });
  }
}
