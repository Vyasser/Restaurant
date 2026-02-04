let menuAutoInterval = null;

function initMenuSlider() {

  const menuItems = document.querySelectorAll("[data-menu-slider-item]");

  if (!menuItems.length) return;

  // 💻 DESKTOP → Slider تلقائي فقط
  let current = 0;

  function updateSlide() {
    menuItems.forEach(item => item.classList.remove("active"));
    menuItems[current].classList.add("active");
  }

  function nextSlide() {
    current = (current + 1) % menuItems.length;
    updateSlide();
  }

  // الحالة الابتدائية
  updateSlide();

  // تنظيف أي interval سابق
  clearInterval(menuAutoInterval);

  // ⏱️ تمرير تلقائي
  menuAutoInterval = setInterval(nextSlide, 7000);
}

// تشغيل
window.addEventListener("load", initMenuSlider);
window.addEventListener("resize", initMenuSlider);
