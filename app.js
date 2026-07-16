/* ==========================================================================
   PUBLIC PROFILE VIEW LOGIC
   ========================================================================== */

// DOM Elements
const avatarImg = document.getElementById('profile-avatar');
const profileName = document.getElementById('profile-name');
const profileBio = document.getElementById('profile-bio');
const linksStack = document.getElementById('links-stack');

// Mappings for Platform Icons
const iconMappings = {
  instagram: 'fa-brands fa-instagram',
  youtube: 'fa-brands fa-youtube',
  facebook: 'fa-brands fa-facebook',
  whatsapp: 'fa-brands fa-whatsapp',
  twitter: 'fa-brands fa-x-twitter',
  linkedin: 'fa-brands fa-linkedin-in',
  tiktok: 'fa-brands fa-tiktok',
  'google-maps': 'fa-solid fa-map-location-dot',
  website: 'fa-solid fa-globe',
  custom: 'fa-solid fa-link'
};

// Mappings for CSS Brand Classes
const brandClassMappings = {
  instagram: 'brand-instagram',
  youtube: 'brand-youtube',
  facebook: 'brand-facebook',
  whatsapp: 'brand-whatsapp',
  twitter: 'brand-twitter',
  linkedin: 'brand-linkedin',
  tiktok: 'brand-tiktok',
  'google-maps': 'brand-google-maps',
  website: 'brand-website',
  custom: 'brand-custom'
};

// Fetch current profile and render
async function loadProfile() {
  try {
    const response = await fetch(`./data.json?v=${Date.now()}`);
    if (!response.ok) throw new Error('Network error fetching profile data');
    const data = await response.json();
    renderPage(data.profile, data.links);
    
    // Trigger confetti celebration on successful load
    setTimeout(triggerConfetti, 400);
  } catch (error) {
    console.error('Failed to load profile:', error);
    linksStack.innerHTML = `
      <div class="error-container">
        <i class="fa-solid fa-circle-exclamation" style="font-size: 32px; color: #ef4444; margin-bottom: 12px;"></i>
        <p>Failed to connect to backend server. Make sure server.js is running.</p>
      </div>
    `;
  }
}

// Render dynamic profile and links into elements
function renderPage(profile, links) {
  // 1. Set Theme on Body
  document.body.className = `theme-${profile.theme || 'glass-neon'}`;
  
  // 2. Set Profile Details
  profileName.textContent = profile.name || 'Ahmed Khan';
  profileBio.textContent = profile.bio || 'Digital Creator';
  
  // Custom Avatar or Default Placeholder
  avatarImg.onload = () => {
    avatarImg.style.opacity = '1';
  };
  if (profile.avatar && profile.avatar.trim() !== '') {
    avatarImg.src = profile.avatar;
  } else {
    // Generate a default high-quality initial-avatar via SVG UI Avatars API
    const initials = (profile.name || 'A').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=6366f1&color=fff&size=200&bold=true`;
  }
  
  // 3. Set Links Stack
  linksStack.innerHTML = '';

  // Add Save Contact button card
  if (!isPreview) {
    const contactCard = document.createElement('a');
    contactCard.href = './contact.vcf';
    contactCard.setAttribute('download', 'Sweetbites_Arifwala.vcf');
    contactCard.className = 'link-card-3d brand-custom';
    contactCard.style.setProperty('--platform-color', '#10b981');
    contactCard.style.setProperty('--platform-color-rgb', '16, 185, 129');
    
    contactCard.innerHTML = `
      <div class="link-icon-container">
        <i class="fa-solid fa-user-plus"></i>
      </div>
      <span class="link-title" style="font-weight: 700;">Save Contact to Phone</span>
      <div class="link-arrow">
        <i class="fa-solid fa-download"></i>
      </div>
    `;
    
    contactCard.addEventListener('click', () => {
      playAudioClick();
    });
    
    linksStack.appendChild(contactCard);
    new Card3DTilt(contactCard, { maxTilt: 15, scale: 1.03 });
  }
  
  const activeLinks = links.filter(link => link.active && link.url && link.title);
  
  if (activeLinks.length === 0) {
    linksStack.innerHTML = `
      <div class="empty-links-state">
        <p style="opacity: 0.6; text-align: center; padding: 20px;">No active links added yet!</p>
      </div>
    `;
    return;
  }
  
  activeLinks.forEach(link => {
    const brandClass = brandClassMappings[link.platform] || 'brand-custom';
    const iconClass = iconMappings[link.platform] || 'fa-solid fa-globe';
    
    // Create Anchor Tag
    const card = document.createElement('a');
    
    // Auto-message for WhatsApp
    let finalUrl = link.url;
    if (link.platform === 'whatsapp') {
      if (!finalUrl.includes('text=')) {
        const textMessage = encodeURIComponent("Hi Sweet Bites Arifwala, I scanned your QR code and would like to inquire about your cakes!");
        if (finalUrl.includes('?')) {
          finalUrl += `&text=${textMessage}`;
        } else {
          finalUrl += `?text=${textMessage}`;
        }
      }
    }
    card.href = finalUrl;
    card.target = '_blank';
    card.className = `link-card-3d ${brandClass}`;
    
    // Add Click API hook
    card.addEventListener('click', (e) => {
      // Play click sound
      playAudioClick();
      // Register click without blocking navigation
      fetch(`/api/click/${link.id}`, { method: 'POST' }).catch(() => {});
    });
    
    card.innerHTML = `
      <div class="link-icon-container">
        <i class="${iconClass}"></i>
      </div>
      <span class="link-title">${link.title}</span>
      <div class="link-arrow">
        <i class="fa-solid fa-arrow-right"></i>
      </div>
    `;
    
    linksStack.appendChild(card);
    
    // Attach 3D Tilt Class
    new Card3DTilt(card, { maxTilt: 15, scale: 1.03 });
  });

  // 4. Render Map Embed Card
  const mapCard = document.getElementById('profile-map-card');
  const mapIframe = document.getElementById('map-iframe');
  const mapIframeWrapper = document.getElementById('map-iframe-wrapper') || document.querySelector('.map-iframe-wrapper');
  const mapFallbackWrapper = document.getElementById('map-fallback-wrapper') || document.querySelector('.map-fallback-wrapper');
  const mapFallbackBtn = document.getElementById('map-fallback-btn');
  
  if (profile.map_embed && profile.map_embed.trim() !== '' && mapCard) {
    let mapUrl = profile.map_embed.trim();
    
    // Check if it is a Google Maps embed iframe or a direct embed URL
    const isEmbed = mapUrl.startsWith('<iframe') || mapUrl.includes('/maps/embed');
    
    if (isEmbed) {
      // Parse iframe src if they pasted full iframe HTML
      if (mapUrl.startsWith('<iframe')) {
        const match = mapUrl.match(/src="([^"]+)"/);
        if (match && match[1]) {
          mapUrl = match[1];
        }
      }
      
      if (mapIframe && mapIframeWrapper && mapFallbackWrapper) {
        mapIframe.src = mapUrl;
        mapIframeWrapper.style.display = 'block';
        mapFallbackWrapper.style.display = 'none';
      }
    } else {
      // Standard GMB share link fallback (since regular share links block iframe loading)
      if (mapIframeWrapper && mapFallbackWrapper && mapFallbackBtn) {
        mapFallbackBtn.href = mapUrl;
        mapIframeWrapper.style.display = 'none';
        mapFallbackWrapper.style.display = 'flex';
      }
    }
    
    mapCard.style.display = 'flex';
    new Card3DTilt(mapCard, { maxTilt: 8, scale: 1.01 });
  } else if (mapCard) {
    mapCard.style.display = 'none';
  }

  // Re-attach 3D Tilt to profile header card
  const profileCard = document.getElementById('profile-card');
  if (profileCard) {
    new Card3DTilt(profileCard, { maxTilt: 8, scale: 1.01 });
  }

  // Trigger falling sweets background if not in preview mode and not already created
  if (!isPreview && !document.querySelector('.falling-sweets-container')) {
    initFallingSweets(profile.theme);
  }

  // Setup theme toggle (Dark / Light mode)
  setupThemeToggle(profile.theme);

  // Setup share profile button
  setupShareButton(profile.name);

  // Setup sound settings button
  setupSoundMuteButton();
}

// Check if loaded in Iframe/Preview Mode
const urlParams = new URLSearchParams(window.location.search);
const isPreview = urlParams.get('preview') === 'true';

if (isPreview) {
  // If in Preview Mode, hide admin dashboard button & manage header border spacing
  document.body.classList.add('in-preview-mode');
  const adminBtn = document.querySelector('.admin-link-btn');
  if (adminBtn) adminBtn.style.display = 'none';

  // Listen to live postMessages from Parent Editor (No reloads needed!)
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PREVIEW_UPDATE') {
      const { profile, links } = event.data.data;
      renderPage(profile, links);
    }
  });
} else {
  // Normal load
  document.addEventListener('DOMContentLoaded', loadProfile);
}

// Falling Sweets Background Effect
function initFallingSweets(theme) {
  // Real colorful sweets emojis: cake (🍰, 🎂), cupcake (🧁), donut (🍩), cookies (🍪), brownie/chocolate (🍫)
  const sweetEmojis = ['🍰', '🧁', '🎂', '🍩', '🍪', '🍫'];
  
  const container = document.createElement('div');
  container.className = 'falling-sweets-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.overflow = 'hidden';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '0';
  document.body.appendChild(container);

  const maxSweets = 12;
  for (let i = 0; i < maxSweets; i++) {
    createSweet(container, sweetEmojis);
  }
}

function createSweet(container, emojis) {
  const sweet = document.createElement('div');
  sweet.className = 'falling-sweet';
  
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  sweet.textContent = emoji;
  
  const startLeft = Math.random() * 100;
  const delay = Math.random() * -20;
  const duration = 14 + Math.random() * 12;
  const size = 20 + Math.random() * 24; // slightly larger for emojis
  
  sweet.style.left = `${startLeft}%`;
  sweet.style.fontSize = `${size}px`;
  sweet.style.animationDelay = `${delay}s`;
  sweet.style.animationDuration = `${duration}s`;
  
  container.appendChild(sweet);
}

// Setup Theme Toggle Button (Dark/Light mode)
function setupThemeToggle(profileTheme) {
  const toggleBtn = document.getElementById('dark-light-toggle');
  if (!toggleBtn) return;

  const updateToggleIcon = (currentTheme) => {
    const icon = toggleBtn.querySelector('i');
    if (!icon) return;
    if (currentTheme === 'clay-3d') {
      icon.className = 'fa-solid fa-moon'; // Moon icon when in Light mode
    } else {
      icon.className = 'fa-solid fa-sun'; // Sun icon when in Dark mode
    }
  };

  // Determine current active theme
  let currentTheme = document.body.className.replace('theme-', '');
  updateToggleIcon(currentTheme);

  // Remove existing listener to prevent duplicates
  const newToggleBtn = toggleBtn.cloneNode(true);
  toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);

  newToggleBtn.addEventListener('click', () => {
    // Play switch sound
    playAudioSwitch();
    // Depress animation effect
    newToggleBtn.style.transform = 'scale(0.9)';
    setTimeout(() => { newToggleBtn.style.transform = ''; }, 100);

    const isLight = document.body.classList.contains('theme-clay-3d');
    let newTheme;
    if (isLight) {
      // Switch back to original configured dark theme (or default glass-neon if none)
      newTheme = profileTheme && profileTheme !== 'clay-3d' ? profileTheme : 'glass-neon';
    } else {
      // Switch to light theme
      newTheme = 'clay-3d';
    }

    // Apply new theme class to body
    document.body.className = `theme-${newTheme}`;
    updateToggleIcon(newTheme);

    // Re-initialize sweets background particle colors to match new theme!
    const sweetsContainer = document.querySelector('.falling-sweets-container');
    if (sweetsContainer) {
      sweetsContainer.remove();
      initFallingSweets(newTheme);
    }
  });
}

// Setup Share Button
function setupShareButton(profileName) {
  const shareBtn = document.getElementById('share-profile-btn');
  if (!shareBtn) return;

  // Remove existing listener to prevent duplicates
  const newShareBtn = shareBtn.cloneNode(true);
  shareBtn.parentNode.replaceChild(newShareBtn, shareBtn);

  newShareBtn.addEventListener('click', async () => {
    // Depress animation effect
    newShareBtn.style.transform = 'scale(0.9)';
    setTimeout(() => { newShareBtn.style.transform = ''; }, 100);

    const shareData = {
      title: profileName || 'Sweetbites Arifwala',
      text: `Check out ${profileName || 'Sweetbites Arifwala'} QR Profile! Connect via WhatsApp, Instagram, Facebook & more!`,
      url: window.location.href.split('?')[0] // current url without query params
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        console.log('Shared successfully!');
      } catch (err) {
        console.log('Share canceled or failed:', err);
      }
    } else {
      // Fallback: Copy URL to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        showPublicToast('Link copied to clipboard! Share it anywhere.');
      } catch (copyErr) {
        console.error('Failed to copy link:', copyErr);
      }
    }
  });
}

// Custom Toast for Public View (if not defined)
function showPublicToast(message) {
  let toastEl = document.getElementById('public-toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'public-toast';
    toastEl.style.position = 'fixed';
    toastEl.style.bottom = '30px';
    toastEl.style.left = '50%';
    toastEl.style.transform = 'translateX(-50%)';
    toastEl.style.background = 'rgba(15, 23, 42, 0.95)';
    toastEl.style.color = '#fff';
    toastEl.style.padding = '12px 24px';
    toastEl.style.borderRadius = '24px';
    toastEl.style.fontSize = '13px';
    toastEl.style.fontWeight = '600';
    toastEl.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.4)';
    toastEl.style.zIndex = '1000';
    toastEl.style.transition = 'opacity 0.3s ease';
    toastEl.style.pointerEvents = 'none';
    toastEl.style.opacity = '0';
    toastEl.style.border = '1px solid rgba(255, 255, 255, 0.08)';
    document.body.appendChild(toastEl);
  }
  
  toastEl.textContent = message;
  toastEl.style.opacity = '1';
  setTimeout(() => {
    toastEl.style.opacity = '0';
  }, 2500);
}

// Audio POP synthesis using Web Audio API (zero external assets needed)
let audioCtx = null;
function playAudioClick() {
  try {
    if (localStorage.getItem('sound_muted') === 'true') return;
    
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Resume context if suspended (browser security autoplays policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    // Frequency sweeps down for organic pop sound
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.08);
    
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  } catch (e) {
    console.warn('Audio synthesis failed:', e);
  }
}

// Audio SWITCH synthesis using Web Audio API (sweeps up)
function playAudioSwitch() {
  try {
    if (localStorage.getItem('sound_muted') === 'true') return;
    
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, audioCtx.currentTime + 0.12);
    
    gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  } catch (e) {
    console.warn('Audio synthesis failed:', e);
  }
}

// Sound settings button listener
function setupSoundMuteButton() {
  const muteBtn = document.getElementById('sound-mute-toggle');
  if (!muteBtn) return;

  // Remove existing listener to prevent duplicates
  const newMuteBtn = muteBtn.cloneNode(true);
  muteBtn.parentNode.replaceChild(newMuteBtn, muteBtn);

  const updateIcon = () => {
    const isMuted = localStorage.getItem('sound_muted') === 'true';
    const icon = newMuteBtn.querySelector('i');
    if (icon) {
      icon.className = isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
    }
  };

  updateIcon();

  newMuteBtn.addEventListener('click', () => {
    const isMuted = localStorage.getItem('sound_muted') === 'true';
    localStorage.setItem('sound_muted', !isMuted ? 'true' : 'false');
    updateIcon();
    if (isMuted) {
      // Play pop to verify it's unmuted
      playAudioClick();
    }
  });
}


// Canvas Confetti Celebration Shower
function triggerConfetti() {
  // Never fire confetti inside preview frames
  if (window.location.search.includes('preview=true')) return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const colors = ['#f43f5e', '#fbbf24', '#3b82f6', '#10b981', '#a855f7', '#ec4899'];
  const confettiCount = 100;
  const confetti = [];

  for (let i = 0; i < confettiCount; i++) {
    confetti.push({
      x: Math.random() * width,
      y: Math.random() * -height - 20,
      size: 6 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: -2 + Math.random() * 4,
      speedY: 4 + Math.random() * 5,
      rotation: Math.random() * 360,
      rotationSpeed: -5 + Math.random() * 10
    });
  }

  const startTime = Date.now();
  function animate() {
    ctx.clearRect(0, 0, width, height);

    let active = false;
    confetti.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotationSpeed;

      if (p.y < height) {
        active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (active && Date.now() - startTime < 3500) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }

  animate();
}
