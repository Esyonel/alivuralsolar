const express = require('express');
const router = express.Router();

// Ana sayfa
router.get('/', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const getSettings = req.app.locals.getSettings;
  const settings = await getSettings();

  const { data: featuredProducts } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('featured', 1)
    .eq('status', 1)
    .order('created_at', { ascending: false })
    .limit(6);

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true })
    .limit(6);

  const { data: galleryItems } = await supabase
    .from('gallery')
    .select('*')
    .order('sort_order', { ascending: true })
    .limit(6);

  const { data: contents } = await supabase
    .from('page_contents')
    .select('*')
    .eq('page_slug', 'home');

  const pageContent = {};
  if (contents) contents.forEach(c => { pageContent[c.section] = c.content; });

  // Format products to include category_name
  const formattedProducts = (featuredProducts || []).map(p => ({
    ...p,
    category_name: p.categories ? p.categories.name : null
  }));

  res.render('home', { settings, featuredProducts: formattedProducts, services: services || [], galleryItems: galleryItems || [], pageContent });
});

// Hakkımızda
router.get('/hakkimizda', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const getSettings = req.app.locals.getSettings;
  const settings = await getSettings();

  const { data: contents } = await supabase
    .from('page_contents')
    .select('*')
    .eq('page_slug', 'about');

  const pageContent = {};
  if (contents) contents.forEach(c => { pageContent[c.section] = c.content; });
  res.render('about', { settings, pageContent });
});

// Hizmetler
router.get('/hizmetler', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const getSettings = req.app.locals.getSettings;
  const settings = await getSettings();

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true });

  const { data: contents } = await supabase
    .from('page_contents')
    .select('*')
    .eq('page_slug', 'services');

  const pageContent = {};
  if (contents) contents.forEach(c => { pageContent[c.section] = c.content; });
  res.render('services', { settings, services: services || [], pageContent });
});

// Ürünler
router.get('/urunler', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const getSettings = req.app.locals.getSettings;
  const settings = await getSettings();

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  const categoryId = req.query.kategori;
  let query = supabase
    .from('products')
    .select('*, categories(name)')
    .eq('status', 1);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data: products } = await query.order('created_at', { ascending: false });

  const { data: contents } = await supabase
    .from('page_contents')
    .select('*')
    .eq('page_slug', 'products');

  const pageContent = {};
  if (contents) contents.forEach(c => { pageContent[c.section] = c.content; });

  const formattedProducts = (products || []).map(p => ({
    ...p,
    category_name: p.categories ? p.categories.name : null
  }));

  res.render('products', { settings, categories: categories || [], products: formattedProducts, selectedCategory: categoryId || null, pageContent });
});

// Ürün detay
router.get('/urun/:id', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const getSettings = req.app.locals.getSettings;
  const settings = await getSettings();

  const { data: product } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('id', req.params.id)
    .eq('status', 1)
    .single();

  if (!product) return res.status(404).render('404', { title: 'Ürün Bulunamadı', settings });

  const formattedProduct = {
    ...product,
    category_name: product.categories ? product.categories.name : null
  };

  let relatedProducts = [];
  if (product.category_id) {
    const { data: related } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('category_id', product.category_id)
      .neq('id', product.id)
      .eq('status', 1)
      .limit(3);

    relatedProducts = (related || []).map(p => ({
      ...p,
      category_name: p.categories ? p.categories.name : null
    }));
  }

  res.render('product-detail', { settings, product: formattedProduct, relatedProducts });
});

// Galeri
router.get('/galeri', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const getSettings = req.app.locals.getSettings;
  const settings = await getSettings();

  const { data: galleryItems } = await supabase
    .from('gallery')
    .select('*')
    .order('sort_order', { ascending: true });

  const { data: contents } = await supabase
    .from('page_contents')
    .select('*')
    .eq('page_slug', 'gallery');

  const pageContent = {};
  if (contents) contents.forEach(c => { pageContent[c.section] = c.content; });
  res.render('gallery', { settings, galleryItems: galleryItems || [], pageContent });
});

// İletişim
router.get('/iletisim', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const getSettings = req.app.locals.getSettings;
  const settings = await getSettings();

  const { data: contents } = await supabase
    .from('page_contents')
    .select('*')
    .eq('page_slug', 'contact');

  const pageContent = {};
  if (contents) contents.forEach(c => { pageContent[c.section] = c.content; });
  res.render('contact', { settings, contactInfo: [], pageContent });
});

module.exports = router;
