import { activateEyedropper } from '../content/eyedropper.js';
import { copyWithFeedback } from '../utils/clipboard.js';
import { showColor, showHistory } from '../utils/ui.js';

const elements = {
  colorHex: document.getElementById('colorHex'),
  colorSwatch: document.getElementById('colorSwatch'),
  copyButton: document.getElementById('copyColor'),
  historyContainer: document.getElementById('history'),
  historySection: document.getElementById('historySection'),
  pickButton: document.getElementById('pickColor'),
  resultContainer: document.getElementById('result'),
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
      func: activateEyedropper,
      target: { tabId: tab.id },
    });
  } catch (error) {
    console.warn('Color Picker: cannot inject into this tab', error);
  }
  window.close();
});

elements.copyButton.addEventListener('click', () => {
  copyWithFeedback(elements.colorHex.textContent, elements.copyButton);
});
