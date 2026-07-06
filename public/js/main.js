/* ========================================
   Ali Vural Solar - Ana JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
  // === Hamburger Menu ===
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('mainNav');
  
  if (hamburger && nav) {
    hamburger.addEventListener('click', function() {
      this.classList.toggle('active');
      nav.classList.toggle('active');
    });

    // Close menu on link click
    nav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        nav.classList.remove('active');
      });
    });
  }

  // === Header Scroll Effect ===
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // === Scroll Animations ===
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });

  // === Active Nav Link ===
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });

  // === Info Request Modal ===
  const infoModal = document.getElementById('infoModal');
  const modalClose = document.getElementById('modalClose');
  const infoRequestForm = document.getElementById('infoRequestForm');

  // Open modal
  document.querySelectorAll('.info-request-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const productId = this.dataset.productId;
      const productName = this.dataset.productName;
      
      document.getElementById('modalProductId').value = productId || '';
      document.getElementById('modalProductName').value = productName || '';
      document.getElementById('modalName').value = '';
      document.getElementById('modalPhone').value = '';
      document.getElementById('modalMessage').value = '';
      document.getElementById('modalSuccess').style.display = 'none';
      document.getElementById('modalError').style.display = 'none';
      infoRequestForm.style.display = 'block';
      
      infoModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  });

  // Close modal
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (infoModal) {
    infoModal.addEventListener('click', function(e) {
      if (e.target === this) closeModal();
    });
  }

  function closeModal() {
    infoModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  // Submit info request
  if (infoRequestForm) {
    infoRequestForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const data = Object.fromEntries(formData);
      
      try {
        const response = await fetch('/api/info-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
          infoRequestForm.style.display = 'none';
          document.getElementById('modalSuccess').textContent = result.message;
          document.getElementById('modalSuccess').style.display = 'block';
          setTimeout(closeModal, 3000);
        } else {
          document.getElementById('modalError').textContent = result.error;
          document.getElementById('modalError').style.display = 'block';
        }
      } catch (err) {
        document.getElementById('modalError').textContent = 'Bir hata oluştu. Lütfen tekrar deneyin.';
        document.getElementById('modalError').style.display = 'block';
      }
    });
  }

  // === Contact Form ===
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const data = Object.fromEntries(formData);
      
      try {
        const response = await fetch('/api/inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
          document.getElementById('contactSuccess').textContent = result.message;
          document.getElementById('contactSuccess').style.display = 'block';
          document.getElementById('contactError').style.display = 'none';
          contactForm.reset();
        } else {
          document.getElementById('contactError').textContent = result.error;
          document.getElementById('contactError').style.display = 'block';
          document.getElementById('contactSuccess').style.display = 'none';
        }
      } catch (err) {
        document.getElementById('contactError').textContent = 'Bir hata oluştu. Lütfen tekrar deneyin.';
        document.getElementById('contactError').style.display = 'block';
      }
    });
  }

  // === Gallery Lightbox ===
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxClose = document.getElementById('lightboxClose');

  document.querySelectorAll('.gallery-item[data-src]').forEach(item => {
    item.addEventListener('click', function() {
      const src = this.dataset.src;
      if (lightbox && lightboxImage) {
        lightboxImage.src = src;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }

  if (lightbox) {
    lightbox.addEventListener('click', function(e) {
      if (e.target === this) closeLightbox();
    });
  }

  function closeLightbox() {
    if (lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // Close lightbox on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeModal();
      closeLightbox();
    }
  });

  // Visitor Counter
  fetch('/api/stats')
    .then(r => r.json())
    .then(data => {
      const totalEl = document.getElementById('totalVisitors');
      const onlineEl = document.getElementById('onlineVisitors');
      if (totalEl) totalEl.innerHTML = '<i class="fas fa-users"></i> Toplam: ' + (data.total || 0);
      if (onlineEl) onlineEl.innerHTML = '<i class="fas fa-circle" style="color:#4CAF50; font-size:0.6rem;"></i> Çevrimiçi: ' + (data.online || 0);
    })
    .catch(() => {});
});
