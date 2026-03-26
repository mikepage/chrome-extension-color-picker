import { copyWithFeedback } from './clipboard.js';

export function showColor(hex, { colorSwatch, colorHex, resultContainer }) {
  colorSwatch.style.backgroundColor = hex;
  colorHex.textContent = hex.toUpperCase();
  resultContainer.classList.remove('hidden');
}

export function showHistory(colors, elements, onSelect) {
  const { historyContainer, historySection, swatchTemplate, copyButton } = elements;
  const items = colors.map((color) => {
    const swatch = swatchTemplate.content.firstElementChild.cloneNode(true);
    swatch.style.backgroundColor = color;
    swatch.title = color.toUpperCase();
    swatch.addEventListener('click', () => {
      onSelect(color);
      copyWithFeedback(color.toUpperCase(), copyButton);
    });
    return swatch;
  });
  historyContainer.replaceChildren(...items);
  historySection.classList.remove('hidden');
}
