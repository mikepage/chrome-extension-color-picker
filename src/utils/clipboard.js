export function copyWithFeedback(text, button, label = 'Copy') {
  navigator.clipboard.writeText(text);
  button.textContent = 'Copied!';
  setTimeout(() => { button.textContent = label; }, 1000);
}
