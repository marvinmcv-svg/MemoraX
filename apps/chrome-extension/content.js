const API_URL = 'https://api.memorax.ai' || 'http://localhost:3001';

class MemoraXWidget {
  constructor() {
    this.isOpen = false;
    this.createWidget();
  }

  createWidget() {
    const widget = document.createElement('div');
    widget.id = 'memorax-widget';
    widget.innerHTML = `
      <button id="memorax-toggle" class="memorax-toggle">
        <span class="memorax-logo">M</span>
      </button>
      <div id="memorax-popup" class="memorax-popup">
        <div class="memorax-header">
          <div class="memorax-logo-small">M</div>
          <span>MemoraX Capture</span>
          <button id="memorax-close" class="memorax-close">&times;</button>
        </div>
        <div class="memorax-content">
          <textarea id="memorax-input" placeholder="What's worth remembering?"></textarea>
          <div class="memorax-actions">
            <button id="memorax-save" class="memorax-save">
              Save to MemoraX
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(widget);

    this.bindEvents();
  }

  bindEvents() {
    const toggle = document.getElementById('memorax-toggle');
    const popup = document.getElementById('memorax-popup');
    const close = document.getElementById('memorax-close');
    const save = document.getElementById('memorax-save');
    const input = document.getElementById('memorax-input');

    toggle.addEventListener('click', () => this.toggle());
    close.addEventListener('click', () => this.close());
    save.addEventListener('click', () => this.save());

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        this.save();
      }
    });
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    document.getElementById('memorax-popup').classList.add('open');
    document.getElementById('memorax-input').focus();
  }

  close() {
    this.isOpen = false;
    document.getElementById('memorax-popup').classList.remove('open');
  }

  async save() {
    const input = document.getElementById('memorax-input');
    const content = input.value.trim();

    if (!content) return;

    const saveBtn = document.getElementById('memorax-save');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    try {
      const response = await fetch(`${API_URL}/api/v1/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'app',
          channelUserId: 'chrome-extension',
          content,
          contentType: 'text',
          metadata: { source: 'chrome-extension-widget' },
        }),
      });

      if (response.ok) {
        input.value = '';
        this.close();
        this.showNotification('Memory saved!');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      this.showNotification('Failed to save memory', 'error');
    } finally {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `memorax-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new MemoraXWidget());
} else {
  new MemoraXWidget();
}
