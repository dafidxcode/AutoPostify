
// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;
const icon = themeToggle.querySelector('i');

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme') || 'light';
root.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
  const currentTheme = root.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  root.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
  icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}



let currentMediaType = 'reel';

// Handle media type selection
document.querySelectorAll('.media-button').forEach(button => {
  button.addEventListener('click', (e) => {
    // Update active state
    document.querySelectorAll('.media-button').forEach(btn => btn.classList.remove('active'));
    e.target.closest('.media-button').classList.add('active');
    
    // Update media type and file input
    currentMediaType = e.target.closest('.media-button').dataset.type;
    const mediaFile = document.getElementById('mediaFile');
    
    switch(currentMediaType) {
      case 'video':
      case 'reel':
        mediaFile.accept = 'video/*';
        break;
      case 'image':
        mediaFile.accept = 'image/*';
        break;
    }
  });
});

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const status = document.getElementById('status');
  const pageId = document.getElementById('pageId').value;
  const accessToken = document.getElementById('accessToken').value;
  const mediaFile = document.getElementById('mediaFile').files[0];
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;
  
  if (!mediaFile) {
    status.textContent = 'Please select a file';
    status.className = 'status error';
    return;
  }

  try {
    status.textContent = `Uploading ${currentMediaType}...`;
    status.className = 'status';
    
    let endpoint;
    let formData = new FormData();
    
    switch(currentMediaType) {
      case 'image':
        endpoint = `https://graph.facebook.com/v18.0/${pageId}/photos`;
        formData.append('source', mediaFile);
        formData.append('message', title);
        if (description) formData.append('description', description);
        break;
      case 'video':
      case 'reel':
        endpoint = `https://graph-video.facebook.com/v18.0/${pageId}/videos`;
        formData.append('source', mediaFile);
        formData.append('title', title);
        if (description) formData.append('description', description);
        if (currentMediaType === 'reel') {
          formData.append('is_reel_video', 'true');
          formData.append('upload_phase', 'start');
          formData.append('video_type', 'VIDEO_ASSET');
        }
        break;
    }
    
    formData.append('access_token', accessToken);
    
    // Handle scheduling
    const scheduleDateTime = document.getElementById('scheduleDateTime').value;
    if (scheduleDateTime) {
      const scheduledTime = new Date(scheduleDateTime);
      // Convert to Unix timestamp
      formData.append('scheduled_publish_time', Math.floor(scheduledTime.getTime() / 1000));
      formData.append('published', 'false');
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
      <div class="progress-circle">
        <div class="progress-circle-inner">
          <span class="progress-text">0%</span>
        </div>
      </div>
      <p class="upload-status">Uploading ${currentMediaType}...</p>
    `;
    document.body.appendChild(notification);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      onUploadProgress: (progressEvent) => {
        const percentComplete = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        const progressText = notification.querySelector('.progress-text');
        const circle = notification.querySelector('.progress-circle');
        progressText.textContent = percentComplete + '%';
        circle.style.setProperty('--progress', percentComplete);
      }
    });
    
    const data = await response.json();
    
    if (data.id) {
      status.textContent = `${currentMediaType.charAt(0).toUpperCase() + currentMediaType.slice(1)} uploaded successfully!`;
      status.className = 'status success';
    } else {
      throw new Error('Upload failed');
    }
    
  } catch (error) {
    status.textContent = `Error: ${error.message}`;
    status.className = 'status error';
  }
});
