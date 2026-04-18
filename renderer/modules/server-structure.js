/* ════════════════════════════════════════
   SERVER STRUCTURE MODULE  — v2
   Added: Feature 2 — Channel Topics
════════════════════════════════════════ */

const ServerStructure = (() => {
  let dragSrcCategory = null;
  let dragSrcChannel = null;
  let dragSrcCategoryId = null;

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // ── Main Render ───────────────────────
  function render() {
    const list  = document.getElementById('categoriesList');
    const empty = document.getElementById('structureEmpty');
    if (!list) return;

    const cats = AppState.project.categories;
    list.innerHTML = '';

    if (cats.length === 0) {
      empty?.classList.remove('hidden');
      list.classList.add('hidden');
    } else {
      empty?.classList.add('hidden');
      list.classList.remove('hidden');
      cats.forEach(cat => list.appendChild(buildCategoryEl(cat)));
    }
    initCategoryDragDrop();
    LivePreview.update();
  }

  // ── Category Element ──────────────────
  function buildCategoryEl(cat) {
    const block = document.createElement('div');
    block.className = 'category-block';
    block.dataset.id = cat.id;
    block.draggable = true;

    const collapsed = cat.collapsed || false;

    block.innerHTML = `
      <div class="category-header">
        <span class="drag-handle" title="Drag to reorder">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1.5" fill="currentColor"/><circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="9" cy="19" r="1.5" fill="currentColor"/><circle cx="15" cy="5" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="19" r="1.5" fill="currentColor"/></svg>
        </span>
        <button class="category-collapse-btn ${collapsed ? 'collapsed' : ''}" title="Collapse">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <span class="category-name" title="Double-click to rename">${escapeHtml(cat.name)}</span>
        <div class="category-actions">
          <button class="icon-btn" title="Add text channel" data-action="add-text">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </button>
          <button class="icon-btn" title="Add voice channel" data-action="add-voice">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          </button>
          <button class="icon-btn danger" title="Delete category" data-action="delete">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </div>
      <div class="channels-list ${collapsed ? 'collapsed' : ''}" data-cat-id="${cat.id}">
        ${cat.channels.map(ch => buildChannelHTML(ch)).join('')}
      </div>
      <div class="category-footer">
        <button class="add-channel-btn" data-action="add-text" data-cat="${cat.id}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Text Channel
        </button>
        <button class="add-channel-btn" data-action="add-voice" data-cat="${cat.id}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Voice Channel
        </button>
      </div>
    `;

    // Collapse toggle
    block.querySelector('.category-collapse-btn').addEventListener('click', e => {
      e.stopPropagation();
      cat.collapsed = !cat.collapsed;
      render();
    });

    // Rename on double-click
    block.querySelector('.category-name').addEventListener('dblclick', e => {
      e.stopPropagation();
      startCategoryRename(block, cat);
    });

    // Header action buttons
    block.querySelectorAll('.category-actions .icon-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === 'add-text')  addChannel(cat.id, 'text');
        if (action === 'add-voice') addChannel(cat.id, 'voice');
        if (action === 'delete')    deleteCategory(cat.id);
      });
    });

    // Footer add buttons
    block.querySelectorAll('.category-footer .add-channel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        addChannel(cat.id, btn.dataset.action === 'add-voice' ? 'voice' : 'text');
      });
    });

    // ── Channel events (including topic) ──
    const channelsList = block.querySelector('.channels-list');
    channelsList.querySelectorAll('.channel-item').forEach(chEl => {
      const chId = chEl.dataset.id;
      const ch = cat.channels.find(c => c.id === chId);
      if (!ch) return;

      // Rename
      chEl.querySelector('.ch-rename-btn')?.addEventListener('click', () => startChannelRename(chEl, cat, ch));
      chEl.querySelector('.ch-delete-btn')?.addEventListener('click', () => deleteChannel(cat.id, ch.id));
      chEl.querySelector('.channel-name')?.addEventListener('dblclick', () => startChannelRename(chEl, cat, ch));

      // ── Feature 2: Topic toggle ──────────────────────────────────────────
      const topicBtn  = chEl.querySelector('.ch-topic-btn');
      const topicRow  = chEl.querySelector('.channel-topic-row');
      const topicInput = chEl.querySelector('.channel-topic-input');

      if (topicBtn && topicRow) {
        // Show/hide topic row
        topicBtn.addEventListener('click', e => {
          e.stopPropagation();
          const isOpen = !topicRow.classList.contains('hidden');
          topicRow.classList.toggle('hidden', isOpen);
          topicBtn.classList.toggle('active-topic', !isOpen);
          if (!isOpen && topicInput) topicInput.focus();
        });
      }

      if (topicInput) {
        // Save topic on input
        topicInput.addEventListener('input', () => {
          ch.topic = topicInput.value;
          AppState.markDirty();
        });
        topicInput.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === 'Escape') {
            e.preventDefault();
            topicRow?.classList.add('hidden');
            topicBtn?.classList.remove('active-topic');
          }
          e.stopPropagation();
        });
        // Prevent drag starting when clicking inside topic input
        topicInput.addEventListener('mousedown', e => e.stopPropagation());
      }

      initChannelDragDrop(chEl, cat);
    });

    return block;
  }

  // ── Channel HTML builder ──────────────
  function buildChannelHTML(ch) {
    const isVoice = ch.type === 'voice';
    const iconHtml = isVoice
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;

    const hasTopic  = !isVoice && ch.topic?.trim();
    const topicOpen = hasTopic ? '' : 'hidden'; // auto-open if already has a topic

    // Topic button only for text channels
    const topicBtnHtml = !isVoice ? `
      <button class="icon-btn ch-topic-btn ${hasTopic ? 'active-topic' : ''}" title="Set channel topic">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
      </button>` : '';

    const topicRowHtml = !isVoice ? `
      <div class="channel-topic-row ${topicOpen}">
        <input
          class="channel-topic-input"
          type="text"
          placeholder="Channel topic (optional, max 1024 chars)…"
          value="${escapeHtml(ch.topic || '')}"
          maxlength="1024"
          draggable="false"
        >
      </div>` : '';

    return `
      <div class="channel-item" data-id="${ch.id}" data-type="${ch.type}" draggable="true">
        <div class="channel-item-main">
          <span class="drag-handle" style="opacity:0.4;cursor:grab;">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="1.5" fill="currentColor"/><circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="9" cy="17" r="1.5" fill="currentColor"/><circle cx="15" cy="7" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="17" r="1.5" fill="currentColor"/></svg>
          </span>
          <span class="channel-icon">${iconHtml}</span>
          <span class="channel-name" title="Double-click to rename">${escapeHtml(ch.name)}</span>
          <div class="channel-actions">
            ${topicBtnHtml}
            <button class="icon-btn ch-rename-btn" title="Rename">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="icon-btn danger ch-delete-btn" title="Delete">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        </div>
        ${topicRowHtml}
      </div>`;
  }

  // ── Category CRUD ─────────────────────
  function addCategory() {
    const cat = { id: genId(), name: 'New Category', collapsed: false, channels: [] };
    AppState.project.categories.push(cat);
    AppState.markDirty();
    render();
    const block = document.querySelector(`.category-block[data-id="${cat.id}"]`);
    if (block) startCategoryRename(block, cat);
  }

  function deleteCategory(catId) {
    AppState.project.categories = AppState.project.categories.filter(c => c.id !== catId);
    AppState.markDirty();
    render();
    showNotif('Category deleted', 'info');
  }

  function startCategoryRename(block, cat) {
    const nameEl = block.querySelector('.category-name');
    if (!nameEl) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'category-name-input';
    input.value = cat.name;
    nameEl.replaceWith(input);
    input.focus(); input.select();
    function save() {
      cat.name = input.value.trim() || cat.name;
      const span = document.createElement('span');
      span.className = 'category-name';
      span.title = 'Double-click to rename';
      span.textContent = cat.name;
      input.replaceWith(span);
      span.addEventListener('dblclick', () => startCategoryRename(block, cat));
      AppState.markDirty(); LivePreview.update();
    }
    input.addEventListener('blur', save);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); save(); }
      if (e.key === 'Escape') { input.value = cat.name; save(); }
    });
  }

  // ── Channel CRUD ──────────────────────
  function addChannel(catId, type) {
    const cat = AppState.project.categories.find(c => c.id === catId);
    if (!cat) return;
    // ── Feature 2: topic field initialised empty ──
    cat.channels.push({ id: genId(), name: type === 'voice' ? 'Voice Chat' : 'general', type, topic: '' });
    AppState.markDirty();
    render();
  }

  function deleteChannel(catId, chId) {
    const cat = AppState.project.categories.find(c => c.id === catId);
    if (!cat) return;
    cat.channels = cat.channels.filter(ch => ch.id !== chId);
    AppState.markDirty();
    render();
  }

  function startChannelRename(chEl, cat, ch) {
    const nameEl = chEl.querySelector('.channel-name');
    if (!nameEl) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'channel-name-input';
    input.value = ch.name;
    nameEl.replaceWith(input);
    input.focus(); input.select();
    function save() {
      ch.name = input.value.trim() || ch.name;
      const span = document.createElement('span');
      span.className = 'channel-name';
      span.title = 'Double-click to rename';
      span.textContent = ch.name;
      input.replaceWith(span);
      span.addEventListener('dblclick', () => startChannelRename(chEl, cat, ch));
      AppState.markDirty(); LivePreview.update();
    }
    input.addEventListener('blur', save);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); save(); }
      if (e.key === 'Escape') { input.value = ch.name; save(); }
    });
  }

  // ── Drag & Drop — Categories ──────────
  function initCategoryDragDrop() {
    const list   = document.getElementById('categoriesList');
    const blocks = list.querySelectorAll('.category-block');

    blocks.forEach(block => {
      block.addEventListener('dragstart', e => {
        dragSrcCategory = block; dragSrcChannel = null;
        setTimeout(() => block.classList.add('dragging'), 0);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('type', 'category');
      });
      block.addEventListener('dragend', () => {
        block.classList.remove('dragging');
        list.querySelectorAll('.category-block').forEach(b => b.classList.remove('drag-over'));
      });
      block.addEventListener('dragover', e => {
        e.preventDefault();
        if (dragSrcCategory && dragSrcCategory !== block) {
          list.querySelectorAll('.category-block').forEach(b => b.classList.remove('drag-over'));
          block.classList.add('drag-over');
          e.dataTransfer.dropEffect = 'move';
        }
      });
      block.addEventListener('dragleave', () => block.classList.remove('drag-over'));
      block.addEventListener('drop', e => {
        e.preventDefault(); e.stopPropagation();
        if (dragSrcCategory && dragSrcCategory !== block && e.dataTransfer.getData('type') === 'category') {
          const cats   = AppState.project.categories;
          const srcIdx = cats.findIndex(c => c.id === dragSrcCategory.dataset.id);
          const dstIdx = cats.findIndex(c => c.id === block.dataset.id);
          const [moved] = cats.splice(srcIdx, 1);
          cats.splice(dstIdx, 0, moved);
          AppState.markDirty(); render();
        }
      });
    });
  }

  // ── Drag & Drop — Channels ────────────
  function initChannelDragDrop(chEl, cat) {
    chEl.addEventListener('dragstart', e => {
      dragSrcChannel = chEl; dragSrcCategoryId = cat.id; dragSrcCategory = null;
      setTimeout(() => chEl.classList.add('dragging'), 0);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('type', 'channel');
      e.stopPropagation();
    });
    chEl.addEventListener('dragend', () => {
      chEl.classList.remove('dragging');
      document.querySelectorAll('.channel-item').forEach(el => el.classList.remove('drag-over'));
    });
    chEl.addEventListener('dragover', e => {
      e.preventDefault(); e.stopPropagation();
      if (dragSrcChannel && dragSrcChannel !== chEl && e.dataTransfer.getData('type') !== 'category') {
        document.querySelectorAll('.channel-item').forEach(el => el.classList.remove('drag-over'));
        chEl.classList.add('drag-over');
        e.dataTransfer.dropEffect = 'move';
      }
    });
    chEl.addEventListener('dragleave', () => chEl.classList.remove('drag-over'));
    chEl.addEventListener('drop', e => {
      e.preventDefault(); e.stopPropagation();
      if (!dragSrcChannel || dragSrcChannel === chEl) return;
      const srcCat = AppState.project.categories.find(c => c.id === dragSrcCategoryId);
      const dstCat = AppState.project.categories.find(c => c.id === cat.id);
      if (!srcCat || !dstCat) return;
      const srcIdx = srcCat.channels.findIndex(ch => ch.id === dragSrcChannel.dataset.id);
      const dstIdx = dstCat.channels.findIndex(ch => ch.id === chEl.dataset.id);
      const [moved] = srcCat.channels.splice(srcIdx, 1);
      dstCat.channels.splice(dstIdx, 0, moved);
      AppState.markDirty(); render();
    });
  }

  function collapseAll() {
    AppState.project.categories.forEach(c => c.collapsed = true);
    render();
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Event Bindings ────────────────────
  document.getElementById('btnAddCategory')?.addEventListener('click', addCategory);
  document.getElementById('btnAddCategoryEmpty')?.addEventListener('click', addCategory);
  document.getElementById('btnCollapseAll')?.addEventListener('click', collapseAll);

  return { render, addCategory };
})();
