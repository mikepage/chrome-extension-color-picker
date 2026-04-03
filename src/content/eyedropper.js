// This function is serialized and injected into the active tab via
// chrome.scripting.executeScript({ func }). It must be entirely
// self-contained — no imports or references to outer scope.
export function activateEyedropper() {
  // Prevent double-activation
  if (document.getElementById('__cp-active')) return;

  const marker = document.createElement('div');
  marker.id = '__cp-active';
  marker.style.display = 'none';
  document.body.appendChild(marker);

  // Inject page-level styles (highlight + cursor)
  const pickerStyle = document.createElement('style');
  pickerStyle.textContent = `
    .__cp-highlight { outline: 2px solid #4688f1 !important; outline-offset: -1px !important; }
    .__cp-overlay, .__cp-overlay * { cursor: crosshair !important; }
  `;
  document.head.appendChild(pickerStyle);
  document.body.classList.add('__cp-overlay');

  // Shadow DOM host for toast/hint — isolates from page CSS
  const uiHost = document.createElement('div');
  uiHost.id = '__cp-ui';
  uiHost.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;pointer-events:none;';
  document.body.appendChild(uiHost);
  const shadowRoot = uiHost.attachShadow({ mode: 'closed' });

  // Use adoptedStyleSheets for shadow DOM (no extra DOM node)
  const styleSheet = new CSSStyleSheet();
  styleSheet.replaceSync(`
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
  `);
  shadowRoot.adoptedStyleSheets = [styleSheet];

  // Toast template for cloneNode reuse
  const toastTemplate = document.createElement('template');
  toastTemplate.innerHTML = '<div class="toast"><div class="toast-swatch"></div></div>';

  // Show usage hint
  const hintElement = document.createElement('div');
  hintElement.className = 'hint';
  hintElement.textContent = 'Click text \u2192 text color \u00b7 Click bg \u2192 bg color \u00b7 Click image \u2192 pixel color \u00b7 Shift \u2192 force bg \u00b7 Esc \u2192 cancel';
  shadowRoot.appendChild(hintElement);

  let hoveredElement = null;

  function onMouseOver(event) {
    if (hoveredElement) hoveredElement.classList.remove('__cp-highlight');
    hoveredElement = event.target;
    hoveredElement.classList.add('__cp-highlight');
  }

  function onMouseOut(event) {
    event.target.classList.remove('__cp-highlight');
    if (hoveredElement === event.target) hoveredElement = null;
  }

  function rgbToHex(rgb) {
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/);
    if (!match) return rgb;
    const hex = [match[1], match[2], match[3]].map(channel => (+channel).toString(16).padStart(2, '0')).join('');
    const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
    if (alpha < 1) {
      return '#' + hex + Math.round(alpha * 255).toString(16).padStart(2, '0');
    }
    return '#' + hex;
  }

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }

  function hexToHsl(hex) {
    let { r, g, b } = hexToRgb(hex);
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function formatColor(hex, format) {
    const baseHex = hex.length > 7 ? hex.slice(0, 7) : hex;
    if (format === 'RGB') {
      const { r, g, b } = hexToRgb(baseHex);
      return `rgb(${r}, ${g}, ${b})`;
    }
    if (format === 'HSL') {
      const { h, s, l } = hexToHsl(baseHex);
      return `hsl(${h}, ${s}%, ${l}%)`;
    }
    return hex.toUpperCase();
  }

  const SVG_SHAPES = 'path, rect, circle, ellipse, polygon, polyline, line';

  // Find the relevant SVG element at the click point.
  // Handles: direct SVG target, <svg> root, pointer-events:none children,
  // and HTML wrappers containing SVGs.
  function findSVGElement(target, x, y) {
    // Direct SVG shape (path, rect, etc.)
    if (target instanceof SVGElement && !(target instanceof SVGSVGElement)) {
      return target;
    }
    // <svg> root — find first shape child
    if (target instanceof SVGSVGElement) {
      return target.querySelector(SVG_SHAPES) || target;
    }
    // Check elements at click point (handles z-stacking)
    for (const element of document.elementsFromPoint(x, y)) {
      if (element instanceof SVGElement && !(element instanceof SVGSVGElement)) return element;
      if (element instanceof SVGSVGElement) {
        return element.querySelector(SVG_SHAPES) || element;
      }
    }
    // Fallback: target contains SVG with pointer-events:none
    const svg = target.querySelector('svg');
    if (svg) {
      return svg.querySelector(SVG_SHAPES) || svg;
    }
    return null;
  }

  // Walk up the DOM to find the first non-transparent background
  function getEffectiveBackground(element) {
    let current = element;
    while (current) {
      const background = getComputedStyle(current).backgroundColor;
      if (background && background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent') return background;
      current = current.parentElement;
    }
    return 'rgb(255, 255, 255)';
  }

  // Walk up SVG tree to find the first non-none fill
  function getEffectiveFill(element) {
    let current = element;
    while (current && current instanceof SVGElement) {
      const fill = getComputedStyle(current).fill;
      if (fill && fill !== 'none' && !fill.startsWith('url(')) return fill;
      current = current.parentElement;
    }
    return getEffectiveBackground(current || document.body);
  }

  function getEffectiveStroke(element) {
    let current = element;
    while (current && current instanceof SVGElement) {
      const stroke = getComputedStyle(current).stroke;
      if (stroke && stroke !== 'none' && !stroke.startsWith('url(')) return stroke;
      current = current.parentElement;
    }
    return getComputedStyle(element).color;
  }

  // Detect image-like elements at the click point (img, canvas, video, CSS background-image)
  function findImageAtPoint(x, y) {
    for (const el of document.elementsFromPoint(x, y)) {
      if (el === uiHost || el === marker) continue;
      if (el.tagName === 'IMG' || el.tagName === 'CANVAS' || el.tagName === 'VIDEO') return el;
      const bgImage = getComputedStyle(el).backgroundImage;
      if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) return el;
    }
    return null;
  }

  // Capture visible tab screenshot and read pixel color at (x, y)
  function pickColorFromScreenshot(x, y) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'captureTab' }, (dataUrl) => {
        if (chrome.runtime.lastError || !dataUrl) {
          reject(chrome.runtime.lastError || new Error('Capture failed'));
          return;
        }
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          // captureVisibleTab captures at device pixel ratio
          const dpr = img.width / window.innerWidth;
          const px = Math.min(Math.round(x * dpr), img.width - 1);
          const py = Math.min(Math.round(y * dpr), img.height - 1);
          const [r, g, b, a] = ctx.getImageData(px, py, 1, 1).data;
          const hex = '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
          resolve(a < 255 ? hex + Math.round(a).toString(16).padStart(2, '0') : hex);
        };
        img.onerror = () => reject(new Error('Failed to load screenshot'));
        img.src = dataUrl;
      });
    });
  }

  // Block mousedown/mouseup so page JS handlers on buttons/links don't fire
  function blockEvent(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Pick color on click — preventDefault here stops link navigation
  async function onClick(event) {
    event.preventDefault();
    event.stopPropagation();

    let raw;
    let hex;
    const svgElement = findSVGElement(event.target, event.clientX, event.clientY);

    if (svgElement) {
      // SVG element found — pick fill or stroke
      raw = event.shiftKey ? getEffectiveStroke(svgElement) : getEffectiveFill(svgElement);
      hex = rgbToHex(raw).toUpperCase();
    } else if (event.shiftKey) {
      // Shift+click forces background color
      raw = getEffectiveBackground(event.target);
      hex = rgbToHex(raw).toUpperCase();
    } else {
      // Auto-detect: pick text color only if click is directly over rendered text
      const caretRange = document.caretRangeFromPoint(event.clientX, event.clientY);
      let isOverText = false;
      if (caretRange && caretRange.startContainer.nodeType === Node.TEXT_NODE) {
        const textRange = document.createRange();
        textRange.selectNodeContents(caretRange.startContainer);
        for (const rect of textRange.getClientRects()) {
          if (event.clientX >= rect.left && event.clientX <= rect.right &&
              event.clientY >= rect.top && event.clientY <= rect.bottom) {
            isOverText = true;
            break;
          }
        }
      }
      if (isOverText) {
        raw = getComputedStyle(caretRange.startContainer.parentElement).color;
        hex = rgbToHex(raw).toUpperCase();
      } else {
        // Check for image at click point — pick actual pixel color via screenshot
        const imageAtPoint = findImageAtPoint(event.clientX, event.clientY);
        if (imageAtPoint) {
          try {
            // Remove highlight before capture so it doesn't contaminate the screenshot
            if (hoveredElement) hoveredElement.classList.remove('__cp-highlight');
            hex = (await pickColorFromScreenshot(event.clientX, event.clientY)).toUpperCase();
          } catch {
            // Fall back to CSS background if screenshot fails
            raw = getEffectiveBackground(event.target);
            hex = rgbToHex(raw).toUpperCase();
          }
        } else {
          raw = getEffectiveBackground(event.target);
          hex = rgbToHex(raw).toUpperCase();
        }
      }
    }

    // Save to storage and copy in the user's preferred format
    const storageData = await new Promise(resolve =>
      chrome.storage.sync.get(['colorHistory', 'colorFormat'], resolve)
    );
    const history = (storageData.colorHistory || []).filter(color => color !== hex);
    history.unshift(hex);
    chrome.storage.sync.set({
      colorHistory: history.slice(0, 10),
      pickedColor: hex
    });

    const format = storageData.colorFormat || 'HEX';
    const displayValue = formatColor(hex, format);

    // Show toast via template cloneNode
    function showToast(message) {
      const toast = toastTemplate.content.firstElementChild.cloneNode(true);
      toast.querySelector('.toast-swatch').style.backgroundColor = hex;
      toast.appendChild(document.createTextNode(message));
      shadowRoot.appendChild(toast);
      setTimeout(() => toast.remove(), 1500);
    }

    // Copy formatted value to clipboard, show toast, then clean up
    await navigator.clipboard.writeText(displayValue).then(
      () => showToast('Copied ' + displayValue),
      () => showToast(displayValue + ' (copy failed)')
    );

    cleanup();
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
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
    if (hoveredElement) hoveredElement.classList.remove('__cp-highlight');
    document.body.classList.remove('__cp-overlay');
    pickerStyle.remove();
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
