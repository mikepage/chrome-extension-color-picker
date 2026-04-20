export function copyWithFeedback(text, button, label = 'Copy') {
  navigator.clipboard.writeText(text).then(
    () => { button.textContent = 'Copied!'; },
    () => { button.textContent = 'Failed!'; }
  );
  setTimeout(() => { button.textContent = label; }, 1000);
}
