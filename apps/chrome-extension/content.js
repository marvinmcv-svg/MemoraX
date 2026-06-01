const API_URL = 'https://api.memorax.ai' || 'http://localhost:3001';

class MemoraXWidget {
  constructor() {
    this.isOpen = false;
    this.injectStyles();
    this.createWidget();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #memorax-widget {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .memorax-toggle {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        background: linear-gradient(135deg, #6366F1 0%, #818CF8 100%);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 24px rgba(99,102,241,0.4);
        transition: all 0.2s ease;
      }
      .memorax-toggle:hover {
        transform: scale(1.05);
        box-shadow: 0 12px 32px rgba(99,102,241,0.5);
      }
      .memorax-toggle:active {
        transform: scale(0.95);
      }
      .memorax-logo {
        font-size: 24px;
        font-weight: 700;
        color: white;
      }
      #memorax-popup {
        position: absolute;
        bottom: 72px;
        right: 0;
        width: 380px;
        background: #0A0A0F;
        border-radius: 20px;
        border: 1px solid rgba(255,255,255,0.08);
        box-shadow: 0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
        opacity: 0;
        visibility: hidden;
        transform: translateY(10px) scale(0.98);
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
      }
      #memorax-popup.open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0) scale(1);
      }
      .memorax-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px;
        background: linear-gradient(180deg, rgba(99,102,241,0.1) 0%, transparent 100%);
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .memorax-logo-small {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: linear-gradient(135deg, #6366F1 0%, #818CF8 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 18px;
        color: white;
      }
      .memorax-header-title {
        flex: 1;
        font-weight: 600;
        font-size: 15px;
        color: #F8FAFC;
      }
      .memorax-close {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: rgba(255,255,255,0.06);
        border: none;
        color: #64748B;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
      }
      .memorax-close:hover {
        background: rgba(255,255,255,0.1);
        color: #F8FAFC;
      }
      .memorax-content {
        padding: 20px;
      }
      .memorax-capture-box {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 16px;
        padding: 16px;
        transition: all 0.2s ease;
      }
      .memorax-capture-box:focus-within {
        border-color: rgba(99,102,241,0.5);
        background: rgba(99,102,241,0.05);
      }
      .memorax-page-info {
        display: flex;
        align-items: center;
        gap: 10px;
        padding-bottom: 12px;
        margin-bottom: 12px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .memorax-page-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: rgba(99,102,241,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      }
      .memorax-page-details {
        flex: 1;
        min-width: 0;
      }
      .memorax-page-title {
        font-size: 13px;
        font-weight: 500;
        color: #F8FAFC;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .memorax-page-url {
        font-size: 11px;
        color: #64748B;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 2px;
      }
      #memorax-input {
        width: 100%;
        min-height: 80px;
        background: transparent;
        border: none;
        padding: 0;
        color: #F8FAFC;
        font-size: 14px;
        line-height: 1.6;
        resize: none;
        font-family: inherit;
      }
      #memorax-input:focus {
        outline: none;
      }
      #memorax-input::placeholder {
        color: #475569;
      }
      .memorax-actions {
        display: flex;
        gap: 10px;
        margin-top: 16px;
      }
      .memorax-save {
        flex: 1;
        padding: 14px 20px;
        background: linear-gradient(135deg, #6366F1 0%, #818CF8 100%);
        border: none;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(99,102,241,0.3);
      }
      .memorax-save:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(99,102,241,0.4);
      }
      .memorax-save:disabled {
        background: #2A2A3A;
        cursor: not-allowed;
        box-shadow: none;
      }
      .memorax-cancel {
        padding: 14px 20px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        color: #94A3B8;
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .memorax-cancel:hover {
        background: rgba(255,255,255,0.08);
        color: #F8FAFC;
      }
      .memorax-notification {
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 14px 20px;
        background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        color: white;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 8px 24px rgba(16,185,129,0.3);
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 2147483647;
      }
      .memorax-notification.show {
        opacity: 1;
        transform: translateY(0);
      }
      .memorax-notification.error {
        background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
        box-shadow: 0 8px 24px rgba(239,68,68,0.3);
      }
    `;
    document.head.appendChild(style);
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
          <span class="memorax-header-title">MemoraX Capture</span>
          <button id="memorax-close" class="memorax-close">&times;</button>
        </div>
        <div class="memorax-content">
          <div class="memorax-capture-box">
            <div class="memorax-page-info">
              <div class="memorax-page-icon">🌐</div>
              <div class="memorax-page-details">
                <div class="memorax-page-title" id="memorax-page-title">Loading...</div>
                <div class="memorax-page-url" id="memorax-page-url">-</div>
              </div>
            </div>
            <textarea id="memorax-input" placeholder="What's worth remembering?"></textarea>
          </div>
          <div class="memorax-actions">
            <button id="memorax-cancel" class="memorax-cancel">Clear</button>
            <button id="memorax-save" class="memorax-save">Save Memory</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(widget);

    this.bindEvents();
    this.loadPageInfo();
  }

  loadPageInfo() {
    const pageTitle = document.getElementById('memorax-page-title');
    const pageUrl = document.getElementById('memorax-page-url');

    if (window.location.href && !window.location.href.startsWith('chrome://')) {
      pageTitle.textContent = document.title || 'Untitled Page';
      pageUrl.textContent = window.location.hostname;
    }
  }

  bindEvents() {
    const toggle = document.getElementById('memorax-toggle');
    const popup = document.getElementById('memorax-popup');
    const close = document.getElementById('memorax-close');
    const save = document.getElementById('memorax-save');
    const cancel = document.getElementById('memorax-cancel');
    const input = document.getElementById('memorax-input');

    toggle.addEventListener('click', () => this.toggle());
    close.addEventListener('click', () => this.close());
    cancel.addEventListener('click', () => {
      input.value = '';
      input.focus();
    });

    save.addEventListener('click', () => this.save());

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        this.save();
      }
      if (e.key === 'Escape') {
        this.close();
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
          metadata: {
            source: 'chrome-extension-widget',
            url: window.location.href,
            title: document.title,
          },
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
      const btn = document.getElementById('memorax-save');
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }

  showNotification(message, type = 'success') {
    const existing = document.querySelector('.memorax-notification');
    if (existing) existing.remove();

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