/* ==========================================================================
   3D TILT EFFECT LIBRARY (PURE VANILLA JS)
   ========================================================================== */

class Card3DTilt {
  constructor(element, options = {}) {
    this.el = element;
    this.options = {
      maxTilt: options.maxTilt || 15,
      perspective: options.perspective || 1000,
      scale: options.scale || 1.03,
      speed: options.speed || '300ms',
      easing: options.easing || 'cubic-bezier(0.03,0.98,0.52,0.99)',
      resetOnLeave: options.resetOnLeave !== false,
      isPhone: this.el.dataset.tiltType === 'phone',
      ...options
    };
    
    // Initial isometric state for phone preview
    this.defaultTransform = this.options.isPhone 
      ? 'rotateX(15deg) rotateY(-20deg) rotateZ(10deg)' 
      : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';

    this.init();
  }

  init() {
    this.el.style.transformStyle = 'preserve-3d';
    this.el.style.transition = `transform ${this.options.speed} ${this.options.easing}, box-shadow ${this.options.speed} ${this.options.easing}`;
    
    // Bind event handlers
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    
    this.el.addEventListener('mousemove', this.onMouseMove);
    this.el.addEventListener('mouseenter', this.onMouseEnter);
    this.el.addEventListener('mouseleave', this.onMouseLeave);
  }

  onMouseEnter() {
    this.el.style.transition = 'none'; // Disable transition during active hover for smooth response
  }

  onMouseMove(e) {
    const rect = this.el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Mouse coordinates relative to card center (range from -0.5 to 0.5)
    const relativeX = (e.clientX - rect.left) / width - 0.5;
    const relativeY = (e.clientY - rect.top) / height - 0.5;
    
    // Calculate rotation angles
    let rotateX = -relativeY * this.options.maxTilt;
    let rotateY = relativeX * this.options.maxTilt;
    
    // Apply transform
    if (this.options.isPhone) {
      // For phone, merge tilt with base isometric rotation
      const baseRotateX = 15;
      const baseRotateY = -20;
      const baseRotateZ = 10;
      
      this.el.style.transform = `
        perspective(${this.options.perspective}px) 
        rotateX(${baseRotateX + rotateX * 0.5}deg) 
        rotateY(${baseRotateY + rotateY * 0.5}deg) 
        rotateZ(${baseRotateZ}deg) 
        scale3d(${this.options.scale}, ${this.options.scale}, ${this.options.scale})
      `;
      
      // Dynamic isometric drop shadow
      const shadowX = (relativeX * 30) - 20;
      const shadowY = (relativeY * 30) + 40;
      this.el.style.boxShadow = `${shadowX}px ${shadowY}px 50px rgba(0, 0, 0, 0.55)`;
    } else {
      // Normal card tilt
      this.el.style.transform = `
        perspective(${this.options.perspective}px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg) 
        scale3d(${this.options.scale}, ${this.options.scale}, ${this.options.scale})
      `;
      
      // Dynamic specular reflection shadow
      const shadowX = -rotateY * 1.5;
      const shadowY = rotateX * 1.5;
      const theme = document.body.className;
      
      if (theme.includes('theme-clay-3d')) {
        this.el.style.boxShadow = `
          ${6 + shadowX}px ${6 + shadowY}px 12px #cbd5e1, 
          ${-6 + shadowX}px ${-6 + shadowY}px 12px #ffffff,
          inset 2px 2px 4px rgba(255, 255, 255, 0.5)
        `;
      } else if (theme.includes('theme-retro-cyber')) {
        this.el.style.boxShadow = `${5 - shadowX}px ${5 + shadowY}px 0px #00f0ff`;
      } else {
        this.el.style.boxShadow = `${shadowX}px ${15 + shadowY}px 35px rgba(0, 0, 0, 0.5)`;
      }
    }
  }

  onMouseLeave() {
    this.el.style.transition = `transform ${this.options.speed} ${this.options.easing}, box-shadow ${this.options.speed} ${this.options.easing}`;
    this.el.style.transform = this.defaultTransform;
    
    // Reset shadow to original style
    const theme = document.body.className;
    if (this.options.isPhone) {
      this.el.style.boxShadow = '0 25px 60px rgba(0, 0, 0, 0.6)';
    } else if (theme.includes('theme-clay-3d')) {
      this.el.style.boxShadow = '6px 6px 12px #cbd5e1, -6px -6px 12px #ffffff, inset 2px 2px 4px rgba(255, 255, 255, 0.5)';
    } else if (theme.includes('theme-retro-cyber')) {
      this.el.style.boxShadow = '5px 5px 0px #00f0ff';
    } else if (theme.includes('theme-glass-neon')) {
      this.el.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)';
    } else {
      this.el.style.boxShadow = '';
    }
  }

  destroy() {
    this.el.removeEventListener('mousemove', this.onMouseMove);
    this.el.removeEventListener('mouseenter', this.onMouseEnter);
    this.el.removeEventListener('mouseleave', this.onMouseLeave);
  }
}

// Auto-initialize 3D tilt elements marked with class '.js-tilt-card'
document.addEventListener('DOMContentLoaded', () => {
  const elements = document.querySelectorAll('.js-tilt-card');
  elements.forEach(el => new Card3DTilt(el));
});
