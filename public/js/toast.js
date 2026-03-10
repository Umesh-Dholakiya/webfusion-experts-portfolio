// Toast Notification System
class ToastManager {
  constructor() {
    this.container = this.createContainer();
    this.toastId = 0;
  }

  createContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  show(message, type = 'info', duration = 5000) {
    // Prevent duplicate toasts with same content
    const existingToasts = this.container.querySelectorAll('.toast');
    for (let toast of existingToasts) {
      const contentElement = toast.querySelector('.toast-content');
      if (contentElement && contentElement.textContent === message) {
        // If we already have a toast with the same content, don't show another
        return;
      }
    }
    
    const toast = document.createElement('div');
    const id = ++this.toastId;
    
    toast.className = `toast ${type}`;
    toast.id = `toast-${id}`;
    
    const icon = this.getIcon(type);
    const progress = duration > 0 ? '<div class="toast-progress"></div>' : '';
    
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">${message}</div>
      <button class="toast-close" data-toast-id="${id}">&times;</button>
      ${progress}
    `;
    
    this.container.appendChild(toast);
    
    // Add event listener to close button
    const closeButton = toast.querySelector('.toast-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.remove(id));
    }
    
    // Trigger animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
    
    return id;
  }

  getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  remove(id) {
    const toast = document.getElementById(`toast-${id}`);
    if (toast) {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
  }

  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

// Create global instance
const toastManager = new ToastManager();

// Convenience functions
function showToast(message, type = 'info', duration = 5000) {
  return toastManager.show(message, type, duration);
}

function showSuccess(message, duration = 5000) {
  return toastManager.success(message, duration);
}

function showError(message, duration = 5000) {
  return toastManager.error(message, duration);
}

function showWarning(message, duration = 5000) {
  return toastManager.warning(message, duration);
}

function showInfo(message, duration = 5000) {
  return toastManager.info(message, duration);
}