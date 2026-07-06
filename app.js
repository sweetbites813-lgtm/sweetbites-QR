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
  const sweetIcons = [
    'fa-cookie',
    'fa-cake-candles',
    'fa-ice-cream',
    'fa-cookie-bite',
    'fa-candy-cane'
  ];
  
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

  // Determine particle color based on theme
  let particleColor = 'rgba(255, 255, 255, 0.08)';
  if (theme === 'clay-3d') {
    particleColor = 'rgba(99, 102, 241, 0.07)';
  } else if (theme === 'glass-neon') {
    particleColor = 'rgba(217, 70, 239, 0.09)';
  } else if (theme === 'retro-cyber') {
    particleColor = 'rgba(0, 240, 255, 0.08)';
  } else if (theme === 'aurora-glow') {
    particleColor = 'rgba(212, 175, 55, 0.08)';
  }

  const maxSweets = 12;
  for (let i = 0; i < maxSweets; i++) {
    createSweet(container, sweetIcons, particleColor);
  }
}

function createSweet(container, icons, color) {
  const sweet = document.createElement('div');
  sweet.className = 'falling-sweet';
  
  const icon = icons[Math.floor(Math.random() * icons.length)];
  sweet.innerHTML = `<i class="fa-solid ${icon}"></i>`;
  
  const startLeft = Math.random() * 100;
  const delay = Math.random() * -20;
  const duration = 12 + Math.random() * 12;
  const size = 16 + Math.random() * 16;
  
  sweet.style.left = `${startLeft}%`;
  sweet.style.fontSize = `${size}px`;
  sweet.style.color = color;
  sweet.style.animationDelay = `${delay}s`;
  sweet.style.animationDuration = `${duration}s`;
  
  container.appendChild(sweet);
}
