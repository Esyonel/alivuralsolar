require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { supabase, getSettings, seedDefaults } = require('./database/supabase');

const app = express();
const PORT = process.env.PORT || 3000;

// Make supabase available to routes
app.locals.supabase = supabase;
app.locals.getSettings = getSettings;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'alivuralsolar_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Flash messages helper
app.use((req, res, next) => {
  res.locals.success = req.session.success;
  res.locals.error = req.session.error;
  delete req.session.success;
  delete req.session.error;
  next();
});

// Visitor tracking
const { visitorMiddleware } = require('./middleware/visitor');
app.use(visitorMiddleware);

// Visitor stats API (footer counter)
app.get('/api/stats', async (req, res) => {
  try {
    const { count: totalVisitors } = await supabase
      .from('visitors')
      .select('id', { count: 'exact', head: true });

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: onlineVisitors } = await supabase
      .from('visitors')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', fiveMinAgo);

    res.json({ total: totalVisitors || 0, online: onlineVisitors || 0 });
  } catch (err) {
    res.json({ total: 0, online: 0 });
  }
});

// Routes
const pageRoutes = require('./routes/pages');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

app.use('/', pageRoutes);
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use(async (req, res) => {
  const settings = await getSettings();
  res.status(404).render('404', { title: 'Sayfa Bulunamadı', settings });
});

// Error handler
app.use(async (err, req, res, next) => {
  console.error(err.stack);
  const settings = await getSettings();
  res.status(500).render('error', {
    title: 'Sunucu Hatası',
    error: process.env.NODE_ENV === 'development' ? err : {},
    settings
  });
});

// Start server
async function start() {
  await seedDefaults();
  console.log('Supabase veritabanı hazır.');
  app.listen(PORT, () => {
    console.log(`Ali Vural Enerji sunucusu çalışıyor: http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
  });
}

start();
