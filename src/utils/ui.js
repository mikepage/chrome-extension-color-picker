import { formatColor } from './color.js';

export function showColor(hex, format, { colorHex, colorSwatch, resultContainer }) {
  colorSwatch.style.backgroundColor = hex;
  colorHex.textContent = formatColor(hex, format);
  resultContainer.classList.remove('hidden');
}

export function showHistory(colors, elements, onSelect) {
  const { copyButton, historyContainer, historySection, swatchTemplate } = elements;
  const items = colors.map((color) => {
    const swatch = swatchTemplate.content.firstElementChild.cloneNode(true);
    swatch.style.backgroundColor = color;
    swatch.title = color.toUpperCase();
    swatch.addEventListener('click', () => {
      onSelect(color);
    });
    return swatch;
  });
  historyContainer.replaceChildren(...items);
  historySection.classList.remove('hidden');
}
