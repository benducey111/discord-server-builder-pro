/* ════════════════════════════════════════
   TEMPLATES MODULE  (v2 — Feature 4: Import/Export)
   Depends on: TEMPLATES (renderer/data/templates.js)
════════════════════════════════════════ */

const TemplatesModule = (() => {

  const STORAGE_KEY = 'dsbp_custom_templates';
  let previewTemplateId  = null;
  let previewIsCustom    = false;   // track whether the current preview is a custom template

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // ── Custom Template Storage ───────────
  function loadCustomTemplates() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function saveCustomTemplates(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function addCustomTemplate(data) {
    const list = loadCustomTemplates();
    // Ensure required shape
    const tmpl = {
      id:          'custom_' + genId(),
      name:        data.name        || 'Custom Template',
      icon:        data.icon        || '📁',
      description: data.description || '',
      tags:        data.tags        || ['Custom'],
      accent:      data.accent      || '#5865f2',
      serverName:  data.serverName  || data.name || 'My Server',
      categories:  data.categories  || [],
      roles:       data.roles       || [],
      _custom:     true
    };
    // Prevent duplicate names
    const exists = list.find(t => t.name === tmpl.name);
    if (exists) tmpl.name = tmpl.name + ' (2)';
    list.push(tmpl);
    saveCustomTemplates(list);
    return tmpl;
  }

  function deleteCustomTemplate(id) {
    const list = loadCustomTemplates().filter(t => t.id !== id);
    saveCustomTemplates(list);
  }

  // Find a template by id from both built-in and custom lists
  function findTemplate(id) {
    return TEMPLATES.find(t => t.id === id) || loadCustomTemplates().find(t => t.id === id) || null;
  }

  // ── Main Render ───────────────────────
  function render() {
    const container = document.getElementById('templatesGrid');
    if (!container) return;
    container.innerHTML = '';

    // ── Action bar (Import / Export) ──
    const actionBar = document.createElement('div');
    actionBar.className = 'tmpl-action-bar';
    actionBar.innerHTML = `
      <div class="tmpl-action-bar-left">
        <span class="tmpl-section-label">Built-in Templates</span>
      </div>
      <div class="tmpl-action-bar-right">
        <button class="btn btn-ghost btn-sm" id="btnImportTemplate">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Import Template
        </button>
        <button class="btn btn-ghost btn-sm" id="btnExportTemplate">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export Current as Template
        </button>
      </div>
    `;
    container.appendChild(actionBar);

    // ── Built-in template cards ──
    const builtinGrid = document.createElement('div');
    builtinGrid.className = 'tmpl-grid';
    TEMPLATES.forEach(t => builtinGrid.appendChild(buildCard(t, false)));
    container.appendChild(builtinGrid);

    // ── Custom templates section ──
    const custom = loadCustomTemplates();
    if (custom.length > 0) {
      const customHeader = document.createElement('div');
      customHeader.className = 'tmpl-custom-header';
      customHeader.innerHTML = `
        <span class="tmpl-section-label">My Custom Templates</span>
        <span class="tmpl-custom-count">${custom.length}</span>
      `;
      container.appendChild(customHeader);

      const customGrid = document.createElement('div');
      customGrid.className = 'tmpl-grid';
      custom.forEach(t => customGrid.appendChild(buildCard(t, true)));
      container.appendChild(customGrid);
    }

    // ── Bind action bar buttons ──
    document.getElementById('btnImportTemplate')?.addEventListener('click', importTemplate);
    document.getElementById('btnExportTemplate')?.addEventListener('click', exportCurrentAsTemplate);
  }

  // ── Template Card ─────────────────────
  function buildCard(template, isCustom) {
    const totalChannels = template.categories.reduce((s, c) => s + c.channels.length, 0);
    const totalCats     = template.categories.length;
    const totalRoles    = template.roles.length;

    // Plan gating: templates beyond index 3 require developer plan
    const templateIndex = TEMPLATES.findIndex(t => t.id === template.id);
    const isPremiumTemplate = !isCustom && templateIndex >= 4;
    const isLocked = isPremiumTemplate &&
      typeof PlanManager !== 'undefined' &&
      !PlanManager.can('templates_all');

    const tagsHTML = template.tags.map(tag =>
      `<span class="tmpl-tag${tag === 'Custom' ? ' tmpl-tag-custom' : ''}">${escapeHtml(tag)}</span>`
    ).join('');

    const card = document.createElement('div');
    card.className = `tmpl-card${isLocked ? ' tmpl-card-locked' : ''}`;
    card.style.setProperty('--tmpl-accent', template.accent);
    card.innerHTML = `
      <div class="tmpl-card-glow"></div>
      ${isCustom ? `<button class="tmpl-delete-btn" data-id="${template.id}" title="Delete custom template">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>` : ''}
      ${isLocked ? `
      <div class="tmpl-lock-overlay">
        <div class="tmpl-lock-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5865f2" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span class="tmpl-lock-label">Developer Plan</span>
          <button class="tmpl-lock-upgrade-btn" data-lock-upgrade>Upgrade to Unlock</button>
        </div>
      </div>` : ''}
      <div class="tmpl-card-top">
        <div class="tmpl-icon">${template.icon}</div>
        <div class="tmpl-meta">
          <div class="tmpl-name">${escapeHtml(template.name)}</div>
          <div class="tmpl-tags">${tagsHTML}${isPremiumTemplate ? `<span class="tmpl-tag tmpl-tag-dev">DEV</span>` : ''}</div>
        </div>
      </div>
      <p class="tmpl-desc">${escapeHtml(template.description)}</p>
      <div class="tmpl-stats">
        <div class="tmpl-stat">
          <span class="tmpl-stat-val">${totalCats}</span>
          <span class="tmpl-stat-key">Categories</span>
        </div>
        <div class="tmpl-stat">
          <span class="tmpl-stat-val">${totalChannels}</span>
          <span class="tmpl-stat-key">Channels</span>
        </div>
        <div class="tmpl-stat">
          <span class="tmpl-stat-val">${totalRoles}</span>
          <span class="tmpl-stat-key">Roles</span>
        </div>
      </div>
      <div class="tmpl-card-actions">
        <button class="btn btn-ghost btn-sm tmpl-preview-btn" data-id="${template.id}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Preview
        </button>
        <button class="btn btn-sm tmpl-use-btn ${isLocked ? 'btn-ghost tmpl-use-locked' : 'btn-primary'}" data-id="${template.id}" ${isLocked ? 'title="Upgrade to use this template"' : ''}>
          ${isLocked
            ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Upgrade to Use`
            : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg> Use Template`
          }
        </button>
      </div>
      <div class="tmpl-accent-bar"></div>
    `;

    card.querySelector('.tmpl-preview-btn').addEventListener('click', () => openPreview(template.id, isCustom));
    card.querySelector('.tmpl-use-btn').addEventListener('click', () => {
      if (isLocked) {
        if (typeof PlanManager !== 'undefined') PlanManager.requirePlan('templates_all');
      } else {
        applyTemplate(template.id, false);
      }
    });

    card.querySelector('[data-lock-upgrade]')?.addEventListener('click', e => {
      e.stopPropagation();
      if (typeof PlanManager !== 'undefined') PlanManager.requirePlan('templates_all');
    });
    if (isCustom) {
      card.querySelector('.tmpl-delete-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmDeleteCustom(template.id, template.name);
      });
    }

    return card;
  }

  // ── Preview Modal ─────────────────────
  function openPreview(templateId, isCustom) {
    const template = findTemplate(templateId);
    if (!template) return;
    previewTemplateId = templateId;
    previewIsCustom   = !!isCustom;

    const backdrop = document.getElementById('templatePreviewBackdrop');

    document.getElementById('tmplPreviewName').textContent = template.name;
    document.getElementById('tmplPreviewIcon').textContent = template.icon;
    document.getElementById('tmplPreviewDesc').textContent = template.description;

    // Build channel tree
    const tree = document.getElementById('tmplPreviewTree');
    tree.innerHTML = '';
    if (template.categories.length === 0) {
      tree.innerHTML = '<div style="color:var(--text-4);font-size:12px;padding:8px;">No channels defined</div>';
    } else {
      template.categories.forEach(cat => {
        const catEl = document.createElement('div');
        catEl.style.cssText = 'margin-bottom:8px;';
        catEl.innerHTML = `
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-4);padding:2px 0;display:flex;align-items:center;gap:4px;">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>
            ${escapeHtml(cat.name)}
          </div>
          <div class="tmpl-ch-list">
            ${cat.channels.map(ch => {
              const isVoice = ch.type === 'voice';
              const icon = isVoice
                ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`
                : `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
              return `<div class="tmpl-ch-item">${icon}<span>${escapeHtml(ch.name)}</span></div>`;
            }).join('')}
          </div>
        `;
        tree.appendChild(catEl);
      });
    }

    // Build roles list
    const rolesList = document.getElementById('tmplPreviewRoles');
    rolesList.innerHTML = '';
    if (template.roles.length === 0) {
      rolesList.innerHTML = '<div style="color:var(--text-4);font-size:12px;">No roles defined</div>';
    } else {
      template.roles.forEach(role => {
        const el = document.createElement('div');
        el.className = 'dm-role-badge';
        el.innerHTML = `
          <span class="dm-role-dot" style="background:${role.color};box-shadow:0 0 4px ${role.color};"></span>
          <span>${escapeHtml(role.name)}</span>
        `;
        rolesList.appendChild(el);
      });
    }

    backdrop.classList.add('open');
  }

  function closePreview() {
    document.getElementById('templatePreviewBackdrop')?.classList.remove('open');
    previewTemplateId = null;
    previewIsCustom   = false;
  }

  // ── Apply Template ────────────────────
  function applyTemplate(templateId, asNewProject) {
    const template = findTemplate(templateId);
    if (!template) return;

    const hasCurrent = AppState.project.categories.length > 0 || AppState.project.roles.length > 0;

    if (!asNewProject && hasCurrent) {
      const ok = confirm(
        `Apply "${template.name}"?\n\nThis will replace all current categories, channels, and roles in your project.\n\nYour messages will not be changed.`
      );
      if (!ok) return;
    }

    // Deep-copy template data and assign new IDs
    const newCats = template.categories.map(cat => ({
      id: genId(),
      name: cat.name,
      collapsed: false,
      channels: cat.channels.map(ch => ({
        id: genId(),
        name: ch.name,
        type: ch.type,
        topic: ch.topic || ''
      }))
    }));

    const newRoles = template.roles.map(role => ({
      id: genId(),
      name: role.name,
      color: role.color,
      permissions: { ...role.permissions }
    }));

    if (asNewProject) {
      AppState.project = {
        name:        template.serverName || template.name,
        description: template.description || '',
        categories:  newCats,
        roles:       newRoles,
        messages:    { welcome: null, rules: null, tickets: null, prices: null, vouches: null, giveaway: null },
        createdAt:   new Date().toISOString(),
        updatedAt:   new Date().toISOString()
      };
      AppState.currentFilePath = null;
    } else {
      AppState.project.name       = template.serverName || template.name;
      AppState.project.categories = newCats;
      AppState.project.roles      = newRoles;
    }

    AppState.markDirty();
    updateSidebarStats();
    updateDashboardStats();
    LivePreview.update();
    closePreview();

    showNotif(`Template "${template.name}" applied!`, 'success');
    AppState.switchTab('structure');
  }

  // ── Feature 4: Export Current Project as Template ────
  async function exportCurrentAsTemplate() {
    const p = AppState.project;
    const hasContent = p.categories.length > 0 || p.roles.length > 0;
    if (!hasContent) {
      showNotif('Nothing to export — add some categories or roles first.', 'warn');
      return;
    }

    // Build template object from current project
    const tmplData = {
      id:          'exported_' + genId(),
      name:        p.name || 'My Template',
      icon:        '⭐',
      description: p.description || `Custom template based on "${p.name}"`,
      tags:        ['Custom'],
      accent:      '#5865f2',
      serverName:  p.name || 'My Server',
      categories:  p.categories.map(cat => ({
        name:     cat.name,
        channels: cat.channels.map(ch => ({
          name:  ch.name,
          type:  ch.type,
          topic: ch.topic || ''
        }))
      })),
      roles: p.roles.map(role => ({
        name:        role.name,
        color:       role.color,
        permissions: { ...role.permissions }
      })),
      _custom:    true,
      exportedAt: new Date().toISOString()
    };

    const suggestedName = (p.name || 'my-template').toLowerCase().replace(/\s+/g, '-') + '.dsbpt';
    const result = await window.electronAPI.exportJSON(tmplData, suggestedName);

    if (result?.success) {
      showNotif(`Template exported as "${suggestedName}"`, 'success');
    } else if (result && !result.success && result.error) {
      showNotif('Export failed: ' + result.error, 'error');
    }
    // result.success === false but no error = user cancelled (silent)
  }

  // ── Feature 4: Import Custom Template ────
  async function importTemplate() {
    const result = await window.electronAPI.importTemplate();
    if (!result?.success) {
      if (result?.error) showNotif('Import failed: ' + result.error, 'error');
      return; // cancelled or error
    }

    const data = result.data;
    // Validate basic shape
    if (!data || typeof data !== 'object') {
      showNotif('Invalid template file.', 'error');
      return;
    }
    if (!Array.isArray(data.categories)) {
      showNotif('Template file missing categories — is this a valid .dsbpt file?', 'error');
      return;
    }

    const tmpl = addCustomTemplate(data);
    render(); // re-render to show new card
    showNotif(`Template "${tmpl.name}" imported!`, 'success');
  }

  // ── Feature 4: Delete Custom Template ────
  function confirmDeleteCustom(id, name) {
    const ok = confirm(`Delete custom template "${name}"?\n\nThis cannot be undone.`);
    if (!ok) return;
    deleteCustomTemplate(id);
    render();
    showNotif(`Template "${name}" deleted.`, 'info');
  }

  // ── Event Bindings ────────────────────
  document.getElementById('templatePreviewClose')?.addEventListener('click', closePreview);
  document.getElementById('templatePreviewBackdrop')?.addEventListener('click', e => {
    if (e.target.id === 'templatePreviewBackdrop') closePreview();
  });
  document.getElementById('tmplPreviewUseBtn')?.addEventListener('click', () => {
    if (previewTemplateId) { closePreview(); applyTemplate(previewTemplateId, false); }
  });
  document.getElementById('tmplPreviewNewBtn')?.addEventListener('click', () => {
    if (previewTemplateId) { closePreview(); applyTemplate(previewTemplateId, true); }
  });

  function escapeHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { render };
})();
