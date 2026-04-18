/* ════════════════════════════════════════
   MESSAGE GENERATOR MODULE
════════════════════════════════════════ */

const MessageGenerator = (() => {

  let currentType = 'welcome';

  const DEFAULTS = {
    welcome: {
      content: '👋 Welcome to **{server}**! We\'re glad to have you here.',
      color: '#5865f2',
      title: '👋 Welcome!',
      description: 'Welcome to **{server}**! Please read our rules and enjoy your stay.\n\n**Getting Started:**\n• Read `#rules` to understand our guidelines\n• Grab your roles in `#roles`\n• Introduce yourself in `#introductions`',
      footer: '{server} • {date}',
      fields: []
    },
    rules: {
      content: '',
      color: '#faa61a',
      title: '📜 Server Rules',
      description: 'Please follow these rules to keep our community safe and enjoyable.',
      footer: 'Breaking rules may result in a mute, kick, or ban.',
      fields: [
        { name: '1. Be Respectful', value: 'Treat all members with respect. No harassment, bullying, or hate speech.' },
        { name: '2. No Spam', value: 'Do not spam messages, emojis, or mentions. Keep conversations meaningful.' },
        { name: '3. Appropriate Content', value: 'Keep content SFW and relevant to the channel topic.' },
        { name: '4. No Advertising', value: 'Do not advertise other servers or services without permission.' },
        { name: '5. Follow Discord ToS', value: 'All Discord Terms of Service apply. https://discord.com/terms' }
      ]
    },
    tickets: {
      content: '',
      color: '#3ba55c',
      title: '🎫 Support Tickets',
      description: 'Need help? Click the button below to open a support ticket.\n\nOur support team will assist you as soon as possible.',
      footer: 'Average response time: Under 24 hours',
      fields: [
        { name: '📋 What we help with', value: '• General support\n• Billing questions\n• Technical issues\n• Partnership requests' },
        { name: '⚠️ Before opening a ticket', value: 'Please check `#faq` first — your question might already be answered.' }
      ]
    },
    prices: {
      content: '',
      color: '#9b59b6',
      title: '💰 Our Prices',
      description: 'Check out our available products and services below.',
      footer: 'All prices in USD • DM for custom orders',
      fields: [
        { name: '🥉 Basic Plan — $5/mo', value: 'Access to basic features\n• Feature A\n• Feature B' },
        { name: '🥈 Standard Plan — $15/mo', value: 'Everything in Basic, plus:\n• Feature C\n• Priority support' },
        { name: '🥇 Premium Plan — $30/mo', value: 'Everything in Standard, plus:\n• Feature D\n• Dedicated support\n• Custom setup' }
      ]
    },
    vouches: {
      content: '',
      color: '#faa61a',
      title: '⭐ Customer Reviews',
      description: 'See what our customers are saying about us!\n\n> *"Absolutely amazing service, 10/10 would recommend!"* — User#1234\n\n> *"Super fast delivery and great quality."* — User#5678\n\n> *"Best purchase I\'ve made. Highly recommended!"* — User#9012',
      footer: 'Leave your review in #vouches',
      fields: [
        { name: '⭐ Rating', value: '4.9 / 5.0 stars' },
        { name: '📊 Total Reviews', value: '200+ verified' }
      ]
    },
    giveaway: {
      content: '🎉 **GIVEAWAY TIME!** 🎉',
      color: '#ed4245',
      title: '🎁 Giveaway',
      description: 'We\'re giving away something amazing!\n\n**Prize:** $50 Gift Card\n**Winners:** 1 winner\n**Ends:** 48 hours from now',
      footer: 'React with 🎉 to enter! • Hosted by {server}',
      fields: [
        { name: '📋 How to enter', value: '• React with 🎉 below\n• Be a member of this server\n• Follow the rules' },
        { name: '⚠️ Requirements', value: '• Account age: 30+ days\n• Server member for 7+ days' }
      ]
    }
  };

  // ── Main Render ───────────────────────
  function render() {
    renderTypeButtons();
    renderFields(currentType);
    renderPreview(currentType);
  }

  function renderTypeButtons() {
    document.querySelectorAll('.msg-type-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === currentType);
    });
  }

  function renderFields(type) {
    const container = document.getElementById('msgFields');
    const titleEl = document.getElementById('msgEditorTitle');
    if (!container) return;

    const typeNames = {
      welcome: 'Welcome Message', rules: 'Rules Embed',
      tickets: 'Ticket Panel', prices: 'Prices Panel',
      vouches: 'Vouches Panel', giveaway: 'Giveaway'
    };
    if (titleEl) titleEl.textContent = typeNames[type] || type;

    const m = getCurrentMessage(type);
    container.innerHTML = '';

    // Content (plain message above embed)
    if (type === 'welcome' || type === 'giveaway') {
      container.appendChild(makeField('Content (plain text)', 'content', m.content, 'textarea',
        'Message text shown above the embed...'));
    }

    // Color row + Title row
    const row1 = document.createElement('div');
    row1.className = 'msg-field-row';
    row1.appendChild(makeFieldEl('Embed Color', 'color', m.color, 'color-input'));
    row1.appendChild(makeFieldEl('Title', 'title', m.title, 'input', 'Embed title...'));
    container.appendChild(row1);

    container.appendChild(makeField('Description', 'description', m.description, 'textarea',
      'Embed description... supports **bold**, *italic*, `code`'));

    container.appendChild(makeField('Footer Text', 'footer', m.footer, 'input',
      'Small text at bottom of embed...'));

    // Fields
    const fieldsSection = document.createElement('div');
    fieldsSection.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <label class="form-label" style="margin:0;">Embed Fields</label>
        <button class="btn btn-ghost btn-sm" id="addFieldBtn">+ Add Field</button>
      </div>
      <div id="fieldsList"></div>
    `;
    container.appendChild(fieldsSection);

    renderFieldsList(m, type);

    fieldsSection.querySelector('#addFieldBtn').addEventListener('click', () => {
      if (!m.fields) m.fields = [];
      m.fields.push({ name: 'Field Name', value: 'Field value here...' });
      AppState.markDirty();
      renderFieldsList(m, type);
      renderPreview(type);
    });

    // Bind all inputs
    container.querySelectorAll('[data-field]').forEach(el => {
      const event = el.tagName === 'TEXTAREA' || el.type === 'text' ? 'input' : 'change';
      el.addEventListener(event, () => {
        m[el.dataset.field] = el.value;
        AppState.project.messages[type] = m;
        AppState.markDirty();
        renderPreview(type);
        LivePreview.update();
      });
    });
  }

  function renderFieldsList(m, type) {
    const list = document.getElementById('fieldsList');
    if (!list) return;
    list.innerHTML = '';
    if (!m.fields || m.fields.length === 0) {
      list.innerHTML = '<div style="font-size:12px;color:var(--text-4);padding:8px 0;">No fields added yet.</div>';
      return;
    }
    m.fields.forEach((field, idx) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:flex-start;';
      row.innerHTML = `
        <div style="flex:1;">
          <input type="text" class="form-input" style="margin-bottom:4px;" placeholder="Field name" value="${escapeHtml(field.name)}" data-field-idx="${idx}" data-field-part="name">
          <textarea class="form-textarea" style="min-height:54px;" placeholder="Field value" data-field-idx="${idx}" data-field-part="value">${escapeHtml(field.value)}</textarea>
        </div>
        <button class="icon-btn danger" data-del-idx="${idx}" style="margin-top:2px;" title="Remove field">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      `;

      row.querySelectorAll('[data-field-part]').forEach(el => {
        const event = el.tagName === 'TEXTAREA' ? 'input' : 'input';
        el.addEventListener(event, () => {
          const i = parseInt(el.dataset.fieldIdx);
          m.fields[i][el.dataset.fieldPart] = el.value;
          AppState.project.messages[type] = m;
          AppState.markDirty();
          renderPreview(type);
          LivePreview.update();
        });
      });

      row.querySelector('[data-del-idx]').addEventListener('click', () => {
        m.fields.splice(idx, 1);
        AppState.project.messages[type] = m;
        AppState.markDirty();
        renderFieldsList(m, type);
        renderPreview(type);
      });

      list.appendChild(row);
    });
  }

  function makeField(label, fieldKey, value, inputType, placeholder = '') {
    const wrap = document.createElement('div');
    wrap.className = 'form-group';
    if (inputType === 'textarea') {
      wrap.innerHTML = `<label class="form-label">${label}</label><textarea class="form-textarea" data-field="${fieldKey}" placeholder="${placeholder}">${escapeHtml(value || '')}</textarea>`;
    } else {
      wrap.innerHTML = `<label class="form-label">${label}</label><input type="text" class="form-input" data-field="${fieldKey}" value="${escapeHtml(value || '')}" placeholder="${placeholder}">`;
    }
    return wrap;
  }

  function makeFieldEl(label, fieldKey, value, inputType, placeholder = '') {
    const wrap = document.createElement('div');
    wrap.className = 'form-group';
    wrap.style.marginBottom = '0';
    if (inputType === 'color-input') {
      wrap.innerHTML = `
        <label class="form-label">${label}</label>
        <div style="display:flex;align-items:center;gap:8px;">
          <input type="color" class="color-picker-input" data-field="${fieldKey}" value="${value || '#5865f2'}" style="width:36px;height:36px;">
          <span style="font-size:12px;color:var(--text-3);font-family:monospace;" id="msgColorHex">${value || '#5865f2'}</span>
        </div>
      `;
      const picker = wrap.querySelector('input[type=color]');
      const hex = wrap.querySelector('#msgColorHex');
      picker.addEventListener('input', () => {
        hex.textContent = picker.value;
      });
    } else {
      wrap.innerHTML = `<label class="form-label">${label}</label><input type="text" class="form-input" data-field="${fieldKey}" value="${escapeHtml(value || '')}" placeholder="${placeholder}">`;
    }
    return wrap;
  }

  function renderPreview(type) {
    const container = document.getElementById('discordMsgPreview');
    if (!container) return;
    const m = getCurrentMessage(type);
    container.innerHTML = buildEmbedHTML(m);

    // Update right-side preview too
    const previewSection = document.getElementById('previewMsgSection');
    const previewContent = document.getElementById('previewMsgContent');
    if (previewSection && previewContent) {
      previewSection.style.display = 'block';
      previewContent.innerHTML = buildEmbedHTMLCompact(m);
    }
  }

  function buildEmbedHTML(m) {
    if (!m) return '<div style="color:var(--text-4);font-size:12px;padding:8px;">No message data</div>';
    const fields = (m.fields || []).map(f => `
      <div class="discord-embed-field">
        <div class="discord-field-name">${escapeHtml(f.name)}</div>
        <div class="discord-field-value">${markdownLite(escapeHtml(f.value))}</div>
      </div>`).join('');

    return `
      ${m.content ? `<div class="discord-msg-text">${markdownLite(escapeHtml(m.content))}</div>` : ''}
      <div class="discord-embed" style="border-left-color:${m.color || '#5865f2'}">
        ${m.title ? `<div class="discord-embed-title">${escapeHtml(m.title)}</div>` : ''}
        ${m.description ? `<div class="discord-embed-description">${markdownLite(escapeHtml(m.description))}</div>` : ''}
        ${fields ? `<div class="discord-embed-fields">${fields}</div>` : ''}
        ${m.footer ? `<div class="discord-embed-footer">${escapeHtml(m.footer)}</div>` : ''}
      </div>
    `;
  }

  function buildEmbedHTMLCompact(m) {
    if (!m) return '';
    return `
      <div class="discord-embed" style="border-left-color:${m.color || '#5865f2'};font-size:11px;padding:8px 10px;">
        ${m.title ? `<div class="discord-embed-title" style="font-size:12px;">${escapeHtml(m.title)}</div>` : ''}
        ${m.description ? `<div class="discord-embed-description" style="font-size:11px;margin-top:4px;">${markdownLite(escapeHtml(m.description)).slice(0, 120)}${m.description.length > 120 ? '…' : ''}</div>` : ''}
      </div>
    `;
  }

  function getCurrentMessage(type) {
    if (!AppState.project.messages[type]) {
      AppState.project.messages[type] = JSON.parse(JSON.stringify(DEFAULTS[type] || {
        content: '', color: '#5865f2', title: '', description: '', footer: '', fields: []
      }));
    }
    return AppState.project.messages[type];
  }

  // Basic markdown-lite renderer for preview
  function markdownLite(str) {
    return str
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,0.08);padding:1px 4px;border-radius:3px;font-size:0.9em;">$1</code>')
      .replace(/\n/g, '<br>');
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Event Bindings ────────────────────
  document.querySelectorAll('.msg-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentType = btn.dataset.type;
      renderTypeButtons();
      renderFields(currentType);
      renderPreview(currentType);
    });
  });

  document.getElementById('btnResetMsg')?.addEventListener('click', () => {
    AppState.project.messages[currentType] = JSON.parse(JSON.stringify(DEFAULTS[currentType] || {}));
    AppState.markDirty();
    renderFields(currentType);
    renderPreview(currentType);
    showNotif('Message reset to default', 'info');
  });

  document.getElementById('btnCopyMsg')?.addEventListener('click', () => {
    const m = getCurrentMessage(currentType);
    let text = '';
    if (m.content) text += m.content + '\n\n';
    if (m.title) text += `**${m.title}**\n`;
    if (m.description) text += m.description + '\n';
    if (m.footer) text += `\n_${m.footer}_`;
    navigator.clipboard.writeText(text).then(() => showNotif('Message copied to clipboard!', 'success'));
  });

  document.getElementById('btnExportMsg')?.addEventListener('click', async () => {
    const m = getCurrentMessage(currentType);
    let txt = `[ ${currentType.toUpperCase()} MESSAGE ]\n${'─'.repeat(30)}\n`;
    if (m.content) txt += `${m.content}\n\n`;
    if (m.title) txt += `Title: ${m.title}\n`;
    if (m.description) txt += `Description:\n${m.description}\n`;
    if (m.footer) txt += `Footer: ${m.footer}\n`;
    if (m.fields?.length) {
      txt += `Fields:\n`;
      m.fields.forEach(f => txt += `  • ${f.name}: ${f.value}\n`);
    }
    const result = await window.electronAPI.exportTXT(txt, `${currentType}-message.txt`);
    if (result.success) showNotif('Message exported!', 'success');
  });

  return { render, getCurrentType: () => currentType, buildEmbedHTMLCompact };
})();
