-- RLS'i devre dışı bırak veya policy ekle
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilsin
CREATE POLICY "Public read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read services" ON services FOR SELECT USING (true);
CREATE POLICY "Public read gallery" ON gallery FOR SELECT USING (true);
CREATE POLICY "Public read page_contents" ON page_contents FOR SELECT USING (true);

-- Herkes yazabilsin (talepler icin)
CREATE POLICY "Anyone insert inquiries" ON inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read inquiries" ON inquiries FOR SELECT USING (true);

-- Service key ile her seyi yapabilsin (admin panel icin)
CREATE POLICY "Full access settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access services" ON services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access gallery" ON gallery FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access page_contents" ON page_contents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access inquiries" ON inquiries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access users" ON users FOR ALL USING (true) WITH CHECK (true);

-- Varsayilan veriler (eger hala yoksa)
INSERT INTO settings (key, value) VALUES
  ('company_name', 'Ali Vural Enerji'),
  ('site_name', 'alivuralsolar.com'),
  ('phone', '+90 541 575 37 09'),
  ('whatsapp', '+905415753709'),
  ('email', 'info@alivuralsolar.com'),
  ('address', 'Rızaşye Mahallesi 10058 Sk No:29 Merkez Osmaniye'),
  ('map_lat', '37.0748'),
  ('map_lng', '37.2153'),
  ('working_hours', 'Pazartesi - Cumartesi: 08:00 - 18:00'),
  ('about_text', 'Ali Vural Enerji olarak güneş enerjisi sistemleri, karavan elektrik sistemleri, ev elektrik çözümleri ve teknik servis hizmetleri alanlarında uzman kadromuzla hizmet vermekteyiz.')
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
  ('Güneş Paneli Kurulumu', 'Ev ve işyerleri için profesyonel güneş paneli kurulum hizmeti.', 'fas fa-solar-panel', 1),
  ('Karavan Elektrik Sistemleri', 'Karavan ve tekneler için özel elektrik sistemi tasarımı ve kurulumu.', 'fas fa-caravan', 2),
  ('Ev Elektrik Çözümleri', 'Ev içi elektrik tesisatı, aydınlatma ve enerji verimliliği çözümleri.', 'fas fa-home', 3),
  ('Jel Akü Satış ve Tamiri', 'Jel akü satışı, bakımı ve tamiri.', 'fas fa-battery-full', 4),
  ('Elektrikli Ev Aletleri Tamiri', 'Bozulan elektrikli ev aletleriniz için profesyonel tamir ve bakım hizmeti.', 'fas fa-tools', 5),
  ('Teknik Servis', 'Periyodik bakım, arıza tespiti ve onarım hizmetleri.', 'fas fa-wrench', 6);

INSERT INTO page_contents (page_slug, section, content) VALUES
  ('home', 'hero_title', 'Güneş Enerjisiyle Geleceğinizi Aydınlatın'),
  ('home', 'hero_subtitle', 'Profesyonel güneş enerjisi çözümleri, karavan elektrik sistemleri ve teknik servis hizmetleri.'),
  ('home', 'hero_cta', 'Ücretsiz Keşif İçin Bize Ulaşın'),
  ('about', 'title', 'Hakkımızda'),
  ('about', 'subtitle', 'Güneş enerjisi ve elektrik çözümlerinde güvenilir partneriniz.'),
  ('services', 'title', 'Hizmetlerimiz'),
  ('products', 'title', 'Ürünler ve Fiyatlar'),
  ('gallery', 'title', 'Galeri'),
  ('contact', 'title', 'İletişim')
ON CONFLICT (page_slug, section) DO NOTHING;

-- Admin kullanici (bcrypt hash)
INSERT INTO users (username, password, role) VALUES
  ('admin', '$2a$10$NtCql8Ih5MgRCpR9Su0BC.Jg4KCKS5IFpCTnITUFFsR9gc0h3ENEC', 'admin')
ON CONFLICT (username) DO NOTHING;
