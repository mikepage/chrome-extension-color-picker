const pickBtn = document.getElementById('pickColor');
const resultDiv = document.getElementById('result');
const colorSwatch = document.getElementById('colorSwatch');
const colorHex = document.getElementById('colorHex');
const copyBtn = document.getElementById('copyColor');
const historySection = document.getElementById('historySection');
const historyDiv = document.getElementById('history');

// Load last picked color and history
chrome.storage.sync.get(['pickedColor', 'colorHistory'], (data) => {
  if (data.pickedColor) showColor(data.pickedColor);
  if (data.colorHistory?.length) showHistory(data.colorHistory);
});

function showColor(hex) {
  colorSwatch.style.backgroundColor = hex;
  colorHex.textContent = hex.toUpperCase();
  resultDiv.classList.remove('hidden');
}

function showHistory(colors) {
  historyDiv.replaceChildren();
  for (const color of colors) {
    const swatch = document.createElement('div');
    swatch.className = 'history-swatch';
    swatch.style.backgroundColor = color;
    swatch.title = color.toUpperCase();
    swatch.addEventListener('click', () => {
      navigator.clipboard.writeText(color.toUpperCase());
      showColor(color);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1000);
    });
    historyDiv.appendChild(swatch);
  }
  historySection.classList.remove('hidden');
}

// Inject eyedropper into active tab
pickBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: activateEyedropper
    });
  } catch (err) {
    console.warn('Color Picker: cannot inject into this tab', err);
  }
  window.close();
});

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(colorHex.textContent);
  copyBtn.textContent = 'Copied!';
  setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1000);
});

// This function is serialized and injected into the active tab as a content script.
// It must be entirely self-contained — no references to outer scope.
function activateEyedropper() {
  // Prevent double-activation
  if (document.getElementById('__cp-active')) return;

  const marker = document.createElement('div');
  marker.id = '__cp-active';
  marker.style.display = 'none';
  document.body.appendChild(marker);

  // Inject page-level styles (highlight + cursor)
  const style = document.createElement('style');
  style.textContent = `
    .__cp-highlight { outline: 2px solid #4688f1 !important; outline-offset: -1px !important; }
    .__cp-overlay, .__cp-overlay * { cursor: crosshair !important; }
  `;
  document.head.appendChild(style);
  document.body.classList.add('__cp-overlay');

  // Shadow DOM host for toast/hint — isolates from page CSS
  const uiHost = document.createElement('div');
  uiHost.id = '__cp-ui';
  uiHost.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;pointer-events:none;';
  document.body.appendChild(uiHost);
  const shadow = uiHost.attachShadow({ mode: 'closed' });
  const uiStyle = document.createElement('style');
  uiStyle.textContent = `
    .toast {
      position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
      display: flex; align-items: center; gap: 8px;
      background: #222; color: #fff; padding: 8px 14px; border-radius: 6px;
      font: 13px/1 -apple-system, BlinkMacSystemFont, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,.3); pointer-events: auto;
    }
    .toast-swatch {
      width: 18px; height: 18px; border-radius: 3px;
      border: 1px solid rgba(255,255,255,.2);
    }
    .hint {
      position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
      background: #222; color: #aaa; padding: 6px 12px; border-radius: 4px;
      font: 12px/1 -apple-system, BlinkMacSystemFont, sans-serif;
      white-space: nowrap; pointer-events: auto;
    }
  `;
  shadow.appendChild(uiStyle);

  // Show usage hint
  const hint = document.createElement('div');
  hint.className = 'hint';
  hint.textContent = 'Click text \u2192 text color \u00b7 Click bg \u2192 bg color \u00b7 Shift \u2192 force bg \u00b7 Esc \u2192 cancel';
  shadow.appendChild(hint);

  let hoveredEl = null;

  function onMouseOver(e) {
    if (hoveredEl) hoveredEl.classList.remove('__cp-highlight');
    hoveredEl = e.target;
    hoveredEl.classList.add('__cp-highlight');
  }

  function onMouseOut(e) {
    e.target.classList.remove('__cp-highlight');
    if (hoveredEl === e.target) hoveredEl = null;
  }

  function rgbToHex(rgb) {
    const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/);
    if (!m) return rgb;
    const hex = [m[1], m[2], m[3]].map(x => (+x).toString(16).padStart(2, '0')).join('');
    const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
    if (a < 1) {
      return '#' + hex + Math.round(a * 255).toString(16).padStart(2, '0');
    }
    return '#' + hex;
  }

  function isSVG(el) {
    return el instanceof SVGElement && !(el instanceof SVGSVGElement);
  }

  // Walk up the DOM to find the first non-transparent background
  function getEffectiveBg(el) {
    let cur = el;
    while (cur) {
      const bg = getComputedStyle(cur).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
      cur = cur.parentElement;
    }
    return 'rgb(255, 255, 255)';
  }

  // Walk up SVG tree to find the first non-none fill
  function getEffectiveFill(el) {
    let cur = el;
    while (cur && cur instanceof SVGElement) {
      const fill = getComputedStyle(cur).fill;
      if (fill && fill !== 'none' && !fill.startsWith('url(')) return fill;
      cur = cur.parentElement;
    }
    return getEffectiveBg(cur || document.body);
  }

  function getEffectiveStroke(el) {
    let cur = el;
    while (cur && cur instanceof SVGElement) {
      const stroke = getComputedStyle(cur).stroke;
      if (stroke && stroke !== 'none' && !stroke.startsWith('url(')) return stroke;
      cur = cur.parentElement;
    }
    return getComputedStyle(el).color;
  }

  // Block mousedown/mouseup so page JS handlers on buttons/links don't fire
  function blockEvent(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Pick color on click — preventDefault here stops link navigation
  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();

    let raw;
    if (isSVG(e.target)) {
      raw = e.shiftKey ? getEffectiveStroke(e.target) : getEffectiveFill(e.target);
    } else if (e.shiftKey) {
      // Shift+click forces background color
      raw = getEffectiveBg(e.target);
    } else {
      // Auto-detect: if click landed on text, pick text color; otherwise background
      const range = document.caretRangeFromPoint(e.clientX, e.clientY);
      if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
        raw = getComputedStyle(range.startContainer.parentElement).color;
      } else {
        raw = getEffectiveBg(e.target);
      }
    }
    const hex = rgbToHex(raw).toUpperCase();

    // Save to storage with history
    chrome.storage.sync.get('colorHistory', (data) => {
      const history = (data.colorHistory || []).filter(c => c !== hex);
      history.unshift(hex);
      chrome.storage.sync.set({
        pickedColor: hex,
        colorHistory: history.slice(0, 10)
      });
    });

    // Show toast in shadow DOM
    function showToast(msg) {
      const toast = document.createElement('div');
      toast.className = 'toast';
      const sw = document.createElement('div');
      sw.className = 'toast-swatch';
      sw.style.backgroundColor = hex;
      toast.appendChild(sw);
      toast.appendChild(document.createTextNode(msg));
      shadow.appendChild(toast);
      setTimeout(() => toast.remove(), 1500);
    }

    // Copy to clipboard with feedback
    navigator.clipboard.writeText(hex).then(
      () => showToast('Copied ' + hex),
      () => showToast(hex + ' (copy failed)')
    );

    cleanup();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      cleanup();
    }
  }

  function cleanup() {
    document.removeEventListener('mouseover', onMouseOver, true);
    document.removeEventListener('mouseout', onMouseOut, true);
    document.removeEventListener('mousedown', blockEvent, true);
    document.removeEventListener('mouseup', blockEvent, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
    if (hoveredEl) hoveredEl.classList.remove('__cp-highlight');
    document.body.classList.remove('__cp-overlay');
    style.remove();
    marker.remove();
    // Delay removing shadow host so toast can finish displaying
    setTimeout(() => uiHost.remove(), 2000);
  }

  document.addEventListener('mouseover', onMouseOver, true);
  document.addEventListener('mouseout', onMouseOut, true);
  document.addEventListener('mousedown', blockEvent, true);
  document.addEventListener('mouseup', blockEvent, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);
}
