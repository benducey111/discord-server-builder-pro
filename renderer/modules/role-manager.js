/* ════════════════════════════════════════
   ROLE MANAGER MODULE
════════════════════════════════════════ */

const RoleManager = (() => {

  const PRESET_COLORS = [
    '#ed4245','#e91e63','#9c27b0','#673ab7',
    '#5865f2','#3f51b5','#2196f3','#03a9f4',
    '#00bcd4','#009688','#3ba55c','#8bc34a',
    '#faa61a','#ff9800','#ff5722','#ffffff'
  ];

  const PERMISSIONS = [
    { key: 'viewChannels',    name: 'View Channels',     desc: 'Can see channels in the server' },
    { key: 'sendMessages',    name: 'Send Messages',     desc: 'Can send messages in text channels' },
    { key: 'manageMessages',  name: 'Manage Messages',   desc: 'Can delete and pin messages' },
    { key: 'connect',         name: 'Connect (Voice)',   desc: 'Can join voice channels' },
    { key: 'manageChannels',  name: 'Manage Channels',   desc: 'Can create, edit, delete channels' },
    { key: 'administrator',   name: 'Administrator',     desc: 'Full server access — use with care' }
  ];

  let selectedRoleId = null;

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // ── Main Render ───────────────────────
  function render() {
    renderRolesList();
    if (selectedRoleId) {
      const role = AppState.project.roles.find(r => r.id === selectedRoleId);
      if (role) renderRoleEditor(role);
      else { selectedRoleId = null; renderEditorEmpty(); }
    } else {
      renderEditorEmpty();
    }
    document.getElementById('rolesCount').textContent = AppState.project.roles.length;
  }

  function renderRolesList() {
    const list = document.getElementById('rolesList');
    const emptyEl = document.getElementById('rolesEmpty');
    const roles = AppState.project.roles;

    if (roles.length === 0) {
      emptyEl?.classList.remove('hidden');
      list.innerHTML = '';
      list.appendChild(emptyEl || createEmptyEl());
      return;
    }

    emptyEl?.classList.add('hidden');
    list.innerHTML = '';
    roles.forEach(role => {
      const item = document.createElement('div');
      item.className = `role-list-item ${role.id === selectedRoleId ? 'active' : ''}`;
      item.dataset.id = role.id;
      item.innerHTML = `
        <span class="role-dot" style="background:${role.color};color:${role.color};"></span>
        <span class="role-list-name">${escapeHtml(role.name)}</span>
        <button class="icon-btn danger role-list-delete" title="Delete role" style="margin-left:auto;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      `;
      item.addEventListener('click', (e) => {
        if (e.target.closest('.role-list-delete')) return;
        selectRole(role.id);
      });
      item.querySelector('.role-list-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteRole(role.id);
      });
      list.appendChild(item);
    });
  }

  function renderEditorEmpty() {
    const editor = document.getElementById('roleEditor');
    editor.innerHTML = `
      <div class="role-editor-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <p>Select a role to edit</p>
      </div>
    `;
  }

  function renderRoleEditor(role) {
    const editor = document.getElementById('roleEditor');

    const permsHTML = PERMISSIONS.map(p => {
      const checked = role.permissions?.[p.key] ? 'checked' : '';
      const isAdmin = p.key === 'administrator';
      return `
        <div class="permission-item">
          <div class="perm-info">
            <div class="perm-name" style="${isAdmin ? 'color:#faa61a;' : ''}">${p.name}${isAdmin ? ' ⚠' : ''}</div>
            <div class="perm-desc">${p.desc}</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" data-perm="${p.key}" ${checked}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      `;
    }).join('');

    const swatchesHTML = PRESET_COLORS.map(c => `
      <span class="color-swatch ${role.color === c ? 'selected' : ''}"
            style="background:${c};"
            data-color="${c}"
            title="${c}"></span>
    `).join('');

    editor.innerHTML = `
      <div class="role-editor-content">
        <div class="role-editor-header">
          <div class="role-color-preview" style="background:${role.color};color:${role.color};"></div>
          <div>
            <div class="role-editor-name">${escapeHtml(role.name)}</div>
            <div style="font-size:11px;color:var(--text-4);">${countEnabledPerms(role)} permissions enabled</div>
          </div>
          <button class="btn btn-danger btn-sm" id="deleteRoleBtn" style="margin-left:auto;">Delete Role</button>
        </div>

        <div class="role-editor-body">
          <div class="form-group">
            <label class="form-label">Role Name</label>
            <input type="text" class="form-input" id="roleNameInput" value="${escapeHtml(role.name)}" maxlength="100" placeholder="Role name...">
          </div>

          <div class="role-color-section">
            <div class="color-section-title">Role Color</div>
            <div class="color-swatches">${swatchesHTML}</div>
            <div class="color-custom-row">
              <input type="color" class="color-picker-input" id="roleColorPicker" value="${role.color}">
              <span class="color-hex-display" id="colorHexDisplay">${role.color}</span>
              <span style="font-size:11px;color:var(--text-4);">Custom color</span>
            </div>
          </div>

          <div class="permissions-section-title">Permissions</div>
          <div class="permission-list">${permsHTML}</div>
        </div>
      </div>
    `;

    // Role name input
    const nameInput = editor.querySelector('#roleNameInput');
    nameInput.addEventListener('input', () => {
      role.name = nameInput.value || role.name;
      editor.querySelector('.role-editor-name').textContent = role.name;
      AppState.markDirty();
      renderRolesList();
      LivePreview.update();
    });

    // Delete button
    editor.querySelector('#deleteRoleBtn').addEventListener('click', () => deleteRole(role.id));

    // Color swatches
    editor.querySelectorAll('.color-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        setRoleColor(role, sw.dataset.color);
        editor.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        sw.classList.add('selected');
      });
    });

    // Custom color picker
    const picker = editor.querySelector('#roleColorPicker');
    picker.addEventListener('input', () => {
      setRoleColor(role, picker.value);
      editor.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    });

    // Permission toggles
    editor.querySelectorAll('input[data-perm]').forEach(toggle => {
      toggle.addEventListener('change', () => {
        if (!role.permissions) role.permissions = {};
        role.permissions[toggle.dataset.perm] = toggle.checked;
        editor.querySelector('.role-editor-name + div').textContent = `${countEnabledPerms(role)} permissions enabled`;
        AppState.markDirty();
      });
    });
  }

  function setRoleColor(role, color) {
    role.color = color;
    const preview = document.querySelector('.role-editor-header .role-color-preview');
    if (preview) { preview.style.background = color; preview.style.color = color; }
    const hexDisplay = document.getElementById('colorHexDisplay');
    if (hexDisplay) hexDisplay.textContent = color;
    const picker = document.getElementById('roleColorPicker');
    if (picker) picker.value = color;
    const dot = document.querySelector(`.role-list-item[data-id="${role.id}"] .role-dot`);
    if (dot) { dot.style.background = color; dot.style.color = color; }
    AppState.markDirty();
    LivePreview.update();
  }

  function countEnabledPerms(role) {
    if (!role.permissions) return 0;
    return Object.values(role.permissions).filter(Boolean).length;
  }

  // ── CRUD ──────────────────────────────
  function addRole() {
    const colors = PRESET_COLORS;
    const color = colors[AppState.project.roles.length % colors.length] || '#5865f2';
    const role = {
      id: genId(),
      name: 'New Role',
      color,
      permissions: {
        viewChannels: true,
        sendMessages: true,
        manageMessages: false,
        connect: true,
        manageChannels: false,
        administrator: false
      }
    };
    AppState.project.roles.push(role);
    selectedRoleId = role.id;
    AppState.markDirty();
    render();
    LivePreview.update();
    const nameInput = document.getElementById('roleNameInput');
    if (nameInput) { nameInput.focus(); nameInput.select(); }
  }

  function deleteRole(id) {
    AppState.project.roles = AppState.project.roles.filter(r => r.id !== id);
    if (selectedRoleId === id) selectedRoleId = null;
    AppState.markDirty();
    render();
    LivePreview.update();
    showNotif('Role deleted', 'info');
  }

  function selectRole(id) {
    selectedRoleId = id;
    render();
  }

  function createEmptyEl() {
    const div = document.createElement('div');
    div.className = 'empty-state-sm';
    div.id = 'rolesEmpty';
    div.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><p>No roles yet</p>`;
    return div;
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Event Bindings ────────────────────
  document.getElementById('btnAddRole')?.addEventListener('click', addRole);

  return { render, addRole };
})();
