(() => {
  "use strict";

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const body = document.body;
  const header = $("#siteHeader");
  const progress = $("#scrollProgress");
  const backToTop = $("#backToTop");

  // Theme
  const savedTheme = localStorage.getItem("solarx-theme");
  if (savedTheme === "dark") body.classList.add("dark");
  $("#themeToggle")?.addEventListener("click", () => {
    body.classList.toggle("dark");
    localStorage.setItem("solarx-theme", body.classList.contains("dark") ? "dark" : "light");
  });

  // Mobile navigation
  const menuBtn = $("#menuToggle");
  const mobileMenu = $("#mobileMenu");
  menuBtn?.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  $$("#mobileMenu a").forEach(a => a.addEventListener("click", () => {
    mobileMenu.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  }));

  // Scroll state + progress
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 24);
    backToTop.classList.toggle("show", y > 700);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${max ? (y / max) * 100 : 0}%`;
  };
  addEventListener("scroll", onScroll, {passive:true});
  onScroll();
  backToTop?.addEventListener("click", () => scrollTo({top:0, behavior:"smooth"}));

  // Reveal animations
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  }, {threshold:.12});
  $$(".reveal").forEach(el => revealObserver.observe(el));

  // Counters
  const animateCounter = (el) => {
    const target = Number(el.dataset.counter || 0);
    const duration = 1200;
    const start = performance.now();
    const tick = now => {
      const p = Math.min((now-start)/duration, 1);
      const eased = 1 - Math.pow(1-p, 3);
      el.textContent = Math.round(target * eased).toLocaleString("en-IN");
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){ animateCounter(e.target); counterObserver.unobserve(e.target); }
    });
  }, {threshold:.5});
  $$("[data-counter]").forEach(el => counterObserver.observe(el));

  // Savings calculator
  const monthlyBill = $("#monthlyBill");
  const propertyType = $("#propertyType");
  const systemSize = $("#systemSize");
  const billDisplay = $("#billDisplay");
  const sizeDisplay = $("#sizeDisplay");
  const fmt = n => Math.round(n).toLocaleString("en-IN");

  function updateCalculator(){
    const bill = Number(monthlyBill.value);
    const preferred = Number(systemSize.value);
    const type = propertyType.value;
    billDisplay.textContent = `₹${fmt(bill)}`;
    sizeDisplay.textContent = `${preferred.toFixed(1)} kW`;

    // Planning assumptions only — deliberately conservative and clearly disclosed in UI.
    const tariff = type === "commercial" ? 10.5 : 8.0;
    const monthlyUnits = bill / tariff;
    const idealKw = Math.max(1, monthlyUnits / 120);
    const effectiveKw = Math.min(preferred, idealKw * 1.15);
    const monthlyGeneration = effectiveKw * 120;
    const offset = Math.min(monthlyUnits, monthlyGeneration);
    const monthlySaving = offset * tariff * 0.92;
    const annual = monthlySaving * 12;
    const lifetime = annual * 25;
    const co2 = (monthlyGeneration * 12 * 0.0007);

    $("#estimatedSize").textContent = idealKw.toFixed(1);
    $("#monthlySavings").textContent = fmt(monthlySaving);
    $("#yearlySavings").textContent = fmt(annual);
    $("#lifetimeSavings").textContent = fmt(lifetime);
    $("#co2Reduction").textContent = co2.toFixed(1);
  }
  [monthlyBill, propertyType, systemSize].forEach(el => el?.addEventListener("input", updateCalculator));
  updateCalculator();

  // Gallery filter
  const filterButtons = $$(".filter-btn");
  const galleryItems = $$(".gallery-item");
  filterButtons.forEach(btn => btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const filter = btn.dataset.filter;
    galleryItems.forEach(item => {
      const show = filter === "all" || item.dataset.category === filter;
      item.classList.toggle("hidden", !show);
    });
  }));

  // Lightbox
  const lightbox = $("#lightbox");
  const lightboxImage = $("#lightboxImage");
  const lightboxCaption = $("#lightboxCaption");
  let visibleGallery = galleryItems;
  let currentLightbox = 0;
  const refreshVisible = () => visibleGallery = galleryItems.filter(x => !x.classList.contains("hidden"));
  function openLightbox(item){
    refreshVisible();
    currentLightbox = visibleGallery.indexOf(item);
    showLightboxImage();
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden","false");
    body.style.overflow = "hidden";
  }
  function showLightboxImage(){
    const item = visibleGallery[currentLightbox];
    if(!item) return;
    const img = $("img", item);
    lightboxImage.src = img.src;
    lightboxImage.alt = img.alt;
    lightboxCaption.textContent = $("figcaption strong", item)?.textContent || "";
  }
  function closeLightbox(){
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden","true");
    body.style.overflow = "";
  }
  galleryItems.forEach(item => item.addEventListener("click",()=>openLightbox(item)));
  $("#lightboxClose")?.addEventListener("click",closeLightbox);
  $("#lightboxPrev")?.addEventListener("click",()=>{currentLightbox=(currentLightbox-1+visibleGallery.length)%visibleGallery.length;showLightboxImage();});
  $("#lightboxNext")?.addEventListener("click",()=>{currentLightbox=(currentLightbox+1)%visibleGallery.length;showLightboxImage();});
  lightbox?.addEventListener("click",e=>{if(e.target===lightbox)closeLightbox();});
  addEventListener("keydown",e=>{
    if(!lightbox.classList.contains("open")) return;
    if(e.key==="Escape") closeLightbox();
    if(e.key==="ArrowRight"){currentLightbox=(currentLightbox+1)%visibleGallery.length;showLightboxImage();}
    if(e.key==="ArrowLeft"){currentLightbox=(currentLightbox-1+visibleGallery.length)%visibleGallery.length;showLightboxImage();}
  });

  // Before / After
  const compareRange = $("#compareRange");
  const beforeLayer = $("#beforeLayer");
  const compareHandle = $("#compareHandle");
  compareRange?.addEventListener("input", e => {
    const v = e.target.value;
    beforeLayer.style.width = `${v}%`;
    compareHandle.style.left = `${v}%`;
  });

  // Testimonials
  const track = $("#testimonialTrack");
  const testimonials = $$(".testimonial-card");
  const dotsWrap = $("#sliderDots");
  let slide = 0, autoSlide;
  testimonials.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.setAttribute("aria-label", `Go to testimonial ${i+1}`);
    dot.addEventListener("click", () => goToSlide(i));
    dotsWrap.appendChild(dot);
  });
  const dots = $$("#sliderDots button");
  function goToSlide(i){
    slide = (i + testimonials.length) % testimonials.length;
    track.style.transform = `translateX(-${slide*100}%)`;
    dots.forEach((d,j)=>d.classList.toggle("active",j===slide));
  }
  function startSlider(){
    clearInterval(autoSlide);
    autoSlide = setInterval(()=>goToSlide(slide+1), 5500);
  }
  $("#prevTestimonial")?.addEventListener("click",()=>{goToSlide(slide-1);startSlider();});
  $("#nextTestimonial")?.addEventListener("click",()=>{goToSlide(slide+1);startSlider();});
  goToSlide(0); startSlider();

  // FAQ: one open at a time
  $$(".faq-list details").forEach(detail => {
    detail.addEventListener("toggle", () => {
      if(detail.open){
        $$(".faq-list details").forEach(other => { if(other!==detail) other.open=false; });
      }
    });
  });

  // Scroll spy
  const sections = $$("main section[id]");
  const navLinks = $$(".desktop-nav a");
  const spyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        navLinks.forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="#"+entry.target.id));
      }
    });
  }, {rootMargin:"-35% 0px -55% 0px"});
  sections.forEach(section=>spyObserver.observe(section));

  // Process progress
  const process = $(".process-line");
  const processProgress = $("#processProgress");
  if(process){
    const processObserver = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          if(innerWidth > 820) processProgress.style.width = "86%";
          else processProgress.style.height = "100%";
          processObserver.disconnect();
        }
      });
    },{threshold:.3});
    processObserver.observe(process);
  }

  // Spotlight hover
  $$(".spotlight-card").forEach(card=>{
    card.addEventListener("pointermove",e=>{
      const r=card.getBoundingClientRect();
      card.style.setProperty("--mx",`${e.clientX-r.left}px`);
      card.style.setProperty("--my",`${e.clientY-r.top}px`);
    });
  });

  // Lightweight mouse parallax
  const parallax = $("[data-parallax]");
  addEventListener("pointermove", e => {
    if(!parallax || innerWidth < 900) return;
    const x = (e.clientX / innerWidth - .5) * 8;
    const y = (e.clientY / innerHeight - .5) * 8;
    parallax.style.transform = `translate3d(${x}px,${y}px,0)`;
  }, {passive:true});

  // Magnetic buttons
  $$(".magnetic").forEach(btn=>{
    btn.addEventListener("pointermove",e=>{
      if(innerWidth<900) return;
      const r=btn.getBoundingClientRect();
      const x=(e.clientX-r.left-r.width/2)*.12;
      const y=(e.clientY-r.top-r.height/2)*.12;
      btn.style.transform=`translate(${x}px,${y}px)`;
    });
    btn.addEventListener("pointerleave",()=>btn.style.transform="");
  });

  // Button ripple
  $$(".ripple").forEach(btn=>btn.addEventListener("click",e=>{
    const r=btn.getBoundingClientRect();
    btn.style.setProperty("--rx",`${e.clientX-r.left}px`);
    btn.style.setProperty("--ry",`${e.clientY-r.top}px`);
    btn.classList.remove("rippling");
    void btn.offsetWidth;
    btn.classList.add("rippling");
  }));

  // Contact validation + WhatsApp handoff
  const form = $("#contactForm");
  const formStatus = $("#formStatus");
  form?.addEventListener("submit", e => {
    e.preventDefault();
    if(!form.checkValidity()){
      form.reportValidity();
      formStatus.textContent = "Please complete the required fields.";
      return;
    }
    const data = new FormData(form);
    const msg = `Hi Solar X, I want a free solar quote.%0A%0AName: ${encodeURIComponent(data.get("name"))}%0APhone: ${encodeURIComponent(data.get("phone"))}%0ALocation: ${encodeURIComponent(data.get("location"))}%0AService: ${encodeURIComponent(data.get("service"))}%0AMonthly bill: ${encodeURIComponent(data.get("bill") || "Not provided")}%0AMessage: ${encodeURIComponent(data.get("message") || "—")}`;
    formStatus.textContent = "Thanks — opening WhatsApp so you can send your enquiry.";
    window.open(`https://wa.me/917276860846?text=${msg}`, "_blank", "noopener");
  });

  // Footer year
  $("#year").textContent = new Date().getFullYear();
})();
