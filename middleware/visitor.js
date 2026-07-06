const { supabase } = require('../database/supabase');

// IP country lookup cache
const ipCache = new Map();

async function getCountryFromIP(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { country: 'Yerel', city: 'Yerel' };
  }

  if (ipCache.has(ip)) return ipCache.get(ip);

  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, { timeout: 3000 });
    const data = await response.json();
    const result = { country: data.country_name || 'Bilinmiyor', city: data.city || 'Bilinmiyor' };
    ipCache.set(ip, result);
    return result;
  } catch (err) {
    return { country: 'Bilinmiyor', city: 'Bilinmiyor' };
  }
}

async function trackVisitor(req) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress || '';
    const cleanIP = ip.split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || '';
    const page = req.originalUrl || req.url;

    const geo = await getCountryFromIP(cleanIP);

    await supabase.from('visitors').insert([{
      ip: cleanIP,
      country: geo.country,
      city: geo.city,
      user_agent: userAgent,
      page
    }]);
  } catch (err) {
    console.error('Visitor tracking error:', err.message);
  }
}

function visitorMiddleware(req, res, next) {
  // Admin sayfalarını ve statik dosyaları takip etme
  if (req.url.startsWith('/admin') || req.url.startsWith('/css') || req.url.startsWith('/js') || req.url.startsWith('/uploads') || req.url.startsWith('/favicon')) {
    return next();
  }

  trackVisitor(req);
  next();
}

module.exports = { visitorMiddleware, getCountryFromIP };
