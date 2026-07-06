-- Ali Vural Solar - Supabase Veritabani Tablolari

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  image TEXT,
  featured INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  image TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gallery
CREATE TABLE IF NOT EXISTS gallery (
  id SERIAL PRIMARY KEY,
  title TEXT,
  image TEXT NOT NULL,
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Page Contents
CREATE TABLE IF NOT EXISTS page_contents (
  id SERIAL PRIMARY KEY,
  page_slug TEXT NOT NULL,
  section TEXT NOT NULL,
  content TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_slug, section)
);

-- Contact Info (settings tablosundan okunur, ama ekstra bilgi icin)

-- Inquiries
CREATE TABLE IF NOT EXISTS inquiries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Varsayilan veriler
INSERT INTO settings (key, value) VALUES
  ('company_name', 'Ali Vural Solar'),
  ('site_name', 'alivuralsolar.com'),
  ('phone', '+90 541 575 37 09'),
  ('whatsapp', '+905415753709'),
  ('email', 'info@alivuralsolar.com'),
  ('address', 'Rızaşye Mahallesi 10058 Sk No:29 Merkez Osmaniye'),
  ('map_lat', '37.0748'),
  ('map_lng', '37.2153'),
  ('working_hours', 'Pazartesi - Cumartesi: 08:00 - 18:00'),
  ('about_text', 'Ali Vural Solar olarak güneş enerjisi sistemleri, karavan elektrik sistemleri, ev elektrik çözümleri ve teknik servis hizmetleri alanlarında uzman kadromuzla hizmet vermekteyiz.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO categories (name, slug, sort_order) VALUES
  ('Güneş Paneli Sistemleri', 'gunes-paneli', 1),
  ('Komple Solar Paketler', 'komple-solar', 2),
  ('Karavan Elektrik Sistemleri', 'karavan-elektrik', 3),
  ('Ev Elektriği Ürünleri', 'ev-elektrigi', 4),
  ('Jel Akü', 'jel-aku', 5),
  ('Elektrikli Ev Aletleri Tamiri', 'ev-aletleri-tamiri', 6),
  ('Teknik Servis ve Montaj', 'teknik-servis', 7)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO services (title, description, icon, sort_order) VALUES
  ('Güneş Paneli Kurulumu', 'Ev ve işyerleri için profesyonel güneş paneli kurulum hizmeti. Enerji tasarrufu ve çevreye duyarlı çözümler.', 'fas fa-solar-panel', 1),
  ('Karavan Elektrik Sistemleri', 'Karavan ve tekneler için özel elektrik sistemi tasarımı ve kurulumu. Mobil yaşam konforunuzu artırın.', 'fas fa-caravan', 2),
  ('Ev Elektrik Çözümleri', 'Ev içi elektrik tesisatı, aydınlatma ve enerji verimliliği çözümleri.', 'fas fa-home', 3),
  ('Jel Akü Satış ve Tamiri', 'Jel akü satışı, bakımı ve tamiri. Güç kaynağı ihtiyaçlarınız için uzman desteği.', 'fas fa-battery-full', 4),
  ('Elektrikli Ev Aletleri Tamiri', 'Bozulan elektrikli ev aletleriniz için profesyonel tamir ve bakım hizmeti.', 'fas fa-tools', 5),
  ('Teknik Servis', 'Periyodik bakım, arıza tespiti ve onarım hizmetleri. Hızlı ve güvenilir çözümler.', 'fas fa-wrench', 6)
ON CONFLICT DO NOTHING;

INSERT INTO page_contents (page_slug, section, content) VALUES
  ('home', 'hero_title', 'Güneş Enerjisiyle Geleceğinizi Aydınlatın'),
  ('home', 'hero_subtitle', 'Profesyonel güneş enerjisi çözümleri, karavan elektrik sistemleri ve teknik servis hizmetleri.'),
  ('home', 'hero_cta', 'Ücretsiz Keşif İçin Bize Ulaşın'),
  ('about', 'title', 'Hakkımızda'),
  ('about', 'subtitle', 'Güneş enerjisi ve elektrik çözümlerinde güvenilir partneriniz.'),
  ('about', 'mission', 'Müşterilerimize en kaliteli ürünleri ve en güvenilir hizmeti sunarak, enerji verimliliğine katkıda bulunmak.'),
  ('about', 'vision', 'Güneş enerjisi ve yenilenebilir enerji çözümlerinde bölgesinde lider kuruluş olmak.'),
  ('services', 'title', 'Hizmetlerimiz'),
  ('services', 'subtitle', 'Profesyonel ve güvenilir enerji çözümleri sunuyoruz.'),
  ('products', 'title', 'Ürünler ve Fiyatlar'),
  ('products', 'subtitle', 'Kaliteli ürünler uygun fiyatlarla.'),
  ('gallery', 'title', 'Galeri'),
  ('gallery', 'subtitle', 'Projelerimiz ve çalışmalarımızdan kareler.'),
  ('contact', 'title', 'İletişim'),
  ('contact', 'subtitle', 'Sorularınız ve talepleriniz için bize ulaşın.')
ON CONFLICT (page_slug, section) DO NOTHING;
