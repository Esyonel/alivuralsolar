const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'alivuralsolar.db');

function initDatabase() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      price TEXT,
      image TEXT,
      featured INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);

  // Services table
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      image TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Gallery table
  db.exec(`
    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      image TEXT NOT NULL,
      category TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Page contents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS page_contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_slug TEXT NOT NULL,
      section TEXT NOT NULL,
      content TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(page_slug, section)
    )
  `);

  // Contact info table
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      label TEXT,
      is_active INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Inquiries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      product_id INTEGER,
      status TEXT DEFAULT 'new',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )
  `);

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default data
  seedDefaults(db);

  return db;
}

function seedDefaults(db) {
  const settingCount = db.prepare('SELECT COUNT(*) as count FROM settings').get().count;
  if (settingCount === 0) {
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    const defaultSettings = [
      ['company_name', 'Ali Vural Solar'],
      ['site_name', 'alivuralsolar.com'],
      ['phone', '+90 541 575 37 09'],
      ['whatsapp', '+905415753709'],
      ['email', 'info@alivuralsolar.com'],
      ['address', 'Rızaşye Mahallesi 10058 Sk No:29 Merkez Osmaniye'],
      ['map_lat', '37.0748'],
      ['map_lng', '37.2153'],
      ['working_hours', 'Pazartesi - Cumartesi: 08:00 - 18:00'],
      ['about_text', 'Ali Vural Solar olarak güneş enerjisi sistemleri, karavan elektrik sistemleri, ev elektrik çözümleri ve teknik servis hizmetleri alanlarında uzman kadromuzla hizmet vermekteyiz. Müşterilerimize kaliteli ürünler ve güvenilir montaj hizmeti sunmayı ilke ediniyoruz.']
    ];
    const insertMany = db.transaction((items) => {
      for (const [key, value] of items) {
        insertSetting.run(key, value);
      }
    });
    insertMany(defaultSettings);
  }

  // Default admin user
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
  }

  // Default categories
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (catCount === 0) {
    const insertCat = db.prepare('INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, ?)');
    const categories = [
      ['Güneş Paneli Sistemleri', 'gunes-paneli', 1],
      ['Komple Solar Paketler', 'komple-solar', 2],
      ['Karavan Elektrik Sistemleri', 'karavan-elektrik', 3],
      ['Ev Elektriği Ürünleri', 'ev-elektrigi', 4],
      ['Jel Akü', 'jel-aku', 5],
      ['Elektrikli Ev Aletleri Tamiri', 'ev-aletleri-tamiri', 6],
      ['Teknik Servis ve Montaj', 'teknik-servis', 7]
    ];
    const insertCats = db.transaction((items) => {
      for (const [name, slug, order] of items) {
        insertCat.run(name, slug, order);
      }
    });
    insertCats(categories);
  }

  // Default services
  const servCount = db.prepare('SELECT COUNT(*) as count FROM services').get().count;
  if (servCount === 0) {
    const insertServ = db.prepare('INSERT INTO services (title, description, icon, sort_order) VALUES (?, ?, ?, ?)');
    const services = [
      ['Güneş Paneli Kurulumu', 'Ev ve işyerleri için profesyonel güneş paneli kurulum hizmeti. Enerji tasarrufu ve çevreye duyarlı çözümler.', 'fas fa-solar-panel', 1],
      ['Karavan Elektrik Sistemleri', 'Karavan ve tekneler için özel elektrik sistemi tasarımı ve kurulumu. Mobil yaşam konforunuzu artırın.', 'fas fa-caravan', 2],
      ['Ev Elektrik Çözümleri', 'Ev içi elektrik tesisatı, aydınlatma ve enerji verimliliği çözümleri.', 'fas fa-home', 3],
      ['Jel Akü Satış ve Tamiri', 'Jel akü satışı, bakımı ve tamiri. Güç kaynağı ihtiyaçlarınız için uzman desteği.', 'fas fa-battery-full', 4],
      ['Elektrikli Ev Aletleri Tamiri', 'Bozulan elektrikli ev aletleriniz için profesyonel tamir ve bakım hizmeti.', 'fas fa-tools', 5],
      ['Teknik Servis', 'Periyodik bakım, arıza tespiti ve onarım hizmetleri. Hızlı ve güvenilir çözümler.', 'fas fa-wrench', 6]
    ];
    const insertServs = db.transaction((items) => {
      for (const [title, desc, icon, order] of items) {
        insertServ.run(title, desc, icon, order);
      }
    });
    insertServs(services);
  }

  // Default page contents
  const pageContentCount = db.prepare('SELECT COUNT(*) as count FROM page_contents').get().count;
  if (pageContentCount === 0) {
    const insertPage = db.prepare('INSERT INTO page_contents (page_slug, section, content) VALUES (?, ?, ?)');
    const pages = [
      ['home', 'hero_title', 'Güneş Enerjisiyle Geleceğinizi Aydınlatın'],
      ['home', 'hero_subtitle', 'Profyonel güneş enerjisi çözümleri, karavan elektrik sistemleri ve teknik servis hizmetleri.'],
      ['home', 'hero_cta', 'Ücretsiz Keşif İçin Bize Ulaşın'],
      ['home', 'stats_projects', '150+'],
      ['home', 'stats_projects_label', 'Tamamlanan Proje'],
      ['home', 'stats_customers', '200+'],
      ['home', 'stats_customers_label', 'Mutlu Müşteri'],
      ['home', 'stats_experience', '10+'],
      ['home', 'stats_experience_label', 'Yıl Deneyim'],
      ['home', 'stats_warranty', '5 Yıl'],
      ['home', 'stats_warranty_label', 'Garanti Süresi'],
      ['about', 'title', 'Hakkımızda'],
      ['about', 'subtitle', 'Güneş enerjisi ve elektrik çözümlerinde güvenilir partneriniz.'],
      ['about', 'mission', 'Müşterilerimize en kaliteli ürünleri ve en güvenilir hizmeti sunarak, enerji verimliliğine katkıda bulunmak ve sürdürülebilir bir gelecek için çalışmak.'],
      ['about', 'vision', 'Güneş enerjisi ve yenilenebilir enerji çözümlerinde bölgesinde lider kuruluş olmak.'],
      ['services', 'title', 'Hizmetlerimiz'],
      ['services', 'subtitle', 'Profesyonel ve güvenilir enerji çözümleri sunuyoruz.'],
      ['products', 'title', 'Ürünler ve Fiyatlar'],
      ['products', 'subtitle', 'Kaliteli ürünler uygun fiyatlarla. Detaylı bilgi için bize ulaşın.'],
      ['gallery', 'title', 'Galeri'],
      ['gallery', 'subtitle', 'Projelerimiz ve çalışmalarımızdan kareler.'],
      ['contact', 'title', 'İletişim'],
      ['contact', 'subtitle', 'Sorularınız ve talepleriniz için bize ulaşın.']
    ];
    const insertPages = db.transaction((items) => {
      for (const [slug, section, content] of items) {
        insertPage.run(slug, section, content);
      }
    });
    insertPages(pages);
  }
}

module.exports = { initDatabase, DB_PATH };
