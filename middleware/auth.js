function authMiddleware(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.session.error = 'Bu sayfaya erişim için giriş yapmalısınız.';
  res.redirect('/admin/login');
}

module.exports = authMiddleware;
