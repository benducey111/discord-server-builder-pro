/* ════════════════════════════════════════
   PLAN MANAGER  — v1
   Handles: account state, plan definitions, feature gating, upgrade modal
════════════════════════════════════════ */

const PlanManager = (() => {

  // ══════════════════════════════════════════════════════════════
  //  PLAN DEFINITIONS
  //  To change names, prices or feature lists → edit PLANS below.
  // ══════════════════════════════════════════════════════════════
  const PLANS = {
    basic: {
      id:          'basic',
      name:        'Basic',
      price:       0,
      priceLabel:  'Free',
      priceSub:    'forever',
      color:       '#8b949e',
      badge:       'FREE',
      badgeBg:     'rgba(139,148,158,0.12)',
      description: 'Everything you need to get started',
      deployLimit: 2,
      features: [
        'Visual server builder',
        'Structure, Roles & Embed Generator',
        '4 built-in templates',
        'Local save & load projects',
        'Export full project JSON',
      ],
      missing: [
        'Discord Bot Deployment',
        'Custom template import/export',
        'All 8 templates',
        'Webhook Sender',
      ]
    },

    developer: {
      id:          'developer',
      name:        'Developer',
      price:       5,
      priceLabel:  '$5',
      priceSub:    'per month',
      color:       '#5865f2',
      badge:       'DEV',
      badgeBg:     'rgba(88,101,242,0.12)',
      description: 'For power users & server developers',
      popular:     true,
      deployLimit: 10,
      features: [
        'Everything in Basic',
        'All 8 built-in templates',
        'Custom template import/export',
        'Discord Bot Deployment',
        'Export Messages JSON & TXT',
        'Advanced builder tools',
      ],
      missing: [
        'Webhook Sender',
        'Premium themes',
      ]
    },

    professional: {
      id:          'professional',
      name:        'Professional',
      price:       15,
      priceLabel:  '$15',
      priceSub:    'per month',
      color:       '#f0b232',
      badge:       'PRO',
      badgeBg:     'rgba(240,178,50,0.12)',
      description: 'Full power — zero limits',
      deployLimit: 999999,
      features: [
        'Everything in Developer',
        'Webhook Sender',
        'Premium themes',
        'Priority feature updates',
        'All future premium features',
      ],
      missing: []
    }
  };

  // ══════════════════════════════════════════════════════════════
  //  FEATURE GATES
  //  To change which plan a feature requires → edit this object.
  //
  //  Keys   = feature IDs used with PlanManager.can('feature_id')
  //  Values = minimum plan: 'basic' | 'developer' | 'professional'
  // ══════════════════════════════════════════════════════════════
  const FEATURE_GATES = {
    // ── Basic (free) ──────────────────────────
    'builder':               'basic',
    'save_load':             'basic',
    'export_json_full':      'basic',
    'templates_basic':       'basic',    // first 4 built-in templates

    // ── Developer ─────────────────────────────
    'templates_all':         'developer',
    'templates_custom':      'developer',
    'deploy':                'developer',
    'export_messages_json':  'developer',
    'export_messages_txt':   'developer',

    // ── Professional ──────────────────────────
    'webhook_sender':        'professional',
    'premium_themes':        'professional',
  };

  // Human-readable labels for feature keys (shown in upgrade modal)
  const FEATURE_LABELS = {
    'deploy':               'Discord Bot Deployment',
    'templates_all':        'All Built-in Templates',
    'templates_custom':     'Custom Template Import/Export',
    'export_messages_json': 'Messages JSON Export',
    'export_messages_txt':  'Messages TXT Export',
    'webhook_sender':       'Webhook Sender',
    'premium_themes':       'Premium Themes',
  };

  const PLAN_ORDER  = ['basic', 'developer', 'professional'];
  const ACCOUNT_KEY = 'dsbp_account';

  // ── Backend API helpers ────────────────
  function _apiBase() {
    return (typeof window !== 'undefined' && window.BACKEND_URL)
      ? window.BACKEND_URL
      : 'http://localhost:3001';
  }

  // Silently sync the plan from the backend and update local storage.
  // Called on init — non-blocking, fails gracefully if offline.
  async function _syncPlanFromBackend() {
    const acc = getAccount();
    if (!acc || !acc.email || acc.mode === 'guest') return;

    try {
      const res = await fetch(`${_apiBase()}/user/${encodeURIComponent(acc.email)}/plan`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.plan && data.plan !== acc.plan) {
        acc.plan = data.plan;
        saveAccount(acc);
        refreshUI();
      }
    } catch { /* offline or server not running — use local plan */ }
  }

  // Open Stripe Checkout in the system browser, then poll for plan change.
  async function _openStripeCheckout(planId) {
    const acc = getAccount();

    // Must be a registered user (not a guest) to pay
    if (!acc || !acc.email || acc.mode === 'guest') {
      if (typeof showNotif === 'function') {
        showNotif('Please create an account to upgrade your plan.', 'info', 4000);
      }
      setTimeout(() => { window.location.href = 'landing.html'; }, 1600);
      return;
    }

    try {
      const res = await fetch(`${_apiBase()}/checkout/create`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: acc.email, plan: planId }),
      });
      const data = await res.json();

      if (data.url) {
        window.electronAPI?.openExternal(data.url);
        if (typeof showNotif === 'function') {
          showNotif('💳 Payment page opened in your browser. Return here after completing payment.', 'info', 10000);
        }
        _pollForPlanUpgrade(acc.email);
      } else {
        throw new Error(data.error || 'No checkout URL returned');
      }
    } catch (err) {
      if (typeof showNotif === 'function') {
        showNotif('Could not open payment page. Check your internet connection.', 'error', 5000);
      }
    }
  }

  // Poll the backend every 3 seconds (up to 5 min) until the plan changes.
  function _pollForPlanUpgrade(email, attempts = 0) {
    const MAX = 100; // 100 × 3s = 5 minutes
    if (attempts >= MAX) return;

    setTimeout(async () => {
      try {
        const res = await fetch(`${_apiBase()}/user/${encodeURIComponent(email)}/plan`);
        if (!res.ok) { _pollForPlanUpgrade(email, attempts + 1); return; }
        const data = await res.json();
        const currentPlan = getAccount()?.plan || 'basic';

        if (data.plan && data.plan !== currentPlan) {
          // Plan upgraded — update locally and refresh UI
          const acc = getAccount() || {};
          acc.plan = data.plan;
          saveAccount(acc);
          refreshUI();
          document.getElementById('planSelectorBackdrop')?.remove();
          document.getElementById('planUpgradeModalBackdrop')?.remove();
          if (typeof showNotif === 'function') {
            const p = PLANS[data.plan];
            showNotif(`🎉 Upgraded to ${p?.name || data.plan}! Your new features are unlocked.`, 'success', 6000);
          }
        } else {
          _pollForPlanUpgrade(email, attempts + 1);
        }
      } catch { _pollForPlanUpgrade(email, attempts + 1); }
    }, 3000);
  }

  // ── Internal account state ─────────────
  let _account = null;

  // ── Account management ─────────────────
  function loadAccount() {
    try {
      const raw = localStorage.getItem(ACCOUNT_KEY);
      _account = raw ? JSON.parse(raw) : null;
    } catch { _account = null; }
    return _account;
  }

  function saveAccount(acc) {
    _account = acc;
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(acc));
  }

  function clearAccount() {
    _account = null;
    localStorage.removeItem(ACCOUNT_KEY);
  }

  function getAccount()  { return _account; }
  function getPlan()     { return _account?.plan || 'basic'; }
  function isGuest()     { return !_account || _account.mode === 'guest'; }
  function getUsername() { return _account?.username || 'Guest'; }

  // ── Feature access ─────────────────────
  function planLevel(planId) {
    const idx = PLAN_ORDER.indexOf(planId);
    return idx >= 0 ? idx : 0;
  }

  function can(featureKey) {
    const required = FEATURE_GATES[featureKey] || 'basic';
    return planLevel(getPlan()) >= planLevel(required);
  }

  // Call onAllowed() if the plan allows it; otherwise show upgrade modal.
  // Returns true if allowed, false if blocked.
  function requirePlan(featureKey, onAllowed) {
    if (can(featureKey)) {
      if (typeof onAllowed === 'function') onAllowed();
      return true;
    }
    const required = FEATURE_GATES[featureKey] || 'developer';
    _showUpgradeModal(required, featureKey);
    return false;
  }

  // ── Upgrade Modal ──────────────────────
  function _showUpgradeModal(requiredPlanId, featureKey) {
    // Remove any existing upgrade modal first
    document.getElementById('planUpgradeModalBackdrop')?.remove();

    const plan        = PLANS[requiredPlanId] || PLANS.developer;
    const featureLabel = FEATURE_LABELS[featureKey] || 'This feature';

    const backdrop = document.createElement('div');
    backdrop.id        = 'planUpgradeModalBackdrop';
    backdrop.className = 'modal-backdrop open';
    backdrop.innerHTML = `
      <div class="modal upgrade-modal" id="planUpgradeModal">
        <div class="modal-header">
          <h2 class="modal-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="stroke:#f0b232;margin-right:6px;flex-shrink:0;">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Upgrade Required
          </h2>
          <button class="modal-close" id="upgradeModalClose">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="upgrade-feature-row">
            <div class="upgrade-lock-bubble" style="background:${plan.badgeBg};border-color:${plan.color}40;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${plan.color}" stroke-width="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <div class="upgrade-feature-name">${featureLabel}</div>
              <div class="upgrade-feature-desc">
                Requires the <span class="upgrade-plan-chip" style="color:${plan.color};background:${plan.badgeBg};border-color:${plan.color}40;">${plan.name}</span> plan or higher.
              </div>
            </div>
          </div>

          <div class="upgrade-plan-preview" style="--upg-color:${plan.color};--upg-bg:${plan.badgeBg};">
            <div class="upgrade-plan-preview-header">
              <span class="upgrade-plan-preview-name">${plan.name}</span>
              <span class="upgrade-plan-preview-price" style="color:${plan.color};">${plan.priceLabel}<span style="font-size:11px;opacity:0.7;">/${plan.priceSub === 'forever' ? 'free' : 'mo'}</span></span>
            </div>
            <ul class="upgrade-plan-features-list">
              ${plan.features.map(f => `<li><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="${plan.color}" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>${f}</li>`).join('')}
            </ul>
          </div>

          <div class="upgrade-actions">
            <button class="btn btn-ghost" id="upgradeModalCancel">Maybe Later</button>
            <button class="btn upgrade-btn-cta" id="upgradeModalAction"
              style="background:linear-gradient(135deg,${plan.color},${plan.color}bb);box-shadow:0 0 20px ${plan.color}33;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Upgrade to ${plan.name}
            </button>
          </div>
          <div class="upgrade-demo-note">💳 Secure payment via Stripe — opens in your browser</div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const close = () => backdrop.remove();
    backdrop.querySelector('#upgradeModalClose')?.addEventListener('click', close);
    backdrop.querySelector('#upgradeModalCancel')?.addEventListener('click', close);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });

    backdrop.querySelector('#upgradeModalAction')?.addEventListener('click', () => {
      close();
      _openStripeCheckout(requiredPlanId);
    });
  }

  // ── Plan Selector Modal ────────────────
  // Open a "pick your plan" dialog (e.g. from sidebar Upgrade button)
  function showPlanSelector() {
    document.getElementById('planSelectorBackdrop')?.remove();

    const backdrop = document.createElement('div');
    backdrop.id        = 'planSelectorBackdrop';
    backdrop.className = 'modal-backdrop open';

    const plansHTML = PLAN_ORDER.map(planId => {
      const p       = PLANS[planId];
      const current = getPlan() === planId;
      return `
        <div class="plan-selector-card ${current ? 'current' : ''} ${p.popular ? 'popular' : ''}"
             style="--ps-color:${p.color};--ps-bg:${p.badgeBg};"
             data-plan="${planId}">
          ${p.popular ? `<div class="plan-selector-popular">Most Popular</div>` : ''}
          ${current   ? `<div class="plan-selector-current-tag">Current Plan</div>` : ''}
          <div class="plan-selector-name">${p.name}</div>
          <div class="plan-selector-price" style="color:${p.color};">
            ${p.priceLabel}${p.price > 0 ? `<span>/mo</span>` : ''}
          </div>
          <div class="plan-selector-desc">${p.description}</div>
          <ul class="plan-selector-features">
            ${p.features.map(f => `<li><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="${p.color}" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>${f}</li>`).join('')}
          </ul>
          <button class="btn plan-selector-btn ${current ? 'btn-ghost' : 'btn-primary'}"
                  style="${current ? '' : `background:linear-gradient(135deg,${p.color},${p.color}bb);border:none;box-shadow:0 0 14px ${p.color}33;`}"
                  data-select="${planId}" ${current ? 'disabled' : ''}>
            ${current ? '✓ Current Plan' : p.price === 0 ? 'Select Free Plan' : `Upgrade to ${p.name}`}
          </button>
        </div>
      `;
    }).join('');

    backdrop.innerHTML = `
      <div class="modal modal-xl" id="planSelectorModal">
        <div class="modal-header">
          <h2 class="modal-title">Choose Your Plan</h2>
          <button class="modal-close" id="planSelectorClose">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="plan-selector-grid">${plansHTML}</div>
          <div class="plan-selector-note">💳 Clicking an upgrade plan opens a secure Stripe payment page in your browser.</div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const close = () => backdrop.remove();
    backdrop.querySelector('#planSelectorClose')?.addEventListener('click', close);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });

    backdrop.querySelectorAll('[data-select]').forEach(btn => {
      btn.addEventListener('click', () => {
        const newPlan = btn.dataset.select;
        if (newPlan === 'basic') {
          // Downgrade to basic — just apply locally
          const acc = getAccount() || { mode: 'guest', username: 'Guest' };
          acc.plan = 'basic';
          saveAccount(acc);
          close();
          refreshUI();
          if (typeof showNotif === 'function') showNotif('Plan set to Basic (Free)', 'success', 3000);
        } else {
          close();
          _openStripeCheckout(newPlan);
        }
      });
    });
  }

  // ── Deploy Limit Check (Feature 2) ────────────────────────────────────────
  async function checkDeployLimit(onAllowed) {
    const acc = getAccount();
    if (!acc || !acc.email || acc.mode === 'guest') {
      // No account / offline — don't block guests
      if (typeof onAllowed === 'function') onAllowed();
      return;
    }

    try {
      const res = await fetch(`${_apiBase()}/user/${encodeURIComponent(acc.email)}/deploy-count`);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();

      if (data.can_deploy === false) {
        const plan = PLANS[getPlan()] || PLANS.basic;
        // Show upgrade modal with deploy-limit message
        document.getElementById('deployLimitModalBackdrop')?.remove();

        const backdrop = document.createElement('div');
        backdrop.id        = 'deployLimitModalBackdrop';
        backdrop.className = 'modal-backdrop open';
        backdrop.innerHTML = `
          <div class="modal upgrade-modal" style="max-width:420px;">
            <div class="modal-header">
              <h2 class="modal-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f0b232" stroke-width="2.5" style="margin-right:6px;flex-shrink:0;">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Deploy Limit Reached
              </h2>
              <button class="modal-close" id="deployLimitClose">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="modal-body">
              <p style="color:var(--text-2);margin-bottom:16px;">
                You've used all <strong>${plan.deployLimit}</strong> free deployments.
                Upgrade to Developer for 10 deploys/month.
              </p>
              <div class="upgrade-actions">
                <button class="btn btn-ghost" id="deployLimitCancel">Maybe Later</button>
                <button class="btn upgrade-btn-cta" id="deployLimitUpgrade"
                  style="background:linear-gradient(135deg,#5865f2,#4752c4);box-shadow:0 0 20px rgba(88,101,242,0.3);">
                  Upgrade to Developer
                </button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(backdrop);
        const close = () => backdrop.remove();
        backdrop.querySelector('#deployLimitClose')?.addEventListener('click', close);
        backdrop.querySelector('#deployLimitCancel')?.addEventListener('click', close);
        backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
        backdrop.querySelector('#deployLimitUpgrade')?.addEventListener('click', () => {
          close();
          _openStripeCheckout('developer');
        });
      } else {
        // Allowed — run callback then increment
        if (typeof onAllowed === 'function') onAllowed();
        fetch(`${_apiBase()}/user/${encodeURIComponent(acc.email)}/increment-deploy`, { method: 'POST' })
          .catch(() => { /* ignore offline errors */ });
      }
    } catch {
      // Network error — don't block
      if (typeof onAllowed === 'function') onAllowed();
    }
  }

  // ── Account Page Modal (Feature 1) ────────────────────────────────────────
  async function showAccountPage() {
    document.getElementById('accountPageBackdrop')?.remove();

    const acc  = getAccount();
    const plan = PLANS[getPlan()] || PLANS.basic;

    // Fetch deploy count
    let deployUsed  = '—';
    let deployLimit = plan.deployLimit || '—';
    if (acc && acc.email && acc.mode !== 'guest') {
      try {
        const res = await fetch(`${_apiBase()}/user/${encodeURIComponent(acc.email)}/deploy-count`);
        if (res.ok) {
          const d  = await res.json();
          deployUsed  = d.count ?? d.used ?? '—';
          deployLimit = d.limit ?? plan.deployLimit ?? '—';
        }
      } catch { /* offline */ }
    }

    const initial  = (acc?.username || 'G').charAt(0).toUpperCase();
    const username = acc?.username || 'Guest';
    const email    = acc?.email    || '—';

    const backdrop = document.createElement('div');
    backdrop.id        = 'accountPageBackdrop';
    backdrop.className = 'modal-backdrop open';
    backdrop.innerHTML = `
      <div class="modal" id="accountPageModal" style="max-width:400px;">
        <div class="modal-header">
          <h2 class="modal-title">Account</h2>
          <button class="modal-close" id="accountPageClose">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:20px;">

          <!-- Avatar + info -->
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,${plan.color},${plan.color}99);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;flex-shrink:0;">
              ${initial}
            </div>
            <div>
              <div style="font-size:15px;font-weight:600;color:var(--text-1);">${username}</div>
              <div style="font-size:12px;color:var(--text-3);margin-top:2px;">${email}</div>
              <div style="margin-top:6px;">
                <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;background:${plan.badgeBg};color:${plan.color};border:1px solid ${plan.color}40;">
                  ${plan.badge} · ${plan.name}
                </span>
              </div>
            </div>
          </div>

          <!-- Deploy count -->
          <div style="background:var(--bg-3);border:1px solid var(--border-light);border-radius:var(--radius-md);padding:14px 16px;">
            <div style="font-size:11px;color:var(--text-4);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">Deployments This Month</div>
            <div style="font-size:20px;font-weight:700;color:var(--text-1);">${deployUsed} <span style="font-size:13px;color:var(--text-3);font-weight:400;">/ ${deployLimit} deploys used</span></div>
          </div>

          <!-- Actions -->
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${getPlan() !== 'basic' ? `
            <button class="btn btn-danger btn-sm" id="accountCancelSub" style="justify-content:center;">
              Cancel Subscription
            </button>
            ` : ''}
            <button class="btn btn-primary btn-sm" id="accountChangePlan" style="justify-content:center;">
              Change Plan
            </button>
            <button class="btn btn-ghost btn-sm" id="accountSignOut" style="justify-content:center;">
              Sign Out
            </button>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const close = () => backdrop.remove();
    backdrop.querySelector('#accountPageClose')?.addEventListener('click', close);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });

    backdrop.querySelector('#accountChangePlan')?.addEventListener('click', () => {
      close();
      showPlanSelector();
    });

    backdrop.querySelector('#accountSignOut')?.addEventListener('click', () => {
      close();
      clearAccount();
      window.location.href = 'landing.html';
    });

    backdrop.querySelector('#accountCancelSub')?.addEventListener('click', async () => {
      const btn = backdrop.querySelector('#accountCancelSub');
      btn.disabled = true;
      btn.textContent = 'Cancelling…';
      try {
        await fetch(`${_apiBase()}/subscription/cancel`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email: acc.email }),
        });
        const updatedAcc = getAccount() || {};
        updatedAcc.plan = 'basic';
        saveAccount(updatedAcc);
        refreshUI();
        close();
        if (typeof showNotif === 'function') showNotif('Subscription cancelled. You are now on the Basic plan.', 'info', 5000);
      } catch {
        btn.disabled = false;
        btn.textContent = 'Cancel Subscription';
        if (typeof showNotif === 'function') showNotif('Could not cancel subscription. Try again later.', 'error', 4000);
      }
    });
  }

  // ── Onboarding Modal (Feature 6) ──────────────────────────────────────────
  function showOnboarding() {
    document.getElementById('onboardingBackdrop')?.remove();

    const steps = [
      {
        icon: '📋',
        title: 'Start with a Template',
        text: 'Head to the Templates tab to choose from 20 pre-built server layouts. Pick one that matches your server\'s purpose and customize it from there.',
      },
      {
        icon: '🛠',
        title: 'Design Your Structure',
        text: 'Use the Server Structure tab to add categories and channels. Organize your server exactly how you want it before touching Discord.',
      },
      {
        icon: '🎭',
        title: 'Set Up Roles',
        text: 'Create roles with custom colors and permissions in the Roles tab. Define who can see and do what in your server.',
      },
      {
        icon: '🚀',
        title: 'Deploy to Discord',
        text: 'When you\'re ready, go to the Deploy tab (Developer plan+), connect your bot token, and push everything to Discord with one click.',
      },
    ];

    let currentStep = 0;

    function buildModal() {
      const s = steps[currentStep];
      const isLast = currentStep === steps.length - 1;

      const dotsHTML = steps.map((_, i) => `
        <span class="onb-dot ${i === currentStep ? 'active' : ''}" data-step="${i}"
          style="display:inline-block;width:${i === currentStep ? 24 : 8}px;height:8px;border-radius:4px;background:${i === currentStep ? '#5865f2' : 'rgba(255,255,255,0.15)'};cursor:pointer;transition:all 0.25s;margin:0 3px;">
        </span>
      `).join('');

      return `
        <div class="modal" id="onboardingModal" style="max-width:480px;">
          <div class="modal-header" style="border-bottom:none;padding-bottom:0;">
            <h2 class="modal-title" style="font-size:16px;">👋 Welcome to Discord Server Builder Pro!</h2>
            <button class="modal-close" id="onboardingClose">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body" style="display:flex;flex-direction:column;align-items:center;gap:20px;padding-top:12px;">

            <!-- Step dots -->
            <div style="display:flex;align-items:center;">${dotsHTML}</div>

            <!-- Step content -->
            <div style="text-align:center;padding:0 8px;">
              <div style="font-size:40px;margin-bottom:12px;">${s.icon}</div>
              <div style="font-size:15px;font-weight:600;color:var(--text-1);margin-bottom:10px;">${s.title}</div>
              <div style="font-size:13px;color:var(--text-3);line-height:1.6;">${s.text}</div>
            </div>

            <!-- Navigation -->
            <div style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:8px;">
              <button class="btn btn-ghost btn-sm" id="onbBack" ${currentStep === 0 ? 'style="visibility:hidden;"' : ''}>← Back</button>
              ${isLast
                ? `<button class="btn btn-primary btn-sm" id="onbNext" style="flex:1;justify-content:center;">Get Started</button>`
                : `<button class="btn btn-primary btn-sm" id="onbNext" style="flex:1;justify-content:center;">Next →</button>`
              }
            </div>

            <!-- Revisit note -->
            <div style="font-size:11px;color:var(--text-4);">You can revisit this guide from the Dashboard tab</div>
          </div>
        </div>
      `;
    }

    const backdrop = document.createElement('div');
    backdrop.id        = 'onboardingBackdrop';
    backdrop.className = 'modal-backdrop open';
    backdrop.innerHTML = buildModal();
    document.body.appendChild(backdrop);

    function rebind() {
      backdrop.querySelector('#onboardingClose')?.addEventListener('click', () => backdrop.remove());

      backdrop.querySelectorAll('.onb-dot').forEach(dot => {
        dot.addEventListener('click', () => {
          currentStep = parseInt(dot.dataset.step, 10);
          backdrop.querySelector('#onboardingModal').outerHTML; // no-op keep ref
          backdrop.innerHTML = buildModal();
          rebind();
        });
      });

      backdrop.querySelector('#onbBack')?.addEventListener('click', () => {
        if (currentStep > 0) {
          currentStep--;
          backdrop.innerHTML = buildModal();
          rebind();
        }
      });

      backdrop.querySelector('#onbNext')?.addEventListener('click', () => {
        if (currentStep < steps.length - 1) {
          currentStep++;
          backdrop.innerHTML = buildModal();
          rebind();
        } else {
          // Last step — mark onboarded and close
          localStorage.setItem('dsbp_onboarded', '1');
          backdrop.remove();
        }
      });
    }
    rebind();
  }

  function _checkOnboarding() {
    if (!localStorage.getItem('dsbp_onboarded')) {
      setTimeout(() => showOnboarding(), 800);
    }
  }

  // ── UI Refresh ─────────────────────────
  // Call after any plan/account change to update all plan-related UI in index.html
  function refreshUI() {
    const plan    = PLANS[getPlan()] || PLANS.basic;
    const account = getAccount();

    // Sidebar plan badge
    const badge = document.getElementById('planBadge');
    if (badge) {
      badge.style.setProperty('--plan-color', plan.color);
      badge.style.setProperty('--plan-bg',    plan.badgeBg);
      badge.querySelector('#planBadgeName')?.  replaceChildren?.();
      const nameEl  = badge.querySelector('#planBadgeName');
      const priceEl = badge.querySelector('#planBadgePrice');
      if (nameEl)  nameEl.textContent  = plan.name;
      if (priceEl) priceEl.textContent = plan.priceLabel;
    }

    // Sidebar account info
    const userNameEl = document.getElementById('planUserName');
    const userModeEl = document.getElementById('planUserMode');
    if (userNameEl) userNameEl.textContent = account?.username || 'Guest';
    if (userModeEl) userModeEl.textContent = isGuest() ? 'Guest mode' : account?.email || 'Local account';

    // Deploy nav lock
    const deployNav = document.querySelector('.nav-item[data-tab="deploy"]');
    if (deployNav) {
      deployNav.querySelector('.nav-lock-icon')?.remove();
      if (!can('deploy')) {
        const lock = document.createElement('span');
        lock.className = 'nav-lock-icon';
        lock.title = 'Requires Developer plan';
        lock.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
        deployNav.appendChild(lock);
      }
    }

    // Re-render templates if that tab is active
    if (typeof TemplatesModule !== 'undefined' && typeof AppState !== 'undefined' && AppState.currentTab === 'templates') {
      TemplatesModule.render();
    }

    // Account info bar click → open account page
    const infoBar = document.getElementById('accountInfoBar');
    if (infoBar && !infoBar.dataset.pmBound) {
      infoBar.dataset.pmBound = '1';
      infoBar.style.cursor = 'pointer';
      infoBar.addEventListener('click', () => showAccountPage());
    }
  }

  // ── Init ───────────────────────────────
  function init() {
    loadAccount();
    refreshUI();
    // Silently sync plan from backend (updates if they paid since last launch)
    _syncPlanFromBackend();
    // Show onboarding for first-time users
    _checkOnboarding();
  }

  // ── Public API ──────────────────────────
  return {
    init,
    loadAccount,
    saveAccount,
    clearAccount,
    getAccount,
    getPlan,
    isGuest,
    getUsername,
    can,
    requirePlan,
    showPlanSelector,
    showAccountPage,
    checkDeployLimit,
    showOnboarding,
    refreshUI,
    PLANS,
    FEATURE_GATES,
    PLAN_ORDER,
  };
})();
