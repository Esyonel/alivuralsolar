/* ========================================
   Ali Vural Solar - Admin Panel JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
  // === Sidebar Toggle ===
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('adminSidebar');
  
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('active');
    });

    // Close sidebar on outside click (mobile)
    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 1024 && 
          sidebar.classList.contains('active') && 
          !sidebar.contains(e.target) && 
          e.target !== sidebarToggle) {
        sidebar.classList.remove('active');
      }
    });
  }

  // === Auto-dismiss alerts ===
  document.querySelectorAll('.alert').forEach(alert => {
    setTimeout(() => {
      alert.style.opacity = '0';
      alert.style.transition = 'opacity 0.3s ease';
      setTimeout(() => alert.remove(), 300);
    }, 5000);
  });

  // === Close modals on Escape ===
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
      });
    }
  });

  // === Close modal on outside click ===
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.style.display = 'none';
      }
    });
  });
});
