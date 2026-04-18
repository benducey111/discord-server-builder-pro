/* ════════════════════════════════════════════════════
   Discord Server Builder Pro — Backend API
   ════════════════════════════════════════════════════ */

require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const bcrypt    = require('bcryptjs');
const stripe    = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Supabase client ──────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Stripe price IDs ─────────────────────────────────
const PRICE_IDS = {
  developer:    process.env.STRIPE_PRICE_DEVELOPER,
  professional: process.env.STRIPE_PRICE_PROFESSIONAL,
};

// ── Middleware ───────────────────────────────────────
// Stripe webhooks need the raw body — must be BEFORE express.json()
app.use('/webhook', express.raw({ type: 'application/json' }));

app.use(cors());
app.use(express.json());


// ════════════════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════════════════

// POST /auth/register
// Body: { email, password, username, plan }
// Returns: { user: { email, username, plan }, checkoutUrl? }
app.post('/auth/register', async (req, res) => {
  const { email, password, username = 'User', plan = 'basic' } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters.' });
  }

  const normalEmail = email.toLowerCase().trim();

  // Check if email already registered
  const { data: existing } = await supabase
    .from('users')
    .select('email')
    .eq('email', normalEmail)
    .single();

  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Create user in Supabase (always start on basic, plan is upgraded after payment)
  const { data: user, error: insertError } = await supabase
    .from('users')
    .insert({ email: normalEmail, username: username.trim(), password_hash, plan: 'basic' })
    .select('email, username, plan')
    .single();

  if (insertError) {
    console.error('Insert error:', insertError);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }

  // If they chose a paid plan, create a Stripe Checkout session
  if (plan !== 'basic' && PRICE_IDS[plan]) {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: normalEmail,
        line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
        success_url: `${process.env.APP_URL}/success?email=${encodeURIComponent(normalEmail)}`,
        cancel_url:  `${process.env.APP_URL}/cancel`,
        metadata: { email: normalEmail, plan },
      });

      return res.json({
        user: { email: user.email, username: user.username, plan: user.plan },
        checkoutUrl: session.url,
      });
    } catch (stripeErr) {
      console.error('Stripe error:', stripeErr);
      // Account was created — just return without checkout URL
      return res.json({
        user: { email: user.email, username: user.username, plan: user.plan },
        error: 'Account created but payment page could not be opened. Upgrade from within the app.',
      });
    }
  }

  res.json({ user: { email: user.email, username: user.username, plan: user.plan } });
});


// POST /auth/login
// Body: { email, password }
// Returns: { user: { email, username, plan } }
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalEmail = email.toLowerCase().trim();

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', normalEmail)
    .single();

  if (!user) {
    return res.status(401).json({ error: 'No account found with this email.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  res.json({
    user: { email: user.email, username: user.username, plan: user.plan },
  });
});


// ════════════════════════════════════════════════════
//  USER ROUTES
// ════════════════════════════════════════════════════

// GET /user/:email/plan
// Returns: { plan }
app.get('/user/:email/plan', async (req, res) => {
  const normalEmail = decodeURIComponent(req.params.email).toLowerCase().trim();

  const { data: user } = await supabase
    .from('users')
    .select('plan')
    .eq('email', normalEmail)
    .single();

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({ plan: user.plan });
});


// ════════════════════════════════════════════════════
//  CHECKOUT ROUTES
// ════════════════════════════════════════════════════

// POST /checkout/create
// Body: { email, plan }
// Returns: { url }  — the Stripe Checkout URL to open in the browser
app.post('/checkout/create', async (req, res) => {
  const { email, plan } = req.body;

  if (!email || !plan) {
    return res.status(400).json({ error: 'Email and plan are required.' });
  }
  if (!PRICE_IDS[plan]) {
    return res.status(400).json({ error: 'Invalid plan. Must be "developer" or "professional".' });
  }

  const normalEmail = email.toLowerCase().trim();

  // Look up existing Stripe customer ID
  const { data: user } = await supabase
    .from('users')
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('email', normalEmail)
    .single();

  // If they already have an active subscription, cancel it first
  if (user?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(user.stripe_subscription_id);
    } catch (e) { /* ignore — subscription may already be gone */ }
  }

  let customerId = user?.stripe_customer_id;

  // Get or create Stripe customer
  if (!customerId) {
    const customer = await stripe.customers.create({ email: normalEmail });
    customerId = customer.id;
    await supabase.from('users')
      .update({ stripe_customer_id: customerId })
      .eq('email', normalEmail);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      success_url: `${process.env.APP_URL}/success?email=${encodeURIComponent(normalEmail)}`,
      cancel_url:  `${process.env.APP_URL}/cancel`,
      metadata: { email: normalEmail, plan },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'Could not create checkout session.' });
  }
});


// ════════════════════════════════════════════════════
//  STRIPE WEBHOOK
//  Stripe calls this URL automatically after payment
// ════════════════════════════════════════════════════

// POST /webhook
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {

    // Payment completed — upgrade the user's plan
    case 'checkout.session.completed': {
      const session = event.data.object;
      const email   = session.metadata?.email || session.customer_email;
      const plan    = session.metadata?.plan;

      if (email && plan) {
        console.log(`✓ Payment complete — upgrading ${email} to ${plan}`);
        await supabase.from('users')
          .update({
            plan,
            stripe_customer_id:     session.customer,
            stripe_subscription_id: session.subscription,
          })
          .eq('email', email.toLowerCase());
      }
      break;
    }

    // Subscription cancelled or expired — downgrade to basic
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      console.log(`✗ Subscription cancelled — downgrading user`);
      await supabase.from('users')
        .update({ plan: 'basic', stripe_subscription_id: null })
        .eq('stripe_subscription_id', sub.id);
      break;
    }

    // Subscription renewed successfully — keep plan active
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      if (invoice.subscription) {
        const sub = await stripe.subscriptions.retrieve(invoice.subscription);
        const plan = sub.metadata?.plan;
        if (plan) {
          await supabase.from('users')
            .update({ plan })
            .eq('stripe_subscription_id', invoice.subscription);
        }
      }
      break;
    }

    // Payment failed — optionally downgrade (commented out by default)
    case 'invoice.payment_failed': {
      // const invoice = event.data.object;
      // await supabase.from('users')
      //   .update({ plan: 'basic' })
      //   .eq('stripe_subscription_id', invoice.subscription);
      console.log('⚠ Payment failed for subscription:', event.data.object.subscription);
      break;
    }
  }

  res.json({ received: true });
});


// ════════════════════════════════════════════════════
//  SUCCESS / CANCEL PAGES
//  Shown in the browser after Stripe Checkout
// ════════════════════════════════════════════════════

app.get('/success', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Successful — Discord Server Builder Pro</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #08090f; color: #f0f1f6;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; text-align: center; padding: 24px;
    }
    .card {
      background: #0e0f18; border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px; padding: 48px 40px; max-width: 440px; width: 100%;
    }
    .icon { font-size: 56px; margin-bottom: 20px; }
    h1 { font-size: 26px; font-weight: 800; margin-bottom: 10px; letter-spacing: -0.5px; }
    p { color: #8b94ab; line-height: 1.7; margin-bottom: 28px; }
    .highlight { color: #57f287; }
    .note {
      background: rgba(87,242,135,0.06); border: 1px solid rgba(87,242,135,0.15);
      border-radius: 10px; padding: 14px 18px; font-size: 13px;
      color: #57f287; line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🎉</div>
    <h1>Payment <span class="highlight">Successful!</span></h1>
    <p>
      Your plan has been upgraded. Return to the app —
      your new features are unlocked and ready to use.
    </p>
    <div class="note">
      ✓ Switch back to <strong>Discord Server Builder Pro</strong> in your taskbar.
      Your plan will update automatically within a few seconds.
    </div>
  </div>
</body>
</html>`);
});

app.get('/cancel', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Cancelled — Discord Server Builder Pro</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #08090f; color: #f0f1f6;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; text-align: center; padding: 24px;
    }
    .card {
      background: #0e0f18; border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px; padding: 48px 40px; max-width: 440px; width: 100%;
    }
    .icon { font-size: 56px; margin-bottom: 20px; }
    h1 { font-size: 26px; font-weight: 800; margin-bottom: 10px; letter-spacing: -0.5px; }
    p { color: #8b94ab; line-height: 1.7; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">↩</div>
    <h1>Payment Cancelled</h1>
    <p>
      No charge was made. You can upgrade anytime from within
      the app by clicking <strong>Upgrade</strong> in the sidebar.
    </p>
  </div>
</body>
</html>`);
});


// ════════════════════════════════════════════════════
//  PASSWORD RESET ROUTES
// ════════════════════════════════════════════════════

// POST /auth/forgot-password
// Body: { email }
// Returns: { success: true, code: '...' }
app.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const normalEmail = email.toLowerCase().trim();

  const { data: user } = await supabase
    .from('users')
    .select('email')
    .eq('email', normalEmail)
    .single();

  if (!user) {
    return res.status(404).json({ error: 'No account found with that email.' });
  }

  // Generate 6-char alphanumeric reset code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const reset_expires = Date.now() + 15 * 60 * 1000; // 15 minutes from now

  const { error: updateError } = await supabase
    .from('users')
    .update({ reset_code: code, reset_expires })
    .eq('email', normalEmail);

  if (updateError) {
    console.error('Reset code update error:', updateError);
    return res.status(500).json({ error: 'Failed to generate reset code.' });
  }

  console.log('Reset code for', normalEmail, ':', code);

  res.json({ success: true, code });
});


// POST /auth/reset-password
// Body: { email, code, newPassword }
// Returns: { success: true }
app.post('/auth/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, code, and newPassword are required.' });
  }
  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters.' });
  }

  const normalEmail = email.toLowerCase().trim();

  const { data: user } = await supabase
    .from('users')
    .select('reset_code, reset_expires')
    .eq('email', normalEmail)
    .single();

  if (!user) {
    return res.status(404).json({ error: 'No account found with that email.' });
  }

  if (!user.reset_code || user.reset_code !== code.toUpperCase().trim()) {
    return res.status(400).json({ error: 'Invalid reset code.' });
  }

  if (!user.reset_expires || Date.now() > Number(user.reset_expires)) {
    return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
  }

  const password_hash = await bcrypt.hash(newPassword, 10);

  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash, reset_code: null, reset_expires: null })
    .eq('email', normalEmail);

  if (updateError) {
    console.error('Password reset update error:', updateError);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }

  res.json({ success: true });
});


// ════════════════════════════════════════════════════
//  SUBSCRIPTION ROUTES
// ════════════════════════════════════════════════════

// POST /subscription/cancel
// Body: { email }
// Returns: { success: true }
app.post('/subscription/cancel', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const normalEmail = email.toLowerCase().trim();

  const { data: user } = await supabase
    .from('users')
    .select('stripe_subscription_id')
    .eq('email', normalEmail)
    .single();

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (user.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(user.stripe_subscription_id);
    } catch (stripeErr) {
      console.error('Stripe cancel error:', stripeErr.message);
      // Continue — update DB regardless so the user is downgraded locally
    }
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ plan: 'basic', stripe_subscription_id: null })
    .eq('email', normalEmail);

  if (updateError) {
    console.error('Subscription cancel DB error:', updateError);
    return res.status(500).json({ error: 'Failed to update subscription status.' });
  }

  res.json({ success: true });
});


// ════════════════════════════════════════════════════
//  DEPLOY COUNT ROUTES
// ════════════════════════════════════════════════════

const DEPLOY_LIMITS = { basic: 2, developer: 10, professional: 999999 };

// GET /user/:email/deploy-count
// Returns: { deploy_count, deploy_limit, can_deploy }
app.get('/user/:email/deploy-count', async (req, res) => {
  const normalEmail = decodeURIComponent(req.params.email).toLowerCase().trim();

  const { data: user } = await supabase
    .from('users')
    .select('plan, deploy_count')
    .eq('email', normalEmail)
    .single();

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const plan = user.plan || 'basic';
  const deploy_count = user.deploy_count ?? 0;
  const deploy_limit = DEPLOY_LIMITS[plan] ?? DEPLOY_LIMITS.basic;
  const can_deploy = deploy_count < deploy_limit;

  res.json({ deploy_count, deploy_limit, can_deploy });
});


// POST /user/:email/increment-deploy
// Returns: { deploy_count, deploy_limit, can_deploy }
app.post('/user/:email/increment-deploy', async (req, res) => {
  const normalEmail = decodeURIComponent(req.params.email).toLowerCase().trim();

  const { data: user } = await supabase
    .from('users')
    .select('plan, deploy_count')
    .eq('email', normalEmail)
    .single();

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const plan = user.plan || 'basic';
  const current_count = user.deploy_count ?? 0;
  const deploy_limit = DEPLOY_LIMITS[plan] ?? DEPLOY_LIMITS.basic;

  if (current_count >= deploy_limit) {
    return res.status(403).json({ error: 'Deploy limit reached for your current plan.' });
  }

  const new_count = current_count + 1;

  const { error: updateError } = await supabase
    .from('users')
    .update({ deploy_count: new_count })
    .eq('email', normalEmail);

  if (updateError) {
    console.error('Deploy count update error:', updateError);
    return res.status(500).json({ error: 'Failed to update deploy count.' });
  }

  const can_deploy = new_count < deploy_limit;

  res.json({ deploy_count: new_count, deploy_limit, can_deploy });
});


// ════════════════════════════════════════════════════
//  ADMIN ROUTES
// ════════════════════════════════════════════════════

function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (key !== (process.env.ADMIN_SECRET_KEY || 'dsbp-admin-2024')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// GET /admin/stats
// Returns: { total_users, basic_users, developer_users, professional_users, total_deploys }
app.get('/admin/stats', requireAdmin, async (req, res) => {
  const { data: users, error } = await supabase
    .from('users')
    .select('plan, deploy_count');

  if (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch stats.' });
  }

  const total_users = users.length;
  const basic_users = users.filter(u => u.plan === 'basic').length;
  const developer_users = users.filter(u => u.plan === 'developer').length;
  const professional_users = users.filter(u => u.plan === 'professional').length;
  const total_deploys = users.reduce((sum, u) => sum + (u.deploy_count ?? 0), 0);

  res.json({ total_users, basic_users, developer_users, professional_users, total_deploys });
});


// GET /admin/users
// Returns: array of { email, username, plan, created_at, deploy_count }
app.get('/admin/users', requireAdmin, async (req, res) => {
  const { data: users, error } = await supabase
    .from('users')
    .select('email, username, plan, created_at, deploy_count')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Admin users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }

  const result = users.map(u => ({
    email: u.email,
    username: u.username,
    plan: u.plan,
    created_at: u.created_at,
    deploy_count: u.deploy_count ?? 0,
  }));

  res.json(result);
});


// PATCH /admin/users/:email/plan
// Body: { plan }
// Returns: { success: true }
app.patch('/admin/users/:email/plan', requireAdmin, async (req, res) => {
  const normalEmail = decodeURIComponent(req.params.email).toLowerCase().trim();
  const { plan } = req.body;

  const validPlans = ['basic', 'developer', 'professional'];
  if (!plan || !validPlans.includes(plan)) {
    return res.status(400).json({ error: 'Plan must be basic, developer, or professional.' });
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ plan })
    .eq('email', normalEmail);

  if (updateError) {
    console.error('Admin plan update error:', updateError);
    return res.status(500).json({ error: 'Failed to update plan.' });
  }

  res.json({ success: true });
});


// ── Health check ─────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── Admin dashboard page ──────────────────────────────
const path = require('path');
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// ── Start ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ DSBP backend running on port ${PORT}`);
  console.log(`  Stripe: ${process.env.STRIPE_SECRET_KEY ? '✓ configured' : '✗ missing STRIPE_SECRET_KEY'}`);
  console.log(`  Supabase: ${process.env.SUPABASE_URL ? '✓ configured' : '✗ missing SUPABASE_URL'}`);
});
