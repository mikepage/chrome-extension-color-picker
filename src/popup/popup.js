import { showColor, showHistory } from '../utils/ui.js';
import { copyWithFeedback } from '../utils/clipboard.js';
import { activateEyedropper } from '../content/eyedropper.js';

const elements = {
  pickButton: document.getElementById('pickColor'),
  resultContainer: document.getElementById('result'),
  colorSwatch: document.getElementById('colorSwatch'),
  colorHex: document.getElementById('colorHex'),
  copyButton: document.getElementById('copyColor'),
  historySection: document.getElementById('historySection'),
  historyContainer: document.getElementById('history'),
  swatchTemplate: document.getElementById('swatch-template'),
};

// Load last picked color and history
chrome.storage.sync.get(['pickedColor', 'colorHistory'], (data) => {
  if (data.pickedColor) showColor(data.pickedColor, elements);
  if (data.colorHistory?.length) {
    showHistory(data.colorHistory, elements, (color) => showColor(color, elements));
  }
});

// Inject eyedropper into active tab
elements.pickButton.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: activateEyedropper,
    });
  } catch (error) {
    console.warn('Color Picker: cannot inject into this tab', error);
  }
  window.close();
});

elements.copyButton.addEventListener('click', () => {
  copyWithFeedback(elements.colorHex.textContent, elements.copyButton);
});
