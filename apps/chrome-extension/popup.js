const API_URL = 'https://api.memorax.ai' || 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('capture-text');
  const saveBtn = document.getElementById('save-btn');

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (currentTab.url && currentTab.url !== 'chrome://newtab/') {
      textarea.value = `Page: ${currentTab.title}\nURL: ${currentTab.url}\n\n`;
    }
  });

  chrome.storage.session.get('lastSelection', (result) => {
    if (result.lastSelection) {
      textarea.value = `"${result.lastSelection}"\n\n`;
      chrome.storage.session.remove('lastSelection');
    }
  });

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
        textarea.value = '';
        saveBtn.textContent = 'Saved!';
        setTimeout(() => {
          saveBtn.textContent = 'Save Memory';
          saveBtn.disabled = false;
        }, 1500);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      saveBtn.textContent = 'Error - Retry';
      saveBtn.disabled = false;
    }
  });

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      saveBtn.click();
    }
  });
});
