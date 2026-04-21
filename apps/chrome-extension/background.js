const API_URL = 'https://api.memorax.ai' || 'http://localhost:3001';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'saveToMemoraX',
    title: 'Save to MemoraX',
    contexts: ['selection', 'page']
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === 'saveToMemoraX') {
    const selection = info.selectionText || '';
    const url = info.pageUrl || '';

    let content = selection;
    if (!selection && url) {
      content = `Page: ${url}`;
    } else if (selection && url) {
      content = `"${selection}"\n\nSource: ${url}`;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: 'app',
          channelUserId: 'chrome-extension',
          content,
          contentType: 'text',
          metadata: {
            source: 'chrome-extension',
            url,
            selectedText: selection,
          },
        }),
      });

      if (response.ok) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'MemoraX',
          message: 'Memory saved successfully!'
        });
      }
    } catch (error) {
      console.error('Failed to save to MemoraX:', error);
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'capturePage') {
    capturePage(request.data).then(sendResponse);
    return true;
  }
});

async function capturePage(data) {
  try {
    const response = await fetch(`${API_URL}/api/v1/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: 'app',
        channelUserId: 'chrome-extension',
        content: data.content,
        contentType: 'link',
        mediaUrl: data.url,
        metadata: {
          source: 'chrome-extension',
          title: data.title,
          url: data.url,
        },
      }),
    });

    return { success: response.ok };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
