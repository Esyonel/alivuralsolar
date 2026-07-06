const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Helper: get settings as object
async function getSettings() {
  const { data } = await supabase.from('settings').select('key, value');
  if (!data) return {};
  return data.reduce((acc, row) => { acc[row.key] = row.value; return acc; }, {});
}

// Seed defaults
async function seedDefaults() {
  const { data: existing } = await supabase.from('settings').select('key').limit(1);
  if (existing && existing.length > 0) return;

  await supabase.from('settings').insert([
    { key: 'company_name', value: 'Ali Vural Enerji' },
    { key: 'site_name', value: 'alivuralsolar.com' },
    { key: 'phone', value: '+90 541 575 37 09' },
    { key: 'whatsapp', value: '+905415753709' },
    { key: 'email', value: 'info@alivuralsolar.com' },
    { key: 'address', value: 'Rızaşye Mahallesi 10058 Sk No:29 Merkez Osmaniye' },
    { key: 'map_lat', value: '37.0748' },
    { key: 'map_lng', value: '37.2153' },
    { key: 'working_hours', value: 'Pazartesi - Cumartesi: 08:00 - 18:00' },
    { key: 'about_text', value: 'Ali Vural Enerji olarak güneş enerjisi sistemleri, karavan elektrik sistemleri, ev elektrik çözümleri ve teknik servis hizmetleri alanlarında uzman kadromuzla hizmet vermekteyiz.' }
  ]);

  const { data: cats } = await supabase.from('categories').select('id').limit(1);
  if (!cats || cats.length === 0) {
    await supabase.from('categories').insert([
      { name: 'Güneş Paneli Sistemleri', slug: 'gunes-paneli', sort_order: 1 },
      { name: 'Komple Solar Paketler', slug: 'komple-solar', sort_order: 2 },
      { name: 'Karavan Elektrik Sistemleri', slug: 'karavan-elektrik', sort_order: 3 },
      { name: 'Ev Elektriği Ürünleri', slug: 'ev-elektrigi', sort_order: 4 },
      { name: 'Jel Akü', slug: 'jel-aku', sort_order: 5 },
      { name: 'Elektrikli Ev Aletleri Tamiri', slug: 'ev-aletleri-tamiri', sort_order: 6 },
      { name: 'Teknik Servis ve Montaj', slug: 'teknik-servis', sort_order: 7 }
    ]);
  }

  const { data: servs } = await supabase.from('services').select('id').limit(1);
  if (!servs || servs.length === 0) {
    await supabase.from('services').insert([
      { title: 'Güneş Paneli Kurulumu', description: 'Ev ve işyerleri için profesyonel güneş paneli kurulum hizmeti.', icon: 'fas fa-solar-panel', sort_order: 1 },
      { title: 'Karavan Elektrik Sistemleri', description: 'Karavan ve tekneler için özel elektrik sistemi tasarımı ve kurulumu.', icon: 'fas fa-caravan', sort_order: 2 },
      { title: 'Ev Elektrik Çözümleri', description: 'Ev içi elektrik tesisatı, aydınlatma ve enerji verimliliği çözümleri.', icon: 'fas fa-home', sort_order: 3 },
      { title: 'Jel Akü Satış ve Tamiri', description: 'Jel akü satışı, bakımı ve tamiri.', icon: 'fas fa-battery-full', sort_order: 4 },
      { title: 'Elektrikli Ev Aletleri Tamiri', description: 'Bozulan elektrikli ev aletleriniz için profesyonel tamir ve bakım hizmeti.', icon: 'fas fa-tools', sort_order: 5 },
      { title: 'Teknik Servis', description: 'Periyodik bakım, arıza tespiti ve onarım hizmetleri.', icon: 'fas fa-wrench', sort_order: 6 }
    ]);
  }

  const { data: pages } = await supabase.from('page_contents').select('id').limit(1);
  if (!pages || pages.length === 0) {
    await supabase.from('page_contents').insert([
      { page_slug: 'home', section: 'hero_title', content: 'Güneş Enerjisiyle Geleceğinizi Aydınlatın' },
      { page_slug: 'home', section: 'hero_subtitle', content: 'Profesyonel güneş enerjisi çözümleri, karavan elektrik sistemleri ve teknik servis hizmetleri.' },
      { page_slug: 'home', section: 'hero_cta', content: 'Ücretsiz Keşif İçin Bize Ulaşın' },
      { page_slug: 'home', section: 'hero_categories', content: 'GÜNEŞ ENERJİSİ · RÜZGAR ENERJİSİ · KARAVAN · EV ELEKTRİĞİ · TAMİR' },
      { page_slug: 'about', section: 'title', content: 'Hakkımızda' },
      { page_slug: 'about', section: 'subtitle', content: 'Güneş enerjisi ve elektrik çözümlerinde güvenilir partneriniz.' },
      { page_slug: 'services', section: 'title', content: 'Hizmetlerimiz' },
      { page_slug: 'products', section: 'title', content: 'Ürünler ve Fiyatlar' },
      { page_slug: 'gallery', section: 'title', content: 'Galeri' },
      { page_slug: 'contact', section: 'title', content: 'İletişim' }
    ]);
  }

  const { data: users } = await supabase.from('users').select('id').limit(1);
  if (!users || users.length === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    await supabase.from('users').insert([{ username: 'admin', password: hash, role: 'admin' }]);
  }
}

module.exports = { supabase, getSettings, seedDefaults };
