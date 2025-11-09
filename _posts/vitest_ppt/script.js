document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".slide");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const currentSlideEl = document.getElementById("current-slide");
  const totalSlidesEl = document.getElementById("total-slides");

  let currentSlide = 0;
  const totalSlides = slides.length;

  // ✅ 총 슬라이드 개수 표시
  totalSlidesEl.textContent = totalSlides;

  function updateSlides() {
    slides.forEach((slide, index) => {
      slide.classList.toggle("active", index === currentSlide);
    });

    // ✅ 현재 슬라이드 번호 갱신
    currentSlideEl.textContent = currentSlide + 1;

    // 버튼 상태
    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === totalSlides - 1;
  }

  prevBtn.addEventListener("click", () => {
    if (currentSlide > 0) {
      currentSlide--;
      updateSlides();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentSlide < totalSlides - 1) {
      currentSlide++;
      updateSlides();
    }
  });

  // 키보드 ← → 이동 지원
  document.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") nextBtn.click();
    if (e.key === "ArrowLeft") prevBtn.click();
  });

  // 초기화
  updateSlides();
});
