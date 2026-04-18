/* ════════════════════════════════════════
   ANALYTICS MODULE — Developer+ feature
════════════════════════════════════════ */

const Analytics = (() => {

  const STORAGE_KEY = 'dsbp_analytics';

  // ── Data helpers ─────────────────────────
  function getData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { deploys: [], sessions: [] };
    } catch(e) {
      return { deploys: [], sessions: [] };
    }
  }

  function saveData(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
  }

  /** Call this when a deploy succeeds */
  function recordDeploy(serverName) {
    const data = getData();
    data.deploys = data.deploys || [];
    data.deploys.unshift({
      serverName: serverName || 'Unknown',
      ts: Date.now()
    });
    // Keep last 50
    data.deploys = data.deploys.slice(0, 50);
    saveData(data);
  }

  /** Call this at app start */
  function recordSession() {
    const data = getData();
    data.sessions = data.sessions || [];
    const today = new Date().toDateString();
    if (!data.sessions.length || data.sessions[0].date !== today) {
      data.sessions.unshift({ date: today, ts: Date.now() });
    }
    data.sessions = data.sessions.slice(0, 90);
    saveData(data);
  }

  // ── Render ───────────────────────────────
  function render() {
    const container = document.getElementById('analyticsContent');
    if (!container) return;

    // Plan gate
    if (typeof PlanManager !== 'undefined' && !PlanManager.can('analytics')) {
      container.innerHTML = `
        <div class="plan-gate-banner">
          <div class="plan-gate-icon">📊</div>
          <div class="plan-gate-text">
            <div class="plan-gate-title">Analytics & Insights</div>
            <div class="plan-gate-desc">Track deploy history, project stats, and usage patterns. Upgrade to Developer or Professional to unlock.</div>
          </div>
          <button class="btn btn-primary" onclick="PlanManager.requirePlan('analytics')">Upgrade Plan</button>
        </div>
      `;
      return;
    }

    const data = getData();
    const project = typeof AppState !== 'undefined' ? AppState.project : { categories: [], roles: [], messages: {} };
    const cats = project.categories.length;
    const channels = project.categories.reduce((s, c) => s + (c.channels || []).length, 0);
    const roles = project.roles.length;
    const msgs = Object.values(project.messages || {}).filter(m => m && m.title).length;
    const deploys = data.deploys || [];
    const sessions = data.sessions || [];

    // Build 7-day activity (sessions)
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString([], { weekday: 'short' });
      const dateStr = d.toDateString();
      const active = sessions.some(s => s.date === dateStr);
      days.push({ label, active });
    }

    container.innerHTML = `
      <div class="analytics-grid">

        <!-- Stat cards row -->
        <div class="an-stat-row">
          <div class="an-stat-card" style="--anc:#5865f2;">
            <div class="an-stat-val">${deploys.length}</div>
            <div class="an-stat-label">Total Deploys</div>
            <div class="an-stat-icon">🚀</div>
          </div>
          <div class="an-stat-card" style="--anc:#3ba55c;">
            <div class="an-stat-val">${cats}</div>
            <div class="an-stat-label">Categories</div>
            <div class="an-stat-icon">📂</div>
          </div>
          <div class="an-stat-card" style="--anc:#9b59b6;">
            <div class="an-stat-val">${channels}</div>
            <div class="an-stat-label">Channels</div>
            <div class="an-stat-icon">💬</div>
          </div>
          <div class="an-stat-card" style="--anc:#faa61a;">
            <div class="an-stat-val">${roles}</div>
            <div class="an-stat-label">Roles</div>
            <div class="an-stat-icon">🎭</div>
          </div>
          <div class="an-stat-card" style="--anc:#00d4ff;">
            <div class="an-stat-val">${msgs}</div>
            <div class="an-stat-label">Messages</div>
            <div class="an-stat-icon">📨</div>
          </div>
          <div class="an-stat-card" style="--anc:#ed4245;">
            <div class="an-stat-val">${sessions.length}</div>
            <div class="an-stat-label">Sessions</div>
            <div class="an-stat-icon">📅</div>
          </div>
        </div>

        <div class="an-two-col">

          <!-- Activity heatmap -->
          <div class="an-panel">
            <div class="an-panel-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              7-Day Activity
            </div>
            <div class="an-heatmap">
              ${days.map(d => `
                <div class="an-day ${d.active ? 'active' : ''}">
                  <div class="an-day-bar"></div>
                  <div class="an-day-label">${d.label}</div>
                </div>
              `).join('')}
            </div>
            <div class="an-heatmap-legend">
              <span class="an-legend-dot inactive"></span><span>No activity</span>
              <span class="an-legend-dot active" style="margin-left:12px;"></span><span>Active</span>
            </div>
          </div>

          <!-- Project breakdown -->
          <div class="an-panel">
            <div class="an-panel-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Project Breakdown
            </div>
            <div class="an-bars">
              ${_bar('Categories', cats, Math.max(cats, channels, roles, msgs, 1), '#5865f2')}
              ${_bar('Channels', channels, Math.max(cats, channels, roles, msgs, 1), '#3ba55c')}
              ${_bar('Roles', roles, Math.max(cats, channels, roles, msgs, 1), '#9b59b6')}
              ${_bar('Messages', msgs, Math.max(cats, channels, roles, msgs, 1), '#faa61a')}
            </div>
          </div>
        </div>

        <!-- Deploy history -->
        <div class="an-panel an-full">
          <div class="an-panel-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Deploy History
            <span style="margin-left:auto;font-size:11px;font-weight:400;color:var(--text-4);">${deploys.length} total</span>
          </div>
          ${deploys.length === 0 ? `
            <div class="an-empty">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              <p>No deploys recorded yet</p>
              <p style="font-size:11px;color:var(--text-4);margin-top:4px;">Deploy a server to start tracking history</p>
            </div>
          ` : `
            <div class="an-deploy-list">
              ${deploys.slice(0, 12).map((d, i) => `
                <div class="an-deploy-row">
                  <div class="an-deploy-num">#${deploys.length - i}</div>
                  <div class="an-deploy-icon">🚀</div>
                  <div class="an-deploy-info">
                    <div class="an-deploy-name">${_esc(d.serverName)}</div>
                    <div class="an-deploy-time">${_timeAgo(d.ts)}</div>
                  </div>
                  <div class="an-deploy-badge">Success</div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

      </div>
    `;
  }

  function _bar(label, value, max, color) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return `
      <div class="an-bar-row">
        <div class="an-bar-label">${label}</div>
        <div class="an-bar-track">
          <div class="an-bar-fill" style="width:${pct}%;background:${color};"></div>
        </div>
        <div class="an-bar-val" style="color:${color};">${value}</div>
      </div>
    `;
  }

  function _timeAgo(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hrs  = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24)  return `${hrs}h ago`;
    if (days < 7)  return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
  }

  function _esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { render, recordDeploy, recordSession };
})();

window.Analytics = Analytics;
