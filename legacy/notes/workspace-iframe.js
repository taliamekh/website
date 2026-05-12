/**
 * Workspace toolbar for the notes iframe (the floating bar over your study page).
 *
 * If you want to change how something looks, search this file for "injectBaseCss" — that function
 * holds almost all CSS as one long text block.
 *
 * The parent study page saves your drawings and some settings; this file sends updates with
 * window.parent.postMessage({ type: '...' }, '*'). Search for "postMessage" to see each message name.
 * Includes tm_notes_expand_toggle (study-guide iframe only) and tm_formula_sheet_toggle (both iframes).
 * Shortcuts (when focus is not in an input; Mac uses Cmd where Ctrl appears): Ctrl+H toggles highlighter;
 * Ctrl+Shift+S asks the parent for a new sticky (study guide only); Ctrl+A toggles arrow (pen) tool;
 * Ctrl+Z / Ctrl+Y undo and redo drawings (unchanged).
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  // --- Drawing list on the page (arrows, circles, etc.) — each entry uses percents so it scales with scroll ---
  var items = [];
  // Which drawing is selected when you use the pointer tool (null = none).
  var selId = null;
  var drawMode = null;
  var drawState = null;
  var svg = null;
  var previewEl = null;
  var bar = null;
  var minEl = null;
  var collapsed = true;
  var activeToolKind = 'pointer';
  var orientation = 'horizontal';
  var activeStyle = { color: '#e8eef8', fontSizePt: 14, lineWidthPt: 2.8, dashStyle: 'solid' };
  var DEFAULT_PRESET_COLORS = ['#E63946', '#fbbf24', '#5eaeff', '#f472b6', '#5ee09a'];
  var colorSlots = DEFAULT_PRESET_COLORS.slice();
  var drawingClipboard = null;
  var shapeCtxEl = null;
  var presetScrollWrap = null;
  var slotRowEl = null;
  var slotEls = [];
  var inlineSlotEls = [];
  var popShapes = null;
  var popStyle = null;
  var inpPt = null;
  var inpRange = null;
  var inpColor = null;
  var btnDashSolid = null;
  var btnDashDot = null;
  var btnDashDash = null;
  var btnPointer = null;
  var btnHl = null;
  var btnEraser = null;
  var btnPen = null;
  var btnShapesToggle = null;
  var btnStyleToggle = null;
  var btnCollapse = null;
  /** Toggles parent-page “expand notes” layout — hidden when parent sets showNotesExpandToggle: false (formula iframe). */
  var btnNotesExpandLayout = null;
  /** Opens or closes the formula sheet panel on the parent page (hidden if showFormulaSheetToggle is false). */
  var btnFormulaSheetToggle = null;
  /** Toggles an in-page notes sidebar (only shown if #sidebar exists + showSidebarToggle !== false). */
  var btnSidebarToggle = null;
  var sidebarCollapsed = false;
  var nativeWrap = null;
  var chromeRoot = null;
  var wrapShapesRoot = null;
  var wrapStyleRoot = null;
  // --- Undo / redo memory (tagged: drawings OR highlights, chronological) ---
  var MAX_UNDO = 80;
  var undoStack = []; // entries: { kind: 'draw'|'hl', snap: ... }
  var redoStack = [];
  var btnUndo = null;
  var btnRedo = null;
  var chromeHead = null;
  var MAX_PRESET_COLORS = 48;
  var MAX_COLOR_RECENT = 20;
  var colorRecentList = [];
  var popColorManage = null;
  var btnAddPresetSlot = null;
  // Extra highlighter text colors (dots in the bar) — stored separately from arrow/shape color presets.
  var MAX_HL_SLOTS = 24;
  var DEFAULT_HL_COLORS = ['#fff59d', '#ffcc80', '#a5d6a7', '#90caf9', '#ce93d8'];
  var hlColorSlots = DEFAULT_HL_COLORS.slice();
  var hlExtraInner = null;
  var btnHlSlotAdd = null;
  var popHlManage = null;
  function normalizeHlHex(s) {
    if (!s || typeof s !== 'string') return '';
    var t = s.trim();
    if (!/^#/i.test(t)) return '';
    if (t.length === 4)
      return ('#' + t[1] + t[1] + t[2] + t[2] + t[3] + t[3]).toLowerCase();
    if (t.length >= 7) return t.slice(0, 7).toLowerCase();
    return '';
  }
  var hlPopAddBtn = null;
  function refreshHlAddBtnState() {
    if (!hlPopAddBtn) return;
    hlPopAddBtn.disabled = hlColorSlots.length >= MAX_HL_SLOTS;
    hlPopAddBtn.title =
      hlColorSlots.length >= MAX_HL_SLOTS
        ? 'Maximum ' + MAX_HL_SLOTS + ' highlighter presets — remove one (right-click → change) or clear storage'
        : 'Add the picker color to the highlighter strip';
  }
  // When you drag a drawing in pointer mode, this remembers the gesture until you release the mouse/finger.
  var shapeMoveDrag = null;

  function docSize() {
    var dw = Math.max(document.documentElement.scrollWidth || 0, document.body.scrollWidth || 0, 1);
    var dh = Math.max(document.documentElement.scrollHeight || 0, document.body.scrollHeight || 0, 1);
    return { dw: dw, dh: dh };
  }
  function upsizeSvg() {
    if (!svg) return;
    var d = docSize();
    svg.style.width = d.dw + 'px';
    svg.style.height = d.dh + 'px';
    svg.setAttribute('width', d.dw);
    svg.setAttribute('height', d.dh);
  }
  function toDoc(ev) {
    var x, y;
    if (ev.changedTouches && ev.changedTouches[0]) {
      x = ev.changedTouches[0].clientX;
      y = ev.changedTouches[0].clientY;
    } else if (ev.touches && ev.touches[0]) {
      x = ev.touches[0].clientX;
      y = ev.touches[0].clientY;
    } else {
      x = ev.clientX;
      y = ev.clientY;
    }
    return { x: x + window.scrollX, y: y + window.scrollY };
  }
  function dashArray(style, lw) {
    if (style === 'dotted') return String(lw * 0.8) + ' ' + String(lw * 2);
    if (style === 'dashed') return String(lw * 3) + ' ' + String(lw * 2);
    return '';
  }
  function migrateItems(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map(function (it) {
      if (!it.type) it.type = 'arrow';
      return it;
    });
  }
  function snapshotItemsDeep() {
    return JSON.parse(JSON.stringify(items));
  }
  // Snapshot all highlight marks (text + slot) so we can undo highlight creation/removal.
  function snapshotHlMarks() {
    try {
      return Array.prototype.map.call(document.querySelectorAll('mark.usr'), function (m) {
        var slot = parseInt(m.getAttribute('data-slot') || '0', 10);
        if (isNaN(slot) || slot < 0 || slot > 4) slot = 0;
        return { text: m.textContent, slot: slot };
      });
    } catch (e) { return []; }
  }
  // Restore marks from a snapshot (used by undoDraw/redoDraw when entry.kind === 'hl').
  function restoreHlFromSnapshot(snap) {
    if (!Array.isArray(snap)) return;
    try {
      // Strip existing marks first
      if (window.__TM_SR_HL && typeof window.__TM_SR_HL.strip === 'function') {
        window.__TM_SR_HL.strip();
      } else {
        document.querySelectorAll('mark.usr').forEach(function (m) {
          var p = m.parentNode; if (!p) return;
          while (m.firstChild) p.insertBefore(m.firstChild, m);
          p.removeChild(m);
        });
      }
      // Re-wrap
      var wrap = (window.__TM_SR_HL && window.__TM_SR_HL.wrapOnce) || null;
      for (var i = 0; i < snap.length; i++) {
        var it = snap[i]; if (!it || it.text == null) continue;
        if (wrap) wrap(String(it.text), (typeof it.slot === 'number' ? it.slot : 0));
      }
      if (typeof window.__TM_SR_HL_REWIRE === 'function') window.__TM_SR_HL_REWIRE();
      if (typeof saveHL === 'function') saveHL();
    } catch (e) { /* ignore */ }
  }
  function resetDrawHistory() {
    undoStack = [];
    redoStack = [];
    syncUndoRedoBtns();
  }
  function syncUndoRedoBtns() {
    // Use aria-disabled + class (not the HTML disabled attribute) so the buttons still receive
    // click/touch events reliably; guards inside undoDraw/redoDraw remain the source of truth.
    if (btnUndo) {
      var noUndo = undoStack.length === 0;
      btnUndo.classList.toggle('tm-ws-head-btn--disabled', noUndo);
      btnUndo.setAttribute('aria-disabled', noUndo ? 'true' : 'false');
    }
    if (btnRedo) {
      var noRedo = redoStack.length === 0;
      btnRedo.classList.toggle('tm-ws-head-btn--disabled', noRedo);
      btnRedo.setAttribute('aria-disabled', noRedo ? 'true' : 'false');
    }
  }
  // Snapshot drawings before a change so Undo can restore them.
  function pushDrawHistory() {
    undoStack.push({ kind: 'draw', snap: snapshotItemsDeep() });
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack = [];
    syncUndoRedoBtns();
  }
  // Snapshot highlight marks before a change so Undo can restore them.
  function pushHlHistory() {
    undoStack.push({ kind: 'hl', snap: snapshotHlMarks() });
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack = [];
    syncUndoRedoBtns();
  }
  // Bridge for the in-iframe persistence script (eraser click path) — must match what
  // injectHighlightPersistence in index.html looks up (window.__TM_PUSH_HL_HISTORY).
  window.__TM_PUSH_HL_HISTORY = pushHlHistory;
  function undoDraw() {
    if (!undoStack.length) return;
    var entry = undoStack.pop();
    if (entry && entry.kind === 'hl') {
      redoStack.push({ kind: 'hl', snap: snapshotHlMarks() });
      restoreHlFromSnapshot(entry.snap);
    } else {
      redoStack.push({ kind: 'draw', snap: snapshotItemsDeep() });
      items = migrateItems(entry && entry.snap ? entry.snap : []);
      saveDrawings();
      render();
    }
    syncUndoRedoBtns();
  }
  function redoDraw() {
    if (!redoStack.length) return;
    var entry = redoStack.pop();
    if (entry && entry.kind === 'hl') {
      undoStack.push({ kind: 'hl', snap: snapshotHlMarks() });
      restoreHlFromSnapshot(entry.snap);
    } else {
      undoStack.push({ kind: 'draw', snap: snapshotItemsDeep() });
      items = migrateItems(entry && entry.snap ? entry.snap : []);
      saveDrawings();
      render();
    }
    syncUndoRedoBtns();
  }
  function positionPopNear(anchor, pop) {
    if (!anchor || !pop) return;
    document.body.appendChild(pop);
    pop.style.position = 'fixed';
    pop.style.zIndex = '10070';
    pop.style.right = 'auto';
    pop.style.bottom = 'auto';
    pop.style.maxWidth = 'min(96vw, 340px)';
    pop.style.marginTop = '0';
    pop.style.visibility = 'hidden';
    void pop.offsetWidth;
    var pr = pop.getBoundingClientRect();
    var pw = pr.width || 240;
    var ph = pr.height || 120;
    pop.style.visibility = '';
    var r = anchor.getBoundingClientRect();
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var left = Math.max(8, Math.min(r.left, vw - pw - 8));
    var top = Math.max(8, Math.min(r.bottom + 6, vh - ph - 8));
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
  }
  function saveDrawings() {
    try {
      // Tell parent page to save the list of drawings (arrows, shapes).
      window.parent.postMessage({ type: 'tm_drawings_save', payload: JSON.stringify(items) }, '*');
    } catch (e) {}
  }
  function saveGlobalStyle() {
    try {
      // Tell parent page to save default line color, thickness, dash style for new drawings.
      window.parent.postMessage({ type: 'tm_global_style_save', payload: JSON.stringify(activeStyle) }, '*');
    } catch (e) {}
  }
  function saveColorSlots() {
    try {
      // Tell parent page to save the round preset dots used for arrows/shapes (not highlighter dots).
      window.parent.postMessage({ type: 'tm_color_slots_save', payload: JSON.stringify(colorSlots) }, '*');
    } catch (e) {}
  }
  function saveBarState() {
    if (!bar) return;
    var r = bar.getBoundingClientRect();
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    if (vw < 1 || vh < 1) return;
    var lp = (r.left / vw) * 100;
    var tp = (r.top / vh) * 100;
    try {
      // Remember toolbar position and collapsed/expanded on the parent page.
      window.parent.postMessage(
        { type: 'tm_hl_bar_save', leftPct: lp, topPct: tp, orientation: 'horizontal', collapsed: collapsed },
        '*'
      );
    } catch (e2) {}
  }
  function clampBarIntoView() {
    if (!bar) return;
    var vw = window.innerWidth || 1;
    var vh = window.innerHeight || 1;
    var mSide = 10;
    var mTop = 48;
    var mBot = 10;
    var r = bar.getBoundingClientRect();
    var nl = Math.max(mSide, Math.min(r.left, vw - r.width - mSide));
    var nt = Math.max(mTop, Math.min(r.top, vh - r.height - mBot));
    if (Math.abs(nl - r.left) > 0.5 || Math.abs(nt - r.top) > 0.5) {
      bar.style.transform = 'none';
      bar.style.left = (nl / vw) * 100 + '%';
      bar.style.top = (nt / vh) * 100 + '%';
      bar.style.right = 'auto';
      bar.style.bottom = 'auto';
    }
  }
  function applyStroke(el, it) {
    var lw = it.lineWidthPt != null ? it.lineWidthPt : activeStyle.lineWidthPt;
    var c = it.color || activeStyle.color;
    var ds = it.dashStyle || activeStyle.dashStyle;
    el.setAttribute('stroke', c);
    el.setAttribute('stroke-width', String(lw));
    var da = dashArray(ds, lw);
    if (da) el.setAttribute('stroke-dasharray', da);
    else el.removeAttribute('stroke-dasharray');
    if (it.type === 'arrow') el.setAttribute('stroke-linecap', 'round');
  }
  function arrowShaftAndHead(x1, y1, x2, y2, lw) {
    var ang = Math.atan2(y2 - y1, x2 - x1);
    var head = Math.max(10, Math.min(28, lw * 3.2));
    var ex = x2 - head * Math.cos(ang);
    var ey = y2 - head * Math.sin(ang);
    var wing = head * 0.42;
    var lx = ex + wing * Math.sin(ang);
    var ly = ey - wing * Math.cos(ang);
    var rx = ex - wing * Math.sin(ang);
    var ry = ey + wing * Math.cos(ang);
    return { shaft: 'M ' + x1 + ' ' + y1 + ' L ' + ex + ' ' + ey, headPts: [x2, y2, lx, ly, rx, ry] };
  }
  function render() {
    if (!svg) return;
    upsizeSvg();
    var d = docSize();
    svg.querySelectorAll('[data-sid]').forEach(function (n) {
      n.parentNode.removeChild(n);
    });
    items.forEach(function (it) {
      var el;
      if (it.type === 'arrow') {
        var x1a = (it.x1p / 100) * d.dw;
        var y1a = (it.y1p / 100) * d.dh;
        var x2a = (it.x2p / 100) * d.dw;
        var y2a = (it.y2p / 100) * d.dh;
        var lwA = it.lineWidthPt != null ? it.lineWidthPt : activeStyle.lineWidthPt;
        var g = document.createElementNS(NS, 'g');
        g.setAttribute('data-sid', it.id);
        g.setAttribute('class', 'tm-sh' + (it.id === selId ? ' sel' : ''));
        g.setAttribute('pointer-events', 'visiblePainted');
        var geo = arrowShaftAndHead(x1a, y1a, x2a, y2a, lwA);
        var hitShaft = document.createElementNS(NS, 'path');
        hitShaft.setAttribute('d', geo.shaft);
        hitShaft.setAttribute('class', 'tm-sh-hit');
        hitShaft.setAttribute('fill', 'none');
        hitShaft.setAttribute('stroke', 'rgba(0,0,0,0.02)');
        hitShaft.setAttribute('stroke-width', String(Math.max(20, lwA * 3.2)));
        hitShaft.setAttribute('stroke-linecap', 'round');
        var shaft = document.createElementNS(NS, 'path');
        shaft.setAttribute('d', geo.shaft);
        shaft.setAttribute('fill', 'none');
        applyStroke(shaft, it);
        var head = document.createElementNS(NS, 'polygon');
        head.setAttribute('points', geo.headPts[0] + ',' + geo.headPts[1] + ' ' + geo.headPts[2] + ',' + geo.headPts[3] + ' ' + geo.headPts[4] + ',' + geo.headPts[5]);
        head.setAttribute('fill', it.color || activeStyle.color);
        head.setAttribute('stroke', 'none');
        head.setAttribute('pointer-events', 'all');
        g.appendChild(hitShaft);
        g.appendChild(shaft);
        g.appendChild(head);
        svg.appendChild(g);
        return;
      } else if (it.type === 'underline') {
        var lwU = it.lineWidthPt != null ? it.lineWidthPt : activeStyle.lineWidthPt;
        var gU = document.createElementNS(NS, 'g');
        gU.setAttribute('data-sid', it.id);
        gU.setAttribute('class', 'tm-sh' + (it.id === selId ? ' sel' : ''));
        gU.setAttribute('pointer-events', 'visiblePainted');
        var hitU = document.createElementNS(NS, 'line');
        hitU.setAttribute('x1', String((it.x1p / 100) * d.dw));
        hitU.setAttribute('y1', String((it.y1p / 100) * d.dh));
        hitU.setAttribute('x2', String((it.x2p / 100) * d.dw));
        hitU.setAttribute('y2', String((it.y2p / 100) * d.dh));
        hitU.setAttribute('class', 'tm-sh-hit');
        hitU.setAttribute('stroke', 'rgba(0,0,0,0.02)');
        hitU.setAttribute('stroke-width', String(Math.max(18, lwU * 3)));
        hitU.setAttribute('stroke-linecap', 'round');
        el = document.createElementNS(NS, 'line');
        el.setAttribute('x1', String((it.x1p / 100) * d.dw));
        el.setAttribute('y1', String((it.y1p / 100) * d.dh));
        el.setAttribute('x2', String((it.x2p / 100) * d.dw));
        el.setAttribute('y2', String((it.y2p / 100) * d.dh));
        el.setAttribute('pointer-events', 'none');
        applyStroke(el, it);
        gU.appendChild(hitU);
        gU.appendChild(el);
        svg.appendChild(gU);
        return;
      } else if (it.type === 'circle') {
        el = document.createElementNS(NS, 'ellipse');
        el.setAttribute('cx', String((it.cxp / 100) * d.dw));
        el.setAttribute('cy', String((it.cyp / 100) * d.dh));
        el.setAttribute('rx', String((it.rxp / 100) * d.dw));
        el.setAttribute('ry', String((it.ryp / 100) * d.dh));
        el.setAttribute('fill', 'rgba(0,0,0,0.001)');
        el.setAttribute('pointer-events', 'all');
      } else if (it.type === 'square') {
        el = document.createElementNS(NS, 'rect');
        el.setAttribute('x', String((it.xp / 100) * d.dw));
        el.setAttribute('y', String((it.yp / 100) * d.dh));
        el.setAttribute('width', String((it.wp / 100) * d.dw));
        el.setAttribute('height', String((it.hp / 100) * d.dh));
        el.setAttribute('fill', 'rgba(0,0,0,0.001)');
        el.setAttribute('pointer-events', 'all');
      } else return;
      el.setAttribute('class', 'tm-sh');
      el.setAttribute('data-sid', it.id);
      applyStroke(el, it);
      if (it.id === selId) el.classList.add('sel');
      svg.appendChild(el);
    });
  }
  function addItem(it) {
    pushDrawHistory();
    items.push(it);
    saveDrawings();
    render();
    syncUndoRedoBtns();
  }
  function delItem(id) {
    pushDrawHistory();
    items = items.filter(function (x) {
      return x.id !== id;
    });
    if (selId === id) selId = null;
    saveDrawings();
    render();
    syncUndoRedoBtns();
  }
  function getItemById(id) {
    return items.filter(function (x) {
      return x.id === id;
    })[0];
  }
  function offsetDrawingClone(dup, oxPct, oyPct) {
    if (dup.type === 'arrow') {
      dup.x1p += oxPct;
      dup.y1p += oyPct;
      dup.x2p += oxPct;
      dup.y2p += oyPct;
    } else if (dup.type === 'underline') {
      dup.x1p += oxPct;
      dup.y1p += oyPct;
      dup.x2p += oxPct;
      dup.y2p += oyPct;
    } else if (dup.type === 'circle') {
      dup.cxp += oxPct;
      dup.cyp += oyPct;
    } else if (dup.type === 'square') {
      dup.xp += oxPct;
      dup.yp += oyPct;
    }
  }
  function duplicateDrawing(sid) {
    var it = getItemById(sid);
    if (!it) return;
    var d = docSize();
    var dup = JSON.parse(JSON.stringify(it));
    dup.id = 'g_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
    offsetDrawingClone(dup, (10 / d.dw) * 100, (10 / d.dh) * 100);
    addItem(dup);
    selectItem(dup.id);
  }
  function copyDrawing(sid) {
    var it = getItemById(sid);
    if (!it) return;
    drawingClipboard = JSON.parse(JSON.stringify(it));
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(JSON.stringify({ tmShape: true, item: drawingClipboard }));
      }
    } catch (e) {}
  }
  function pasteDrawing() {
    if (!drawingClipboard) return;
    var dup = JSON.parse(JSON.stringify(drawingClipboard));
    dup.id = 'g_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
    var d = docSize();
    offsetDrawingClone(dup, (10 / d.dw) * 100, (10 / d.dh) * 100);
    addItem(dup);
    selectItem(dup.id);
  }
  function hideShapeCtxMenu() {
    if (shapeCtxEl) shapeCtxEl.hidden = true;
  }
  function showShapeCtxMenu(ev, sid) {
    if (!shapeCtxEl || activeToolKind !== 'pointer') return;
    ev.preventDefault();
    ev.stopPropagation();
    selectItem(sid);
    hideShapeCtxMenu();
    var it = getItemById(sid);
    if (!it) return;
    function mkBtn(label, fn) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.addEventListener('click', function (e2) {
        e2.preventDefault();
        e2.stopPropagation();
        fn();
        hideShapeCtxMenu();
      });
      return b;
    }
    shapeCtxEl.innerHTML = '';
    var hdr = document.createElement('div');
    hdr.className = 'tm-d-ctx-hdr';
    hdr.textContent = 'Drawing';
    shapeCtxEl.appendChild(hdr);
    shapeCtxEl.appendChild(
      mkBtn('Delete', function () {
        delItem(sid);
      })
    );
    shapeCtxEl.appendChild(
      mkBtn('Copy', function () {
        copyDrawing(sid);
      })
    );
    shapeCtxEl.appendChild(
      mkBtn('Paste', function () {
        pasteDrawing();
      })
    );
    shapeCtxEl.appendChild(
      mkBtn('Duplicate', function () {
        duplicateDrawing(sid);
      })
    );
    var hdr2 = document.createElement('div');
    hdr2.className = 'tm-d-ctx-hdr';
    hdr2.textContent = 'Style';
    shapeCtxEl.appendChild(hdr2);
    var lwRow = document.createElement('div');
    lwRow.style.padding = '6px 10px 4px';
    lwRow.style.boxSizing = 'border-box';
    var lwLab = document.createElement('div');
    lwLab.textContent = 'Line weight (pt)';
    lwLab.style.fontSize = '10px';
    lwLab.style.textTransform = 'uppercase';
    lwLab.style.color = 'rgba(255,255,255,.5)';
    lwLab.style.marginBottom = '4px';
    var lwInp = document.createElement('input');
    lwInp.type = 'number';
    lwInp.min = '0.5';
    lwInp.max = '12';
    lwInp.step = '0.25';
    lwInp.className = 'tm-ws-num';
    lwInp.style.width = '100%';
    lwInp.style.boxSizing = 'border-box';
    lwInp.value = String(it.lineWidthPt != null ? it.lineWidthPt : activeStyle.lineWidthPt);
    function applyCtxLw() {
      var v = parseFloat(lwInp.value);
      if (isNaN(v)) return;
      it.lineWidthPt = Math.min(12, Math.max(0.5, v));
      saveDrawings();
      render();
    }
    lwInp.addEventListener('change', applyCtxLw);
    lwInp.addEventListener('mousedown', function (e2) {
      e2.stopPropagation();
    });
    lwInp.addEventListener('click', function (e2) {
      e2.stopPropagation();
    });
    var btnLwPresets = document.createElement('button');
    btnLwPresets.type = 'button';
    btnLwPresets.className = 'tm-txt-btn';
    btnLwPresets.style.marginTop = '6px';
    btnLwPresets.style.width = '100%';
    btnLwPresets.textContent = 'Common line weights…';
    var lwPresets = document.createElement('div');
    lwPresets.style.display = 'none';
    lwPresets.style.flexDirection = 'column';
    lwPresets.style.gap = '4px';
    lwPresets.style.marginTop = '6px';
    [1, 1.5, 2, 2.8, 4, 6, 8, 12].forEach(function (pv) {
      var pb = document.createElement('button');
      pb.type = 'button';
      pb.className = 'tm-txt-btn';
      pb.textContent = pv + ' pt';
      pb.addEventListener('click', function (e3) {
        e3.preventDefault();
        e3.stopPropagation();
        lwInp.value = String(pv);
        applyCtxLw();
      });
      lwPresets.appendChild(pb);
    });
    btnLwPresets.addEventListener('click', function (e3) {
      e3.preventDefault();
      e3.stopPropagation();
      var open = lwPresets.style.display === 'none' || lwPresets.style.display === '';
      lwPresets.style.display = open ? 'flex' : 'none';
      btnLwPresets.textContent = open ? 'Hide line weight presets' : 'Common line weights…';
    });
    lwRow.appendChild(lwLab);
    lwRow.appendChild(lwInp);
    lwRow.appendChild(btnLwPresets);
    lwRow.appendChild(lwPresets);
    shapeCtxEl.appendChild(lwRow);
    var row = document.createElement('div');
    row.style.padding = '4px 10px';
    var ic = document.createElement('input');
    ic.type = 'color';
    ic.value = it.color || activeStyle.color || '#add7ff';
    ic.addEventListener('input', function () {
      it.color = ic.value;
      saveDrawings();
      render();
    });
    ic.addEventListener('mousedown', function (e2) {
      e2.stopPropagation();
    });
    row.appendChild(ic);
    shapeCtxEl.appendChild(row);
    var ltBtn = document.createElement('button');
    ltBtn.type = 'button';
    ltBtn.className = 'tm-txt-btn';
    ltBtn.style.margin = '0 10px 4px';
    ltBtn.style.width = 'calc(100% - 20px)';
    ltBtn.textContent = 'Line type…';
    var ltPanel = document.createElement('div');
    ltPanel.style.display = 'none';
    ltPanel.style.padding = '0 10px 8px 18px';
    ltPanel.style.boxSizing = 'border-box';
    function addDashOpt(label, ds) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tm-txt-btn';
      b.style.width = '100%';
      b.style.marginBottom = '4px';
      b.textContent = label;
      b.addEventListener('click', function (e3) {
        e3.preventDefault();
        e3.stopPropagation();
        it.dashStyle = ds;
        saveDrawings();
        render();
        hideShapeCtxMenu();
      });
      ltPanel.appendChild(b);
    }
    addDashOpt('Solid', 'solid');
    addDashOpt('Dotted', 'dotted');
    addDashOpt('Dashed', 'dashed');
    ltBtn.addEventListener('click', function (e3) {
      e3.preventDefault();
      e3.stopPropagation();
      var op = ltPanel.style.display === 'none' || ltPanel.style.display === '';
      ltPanel.style.display = op ? 'block' : 'none';
    });
    shapeCtxEl.appendChild(ltBtn);
    shapeCtxEl.appendChild(ltPanel);
    shapeCtxEl.style.left = Math.min(ev.clientX, Math.max(8, (window.innerWidth || 800) - 220)) + 'px';
    shapeCtxEl.style.top = Math.min(ev.clientY, Math.max(8, (window.innerHeight || 600) - 40)) + 'px';
    shapeCtxEl.hidden = false;
  }
  function selectItem(id) {
    selId = id;
    render();
  }
  function applyStyleToSelection() {
    if (!selId) return;
    var it = items.filter(function (x) {
      return x.id === selId;
    })[0];
    if (!it) return;
    pushDrawHistory();
    it.color = activeStyle.color;
    it.lineWidthPt = activeStyle.lineWidthPt;
    it.dashStyle = activeStyle.dashStyle;
    saveDrawings();
    render();
  }
  function syncHlColorFromStyle() {
    try {
      if (typeof window.hlColor !== 'undefined') window.hlColor = activeStyle.color;
      var found = null;
      var want = normalizeHlHex(String(activeStyle.color || '')).toLowerCase();
      if (want) {
        document.querySelectorAll('.hlc').forEach(function (el) {
          if (normalizeHlHex(String(el.getAttribute('data-c') || '')).toLowerCase() === want) found = el;
        });
      }
      if (found && typeof window.pickC === 'function') window.pickC(found);
      else {
        document.querySelectorAll('.hlc').forEach(function (e) {
          e.classList.remove('on');
        });
      }
    } catch (e) {}
  }
  function syncDashButtons() {
    var ds = activeStyle.dashStyle;
    [btnDashSolid, btnDashDot, btnDashDash].forEach(function (b) {
      if (b) b.classList.remove('on');
    });
    if (ds === 'dotted' && btnDashDot) btnDashDot.classList.add('on');
    else if (ds === 'dashed' && btnDashDash) btnDashDash.classList.add('on');
    else if (btnDashSolid) btnDashSolid.classList.add('on');
  }
  function syncStyleInputs() {
    if (inpPt) inpPt.value = String(activeStyle.fontSizePt);
    if (inpRange) inpRange.value = String(activeStyle.fontSizePt);
    if (inpColor) inpColor.value = activeStyle.color;
    syncDashButtons();
    function paintSlots(arr) {
      for (var pi = 0; pi < colorSlots.length; pi++) {
        var btn = arr[pi];
        if (!btn) continue;
        var c = colorSlots[pi] || '#888888';
        btn.style.backgroundColor = c;
        btn.style.background = c;
      }
    }
    paintSlots(slotEls);
    paintSlots(inlineSlotEls);
  }
  // Right-click a color dot: opens the system color picker, then saves that slot.
  function openColorWheelThen(currentHex, onChosen) {
    var inp = document.createElement('input');
    inp.type = 'color';
    var h = String(currentHex || '#888888');
    if (!/^#/.test(h)) h = '#888888';
    if (h.length > 7) h = h.slice(0, 7);
    inp.value = h;
    inp.setAttribute('aria-label', 'Pick a color');
    inp.style.cssText = 'position:fixed;left:0;top:0;width:40px;height:40px;opacity:0;z-index:10100;cursor:pointer;';
    document.body.appendChild(inp);
    function removeInp() {
      if (inp.parentNode) inp.parentNode.removeChild(inp);
    }
    inp.addEventListener(
      'change',
      function () {
        try {
          onChosen(inp.value);
        } catch (eCh) {}
        removeInp();
      },
      { once: true }
    );
    inp.addEventListener(
      'blur',
      function () {
        setTimeout(removeInp, 200);
      },
      { once: true }
    );
    inp.click();
  }
  function bindColorSlot(btn, idx) {
    btn.title = (btn.title ? btn.title + ' — ' : '') + 'Click to use · Right-click to change color';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      activeStyle.color = colorSlots[idx] || '#ffffff';
      postColorRecentToParent(activeStyle.color);
      syncStyleInputs();
      applyStylePipeline();
    });
    btn.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openColorWheelThen(colorSlots[idx] || activeStyle.color, function (nv) {
        colorSlots[idx] = nv;
        saveColorSlots();
        rebuildPresetSlotsInline();
        syncStylePopSlots();
        syncStyleInputs();
        applyStylePipeline();
      });
    });
  }
  function pushStyleToParentNote() {
    try {
      window.parent.postMessage({ type: 'tm_sticky_tool', action: 'fontsize', value: activeStyle.fontSizePt }, '*');
      window.parent.postMessage({ type: 'tm_sticky_tool', action: 'color', value: activeStyle.color }, '*');
    } catch (e) {}
  }
  function applyStylePipeline() {
    saveGlobalStyle();
    syncHlColorFromStyle();
    pushStyleToParentNote();
    applyStyleToSelection();
    if (!selId) render();
  }
  function setFontSizePt(n) {
    n = parseFloat(n);
    if (isNaN(n)) return;
    activeStyle.fontSizePt = Math.min(60, Math.max(3, n));
    activeStyle.lineWidthPt = Math.min(12, Math.max(0.5, activeStyle.fontSizePt / 5));
    syncStyleInputs();
    applyStylePipeline();
  }
  function postHlGlobals() {
    window.__TM_HIGHLIGHT_ARMED = activeToolKind === 'hl';
    window.__TM_HIGHLIGHT_ERASER = activeToolKind === 'eraser';
  }
  function updateDrawCursor() {
    document.body.classList.toggle('tm-draw-mode', !!drawMode);
    document.body.classList.toggle('tm-cursor-hl', activeToolKind === 'hl');
    document.body.classList.toggle('tm-cursor-eraser', activeToolKind === 'eraser');
    postHlGlobals();
  }
  function setCollapsed(c) {
    collapsed = !!c;
    if (collapsed) closeAllPops();
    if (bar) {
      bar.classList.toggle('tm-ws-collapsed', collapsed);
      // When collapsing, immediately go to idle (dots-only). When expanding, clear idle.
      if (collapsed) bar.classList.add('tm-ws-idle');
      else bar.classList.remove('tm-ws-idle');
    }
    if (btnCollapse) btnCollapse.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    saveBarState();
  }

  // Idle state is the super-compact "just dots" look when the toolbar is collapsed
  // and the pointer isn't near it. Hover lifts idle; after a short leave delay or
  // after the tap-timeout, we re-enter idle. This is only meaningful when `collapsed`.
  var idleLiftTimer = null;
  function scheduleIdleLift(ms) {
    if (!bar || !collapsed) return;
    bar.classList.remove('tm-ws-idle');
    if (idleLiftTimer) { clearTimeout(idleLiftTimer); idleLiftTimer = null; }
    idleLiftTimer = setTimeout(function () {
      if (collapsed && bar) bar.classList.add('tm-ws-idle');
      idleLiftTimer = null;
    }, ms || 2800);
  }
  function liftIdleNow() {
    if (!bar || !collapsed) return;
    bar.classList.remove('tm-ws-idle');
    if (idleLiftTimer) { clearTimeout(idleLiftTimer); idleLiftTimer = null; }
  }
  function returnToIdleSoon(ms) {
    if (!bar || !collapsed) return;
    if (idleLiftTimer) clearTimeout(idleLiftTimer);
    idleLiftTimer = setTimeout(function () {
      if (collapsed && bar) bar.classList.add('tm-ws-idle');
      idleLiftTimer = null;
    }, ms || 450);
  }
  function clearShapeModeUi() {
    if (popShapes) popShapes.querySelectorAll('button[data-mode]').forEach(function (b) {
      b.classList.remove('on');
    });
  }
  function postActiveToolToParent() {
    try {
      // Lets the parent page know which tool is active (pointer, highlighter, etc.).
      window.parent.postMessage({ type: 'tm_workspace_tool', tool: activeToolKind }, '*');
    } catch (e) {}
  }
  function setActiveTool(kind) {
    activeToolKind = kind;
    if (kind === 'pointer') {
      drawMode = null;
      clearShapeModeUi();
    } else if (kind === 'hl' || kind === 'eraser') {
      drawMode = null;
      clearShapeModeUi();
    } else if (kind === 'pen') {
      clearShapeModeUi();
      drawMode = 'arrow';
    } else if (kind === 'sticky') {
      drawMode = null;
      clearShapeModeUi();
    }
    if (btnPointer) {
      btnPointer.classList.toggle('tm-ic--on', kind === 'pointer');
      btnPointer.setAttribute('aria-pressed', kind === 'pointer' ? 'true' : 'false');
    }
    if (btnHl) {
      btnHl.classList.toggle('tm-ic--on', kind === 'hl');
      btnHl.setAttribute('aria-pressed', kind === 'hl' ? 'true' : 'false');
      var st = btnHl.querySelector('.tm-ws-hl-state');
      if (st) st.textContent = kind === 'hl' ? 'On' : 'Off';
    }
    if (btnEraser) btnEraser.classList.toggle('tm-ic--on', kind === 'eraser');
    if (btnPen) btnPen.classList.toggle('tm-ic--on', kind === 'pen');
    if (btnShapesToggle) {
      btnShapesToggle.classList.toggle(
        'tm-ic--on',
        !!drawMode && (drawMode === 'circle' || drawMode === 'square' || drawMode === 'underline')
      );
    }
    updateDrawCursor();
    postActiveToolToParent();
  }
  function setShapeMode(m, btn) {
    var on = drawMode === m;
    drawMode = on ? null : m;
    if (popShapes) popShapes.querySelectorAll('button[data-mode]').forEach(function (b) {
      b.classList.remove('on');
    });
    if (drawMode && btn) btn.classList.add('on');
    if (drawMode) {
      activeToolKind = 'shape';
      if (btnShapesToggle) btnShapesToggle.classList.add('tm-ic--on');
      if (btnPointer) {
        btnPointer.classList.remove('tm-ic--on');
        btnPointer.setAttribute('aria-pressed', 'false');
      }
      if (btnHl) {
        btnHl.classList.remove('tm-ic--on');
        btnHl.setAttribute('aria-pressed', 'false');
        var stOff = btnHl.querySelector('.tm-ws-hl-state');
        if (stOff) stOff.textContent = 'Off';
      }
      if (btnEraser) btnEraser.classList.remove('tm-ic--on');
      if (btnPen) btnPen.classList.remove('tm-ic--on');
    } else {
      setActiveTool('pointer');
      return;
    }
    updateDrawCursor();
    postActiveToolToParent();
  }
  function endDraw(ev) {
    if (!drawState || !drawMode) return;
    var e = toDoc(ev);
    var dx = e.x - drawState.sx;
    var dy = e.y - drawState.sy;
    if (Math.abs(dx) + Math.abs(dy) < 6) {
      drawState = null;
      if (previewEl && previewEl.parentNode) previewEl.parentNode.removeChild(previewEl);
      previewEl = null;
      return;
    }
    var d = docSize();
    var id = 'g_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
    var it = {
      id: id,
      type: drawMode,
      color: activeStyle.color,
      lineWidthPt: activeStyle.lineWidthPt,
      dashStyle: activeStyle.dashStyle
    };
    if (drawMode === 'arrow') {
      it.x1p = (drawState.sx / d.dw) * 100;
      it.y1p = (drawState.sy / d.dh) * 100;
      it.x2p = (e.x / d.dw) * 100;
      it.y2p = (e.y / d.dh) * 100;
    } else if (drawMode === 'underline') {
      var y1 = (drawState.sy + e.y) / 2;
      it.x1p = (Math.min(drawState.sx, e.x) / d.dw) * 100;
      it.y1p = (y1 / d.dh) * 100;
      it.x2p = (Math.max(drawState.sx, e.x) / d.dw) * 100;
      it.y2p = (y1 / d.dh) * 100;
    } else if (drawMode === 'circle') {
      it.cxp = ((drawState.sx + e.x) / 2 / d.dw) * 100;
      it.cyp = ((drawState.sy + e.y) / 2 / d.dh) * 100;
      it.rxp = (Math.abs(e.x - drawState.sx) / 2 / d.dw) * 100;
      it.ryp = (Math.abs(e.y - drawState.sy) / 2 / d.dh) * 100;
    } else if (drawMode === 'square') {
      it.xp = (Math.min(drawState.sx, e.x) / d.dw) * 100;
      it.yp = (Math.min(drawState.sy, e.y) / d.dh) * 100;
      it.wp = (Math.abs(e.x - drawState.sx) / d.dw) * 100;
      it.hp = (Math.abs(e.y - drawState.sy) / d.dh) * 100;
    }
    drawState = null;
    if (previewEl && previewEl.parentNode) previewEl.parentNode.removeChild(previewEl);
    previewEl = null;
    addItem(it);
  }
  function onDrawMove(ev) {
    if (!drawState || !previewEl || !drawMode) return;
    var p = toDoc(ev);
    if (drawMode === 'arrow' && previewEl && previewEl._shaft && previewEl._head) {
      var lwP = activeStyle.lineWidthPt;
      var geoP = arrowShaftAndHead(drawState.sx, drawState.sy, p.x, p.y, lwP);
      previewEl._shaft.setAttribute('d', geoP.shaft);
      previewEl._head.setAttribute(
        'points',
        geoP.headPts[0] + ',' + geoP.headPts[1] + ' ' + geoP.headPts[2] + ',' + geoP.headPts[3] + ' ' + geoP.headPts[4] + ',' + geoP.headPts[5]
      );
    } else if (drawMode === 'underline') {
      var y1 = (drawState.sy + p.y) / 2;
      previewEl.setAttribute('x1', String(Math.min(drawState.sx, p.x)));
      previewEl.setAttribute('y1', String(y1));
      previewEl.setAttribute('x2', String(Math.max(drawState.sx, p.x)));
      previewEl.setAttribute('y2', String(y1));
    } else if (drawMode === 'circle') {
      var cx = (drawState.sx + p.x) / 2;
      var cy = (drawState.sy + p.y) / 2;
      previewEl.setAttribute('cx', String(cx));
      previewEl.setAttribute('cy', String(cy));
      previewEl.setAttribute('rx', String(Math.abs(p.x - drawState.sx) / 2));
      previewEl.setAttribute('ry', String(Math.abs(p.y - drawState.sy) / 2));
    } else if (drawMode === 'square') {
      previewEl.setAttribute('x', String(Math.min(drawState.sx, p.x)));
      previewEl.setAttribute('y', String(Math.min(drawState.sy, p.y)));
      previewEl.setAttribute('width', String(Math.abs(p.x - drawState.sx)));
      previewEl.setAttribute('height', String(Math.abs(p.y - drawState.sy)));
    }
    if (ev.cancelable) ev.preventDefault();
  }
  function applyHlLayout(p) {
    if (!p || !bar) return;
    if (typeof p.leftPct === 'number' && typeof p.topPct === 'number') {
      bar.style.left = p.leftPct + '%';
      bar.style.top = p.topPct + '%';
      bar.style.right = 'auto';
      bar.style.bottom = 'auto';
      bar.style.margin = '0';
      bar.style.transform = 'none';
      requestAnimationFrame(clampBarIntoView);
    }
    if (typeof p.collapsed === 'boolean') {
      collapsed = p.collapsed;
      bar.classList.toggle('tm-ws-collapsed', collapsed);
      if (btnCollapse) {
        btnCollapse.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        btnCollapse.textContent = collapsed ? '⌄' : '⌃';
        btnCollapse.setAttribute('aria-label', collapsed ? 'Expand toolbar' : 'Collapse toolbar');
      }
    }
  }

  function pageHasSidebar() {
    try {
      return !!document.getElementById('sidebar');
    } catch (e) {
      return false;
    }
  }

  function applySidebarCollapsed(next) {
    sidebarCollapsed = !!next;
    try {
      document.documentElement.classList.toggle('tm-sidebar-collapsed', sidebarCollapsed);
    } catch (e1) { /* ignore */ }
    try {
      if (btnSidebarToggle) btnSidebarToggle.setAttribute('aria-pressed', sidebarCollapsed ? 'true' : 'false');
    } catch (e2) { /* ignore */ }
    try {
      window.parent.postMessage({ type: 'tm_sidebar_collapsed_save', collapsed: sidebarCollapsed }, '*');
    } catch (e3) { /* ignore */ }
  }
  // All toolbar / bar appearance rules live in this one string (search class names like tm-ws- to tweak layout).
  function injectBaseCss() {
    var st = document.createElement('style');
    st.textContent =
      '#hl-min{display:none!important}' +
      /* Optional host-page sidebar toggle (MAAE2202 notes). */
      'html.tm-sidebar-collapsed #sidebar{display:none!important;transform:translateX(-120%)!important;opacity:0!important;pointer-events:none!important}' +
      'html.tm-sidebar-collapsed body{padding-left:0!important}' +
      'html.tm-sidebar-collapsed main{margin-left:0!important}' +
      'html.tm-sidebar-collapsed #main{margin-left:0!important}' +
      'html.tm-sidebar-collapsed #main-content{margin-left:0!important}' +
      '#hl-bar.tm-ws-host{position:fixed;left:12px;top:52px;right:auto;bottom:auto;transform:none;' +
      /* Above #tm-annotations-fixed so the toolbar stays clickable (fixed overlay used to sit at 10020). */
      'z-index:10040;box-sizing:border-box;max-width:min(920px,calc(100vw - 16px));width:max-content;min-width:0;padding:0;margin:0;border:none;background:transparent;' +
      'box-shadow:none;display:flex;flex-direction:column;align-items:stretch;gap:0;font-size:12px}' +
      '.tm-ws-chrome{display:flex;flex-direction:column;align-items:stretch;gap:0;border-radius:12px;padding:8px 10px 10px;max-width:100%;min-height:0;' +
      'overflow:visible;-webkit-overflow-scrolling:touch;' +
      'background:rgba(22,26,38,.78);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);' +
      'border:1px solid rgba(255,255,255,.12);box-shadow:0 6px 24px rgba(0,0,0,.42)}' +
      '.tm-ws-collapsed .tm-ws-chrome{padding:5px 8px 6px;border-radius:999px}' +
      '.tm-ws-collapsed .tm-ws-chrome-head{margin-bottom:2px}' +
      '.tm-ws-chrome-head{display:flex;flex-direction:row;align-items:center;gap:6px;margin:0 0 4px 0;align-self:flex-start}' +
      '.tm-ws-head-btn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;min-width:34px;padding:0;' +
      'border:none;border-radius:8px;background:transparent;color:rgba(255,255,255,.95);cursor:pointer}' +
      '.tm-ws-head-btn:hover{color:#fff;background:rgba(255,255,255,.1)}' +
      '.tm-ws-head-btn:disabled,.tm-ws-head-btn.tm-ws-head-btn--disabled{opacity:.26;cursor:not-allowed}' +
      /* Idle dots icon — when collapsed AND not hovered/peeked, only this button shows. */
      '.tm-ws-idle-btn{display:none;width:34px;height:34px;min-width:34px;padding:0;' +
      'border:none;border-radius:8px;background:transparent;color:rgba(255,255,255,.92);cursor:pointer;' +
      'align-items:center;justify-content:center;}' +
      '.tm-ws-idle-btn:hover{color:#fff;background:rgba(255,255,255,.1);}' +
      'html.sr-light .tm-ws-idle-btn{color:rgba(20,30,60,0.88);}' +
      'html.sr-light .tm-ws-idle-btn:hover{color:#0f1f38;background:rgba(10,20,50,0.07);}' +
      '.tm-ws-collapsed.tm-ws-idle .tm-ws-idle-btn{display:inline-flex;}' +
      /* Hide the rest of chrome-head buttons and the main row while idle. */
      '.tm-ws-collapsed.tm-ws-idle .tm-ws-chrome-head > .tm-ws-head-btn{display:none!important;}' +
      '.tm-ws-collapsed.tm-ws-idle .tm-ws-main{display:none!important;}' +
      /* Squish the pill down so the idle state is just the size of one button. */
      '.tm-ws-collapsed.tm-ws-idle .tm-ws-chrome{padding:3px;background:rgba(22,26,38,.72);transition:padding 0.18s ease, background 0.18s ease;}' +
      'html.sr-light .tm-ws-collapsed.tm-ws-idle .tm-ws-chrome{background:rgba(248,250,255,0.88);}' +
      '.tm-ws-collapsed .tm-ws-chrome{transition:padding 0.18s ease, background 0.18s ease;}' +
      '.tm-ws-main{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;gap:8px;width:100%;' +
      'min-width:0;box-sizing:border-box}' +
      '.tm-ws-tail{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:stretch;gap:6px;flex:1 1 auto;min-width:0}' +
      '.tm-ws-tool-ribbon{display:flex;flex-direction:row;flex-wrap:wrap;align-items:center;gap:5px 6px;flex:1 1 auto;flex-shrink:1;min-width:0;' +
      'overflow:visible}' +
      '.tm-ws-tools{display:flex;flex-wrap:wrap;align-items:center;gap:5px;flex:0 1 auto;flex-shrink:1;min-width:0;max-width:100%}' +
      '.tm-ws-shapes-cluster,.tm-ws-undo-cluster{display:flex;flex-wrap:nowrap;align-items:center;gap:4px;flex-shrink:0}' +
      '.tm-ws-stack{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:6px;' +
      'flex-shrink:0;min-height:0}' +
      '.tm-ws-stack-label{font-size:10px;line-height:1.1;letter-spacing:.05em;text-transform:uppercase;color:rgba(255,255,255,.48);' +
      'white-space:nowrap;user-select:none}' +
      '.tm-ws-stack-row{display:inline-flex;flex-direction:row;align-items:center;gap:4px;flex-wrap:nowrap}' +
      '.tm-ws-hl-spacer{flex:0 0 4px;width:4px;min-width:4px;max-width:8px;height:1px;align-self:center}' +
      '.tm-ws-hl-strip{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;gap:8px;flex:0 1 auto;' +
      'min-width:0;margin-left:0;padding:2px 0 0 6px;border-left:1px solid rgba(255,255,255,.1)}' +
      '.tm-ws-hl-strip.tm-ws-native-wrap{background:transparent;border:none;padding:0;flex:0 0 auto}' +
      '.tm-ws-hl-group{display:flex;flex-direction:column;align-items:stretch;gap:8px;min-width:0}' +
      '.tm-ws-hl-heading{font-size:10px;line-height:1.1;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.5);' +
      'white-space:nowrap;user-select:none;margin-right:4px}' +
      '.tm-ws-hl-r1{display:flex;flex-wrap:nowrap;align-items:center;gap:6px;overflow-x:auto;max-width:100%}' +
      '.tm-ws-hl-dots-row{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;gap:8px;min-width:0;' +
      'overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:thin;padding-bottom:2px;max-width:min(560px,72vw)}' +
      '.tm-ws-hl-dots-row .tm-slot.hlc{width:22px;height:22px;min-width:22px;border-radius:50%;cursor:pointer;padding:0;flex-shrink:0;' +
      'box-sizing:border-box;border:2px solid rgba(255,255,255,.25);-webkit-appearance:none;appearance:none}' +
      '.tm-ws-hl-dots-row .tm-slot.hlc.on{outline:2px solid var(--ac);outline-offset:1px}' +
      '.tm-ws-hl-extra-inner{display:inline-flex;flex-direction:row;align-items:center;gap:4px;flex-wrap:nowrap;flex-shrink:0}' +
      '.tm-ws-hl-op-row{display:flex;align-items:center;min-width:0}' +
      'input[type=range].tm-ws-hl-op-range{flex:1;min-width:120px;max-width:240px;width:100%;accent-color:var(--ac);vertical-align:middle}' +
      '.tm-ws-presets-head{display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:10px;width:100%;min-width:0}' +
      '.tm-ws-presets-reset{flex-shrink:0;padding:4px 10px;font-size:11px}' +
      '.tm-ws-presets-stack--grow{display:flex;flex-direction:column;flex:0 1 200px;min-width:72px;max-width:min(220px,36vw)}' +
      '.tm-ws-presets-scroll{display:inline-flex;align-items:center;gap:4px;flex-wrap:nowrap;width:100%;min-width:0;max-width:100%;flex:0 1 auto;' +
      'overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:thin}' +
      '.tm-ws-presets-scroll::-webkit-scrollbar{display:none}' +
      '.tm-slot-add{font-size:15px;font-weight:700;line-height:1;color:rgba(255,255,255,.75);background:rgba(255,255,255,.05);' +
      'border:2px dashed rgba(255,255,255,.28)}' +
      '.tm-drawing-ctx{position:fixed;z-index:10080;min-width:200px;padding:6px 0;background:rgba(16,18,28,.98);' +
      'border:1px solid rgba(255,255,255,.14);border-radius:10px;box-shadow:0 16px 44px rgba(0,0,0,.55);font-size:13px}' +
      '.tm-drawing-ctx[hidden]{display:none!important}' +
      '.tm-drawing-ctx .tm-d-ctx-hdr{padding:4px 12px 2px;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.45)}' +
      '.tm-drawing-ctx button{display:block;width:100%;text-align:left;padding:8px 14px;border:none;background:transparent;color:inherit;cursor:pointer;font:inherit}' +
      '.tm-drawing-ctx button:hover{background:rgba(94,154,255,.14)}' +
      '.tm-ws-hl-row{display:flex;flex-wrap:nowrap;align-items:center;gap:8px;min-width:0}' +
      '.tm-ws-hl-toggle{display:inline-flex;align-items:center;gap:3px;padding:3px 7px;border-radius:7px;height:28px;box-sizing:border-box;' +
      'border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:var(--txd);cursor:pointer;font:inherit;font-size:11px;white-space:nowrap}' +
      '.tm-ws-hl-toggle:hover{color:var(--tx);border-color:rgba(94,154,255,.45)}' +
      '.tm-ws-hl-toggle.tm-ic--on{border-color:var(--ac);color:var(--ac);background:rgba(94,154,255,.12)}' +
      '.tm-ws-hl-toggle .tm-ws-hl-ic{display:inline-flex}' +
      '.tm-ws-hl-label{display:none}' +
      '.tm-ws-hl-state{font-weight:600;min-width:1.35em;font-size:11px}' +
      '@media(max-width:760px){' +
      '.tm-ws-main{flex-wrap:wrap;align-items:flex-start;row-gap:12px}' +
      '.tm-ws-tail{flex-wrap:wrap;row-gap:12px}' +
      '.tm-ws-hl-strip{width:100%;margin-left:0;border-left:none;border-top:1px solid rgba(255,255,255,.1);padding:10px 0 0}' +
      '.tm-ws-presets-scroll{max-width:100%;width:100%}' +
      '.tm-ws-hl-spacer{display:none}' +
      '}' +
      '.tm-ws-drag{cursor:grab;padding:6px 8px;border-radius:8px;color:var(--txd);user-select:none;line-height:1;flex-shrink:0}' +
      '.tm-ws-drag:active{cursor:grabbing;background:rgba(255,255,255,.08)}' +
      '.tm-ws-div{width:1px;align-self:stretch;min-height:28px;background:rgba(255,255,255,.14);margin:0 4px;flex-shrink:0}' +
      '.tm-ws-collapsed .tm-ws-tail{display:none!important}' +
      '.tm-ic-btn{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;' +
      'border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:var(--txd);cursor:pointer}' +
      '.tm-ic-btn:hover{border-color:rgba(94,154,255,.5);color:var(--tx)}' +
      '.tm-ic-btn.tm-ic--on{border-color:var(--ac);color:var(--ac);background:rgba(94,154,255,.12)}' +
      '.tm-txt-btn{font:inherit;font-size:11px;padding:5px 8px;border-radius:7px;border:1px solid rgba(255,255,255,.12);' +
      'background:rgba(255,255,255,.05);color:var(--txd);cursor:pointer;white-space:nowrap}' +
      '.tm-txt-btn:hover{color:var(--tx);border-color:rgba(94,154,255,.4)}' +
      '.tm-popwrap{position:relative;display:inline-flex}' +
      '.tm-pop{position:absolute;left:0;top:100%;margin-top:6px;display:none;flex-direction:column;gap:8px;padding:10px;' +
      'min-width:220px;max-height:min(72vh,420px);overflow-y:auto;background:rgba(16,18,28,.95);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.12);' +
      'border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.5);z-index:10050}' +
      '.tm-ic-btn:disabled{opacity:.35;cursor:not-allowed}' +
      '.tm-pop.tm-open{display:flex}' +
      '.tm-poprow{display:flex;flex-wrap:wrap;align-items:center;gap:8px}' +
      '.tm-slot{width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.25);cursor:pointer;padding:0}' +
      '.tm-slot:hover{transform:scale(1.08)}' +
      '.tm-ws-inline-slots{display:inline-flex;align-items:center;gap:3px;flex-wrap:nowrap;margin:0}' +
      '.tm-ws-inline-slots .tm-slot{width:22px;height:22px}' +
      '.tm-ws-inline-label{display:none}' +
      '#tm-drawings-svg .tm-sh{fill:none;stroke-linecap:round;stroke-linejoin:round}' +
      '#tm-drawings-svg .tm-sh-hit{pointer-events:stroke}' +
      '#tm-drawings-svg .tm-sh.sel{filter:drop-shadow(0 0 4px rgba(94,154,255,.9))}' +
      '#tm-drawings-svg{position:absolute;left:0;top:0;z-index:9980;overflow:visible;pointer-events:none}' +
      '#tm-drawings-svg .tm-prev{pointer-events:none;opacity:.75}' +
      'body.tm-draw-mode{cursor:crosshair}' +
      'body.tm-cursor-hl{cursor:text}' +
      'body.tm-cursor-eraser{cursor:cell}' +
      '#tm-annotations-fixed{position:fixed;inset:0;z-index:9985;pointer-events:none;overflow:visible}' +
      '#tm-sticky-host,#tm-workspace-images-host{position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;margin:0;padding:0}' +
      '#tm-sticky-host .sticky-note,#tm-workspace-images-host .tm-ws-image-wrap{pointer-events:auto}' +
      '.sticky-note{position:absolute;left:0;top:0;min-width:120px;max-width:92%;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:4px;' +
      'box-shadow:0 8px 24px rgba(0,0,0,.55);display:flex;flex-direction:column;font-family:system-ui,Segoe UI,sans-serif;font-size:14px;font-weight:400;color:#c8c8c8;line-height:1.55;box-sizing:border-box}' +
      '.sticky-note.tm-sticky-no-border{border-color:transparent;box-shadow:0 8px 24px rgba(0,0,0,.45)}' +
      '.sticky-note.tm-sticky-pinned{z-index:3}' +
      '.sticky-body{min-height:72px;max-height:220px;overflow-y:auto;padding:8px 10px 10px;outline:none;word-break:break-word;cursor:text}' +
      '.sticky-body.sz-sm{font-size:12px}.sticky-body.sz-md{font-size:14px}.sticky-body.sz-lg{font-size:17px}' +
      '.sticky-drag-shim{height:26px;flex-shrink:0;cursor:grab;user-select:none;background:#0a0a0a;border-radius:4px 4px 0 0}' +
      '.sticky-resize-edge-e{position:absolute;top:0;right:0;bottom:16px;width:8px;z-index:2;cursor:ew-resize;touch-action:none}' +
      '.sticky-resize-edge-s{position:absolute;left:0;right:16px;bottom:0;height:8px;z-index:2;cursor:ns-resize;touch-action:none}' +
      '.sticky-resize-handle{position:absolute;right:0;bottom:0;width:16px;height:16px;z-index:3;cursor:nwse-resize;touch-action:none;border-radius:0 0 4px 0;' +
      'background:linear-gradient(135deg,transparent 0,transparent 40%,rgba(255,255,255,.08) 40%,rgba(255,255,255,.08) 100%)}' +
      '.tm-ws-image-wrap{position:absolute;left:0;top:0;display:flex;flex-direction:column;box-sizing:border-box;border:1px solid rgba(255,255,255,.2);border-radius:6px;overflow:hidden;' +
      'box-shadow:0 6px 20px rgba(0,0,0,.4);background:#111;min-width:48px;min-height:48px}' +
      '.tm-ws-image-drag{height:12px;flex-shrink:0;cursor:grab;user-select:none;background:rgba(255,255,255,.08);border-radius:6px 6px 0 0}' +
      '.tm-ws-image-wrap img{flex:1;min-height:0;display:block;width:100%;object-fit:cover;pointer-events:none;user-select:none}' +
      '.tm-ws-image-handle{position:absolute;right:0;bottom:0;width:14px;height:14px;cursor:nwse-resize;background:rgba(255,255,255,.12);border-radius:4px 0 4px 0}' +
      '.tm-color-manage-pop{position:fixed;z-index:10060;display:none;flex-direction:column;gap:8px;padding:10px;min-width:196px;max-width:min(92vw,280px);' +
      'background:rgba(16,18,28,.98);border:1px solid rgba(255,255,255,.14);border-radius:10px;box-shadow:0 16px 44px rgba(0,0,0,.55);font-size:12px}' +
      '.tm-color-manage-pop.tm-open{display:flex}' +
      '.tm-hl-manage-pop{position:fixed;z-index:10061;display:none;flex-direction:column;gap:8px;padding:10px;min-width:196px;max-width:min(92vw,280px);' +
      'background:rgba(16,18,28,.98);border:1px solid rgba(255,255,255,.14);border-radius:10px;box-shadow:0 16px 44px rgba(0,0,0,.55);font-size:12px}' +
      '.tm-hl-manage-pop.tm-open{display:flex}' +
      '.tm-color-recent-row{display:flex;flex-direction:row;flex-wrap:nowrap;gap:4px;overflow-x:auto;max-width:260px;padding:2px 0;scrollbar-width:thin}' +
      '.tm-color-manage-pop .tm-slot{width:22px;height:22px;flex-shrink:0}' +
      '.tm-ws-collapse{width:28px;height:28px;border-radius:7px;border:1px solid rgba(255,255,255,.12);' +
      'background:rgba(255,255,255,.05);color:var(--txd);cursor:pointer;font-size:18px;line-height:1}' +
      '.tm-ws-collapse:hover{color:var(--ac)}' +
      'input[type="range"].tm-ws-range{width:120px;accent-color:var(--ac)}' +
      'input[type="number"].tm-ws-num{width:56px;padding:4px 6px;border-radius:6px;border:1px solid var(--bd);background:var(--s2);color:var(--tx)}' +
      'input[type="color"].tm-ws-color{width:36px;height:32px;padding:0;border:none;border-radius:8px;cursor:pointer}' +
      '.tm-dash-row button{font:inherit;font-size:11px;padding:4px 8px;margin-right:4px;border-radius:6px;' +
      'border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:var(--txd);cursor:pointer}' +
      '.tm-dash-row button.on{border-color:var(--ac);color:var(--ac)}' +
      'mark.tm-spocket-find-mark{background:#ff2da0!important;color:#0a0f1a!important;font-weight:600!important;box-shadow:0 0 0 3px #ff1493,0 0 20px rgba(255,20,147,.55)!important;border-radius:4px}' +
      'mark.tm-spocket-find-mark.tm-spocket-find-active{box-shadow:0 0 0 4px #fff,0 0 26px rgba(255,20,147,.9)!important}' +
      '.tm-spocket-find-outline{animation:tmSpocketFindPulse 2.5s ease-in-out infinite;outline:3px solid rgba(255,45,160,.65)!important;outline-offset:3px;box-shadow:0 0 0 1px rgba(255,255,255,.25)}' +
      '.tm-spocket-find-outline.tm-spocket-find-active{outline-color:#ff2da0!important;outline-width:4px!important;box-shadow:0 0 0 2px rgba(255,255,255,.45),0 0 22px rgba(255,45,160,.7)}' +
      '@keyframes tmSpocketFindPulse{0%,100%{opacity:1}50%{opacity:.78}}' +
      /* Light-mode overrides — warm paper beige palette for the floating toolbar.
       * All declarations are !important because the upstream notes CSS uses id-based
       * selectors like `#hl-bar button` which otherwise beat our class-only rules. */
      'html.sr-light .tm-ws-chrome{background:rgba(244,236,216,0.94)!important;border-color:rgba(82,60,20,0.22)!important;box-shadow:0 6px 22px rgba(82,60,20,0.18)!important;color:#14100a!important;}' +
      'html.sr-light .tm-ws-head-btn{color:#14100a!important;background:transparent!important;}' +
      'html.sr-light .tm-ws-head-btn:hover{color:#080604!important;background:rgba(82,60,20,0.08)!important;}' +
      'html.sr-light .tm-ic-btn{background:#faf3e0!important;border-color:#bcaa7f!important;color:#14100a!important;}' +
      'html.sr-light .tm-ic-btn:hover{border-color:rgba(17,85,212,0.55)!important;color:#080604!important;}' +
      'html.sr-light .tm-ic-btn.tm-ic--on{background:rgba(17,85,212,0.12)!important;border-color:#1155d4!important;color:#1155d4!important;}' +
      'html.sr-light .tm-pop{background:#faf3e0!important;border-color:#bcaa7f!important;color:#14100a!important;box-shadow:0 12px 36px rgba(82,60,20,0.18)!important;}' +
      'html.sr-light .tm-drawing-ctx{background:#faf3e0!important;color:#14100a!important;border-color:#bcaa7f!important;box-shadow:0 16px 40px rgba(82,60,20,0.22)!important;}' +
      'html.sr-light .tm-drawing-ctx button:hover{background:rgba(17,85,212,0.12)!important;}' +
      'html.sr-light .tm-drawing-ctx .tm-d-ctx-hdr{color:#4a3f2a!important;}' +
      'html.sr-light .tm-ws-div{background:rgba(82,60,20,0.22)!important;}' +
      'html.sr-light .tm-ws-hl-toggle{background:#faf3e0!important;border-color:#bcaa7f!important;color:#14100a!important;}' +
      'html.sr-light .tm-ws-hl-toggle:hover{border-color:rgba(17,85,212,0.55)!important;color:#080604!important;}' +
      'html.sr-light .tm-ws-hl-toggle.tm-ic--on{background:rgba(17,85,212,0.12)!important;color:#1155d4!important;border-color:#1155d4!important;}' +
      'html.sr-light .tm-txt-btn{background:#faf3e0!important;border-color:#bcaa7f!important;color:#14100a!important;}' +
      'html.sr-light .tm-txt-btn:hover{color:#080604!important;border-color:rgba(17,85,212,0.5)!important;}' +
      'html.sr-light .tm-ws-drag{color:#4a3f2a!important;}' +
      'html.sr-light .tm-ws-collapse{background:#faf3e0!important;border-color:#bcaa7f!important;color:#14100a!important;}' +
      'html.sr-light .tm-ws-collapse:hover{color:#1155d4!important;}' +
      'html.sr-light .tm-color-manage-pop,html.sr-light .tm-hl-manage-pop{background:#faf3e0!important;border-color:#bcaa7f!important;color:#14100a!important;box-shadow:0 16px 40px rgba(82,60,20,0.22)!important;}' +
      'html.sr-light input[type="number"].tm-ws-num{background:#faf3e0!important;border-color:#bcaa7f!important;color:#14100a!important;}' +
      'html.sr-light .tm-dash-row button{background:#faf3e0!important;border-color:#bcaa7f!important;color:#14100a!important;}' +
      'html.sr-light .tm-dash-row button.on{color:#1155d4!important;border-color:#1155d4!important;}' +
      'html.sr-light .tm-ws-stack-label,html.sr-light .tm-ws-hl-heading,html.sr-light .tm-ws-inline-label{color:#4a3f2a!important;}' +
      /* Idle "dots" pill blends into the beige page when collapsed. */
      'html.sr-light .tm-ws-collapsed.tm-ws-idle .tm-ws-chrome{background:rgba(244,236,216,0.88)!important;}' +
      'html.sr-light .tm-ws-idle-btn{color:#14100a!important;background:transparent!important;}' +
      'html.sr-light .tm-ws-idle-btn:hover{color:#080604!important;background:rgba(82,60,20,0.10)!important;}' +
      /* Highlight mark CSS — mirrored from index.html so marks still render correctly even when
       * the unified core CSS hasn't loaded yet (defensive for quick dev reloads). */
      ':root{--tm-hl-slot-0:#fff59d;--tm-hl-slot-1:#ffcc80;--tm-hl-slot-2:#a5d6a7;--tm-hl-slot-3:#90caf9;--tm-hl-slot-4:#ce93d8;}' +
      'html.sr-light{--tm-hl-slot-0:#ffe08a;--tm-hl-slot-1:#ffb27a;--tm-hl-slot-2:#7fd48a;--tm-hl-slot-3:#7fb4ef;--tm-hl-slot-4:#c48ad1;}';
    document.head.appendChild(st);
  }

  var spocketFindEntries = [];
  var spocketFindMatchEls = [];
  var spocketFindActiveIndex = 0;

  function clearSpocketFindHighlights() {
    spocketFindMatchEls.forEach(function (el) {
      try {
        el.classList.remove('tm-spocket-find-active');
      } catch (e0) {}
    });
    spocketFindMatchEls = [];
    spocketFindActiveIndex = 0;
    spocketFindEntries.forEach(function (entry) {
      try {
        if (entry.type === 'outline' && entry.el) {
          entry.el.classList.remove('tm-spocket-find-outline', 'tm-spocket-find-active');
        } else if (entry.type === 'mark' && entry.node && entry.node.parentNode) {
          var m = entry.node;
          var p = m.parentNode;
          while (m.firstChild) p.insertBefore(m.firstChild, m);
          p.removeChild(m);
          p.normalize();
        }
      } catch (e) {}
    });
    spocketFindEntries = [];
  }

  function postSpocketFindResult(ok, message, extras) {
    extras = extras || {};
    try {
      window.parent.postMessage(
        {
          type: 'tm_spocket_find_result',
          ok: !!ok,
          message: String(message || ''),
          matchCount: typeof extras.matchCount === 'number' ? extras.matchCount : 0
        },
        '*'
      );
    } catch (e) {}
  }

  function spocketFindApplyActiveVisual() {
    for (var i = 0; i < spocketFindMatchEls.length; i++) {
      try {
        spocketFindMatchEls[i].classList.toggle('tm-spocket-find-active', i === spocketFindActiveIndex);
      } catch (e) {}
    }
  }

  function spocketFindAdvance(delta) {
    var n = spocketFindMatchEls.length;
    if (!n) return;
    var d = typeof delta === 'number' ? delta : parseInt(delta, 10);
    if (!isFinite(d)) d = 0;
    spocketFindActiveIndex = (spocketFindActiveIndex + d + n) % n;
    spocketFindApplyActiveVisual();
    try {
      spocketFindMatchEls[spocketFindActiveIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e2) {}
  }

  var SPOCKET_FIND_WALK_CHUNK = 1800;

  function spocketFindTreeWalkerFilter(node) {
    if (!node.nodeValue || !/\S/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
    var p = node.parentElement;
    if (!p) return NodeFilter.FILTER_REJECT;
    var tag = p.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
    if (p.closest && (p.closest('#hl-bar') || p.closest('#tm-annotations-fixed') || p.closest('#tm-ws-host') || p.closest('.tm-ws-chrome')))
      return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT;
  }

  function collectSpocketFindCandidatesChunked(qLower, words, onDone) {
    var candidates = [];
    var tw;
    try {
      tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: spocketFindTreeWalkerFilter });
    } catch (eInit) {
      postSpocketFindResult(false, 'Search failed', { matchCount: 0 });
      return;
    }
    var walkSteps = 0;
    function chunk() {
      var node;
      try {
        while ((node = tw.nextNode())) {
          var t = node.nodeValue.toLowerCase();
          var score = 0;
          if (t.indexOf(qLower) >= 0) score += 200 + Math.min(qLower.length, 100);
          for (var wi = 0; wi < words.length; wi++) {
            if (words[wi] && t.indexOf(words[wi]) >= 0) score += 12;
          }
          if (score > 0 && node.parentElement) candidates.push({ textNode: node, score: score, el: node.parentElement });
          walkSteps++;
          if (walkSteps % SPOCKET_FIND_WALK_CHUNK === 0) {
            setTimeout(chunk, 0);
            return;
          }
        }
      } catch (e2) {
        postSpocketFindResult(false, 'Search failed', { matchCount: 0 });
        return;
      }
      onDone(candidates);
    }
    setTimeout(chunk, 0);
  }

  function applySpocketFindHighlights(q, qLower, candidates) {
    if (!candidates.length) {
      postSpocketFindResult(false, 'No match in this notes page', { matchCount: 0 });
      return;
    }
    candidates.sort(function (a, b) {
      return b.score - a.score;
    });
    var BLOCK_SEL = 'p,li,td,th,h1,h2,h3,h4,h5,h6,section,article,blockquote,pre,table,dd,dt,figure';
    var byBlock = new Map();
    for (var ci = 0; ci < candidates.length; ci++) {
      var c = candidates[ci];
      var block = c.el.closest && c.el.closest(BLOCK_SEL) ? c.el.closest(BLOCK_SEL) : c.el;
      var prev = byBlock.get(block);
      if (!prev || prev.score < c.score) byBlock.set(block, { block: block, score: c.score, textNode: c.textNode, el: c.el });
    }
    var blockList = Array.from(byBlock.values()).sort(function (a, b) {
      return b.score - a.score;
    });
    var maxBlocks = 6;
    var usedTextForMark = false;
    for (var bi = 0; bi < blockList.length && spocketFindMatchEls.length < maxBlocks; bi++) {
      var item = blockList[bi];
      var textNode = item.textNode;
      var el = item.el;
      var idx = textNode && textNode.nodeValue ? textNode.nodeValue.toLowerCase().indexOf(qLower) : -1;
      var didMark = false;
      if (!usedTextForMark && idx >= 0 && textNode.nodeValue && textNode.nodeValue.length >= idx + q.length) {
        try {
          var range = document.createRange();
          range.setStart(textNode, idx);
          range.setEnd(textNode, idx + q.length);
          var mark = document.createElement('mark');
          mark.className = 'tm-spocket-find-mark';
          range.surroundContents(mark);
          spocketFindEntries.push({ type: 'mark', node: mark });
          spocketFindMatchEls.push(mark);
          usedTextForMark = true;
          didMark = true;
        } catch (e3) {
          /* range crosses element boundary */
        }
      }
      if (!didMark) {
        var target = item.block;
        try {
          target.classList.add('tm-spocket-find-outline');
          spocketFindEntries.push({ type: 'outline', el: target });
          spocketFindMatchEls.push(target);
        } catch (e4) {}
      }
    }
    if (!spocketFindMatchEls.length) {
      postSpocketFindResult(false, 'No usable highlights', { matchCount: 0 });
      return;
    }
    spocketFindActiveIndex = 0;
    spocketFindApplyActiveVisual();
    try {
      spocketFindMatchEls[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e5) {}
    postSpocketFindResult(true, 'Matches highlighted', { matchCount: spocketFindMatchEls.length });
  }

  function runSpocketFindQuery(rawQuery) {
    clearSpocketFindHighlights();
    var q = (rawQuery && String(rawQuery).trim()) || '';
    if (!q) {
      postSpocketFindResult(false, 'Empty search', { matchCount: 0 });
      return;
    }
    var qLower = q.toLowerCase();
    var words = qLower.split(/\s+/).filter(function (w) {
      return w.length > 1;
    });
    if (words.length === 0) words = [qLower];
    collectSpocketFindCandidatesChunked(qLower, words, function (candidates) {
      try {
        applySpocketFindHighlights(q, qLower, candidates);
      } catch (eApply) {
        postSpocketFindResult(false, eApply && eApply.message ? String(eApply.message) : 'Search error', { matchCount: 0 });
      }
    });
  }
  function hideColorManagePop() {
    if (popColorManage) {
      popColorManage.classList.remove('tm-open');
      popColorManage.style.display = 'none';
    }
  }
  function hideHlManagePop() {
    if (popHlManage) {
      popHlManage.classList.remove('tm-open');
      popHlManage.style.display = 'none';
    }
  }
  function closeAllPops() {
    hideColorManagePop();
    hideHlManagePop();
    if (popShapes) {
      popShapes.classList.remove('tm-open');
      if (wrapShapesRoot && popShapes.parentNode === document.body) wrapShapesRoot.appendChild(popShapes);
      if (btnShapesToggle) btnShapesToggle.setAttribute('aria-expanded', 'false');
    }
    if (popStyle) {
      popStyle.classList.remove('tm-open');
      if (wrapStyleRoot && popStyle.parentNode === document.body) wrapStyleRoot.appendChild(popStyle);
      if (btnStyleToggle) btnStyleToggle.setAttribute('aria-expanded', 'false');
    }
  }
  function postColorRecentToParent(hex) {
    if (!hex || typeof hex !== 'string') return;
    try {
      // Remember last-used colors for the preset picker “Recent” row.
      window.parent.postMessage({ type: 'tm_color_recent_save', payload: String(hex) }, '*');
    } catch (e) {}
  }
  function saveHlColorSlots() {
    try {
      // Save the extra highlighter swatch list to the parent (browser storage lives there).
      window.parent.postMessage({ type: 'tm_hl_color_slots_save', payload: JSON.stringify(hlColorSlots) }, '*');
    } catch (e2) {}
  }
  // Applies a highlighter dot choice: sets the color the next text highlight will use.
  function pickHlColorFromEl(el) {
    if (!el) return;
    var c = normalizeHlHex(el.getAttribute('data-c') || '');
    if (!c) return;
    try {
      if (typeof window.hlColor !== 'undefined') window.hlColor = c;
    } catch (e3) {}
    try {
      if (typeof window.pickC === 'function') window.pickC(el);
      else {
        document.querySelectorAll('.hlc').forEach(function (x) {
          x.classList.remove('on');
        });
        el.classList.add('on');
      }
    } catch (e4) {}
  }
  function init() {
    injectBaseCss();
    bar = document.getElementById('hl-bar');
    minEl = document.getElementById('hl-min');
    if (!bar) return;
    shapeCtxEl = document.createElement('div');
    shapeCtxEl.id = 'tm-drawing-ctx';
    shapeCtxEl.className = 'tm-drawing-ctx';
    shapeCtxEl.hidden = true;
    document.body.appendChild(shapeCtxEl);
    var annRoot = document.createElement('div');
    annRoot.id = 'tm-annotations-fixed';
    var imgHost0 = document.createElement('div');
    imgHost0.id = 'tm-workspace-images-host';
    var stickyHost0 = document.createElement('div');
    stickyHost0.id = 'tm-sticky-host';
    annRoot.appendChild(imgHost0);
    annRoot.appendChild(stickyHost0);
    document.body.appendChild(annRoot);
    bar.classList.add('tm-ws-host');
    bar.classList.add('tm-ws-collapsed');
    if (getComputedStyle(document.body).position === 'static') document.body.style.position = 'relative';

    // --- Messages from the parent study page (settings, saved drawings, layout) ---
    window.addEventListener('message', function (ev) {
      if (!ev || !ev.data) return;
      if (ev.data.type === 'tm_clear_canvas') {
        items = [];
        resetDrawHistory();
        selId = null;
        saveDrawings();
        render();
        try {
          if (typeof clearAll === 'function') clearAll();
        } catch (eClr) {}
        hideShapeCtxMenu();
        return;
      }
      // Parent toggled light/dark; mirror the class on <html> here.
      if (ev.data.type === 'tm_sr_theme' && (ev.data.theme === 'light' || ev.data.theme === 'dark')) {
        try {
          document.documentElement.classList.toggle('sr-light', ev.data.theme === 'light');
          document.documentElement.setAttribute('data-sr-theme', ev.data.theme);
          document.documentElement.setAttribute('data-theme', ev.data.theme);
        } catch (eTheme) { /* ignore */ }
        return;
      }
      // First load / refresh: parent sends colors, drawings, toolbar position, etc.
      if (ev.data.type === 'tm_iframe_workspace_boot' && ev.data.payload) {
        var p = ev.data.payload;
        // Apply theme from boot payload (first paint was handled by injectThemeBootstrap).
        if (p.theme === 'light' || p.theme === 'dark') {
          try {
            document.documentElement.classList.toggle('sr-light', p.theme === 'light');
            document.documentElement.setAttribute('data-sr-theme', p.theme);
            document.documentElement.setAttribute('data-theme', p.theme);
          } catch (eTh) { /* ignore */ }
        }
        // Hydrate highlight marks from saved payload (slot-indexed + legacy {text,bg}).
        if (typeof p.highlights === 'string' && p.highlights && window.__TM_SR_HL) {
          try {
            var parsed = JSON.parse(p.highlights);
            if (Array.isArray(parsed)) {
              // Store into the local backing key so restoreHL reads the same data.
              try { localStorage.setItem(window.__TM_SR_HL.LS_KEY, p.highlights); } catch (eLS) { /* ignore */ }
              if (typeof window.restoreHL === 'function') window.restoreHL();
              if (typeof window.__TM_SR_HL_REWIRE === 'function') window.__TM_SR_HL_REWIRE();
            }
          } catch (eHL) { /* ignore */ }
        }
        if (p.globalStyle && typeof p.globalStyle === 'object') {
          Object.assign(activeStyle, p.globalStyle);
          if (activeStyle.fontSizePt == null || isNaN(activeStyle.fontSizePt)) activeStyle.fontSizePt = 14;
          if (activeStyle.lineWidthPt == null || isNaN(activeStyle.lineWidthPt)) activeStyle.lineWidthPt = 2.8;
        }
        if (Array.isArray(p.colorSlots)) {
          if (p.colorSlots.length) {
            colorSlots = [];
            for (var si = 0; si < p.colorSlots.length && si < MAX_PRESET_COLORS; si++) {
              if (typeof p.colorSlots[si] === 'string') colorSlots.push(p.colorSlots[si]);
            }
            if (colorSlots.length === 0) colorSlots = DEFAULT_PRESET_COLORS.slice();
          } else {
            colorSlots = DEFAULT_PRESET_COLORS.slice();
          }
        }
        colorRecentList = [];
        if (Array.isArray(p.colorRecent)) {
          for (var ri = 0; ri < p.colorRecent.length && ri < MAX_COLOR_RECENT; ri++) {
            if (typeof p.colorRecent[ri] === 'string' && /^#/.test(p.colorRecent[ri])) colorRecentList.push(p.colorRecent[ri]);
          }
        }
        if (Array.isArray(p.hlColorSlots)) {
          hlColorSlots = [];
          for (var hli = 0; hli < p.hlColorSlots.length && hli < MAX_HL_SLOTS; hli++) {
            if (typeof p.hlColorSlots[hli] === 'string' && /^#/.test(p.hlColorSlots[hli])) hlColorSlots.push(p.hlColorSlots[hli]);
          }
          if (hlColorSlots.length === 0) hlColorSlots = DEFAULT_HL_COLORS.slice();
        }
        if (Array.isArray(p.drawings)) {
          var nextItems = migrateItems(p.drawings);
          var sameDrawings = JSON.stringify(items) === JSON.stringify(nextItems);
          if (!sameDrawings) {
            items = nextItems;
            resetDrawHistory();
          }
        }
        if (p.hlBar) applyHlLayout(p.hlBar);
        if (btnNotesExpandLayout) {
          var hideNotesExpand = p.showNotesExpandToggle === false;
          btnNotesExpandLayout.style.display = hideNotesExpand ? 'none' : '';
          btnNotesExpandLayout.hidden = hideNotesExpand;
          btnNotesExpandLayout.setAttribute('aria-hidden', hideNotesExpand ? 'true' : 'false');
        }
        if (btnFormulaSheetToggle) {
          var hideFormulaToggle = p.showFormulaSheetToggle === false;
          btnFormulaSheetToggle.style.display = hideFormulaToggle ? 'none' : '';
          btnFormulaSheetToggle.hidden = hideFormulaToggle;
          btnFormulaSheetToggle.setAttribute('aria-hidden', hideFormulaToggle ? 'true' : 'false');
        }
        if (btnSidebarToggle) {
          var hideSidebarToggle = p.showSidebarToggle === false || !pageHasSidebar();
          btnSidebarToggle.style.display = hideSidebarToggle ? 'none' : '';
          btnSidebarToggle.hidden = hideSidebarToggle;
          btnSidebarToggle.setAttribute('aria-hidden', hideSidebarToggle ? 'true' : 'false');
          if (!hideSidebarToggle && typeof p.sidebarCollapsed === 'boolean') applySidebarCollapsed(p.sidebarCollapsed);
        } else if (pageHasSidebar() && typeof p.sidebarCollapsed === 'boolean') {
          applySidebarCollapsed(p.sidebarCollapsed);
        }
        render();
        syncStyleInputs();
        syncHlColorFromStyle();
        rebuildPresetSlotsInline();
        syncStylePopSlots();
        rebuildHlExtraSlots();
        if (p.resumeTool === 'hl' || p.resumeTool === 'eraser') setActiveTool(p.resumeTool);
        return;
      }
      if (ev.data.type === 'tm_hl_bar_layout' && ev.data.payload) {
        applyHlLayout(ev.data.payload);
      }
      if (ev.data.type === 'tm_color_recent_sync' && Array.isArray(ev.data.payload)) {
        colorRecentList = [];
        for (var rj = 0; rj < ev.data.payload.length && rj < MAX_COLOR_RECENT; rj++) {
          if (typeof ev.data.payload[rj] === 'string' && /^#/.test(ev.data.payload[rj])) {
            colorRecentList.push(ev.data.payload[rj]);
          }
        }
        if (typeof window.TM_refreshColorRecentUI === 'function') window.TM_refreshColorRecentUI();
      }
      if (ev.data.type === 'tm_spocket_find') {
        try {
          runSpocketFindQuery(ev.data.query);
        } catch (eFind) {
          postSpocketFindResult(false, eFind && eFind.message ? String(eFind.message) : 'Search error', {
            matchCount: 0
          });
        }
        return;
      }
      if (ev.data.type === 'tm_spocket_find_step') {
        spocketFindAdvance(ev.data.delta);
        return;
      }
      if (ev.data.type === 'tm_spocket_find_clear') {
        clearSpocketFindHighlights();
        return;
      }
      if (ev.data.type === 'tm_spocket_extract_text') {
        try {
          var plainText = (document.body.innerText || '').slice(0, 15000);
          window.parent.postMessage({
            type: 'tm_spocket_extract_text_result',
            ok: true,
            text: plainText
          }, '*');
        } catch (eExtract) {
          window.parent.postMessage({
            type: 'tm_spocket_extract_text_result',
            ok: false,
            text: '',
            message: eExtract && eExtract.message ? String(eExtract.message) : 'Extract failed'
          }, '*');
        }
        return;
      }
    });

    var nodes = [];
    while (bar.firstChild) nodes.push(bar.removeChild(bar.firstChild));
    chromeRoot = document.createElement('div');
    chromeRoot.className = 'tm-ws-chrome';
    // --- Small undo/redo row above the rest of the bar (always visible, even when bar is collapsed) ---
    chromeHead = document.createElement('div');
    chromeHead.className = 'tm-ws-chrome-head';
    btnUndo = document.createElement('button');
    btnUndo.type = 'button';
    btnUndo.className = 'tm-ws-head-btn';
    btnUndo.title = 'Undo last drawing';
    btnUndo.setAttribute('aria-label', 'Undo');
    btnUndo.setAttribute('aria-disabled', 'true');
    btnUndo.classList.add('tm-ws-head-btn--disabled');
    btnUndo.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9 9 4" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linejoin="round"/><path d="M5 9h12a5 5 0 0 1 0 10H10" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"/></svg>';
    btnUndo.addEventListener(
      'click',
      function (e) {
        e.stopPropagation();
        closeAllPops();
        undoDraw();
      },
      true
    );
    btnRedo = document.createElement('button');
    btnRedo.type = 'button';
    btnRedo.className = 'tm-ws-head-btn';
    btnRedo.title = 'Redo drawing';
    btnRedo.setAttribute('aria-label', 'Redo');
    btnRedo.setAttribute('aria-disabled', 'true');
    btnRedo.classList.add('tm-ws-head-btn--disabled');
    btnRedo.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 14l5-5-5-5" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linejoin="round"/><path d="M19 9H7a5 5 0 0 0 0 10h7" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"/></svg>';
    btnRedo.addEventListener(
      'click',
      function (e) {
        e.stopPropagation();
        closeAllPops();
        redoDraw();
      },
      true
    );
    // Idle icon (dots-in-square): the only control visible when the toolbar is
    // collapsed and hasn't been hovered recently. Hover over the pill (desktop)
    // or tap the icon (mobile) to reveal undo/redo/drag/collapse.
    var btnIdle = document.createElement('button');
    btnIdle.type = 'button';
    btnIdle.className = 'tm-ws-idle-btn';
    btnIdle.setAttribute('aria-label', 'Show toolbar controls');
    btnIdle.title = 'Show toolbar controls';
    btnIdle.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="6" cy="6" r="1.7" fill="currentColor"/>' +
      '<circle cx="12" cy="6" r="1.7" fill="currentColor"/>' +
      '<circle cx="18" cy="6" r="1.7" fill="currentColor"/>' +
      '<circle cx="6" cy="12" r="1.7" fill="currentColor"/>' +
      '<circle cx="12" cy="12" r="1.7" fill="currentColor"/>' +
      '<circle cx="18" cy="12" r="1.7" fill="currentColor"/>' +
      '<circle cx="6" cy="18" r="1.7" fill="currentColor"/>' +
      '<circle cx="12" cy="18" r="1.7" fill="currentColor"/>' +
      '<circle cx="18" cy="18" r="1.7" fill="currentColor"/>' +
      '</svg>';
    btnIdle.addEventListener('click', function (ev) {
      ev.stopPropagation();
      // On touch, click temporarily lifts idle for a few seconds so the user can tap
      // undo/redo/collapse. On desktop, pointer-over-the-pill already does this via CSS hover.
      scheduleIdleLift(2800);
    });
    chromeHead.appendChild(btnIdle);
    chromeHead.appendChild(btnUndo);
    chromeHead.appendChild(btnRedo);
    chromeRoot.appendChild(chromeHead);
    var drag = document.createElement('div');
    drag.className = 'tm-ws-drag';
    drag.title = 'Drag toolbar';
    drag.setAttribute('aria-label', 'Drag toolbar');
    drag.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="2" fill="currentColor"/><circle cx="15" cy="8" r="2" fill="currentColor"/><circle cx="9" cy="16" r="2" fill="currentColor"/><circle cx="15" cy="16" r="2" fill="currentColor"/></svg>';
    btnCollapse = document.createElement('button');
    btnCollapse.type = 'button';
    btnCollapse.className = 'tm-ws-collapse';
    btnCollapse.setAttribute('aria-expanded', 'false');
    btnCollapse.setAttribute('aria-label', 'Expand toolbar');
    btnCollapse.innerHTML = '⌄';
    btnCollapse.addEventListener('click', function (e) {
      e.stopPropagation();
      setCollapsed(!collapsed);
      btnCollapse.textContent = collapsed ? '⌄' : '⌃';
      btnCollapse.setAttribute('aria-label', collapsed ? 'Expand toolbar' : 'Collapse toolbar');
    });
    // --- Main row of icon buttons and menus (pointer, highlighter, arrow, shapes, style, …) ---
    var tools = document.createElement('div');
    tools.className = 'tm-ws-tools';

    function mkDiv() {
      var d0 = document.createElement('span');
      d0.className = 'tm-ws-div';
      return d0;
    }
    function postTool(act, val) {
      // Bold / font size for sticky notes on the parent page.
      window.parent.postMessage({ type: 'tm_sticky_tool', action: act, value: val }, '*');
    }

    btnPointer = document.createElement('button');
    btnPointer.type = 'button';
    btnPointer.className = 'tm-ic-btn';
    btnPointer.title = 'Pointer — select text, notes, and shapes (drag to move drawings)';
    btnPointer.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4 L4 20 12 14 16 22 18 21 14 12 20 10 Z" fill="currentColor"/></svg>';
    btnPointer.addEventListener('click', function (e) {
      e.stopPropagation();
      closeAllPops();
      setActiveTool('pointer');
    });

    tools.appendChild(btnPointer);
    btnNotesExpandLayout = document.createElement('button');
    btnNotesExpandLayout.type = 'button';
    btnNotesExpandLayout.className = 'tm-ic-btn';
    btnNotesExpandLayout.title =
      'Expand notes layout — widens the notes area on this page (same as the Expand view control above the notes)';
    btnNotesExpandLayout.setAttribute('aria-label', 'Expand notes layout');
    btnNotesExpandLayout.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M9 3H3v6M15 3h6v6M3 15v6h6M15 21h6v-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
    btnNotesExpandLayout.addEventListener('click', function (e) {
      e.stopPropagation();
      closeAllPops();
      try {
        window.parent.postMessage({ type: 'tm_notes_expand_toggle' }, '*');
      } catch (eNe) {}
    });
    tools.appendChild(btnNotesExpandLayout);
    btnFormulaSheetToggle = document.createElement('button');
    btnFormulaSheetToggle.type = 'button';
    btnFormulaSheetToggle.className = 'tm-ic-btn';
    btnFormulaSheetToggle.title = 'Formula sheet — show or hide the ECOR 2050 formula panel beside your notes';
    btnFormulaSheetToggle.setAttribute('aria-label', 'Toggle formula sheet');
    btnFormulaSheetToggle.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M7 5h10M7 9h6M7 13h10M7 17h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M17 7v10M14 10h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '</svg>';
    btnFormulaSheetToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      closeAllPops();
      try {
        window.parent.postMessage({ type: 'tm_formula_sheet_toggle' }, '*');
      } catch (eFs) {}
    });
    tools.appendChild(btnFormulaSheetToggle);

    btnSidebarToggle = document.createElement('button');
    btnSidebarToggle.type = 'button';
    btnSidebarToggle.className = 'tm-ic-btn';
    btnSidebarToggle.title = 'Sidebar — show or hide the notes sidebar (when the page provides one)';
    btnSidebarToggle.setAttribute('aria-label', 'Toggle sidebar');
    btnSidebarToggle.setAttribute('aria-pressed', 'false');
    btnSidebarToggle.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">' +
      '<rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M9 5v14" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '</svg>';
    btnSidebarToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      closeAllPops();
      applySidebarCollapsed(!sidebarCollapsed);
    });
    // Hidden until boot payload arrives (and only shown if #sidebar exists).
    btnSidebarToggle.style.display = 'none';
    btnSidebarToggle.hidden = true;
    btnSidebarToggle.setAttribute('aria-hidden', 'true');
    tools.appendChild(btnSidebarToggle);
    tools.appendChild(mkDiv());

    btnHl = document.createElement('button');
    btnHl.type = 'button';
    btnHl.className = 'tm-ws-hl-toggle';
    btnHl.setAttribute('aria-pressed', 'false');
    btnHl.title =
      'Highlighter on: drag to highlight text; click an existing highlight to remove it — stays on when the bar is collapsed until you turn it off (Ctrl+H)';
    btnHl.innerHTML =
      '<span class="tm-ws-hl-ic" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M5 19 L10 5 19 19 M8 13h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>' +
      '<span class="tm-ws-hl-state">Off</span>';
    btnHl.addEventListener('click', function (e) {
      e.stopPropagation();
      closeAllPops();
      setActiveTool(activeToolKind === 'hl' ? 'pointer' : 'hl');
    });

    btnEraser = document.createElement('button');
    btnEraser.type = 'button';
    btnEraser.className = 'tm-ic-btn';
    btnEraser.title = 'Highlight eraser — click a highlight to remove';
    btnEraser.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/></svg>';
    btnEraser.addEventListener('click', function (e) {
      e.stopPropagation();
      closeAllPops();
      setActiveTool(activeToolKind === 'eraser' ? 'pointer' : 'eraser');
    });
    btnPen = document.createElement('button');
    btnPen.type = 'button';
    btnPen.className = 'tm-ic-btn';
    btnPen.title = 'Arrow — click and drag (Ctrl+A to toggle on/off when not typing in a field)';
    btnPen.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18 L18 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 4 L18 4 18 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
    btnPen.addEventListener('click', function (e) {
      e.stopPropagation();
      closeAllPops();
      if (activeToolKind === 'pen') setActiveTool('pointer');
      else setActiveTool('pen');
    });

    var undoCluster = document.createElement('div');
    undoCluster.className = 'tm-ws-undo-cluster';
    undoCluster.appendChild(btnPen);
    tools.appendChild(undoCluster);
    tools.appendChild(mkDiv());

    var sb = document.createElement('button');
    sb.type = 'button';
    sb.className = 'tm-ic-btn';
    sb.title = 'Sticky note — or Ctrl+Shift+S when focus is not in a text field (study guide only)';
    sb.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
    sb.addEventListener('click', function (e) {
      e.stopPropagation();
      closeAllPops();
      setActiveTool('sticky');
      // Ask parent page to drop a new sticky note on the workspace.
      window.parent.postMessage({ type: 'tm_sticky_add' }, '*');
      setActiveTool('pointer');
    });
    tools.appendChild(sb);
    var btnImage = document.createElement('button');
    btnImage.type = 'button';
    btnImage.className = 'tm-ic-btn';
    btnImage.title = 'Add image to workspace';
    btnImage.setAttribute('aria-label', 'Add image');
    btnImage.innerHTML =
      '<svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<circle cx="8.5" cy="10" r="1.5" fill="currentColor"/><path d="M3 15l5-4 4 3 5-5 4 4v2H3z" fill="currentColor" opacity=".88"/></svg>';
    btnImage.addEventListener('click', function (e) {
      e.stopPropagation();
      closeAllPops();
      try {
        window.parent.postMessage({ type: 'tm_workspace_image_add' }, '*');
      } catch (eImg) {}
    });
    tools.appendChild(btnImage);
    tools.appendChild(mkDiv());

    presetScrollWrap = document.createElement('div');
    presetScrollWrap.className = 'tm-ws-inline-slots tm-ws-presets-scroll';
    presetScrollWrap.title = 'Color presets — right-click a dot to replace with active color; + to add';
    var presetsStack = document.createElement('div');
    presetsStack.className = 'tm-ws-stack tm-ws-presets-stack--grow';
    var presetsHead = document.createElement('div');
    presetsHead.className = 'tm-ws-presets-head';
    var presetsLab = document.createElement('span');
    presetsLab.className = 'tm-ws-stack-label';
    presetsLab.textContent = 'Presets';
    presetsHead.appendChild(presetsLab);
    var btnPresetReset = document.createElement('button');
    btnPresetReset.type = 'button';
    btnPresetReset.className = 'tm-txt-btn tm-ws-presets-reset';
    btnPresetReset.textContent = 'Reset';
    btnPresetReset.title = 'Reset presets — Engineering Red (#E63946) first';
    btnPresetReset.addEventListener('click', function (e) {
      e.stopPropagation();
      colorSlots = DEFAULT_PRESET_COLORS.slice();
      saveColorSlots();
      rebuildPresetSlotsInline();
      syncStylePopSlots();
      syncStyleInputs();
      applyStylePipeline();
    });
    presetsHead.appendChild(btnPresetReset);
    presetsStack.appendChild(presetsHead);
    var presetsRow = document.createElement('div');
    presetsRow.className = 'tm-ws-stack-row';
    presetsRow.appendChild(presetScrollWrap);
    presetsStack.appendChild(presetsRow);

    var colorManageInp = null;
    var colorManageRecentRow = null;
    function refreshColorManageRecentUI() {
      if (!colorManageRecentRow) return;
      colorManageRecentRow.innerHTML = '';
      for (var hi = 0; hi < colorRecentList.length; hi++) {
        (function (hx) {
          var rb = document.createElement('button');
          rb.type = 'button';
          rb.className = 'tm-slot';
          rb.style.background = hx;
          rb.title = hx;
          rb.addEventListener('click', function (ev) {
            ev.stopPropagation();
            activeStyle.color = hx;
            if (colorManageInp) colorManageInp.value = hx;
            postColorRecentToParent(hx);
            syncStyleInputs();
            applyStylePipeline();
          });
          colorManageRecentRow.appendChild(rb);
        })(colorRecentList[hi]);
      }
    }
    function buildColorManagePop() {
      if (popColorManage) return;
      popColorManage = document.createElement('div');
      popColorManage.className = 'tm-color-manage-pop';
      popColorManage.setAttribute('role', 'dialog');
      popColorManage.setAttribute('aria-label', 'Color presets');
      var lab = document.createElement('div');
      lab.style.fontSize = '10px';
      lab.style.textTransform = 'uppercase';
      lab.style.letterSpacing = '0.06em';
      lab.style.color = 'rgba(255,255,255,.5)';
      lab.textContent = 'Pick & presets';
      colorManageInp = document.createElement('input');
      colorManageInp.type = 'color';
      colorManageInp.className = 'tm-ws-color';
      colorManageInp.value = activeStyle.color || '#add7ff';
      colorManageInp.addEventListener('input', function () {
        activeStyle.color = colorManageInp.value;
        postColorRecentToParent(activeStyle.color);
        syncStyleInputs();
        applyStylePipeline();
      });
      var btnAddPreset = document.createElement('button');
      btnAddPreset.type = 'button';
      btnAddPreset.className = 'tm-txt-btn';
      btnAddPreset.textContent = 'Add to presets';
      btnAddPreset.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var v = colorManageInp ? colorManageInp.value : activeStyle.color;
        if (!v) return;
        if (colorSlots.length >= MAX_PRESET_COLORS) return;
        colorSlots.push(v);
        saveColorSlots();
        rebuildPresetSlotsInline();
        syncStylePopSlots();
        postColorRecentToParent(v);
      });
      var labR = document.createElement('div');
      labR.style.fontSize = '10px';
      labR.style.textTransform = 'uppercase';
      labR.style.color = 'rgba(255,255,255,.45)';
      labR.textContent = 'Recent';
      colorManageRecentRow = document.createElement('div');
      colorManageRecentRow.className = 'tm-color-recent-row';
      popColorManage.appendChild(lab);
      popColorManage.appendChild(colorManageInp);
      popColorManage.appendChild(btnAddPreset);
      popColorManage.appendChild(labR);
      popColorManage.appendChild(colorManageRecentRow);
      document.body.appendChild(popColorManage);
      window.TM_refreshColorRecentUI = refreshColorManageRecentUI;
    }
    function openColorManagePop(anchorBtn) {
      hideHlManagePop();
      buildColorManagePop();
      if (colorManageInp) colorManageInp.value = activeStyle.color || '#add7ff';
      popColorManage.classList.add('tm-open');
      popColorManage.style.display = 'flex';
      refreshColorManageRecentUI();
      requestAnimationFrame(function () {
        positionPopNear(anchorBtn, popColorManage);
      });
    }

    function rebuildPresetSlotsInline() {
      if (!presetScrollWrap) return;
      presetScrollWrap.innerHTML = '';
      inlineSlotEls = [];
      for (var i = 0; i < colorSlots.length; i++) {
        (function (idx) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'tm-slot';
          b.title = 'Preset ' + (idx + 1);
          bindColorSlot(b, idx);
          var pc = colorSlots[idx] || '#888888';
          b.style.backgroundColor = pc;
          b.style.background = pc;
          inlineSlotEls[idx] = b;
          presetScrollWrap.appendChild(b);
        })(i);
      }
      var addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'tm-slot tm-slot-add';
      addBtn.title = 'Add preset color';
      addBtn.setAttribute('aria-label', 'Add color preset');
      addBtn.textContent = '+';
      btnAddPresetSlot = addBtn;
      addBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (popColorManage && popColorManage.classList.contains('tm-open')) hideColorManagePop();
        else openColorManagePop(addBtn);
      });
      presetScrollWrap.appendChild(addBtn);
    }
    function syncStylePopSlots() {
      if (!slotRowEl) return;
      slotRowEl.innerHTML = '';
      slotEls = [];
      for (var si = 0; si < colorSlots.length; si++) {
        (function (idx) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'tm-slot';
          b.title = 'Slot ' + (idx + 1);
          bindColorSlot(b, idx);
          var pc2 = colorSlots[idx] || '#888888';
          b.style.backgroundColor = pc2;
          b.style.background = pc2;
          slotEls[idx] = b;
          slotRowEl.appendChild(b);
        })(si);
      }
    }
    rebuildPresetSlotsInline();

    var wrapStyle = document.createElement('div');
    wrapStyle.className = 'tm-popwrap';
    wrapStyleRoot = wrapStyle;
    btnStyleToggle = document.createElement('button');
    btnStyleToggle.type = 'button';
    btnStyleToggle.className = 'tm-txt-btn';
    btnStyleToggle.textContent = 'Style';
    popStyle = document.createElement('div');
    popStyle.className = 'tm-pop';
    var lab = document.createElement('label');
    lab.textContent = 'Size (pt)';
    lab.style.fontSize = '11px';
    lab.style.color = 'var(--txd)';
    inpPt = document.createElement('input');
    inpPt.type = 'number';
    inpPt.className = 'tm-ws-num';
    inpPt.min = 3;
    inpPt.max = 60;
    inpPt.step = 0.5;
    inpPt.addEventListener('change', function () {
      setFontSizePt(inpPt.value);
    });
    inpRange = document.createElement('input');
    inpRange.type = 'range';
    inpRange.className = 'tm-ws-range';
    inpRange.min = 3;
    inpRange.max = 60;
    inpRange.step = 0.5;
    inpRange.addEventListener('input', function () {
      setFontSizePt(inpRange.value);
    });
    inpColor = document.createElement('input');
    inpColor.type = 'color';
    inpColor.className = 'tm-ws-color';
    inpColor.addEventListener('input', function () {
      activeStyle.color = inpColor.value;
      postColorRecentToParent(activeStyle.color);
      applyStylePipeline();
    });
    var slotRow = document.createElement('div');
    slotRow.className = 'tm-poprow';
    slotRow.title = 'Quick colors — right-click a slot to save';
    slotRowEl = slotRow;
    popStyle.appendChild(lab);
    popStyle.appendChild(inpPt);
    popStyle.appendChild(inpRange);
    popStyle.appendChild(inpColor);
    popStyle.appendChild(slotRow);
    var bb = document.createElement('button');
    bb.type = 'button';
    bb.className = 'tm-txt-btn';
    bb.textContent = 'Bold';
    bb.addEventListener('click', function (e) {
      e.stopPropagation();
      postTool('bold');
    });
    popStyle.appendChild(bb);
    syncStylePopSlots();
    btnStyleToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var opening = !popStyle.classList.contains('tm-open');
      if (opening) {
        if (popShapes) {
          popShapes.classList.remove('tm-open');
          if (wrapShapesRoot && popShapes.parentNode === document.body) wrapShapesRoot.appendChild(popShapes);
          if (btnShapesToggle) btnShapesToggle.setAttribute('aria-expanded', 'false');
        }
        popStyle.classList.add('tm-open');
        document.body.appendChild(popStyle);
        requestAnimationFrame(function () {
          positionPopNear(btnStyleToggle, popStyle);
        });
        btnStyleToggle.setAttribute('aria-expanded', 'true');
      } else {
        popStyle.classList.remove('tm-open');
        if (wrapStyleRoot && popStyle.parentNode === document.body) wrapStyleRoot.appendChild(popStyle);
        btnStyleToggle.setAttribute('aria-expanded', 'false');
      }
    });
    wrapStyle.appendChild(btnStyleToggle);
    wrapStyle.appendChild(popStyle);

    // --- Shapes menu (circle / square / underline + line style) — icon button sits next to Style ---
    var wrapShapes = document.createElement('div');
    wrapShapes.className = 'tm-popwrap';
    wrapShapesRoot = wrapShapes;
    btnShapesToggle = document.createElement('button');
    btnShapesToggle.type = 'button';
    btnShapesToggle.className = 'tm-ic-btn';
    btnShapesToggle.setAttribute('aria-label', 'Shapes');
    btnShapesToggle.title = 'Shapes — circle, square, underline (line type under Line type…)';
    btnShapesToggle.setAttribute('aria-expanded', 'false');
    btnShapesToggle.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M5 8 L9 3 L13 8 Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>' +
      '<rect x="14" y="4.5" width="7" height="7" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.9"/>' +
      '<circle cx="8" cy="17.5" r="3.4" fill="none" stroke="currentColor" stroke-width="1.9"/>' +
      '</svg>';
    popShapes = document.createElement('div');
    popShapes.className = 'tm-pop';
    function mkShapeBtn(label, mode) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tm-txt-btn';
      b.textContent = label;
      b.dataset.mode = mode;
      b.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setShapeMode(mode, b);
      });
      return b;
    }
    popShapes.appendChild(mkShapeBtn('Circle', 'circle'));
    popShapes.appendChild(mkShapeBtn('Square', 'square'));
    popShapes.appendChild(mkShapeBtn('Underline', 'underline'));
    var dashRow = document.createElement('div');
    dashRow.className = 'tm-dash-row';
    dashRow.style.flexDirection = 'column';
    dashRow.style.alignItems = 'stretch';
    dashRow.style.gap = '6px';
    function mkDashBtn(label, ds) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tm-txt-btn';
      b.textContent = label;
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        activeStyle.dashStyle = ds;
        saveGlobalStyle();
        syncDashButtons();
        applyStyleToSelection();
        if (!selId) render();
      });
      return b;
    }
    btnDashSolid = mkDashBtn('Solid', 'solid');
    btnDashDot = mkDashBtn('Dots', 'dotted');
    btnDashDash = mkDashBtn('Dash', 'dashed');
    dashRow.appendChild(btnDashSolid);
    dashRow.appendChild(btnDashDot);
    dashRow.appendChild(btnDashDash);
    var btnShapesLineType = document.createElement('button');
    btnShapesLineType.type = 'button';
    btnShapesLineType.className = 'tm-txt-btn';
    btnShapesLineType.textContent = 'Line type…';
    var dashPanel = document.createElement('div');
    dashPanel.style.display = 'none';
    dashPanel.style.flexDirection = 'column';
    dashPanel.style.gap = '4px';
    dashPanel.style.marginTop = '4px';
    dashPanel.appendChild(dashRow);
    btnShapesLineType.addEventListener('click', function (e) {
      e.stopPropagation();
      var show = dashPanel.style.display === 'none' || dashPanel.style.display === '';
      dashPanel.style.display = show ? 'flex' : 'none';
      btnShapesLineType.textContent = show ? 'Hide line type' : 'Line type…';
    });
    popShapes.appendChild(btnShapesLineType);
    popShapes.appendChild(dashPanel);
    btnShapesToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var opening = !popShapes.classList.contains('tm-open');
      if (opening) {
        if (popStyle) {
          popStyle.classList.remove('tm-open');
          if (wrapStyleRoot && popStyle.parentNode === document.body) wrapStyleRoot.appendChild(popStyle);
          if (btnStyleToggle) btnStyleToggle.setAttribute('aria-expanded', 'false');
        }
        popShapes.classList.add('tm-open');
        if (dashPanel) {
          dashPanel.style.display = 'none';
          btnShapesLineType.textContent = 'Line type…';
        }
        document.body.appendChild(popShapes);
        requestAnimationFrame(function () {
          positionPopNear(btnShapesToggle, popShapes);
        });
        btnShapesToggle.setAttribute('aria-expanded', 'true');
      } else {
        popShapes.classList.remove('tm-open');
        if (wrapShapesRoot && popShapes.parentNode === document.body) wrapShapesRoot.appendChild(popShapes);
        btnShapesToggle.setAttribute('aria-expanded', 'false');
      }
    });
    wrapShapes.appendChild(btnShapesToggle);
    wrapShapes.appendChild(popShapes);
    tools.appendChild(wrapShapes);
    tools.appendChild(wrapStyle);
    tools.appendChild(mkDiv());

    var hlSpacer = document.createElement('div');
    hlSpacer.className = 'tm-ws-hl-spacer';
    hlSpacer.setAttribute('aria-hidden', 'true');

    function bindHlColorSlot(btn, idx) {
      btn.title = 'Highlighter preset — Click to use · Right-click to change color';
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        pickHlColorFromEl(btn);
      });
      btn.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var cur = normalizeHlHex(hlColorSlots[idx] || '') || '#fff59d';
        openColorWheelThen(cur, function (nv) {
          var nx = normalizeHlHex(nv) || nv;
          hlColorSlots[idx] = nx;
          saveHlColorSlots();
          rebuildHlExtraSlots();
          syncHlColorFromStyle();
        });
      });
    }

    // One row of highlighter presets (same control pattern as drawing color presets).
    function rebuildHlExtraSlots() {
      if (!hlExtraInner) return;
      hlExtraInner.innerHTML = '';
      var dirty = false;
      for (var hexI = 0; hexI < hlColorSlots.length; hexI++) {
        var raw = hlColorSlots[hexI];
        var hx = normalizeHlHex(String(raw || '')) || DEFAULT_HL_COLORS[hexI % DEFAULT_HL_COLORS.length];
        if (raw !== hx) {
          hlColorSlots[hexI] = hx;
          dirty = true;
        }
        (function (idx, disp) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'tm-slot hlc';
          b.setAttribute('data-c', disp);
          b.style.backgroundColor = disp;
          b.style.background = disp;
          bindHlColorSlot(b, idx);
          hlExtraInner.appendChild(b);
        })(hexI, hx);
      }
      if (dirty) saveHlColorSlots();
      refreshHlAddBtnState();
    }
    function buildHlManagePop() {
      if (popHlManage) return;
      popHlManage = document.createElement('div');
      popHlManage.className = 'tm-hl-manage-pop';
      popHlManage.setAttribute('role', 'dialog');
      popHlManage.setAttribute('aria-label', 'Highlighter colors');
      var labH = document.createElement('div');
      labH.style.fontSize = '10px';
      labH.style.textTransform = 'uppercase';
      labH.style.letterSpacing = '0.06em';
      labH.style.color = 'rgba(255,255,255,.5)';
      labH.textContent = 'Pick & presets';
      var inpHl = document.createElement('input');
      inpHl.type = 'color';
      inpHl.className = 'tm-ws-color';
      inpHl.value = hlColorSlots.length ? hlColorSlots[hlColorSlots.length - 1] : '#fff59d';
      var btnAddHl = document.createElement('button');
      btnAddHl.type = 'button';
      btnAddHl.className = 'tm-txt-btn';
      btnAddHl.textContent = 'Add to presets';
      hlPopAddBtn = btnAddHl;
      btnAddHl.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var v = normalizeHlHex(inpHl.value) || inpHl.value;
        if (!v || !/^#/i.test(v)) return;
        v = normalizeHlHex(v) || v;
        var vLow = v.toLowerCase();
        for (var hi = 0; hi < hlColorSlots.length; hi++) {
          if (normalizeHlHex(hlColorSlots[hi]).toLowerCase() === vLow) {
            var dup = hlExtraInner && hlExtraInner.children[hi];
            if (dup) pickHlColorFromEl(dup);
            refreshHlAddBtnState();
            return;
          }
        }
        if (hlColorSlots.length >= MAX_HL_SLOTS) return;
        hlColorSlots.push(v);
        saveHlColorSlots();
        rebuildHlExtraSlots();
        syncHlColorFromStyle();
        var lastDot = hlExtraInner && hlExtraInner.lastElementChild;
        if (lastDot) pickHlColorFromEl(lastDot);
        refreshHlAddBtnState();
      });
      popHlManage.appendChild(labH);
      popHlManage.appendChild(inpHl);
      popHlManage.appendChild(btnAddHl);
      document.body.appendChild(popHlManage);
      popHlManage._tmHlInp = inpHl;
      refreshHlAddBtnState();
    }
    function openHlManagePop(anchorBtn) {
      buildHlManagePop();
      if (popHlManage._tmHlInp) {
        popHlManage._tmHlInp.value =
          hlColorSlots.length ? hlColorSlots[hlColorSlots.length - 1] : '#fff59d';
      }
      popHlManage.classList.add('tm-open');
      popHlManage.style.display = 'flex';
      refreshHlAddBtnState();
      requestAnimationFrame(function () {
        positionPopNear(anchorBtn, popHlManage);
      });
    }

    // Pulls the page’s original highlight controls into the toolbar and adds our extra color row.
    function buildNativeHighlightStrip() {
      var nativeHlOp = null;
      var nativeClearBtn = null;
      var nativeMinBtn = null;
      nodes.forEach(function (n) {
        if (!n || n.nodeType !== 1) return;
        if (n.id === 'hl-op') {
          nativeHlOp = n;
          return;
        }
        if (n.classList && n.classList.contains('hlc')) {
          return;
        }
        if (n.tagName === 'BUTTON') {
          var oc = n.getAttribute('onclick') || '';
          if (oc.indexOf('clearAll') >= 0) nativeClearBtn = n;
          else if (oc.indexOf('minimizeBar') >= 0) nativeMinBtn = n;
        }
      });

      nativeWrap = document.createElement('div');
      nativeWrap.className = 'tm-ws-hl-strip tm-ws-native-wrap';
      var hlGroup = document.createElement('div');
      hlGroup.className = 'tm-ws-hl-group';

      var hlR1 = document.createElement('div');
      hlR1.className = 'tm-ws-hl-row tm-ws-hl-r1';
      var hlTitle = document.createElement('span');
      hlTitle.className = 'tm-ws-hl-heading';
      hlTitle.textContent = 'Highlight';
      hlR1.appendChild(hlTitle);
      hlR1.appendChild(btnHl);
      hlR1.appendChild(btnEraser);
      if (nativeClearBtn) {
        nativeClearBtn.removeAttribute('onclick');
        nativeClearBtn.textContent = 'Clear';
        nativeClearBtn.title = nativeClearBtn.title || 'Remove all text highlights';
        nativeClearBtn.classList.add('tm-txt-btn');
        nativeClearBtn.addEventListener('click', function (ev) {
          ev.preventDefault();
          if (typeof clearAll === 'function') clearAll();
        });
        hlR1.appendChild(nativeClearBtn);
      }
      hlGroup.appendChild(hlR1);

      // One scroll row: saved highlighter presets only (same pattern as drawing presets — no duplicate native row).
      var hlR2 = document.createElement('div');
      hlR2.className = 'tm-ws-hl-row tm-ws-hl-dots-row';
      hlExtraInner = document.createElement('div');
      hlExtraInner.className = 'tm-ws-hl-extra-inner';
      hlR2.appendChild(hlExtraInner);
      btnHlSlotAdd = document.createElement('button');
      btnHlSlotAdd.type = 'button';
      btnHlSlotAdd.className = 'tm-slot tm-slot-add';
      btnHlSlotAdd.title = 'Add highlighter color';
      btnHlSlotAdd.setAttribute('aria-label', 'Add highlighter color');
      btnHlSlotAdd.textContent = '+';
      btnHlSlotAdd.addEventListener('click', function (e) {
        e.stopPropagation();
        hideColorManagePop();
        if (popHlManage && popHlManage.classList.contains('tm-open')) hideHlManagePop();
        else openHlManagePop(btnHlSlotAdd);
      });
      hlR2.appendChild(btnHlSlotAdd);
      hlGroup.appendChild(hlR2);
      rebuildHlExtraSlots();

      var hlR3 = document.createElement('div');
      hlR3.className = 'tm-ws-hl-row tm-ws-hl-op-row';
      if (nativeHlOp) {
        nativeHlOp.classList.add('tm-ws-hl-op-range');
        hlR3.appendChild(nativeHlOp);
      }
      hlGroup.appendChild(hlR3);

      if (nativeMinBtn) {
        nativeMinBtn.style.display = 'none';
        hlGroup.appendChild(nativeMinBtn);
      }

      nativeWrap.appendChild(hlGroup);
    }

    buildNativeHighlightStrip();

    var toolRibbon = document.createElement('div');
    toolRibbon.className = 'tm-ws-tool-ribbon';
    toolRibbon.appendChild(tools);

    var tail = document.createElement('div');
    tail.className = 'tm-ws-tail';
    tail.appendChild(toolRibbon);
    tail.appendChild(presetsStack);
    tail.appendChild(hlSpacer);
    tail.appendChild(nativeWrap);

    var mainRow = document.createElement('div');
    mainRow.className = 'tm-ws-main';
    mainRow.appendChild(drag);
    mainRow.appendChild(btnCollapse);
    mainRow.appendChild(tail);

    chromeRoot.appendChild(mainRow);
    bar.appendChild(chromeRoot);

    var hop = document.getElementById('hl-op');
    if (hop) {
      // Widen the range so dragging produces a visible change. Previously capped at 60-100
      // which was only 40% of slider travel and made the effect look broken.
      hop.min = '20';
      hop.max = '100';
      hop.step = '1';
      var hv = parseInt(hop.value, 10);
      if (isNaN(hv) || hv < 20) hop.value = '85';
      // The unified highlight core uses color-mix() with a CSS var --tm-hl-alpha (percent),
      // so dragging this slider re-tints every highlight in place. Also persist the choice
      // to localStorage so it survives reloads.
      var HL_OP_KEY = 'tm_hl_opacity_v1';
      function applyHlAlpha(v) {
        var pct = Math.max(10, Math.min(100, parseInt(v, 10) || 85));
        document.documentElement.style.setProperty('--tm-hl-alpha', String(pct));
      }
      try {
        var savedOp = localStorage.getItem(HL_OP_KEY);
        if (savedOp) { hop.value = savedOp; }
      } catch (eOpRead) { /* ignore */ }
      applyHlAlpha(hop.value);
      hop.addEventListener('input', function () {
        applyHlAlpha(hop.value);
        try { localStorage.setItem(HL_OP_KEY, String(hop.value)); } catch (eOp) { /* ignore */ }
      });
      // Some upstream HTML also wires `change` — mirror it so both events apply.
      hop.addEventListener('change', function () {
        applyHlAlpha(hop.value);
        try { localStorage.setItem(HL_OP_KEY, String(hop.value)); } catch (eOp2) { /* ignore */ }
      });
    }

    var dragOn = false;
    var ox = 0;
    var oy = 0;
    function downBar(e) {
      if (e.target.closest && e.target.closest('button,input,.tm-pop')) return;
      e.preventDefault();
      dragOn = true;
      var r = bar.getBoundingClientRect();
      var c = e.touches ? e.touches[0] : e;
      ox = c.clientX - r.left;
      oy = c.clientY - r.top;
    }
    function moveBar(e) {
      if (!dragOn) return;
      if (e.cancelable) e.preventDefault();
      var c = e.touches ? e.touches[0] : e;
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var nl = c.clientX - ox;
      var nt = c.clientY - oy;
      nl = Math.max(8, Math.min(nl, vw - bar.offsetWidth - 8));
      nt = Math.max(48, Math.min(nt, vh - bar.offsetHeight - 8));
      bar.style.transform = 'none';
      bar.style.left = (nl / vw) * 100 + '%';
      bar.style.top = (nt / vh) * 100 + '%';
      bar.style.right = 'auto';
      bar.style.bottom = 'auto';
    }
    function upBar() {
      if (!dragOn) return;
      dragOn = false;
      clampBarIntoView();
      saveBarState();
    }
    drag.addEventListener('mousedown', downBar);
    drag.addEventListener('touchstart', downBar, { passive: false });
    document.addEventListener('mousemove', moveBar);
    document.addEventListener('mouseup', upBar);
    document.addEventListener('touchmove', moveBar, { passive: false });
    document.addEventListener('touchend', upBar);

    var cn = document.createElement('button');
    cn.type = 'button';
    cn.textContent = 'Clear notes';
    cn.title = 'Remove all sticky notes (text notes only)';
    cn.className = 'tm-txt-btn';
    cn.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (!confirm('Remove all sticky notes?')) return;
      window.parent.postMessage({ type: 'tm_clear_sticky_notes_only' }, '*');
    });
    tools.appendChild(cn);

    var cc = document.createElement('button');
    cc.type = 'button';
    cc.textContent = 'Clear canvas';
    cc.title = 'Remove shapes, lines, and text highlights';
    cc.className = 'tm-txt-btn';
    cc.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (!confirm('Clear all drawings and highlights? Sticky notes are kept.')) return;
      window.parent.postMessage({ type: 'tm_clear_canvas_request' }, '*');
    });
    tools.appendChild(cc);

    document.addEventListener('click', function (ev) {
      var t = ev.target;
      if (shapeCtxEl && !shapeCtxEl.hidden && shapeCtxEl.contains(t)) return;
      hideShapeCtxMenu();
      if (popColorManage && popColorManage.classList.contains('tm-open')) {
        if (t.closest && t.closest('.tm-color-manage-pop')) return;
        hideColorManagePop();
      }
      if (popHlManage && popHlManage.classList.contains('tm-open')) {
        if (t.closest && t.closest('.tm-hl-manage-pop')) return;
        hideHlManagePop();
      }
      if (t && t.closest && (t.closest('.tm-pop') || t.closest('.tm-popwrap'))) return;
      closeAllPops();
    });
    // Drawing right-click menu: also close on mouse-down outside (clicks don’t always reach document).
    document.addEventListener(
      'mousedown',
      function (ev) {
        if (!shapeCtxEl || shapeCtxEl.hidden) return;
        var t = ev.target;
        if (shapeCtxEl.contains(t)) return;
        hideShapeCtxMenu();
      },
      true
    );

    window.minimizeBar = function () {
      setCollapsed(true);
      btnCollapse.textContent = '⌄';
    };
    window.maximizeBar = function () {
      setCollapsed(false);
      btnCollapse.textContent = '⌃';
    };

    svg = document.createElementNS(NS, 'svg');
    svg.id = 'tm-drawings-svg';
    document.body.appendChild(svg);
    upsizeSvg();
    window.addEventListener('resize', function () {
      render();
      clampBarIntoView();
      closeAllPops();
      hideShapeCtxMenu();
    });

    function startDraw(ev) {
      if (!drawMode) return;
      if (ev.button !== undefined && ev.button !== 0) return;
      var t = ev.target;
      if (!t || typeof t.closest !== 'function') return;
      if (t.closest('#hl-bar') || t.closest('#hl-min') || t.closest('.tm-ws-chrome')) return;
      if (t.closest('.tm-pop') || t.closest('.tm-popwrap')) return;
      var sidPick = t.closest('[data-sid]');
      if (sidPick && activeToolKind === 'pointer') {
        selectItem(sidPick.getAttribute('data-sid'));
        return;
      }
      if (ev.cancelable) ev.preventDefault();
      var p = toDoc(ev);
      drawState = { sx: p.x, sy: p.y };
      if (drawMode === 'arrow') {
        var pg = document.createElementNS(NS, 'g');
        var sh = document.createElementNS(NS, 'path');
        var hd = document.createElementNS(NS, 'polygon');
        var geo0 = arrowShaftAndHead(p.x, p.y, p.x, p.y, activeStyle.lineWidthPt);
        sh.setAttribute('d', geo0.shaft);
        sh.setAttribute('fill', 'none');
        applyStroke(sh, { type: 'arrow', color: activeStyle.color, lineWidthPt: activeStyle.lineWidthPt, dashStyle: activeStyle.dashStyle });
        hd.setAttribute('points', geo0.headPts[0] + ',' + geo0.headPts[1] + ' ' + geo0.headPts[2] + ',' + geo0.headPts[3] + ' ' + geo0.headPts[4] + ',' + geo0.headPts[5]);
        hd.setAttribute('fill', activeStyle.color);
        hd.setAttribute('pointer-events', 'all');
        pg.appendChild(sh);
        pg.appendChild(hd);
        pg._shaft = sh;
        pg._head = hd;
        previewEl = pg;
      } else if (drawMode === 'underline') {
        previewEl = document.createElementNS(NS, 'line');
        previewEl.setAttribute('x1', String(p.x));
        previewEl.setAttribute('y1', String(p.y));
        previewEl.setAttribute('x2', String(p.x));
        previewEl.setAttribute('y2', String(p.y));
      } else if (drawMode === 'circle') {
        previewEl = document.createElementNS(NS, 'ellipse');
        previewEl.setAttribute('cx', String(p.x));
        previewEl.setAttribute('cy', String(p.y));
        previewEl.setAttribute('rx', '1');
        previewEl.setAttribute('ry', '1');
        previewEl.setAttribute('fill', 'none');
      } else {
        previewEl = document.createElementNS(NS, 'rect');
        previewEl.setAttribute('x', String(p.x));
        previewEl.setAttribute('y', String(p.y));
        previewEl.setAttribute('width', '1');
        previewEl.setAttribute('height', '1');
        previewEl.setAttribute('fill', 'none');
      }
      previewEl.setAttribute('class', 'tm-sh tm-prev');
      if (drawMode !== 'arrow') {
        applyStroke(previewEl, { type: drawMode, color: activeStyle.color, lineWidthPt: activeStyle.lineWidthPt, dashStyle: activeStyle.dashStyle });
      }
      svg.appendChild(previewEl);
    }
    window.addEventListener('mousedown', startDraw, true);
    window.addEventListener('mousedown', function (ev) {
      if (drawMode) return;
      if (activeToolKind !== 'pointer') return;
      var t = ev.target;
      var n = t.closest && t.closest('[data-sid]');
      if (n) selectItem(n.getAttribute('data-sid'));
    });
    window.addEventListener('touchstart', startDraw, { passive: false, capture: true });
    window.addEventListener('touchstart', function (ev) {
      if (drawMode) return;
      if (activeToolKind !== 'pointer') return;
      var t = ev.target;
      var n2 = t.closest && t.closest('[data-sid]');
      if (n2) selectItem(n2.getAttribute('data-sid'));
    });
    window.addEventListener('mousemove', onDrawMove);
    window.addEventListener('mouseup', endDraw);
    window.addEventListener('touchmove', onDrawMove, { passive: false });
    window.addEventListener('touchend', endDraw);

    document.addEventListener('contextmenu', function (ev) {
      if (activeToolKind !== 'pointer') return;
      var t = ev.target;
      var nm = t.closest && t.closest('[data-sid]');
      if (nm) {
        showShapeCtxMenu(ev, nm.getAttribute('data-sid'));
      }
    });
    // --- Pointer tool: drag to move a drawing; click empty space clears selection (see mousedown below) ---
    function beginShapeMove(ev) {
      if (drawMode) return;
      if (activeToolKind !== 'pointer') return;
      if (ev.type === 'mousedown' && ev.button !== undefined && ev.button !== 0) return;
      if (ev.type === 'touchstart' && (!ev.touches || !ev.touches[0])) return;
      var t = ev.target;
      if (!t || typeof t.closest !== 'function') return;
      if (
        t.closest('#hl-bar') ||
        t.closest('.tm-ws-chrome') ||
        t.closest('.tm-pop') ||
        t.closest('.tm-popwrap') ||
        t.closest('.tm-drawing-ctx') ||
        t.closest('.tm-color-manage-pop') ||
        t.closest('.tm-hl-manage-pop')
      )
        return;
      var n = t.closest('[data-sid]');
      if (!n) return;
      var sid0 = n.getAttribute('data-sid');
      var it0 = getItemById(sid0);
      if (!sid0 || !it0) return;
      var p0 = toDoc(ev);
      shapeMoveDrag = {
        sid: sid0,
        x0: p0.x,
        y0: p0.y,
        snap: JSON.parse(JSON.stringify(it0)),
        historyPushed: false,
        moved: false
      };
      if (ev.cancelable) ev.preventDefault();
      selectItem(sid0);
    }
    function onShapeMove(ev) {
      if (!shapeMoveDrag) return;
      var p = toDoc(ev);
      var dx = p.x - shapeMoveDrag.x0;
      var dy = p.y - shapeMoveDrag.y0;
      if (Math.abs(dx) + Math.abs(dy) < 4 && !shapeMoveDrag.moved) return;
      shapeMoveDrag.moved = true;
      if (!shapeMoveDrag.historyPushed) {
        pushDrawHistory();
        shapeMoveDrag.historyPushed = true;
      }
      var d = docSize();
      var dxp = (dx / d.dw) * 100;
      var dyp = (dy / d.dh) * 100;
      var it = getItemById(shapeMoveDrag.sid);
      var base = shapeMoveDrag.snap;
      if (!it || !base) return;
      if (base.type === 'arrow') {
        it.x1p = base.x1p + dxp;
        it.y1p = base.y1p + dyp;
        it.x2p = base.x2p + dxp;
        it.y2p = base.y2p + dyp;
      } else if (base.type === 'underline') {
        it.x1p = base.x1p + dxp;
        it.y1p = base.y1p + dyp;
        it.x2p = base.x2p + dxp;
        it.y2p = base.y2p + dyp;
      } else if (base.type === 'circle') {
        it.cxp = base.cxp + dxp;
        it.cyp = base.cyp + dyp;
      } else if (base.type === 'square') {
        it.xp = base.xp + dxp;
        it.yp = base.yp + dyp;
      }
      saveDrawings();
      render();
      if (ev.cancelable) ev.preventDefault();
    }
    function endShapeMove() {
      if (!shapeMoveDrag) return;
      var had = shapeMoveDrag.historyPushed;
      shapeMoveDrag = null;
      if (had) {
        saveDrawings();
        render();
        syncUndoRedoBtns();
      }
    }
    window.addEventListener('mousedown', beginShapeMove, true);
    window.addEventListener('mousemove', onShapeMove, true);
    window.addEventListener('mouseup', endShapeMove, true);
    window.addEventListener('touchstart', beginShapeMove, { capture: true, passive: false });
    window.addEventListener('touchmove', onShapeMove, { capture: true, passive: false });
    window.addEventListener('touchend', endShapeMove, { capture: true, passive: false });
    window.addEventListener('touchcancel', endShapeMove, { capture: true, passive: true });

    // Click away from a drawing (not on the bar or a menu) to deselect it.
    document.addEventListener(
      'mousedown',
      function (ev) {
        if (drawMode) return;
        if (activeToolKind !== 'pointer') return;
        var t = ev.target;
        if (t.closest && t.closest('[data-sid]')) return;
        if (
          t.closest &&
          (t.closest('#hl-bar') ||
            t.closest('.tm-pop') ||
            t.closest('.tm-popwrap') ||
            t.closest('.tm-drawing-ctx') ||
            t.closest('.tm-color-manage-pop') ||
            t.closest('.tm-hl-manage-pop'))
        )
          return;
        selectItem(null);
      },
      true
    );

    document.addEventListener('keydown', function (ev) {
      var mac = navigator.platform.indexOf('Mac') === 0;
      var mod = mac ? ev.metaKey : ev.ctrlKey;
      var ae0 = document.activeElement;
      var inField = !!(ae0 && (ae0.isContentEditable || ae0.tagName === 'INPUT' || ae0.tagName === 'TEXTAREA'));
      if (mod && !inField) {
        if (ev.key === 'h' || ev.key === 'H') {
          if (!ev.shiftKey && !ev.altKey) {
            ev.preventDefault();
            closeAllPops();
            setActiveTool(activeToolKind === 'hl' ? 'pointer' : 'hl');
            return;
          }
        }
        if ((ev.key === 's' || ev.key === 'S') && ev.shiftKey && !ev.altKey) {
          ev.preventDefault();
          closeAllPops();
          try {
            window.parent.postMessage({ type: 'tm_sticky_add' }, '*');
          } catch (eSt) {}
          setActiveTool('pointer');
          return;
        }
        if ((ev.key === 'a' || ev.key === 'A') && !ev.shiftKey && !ev.altKey) {
          ev.preventDefault();
          closeAllPops();
          if (activeToolKind === 'pen') setActiveTool('pointer');
          else setActiveTool('pen');
          return;
        }
      }
      if (mod && activeToolKind === 'pointer') {
        if (!inField) {
          if (ev.key === 'c' || ev.key === 'C') {
            if (selId) {
              ev.preventDefault();
              copyDrawing(selId);
              return;
            }
          }
          if ((ev.key === 'v' || ev.key === 'V') && drawingClipboard) {
            ev.preventDefault();
            pasteDrawing();
            return;
          }
        }
      }
      var zKey = ev.key === 'z' || ev.key === 'Z';
      if (mod && zKey && !ev.shiftKey) {
        if (inField) return;
        ev.preventDefault();
        undoDraw();
        return;
      }
      if (mod && ((ev.key === 'y' || ev.key === 'Y') || (ev.shiftKey && zKey))) {
        if (inField) return;
        ev.preventDefault();
        redoDraw();
        return;
      }
      if (ev.key !== 'Backspace' && ev.key !== 'Delete') return;
      if (!selId) return;
      var ae = document.activeElement;
      if (ae && (ae.isContentEditable || ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return;
      if (bar.contains(ae)) return;
      ev.preventDefault();
      delItem(selId);
    });

    syncStyleInputs();
    syncDashButtons();
    postHlGlobals();
    updateDrawCursor();
    postActiveToolToParent();
    installReliableHighlightListener();
    // Enter idle (dots only) when starting collapsed — happens after layout so user sees the full
    // pill for a brief moment before it shrinks, avoiding a flash of "missing controls" during boot.
    if (bar && collapsed) {
      setTimeout(function () { if (bar && collapsed) bar.classList.add('tm-ws-idle'); }, 600);
    }
    // Hover: lift idle while pointer is over the pill; leave: schedule a return.
    if (bar) {
      bar.addEventListener('mouseenter', liftIdleNow);
      bar.addEventListener('mouseleave', function () { returnToIdleSoon(500); });
      // Any pointerdown inside the pill (touch or pen) also lifts idle.
      bar.addEventListener('pointerdown', function () {
        if (collapsed) scheduleIdleLift(2800);
      }, true);
    }
    requestAnimationFrame(function () {
      clampBarIntoView();
      syncUndoRedoBtns();
      saveBarState();
    });
  }

  /**
   * Installs a single document-wide mouseup listener that creates highlight marks.
   * Runs in every iframe (MAAE, ECOR, formula). Gated by window.__TM_HIGHLIGHT_ARMED
   * so it only activates when the highlighter tool is on. Stores slot index instead
   * of raw color so theme flips recolor marks through CSS variables.
   *
   * If surroundContents() throws (selection crossed element boundaries), falls back
   * to a TreeWalker that wraps each intersecting text node individually — this is
   * what makes highlighting "just work" even for selections crossing <strong>, <code>,
   * <span>, etc.
   */
  function installReliableHighlightListener() {
    if (window.__TM_HL_ML_INSTALLED) return;
    window.__TM_HL_ML_INSTALLED = true;

    function activeSlotIndex() {
      // Try to match current hlColor to an existing slot; fall back to 0.
      var cur = (typeof window.hlColor === 'string' && window.hlColor) ? window.hlColor.toLowerCase() : '';
      if (!cur) return 0;
      for (var i = 0; i < hlColorSlots.length && i < 5; i++) {
        if (hlColorSlots[i] && String(hlColorSlots[i]).toLowerCase() === cur) return i;
      }
      if (window.__TM_SR_HL && typeof window.__TM_SR_HL.nearestSlot === 'function') {
        return window.__TM_SR_HL.nearestSlot(cur);
      }
      return 0;
    }

    function wrapRangeReliably(range, slotIndex) {
      // Single-node case: try the fast path.
      var mk = document.createElement('mark');
      mk.className = 'usr';
      mk.setAttribute('data-slot', String(slotIndex | 0));
      try {
        range.surroundContents(mk);
        return [mk];
      } catch (e) {
        // Multi-node fallback: walk text nodes inside the range's common ancestor
        // and wrap each portion that intersects the range in its own <mark>.
        return wrapRangeByWalkingTextNodes(range, slotIndex);
      }
    }

    function wrapRangeByWalkingTextNodes(range, slotIndex) {
      var produced = [];
      try {
        var root = range.commonAncestorContainer;
        if (root.nodeType === 3) root = root.parentNode;
        if (!root) return produced;
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode: function (n) {
            try { return range.intersectsNode(n) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; }
            catch (e) { return NodeFilter.FILTER_REJECT; }
          }
        });
        var nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        for (var i = 0; i < nodes.length; i++) {
          var tn = nodes[i];
          if (!tn.nodeValue) continue;
          // Don't wrap text inside existing highlights or toolbar chrome.
          if (tn.parentNode && tn.parentNode.closest && tn.parentNode.closest('mark.usr,#hl-bar,.tm-ws-host,.tm-sr-sidebar,.tm-pop,.tm-drawing-ctx')) continue;
          var sOffset = (tn === range.startContainer) ? range.startOffset : 0;
          var eOffset = (tn === range.endContainer) ? range.endOffset : tn.nodeValue.length;
          if (eOffset <= sOffset) continue;
          var sub = document.createRange();
          try { sub.setStart(tn, sOffset); sub.setEnd(tn, eOffset); } catch (e2) { continue; }
          var mk = document.createElement('mark');
          mk.className = 'usr';
          mk.setAttribute('data-slot', String(slotIndex | 0));
          try { sub.surroundContents(mk); produced.push(mk); } catch (e3) { /* skip this node */ }
        }
      } catch (eWalk) { /* ignore */ }
      return produced;
    }

    document.addEventListener('mouseup', function (ev) {
      if (!window.__TM_HIGHLIGHT_ARMED) return;
      var tgt = ev.target;
      if (tgt && tgt.closest && tgt.closest('#hl-bar,.tm-ws-host,.tm-pop,.tm-popwrap,.tm-drawing-ctx,.tm-sr-sidebar,.tm-sr-sidebar-host,.tm-sr-hamburger,.tm-sr-sidebar-toggle')) return;
      var sel;
      try { sel = window.getSelection(); } catch (eSel) { return; }
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
      var rng;
      try { rng = sel.getRangeAt(0); } catch (eR) { return; }
      if (!rng || !document.body.contains(rng.commonAncestorContainer)) return;
      // Snapshot BEFORE mutation so undo can restore pre-highlight state.
      try { pushHlHistory(); } catch (eH) { /* ignore */ }
      var slot = activeSlotIndex();
      var produced = wrapRangeReliably(rng, slot);
      if (!produced.length) return;
      try { sel.removeAllRanges(); } catch (eRm) { /* ignore */ }
      try { if (typeof window.__TM_SR_HL_REWIRE === 'function') window.__TM_SR_HL_REWIRE(); } catch (eRW) { /* ignore */ }
      try { if (typeof saveHL === 'function') saveHL(); } catch (eS) { /* ignore */ }
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
