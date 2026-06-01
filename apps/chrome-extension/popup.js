const API_URL = 'https://api.memorax.ai' || 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', () => {
  const captureForm = document.getElementById('capture-form');
  const successState = document.getElementById('success-state');
  const textarea = document.getElementById('capture-text');
  const saveBtn = document.getElementById('save-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const charCount = document.getElementById('char-count');
  const pageTitle = document.getElementById('page-title');
  const pageUrl = document.getElementById('page-url');

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (currentTab.url && !currentTab.url.startsWith('chrome://') && currentTab.url !== 'newtab://') {
      const url = new URL(currentTab.url);
      pageTitle.textContent = currentTab.title || 'Untitled Page';
      pageUrl.textContent = url.hostname;
      textarea.value = `"${currentTab.title}"\n\n`;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    } else {
      pageTitle.textContent = 'New Tab';
      pageUrl.textContent = 'No page loaded';
    }
  });

  chrome.storage.session.get('lastSelection', (result) => {
    if (result.lastSelection) {
      textarea.value = `"${result.lastSelection}"\n\n`;
      chrome.storage.session.remove('lastSelection');
    }
    updateCharCount();
  });

  function updateCharCount() {
    charCount.textContent = textarea.value.length;
  }

  textarea.addEventListener('input', updateCharCount);

  function showSuccess() {
    captureForm.classList.add('hidden');
    successState.classList.add('show');
    setTimeout(() => {
      successState.classList.remove('show');
      captureForm.classList.remove('hidden');
      textarea.value = '';
      updateCharCount();
    }, 2000);
  }

  saveBtn.addEventListener('click', async () => {
    const content = textarea.value.trim();
    if (!content) return;

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
          metadata: { source: 'chrome-extension-popup' },
        }),
      });

      if (response.ok) {
        showSuccess();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      saveBtn.textContent = 'Error - Retry';
      saveBtn.disabled = false;
      setTimeout(() => {
        saveBtn.textContent = 'Save Memory';
      }, 2000);
    }
  });

  cancelBtn.addEventListener('click', () => {
    textarea.value = '';
    updateCharCount();
    textarea.focus();
  });

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      saveBtn.click();
    }
    if (e.key === 'Escape') {
      cancelBtn.click();
    }
  });
});