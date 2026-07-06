const express = require('express');
const router = express.Router();

// İletişim formu gönderimi
router.post('/inquiry', (req, res) => {
  const db = req.app.locals.db;
  const { name, email, phone, subject, message, product_id } = req.body;
  
  if (!name || !message) {
    return res.status(400).json({ success: false, error: 'İsim ve mesaj alanları zorunludur.' });
  }

  try {
    db.prepare(`
      INSERT INTO inquiries (name, email, phone, subject, message, product_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, email || null, phone || null, subject || null, message, product_id || null);
    
    res.json({ success: true, message: 'Talebiniz başarıyla alındı. En kısa sürede size dönüş yapacağız.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
  }
});

// Bilgi talebi (ürün sayfasından)
router.post('/info-request', (req, res) => {
  const db = req.app.locals.db;
  const { name, phone, message, product_id } = req.body;
  
  if (!name || !phone) {
    return res.status(400).json({ success: false, error: 'İsim ve telefon alanları zorunludur.' });
  }

  try {
    const product = product_id ? db.prepare('SELECT name FROM products WHERE id = ?').get(product_id) : null;
    const subject = product ? `${product.name} hakkında bilgi talebi` : 'Genel bilgi talebi';
    
    db.prepare(`
      INSERT INTO inquiries (name, phone, subject, message, product_id) 
      VALUES (?, ?, ?, ?, ?)
    `).run(name, phone, subject, message || 'Ürün hakkında bilgi talep ediyorum.', product_id || null);
    
    res.json({ success: true, message: 'Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Bir hata oluştu.' });
  }
});

module.exports = router;
