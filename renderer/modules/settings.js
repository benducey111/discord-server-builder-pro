/* ════════════════════════════════════════
   SETTINGS MODULE
════════════════════════════════════════ */

const AppSettings = (() => {

  function render() {
    const container = document.getElementById('settingsContent');
    if (!container) return;

    container.innerHTML = `

      <!-- Server Settings -->
      <div class="settings-card">
        <div class="settings-card-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          Server Settings
        </div>
        <div class="form-group">
          <label class="form-label">Server Name</label>
          <input type="text" class="form-input" id="settingServerName" value="${escapeHtml(AppState.project.name)}" maxlength="100" placeholder="My Awesome Server">
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" id="settingServerDesc" placeholder="Server description...">${escapeHtml(AppState.project.description || '')}</textarea>
        </div>
      </div>

      <!-- Project Settings -->
      <div class="settings-card">
        <div class="settings-card-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
          Project Settings
        </div>

        <div class="settings-row">
          <div class="settings-row-info">
            <div class="settings-row-label">Auto-Save</div>
            <div class="settings-row-desc">Automatically save project 2 seconds after changes (requires a save location)</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="settingAutoSave" ${AppState.autoSave ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="settings-row">
          <div class="settings-row-info">
            <div class="settings-row-label">App Theme</div>
            <div class="settings-row-desc">Switch between dark and light mode</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="settingThemeToggle" ${document.documentElement.classList.contains('theme-light') ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="settings-row" style="border-bottom:none;">
          <div class="settings-row-info">
            <div class="settings-row-label">Current File</div>
            <div class="settings-row-desc" id="settingFilePath" style="font-family:monospace;word-break:break-all;">
              ${AppState.currentFilePath || 'Not saved yet'}
            </div>
          </div>
          ${AppState.currentFilePath ? `
            <button class="btn btn-ghost btn-sm" id="settingRevealFile">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              Reveal
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Customization (Developer+) -->
      <div class="settings-card" id="settingsCustomCard">
        <div class="settings-card-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Customization
          <span style="margin-left:auto;font-size:10px;padding:2px 7px;border-radius:4px;background:rgba(88,101,242,0.15);color:#5865f2;border:1px solid rgba(88,101,242,0.25);">Developer+</span>
        </div>

        <div class="settings-row" id="settingsAccentRow">
          <div class="settings-row-info">
            <div class="settings-row-label">Accent Color</div>
            <div class="settings-row-desc">Change the primary color used throughout the app</div>
          </div>
          <div class="accent-swatches" id="accentSwatches">
            ${[
              ['#5865f2','Discord Blue'],['#3ba55c','Green'],['#faa61a','Yellow'],
              ['#ed4245','Red'],['#9b59b6','Purple'],['#00d4ff','Cyan'],['#ff73fa','Pink']
            ].map(([c,n]) => `<div class="accent-swatch" data-color="${c}" title="${n}" style="background:${c};${(localStorage.getItem('dsbp_accent')||'#5865f2')===c?'outline:2px solid #fff;outline-offset:2px;':''}"></div>`).join('')}
          </div>
        </div>

        <div class="settings-row" id="settingsFontRow">
          <div class="settings-row-info">
            <div class="settings-row-label">Font Size</div>
            <div class="settings-row-desc">Adjust text size across the app</div>
          </div>
          <div class="seg-control" id="fontSizeSeg">
            ${['small','medium','large'].map(s => `<button class="seg-btn ${(localStorage.getItem('dsbp_fontsize')||'medium')===s?'active':''}" data-size="${s}">${s.charAt(0).toUpperCase()+s.slice(1)}</button>`).join('')}
          </div>
        </div>

        <div class="settings-row" id="settingsCompactRow" style="border-bottom:none;">
          <div class="settings-row-info">
            <div class="settings-row-label">Compact Mode</div>
            <div class="settings-row-desc">Reduce padding and spacing for more content on screen</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="settingCompactMode" ${document.documentElement.classList.contains('compact-mode') ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- Sound Settings -->
      <div class="settings-card">
        <div class="settings-card-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          Sound Effects
        </div>
        <div class="settings-row" style="border-bottom:none;">
          <div class="settings-row-info">
            <div class="settings-row-label">UI Sounds</div>
            <div class="settings-row-desc">Play subtle sound effects for clicks, saves, deploys, and notifications</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="settingSoundsToggle" ${(localStorage.getItem('dsbp_sounds') !== 'false') ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="settings-card" style="border-color:rgba(237,66,69,0.2);">
        <div class="settings-card-title" style="color:var(--red);">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Danger Zone
        </div>
        <div class="settings-row" style="border-bottom:none;">
          <div class="settings-row-info">
            <div class="settings-row-label">Reset Project</div>
            <div class="settings-row-desc">Clear all categories, channels, roles, and messages. Cannot be undone.</div>
          </div>
          <button class="btn btn-danger btn-sm" id="settingResetProject">Reset All</button>
        </div>
      </div>

      <!-- About -->
      <div class="settings-card about-card">
        <div class="about-logo-row">
          <div class="about-logo">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" fill="url(#settingsLogoGrad)"/>
            <defs><linearGradient id="settingsLogoGrad" x1="0" y1="0" x2="24" y2="24"><stop offset="0%" stop-color="#5865f2"/><stop offset="100%" stop-color="#9b59b6"/></linearGradient></defs></svg>
          </div>
          <div>
            <div class="about-app-name">Discord Server Builder <span class="gradient-text">Pro</span></div>
            <div class="about-version">Version 1.0.0</div>
          </div>
        </div>
        <div class="about-desc">
          A professional tool for planning, designing, and exporting Discord server structures.
          Build categories, manage roles, generate embed messages, and export your complete server blueprint.
        </div>
        <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;">
          <div style="font-size:11px;color:var(--text-4);background:var(--bg-4);border:1px solid var(--border-light);border-radius:var(--radius-xs);padding:4px 10px;">Built with Electron</div>
          <div style="font-size:11px;color:var(--text-4);background:var(--bg-4);border:1px solid var(--border-light);border-radius:var(--radius-xs);padding:4px 10px;">Dark Mode Only</div>
          <div style="font-size:11px;color:var(--text-4);background:var(--bg-4);border:1px solid var(--border-light);border-radius:var(--radius-xs);padding:4px 10px;">Local Storage Only</div>
        </div>
      </div>
    `;

    // Theme toggle
    document.getElementById('settingThemeToggle')?.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.documentElement.classList.add('theme-light');
        localStorage.setItem('dsbp_theme', 'light');
      } else {
        document.documentElement.classList.remove('theme-light');
        localStorage.setItem('dsbp_theme', 'dark');
      }
    });

    // Sounds toggle
    document.getElementById('settingSoundsToggle')?.addEventListener('change', (e) => {
      localStorage.setItem('dsbp_sounds', e.target.checked ? 'true' : 'false');
      if (typeof AppSounds !== 'undefined' && e.target.checked) AppSounds.success();
      showNotif(`Sounds ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
    });

    // Accent color swatches
    const canCustomize = typeof PlanManager === 'undefined' || PlanManager.can('analytics');
    document.querySelectorAll('.accent-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        if (!canCustomize) { PlanManager.requirePlan('analytics'); return; }
        const color = swatch.dataset.color;
        _applyAccent(color);
        localStorage.setItem('dsbp_accent', color);
        document.querySelectorAll('.accent-swatch').forEach(s => s.style.outline = '');
        swatch.style.outline = '2px solid #fff';
        swatch.style.outlineOffset = '2px';
        if (typeof AppSounds !== 'undefined') AppSounds.click();
      });
    });

    // Lock customization UI if not developer+
    if (!canCustomize) {
      ['settingsAccentRow','settingsFontRow','settingsCompactRow'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.style.opacity = '0.45'; el.style.pointerEvents = 'none'; }
      });
    }

    // Font size
    document.querySelectorAll('#fontSizeSeg .seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!canCustomize) return;
        document.querySelectorAll('#fontSizeSeg .seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _applyFontSize(btn.dataset.size);
        localStorage.setItem('dsbp_fontsize', btn.dataset.size);
      });
    });

    // Compact mode
    document.getElementById('settingCompactMode')?.addEventListener('change', (e) => {
      if (!canCustomize) return;
      if (e.target.checked) document.documentElement.classList.add('compact-mode');
      else document.documentElement.classList.remove('compact-mode');
      localStorage.setItem('dsbp_compact', e.target.checked ? 'true' : 'false');
      showNotif(`Compact mode ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
    });

    // Server name input
    document.getElementById('settingServerName')?.addEventListener('input', (e) => {
      AppState.project.name = e.target.value || 'My Server';
      AppState.markDirty();
      updateSidebarStats();
      LivePreview.update();
    });

    // Description input
    document.getElementById('settingServerDesc')?.addEventListener('input', (e) => {
      AppState.project.description = e.target.value;
      AppState.markDirty();
    });

    // Auto-save
    document.getElementById('settingAutoSave')?.addEventListener('change', (e) => {
      AppState.autoSave = e.target.checked;
      document.getElementById('globalAutoSave').checked = AppState.autoSave;
      showNotif(`Auto-save ${AppState.autoSave ? 'enabled' : 'disabled'}`, 'info');
    });

    // Reveal file
    document.getElementById('settingRevealFile')?.addEventListener('click', () => {
      if (AppState.currentFilePath) window.electronAPI.revealFile(AppState.currentFilePath);
    });

    // Reset project
    document.getElementById('settingResetProject')?.addEventListener('click', () => {
      if (confirm('Are you sure? This will clear all categories, channels, roles, and messages.')) {
        AppState.project.categories = [];
        AppState.project.roles = [];
        AppState.project.messages = { welcome: null, rules: null, tickets: null, prices: null, vouches: null, giveaway: null };
        AppState.markDirty();
        updateSidebarStats();
        updateDashboardStats();
        LivePreview.update();
        showNotif('Project reset', 'info');
      }
    });
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _applyAccent(color) {
    document.documentElement.style.setProperty('--accent', color);
    // Derive dim / glow variants
    document.documentElement.style.setProperty('--accent-dim', color);
    document.documentElement.style.setProperty('--accent-glow', color.replace(')', ',0.35)').replace('rgb(', 'rgba('));
  }

  function _applyFontSize(size) {
    const map = { small: '12px', medium: '13px', large: '15px' };
    document.documentElement.style.setProperty('--font-base', map[size] || '13px');
  }

  function init() {
    const theme = localStorage.getItem('dsbp_theme');
    if (theme === 'light') document.documentElement.classList.add('theme-light');

    const accent = localStorage.getItem('dsbp_accent');
    if (accent) _applyAccent(accent);

    const fontSize = localStorage.getItem('dsbp_fontsize');
    if (fontSize) _applyFontSize(fontSize);

    const compact = localStorage.getItem('dsbp_compact');
    if (compact === 'true') document.documentElement.classList.add('compact-mode');
  }

  return { render, init };
})();
