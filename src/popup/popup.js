import { showColor, showHistory } from '../utils/ui.js';
import { copyWithFeedback } from '../utils/clipboard.js';
import { activateEyedropper } from '../content/eyedropper.js';

const els = {
  pickBtn: document.getElementById('pickColor'),
  resultDiv: document.getElementById('result'),
  colorSwatch: document.getElementById('colorSwatch'),
  colorHex: document.getElementById('colorHex'),
  copyBtn: document.getElementById('copyColor'),
  historySection: document.getElementById('historySection'),
  historyDiv: document.getElementById('history'),
  swatchTpl: document.getElementById('swatch-tpl'),
};

// Load last picked color and history
chrome.storage.sync.get(['pickedColor', 'colorHistory'], (data) => {
  if (data.pickedColor) showColor(data.pickedColor, els);
  if (data.colorHistory?.length) {
    showHistory(data.colorHistory, els, (color) => showColor(color, els));
  }
});

// Inject eyedropper into active tab
els.pickBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: activateEyedropper,
    });
  } catch (err) {
    console.warn('Color Picker: cannot inject into this tab', err);
  }
  window.close();
});

els.copyBtn.addEventListener('click', () => {
  copyWithFeedback(els.colorHex.textContent, els.copyBtn);
});
