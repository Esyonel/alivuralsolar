const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');
const { uploadProduct, uploadGallery, uploadService } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

function getSettings(db) {
  const rows = db.prepare('SELECT * FROM settings').all();
  return rows.reduce((acc, row) => { acc[row.key] = row.value; return acc; }, {});
}

// Admin login page
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin');
  res.render('admin/login', { title: 'Admin Girişi' });
});

// Admin login process
router.post('/login', (req, res) => {
  const db = req.app.locals.db;
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    req.session.error = 'Kullanıcı adı veya şifre hatalı.';
    return res.redirect('/admin/login');
  }
  
  req.session.user = { id: user.id, username: user.username, role: user.role };
  res.redirect('/admin');
});

// Admin logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Dashboard
router.get('/', authMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const stats = {
    products: db.prepare('SELECT COUNT(*) as count FROM products').get().count,
    categories: db.prepare('SELECT COUNT(*) as count FROM categories').get().count,
    services: db.prepare('SELECT COUNT(*) as count FROM services').get().count,
    gallery: db.prepare('SELECT COUNT(*) as count FROM gallery').get().count,
    inquiries: db.prepare('SELECT COUNT(*) as count FROM inquiries').get().count,
    newInquiries: db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'new'").get().count
  };
  const recentInquiries = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 10').all();
  res.render('admin/dashboard', { title: 'Admin Panel', stats, recentInquiries, user: req.session.user });
});

// === PRODUCTS ===
router.get('/products', authMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const products = db.prepare(`
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    ORDER BY p.created_at DESC
  `).all();
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
  res.render('admin/products', { title: 'Ürün Yönetimi', products, categories, user: req.session.user });
});

router.post('/products', authMiddleware, uploadProduct.single('image'), (req, res) => {
  const db = req.app.locals.db;
  const { name, category_id, description, price, featured, status } = req.body;
  const image = req.file ? '/uploads/products/' + req.file.filename : null;
  
  db.prepare(`
    INSERT INTO products (category_id, name, description, price, image, featured, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(category_id || null, name, description || '', price || '', image, featured ? 1 : 0, status !== undefined ? (status ? 1 : 0) : 1);
  
  req.session.success = 'Ürün başarıyla eklendi.';
  res.redirect('/admin/products');
});

router.post('/products/:id', authMiddleware, uploadProduct.single('image'), (req, res) => {
  const db = req.app.locals.db;
  const { name, category_id, description, price, featured, status } = req.body;
  const existing = db.prepare('SELECT image FROM products WHERE id = ?').get(req.params.id);
  
  let image = existing ? existing.image : null;
  if (req.file) {
    if (existing && existing.image) {
      const oldPath = path.join(__dirname, '..', 'public', existing.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    image = '/uploads/products/' + req.file.filename;
  }
  
  db.prepare(`
    UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, image = ?, featured = ?, status = ? 
    WHERE id = ?
  `).run(category_id || null, name, description || '', price || '', image, featured ? 1 : 0, status !== undefined ? (status ? 1 : 0) : 1, req.params.id);
  
  req.session.success = 'Ürün başarıyla güncellendi.';
  res.redirect('/admin/products');
});

router.post('/products/:id/delete', authMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const product = db.prepare('SELECT image FROM products WHERE id = ?').get(req.params.id);
  if (product && product.image) {
    const imgPath = path.join(__dirname, '..', 'public', product.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  req.session.success = 'Ürün başarıyla silindi.';
  res.redirect('/admin/products');
});

// === CATEGORIES ===
router.get('/categories', authMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
  res.render('admin/categories', { title: 'Kategori Yönetimi', categories, user: req.session.user });
});

router.post('/categories', authMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const { name, slug, sort_order } = req.body;
  db.prepare('INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, ?)').run(name, slug, sort_order || 0);
  req.session.success = 'Kategori başarıyla eklendi.';
  res.redirect('/admin/categories');
});

router.post('/categories/:id', authMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const { name, slug, sort_order } = req.body;
  db.prepare('UPDATE categories SET name = ?, slug = ?, sort_order = ? WHERE id = ?').run(name, slug, sort_order || 0, req.params.id);
  req.session.success = 'Kategori başarıyla güncellendi.';
  res.redirect('/admin/categories');
});

router.post('/categories/:id/delete', authMiddleware, (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  req.session.success = 'Kategori başarıyla silindi.';
  res.redirect('/admin/categories');
});

// === SERVICES ===
router.get('/services', authMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const services = db.prepare('SELECT * FROM services ORDER BY sort_order ASC').all();
  res.render('admin/services', { title: 'Hizmet Yönetimi', services, user: req.session.user });
});

router.post('/services', authMiddleware, uploadService.single('image'), (req, res) => {
  const db = req.app.locals.db;
  const { title, description, icon, sort_order } = req.body;
  const image = req.file ? '/uploads/services/' + req.file.filename : null;
  db.prepare('INSERT INTO services (title, description, icon, image, sort_order) VALUES (?, ?, ?, ?, ?)').run(title, description || '', icon || '', image, sort_order || 0);
  req.session.success = 'Hizmet başarıyla eklendi.';
  res.redirect('/admin/services');
});

router.post('/services/:id', authMiddleware, uploadService.single('image'), (req, res) => {
  const db = req.app.locals.db;
  const { title, description, icon, sort_order } = req.body;
  const existing = db.prepare('SELECT image FROM services WHERE id = ?').get(req.params.id);
  let image = existing ? existing.image : null;
  if (req.file) {
    if (existing && existing.image) {
      const oldPath = path.join(__dirname, '..', 'public', existing.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    image = '/uploads/services/' + req.file.filename;
  }
  db.prepare('UPDATE services SET title = ?, description = ?, icon = ?, image = ?, sort_order = ? WHERE id = ?').run(title, description || '', icon || '', image, sort_order || 0, req.params.id);
  req.session.success = 'Hizmet başarıyla güncellendi.';
  res.redirect('/admin/services');
});

router.post('/services/:id/delete', authMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const service = db.prepare('SELECT image FROM services WHERE id = ?').get(req.params.id);
  if (service && service.image) {
    const imgPath = path.join(__dirname, '..', 'public', service.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  req.session.success = 'Hizmet başarıyla silindi.';
  res.redirect('/admin/services');
});

// === GALLERY ===
router.get('/gallery', authMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const galleryItems = db.prepare('SELECT * FROM gallery ORDER BY sort_order ASC').all();
  res.render('admin/gallery', { title: 'Galeri Yönetimi', galleryItems, user: req.session.user });
});

router.post('/gallery', authMiddleware, uploadGallery.single('image'), (req, res) => {
  const db = req.app.locals.db;
  const { title, category, sort_order } = req.body;
  if (!req.file) {
    req.session.error = 'Lütfen bir resim seçin.';
    return res.redirect('/admin/gallery');
  }
  const image = '/uploads/gallery/' + req.file.filename;
  db.prepare('INSERT INTO gallery (title, image, category, sort_order) VALUES (?, ?, ?, ?)').run(title || '', image, category || '', sort_order || 0);
  req.session.success = 'Galeri görseli başarıyla eklendi.';
  res.redirect('/admin/gallery');
});

router.post('/gallery/:id/delete', authMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const item = db.prepare('SELECT image FROM gallery WHERE id = ?').get(req.params.id);
  if (item && item.image) {
    const imgPath = path.join(__dirname, '..', 'public', item.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  db.prepare('DELETE FROM gallery WHERE id = ?').run(req.params.id);
  req.session.success = 'Galeri görseli başarıyla silindi.';
  res.redirect('/admin/gallery');
});

// === PAGE CONTENTS ===
router.get('/content', authMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const page = req.query.page || 'home';
  const contents = db.prepare('SELECT * FROM page_contents WHERE page_slug = ?').all(page);
  const pages = ['home', 'about', 'services', 'products', 'gallery', 'contact'];
  res.render('admin/content', { title: 'Sayfa İçerik Yönetimi', contents, pages, currentPage: page, user: req.session.user });
});

router.post('/content', authMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const { page_slug, sections } = req.body;
  const upsert = db.prepare(`
    INSERT INTO page_contents (page_slug, section, content) VALUES (?, ?, ?)
    ON CONFLICT(page_slug, section) DO UPDATE SET content = excluded.content, updated_at = CURRENT_TIMESTAMP
  `);
  const updateMany = db.transaction((items) => {
    for (const [section, content] of Object.entries(items)) {
      upsert.run(page_slug, section, content);
    }
  });
  updateMany(sections);
  req.session.success = 'Sayfa içerikleri başarıyla güncellendi.';
  res.redirect('/admin/content?page=' + page_slug);
});

// === CONTACT INFO ===
router.get('/contact-info', authMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const settings = getSettings(db);
  const contactInfo = db.prepare('SELECT * FROM contact_info ORDER BY type ASC').all();
  res.render('admin/contact-info', { title: 'İletişim Bilgileri', settings, contactInfo, user: req.session.user });
});

router.post('/contact-info', authMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const { settings } = req.body;
  const upsert = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `);
  const updateMany = db.transaction((items) => {
    for (const [key, value] of Object.entries(items)) {
      upsert.run(key, value);
    }
  });
  updateMany(settings);
  req.session.success = 'İletişim bilgileri başarıyla güncellendi.';
  res.redirect('/admin/contact-info');
});

// === ABOUT ===
router.get('/about', authMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const settings = getSettings(db);
  res.render('admin/about', { title: 'Hakkımızda Yönetimi', settings, user: req.session.user });
});

router.post('/about', authMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const { about_text } = req.body;
  db.prepare(`
    INSERT INTO settings (key, value) VALUES ('about_text', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `).run(about_text);
  req.session.success = 'Hakkımızda metni başarıyla güncellendi.';
  res.redirect('/admin/about');
});

// === INQUIRIES ===
router.get('/inquiries', authMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const status = req.query.status;
  let inquiries;
  if (status) {
    inquiries = db.prepare('SELECT * FROM inquiries WHERE status = ? ORDER BY created_at DESC').all(status);
  } else {
    inquiries = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all();
  }
  res.render('admin/inquiries', { title: 'Talep Yönetimi', inquiries, currentStatus: status || 'all', user: req.session.user });
});

router.post('/inquiries/:id/status', authMiddleware, (req, res) => {
  const db = req.app.locals.db;
  const { status } = req.body;
  db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(status, req.params.id);
  req.session.success = 'Talep durumu güncellendi.';
  res.redirect('/admin/inquiries');
});

router.post('/inquiries/:id/delete', authMiddleware, (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM inquiries WHERE id = ?').run(req.params.id);
  req.session.success = 'Talep başarıyla silindi.';
  res.redirect('/admin/inquiries');
});

module.exports = router;
