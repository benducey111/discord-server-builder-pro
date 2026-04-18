/* ════════════════════════════════════════
   LIVE PREVIEW MODULE
════════════════════════════════════════ */

const LivePreview = (() => {

  function update() {
    updateServerHeader();
    updateChannels();
    updateRoles();
  }

  function updateServerHeader() {
    const name = AppState.project.name || 'My Server';
    const el = document.getElementById('dmServerName');
    if (el) el.textContent = name;
    const tabTitle = document.getElementById('dmServerHeader');
  }

  function updateChannels() {
    const container = document.getElementById('dmChannels');
    if (!container) return;
    const cats = AppState.project.categories;

    if (cats.length === 0) {
      container.innerHTML = '<div class="dm-empty-hint">Add categories &amp; channels to see a live preview</div>';
      return;
    }

    container.innerHTML = '';
    cats.forEach(cat => {
      const catEl = document.createElement('div');
      catEl.className = 'dm-category';

      const catHeader = document.createElement('div');
      catHeader.className = 'dm-category-name';
      catHeader.innerHTML = `
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        ${escapeHtml(cat.name.toUpperCase())}
      `;
      catEl.appendChild(catHeader);

      if (!cat.collapsed) {
        cat.channels.forEach(ch => {
          const chEl = document.createElement('div');
          chEl.className = 'dm-channel';
          const isVoice = ch.type === 'voice';
          chEl.innerHTML = `
            <span class="dm-channel-icon">
              ${isVoice
                ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`
                : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
              }
            </span>
            <span class="dm-channel-name">${escapeHtml(ch.name)}</span>
          `;
          catEl.appendChild(chEl);
        });
      }

      container.appendChild(catEl);
    });
  }

  function updateRoles() {
    const section = document.getElementById('dmRolesSection');
    const list = document.getElementById('dmRolesList');
    if (!section || !list) return;

    const roles = AppState.project.roles;
    if (roles.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    list.innerHTML = '';
    roles.forEach(role => {
      const badge = document.createElement('div');
      badge.className = 'dm-role-badge';
      badge.innerHTML = `
        <span class="dm-role-dot" style="background:${role.color};box-shadow:0 0 4px ${role.color};"></span>
        <span>${escapeHtml(role.name)}</span>
      `;
      list.appendChild(badge);
    });
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { update };
})();
