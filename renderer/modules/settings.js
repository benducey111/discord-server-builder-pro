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

  function init() {
    const saved = localStorage.getItem('dsbp_theme');
    if (saved === 'light') document.documentElement.classList.add('theme-light');
  }

  return { render, init };
})();
