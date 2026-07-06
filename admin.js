/* ==========================================================================
   ADMIN PANEL INTERACTION & STATE SYNC
   ========================================================================== */

// App State
let state = {
  profile: {
    name: '',
    bio: '',
    avatar: '',
    theme: 'glass-neon'
  },
  links: []
};

let serverUrl = '';

// DOM Elements
const inputName = document.getElementById('input-name');
const inputBio = document.getElementById('input-bio');
const inputAvatar = document.getElementById('input-avatar');
const inputMapEmbed = document.getElementById('input-map-embed');
const themeButtons = document.querySelectorAll('.theme-option');
const linksEditorList = document.getElementById('links-editor-list');
const addLinkBtn = document.getElementById('add-link-btn');
const saveProfileBtn = document.getElementById('save-profile-btn');
const previewIframe = document.getElementById('preview-iframe');
const qrImage = document.getElementById('qr-image');
const qrTargetUrl = document.getElementById('qr-target-url');
const btnCopyUrl = document.getElementById('btn-copy-url');
const btnDownloadQr = document.getElementById('btn-download-qr');
const toast = document.getElementById('toast');

const inputLogoFile = document.getElementById('input-logo-file');
const uploaderDragArea = document.getElementById('uploader-drag-area');
const uploaderPreviewArea = document.getElementById('uploader-preview-area');
const logoThumbnail = document.getElementById('logo-thumbnail');
const logoFileName = document.getElementById('logo-file-name');
const btnRemoveLogo = document.getElementById('btn-remove-logo');
const toggleAvatarUrl = document.getElementById('toggle-avatar-url');
const avatarUrlWrapper = document.getElementById('avatar-url-wrapper');
const inputGithubToken = document.getElementById('github-token');
const btnSaveToken = document.getElementById('btn-save-token');

// Platform icons for preview label details
const platformIcons = {
  instagram: 'fa-instagram',
  youtube: 'fa-youtube',
  facebook: 'fa-facebook',
  whatsapp: 'fa-whatsapp',
  twitter: 'fa-x-twitter',
  linkedin: 'fa-linkedin-in',
  tiktok: 'fa-tiktok',
  'google-maps': 'map-location-dot',
  website: 'globe',
  custom: 'link'
};

// Initialize Admin Dashboard
async function initAdmin() {
  try {
    // 1. Get local network IP and generate QR Target URL
    try {
      const ipResponse = await fetch('/api/ip');
      if (ipResponse.ok) {
        const ipData = await ipResponse.json();
        serverUrl = ipData.url;
      } else {
        throw new Error();
      }
    } catch (e) {
      // Fallback for static online view (use the current browser URL)
      serverUrl = window.location.href.replace('admin.html', 'index.html').split('?')[0];
    }
    
    qrTargetUrl.textContent = serverUrl;
    
    // Generate QR code pointing to serverUrl client-side
    if (window.QRCode) {
      QRCode.toDataURL(serverUrl, {
        width: 500,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
      .then(url => {
        qrImage.src = url;
        btnDownloadQr.href = url;
        btnDownloadQr.download = 'qr_code.png';
      })
      .catch(err => {
        console.error('QR code generation failed:', err);
        const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(serverUrl)}`;
        qrImage.src = fallbackUrl;
        btnDownloadQr.href = fallbackUrl;
      });
    } else {
      // Fallback if library fails to load
      const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(serverUrl)}`;
      qrImage.src = fallbackUrl;
      btnDownloadQr.href = fallbackUrl;
    }
    
    // 2. Load profile configurations
    let data;
    let isStaticMode = false;
    try {
      const profileResponse = await fetch('/api/profile');
      if (!profileResponse.ok) throw new Error();
      data = await profileResponse.json();
    } catch (e) {
      // Fallback for online editor running on GitHub Pages
      const staticResponse = await fetch('./data.json');
      if (staticResponse.ok) {
        data = await staticResponse.json();
        isStaticMode = true;
        
        // Show static editor mode banner
        const staticBanner = document.getElementById('static-banner');
        if (staticBanner) staticBanner.style.display = 'flex';
        
        // Dynamically resolve repository casing from API
        const owner = window.location.hostname.split('.')[0];
        const repo = window.location.pathname.split('/')[1] || 'my-QR';
        if (owner && owner !== 'localhost' && owner !== '127') {
          try {
            const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
            if (repoRes.ok) {
              const repoData = await repoRes.json();
              if (repoData.name) {
                state.repo_casing = repoData.name;
                console.log(`Resolved repo casing: ${state.repo_casing}`);
              }
            }
          } catch (repoErr) {
            console.warn('Could not resolve repo casing:', repoErr);
          }
        }
        
        console.log("Admin Dashboard running in Static Mode.");
      } else {
        throw new Error('Could not fetch profile details');
      }
    }
    
    state.profile = data.profile || state.profile;
    state.links = data.links || [];
    
    // Populate form fields
    inputName.value = state.profile.name || '';
    inputBio.value = state.profile.bio || '';
    inputAvatar.value = state.profile.avatar || '';
    if (inputMapEmbed) {
      inputMapEmbed.value = state.profile.map_embed || '';
    }

    // Set logo display based on current data
    if (state.profile.avatar && state.profile.avatar.trim() !== '') {
      if (state.profile.avatar.startsWith('data:image/')) {
        uploaderDragArea.style.display = 'none';
        uploaderPreviewArea.style.display = 'flex';
        logoThumbnail.src = state.profile.avatar;
        logoFileName.textContent = 'uploaded_logo.png';
      } else {
        uploaderDragArea.style.display = 'flex';
        uploaderPreviewArea.style.display = 'none';
        avatarUrlWrapper.style.display = 'block';
        toggleAvatarUrl.innerHTML = '<i class="fa-solid fa-link-slash"></i> Hide URL input';
      }
    } else {
      uploaderDragArea.style.display = 'flex';
      uploaderPreviewArea.style.display = 'none';
    }
    
    // Setup Theme Buttons UI
    updateThemeSelectionUI(state.profile.theme);
    
    // Render links editor list
    renderLinksEditor();

    // Load GitHub Token from localStorage
    if (inputGithubToken) {
      inputGithubToken.value = localStorage.getItem('github_token') || '';
    }

    // Set dynamic source with timestamp to prevent iframe caching
    if (previewIframe) {
      previewIframe.src = `index.html?preview=true&v=${Date.now()}`;
      previewIframe.addEventListener('load', syncPreview);
    }
    // Sync preview in case iframe is already loaded
    setTimeout(syncPreview, 800);
    
  } catch (error) {
    console.error('Failed to initialize dashboard:', error);
    showToast('Failed to load settings. Make sure server is running.', true);
  }
}

// Update active status on theme selection buttons
function updateThemeSelectionUI(activeThemeName) {
  themeButtons.forEach(btn => {
    if (btn.dataset.theme === activeThemeName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Push current memory state to iframe via postMessage
function syncPreview() {
  if (previewIframe && previewIframe.contentWindow) {
    previewIframe.contentWindow.postMessage({
      type: 'PREVIEW_UPDATE',
      data: state
    }, '*');
  }
}

// Toast Notifications
function showToast(message, isError = false) {
  toast.textContent = message;
  toast.className = 'toast'; // reset
  if (isError) toast.classList.add('error');
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Render dynamic forms for editable links
function renderLinksEditor() {
  linksEditorList.innerHTML = '';
  
  if (state.links.length === 0) {
    linksEditorList.innerHTML = `
      <div style="text-align: center; padding: 30px; opacity: 0.5;">
        <i class="fa-solid fa-link-slash" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
        <p>No links created yet. Click 'Add Link' above.</p>
      </div>
    `;
    return;
  }
  
  state.links.forEach((link, index) => {
    const item = document.createElement('div');
    item.className = 'link-editor-item';
    item.dataset.id = link.id;
    
    const iconClass = platformIcons[link.platform] || 'fa-globe';
    const clickCount = link.clicks || 0;
    
    item.innerHTML = `
      <div class="link-item-header">
        <div class="link-drag-handle">
          <i class="fa-solid fa-${iconClass}"></i>
          <span>Link #${index + 1}</span>
          <span class="link-click-badge"><i class="fa-solid fa-chart-simple"></i> ${clickCount} clicks</span>
        </div>
        <button type="button" class="link-delete-btn" title="Delete Link">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
      
      <div class="link-editor-fields">
        <!-- Platform Select -->
        <div class="form-group" style="margin-bottom: 0;">
          <label>Platform</label>
          <select class="link-platform-select">
            <option value="instagram" ${link.platform === 'instagram' ? 'selected' : ''}>Instagram</option>
            <option value="youtube" ${link.platform === 'youtube' ? 'selected' : ''}>YouTube</option>
            <option value="facebook" ${link.platform === 'facebook' ? 'selected' : ''}>Facebook</option>
            <option value="whatsapp" ${link.platform === 'whatsapp' ? 'selected' : ''}>WhatsApp</option>
            <option value="twitter" ${link.platform === 'twitter' ? 'selected' : ''}>Twitter/X</option>
            <option value="linkedin" ${link.platform === 'linkedin' ? 'selected' : ''}>LinkedIn</option>
            <option value="tiktok" ${link.platform === 'tiktok' ? 'selected' : ''}>TikTok</option>
            <option value="google-maps" ${link.platform === 'google-maps' ? 'selected' : ''}>Google Maps</option>
            <option value="website" ${link.platform === 'website' ? 'selected' : ''}>Website</option>
            <option value="custom" ${link.platform === 'custom' ? 'selected' : ''}>Custom Link</option>
          </select>
        </div>
        
        <!-- Link Title -->
        <div class="form-group" style="margin-bottom: 0;">
          <label>Display Title</label>
          <input type="text" class="link-title-input" value="${link.title || ''}" placeholder="e.g. Visit My Instagram">
        </div>
        
        <!-- Link URL -->
        <div class="form-group" style="margin-bottom: 0;">
          <label>URL / Web Address</label>
          <input type="text" class="link-url-input" value="${link.url || ''}" placeholder="https://...">
        </div>
      </div>

      <!-- Active Switch (Hidden inside grid or bottom margin) -->
      <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 12px; color: #94a3b8;">
        <input type="checkbox" class="link-active-checkbox" id="chk-${link.id}" ${link.active !== false ? 'checked' : ''}>
        <label for="chk-${link.id}" style="cursor: pointer; user-select: none;">Show on profile page</label>
      </div>
    `;
    
    // Add Event Listeners for editing fields in real time
    const platformSelect = item.querySelector('.link-platform-select');
    const titleInput = item.querySelector('.link-title-input');
    const urlInput = item.querySelector('.link-url-input');
    const activeCheckbox = item.querySelector('.link-active-checkbox');
    const deleteBtn = item.querySelector('.link-delete-btn');
    
    // Track modifications to this link item
    const updateLinkState = () => {
      link.platform = platformSelect.value;
      link.title = titleInput.value;
      link.url = urlInput.value;
      link.active = activeCheckbox.checked;
      
      // Update header icon dynamically
      const newIcon = platformIcons[link.platform] || 'fa-globe';
      item.querySelector('.link-drag-handle i').className = `fa-solid fa-${newIcon}`;
      
      syncPreview();
    };
    
    platformSelect.addEventListener('change', updateLinkState);
    titleInput.addEventListener('input', updateLinkState);
    urlInput.addEventListener('input', updateLinkState);
    activeCheckbox.addEventListener('change', updateLinkState);
    
    // Link Delete Handler
    deleteBtn.addEventListener('click', () => {
      state.links = state.links.filter(l => l.id !== link.id);
      renderLinksEditor();
      syncPreview();
    });
    
    linksEditorList.appendChild(item);
  });
}

// Event Listeners for Profile details Form
inputName.addEventListener('input', () => {
  state.profile.name = inputName.value;
  syncPreview();
});

inputBio.addEventListener('input', () => {
  state.profile.bio = inputBio.value;
  syncPreview();
});

inputAvatar.addEventListener('input', () => {
  state.profile.avatar = inputAvatar.value;
  syncPreview();
});

if (inputMapEmbed) {
  inputMapEmbed.addEventListener('input', () => {
    state.profile.map_embed = inputMapEmbed.value;
    syncPreview();
  });
}

// Theme selection listener
themeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const selectedTheme = btn.dataset.theme;
    state.profile.theme = selectedTheme;
    updateThemeSelectionUI(selectedTheme);
    syncPreview();
  });
});

// Add new empty link card to list
addLinkBtn.addEventListener('click', () => {
  const newLink = {
    id: Date.now().toString(),
    platform: 'custom',
    title: 'New Link',
    url: 'https://',
    clicks: 0,
    active: true
  };
  
  state.links.push(newLink);
  renderLinksEditor();
  syncPreview();
  
  // Auto-scroll to the bottom of editor
  linksEditorList.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
});

// Save details to the backend API database
saveProfileBtn.addEventListener('click', async () => {
  // Add tactile button depress visually
  saveProfileBtn.style.transform = 'translateY(4px)';
  saveProfileBtn.style.boxShadow = '0 2px 0 #4f46e5';
  
  try {
    // Try posting to local server backend
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(state)
    });
    
    if (response.ok) {
      showToast('Changes saved & synced live!');
      setTimeout(() => {
        saveProfileBtn.style.transform = '';
        saveProfileBtn.style.boxShadow = '';
      }, 100);
      return;
    }
  } catch (e) {
    console.log('Local backend not detected, trying GitHub API save...');
  }
  
  // Try GitHub API save if token is saved in localStorage
  let token = localStorage.getItem('github_token');
  if (token) token = token.trim();
  const owner = window.location.hostname.split('.')[0];
  const repo = state.repo_casing || window.location.pathname.split('/')[1] || 'my-QR';
  
  if (token && owner && owner !== 'localhost' && owner !== '127') {
    try {
      showToast('Saving directly to GitHub...');
      const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/data.json`;
      
      // Get the current file SHA
      const getRes = await fetch(fileUrl, {
        headers: { 'Authorization': `token ${token}` }
      });
      
      if (!getRes.ok) {
        throw new Error(`API Status ${getRes.status} (${getRes.statusText || 'Unauthorized/Not Found'})`);
      }
      
      const fileData = await getRes.json();
      const sha = fileData.sha;
      
      // Update the file
      const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify(state, null, 2))));
      const putRes = await fetch(fileUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Update profile config from admin dashboard',
          content: updatedContent,
          sha: sha
        })
      });
      
      if (!putRes.ok) {
        throw new Error(`API Write Status ${putRes.status}`);
      }
      
      showToast('Changes committed directly to GitHub! Live in 15s.');
      
    } catch (gitErr) {
      console.error(gitErr);
      showToast(`Sync Failed: ${gitErr.message}. Downloading data.json...`, true);
      setTimeout(downloadConfigFallback, 3000);
    }
  } else {
    downloadConfigFallback();
  }
  
  setTimeout(() => {
    saveProfileBtn.style.transform = '';
    saveProfileBtn.style.boxShadow = '';
  }, 100);
});

// Copy URL Button Handler
btnCopyUrl.addEventListener('click', () => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(serverUrl)
      .then(() => showToast('Link copied to clipboard!'))
      .catch(() => showToast('Failed to copy. Copy manually.', true));
  } else {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = serverUrl;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('Link copied to clipboard!');
    } catch (e) {
      showToast('Failed to copy. Copy manually.', true);
    }
    document.body.removeChild(textarea);
  }
});

// Toggle Avatar URL panel
toggleAvatarUrl.addEventListener('click', (e) => {
  e.preventDefault();
  if (avatarUrlWrapper.style.display === 'none') {
    avatarUrlWrapper.style.display = 'block';
    toggleAvatarUrl.innerHTML = '<i class="fa-solid fa-link-slash"></i> Hide URL input';
  } else {
    avatarUrlWrapper.style.display = 'none';
    toggleAvatarUrl.innerHTML = '<i class="fa-solid fa-link"></i> Or use image URL instead';
  }
});

// File uploader interaction
uploaderDragArea.addEventListener('click', () => {
  inputLogoFile.click();
});

// Drag and drop event handlers
['dragenter', 'dragover'].forEach(eventName => {
  uploaderDragArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    uploaderDragArea.classList.add('drag-over');
  }, false);
});

['dragleave', 'drop'].forEach(eventName => {
  uploaderDragArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    uploaderDragArea.classList.remove('drag-over');
  }, false);
});

uploaderDragArea.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  const files = dt.files;
  if (files.length > 0) {
    handleLogoFileSelect(files[0]);
  }
});

inputLogoFile.addEventListener('change', () => {
  if (inputLogoFile.files.length > 0) {
    handleLogoFileSelect(inputLogoFile.files[0]);
  }
});

// Process Selected Logo File
function handleLogoFileSelect(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file (PNG/JPG/SVG).', true);
    return;
  }
  
  if (file.size > 1024 * 1024) {
    showToast('File size too large. Maximum size is 1MB.', true);
    return;
  }
  
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    state.profile.avatar = reader.result;
    logoThumbnail.src = reader.result;
    logoFileName.textContent = file.name;
    
    uploaderDragArea.style.display = 'none';
    uploaderPreviewArea.style.display = 'flex';
    
    syncPreview();
  };
}

// Remove Logo handler
btnRemoveLogo.addEventListener('click', () => {
  state.profile.avatar = '';
  inputLogoFile.value = '';
  inputAvatar.value = '';
  
  uploaderDragArea.style.display = 'flex';
  uploaderPreviewArea.style.display = 'none';
  
  syncPreview();
});

// Save GitHub Token to localStorage
if (btnSaveToken) {
  btnSaveToken.addEventListener('click', () => {
    const token = inputGithubToken.value.trim();
    if (token === '') {
      localStorage.removeItem('github_token');
      showToast('GitHub token removed successfully!');
    } else {
      localStorage.setItem('github_token', token);
      showToast('GitHub token linked & saved securely!');
    }
  });
}

// Fallback helper to download config file data.json
function downloadConfigFallback() {
  try {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Static Mode: data.json downloaded! Upload to GitHub.');
  } catch (err) {
    console.error('Failed to trigger download:', err);
    showToast('Failed to save. Try copying text manually.', true);
  }
}

// Start initialization on page ready
document.addEventListener('DOMContentLoaded', initAdmin);
