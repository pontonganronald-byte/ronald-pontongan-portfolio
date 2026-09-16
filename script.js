/**
 * ============================================================================
 * COSMIC GALAXY CANVAS & PARTICLE ENGINE (60 FPS)
 * Multi-Tier Starfield, Galactic Nebula, Diffraction Flares & Shooting Stars
 * Ronald Pontongan Portfolio
 * ============================================================================
 */

(function () {
	'use strict';

	/* ------------------------------------------------------------------------
	   CANVAS INITIALIZATION & CONFIGURATION
	   ------------------------------------------------------------------------ */
	const canvas = document.getElementById('galaxy-canvas');
	if (!canvas) return;

	const ctx = canvas.getContext('2d', { alpha: true });

	// Cosmic Palette
	const COSMIC_COLORS = ['#00f2fe', '#4facfe', '#ffffff', '#9b51e0', '#e056fd', '#ffeaa7'];
	const STAR_COLORS = [
		'#ffffff',
		'#d0eaff',
		'#00f2fe',
		'#e0c3fc',
		'#ffe6a7',
		'#ffcbf2'
	];

	// Performance thresholds
	const MAX_DYNAMIC_PARTICLES = 120;
	const BASE_STAR_COUNT = 180; // Dense, majestic galactic starfield without excessive CPU load

	let width = 0;
	let height = 0;
	let dpr = 1;

	// Canvas Entities
	let stars = [];
	let nebulae = [];
	let shootingStars = [];
	const particles = [];

	let lastShootingStarTime = performance.now();
	let nextShootingStarDelay = 2500;

	// Mouse Tracking & Velocity State
	let mouseX = -1000;
	let mouseY = -1000;
	let lastMouseX = -1000;
	let lastMouseY = -1000;
	let lastMouseTime = performance.now();
	let mouseVelocityX = 0;
	let mouseVelocityY = 0;
	let isMouseActive = false;
	let mouseTimeout = null;

	/* ------------------------------------------------------------------------
	   RESIZING & CANVAS SYNC
	   ------------------------------------------------------------------------ */
	function handleResize() {
		width = window.innerWidth;
		height = window.innerHeight;
		dpr = Math.min(window.devicePixelRatio || 1, 2);

		canvas.width = Math.floor(width * dpr);
		canvas.height = Math.floor(height * dpr);
		canvas.style.width = width + 'px';
		canvas.style.height = height + 'px';

		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.scale(dpr, dpr);

		initNebulae();
		initStars();
	}

	window.addEventListener('resize', handleResize, { passive: true });

	/* ------------------------------------------------------------------------
	   NEBULA CLOUD SIMULATION (Organic Glowing Cosmic Clouds)
	   ------------------------------------------------------------------------ */
	class NebulaCloud {
		constructor(relX, relY, radius, colorStops) {
			this.relX = relX;
			this.relY = relY;
			this.radius = radius;
			this.colorStops = colorStops;
			this.angle = Math.random() * Math.PI * 2;
			this.pulseSpeed = 0.0008 + Math.random() * 0.0006;
			this.driftSpeed = 0.0004 + Math.random() * 0.0004;
		}

		update(time) {
			this.angle += this.driftSpeed;
		}

		draw(context, time) {
			const x = this.relX * width + Math.cos(this.angle) * 35;
			const y = this.relY * height + Math.sin(this.angle) * 25;
			const pulse = 1 + Math.sin(time * this.pulseSpeed) * 0.12;
			const currentRadius = this.radius * Math.max(width, height) * 0.001 * pulse;

			const grad = context.createRadialGradient(x, y, 0, x, y, currentRadius);
			this.colorStops.forEach(stop => {
				grad.addColorStop(stop.offset, stop.color);
			});

			context.save();
			context.globalCompositeOperation = 'screen';
			context.fillStyle = grad;
			context.beginPath();
			context.arc(x, y, currentRadius, 0, Math.PI * 2);
			context.fill();
			context.restore();
		}
	}

	function initNebulae() {
		nebulae = [
			new NebulaCloud(0.25, 0.35, 450, [
				{ offset: 0.0, color: 'rgba(123, 44, 191, 0.22)' },
				{ offset: 0.5, color: 'rgba(123, 44, 191, 0.08)' },
				{ offset: 1.0, color: 'rgba(123, 44, 191, 0)' }
			]),
			new NebulaCloud(0.78, 0.22, 420, [
				{ offset: 0.0, color: 'rgba(0, 242, 254, 0.18)' },
				{ offset: 0.55, color: 'rgba(79, 172, 254, 0.07)' },
				{ offset: 1.0, color: 'rgba(0, 242, 254, 0)' }
			]),
			new NebulaCloud(0.65, 0.75, 480, [
				{ offset: 0.0, color: 'rgba(224, 86, 253, 0.18)' },
				{ offset: 0.6, color: 'rgba(155, 81, 224, 0.06)' },
				{ offset: 1.0, color: 'rgba(224, 86, 253, 0)' }
			]),
			new NebulaCloud(0.35, 0.85, 400, [
				{ offset: 0.0, color: 'rgba(30, 144, 255, 0.16)' },
				{ offset: 0.55, color: 'rgba(24, 48, 140, 0.06)' },
				{ offset: 1.0, color: 'rgba(30, 144, 255, 0)' }
			])
		];
	}

	/* ------------------------------------------------------------------------
	   MULTI-TIER GALAXY STARFIELD (Milky Way Band & Diffraction Crosses)
	   ------------------------------------------------------------------------ */
	class GalaxyStar {
		constructor(isSpikeHero = false, isGalacticBand = false) {
			this.isSpikeHero = isSpikeHero;
			this.isGalacticBand = isGalacticBand;
			this.reset(true);
		}

		reset(randomizePhase = false) {
			if (this.isGalacticBand) {
				// Dense diagonal galactic spiral arm
				const t = Math.random();
				const centerSpread = (Math.random() - 0.5 + (Math.random() - 0.5)) * (height * 0.45);
				this.x = t * width;
				this.y = (1 - t) * height + centerSpread;
			} else {
				this.x = Math.random() * width;
				this.y = Math.random() * height;
			}

			if (this.isSpikeHero) {
				this.radius = Math.random() * 1.6 + 1.8; // 1.8 - 3.4px
				this.spikeLength = Math.random() * 12 + 10; // 10 - 22px
				this.baseAlpha = Math.random() * 0.4 + 0.6;
				this.color = Math.random() > 0.5 ? '#ffffff' : '#00f2fe';
			} else {
				this.radius = Math.random() * 1.3 + 0.35; // 0.35 - 1.65px
				this.baseAlpha = Math.random() * 0.55 + 0.25;
				this.color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
				this.spikeLength = 0;
			}

			this.alpha = this.baseAlpha;
			this.twinkleSpeed = Math.random() * 0.024 + 0.008;
			this.phase = randomizePhase ? Math.random() * Math.PI * 2 : 0;
			this.vx = (Math.random() - 0.5) * 0.1;
			this.vy = (Math.random() - 0.5) * 0.1;
		}

		update() {
			this.phase += this.twinkleSpeed;
			this.alpha = this.baseAlpha + Math.sin(this.phase) * 0.35;
			if (this.alpha < 0.05) this.alpha = 0.05;
			if (this.alpha > 1) this.alpha = 1;

			this.x += this.vx;
			this.y += this.vy;

			if (this.x < -20) this.x = width + 20;
			else if (this.x > width + 20) this.x = -20;
			if (this.y < -20) this.y = height + 20;
			else if (this.y > height + 20) this.y = -20;
		}

		draw(context) {
			context.save();
			context.globalAlpha = this.alpha;
			context.fillStyle = this.color;

			// Star Core
			context.beginPath();
			context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
			context.fill();

			// 4-Point Diffraction Cross Spikes (✦ Telescope Effect)
			if (this.isSpikeHero) {
				const len = this.spikeLength * (0.8 + Math.sin(this.phase) * 0.25);
				context.strokeStyle = this.color;
				context.lineWidth = 0.8;
				context.shadowBlur = 8;
				context.shadowColor = this.color;

				// Horizontal ray
				context.beginPath();
				context.moveTo(this.x - len, this.y);
				context.lineTo(this.x + len, this.y);
				context.stroke();

				// Vertical ray
				context.beginPath();
				context.moveTo(this.x, this.y - len);
				context.lineTo(this.x, this.y + len);
				context.stroke();
			}

			context.restore();
		}
	}

	function initStars() {
		const totalStars = Math.min(
			260,
			Math.max(140, Math.floor((width * height) / 9000))
		);

		stars = [];
		// 1. Hero stars with 4-point diffraction flares
		for (let i = 0; i < 14; i++) {
			stars.push(new GalaxyStar(true, false));
		}
		// 2. Dense Milky Way galactic plane stars
		const bandCount = Math.floor(totalStars * 0.38);
		for (let i = 0; i < bandCount; i++) {
			stars.push(new GalaxyStar(false, true));
		}
		// 3. Wide celestial field stars
		const fieldCount = totalStars - stars.length;
		for (let i = 0; i < fieldCount; i++) {
			stars.push(new GalaxyStar(false, false));
		}
	}

	/* ------------------------------------------------------------------------
	   SHOOTING STARS / METEORS (Fast Streaking Comets)
	   ------------------------------------------------------------------------ */
	class ShootingStar {
		constructor() {
			this.reset();
		}

		reset() {
			// Spawn in the upper portion or edges
			this.x = Math.random() * (width * 0.8);
			this.y = Math.random() * (height * 0.4);
			this.length = Math.random() * 110 + 90; // 90px - 200px tail
			this.speed = Math.random() * 14 + 14;   // 14 - 28px/frame
			this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.25; // ~45 degrees diagonal
			this.dx = Math.cos(this.angle) * this.speed;
			this.dy = Math.sin(this.angle) * this.speed;
			this.headRadius = Math.random() * 1.5 + 1.6;
			this.alpha = 1.0;
			this.decay = 0.016 + Math.random() * 0.01;
			this.alive = true;
		}

		update() {
			this.x += this.dx;
			this.y += this.dy;
			this.alpha -= this.decay;
			if (this.alpha <= 0 || this.x > width + 200 || this.y > height + 200) {
				this.alive = false;
			}
		}

		draw(context) {
			if (!this.alive || this.alpha <= 0) return;

			context.save();
			context.globalCompositeOperation = 'lighter';

			// Tail Vector
			const tailX = this.x - Math.cos(this.angle) * this.length;
			const tailY = this.y - Math.sin(this.angle) * this.length;

			const grad = context.createLinearGradient(this.x, this.y, tailX, tailY);
			grad.addColorStop(0, `rgba(255, 255, 255, ${this.alpha})`);
			grad.addColorStop(0.3, `rgba(0, 242, 254, ${this.alpha * 0.8})`);
			grad.addColorStop(0.7, `rgba(155, 81, 224, ${this.alpha * 0.4})`);
			grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

			context.strokeStyle = grad;
			context.lineWidth = this.headRadius * 1.2;
			context.beginPath();
			context.moveTo(this.x, this.y);
			context.lineTo(tailX, tailY);
			context.stroke();

			// Glowing Comet Head
			context.fillStyle = '#ffffff';
			context.shadowBlur = 15;
			context.shadowColor = '#00f2fe';
			context.beginPath();
			context.arc(this.x, this.y, this.headRadius, 0, Math.PI * 2);
			context.fill();

			context.restore();
		}
	}

	function handleShootingStars(now) {
		if (now - lastShootingStarTime > nextShootingStarDelay) {
			shootingStars.push(new ShootingStar());
			lastShootingStarTime = now;
			nextShootingStarDelay = Math.random() * 3200 + 2200; // Next meteor in 2.2 - 5.4s
		}

		// Backward loop cleanup
		for (let i = shootingStars.length - 1; i >= 0; i--) {
			const meteor = shootingStars[i];
			meteor.update();
			if (!meteor.alive) {
				shootingStars.splice(i, 1);
			} else {
				meteor.draw(ctx);
			}
		}
	}

	/* ------------------------------------------------------------------------
	   DYNAMIC COSMIC PARTICLES (Mouse Sweep Stardust & Button Bursts)
	   ------------------------------------------------------------------------ */
	class Particle {
		constructor(x, y, vx, vy, size, color, decay, isBurst = false) {
			this.x = x;
			this.y = y;
			this.vx = vx;
			this.vy = vy;
			this.size = size;
			this.initialSize = size;
			this.color = color;
			this.alpha = 1.0;
			this.decay = decay;
			this.isBurst = isBurst;
			this.drag = isBurst ? 0.93 : 0.96;
			this.gravity = isBurst ? 0.03 : 0.01;
		}

		update() {
			this.vx *= this.drag;
			this.vy *= this.drag;
			this.vy += this.gravity;

			this.x += this.vx;
			this.y += this.vy;

			this.alpha -= this.decay;
			this.size = Math.max(0.1, this.initialSize * (this.alpha > 0 ? this.alpha : 0));
		}

		draw(context) {
			if (this.alpha <= 0.02) return;

			context.save();
			context.globalAlpha = Math.max(0, this.alpha);
			context.fillStyle = this.color;
			context.shadowBlur = this.size * 3.5;
			context.shadowColor = this.color;

			context.beginPath();
			context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
			context.fill();

			if (this.isBurst && this.size > 1.8) {
				context.fillStyle = '#ffffff';
				context.beginPath();
				context.arc(this.x, this.y, this.size * 0.45, 0, Math.PI * 2);
				context.fill();
			}

			context.restore();
		}
	}

	function spawnTrailParticle(x, y, vx, vy) {
		if (particles.length >= MAX_DYNAMIC_PARTICLES) return;

		const color = COSMIC_COLORS[Math.floor(Math.random() * COSMIC_COLORS.length)];
		const size = Math.random() * 2.8 + 1.2;
		const decay = Math.random() * 0.025 + 0.018;

		const finalVx = vx * 0.18 + (Math.random() - 0.5) * 1.4;
		const finalVy = vy * 0.18 + (Math.random() - 0.5) * 1.4;

		particles.push(new Particle(x, y, finalVx, finalVy, size, color, decay, false));
	}

	function triggerStarBurst(originX, originY, count = 24) {
		const burstAmount = Math.min(count, MAX_DYNAMIC_PARTICLES - particles.length);
		for (let i = 0; i < burstAmount; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = Math.random() * 5.2 + 2.0;
			const vx = Math.cos(angle) * speed;
			const vy = Math.sin(angle) * speed;
			const color = COSMIC_COLORS[Math.floor(Math.random() * COSMIC_COLORS.length)];
			const size = Math.random() * 3.6 + 1.8;
			const decay = Math.random() * 0.024 + 0.016;

			particles.push(new Particle(originX, originY, vx, vy, size, color, decay, true));
		}
	}

	/* ------------------------------------------------------------------------
	   MOUSE SWEEP & INTERACTION LISTENERS
	   ------------------------------------------------------------------------ */
	window.addEventListener('pointermove', function (e) {
		const now = performance.now();
		const dt = Math.max(1, now - lastMouseTime);

		mouseX = e.clientX;
		mouseY = e.clientY;

		if (!isMouseActive) {
			lastMouseX = mouseX;
			lastMouseY = mouseY;
			isMouseActive = true;
		}

		const dx = mouseX - lastMouseX;
		const dy = mouseY - lastMouseY;
		const dist = Math.hypot(dx, dy);
		if (dist < 2) return;

		mouseVelocityX = (dx / dt) * 16.67;
		mouseVelocityY = (dy / dt) * 16.67;

		const steps = Math.min(4, Math.max(1, Math.floor(dist / 18)));
		for (let s = 0; s < steps; s++) {
			const t = s / steps;
			const interpX = lastMouseX + dx * t + (Math.random() - 0.5) * 4;
			const interpY = lastMouseY + dy * t + (Math.random() - 0.5) * 4;
			spawnTrailParticle(interpX, interpY, mouseVelocityX, mouseVelocityY);
		}

		lastMouseX = mouseX;
		lastMouseY = mouseY;
		lastMouseTime = now;

		clearTimeout(mouseTimeout);
		mouseTimeout = setTimeout(() => {
			isMouseActive = false;
		}, 150);
	}, { passive: true });

	window.addEventListener('pointerleave', function () {
		isMouseActive = false;
	});

	/* ------------------------------------------------------------------------
	   GALAXY BUTTON HOVER EXPLOSIONS
	   ------------------------------------------------------------------------ */
	function setupButtonHoverEffects() {
		const interactiveTargets = document.querySelectorAll(
			'.button, .galaxy-btn, .social-link, .gallery-item, .contact-socials a, .back-top'
		);

		interactiveTargets.forEach(element => {
			let lastBurstTime = 0;

			element.addEventListener('pointerenter', function (e) {
				const rect = element.getBoundingClientRect();
				const burstX = e.clientX || (rect.left + rect.width / 2);
				const burstY = e.clientY || (rect.top + rect.height / 2);
				triggerStarBurst(burstX, burstY, 10);
				lastBurstTime = performance.now();
			});

			element.addEventListener('pointermove', function (e) {
				const now = performance.now();
				if (now - lastBurstTime > 180) {
					triggerStarBurst(e.clientX, e.clientY, 2);
					lastBurstTime = now;
				}
			});

			element.addEventListener('click', function (e) {
				triggerStarBurst(e.clientX, e.clientY, 12);
			});
		});
	}

	/* ------------------------------------------------------------------------
	   HIGH-PERFORMANCE 60 FPS ANIMATION LOOP
	   ------------------------------------------------------------------------ */
	function animate(time) {
		// 1. Clear Viewport
		ctx.clearRect(0, 0, width, height);

		// 2. Render Cosmic Gas Nebulae Clouds
		for (let i = 0; i < nebulae.length; i++) {
			nebulae[i].update(time);
			nebulae[i].draw(ctx, time);
		}

		// 3. Render Multi-Tier Galaxy Starfield
		ctx.globalCompositeOperation = 'source-over';
		for (let i = 0; i < stars.length; i++) {
			stars[i].update();
			stars[i].draw(ctx);
		}

		// 4. Render Shooting Stars / Comets
		handleShootingStars(time);

		// 5. Render Glowing Dynamic Particle Trails (Lighter luminous blending)
		ctx.globalCompositeOperation = 'lighter';
		for (let i = particles.length - 1; i >= 0; i--) {
			const p = particles[i];
			p.update();

			if (p.alpha <= 0.02 || p.size <= 0.1 || p.x < -40 || p.x > width + 40 || p.y < -40 || p.y > height + 40) {
				particles.splice(i, 1);
			} else {
				p.draw(ctx);
			}
		}

		requestAnimationFrame(animate);
	}

	// Initialize Canvas & Start Loop
	handleResize();
	setupButtonHoverEffects();
	requestAnimationFrame(animate);

	/* ------------------------------------------------------------------------
	   UI INTERACTION & PORTFOLIO ENHANCEMENTS
	   ------------------------------------------------------------------------ */
	document.addEventListener('DOMContentLoaded', () => {
		setupButtonHoverEffects();

		// Image Fallback Handler
		const allImages = document.querySelectorAll('img');
		allImages.forEach(img => {
			img.addEventListener('error', function () {
				if (img.dataset.fallback && img.src !== img.dataset.fallback) {
					img.src = img.dataset.fallback;
				}
			});
			if (img.complete && img.naturalWidth === 0 && img.dataset.fallback) {
				img.src = img.dataset.fallback;
			}
		});

		// Header Scrolled State
		const header = document.querySelector('.site-header');
		if (header) {
			const updateHeader = () => {
				if (window.scrollY > 30) {
					header.classList.add('scrolled');
				} else {
					header.classList.remove('scrolled');
				}
			};
			window.addEventListener('scroll', updateHeader, { passive: true });
			updateHeader();
		}

		// Mobile Menu Toggle
		const menuToggle = document.querySelector('.menu-toggle');
		const navLinks = document.querySelector('.nav-links');
		if (menuToggle && navLinks) {
			menuToggle.addEventListener('click', () => {
				const isOpen = navLinks.classList.toggle('open');
				menuToggle.setAttribute('aria-expanded', isOpen);
				menuToggle.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
			});

			navLinks.querySelectorAll('a').forEach(link => {
				link.addEventListener('click', () => {
					navLinks.classList.remove('open');
					menuToggle.setAttribute('aria-expanded', 'false');
					menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
				});
			});
		}

		// Scroll Reveal Intersection Observer
		const revealElements = document.querySelectorAll('.reveal');
		if ('IntersectionObserver' in window) {
			const revealObserver = new IntersectionObserver((entries, observer) => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						entry.target.classList.add('visible');
						observer.unobserve(entry.target);
					}
				});
			}, {
				threshold: 0.12,
				rootMargin: '0px 0px -40px 0px'
			});

			revealElements.forEach(el => revealObserver.observe(el));
		} else {
			revealElements.forEach(el => el.classList.add('visible'));
		}

		// Active Link Highlight on Scroll
		const sections = document.querySelectorAll('main section[id]');
		const navItems = document.querySelectorAll('.nav-links a[href^="#"]');

		function highlightNav() {
			const scrollPos = window.scrollY + 120;
			sections.forEach(section => {
				const top = section.offsetTop;
				const height = section.offsetHeight;
				const id = section.getAttribute('id');
				if (scrollPos >= top && scrollPos < top + height) {
					navItems.forEach(link => {
						if (link.getAttribute('href') === `#${id}`) {
							link.classList.add('active');
						} else {
							link.classList.remove('active');
						}
					});
				}
			});
		}
		window.addEventListener('scroll', highlightNav, { passive: true });

		// Gallery Lightbox Modal
		const lightbox = document.querySelector('.lightbox');
		if (lightbox) {
			const lightboxImg = lightbox.querySelector('img');
			const lightboxCaption = lightbox.querySelector('figcaption');
			const closeBtn = lightbox.querySelector('.lightbox-close');
			const prevBtn = lightbox.querySelector('.lightbox-prev');
			const nextBtn = lightbox.querySelector('.lightbox-next');
			const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));

			let currentIndex = 0;

			function openLightbox(index) {
				currentIndex = index;
				const item = galleryItems[currentIndex];
				if (!item) return;
				const img = item.querySelector('img');
				lightboxImg.src = img.src;
				lightboxImg.alt = img.alt || 'Gallery photo';
				lightboxCaption.textContent = img.alt || `Cosmic Moment ${currentIndex + 1} of ${galleryItems.length}`;
				lightbox.classList.add('open');
				lightbox.setAttribute('aria-hidden', 'false');
				document.body.style.overflow = 'hidden';
			}

			function closeLightbox() {
				lightbox.classList.remove('open');
				lightbox.setAttribute('aria-hidden', 'true');
				document.body.style.overflow = '';
			}

			function nextImage() {
				currentIndex = (currentIndex + 1) % galleryItems.length;
				openLightbox(currentIndex);
			}

			function prevImage() {
				currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
				openLightbox(currentIndex);
			}

			galleryItems.forEach((btn, idx) => {
				btn.addEventListener('click', () => openLightbox(idx));
			});

			if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
			if (nextBtn) nextBtn.addEventListener('click', nextImage);
			if (prevBtn) prevBtn.addEventListener('click', prevImage);

			lightbox.addEventListener('click', (e) => {
				if (e.target === lightbox) closeLightbox();
			});

			window.addEventListener('keydown', (e) => {
				if (!lightbox.classList.contains('open')) return;
				if (e.key === 'Escape') closeLightbox();
				if (e.key === 'ArrowRight') nextImage();
				if (e.key === 'ArrowLeft') prevImage();
			});
		}

		// Contact Form Mailto Handler
		const contactForm = document.getElementById('contact-form');
		if (contactForm) {
			contactForm.addEventListener('submit', function (e) {
				e.preventDefault();
				const name = document.getElementById('name')?.value || '';
				const email = document.getElementById('email')?.value || '';
				const message = document.getElementById('message')?.value || '';

				const subject = encodeURIComponent(`Portfolio Inquiry from ${name}`);
				const body = encodeURIComponent(
					`Hi Ronald,\n\n${message}\n\nFrom: ${name}\nEmail: ${email}`
				);

				window.location.href = `mailto:hello@ronaldpontongan.com?subject=${subject}&body=${body}`;

				const note = document.getElementById('form-note');
				if (note) {
					note.textContent = '🚀 Preparing your email draft... Check your mail application!';
					note.style.color = '#00f2fe';
				}
			});
		}
	});
})();
