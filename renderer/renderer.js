/* ════════════════════════════════════════
   RENDERER — Main App Coordinator
════════════════════════════════════════ */

// ── Global State ──────────────────────
const AppState = {
  currentTab: 'dashboard',
  currentFilePath: null,
  isDirty: false,
  autoSave: false,
  autoSaveInterval: null,

  project: {
    name: 'My Server',
    description: 'A new Discord server',
    categories: [],
    roles: [],
    messages: {
      welcome: null,
      rules: null,
      tickets: null,
      prices: null,
      vouches: null,
      giveaway: null,
      partnership: null,
      verification: null,
      boost: null,
      application: null
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  markDirty() {
    this.isDirty = true;
    this.project.updatedAt = new Date().toISOString();
    updateSidebarStats();
    updateDashboardStats();
    if (this.autoSave && this.currentFilePath) {
      scheduleAutoSave();
    }
  },

  switchTab(tabId) {
    // ── Plan gating ──────────────────────
    if (tabId === 'deploy' && typeof PlanManager !== 'undefined' && !PlanManager.can('deploy')) {
      PlanManager.requirePlan('deploy');
      return;
    }

    if (typeof AppSounds !== 'undefined') AppSounds.tabSwitch();

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    const tabContent = document.getElementById(`tab-${tabId}`);
    if (navItem) navItem.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
    this.currentTab = tabId;
    if (tabId === 'structure') ServerStructure.render();
    if (tabId === 'roles') RoleManager.render();
    if (tabId === 'messages') MessageGenerator.render();
    if (tabId === 'settings') AppSettings.render();
    if (tabId === 'analytics') Analytics.render();
    if (tabId === 'templates') TemplatesModule.render();
    if (tabId === 'deploy') DeployModule.render();
  }
};

// ── Auto-save debounce ──────────────────
let autoSaveTimer = null;
function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(async () => {
    if (AppState.currentFilePath && AppState.autoSave) {
      const result = await window.electronAPI.quickSave(AppState.project, AppState.currentFilePath);
      if (result.success) {
        updateLastSaved();
        showNotif('Project auto-saved', 'success');
      }
    }
  }, 2000);
}

// ── Sidebar stats ──────────────────────
function updateSidebarStats() {
  const cats = AppState.project.categories.length;
  const channels = AppState.project.categories.reduce((s, c) => s + c.channels.length, 0);
  const roles = AppState.project.roles.length;
  const msgs = Object.values(AppState.project.messages).filter(m => m && m.title).length;

  document.getElementById('statCategories').textContent = cats;
  document.getElementById('statChannels').textContent = channels;
  document.getElementById('statRoles').textContent = roles;

  document.getElementById('navTagStructure').textContent = cats > 0 ? cats : '';
  document.getElementById('navTagRoles').textContent = roles > 0 ? roles : '';

  const serverName = AppState.project.name || 'My Server';
  document.getElementById('sidebarServerName').textContent = serverName;
  document.getElementById('sidebarServerInitial').textContent = serverName.charAt(0).toUpperCase();
}

function updateDashboardStats() {
  const cats = AppState.project.categories.length;
  const channels = AppState.project.categories.reduce((s, c) => s + c.channels.length, 0);
  const roles = AppState.project.roles.length;
  const msgs = Object.values(AppState.project.messages).filter(m => m && m.title).length;

  const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  el('dashCategories', cats);
  el('dashChannels', channels);
  el('dashRoles', roles);
  el('dashMessages', msgs);

  // Update hero title and about panel
  const heroTitle = document.getElementById('dashHeroTitle');
  if (heroTitle) heroTitle.textContent = AppState.project.name || 'My Server';
  const aboutName = document.getElementById('dashAboutName');
  if (aboutName) aboutName.textContent = AppState.project.name || 'My Server';
  const aboutPlan = document.getElementById('dashAboutPlan');
  if (aboutPlan && typeof PlanManager !== 'undefined') {
    const p = PlanManager.PLANS[PlanManager.getPlan()];
    aboutPlan.textContent = p ? p.name : 'Basic';
    aboutPlan.style.color = p ? p.color : '#8b949e';
  }
}

function updateLastSaved() {
  const el = document.getElementById('lastSavedInfo');
  if (!el) return;
  if (AppState.currentFilePath) {
    const now = new Date();
    el.textContent = `Saved ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    el.textContent = 'Not saved yet';
  }
  document.getElementById('sidebarStatusText').textContent = AppState.currentFilePath ? 'Saved' : 'Draft Project';
}

// ── Notifications ──────────────────────
function showNotif(message, type = 'info', duration = 3000) {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const stack = document.getElementById('notifStack');
  const el = document.createElement('div');
  el.className = `notif ${type}`;
  el.innerHTML = `<div class="notif-icon">${icons[type]}</div><span>${message}</span>`;
  stack.appendChild(el);
  // Sound for notifications
  if (typeof AppSounds !== 'undefined') {
    if (type === 'success') AppSounds.success();
    else if (type === 'error') AppSounds.error();
    else AppSounds.notify();
  }
  setTimeout(() => {
    el.classList.add('hiding');
    setTimeout(() => el.remove(), 200);
  }, duration);
}
window.showNotif = showNotif;

// ── Title Bar / Window Controls ─────────
document.getElementById('btnMinimize')?.addEventListener('click', () => window.electronAPI.minimizeWindow());
document.getElementById('btnMaximize')?.addEventListener('click', () => window.electronAPI.maximizeWindow());
document.getElementById('btnClose')?.addEventListener('click', () => window.electronAPI.closeWindow());

window.electronAPI.onWindowStateChanged(({ maximized }) => {
  const btn = document.getElementById('btnMaximize');
  if (btn) btn.title = maximized ? 'Restore' : 'Maximize';
});

// ── Sidebar Navigation ──────────────────
document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
  item.addEventListener('click', () => AppState.switchTab(item.dataset.tab));
});

// ── Quick-start steps ───────────────────
document.querySelectorAll('.qs-step[data-tab]').forEach(step => {
  step.addEventListener('click', () => AppState.switchTab(step.dataset.tab));
});
document.getElementById('qsExportStep')?.addEventListener('click', () => openExportModal());

// ── Top Bar Buttons ─────────────────────
document.getElementById('btnNew')?.addEventListener('click', () => {
  document.getElementById('newProjectName').value = '';
  document.getElementById('newProjectDesc').value = '';
  document.getElementById('modalBackdrop').classList.add('open');
});

document.getElementById('btnSave')?.addEventListener('click', async () => {
  const serverName = AppState.project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const result = await window.electronAPI.saveProject(AppState.project, `${serverName}.dsbp`);
  if (result.success) {
    AppState.currentFilePath = result.filePath;
    AppState.isDirty = false;
    updateLastSaved();
    if (typeof AppSounds !== 'undefined') AppSounds.success();
    showNotif('Project saved successfully!', 'success');
  } else if (result.error) {
    if (typeof AppSounds !== 'undefined') AppSounds.error();
    showNotif(`Save failed: ${result.error}`, 'error');
  }
});

document.getElementById('btnLoad')?.addEventListener('click', async () => {
  const result = await window.electronAPI.loadProject();
  if (result.success) {
    AppState.project = result.data;
    AppState.currentFilePath = result.filePath;
    AppState.isDirty = false;
    updateLastSaved();
    updateSidebarStats();
    updateDashboardStats();
    LivePreview.update();
    if (AppState.currentTab === 'structure') ServerStructure.render();
    if (AppState.currentTab === 'roles') RoleManager.render();
    if (AppState.currentTab === 'messages') MessageGenerator.render();
    if (AppState.currentTab === 'settings') AppSettings.render();
    showNotif(`Loaded: ${AppState.project.name}`, 'success');
  } else if (result.error) {
    showNotif(`Load failed: ${result.error}`, 'error');
  }
});

document.getElementById('btnExport')?.addEventListener('click', () => openExportModal());

// ── Dashboard quick action buttons ──────
document.getElementById('btnNew2')?.   addEventListener('click', () => document.getElementById('btnNew')?.click());
document.getElementById('btnSave2')?.  addEventListener('click', () => document.getElementById('btnSave')?.click());
document.getElementById('btnLoad2')?.  addEventListener('click', () => document.getElementById('btnLoad')?.click());
document.getElementById('btnExport2')?.addEventListener('click', () => openExportModal());

// ── New Project Modal ───────────────────
document.getElementById('modalNewConfirm')?.addEventListener('click', () => {
  const name = document.getElementById('newProjectName').value.trim() || 'My Server';
  const desc = document.getElementById('newProjectDesc').value.trim() || '';
  AppState.project = {
    name,
    description: desc,
    categories: [],
    roles: [],
    messages: { welcome: null, rules: null, tickets: null, prices: null, vouches: null, giveaway: null, partnership: null, verification: null, boost: null, application: null },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  AppState.currentFilePath = null;
  AppState.isDirty = false;
  closeModal('modalBackdrop');
  updateSidebarStats();
  updateDashboardStats();
  updateLastSaved();
  LivePreview.update();
  if (AppState.currentTab === 'structure') ServerStructure.render();
  if (AppState.currentTab === 'roles') RoleManager.render();
  if (AppState.currentTab === 'messages') MessageGenerator.render();
  if (AppState.currentTab === 'settings') AppSettings.render();
  AppState.switchTab('dashboard');
  showNotif(`Created project: ${name}`, 'success');
});

document.getElementById('modalNewCancel')?.addEventListener('click', () => closeModal('modalBackdrop'));
document.getElementById('modalNewClose')?.addEventListener('click', () => closeModal('modalBackdrop'));

// ── Export Modal ───────────────────────
function openExportModal() {
  document.getElementById('exportModalBackdrop').classList.add('open');
}

document.getElementById('exportModalClose')?.addEventListener('click', () => closeModal('exportModalBackdrop'));

document.getElementById('exportProjectJSON')?.addEventListener('click', async () => {
  closeModal('exportModalBackdrop');
  const name = AppState.project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const result = await window.electronAPI.exportJSON(AppState.project, `${name}-full.json`);
  if (result.success) showNotif('Full project exported as JSON', 'success');
  else if (result.error) showNotif(`Export failed: ${result.error}`, 'error');
});

document.getElementById('exportMessagesJSON')?.addEventListener('click', () => {
  PlanManager.requirePlan('export_messages_json', async () => {
    closeModal('exportModalBackdrop');
    const name = AppState.project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const result = await window.electronAPI.exportJSON(AppState.project.messages, `${name}-messages.json`);
    if (result.success) showNotif('Messages exported as JSON', 'success');
    else if (result.error) showNotif(`Export failed: ${result.error}`, 'error');
  });
});

document.getElementById('exportMessagesTXT')?.addEventListener('click', () => {
  PlanManager.requirePlan('export_messages_txt', async () => {
    closeModal('exportModalBackdrop');
    const txt = generateMessagesTXT();
    const name = AppState.project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const result = await window.electronAPI.exportTXT(txt, `${name}-messages.txt`);
    if (result.success) showNotif('Messages exported as TXT', 'success');
    else if (result.error) showNotif(`Export failed: ${result.error}`, 'error');
  });
});

function generateMessagesTXT() {
  const p = AppState.project;
  let out = `Discord Server Builder Pro — Messages Export\n`;
  out += `Server: ${p.name}\n`;
  out += `Generated: ${new Date().toLocaleString()}\n`;
  out += `${'═'.repeat(50)}\n\n`;
  const keys = ['welcome','rules','tickets','prices','vouches','giveaway','partnership','verification','boost','application'];
  for (const key of keys) {
    const m = p.messages[key];
    if (!m) continue;
    out += `[ ${key.toUpperCase()} MESSAGE ]\n`;
    out += `${'─'.repeat(30)}\n`;
    if (m.content) out += `${m.content}\n\n`;
    if (m.title) out += `Title: ${m.title}\n`;
    if (m.description) out += `Description:\n${m.description}\n`;
    if (m.footer) out += `Footer: ${m.footer}\n`;
    if (m.fields && m.fields.length) {
      out += `Fields:\n`;
      m.fields.forEach(f => out += `  • ${f.name}: ${f.value}\n`);
    }
    out += `\n`;
  }
  return out;
}

// ── Close modal helper ─────────────────
function closeModal(backdropId) {
  document.getElementById(backdropId)?.classList.remove('open');
}
window.closeModal = closeModal;

// Click outside modal to close
['modalBackdrop','exportModalBackdrop'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', e => {
    if (e.target.id === id) closeModal(id);
  });
});

// ── Auto-save toggle ────────────────────
document.getElementById('globalAutoSave')?.addEventListener('change', e => {
  AppState.autoSave = e.target.checked;
  showNotif(`Auto-save ${AppState.autoSave ? 'enabled' : 'disabled'}`, 'info');
});

// ── Plan badge upgrade button ───────────
document.getElementById('btnUpgradePlan')?.addEventListener('click', () => {
  if (typeof PlanManager !== 'undefined') PlanManager.showPlanSelector();
});

// ── Account sign-out ────────────────────
document.getElementById('btnSignOutApp')?.addEventListener('click', () => {
  const ok = confirm('Sign out and return to the landing page?\n\nUnsaved project changes will be lost.');
  if (!ok) return;
  if (typeof PlanManager !== 'undefined') PlanManager.clearAccount();
  window.location.href = 'landing.html';
});

// ── Share Project ────────────────────────
document.getElementById('btnShare')?.addEventListener('click', () => {
  if (typeof PlanManager !== 'undefined') {
    PlanManager.requirePlan('share_project', _showShareModal);
  } else {
    _showShareModal();
  }
});

function _showShareModal() {
  // Remove existing
  document.getElementById('shareModalBackdrop')?.remove();

  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(AppState.project))));
  const shareLink = `dsbp://import/${encoded}`;

  const backdrop = document.createElement('div');
  backdrop.id = 'shareModalBackdrop';
  backdrop.className = 'modal-backdrop open';
  backdrop.innerHTML = `
    <div class="modal" id="shareModal" style="max-width:520px;">
      <div class="modal-header">
        <h2 class="modal-title">Share Project</h2>
        <button class="modal-close" id="shareModalClose">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <p style="font-size:13px;color:var(--text-3);margin-bottom:16px;">
          Share this link with anyone to let them import your server design into their DSBP app.
        </p>
        <div style="display:flex;gap:8px;">
          <input class="form-input" id="shareLinkInput" value="${shareLink}" readonly style="font-size:11px;font-family:monospace;flex:1;">
          <button class="btn btn-primary" id="btnCopyShareLink">Copy</button>
        </div>
        <div style="margin-top:20px;border-top:1px solid var(--border);padding-top:16px;">
          <div class="form-label" style="margin-bottom:8px;">Import a shared link</div>
          <div style="display:flex;gap:8px;">
            <input class="form-input" id="importLinkInput" placeholder="Paste dsbp://import/... link here" style="flex:1;">
            <button class="btn btn-ghost" id="btnImportLink">Import</button>
          </div>
          <div id="importLinkError" style="font-size:12px;color:var(--red);margin-top:6px;display:none;"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const close = () => backdrop.remove();
  backdrop.querySelector('#shareModalClose')?.addEventListener('click', close);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });

  backdrop.querySelector('#btnCopyShareLink')?.addEventListener('click', () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      const btn = document.getElementById('btnCopyShareLink');
      if (btn) { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 2000); }
    });
  });

  backdrop.querySelector('#btnImportLink')?.addEventListener('click', () => {
    const val = document.getElementById('importLinkInput')?.value?.trim();
    const errEl = document.getElementById('importLinkError');
    if (!val || !val.startsWith('dsbp://import/')) {
      errEl.textContent = 'Invalid link format. Must start with dsbp://import/';
      errEl.style.display = 'block';
      return;
    }
    try {
      const encoded = val.replace('dsbp://import/', '');
      const project = JSON.parse(decodeURIComponent(escape(atob(encoded))));
      AppState.project = { ...AppState.project, ...project };
      AppState.markDirty();
      if (typeof updateSidebarStats === 'function') updateSidebarStats();
      if (typeof updateDashboardStats === 'function') updateDashboardStats();
      if (typeof LivePreview !== 'undefined') LivePreview.update();
      close();
      if (typeof showNotif === 'function') showNotif('Project imported successfully!', 'success');
    } catch(e) {
      errEl.textContent = 'Failed to parse link. It may be corrupted.';
      errEl.style.display = 'block';
    }
  });
}

// ── Init ────────────────────────────────
(function init() {
  // Load plan/account state first so UI reflects the correct plan
  if (typeof PlanManager !== 'undefined') PlanManager.init();
  if (typeof AppSettings !== 'undefined' && typeof AppSettings.init === 'function') AppSettings.init();
  if (typeof Analytics !== 'undefined') Analytics.recordSession();

  updateSidebarStats();
  updateDashboardStats();
  updateLastSaved();
  LivePreview.update();
  AppSettings.render();

  // Update account avatar initial
  const acc = typeof PlanManager !== 'undefined' ? PlanManager.getAccount() : null;
  const avatarEl = document.getElementById('accountInfoAvatar');
  if (avatarEl && acc?.username) {
    avatarEl.textContent = acc.username.charAt(0).toUpperCase();
  }
})();
