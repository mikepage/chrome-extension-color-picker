import { copyWithFeedback } from './clipboard.js';

export function showColor(hex, { colorSwatch, colorHex, resultDiv }) {
  colorSwatch.style.backgroundColor = hex;
  colorHex.textContent = hex.toUpperCase();
  resultDiv.classList.remove('hidden');
}

export function showHistory(colors, els, onSelect) {
  const { historyDiv, historySection, swatchTpl, copyBtn } = els;
  const items = colors.map((color) => {
    const swatch = swatchTpl.content.firstElementChild.cloneNode(true);
    swatch.style.backgroundColor = color;
    swatch.title = color.toUpperCase();
    swatch.addEventListener('click', () => {
      onSelect(color);
      copyWithFeedback(color.toUpperCase(), copyBtn);
    });
    return swatch;
  });
  historyDiv.replaceChildren(...items);
  historySection.classList.remove('hidden');
}
