'use strict';



/**
 * PRELOAD
 * 
 * loading will be end after document is loaded
 */

const preloader = document.querySelector("[data-preaload]");

window.addEventListener("load", function () {
  preloader.classList.add("loaded");
  document.body.classList.add("loaded");
});



/**
 * add event listener on multiple elements
 */

const addEventOnElements = function (elements, eventType, callback) {
  for (let i = 0, len = elements.length; i < len; i++) {
    elements[i].addEventListener(eventType, callback);
  }
}



/**
 * NAVBAR
 */

const navbar = document.querySelector("[data-navbar]");
const navTogglers = document.querySelectorAll("[data-nav-toggler]");
const overlay = document.querySelector("[data-overlay]");

const toggleNavbar = function () {
  navbar.classList.toggle("active");
  overlay.classList.toggle("active");
  document.body.classList.toggle("nav-active");
}

addEventOnElements(navTogglers, "click", toggleNavbar);



/**
 * HEADER & BACK TOP BTN
 */

const header = document.querySelector("[data-header]");
const backTopBtn = document.querySelector("[data-back-top-btn]");

let lastScrollPos = 0;

const hideHeader = function () {
  const isScrollBottom = lastScrollPos < window.scrollY;
  if (isScrollBottom) {
    header.classList.add("hide");
  } else {
    header.classList.remove("hide");
  }

  lastScrollPos = window.scrollY;
}

window.addEventListener("scroll", function () {
  if (window.scrollY >= 50) {
    header.classList.add("active");
    backTopBtn.classList.add("active");
    hideHeader();
  } else {
    header.classList.remove("active");
    backTopBtn.classList.remove("active");
  }
});



/**
 * HERO SLIDER
 */

const heroSlider = document.querySelector("[data-hero-slider]");
const heroSliderItems = document.querySelectorAll("[data-hero-slider-item]");
const heroSliderPrevBtn = document.querySelector("[data-prev-btn]");
const heroSliderNextBtn = document.querySelector("[data-next-btn]");

let currentSlidePos = 0;
let lastActiveSliderItem = heroSliderItems[0];

const updateSliderPos = function () {
  lastActiveSliderItem.classList.remove("active");
  heroSliderItems[currentSlidePos].classList.add("active");
  lastActiveSliderItem = heroSliderItems[currentSlidePos];
}

const slideNext = function () {
  if (currentSlidePos >= heroSliderItems.length - 1) {
    currentSlidePos = 0;
  } else {
    currentSlidePos++;
  }

  updateSliderPos();
}

heroSliderNextBtn.addEventListener("click", slideNext);

const slidePrev = function () {
  if (currentSlidePos <= 0) {
    currentSlidePos = heroSliderItems.length - 1;
  } else {
    currentSlidePos--;
  }

  updateSliderPos();
}

heroSliderPrevBtn.addEventListener("click", slidePrev);


/**
 * auto slide
 */

let menuAutoInterval = null;

function initMenuSlider() {

  const menuItems = document.querySelectorAll("[data-menu-slider-item]");
  const prevBtn = document.querySelector("[data-menu-prev]");
  const nextBtn = document.querySelector("[data-menu-next]");

  // 📱 MOBILE → List فقط
  if (window.innerWidth <= 575) {
    clearInterval(menuAutoInterval);

    menuItems.forEach(item => {
      item.classList.add("active");
    });

    return;
  }

  // 💻 DESKTOP → Slider
  let current = 0;

  menuItems.forEach((item, index) => {
    item.classList.toggle("active", index === 0);
  });

  function updateSlide() {
    menuItems.forEach(item => item.classList.remove("active"));
    menuItems[current].classList.add("active");
  }

  function nextSlide() {
    current = (current + 1) % menuItems.length;
    updateSlide();
  }

  function prevSlide() {
    current = (current - 1 + menuItems.length) % menuItems.length;
    updateSlide();
  }

  nextBtn.onclick = nextSlide;
  prevBtn.onclick = prevSlide;

  clearInterval(menuAutoInterval);
  menuAutoInterval = setInterval(nextSlide, 7000);

  [nextBtn, prevBtn].forEach(btn => {
    btn.onmouseenter = () => clearInterval(menuAutoInterval);
    btn.onmouseleave = () => {
      menuAutoInterval = setInterval(nextSlide, 500);
    };
  });
}

// تشغيل
window.addEventListener("load", initMenuSlider);
window.addEventListener("resize", initMenuSlider);



/**
 * PARALLAX EFFECT
 */

const parallaxItems = document.querySelectorAll("[data-parallax-item]");

let x, y;

window.addEventListener("mousemove", function (event) {

  x = (event.clientX / window.innerWidth * 10) - 5;
  y = (event.clientY / window.innerHeight * 10) - 5;

  // reverse the number eg. 20 -> -20, -5 -> 5
  x = x - (x * 2);
  y = y - (y * 2);

  for (let i = 0, len = parallaxItems.length; i < len; i++) {
    x = x * Number(parallaxItems[i].dataset.parallaxSpeed);
    y = y * Number(parallaxItems[i].dataset.parallaxSpeed);
    parallaxItems[i].style.transform = `translate3d(${x}px, ${y}px, 0px)`;
  }

});


const API_URL = "https://script.google.com/macros/s/AKfycbxc1TnYccosHhvQP7NYYNGK9BLY9PlPg00W1xDMqox6vOc9oAJq-YfWd-jyRDCczWrwcg/exec";

const stars = document.querySelectorAll("#stars span");
let selectedRating = 0;

// ⭐ Check local storage on page load
const storedRate = localStorage.getItem("rate");
if (storedRate !== null) {
  const value = Number(storedRate);
  for (let i = 0; i < value; i++) {
    stars[i].classList.add("active");
  }
  document.getElementById("rating-result").textContent = "You have already rated ⭐";
}

stars.forEach(star => {
  star.addEventListener("click", () => {

    // ⭐ User already rated
    if (localStorage.getItem("rate") !== null) {
      document.getElementById("rating-result").textContent = "You have already rated ⭐";
      return;
    }

    // ⭐ Save new rating
    selectedRating = star.getAttribute("data-value");
    localStorage.setItem("rate", selectedRating);

    stars.forEach(s => s.classList.remove("active"));
    for (let i = 0; i < selectedRating; i++) {
      stars[i].classList.add("active");
    }

    sendRating(selectedRating);
  });
});

// ⭐ Send rating
function sendRating(stars) {
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ stars })
  })
  .then(() => {
    document.getElementById("rating-result").textContent = "Thank you for your rating! ⭐";
    loadAverageRating();
  })
  .catch(() => alert("Error sending rating!"));
}

// ⭐ Load average rating
function loadAverageRating() {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      const arr = data.map(r => Number(r.stars));
      if (arr.length === 0) {
        document.getElementById("average-rating").textContent = "--";
        return;
      }
      const avg = (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
      document.getElementById("average-rating").textContent = `${avg} ⭐ out of 5`;
    });
}

loadAverageRating();