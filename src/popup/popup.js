import { activateEyedropper } from '../content/eyedropper.js';
import { copyWithFeedback } from '../utils/clipboard.js';
import { formatColor, nextFormat } from '../utils/color.js';
import { showColor, showHistory } from '../utils/ui.js';

const elements = {
  colorHex: document.getElementById('colorHex'),
  colorSwatch: document.getElementById('colorSwatch'),
  copyButton: document.getElementById('copyColor'),
  formatToggle: document.getElementById('formatToggle'),
  historyContainer: document.getElementById('history'),
  historySection: document.getElementById('historySection'),
  pickButton: document.getElementById('pickColor'),
  resultContainer: document.getElementById('result'),
  swatchTemplate: document.getElementById('swatch-template'),
};

let currentHex = null;
let currentFormat = 'HEX';

function updateDisplay() {
  if (currentHex) showColor(currentHex, currentFormat, elements);
  elements.formatToggle.textContent = currentFormat;
}

function selectColor(hex) {
  currentHex = hex;
  updateDisplay();
  copyWithFeedback(formatColor(hex, currentFormat), elements.copyButton);
}

// Load last picked color, history, and format preference
chrome.storage.sync.get(['pickedColor', 'colorHistory', 'colorFormat'], (data) => {
  if (data.colorFormat) {
    currentFormat = data.colorFormat;
    elements.formatToggle.textContent = currentFormat;
  }
  if (data.pickedColor) {
    currentHex = data.pickedColor;
    updateDisplay();
  }
  if (data.colorHistory?.length) {
    showHistory(data.colorHistory, elements, selectColor);
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

// Copy in current format
elements.copyButton.addEventListener('click', () => {
  if (currentHex) {
    copyWithFeedback(formatColor(currentHex, currentFormat), elements.copyButton);
  }
});

// Cycle format: HEX → RGB → HSL → HEX
elements.formatToggle.addEventListener('click', () => {
  currentFormat = nextFormat(currentFormat);
  chrome.storage.sync.set({ colorFormat: currentFormat });
  updateDisplay();
});
