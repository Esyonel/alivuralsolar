const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Multer setup
const createStorage = (subfolder) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '..', 'public', 'uploads', subfolder);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  });
};

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|svg/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  cb(null, ext && mime);
};

const uploadProduct = multer({ storage: createStorage('products'), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadGallery = multer({ storage: createStorage('gallery'), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadService = multer({ storage: createStorage('services'), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Auth middleware
function authMiddleware(req, res, next) {
  if (req.session && req.session.user) return next();
  req.session.error = 'Bu sayfaya erişim için giriş yapmalısınız.';
  res.redirect('/admin/login');
}

// Admin login
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin');
  res.render('admin/login', { title: 'Admin Girişi' });
});

router.post('/login', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { username, password } = req.body;

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (!user || !bcrypt.compareSync(password, user.password)) {
    req.session.error = 'Kullanıcı adı veya şifre hatalı.';
    return res.redirect('/admin/login');
  }

  req.session.user = { id: user.id, username: user.username, role: user.role };
  res.redirect('/admin');
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Dashboard
router.get('/', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;

  const [products, categories, services, gallery, inquiries, newInquiries] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('services').select('id', { count: 'exact', head: true }),
    supabase.from('gallery').select('id', { count: 'exact', head: true }),
    supabase.from('inquiries').select('*').order('created_at', { ascending: false }).limit(10),
    supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new')
  ]);

  const stats = {
    products: products.count || 0,
    categories: categories.count || 0,
    services: services.count || 0,
    gallery: gallery.count || 0,
    inquiries: inquiries.data ? inquiries.data.length : 0,
    newInquiries: newInquiries.count || 0
  };

  res.render('admin/dashboard', { title: 'Admin Panel', stats, recentInquiries: inquiries.data || [], user: req.session.user });
});

// === PRODUCTS ===
router.get('/products', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: products } = await supabase
    .from('products')
    .select('*, categories(name)')
    .order('created_at', { ascending: false });

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  const formatted = (products || []).map(p => ({ ...p, category_name: p.categories ? p.categories.name : null }));

  res.render('admin/products', { title: 'Ürün Yönetimi', products: formatted, categories: categories || [], user: req.session.user });
});

router.post('/products', authMiddleware, uploadProduct.single('image'), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { name, category_id, description, price, featured, status } = req.body;
  const image = req.file ? '/uploads/products/' + req.file.filename : null;

  await supabase.from('products').insert([{
    category_id: category_id || null,
    name,
    description: description || '',
    price: price || '',
    image,
    featured: featured ? 1 : 0,
    status: status !== undefined ? (status ? 1 : 0) : 1
  }]);

  req.session.success = 'Ürün başarıyla eklendi.';
  res.redirect('/admin/products');
});

router.post('/products/:id', authMiddleware, uploadProduct.single('image'), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { name, category_id, description, price, featured, status } = req.body;

  const { data: existing } = await supabase.from('products').select('image').eq('id', req.params.id).single();
  let image = existing ? existing.image : null;

  if (req.file) {
    if (existing && existing.image) {
      const oldPath = path.join(__dirname, '..', 'public', existing.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    image = '/uploads/products/' + req.file.filename;
  }

  await supabase.from('products').update({
    category_id: category_id || null,
    name,
    description: description || '',
    price: price || '',
    image,
    featured: featured ? 1 : 0,
    status: status !== undefined ? (status ? 1 : 0) : 1
  }).eq('id', req.params.id);

  req.session.success = 'Ürün başarıyla güncellendi.';
  res.redirect('/admin/products');
});

router.post('/products/:id/delete', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data: product } = await supabase.from('products').select('image').eq('id', req.params.id).single();
  if (product && product.image) {
    const imgPath = path.join(__dirname, '..', 'public', product.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  await supabase.from('products').delete().eq('id', req.params.id);
  req.session.success = 'Ürün başarıyla silindi.';
  res.redirect('/admin/products');
});

// === CATEGORIES ===
router.get('/categories', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data: categories } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
  res.render('admin/categories', { title: 'Kategori Yönetimi', categories: categories || [], user: req.session.user });
});

router.post('/categories', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { name, slug, sort_order } = req.body;
  await supabase.from('categories').insert([{ name, slug, sort_order: sort_order || 0 }]);
  req.session.success = 'Kategori başarıyla eklendi.';
  res.redirect('/admin/categories');
});

router.post('/categories/:id', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { name, slug, sort_order } = req.body;
  await supabase.from('categories').update({ name, slug, sort_order: sort_order || 0 }).eq('id', req.params.id);
  req.session.success = 'Kategori başarıyla güncellendi.';
  res.redirect('/admin/categories');
});

router.post('/categories/:id/delete', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;
  await supabase.from('categories').delete().eq('id', req.params.id);
  req.session.success = 'Kategori başarıyla silindi.';
  res.redirect('/admin/categories');
});

// === SERVICES ===
router.get('/services', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data: services } = await supabase.from('services').select('*').order('sort_order', { ascending: true });
  res.render('admin/services', { title: 'Hizmet Yönetimi', services: services || [], user: req.session.user });
});

router.post('/services', authMiddleware, uploadService.single('image'), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { title, description, icon, sort_order } = req.body;
  const image = req.file ? '/uploads/services/' + req.file.filename : null;
  await supabase.from('services').insert([{ title, description: description || '', icon: icon || '', image, sort_order: sort_order || 0 }]);
  req.session.success = 'Hizmet başarıyla eklendi.';
  res.redirect('/admin/services');
});

router.post('/services/:id', authMiddleware, uploadService.single('image'), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { title, description, icon, sort_order } = req.body;
  const { data: existing } = await supabase.from('services').select('image').eq('id', req.params.id).single();
  let image = existing ? existing.image : null;
  if (req.file) {
    if (existing && existing.image) {
      const oldPath = path.join(__dirname, '..', 'public', existing.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    image = '/uploads/services/' + req.file.filename;
  }
  await supabase.from('services').update({ title, description: description || '', icon: icon || '', image, sort_order: sort_order || 0 }).eq('id', req.params.id);
  req.session.success = 'Hizmet başarıyla güncellendi.';
  res.redirect('/admin/services');
});

router.post('/services/:id/delete', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data: service } = await supabase.from('services').select('image').eq('id', req.params.id).single();
  if (service && service.image) {
    const imgPath = path.join(__dirname, '..', 'public', service.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  await supabase.from('services').delete().eq('id', req.params.id);
  req.session.success = 'Hizmet başarıyla silindi.';
  res.redirect('/admin/services');
});

// === GALLERY ===
router.get('/gallery', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data: galleryItems } = await supabase.from('gallery').select('*').order('sort_order', { ascending: true });
  res.render('admin/gallery', { title: 'Galeri Yönetimi', galleryItems: galleryItems || [], user: req.session.user });
});

router.post('/gallery', authMiddleware, uploadGallery.single('image'), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { title, category, sort_order } = req.body;
  if (!req.file) {
    req.session.error = 'Lütfen bir resim seçin.';
    return res.redirect('/admin/gallery');
  }
  const image = '/uploads/gallery/' + req.file.filename;
  await supabase.from('gallery').insert([{ title: title || '', image, category: category || '', sort_order: sort_order || 0 }]);
  req.session.success = 'Galeri görseli başarıyla eklendi.';
  res.redirect('/admin/gallery');
});

router.post('/gallery/:id/delete', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data: item } = await supabase.from('gallery').select('image').eq('id', req.params.id).single();
  if (item && item.image) {
    const imgPath = path.join(__dirname, '..', 'public', item.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  await supabase.from('gallery').delete().eq('id', req.params.id);
  req.session.success = 'Galeri görseli başarıyla silindi.';
  res.redirect('/admin/gallery');
});

// === PAGE CONTENTS ===
router.get('/content', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const page = req.query.page || 'home';
  const { data: contents } = await supabase.from('page_contents').select('*').eq('page_slug', page);
  const pages = ['home', 'about', 'services', 'products', 'gallery', 'contact'];
  res.render('admin/content', { title: 'Sayfa İçerik Yönetimi', contents: contents || [], pages, currentPage: page, user: req.session.user });
});

router.post('/content', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { page_slug, sections } = req.body;

  for (const [section, content] of Object.entries(sections)) {
    await supabase.from('page_contents').upsert(
      { page_slug, section, content },
      { onConflict: 'page_slug,section' }
    );
  }

  req.session.success = 'Sayfa içerikleri başarıyla güncellendi.';
  res.redirect('/admin/content?page=' + page_slug);
});

// === CONTACT INFO ===
router.get('/contact-info', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const getSettings = req.app.locals.getSettings;
  const settings = await getSettings();
  res.render('admin/contact-info', { title: 'İletişim Bilgileri', settings, user: req.session.user });
});

router.post('/contact-info', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { settings } = req.body;

  for (const [key, value] of Object.entries(settings)) {
    await supabase.from('settings').upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
  }

  req.session.success = 'İletişim bilgileri başarıyla güncellendi.';
  res.redirect('/admin/contact-info');
});

// === ABOUT ===
router.get('/about', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const getSettings = req.app.locals.getSettings;
  const settings = await getSettings();
  res.render('admin/about', { title: 'Hakkımızda Yönetimi', settings, user: req.session.user });
});

router.post('/about', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { about_text } = req.body;
  await supabase.from('settings').upsert(
    { key: 'about_text', value: about_text, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  );
  req.session.success = 'Hakkımızda metni başarıyla güncellendi.';
  res.redirect('/admin/about');
});

// === INQUIRIES ===
router.get('/inquiries', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const status = req.query.status;

  let query = supabase.from('inquiries').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);

  const { data: inquiries } = await query;
  res.render('admin/inquiries', { title: 'Talep Yönetimi', inquiries: inquiries || [], currentStatus: status || 'all', user: req.session.user });
});

router.post('/inquiries/:id/status', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { status } = req.body;
  await supabase.from('inquiries').update({ status }).eq('id', req.params.id);
  req.session.success = 'Talep durumu güncellendi.';
  res.redirect('/admin/inquiries');
});

router.post('/inquiries/:id/delete', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;
  await supabase.from('inquiries').delete().eq('id', req.params.id);
  req.session.success = 'Talep başarıyla silindi.';
  res.redirect('/admin/inquiries');
});

// === PASSWORD CHANGE ===
router.get('/password', authMiddleware, (req, res) => {
  res.render('admin/password', { title: 'Şifre Değiştir', user: req.session.user });
});

router.post('/password', authMiddleware, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { current_password, new_password, confirm_password } = req.body;

  if (!current_password || !new_password || !confirm_password) {
    req.session.error = 'Tüm alanları doldurun.';
    return res.redirect('/admin/password');
  }

  if (new_password !== confirm_password) {
    req.session.error = 'Yeni şifreler eşleşmiyor.';
    return res.redirect('/admin/password');
  }

  if (new_password.length < 6) {
    req.session.error = 'Yeni şifre en az 6 karakter olmalı.';
    return res.redirect('/admin/password');
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.session.user.id)
    .single();

  if (!user || !bcrypt.compareSync(current_password, user.password)) {
    req.session.error = 'Mevcut şifre hatalı.';
    return res.redirect('/admin/password');
  }

  const hash = bcrypt.hashSync(new_password, 10);
  await supabase.from('users').update({ password: hash }).eq('id', req.session.user.id);

  req.session.success = 'Şifre başarıyla güncellendi.';
  res.redirect('/admin/password');
});

module.exports = router;
