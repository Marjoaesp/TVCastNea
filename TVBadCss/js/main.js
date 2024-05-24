const slideContainer = document.querySelector('.slider-container');
let slideImageVideo = null;
let numberOfImages = 0;
let slideWidth = 0;
let currentSlide = 0;
let autoplay = null;

window.onload = function() {
  init();
}

function init() {
  fetch('tvapp.json')
    .then(response => response.json())
    .then(data => {
      numberOfImages = data.length;

      data.forEach(slide => {
        const slideElement = document.createElement('div');
        slideElement.classList.add('imagevideo'); // Ensure class name matches

        if (slide.isVideo) {
          slideElement.innerHTML = `<video onended="continueCarousel()" muted src="${slide.url}"></video>`;
        } else {
          slideElement.innerHTML = `<img src="${slide.url}" alt="${slide.title}">`;
        }
        
        slideContainer.appendChild(slideElement);
      });

      slideWidth = slideContainer.querySelector('.imagevideo').offsetWidth; 
      slideContainer.querySelector('.imagevideo:first-child').classList.add('active');
      slideImageVideo = document.querySelectorAll('.imagevideo');
      // slideImageVideo.forEach(function(element, i) {
  	  //   element.style.left = i * 100 + '%';
  	  // });
      autoplay = setInterval(iniciarCiclo, 3000);
    })
    .catch(error => {
      console.error("Error fetching JSON data:", error); // Handle errors
    });
}

function iniciarCiclo() {
  let nextSlide = currentSlide + 1;
  if (currentSlide === numberOfImages - 1) {
    nextSlide = 0;
  }
  goToSlide(nextSlide);
}

function continueCarousel(){
	autoplay = setInterval(iniciarCiclo, 3000);
}

function autoplayStop() {
  clearInterval(autoplay);
  autoplay = null; // Reset autoplay for clarity
}


function goToSlide(slideNumber) {
	  // slideContainer.style.transform = 
	  //   'translateX(-' + 100 * slideNumber + '%)';
	  currentSlide = slideNumber;
	  setActiveClass();
}

function setActiveClass() {
  let currentActive = document.querySelector('.imagevideo.active');
  if (currentActive) {
    currentActive.classList.remove('active');
  }
  slideContainer.querySelectorAll('.imagevideo')[currentSlide].classList.add('active');
  verifyVideo();
}

function verifyVideo() {
  let elementIsVideo = document.querySelector('.imagevideo.active > video');
  if (elementIsVideo) {
    autoplayStop();
    elementIsVideo.currentTime = 0;
    elementIsVideo.play();
  }
}