const express = require('express');
const router = express.Router();

function getSettings(db) {
  const rows = db.prepare('SELECT * FROM settings').all();
  return rows.reduce((acc, row) => { acc[row.key] = row.value; return acc; }, {});
}

// Ana sayfa
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const settings = getSettings(db);
  const featuredProducts = db.prepare(`
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.featured = 1 AND p.status = 1 
    ORDER BY p.created_at DESC LIMIT 6
  `).all();
  const services = db.prepare('SELECT * FROM services ORDER BY sort_order ASC LIMIT 6').all();
  const galleryItems = db.prepare('SELECT * FROM gallery ORDER BY sort_order ASC LIMIT 6').all();
  const pageContent = {};

  const contents = db.prepare('SELECT * FROM page_contents WHERE page_slug = ?').all('home');
  contents.forEach(c => { pageContent[c.section] = c.content; });

  res.render('home', { settings, featuredProducts, services, galleryItems, pageContent });
});

// Hakkımızda
router.get('/hakkimizda', (req, res) => {
  const db = req.app.locals.db;
  const settings = getSettings(db);
  const pageContent = {};
  const contents = db.prepare('SELECT * FROM page_contents WHERE page_slug = ?').all('about');
  contents.forEach(c => { pageContent[c.section] = c.content; });
  res.render('about', { settings, pageContent });
});

// Hizmetler
router.get('/hizmetler', (req, res) => {
  const db = req.app.locals.db;
  const settings = getSettings(db);
  const services = db.prepare('SELECT * FROM services ORDER BY sort_order ASC').all();
  const pageContent = {};
  const contents = db.prepare('SELECT * FROM page_contents WHERE page_slug = ?').all('services');
  contents.forEach(c => { pageContent[c.section] = c.content; });
  res.render('services', { settings, services, pageContent });
});

// Ürünler ve Fiyatlar
router.get('/urunler', (req, res) => {
  const db = req.app.locals.db;
  const settings = getSettings(db);
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
  const categoryId = req.query.kategori;
  let products;
  if (categoryId) {
    products = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.category_id = ? AND p.status = 1 
      ORDER BY p.created_at DESC
    `).all(categoryId);
  } else {
    products = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.status = 1 
      ORDER BY p.created_at DESC
    `).all();
  }
  const pageContent = {};
  const contents = db.prepare('SELECT * FROM page_contents WHERE page_slug = ?').all('products');
  contents.forEach(c => { pageContent[c.section] = c.content; });
  res.render('products', { settings, categories, products, selectedCategory: categoryId || null, pageContent });
});

// Ürün detay
router.get('/urun/:id', (req, res) => {
  const db = req.app.locals.db;
  const settings = getSettings(db);
  const product = db.prepare(`
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.id = ? AND p.status = 1
  `).get(req.params.id);
  if (!product) return res.status(404).render('404', { title: 'Ürün Bulunamadı', settings });
  
  const relatedProducts = db.prepare(`
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.category_id = ? AND p.id != ? AND p.status = 1 
    ORDER BY RANDOM() LIMIT 3
  `).all(product.category_id, product.id);
  
  res.render('product-detail', { settings, product, relatedProducts });
});

// Galeri
router.get('/galeri', (req, res) => {
  const db = req.app.locals.db;
  const settings = getSettings(db);
  const galleryItems = db.prepare('SELECT * FROM gallery ORDER BY sort_order ASC').all();
  const pageContent = {};
  const contents = db.prepare('SELECT * FROM page_contents WHERE page_slug = ?').all('gallery');
  contents.forEach(c => { pageContent[c.section] = c.content; });
  res.render('gallery', { settings, galleryItems, pageContent });
});

// İletişim
router.get('/iletisim', (req, res) => {
  const db = req.app.locals.db;
  const settings = getSettings(db);
  const contactInfo = db.prepare('SELECT * FROM contact_info WHERE is_active = 1').all();
  const pageContent = {};
  const contents = db.prepare('SELECT * FROM page_contents WHERE page_slug = ?').all('contact');
  contents.forEach(c => { pageContent[c.section] = c.content; });
  res.render('contact', { settings, contactInfo, pageContent });
});

module.exports = router;
