/* ========================================
   Ali Vural Solar - İletişim Sayfası JS
   ======================================== */

// Contact form is handled in main.js
// This file is for any contact-specific functionality

document.addEventListener('DOMContentLoaded', function() {
  // Phone number formatting
  const phoneInputs = document.querySelectorAll('input[type="tel"]');
  phoneInputs.forEach(input => {
    input.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 0) {
        if (value.startsWith('0')) {
          value = value.substring(1);
        }
        if (value.length > 10) {
          value = value.substring(0, 10);
        }
      }
    });
  });
});
