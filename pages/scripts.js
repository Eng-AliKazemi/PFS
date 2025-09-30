document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Dynamic Canvas Background with Gradient ---
    const canvas = document.getElementById('dynamic-background');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        // THEME COLORS - Matched with CSS variables
        const primaryColor = '#c000ff';   // Vibrant Purple/Magenta
        const secondaryColor = '#6a00ff'; // Indigo/Violet for a more purple theme

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 1;
                this.speedX = Math.random() * 1 - 0.5;
                this.speedY = Math.random() * 1 - 0.5;
                // Randomly assign one of the theme colors to each particle dot
                this.color = Math.random() > 0.5 ? primaryColor : secondaryColor;
            }
            update() {
                if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
                if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
                this.x += this.speedX;
                this.y += this.speedY;
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function initParticles() {
            particles = [];
            // Adjust particle density based on screen size
            let numberOfParticles = (canvas.height * canvas.width) / 13000;
            for (let i = 0; i < numberOfParticles; i++) {
                particles.push(new Particle());
            }
        }
        initParticles();

        function connectParticles() {
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    let distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x)) +
                                 ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
                    
                    // If particles are close enough, draw a line between them
                    if (distance < (canvas.width / 10) * (canvas.height / 10)) {
                        const opacity = 1 - (distance / 20000);
                        
                        // Create a consistent gradient for every line
                        const gradient = ctx.createLinearGradient(particles[a].x, particles[a].y, particles[b].x, particles[b].y);
                        gradient.addColorStop(0, primaryColor);
                        gradient.addColorStop(1, secondaryColor);
                        
                        ctx.globalAlpha = opacity;
                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
            ctx.globalAlpha = 1; // Reset global alpha
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
            }
            connectParticles();
            requestAnimationFrame(animate);
        }
        animate();
    }

    // --- 2. 3D Cover Flow Slider Logic ---
    const slider = document.querySelector('.slider');
    if(slider){
        const list = document.querySelector('.slider .list');
        const items = document.querySelectorAll('.slider .list .item');
        const nextBtn = document.getElementById('next');
        const prevBtn = document.getElementById('prev');
        const dots = document.querySelectorAll('.slider .dots li');

        let currentIndex = 0;
        const totalItems = items.length;
        let isAnimating = false;
        let autoPlayInterval;

        const updateDots = (newIndex) => {
            dots[currentIndex].classList.remove('active');
            dots[newIndex].classList.add('active');
            currentIndex = newIndex;
        };

        const showNext = () => {
            if (isAnimating) return;
            isAnimating = true;

            slider.classList.add('active');
            
            setTimeout(() => {
                list.appendChild(list.firstElementChild);
                slider.classList.remove('active');
                
                const nextIndex = (currentIndex + 1) % totalItems;
                updateDots(nextIndex);
                isAnimating = false;
            }, 500); // This duration must match the CSS transition duration
        };

        const showPrev = () => {
            if (isAnimating) return;
            isAnimating = true;

            // Prepend the last item to the beginning of the list for 'previous' action
            list.prepend(list.lastElementChild);
            
            const prevIndex = (currentIndex - 1 + totalItems) % totalItems;
            updateDots(prevIndex);

            setTimeout(() => {
                isAnimating = false;
            }, 50);
        };
        
        const startAutoPlay = () => {
            clearInterval(autoPlayInterval);
            autoPlayInterval = setInterval(showNext, 5000); // Change image every 5 seconds
        };

        nextBtn.onclick = () => {
            showNext();
            startAutoPlay(); // Reset autoplay timer on manual navigation
        };

        prevBtn.onclick = () => {
            showPrev();
            startAutoPlay(); // Reset autoplay timer on manual navigation
        };

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                if (isAnimating || index === currentIndex) return;
                
                let diff = index - currentIndex;
                if (diff > 0) {
                    for (let i = 0; i < diff; i++) {
                        setTimeout(showNext, i * 100); 
                    }
                } else {
                    for (let i = 0; i < -diff; i++) {
                        setTimeout(showPrev, i * 100);
                    }
                }
                startAutoPlay();
            });
        });

        startAutoPlay(); // Start the slideshow automatically

        // --- 2a. Image Modal Logic ---
        const modal = document.getElementById("imageModal");
        const modalImg = document.getElementById("modalImage");
        const closeModalBtn = document.querySelector(".close-modal");

        list.addEventListener('click', (event) => {
            const clickedItem = event.target.closest('.item');
            // The active (front) item is always the first child in the DOM
            if (clickedItem && clickedItem === list.firstElementChild) {
                modal.style.display = "block";
                modalImg.src = clickedItem.querySelector('img').src;
                clearInterval(autoPlayInterval); // Pause slideshow when modal is open
            }
        });
        
        const closeModalHandler = () => {
            modal.style.display = "none";
            startAutoPlay(); // Resume slideshow when modal is closed
        }

        closeModalBtn.onclick = closeModalHandler;
        // Also close modal if user clicks on the background overlay
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModalHandler();
            }
        }
    }

    // --- 3. Fade-in elements on scroll ---
    const fadeInElements = document.querySelectorAll('.fade-in');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% of the element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Stop observing once it's visible
            }
        });
    }, observerOptions);

    fadeInElements.forEach(el => {
        observer.observe(el);
    });
});