const express = require('express');
const router = express.Router();

// İletişim formu gönderimi
router.post('/inquiry', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { name, email, phone, subject, message, product_id } = req.body;

  if (!name || !message) {
    return res.status(400).json({ success: false, error: 'İsim ve mesaj alanları zorunludur.' });
  }

  try {
    const { error } = await supabase.from('inquiries').insert([{
      name,
      email: email || null,
      phone: phone || null,
      subject: subject || null,
      message,
      product_id: product_id || null
    }]);

    if (error) throw error;
    res.json({ success: true, message: 'Talebiniz başarıyla alındı. En kısa sürede size dönüş yapacağız.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
  }
});

// Bilgi talebi
router.post('/info-request', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { name, phone, message, product_id } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, error: 'İsim ve telefon alanları zorunludur.' });
  }

  try {
    let subject = 'Genel bilgi talebi';
    if (product_id) {
      const { data: product } = await supabase.from('products').select('name').eq('id', product_id).single();
      if (product) subject = `${product.name} hakkında bilgi talebi`;
    }

    const { error } = await supabase.from('inquiries').insert([{
      name,
      phone,
      subject,
      message: message || 'Ürün hakkında bilgi talep ediyorum.',
      product_id: product_id || null
    }]);

    if (error) throw error;
    res.json({ success: true, message: 'Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Bir hata oluştu.' });
  }
});

module.exports = router;
