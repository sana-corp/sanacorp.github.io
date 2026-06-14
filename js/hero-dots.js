/* ==========================================================================
   HERO DOT GRID — Premium interactive particle canvas for case-header heroes
   Dots repel mouse, connect with constellation lines, spring back smoothly.
   ========================================================================== */

(function () {
    'use strict';

    const CONFIG = {
        SPACING: 36,           // grid spacing in px
        DOT_RADIUS: 1.6,       // base dot radius
        DOT_RADIUS_ACCENT: 2.4,// accent dot radius
        ACCENT_RATIO: 0.07,    // ~7% of dots are accent orange
        REPEL_RADIUS: 110,     // mouse repel radius
        REPEL_STRENGTH: 0.38,  // repel force
        LINE_DIST: 80,         // max dist to draw connecting line
        SPRING: 0.085,         // spring return stiffness
        DAMPING: 0.72,         // velocity damping
        DOT_COLOR: 'rgba(10, 17, 40, VAL)',
        ACCENT_COLOR: 'rgba(255, 94, 0, VAL)',
        LINE_COLOR: 'rgba(10, 17, 40, VAL)',
        IDLE_DRIFT: true,      // gentle idle breathing drift
        DRIFT_AMP: 1.2,        // idle drift amplitude px
        DRIFT_SPEED: 0.0008,   // idle drift speed
    };

    // ---- Per-canvas instance ------------------------------------------------

    function HeroDots(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dots = [];
        this.mouse = { x: -9999, y: -9999 };
        this.raf = null;
        this.tick = 0;
        this._boundResize = this._resize.bind(this);
        this._boundMouseMove = this._onMouseMove.bind(this);
        this._boundMouseLeave = this._onMouseLeave.bind(this);
        this._init();
    }

    HeroDots.prototype._init = function () {
        // Fade in smoothly
        this.canvas.style.opacity = '0';
        this.canvas.style.transition = 'opacity 1.2s ease';
        setTimeout(() => {
            this.canvas.style.opacity = '1';
        }, 100);

        this._resize();
        window.addEventListener('resize', this._boundResize);
        this.canvas.parentElement.addEventListener('mousemove', this._boundMouseMove);
        this.canvas.parentElement.addEventListener('mouseleave', this._boundMouseLeave);
        this._animate();
    };

    HeroDots.prototype.destroy = function () {
        cancelAnimationFrame(this.raf);
        window.removeEventListener('resize', this._boundResize);
        const parent = this.canvas.parentElement;
        if (parent) {
            parent.removeEventListener('mousemove', this._boundMouseMove);
            parent.removeEventListener('mouseleave', this._boundMouseLeave);
        }
    };

    HeroDots.prototype._resize = function () {
        const parent = this.canvas.parentElement;
        const W = parent.offsetWidth;
        const H = parent.offsetHeight;
        // DPR for crisp rendering
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = W * dpr;
        this.canvas.height = H * dpr;
        this.canvas.style.width = W + 'px';
        this.canvas.style.height = H + 'px';
        this.ctx.scale(dpr, dpr);
        this.W = W;
        this.H = H;
        this._buildGrid();
    };

    HeroDots.prototype._buildGrid = function () {
        this.dots = [];
        const cols = Math.ceil(this.W / CONFIG.SPACING) + 1;
        const rows = Math.ceil(this.H / CONFIG.SPACING) + 1;
        const offsetX = ((this.W % CONFIG.SPACING) / 2);
        const offsetY = ((this.H % CONFIG.SPACING) / 2);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const ox = offsetX + col * CONFIG.SPACING;
                const oy = offsetY + row * CONFIG.SPACING;
                const isAccent = Math.random() < CONFIG.ACCENT_RATIO;
                this.dots.push({
                    ox: ox, oy: oy,   // origin position
                    x: ox, y: oy,     // current position
                    vx: 0, vy: 0,     // velocity
                    isAccent: isAccent,
                    // Unique phase for idle drift
                    phase: Math.random() * Math.PI * 2,
                    phaseY: Math.random() * Math.PI * 2,
                    radius: isAccent ? CONFIG.DOT_RADIUS_ACCENT : CONFIG.DOT_RADIUS,
                    opacity: isAccent ? 0.55 + Math.random() * 0.35 : 0.13 + Math.random() * 0.18,
                });
            }
        }
    };

    HeroDots.prototype._onMouseMove = function (e) {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    };

    HeroDots.prototype._onMouseLeave = function () {
        // Smoothly retract — just push mouse far away
        this.mouse.x = -9999;
        this.mouse.y = -9999;
    };

    HeroDots.prototype._animate = function () {
        this.raf = requestAnimationFrame(this._animate.bind(this));
        this.tick++;
        this._update();
        this._draw();
    };

    HeroDots.prototype._update = function () {
        const t = this.tick;
        const mx = this.mouse.x;
        const my = this.mouse.y;
        const R = CONFIG.REPEL_RADIUS;
        const R2 = R * R;

        for (let i = 0; i < this.dots.length; i++) {
            const d = this.dots[i];

            // --- Idle drift ---
            let driftX = 0, driftY = 0;
            if (CONFIG.IDLE_DRIFT) {
                driftX = Math.sin(t * CONFIG.DRIFT_SPEED + d.phase) * CONFIG.DRIFT_AMP;
                driftY = Math.cos(t * CONFIG.DRIFT_SPEED + d.phaseY) * CONFIG.DRIFT_AMP;
            }

            // Target = origin + idle drift
            const tx = d.ox + driftX;
            const ty = d.oy + driftY;

            // --- Mouse repulsion ---
            const dx = d.x - mx;
            const dy = d.y - my;
            const dist2 = dx * dx + dy * dy;

            if (dist2 < R2 && dist2 > 0) {
                const dist = Math.sqrt(dist2);
                const force = (1 - dist / R) * CONFIG.REPEL_STRENGTH;
                d.vx += (dx / dist) * force * 18;
                d.vy += (dy / dist) * force * 18;
            }

            // --- Spring return to target ---
            d.vx += (tx - d.x) * CONFIG.SPRING;
            d.vy += (ty - d.y) * CONFIG.SPRING;

            // --- Damping ---
            d.vx *= CONFIG.DAMPING;
            d.vy *= CONFIG.DAMPING;

            d.x += d.vx;
            d.y += d.vy;
        }
    };

    HeroDots.prototype._draw = function () {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.W, this.H);

        const dots = this.dots;
        const n = dots.length;
        const LDIST2 = CONFIG.LINE_DIST * CONFIG.LINE_DIST;
        const mx = this.mouse.x;
        const my = this.mouse.y;
        const R = CONFIG.REPEL_RADIUS;

        // --- Draw connecting lines ---
        // Only check neighbours within a reasonable distance to save perf
        for (let i = 0; i < n; i++) {
            const a = dots[i];
            for (let j = i + 1; j < n; j++) {
                const b = dots[j];
                // Quick AABB cull
                const diffX = a.x - b.x;
                const diffY = a.y - b.y;
                if (Math.abs(diffX) > CONFIG.LINE_DIST || Math.abs(diffY) > CONFIG.LINE_DIST) continue;

                const d2 = diffX * diffX + diffY * diffY;
                if (d2 > LDIST2) continue;

                const t = 1 - Math.sqrt(d2) / CONFIG.LINE_DIST;
                // Boost line opacity near mouse
                const mdx = (a.x + b.x) / 2 - mx;
                const mdy = (a.y + b.y) / 2 - my;
                const mouseDist = Math.sqrt(mdx * mdx + mdy * mdy);
                const mouseBoost = mouseDist < R ? (1 - mouseDist / R) * 0.25 : 0;

                const alpha = (t * 0.12 + mouseBoost);

                if (a.isAccent || b.isAccent) {
                    ctx.strokeStyle = CONFIG.ACCENT_COLOR.replace('VAL', (alpha * 0.7).toFixed(3));
                } else {
                    ctx.strokeStyle = CONFIG.LINE_COLOR.replace('VAL', alpha.toFixed(3));
                }
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
        }

        // --- Draw dots ---
        for (let i = 0; i < n; i++) {
            const d = dots[i];
            // Boost opacity near mouse
            const mdx = d.x - mx;
            const mdy = d.y - my;
            const mouseDist = Math.sqrt(mdx * mdx + mdy * mdy);
            const mouseBoost = mouseDist < R * 1.4 ? (1 - mouseDist / (R * 1.4)) * 0.5 : 0;
            const alpha = Math.min(1, d.opacity + mouseBoost);
            const r = d.radius * (1 + mouseBoost * 0.8);

            if (d.isAccent) {
                // Orange glow for accent dots
                const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, r * 3);
                grad.addColorStop(0, CONFIG.ACCENT_COLOR.replace('VAL', alpha.toFixed(3)));
                grad.addColorStop(0.5, CONFIG.ACCENT_COLOR.replace('VAL', (alpha * 0.3).toFixed(3)));
                grad.addColorStop(1, CONFIG.ACCENT_COLOR.replace('VAL', '0'));
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(d.x, d.y, r * 3, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = CONFIG.ACCENT_COLOR.replace('VAL', alpha.toFixed(3));
            } else {
                ctx.fillStyle = CONFIG.DOT_COLOR.replace('VAL', alpha.toFixed(3));
            }

            ctx.beginPath();
            ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    // ---- Initialise on all .case-header and .product-hero elements ----------

    function init() {
        // Only case-header heroes — product page has its own WebGL 3D background
        const targets = document.querySelectorAll('.case-header');
        targets.forEach(function (el) {
            // Don't double-init
            if (el.querySelector('.hero-dots-canvas')) return;

            const canvas = document.createElement('canvas');
            canvas.className = 'hero-dots-canvas';
            // Insert as first child (behind content)
            el.insertBefore(canvas, el.firstChild);

            el._heroDots = new HeroDots(canvas);
        });
    }

    // Re-init when SPA navigates (pages become active/inactive)
    // Use MutationObserver to watch for .active class changes on page sections
    function watchNavigation() {
        const sections = document.querySelectorAll('.page-section');
        sections.forEach(function (section) {
            // Observe class changes
            new MutationObserver(function (mutations) {
                mutations.forEach(function (m) {
                    if (m.attributeName === 'class') {
                        const isActive = section.classList.contains('active');
                        const heroes = section.querySelectorAll('.case-header, .product-hero');
                        heroes.forEach(function (el) {
                            if (isActive && el._heroDots) {
                                // Resume
                                if (!el._heroDots.raf) {
                                    el._heroDots._animate();
                                }
                                el._heroDots._resize();
                            } else if (!isActive && el._heroDots && el._heroDots.raf) {
                                // Pause when page hidden to save CPU
                                cancelAnimationFrame(el._heroDots.raf);
                                el._heroDots.raf = null;
                            }
                        });
                    }
                });
            }).observe(section, { attributes: true });
        });
    }

    // Run after DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            init();
            watchNavigation();
        });
    } else {
        init();
        watchNavigation();
    }

})();
