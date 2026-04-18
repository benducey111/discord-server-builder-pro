/* ════════════════════════════════════════
   DEPLOY MODULE — v2
   Features added:
     Feature 1 — Clean Deploy toggle
     Feature 3 — Role Hierarchy toggle
     Feature 5 — Webhook Sender
════════════════════════════════════════ */

const DeployModule = (() => {

  let isDeploying  = false;
  let isSending    = false;
  let isConnected  = false;
  let connectedBotName = '';
  let progressListenerAdded = false;

  // ── Main Render ───────────────────────
  function render() {
    const container = document.getElementById('deployContent');
    if (!container) return;
    if (container.dataset.initialized) {
      updateConnectionUI();
      refreshWebhookPreview();
      return;
    }
    container.dataset.initialized = 'true';
    container.innerHTML = buildDeployHTML();
    bindEvents();
    updateConnectionUI();
    if (!progressListenerAdded) { listenForProgress(); progressListenerAdded = true; }
  }

  // ── HTML Builder ──────────────────────
  function buildDeployHTML() {
    return `
    <div class="deploy-layout">

      <!-- ── Left: Config ── -->
      <div class="deploy-left">

        <!-- Bot Setup -->
        <div class="deploy-card">
          <div class="deploy-card-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Bot Configuration
          </div>
          <div class="form-group">
            <label class="form-label">Bot Token <span class="deploy-required">required</span></label>
            <div class="token-input-wrap">
              <input type="password" class="form-input" id="deployToken" placeholder="Bot.Token.Here" autocomplete="off" spellcheck="false">
              <button class="icon-btn token-toggle-btn" id="deployTokenToggle" title="Show/hide token">
                <svg id="tokenEyeIcon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
            <div class="form-hint">Discord Developer Portal → Your App → Bot → Token</div>
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Server ID (Guild ID) <span class="deploy-required">required</span></label>
            <input type="text" class="form-input" id="deployGuildId" placeholder="1234567890123456789" maxlength="20" spellcheck="false">
            <div class="form-hint">Right-click server in Discord → <strong>Copy Server ID</strong> (needs Developer Mode)</div>
          </div>
        </div>

        <!-- Connection Status -->
        <div class="deploy-connection-card" id="connectionCard">
          <div class="deploy-conn-indicator">
            <span class="conn-dot" id="connDot"></span>
            <span id="connStatus">Not connected</span>
          </div>
          <button class="btn btn-ghost btn-sm" id="btnTestConnection">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Test Connection
          </button>
        </div>

        <!-- Deploy Options -->
        <div class="deploy-card">
          <div class="deploy-card-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Deploy Options
          </div>
          <div class="deploy-options-list">
            <label class="deploy-option-row">
              <label class="toggle-switch sm"><input type="checkbox" id="optRenameServer" checked><span class="toggle-slider"></span></label>
              <div class="deploy-option-info">
                <span class="deploy-option-label">Rename server</span>
                <span class="deploy-option-desc">Set server name to: <strong id="optRenamePreview">${escapeHtml(AppState?.project?.name || 'My Server')}</strong></span>
              </div>
            </label>
            <label class="deploy-option-row">
              <label class="toggle-switch sm"><input type="checkbox" id="optCreateRoles" checked><span class="toggle-slider"></span></label>
              <div class="deploy-option-info">
                <span class="deploy-option-label">Create roles</span>
                <span class="deploy-option-desc">Deploy all roles with colors &amp; permissions</span>
              </div>
            </label>
            <!-- Feature 3: Role Hierarchy -->
            <label class="deploy-option-row" style="padding-left:28px;">
              <label class="toggle-switch sm"><input type="checkbox" id="optOrderRoles" checked><span class="toggle-slider"></span></label>
              <div class="deploy-option-info">
                <span class="deploy-option-label" style="font-size:12px;">Set role hierarchy order</span>
                <span class="deploy-option-desc">First role = highest, last = lowest in Discord</span>
              </div>
            </label>
            <label class="deploy-option-row">
              <label class="toggle-switch sm"><input type="checkbox" id="optCreateChannels" checked><span class="toggle-slider"></span></label>
              <div class="deploy-option-info">
                <span class="deploy-option-label">Create categories &amp; channels</span>
                <span class="deploy-option-desc">Deploys full structure including channel topics</span>
              </div>
            </label>
            <label class="deploy-option-row">
              <label class="toggle-switch sm"><input type="checkbox" id="optSkipDuplicates" checked><span class="toggle-slider"></span></label>
              <div class="deploy-option-info">
                <span class="deploy-option-label">Skip duplicates</span>
                <span class="deploy-option-desc">Skip if name already exists in the server</span>
              </div>
            </label>

            <!-- Feature 1: Clean Deploy -->
            <div class="clean-deploy-divider"></div>
            <label class="deploy-option-row clean-deploy-row" id="cleanDeployRow">
              <label class="toggle-switch sm"><input type="checkbox" id="optCleanDeploy"><span class="toggle-slider" style="background:rgba(237,66,69,0.15);border-color:rgba(237,66,69,0.3);"></span></label>
              <div class="deploy-option-info">
                <span class="deploy-option-label" style="color:var(--red);">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:3px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Clean Deploy (delete existing content first)
                </span>
                <span class="deploy-option-desc">Deletes ALL existing channels &amp; roles before deploying. Irreversible.</span>
              </div>
            </label>
            <div class="clean-deploy-warning hidden" id="cleanDeployWarning">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
              This will permanently delete every channel and role in the target server before creating new ones. Only use on test servers. Cannot be undone.
            </div>
          </div>
        </div>

        <!-- Project Summary -->
        <div class="deploy-card deploy-summary-card">
          <div class="deploy-card-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
            Current Project
          </div>
          <div id="deployProjectSummary"></div>
        </div>

        <!-- Deploy Button -->
        <button class="btn btn-deploy" id="btnDeploy" disabled>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          Deploy to Server
        </button>

        <div class="deploy-warning">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div>Bot must be invited to your server with <strong>Manage Channels</strong>, <strong>Manage Roles</strong> &amp; <strong>Administrator</strong> permissions. Standard deploy only <em>creates</em> content.</div>
        </div>
      </div>

      <!-- ── Right: Log Panel ── -->
      <div class="deploy-right">
        <div class="deploy-log-header">
          <span class="deploy-log-title">Deployment Log</span>
          <button class="btn btn-ghost btn-sm" id="btnClearLog">Clear</button>
        </div>
        <div class="deploy-log" id="deployLog">
          <div class="log-entry log-welcome">Ready. Configure bot token and server ID, then click <strong>Test Connection</strong>.</div>
        </div>
      </div>

    </div><!-- /deploy-layout -->

    <!-- ════════════ Feature 5: Webhook Sender ════════════ -->
    <div class="webhook-section">
      <button class="deploy-guide-toggle" id="webhookToggle">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="stroke:#3ba55c;"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        Webhook Sender — Send embeds directly to a channel
        <svg class="guide-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="deploy-guide-content" id="webhookContent" style="display:none;">
        <div class="webhook-layout">
          <div class="webhook-left">
            <div class="form-group">
              <label class="form-label">Webhook URL</label>
              <input type="text" class="form-input" id="webhookUrl"
                placeholder="https://discord.com/api/webhooks/..." spellcheck="false">
              <div class="form-hint">In Discord: Channel Settings → Integrations → Webhooks → Copy Webhook URL</div>
            </div>
            <div class="form-group">
              <label class="form-label">Message to Send</label>
              <select class="form-select" id="webhookMsgType">
                <option value="welcome">👋 Welcome</option>
                <option value="rules">📜 Rules</option>
                <option value="tickets">🎫 Ticket Panel</option>
                <option value="prices">💰 Prices Panel</option>
                <option value="vouches">⭐ Vouches Panel</option>
                <option value="giveaway">🎉 Giveaway</option>
              </select>
            </div>
            <button class="btn btn-webhook" id="btnSendWebhook">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Send via Webhook
            </button>
            <div class="webhook-result hidden" id="webhookResult"></div>
          </div>
          <div class="webhook-right">
            <div class="preview-label" style="margin-bottom:8px;">Message Preview</div>
            <div class="discord-msg-preview" id="webhookMsgPreview" style="flex:1;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ════════════ Setup Guide ════════════ -->
    <div class="deploy-guide-section">
      <button class="deploy-guide-toggle" id="deployGuideToggle">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        How to set up your Discord bot
        <svg class="guide-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="deploy-guide-content" id="deployGuideContent" style="display:none;">
        <div class="guide-steps">
          <div class="guide-step"><div class="guide-step-num">1</div><div class="guide-step-body"><div class="guide-step-title">Create a Discord Application</div><div class="guide-step-desc">Go to <strong>discord.com/developers/applications</strong> → <strong>"New Application"</strong> → name it → Create.</div></div></div>
          <div class="guide-step"><div class="guide-step-num">2</div><div class="guide-step-body"><div class="guide-step-title">Enable the Bot</div><div class="guide-step-desc">Go to the <strong>Bot</strong> tab → <strong>"Add Bot"</strong> → confirm → click <strong>"Reset Token"</strong> → copy it.</div></div></div>
          <div class="guide-step"><div class="guide-step-num">3</div><div class="guide-step-body"><div class="guide-step-title">Invite the Bot</div><div class="guide-step-desc">Go to <strong>OAuth2 → URL Generator</strong> → scope: <code>bot</code> → permissions: <code>Administrator</code> → copy URL → open in browser → select server → Authorize.</div></div></div>
          <div class="guide-step"><div class="guide-step-num">4</div><div class="guide-step-body"><div class="guide-step-title">Get Your Server ID</div><div class="guide-step-desc">In Discord: <strong>User Settings → Advanced → Developer Mode ON</strong> → right-click server → <strong>"Copy Server ID"</strong>.</div></div></div>
          <div class="guide-step"><div class="guide-step-num">5</div><div class="guide-step-body"><div class="guide-step-title">Test &amp; Deploy</div><div class="guide-step-desc">Click <strong>Test Connection</strong>. Once connected, click <strong>Deploy to Server</strong> and watch the log.</div></div></div>
        </div>
      </div>
    </div>
    `;
  }

  // ── UI State Helpers ──────────────────
  function updateConnectionUI() {
    const dot      = document.getElementById('connDot');
    const status   = document.getElementById('connStatus');
    const deployBtn = document.getElementById('btnDeploy');
    const preview  = document.getElementById('optRenamePreview');
    if (preview) preview.textContent = AppState?.project?.name || 'My Server';
    updateProjectSummary();
    if (!dot) return;
    if (isConnected) {
      dot.className = 'conn-dot connected';
      status.textContent = `Connected as ${connectedBotName}`;
      if (deployBtn) deployBtn.disabled = false;
    } else {
      dot.className = 'conn-dot';
      status.textContent = 'Not connected';
      if (deployBtn) deployBtn.disabled = true;
    }
  }

  function updateProjectSummary() {
    const el = document.getElementById('deployProjectSummary');
    if (!el) return;
    const p = AppState?.project;
    if (!p) return;
    const cats     = p.categories?.length || 0;
    const channels = (p.categories || []).reduce((s, c) => s + (c.channels?.length || 0), 0);
    const roles    = p.roles?.length || 0;
    const topics   = (p.categories || []).reduce((s, c) =>
      s + (c.channels || []).filter(ch => ch.topic?.trim()).length, 0);
    if (cats === 0 && roles === 0) {
      el.innerHTML = '<div style="font-size:12px;color:var(--text-4);">Project is empty — build your server structure first.</div>';
      return;
    }
    el.innerHTML = `
      <div class="deploy-proj-stats">
        <span class="deploy-proj-stat"><strong>${cats}</strong> categories</span>
        <span class="deploy-proj-stat"><strong>${channels}</strong> channels</span>
        <span class="deploy-proj-stat"><strong>${roles}</strong> roles</span>
        ${topics > 0 ? `<span class="deploy-proj-stat"><strong>${topics}</strong> topics</span>` : ''}
      </div>
      <div style="font-size:12px;color:var(--text-4);margin-top:6px;">Server name: <strong style="color:var(--text-2);">${escapeHtml(p.name || 'My Server')}</strong></div>
    `;
  }

  // ── Webhook Preview ───────────────────
  function refreshWebhookPreview() {
    const select  = document.getElementById('webhookMsgType');
    const preview = document.getElementById('webhookMsgPreview');
    if (!select || !preview) return;
    const type = select.value;
    const m = AppState?.project?.messages?.[type];
    if (!m) {
      preview.innerHTML = '<div style="color:var(--text-4);font-size:12px;padding:8px;">No message generated for this type yet. Go to the Messages tab to create it.</div>';
      return;
    }
    preview.innerHTML = MessageGenerator.buildEmbedHTMLCompact ? MessageGenerator.buildEmbedHTMLCompact(m) : '';
  }

  // ── Log ───────────────────────────────
  function logEntry(message, level = 'info') {
    const log = document.getElementById('deployLog');
    if (!log) return;
    if (level === 'divider') {
      const d = document.createElement('div'); d.className = 'log-divider';
      log.appendChild(d); log.scrollTop = log.scrollHeight; return;
    }
    const entry = document.createElement('div');
    entry.className = `log-entry log-${level}`;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.innerHTML = `<span class="log-time">${time}</span> ${escapeHtml(message)}`;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
  }

  function listenForProgress() {
    window.electronAPI.onDeployProgress(data => logEntry(data.message, data.level || 'info'));
  }

  // ── Event Bindings ────────────────────
  function bindEvents() {
    // Token show/hide
    document.getElementById('deployTokenToggle')?.addEventListener('click', () => {
      const input = document.getElementById('deployToken');
      if (!input) return;
      input.type = input.type === 'text' ? 'password' : 'text';
      const icon = document.getElementById('tokenEyeIcon');
      if (icon) icon.style.opacity = input.type === 'text' ? '0.4' : '1';
    });

    // Test connection
    document.getElementById('btnTestConnection')?.addEventListener('click', async () => {
      const token   = document.getElementById('deployToken')?.value?.trim();
      const guildId = document.getElementById('deployGuildId')?.value?.trim();
      if (!token)   { logEntry('⚠ Enter your bot token', 'warn'); return; }
      if (!guildId) { logEntry('⚠ Enter the Server ID', 'warn'); return; }

      const btn = document.getElementById('btnTestConnection');
      btn.disabled = true; btn.textContent = 'Testing…';
      isConnected = false; updateConnectionUI();
      logEntry('🔌 Testing connection…');

      const result = await window.electronAPI.deployTestConnection(token, guildId);
      btn.disabled = false;
      btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Test Connection`;

      if (result.success) {
        isConnected = true; connectedBotName = result.botName || 'Bot';
        logEntry(`✅ Connected as ${result.botName} — Server: "${result.guildName}"`, 'success');
      } else {
        logEntry(`❌ Connection failed: ${result.error}`, 'error');
      }
      updateConnectionUI();
    });

    // Feature 1: Clean deploy toggle warning
    document.getElementById('optCleanDeploy')?.addEventListener('change', e => {
      const warning = document.getElementById('cleanDeployWarning');
      warning?.classList.toggle('hidden', !e.target.checked);
    });

    // Deploy button
    document.getElementById('btnDeploy')?.addEventListener('click', async () => {
      if (isDeploying) return;
      const token   = document.getElementById('deployToken')?.value?.trim();
      const guildId = document.getElementById('deployGuildId')?.value?.trim();
      if (!token || !guildId) { logEntry('⚠ Bot token and Server ID required', 'warn'); return; }

      const cats  = AppState.project.categories?.length || 0;
      const roles = AppState.project.roles?.length || 0;
      if (cats === 0 && roles === 0) { logEntry('⚠ Project is empty — build your server structure first', 'warn'); return; }

      // Check deploy limit before proceeding
      if (typeof PlanManager !== 'undefined' && typeof PlanManager.checkDeployLimit === 'function') {
        PlanManager.checkDeployLimit(async () => _runDeploy(token, guildId));
        return;
      }
      _runDeploy(token, guildId);
    });
  }

  async function _runDeploy(token, guildId) {
      if (isDeploying) return;
      const isClean = document.getElementById('optCleanDeploy')?.checked;
      const cleanMsg = isClean ? '\n\n⚠ CLEAN DEPLOY is ON — ALL existing channels and roles will be permanently deleted first.' : '';
      if (!confirm(`Deploy "${AppState.project.name}" to Discord?${cleanMsg}\n\nContinue?`)) return;

      isDeploying = true;
      const btn = document.getElementById('btnDeploy');
      btn.disabled = true;
      btn.innerHTML = `<svg class="spin-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Deploying…`;

      logEntry('', 'divider');
      logEntry('🚀 Starting deployment…');

      const options = {
        renameServer:   document.getElementById('optRenameServer')?.checked  ?? true,
        createRoles:    document.getElementById('optCreateRoles')?.checked   ?? true,
        orderRoles:     document.getElementById('optOrderRoles')?.checked    ?? true,   // Feature 3
        createChannels: document.getElementById('optCreateChannels')?.checked ?? true,
        skipDuplicates: document.getElementById('optSkipDuplicates')?.checked ?? true,
        cleanDeploy:    document.getElementById('optCleanDeploy')?.checked   ?? false   // Feature 1
      };

      const result = await window.electronAPI.deployToServer(token, guildId, AppState.project, options);
      isDeploying = false;
      btn.disabled = false;
      btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Deploy to Server`;

      if (result.success) showNotif('Deployment complete! 🎉', 'success', 5000);
      else showNotif(`Deployment failed: ${result.error}`, 'error', 6000);
  }

    // Clear log
    document.getElementById('btnClearLog')?.addEventListener('click', () => {
      const log = document.getElementById('deployLog');
      if (log) log.innerHTML = '';
    });

    // Guide toggle
    document.getElementById('deployGuideToggle')?.addEventListener('click', () => {
      const c = document.getElementById('deployGuideContent');
      const v = document.querySelector('#deployGuideToggle .guide-chevron');
      if (!c) return;
      const open = c.style.display !== 'none';
      c.style.display = open ? 'none' : 'block';
      if (v) v.style.transform = open ? '' : 'rotate(180deg)';
    });

    // ── Feature 5: Webhook sender ─────────────────────────────────────────
    document.getElementById('webhookToggle')?.addEventListener('click', () => {
      const c = document.getElementById('webhookContent');
      const v = document.querySelector('#webhookToggle .guide-chevron');
      if (!c) return;
      const open = c.style.display !== 'none';
      c.style.display = open ? 'none' : 'block';
      if (v) v.style.transform = open ? '' : 'rotate(180deg)';
      if (!open) refreshWebhookPreview();
    });

    document.getElementById('webhookMsgType')?.addEventListener('change', refreshWebhookPreview);

    document.getElementById('btnSendWebhook')?.addEventListener('click', async () => {
      if (isSending) return;
      const url  = document.getElementById('webhookUrl')?.value?.trim();
      const type = document.getElementById('webhookMsgType')?.value;
      if (!url)  { showWebhookResult('Enter a webhook URL first', 'error'); return; }
      if (!type) { showWebhookResult('Select a message type', 'error'); return; }

      const messageData = AppState?.project?.messages?.[type];
      if (!messageData) {
        showWebhookResult(`No "${type}" message found. Generate it in the Messages tab first.`, 'error');
        return;
      }

      isSending = true;
      const btn = document.getElementById('btnSendWebhook');
      btn.disabled = true;
      btn.innerHTML = `<svg class="spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Sending…`;

      const result = await window.electronAPI.sendWebhook(url, messageData);
      isSending = false;
      btn.disabled = false;
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send via Webhook`;

      if (result.success) {
        showWebhookResult('✅ Message sent successfully!', 'success');
        showNotif('Webhook sent! Check your Discord channel.', 'success');
      } else {
        showWebhookResult(`❌ Failed: ${result.error}`, 'error');
      }
    });
  }

  function showWebhookResult(msg, type) {
    const el = document.getElementById('webhookResult');
    if (!el) return;
    el.className = `webhook-result webhook-result-${type}`;
    el.textContent = msg;
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { render };
})();
