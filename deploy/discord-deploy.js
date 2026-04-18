/**
 * discord-deploy.js  — v2
 * Discord REST API v10 deployment module.
 * Runs in the Electron MAIN PROCESS only.
 * Uses Node's built-in https — zero extra dependencies.
 *
 * Exported functions:
 *   testConnection(token, guildId)
 *   deployServer(token, guildId, project, options, onProgress)
 *   sendWebhook(webhookUrl, messageData)
 */

'use strict';
const https = require('https');

// ── Permission bit values ──────────────────────────────────────────────────
const PERMISSION_BITS = {
  administrator:   8,
  manageChannels:  16,
  viewChannels:    1024,
  sendMessages:    2048,
  manageMessages:  8192,
  connect:         1048576
};

// Discord channel type constants
const CHANNEL_TYPE = { TEXT: 0, VOICE: 2, CATEGORY: 4 };

// ── Error class ────────────────────────────────────────────────────────────
class DeployError extends Error {
  constructor(message, status = 0, code = 0) {
    super(message);
    this.name = 'DeployError';
    this.status = status;
    this.code = code;
  }
}

// ── Utilities ──────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function hexColorToInt(hex) {
  if (!hex || !hex.startsWith('#')) return 0;
  const val = parseInt(hex.slice(1), 16);
  return isNaN(val) ? 0 : val;
}

function buildPermissionBits(permsObj) {
  let bits = 0;
  for (const [key, enabled] of Object.entries(permsObj || {})) {
    if (enabled && PERMISSION_BITS[key] !== undefined) bits |= PERMISSION_BITS[key];
  }
  return String(bits);
}

// ── Low-level HTTPS helpers ────────────────────────────────────────────────

/** Generic HTTPS request with retry-on-rate-limit */
function _httpsRequest(hostname, path, method, headers, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = { hostname, path, method, headers: { ...headers } };
    if (payload) opts.headers['Content-Length'] = Buffer.byteLength(payload);

    const req = https.request(opts, res => {
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => {
        let parsed = null;
        try { parsed = raw ? JSON.parse(raw) : null; } catch (_) { parsed = raw; }
        if (res.statusCode === 429) {
          resolve({ __rateLimit: true, retryAfter: parsed?.retry_after ?? 1 });
          return;
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(parsed);
        } else {
          reject(new DeployError(parsed?.message || `HTTP ${res.statusCode}`, res.statusCode, parsed?.code));
        }
      });
    });
    req.on('error', err => reject(new DeployError(err.message)));
    if (payload) req.write(payload);
    req.end();
  });
}

/** Discord API call with automatic rate-limit retry (max 3 attempts) */
async function apiCall(method, endpoint, token, body = null) {
  const headers = {
    'Authorization': `Bot ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'DiscordServerBuilderPro/2.0'
  };
  for (let i = 0; i < 3; i++) {
    const res = await _httpsRequest('discord.com', `/api/v10${endpoint}`, method, headers, body);
    if (res && res.__rateLimit) {
      await sleep(Math.ceil(res.retryAfter * 1000) + 150);
      continue;
    }
    return res;
  }
  throw new DeployError('Rate limited after 3 retries');
}

/** Plain HTTPS POST (used for webhooks — no Bot auth needed) */
function webhookPost(webhookUrl, payload) {
  return new Promise((resolve, reject) => {
    let url;
    try { url = new URL(webhookUrl); } catch (_) {
      return reject(new DeployError('Invalid webhook URL'));
    }
    const body = JSON.stringify(payload);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'User-Agent': 'DiscordServerBuilderPro/2.0'
    };
    const req = https.request(
      { hostname: url.hostname, path: url.pathname + url.search, method: 'POST', headers },
      res => {
        let raw = '';
        res.on('data', c => { raw += c; });
        res.on('end', () => {
          // 204 No Content = success
          if (res.statusCode >= 200 && res.statusCode <= 204) {
            resolve({ success: true });
          } else {
            let parsed = null;
            try { parsed = JSON.parse(raw); } catch (_) {}
            reject(new DeployError(parsed?.message || `HTTP ${res.statusCode}`, res.statusCode));
          }
        });
      }
    );
    req.on('error', err => reject(new DeployError(err.message)));
    req.write(body);
    req.end();
  });
}

// ══════════════════════════════════════════════════════════════════════════
//  PUBLIC API
// ══════════════════════════════════════════════════════════════════════════

/**
 * Validate bot token and check guild access.
 * Returns { bot, guild } on success, throws DeployError on failure.
 */
async function testConnection(token, guildId) {
  if (!token?.trim()) throw new DeployError('Bot token is required');
  if (!guildId?.trim()) throw new DeployError('Server ID is required');

  const bot = await apiCall('GET', '/users/@me', token.trim());
  if (!bot?.id) throw new DeployError('Invalid bot token — could not authenticate');

  let guild;
  try {
    guild = await apiCall('GET', `/guilds/${guildId.trim()}`, token.trim());
  } catch (err) {
    if (err.status === 403) throw new DeployError('Bot is not in that server or lacks access. Make sure it is invited.');
    if (err.status === 404) throw new DeployError('Server not found. Double-check the Server ID.');
    throw err;
  }

  return { bot, guild };
}

// ── Feature 1: Clean Deploy ────────────────────────────────────────────────
/**
 * Delete all non-essential channels and roles from the guild.
 * Skips @everyone and bot-managed roles.
 * Used when options.cleanDeploy is true.
 */
async function cleanDeploy(tok, gid, log) {
  log('🗑  Starting clean deploy — deleting existing content...', 'warn');

  // Delete all channels
  let channels = [];
  try { channels = await apiCall('GET', `/guilds/${gid}/channels`, tok) || []; }
  catch (err) { log(`⚠ Could not fetch channels: ${err.message}`, 'warn'); }

  for (const ch of channels) {
    try {
      await apiCall('DELETE', `/guilds/${gid}/channels/${ch.id}`, tok);
      const icon = ch.type === CHANNEL_TYPE.VOICE ? '🔊' : ch.type === CHANNEL_TYPE.CATEGORY ? '📁' : '#';
      log(`🗑  Deleted ${icon} ${ch.name}`, 'warn');
      await sleep(350);
    } catch (err) {
      log(`⚠ Could not delete "${ch.name}": ${err.message}`, 'warn');
    }
  }

  // Delete all non-essential roles
  let roles = [];
  try { roles = await apiCall('GET', `/guilds/${gid}/roles`, tok) || []; }
  catch (err) { log(`⚠ Could not fetch roles: ${err.message}`, 'warn'); }

  // @everyone has position 0, managed roles are bot/integration roles
  const deletable = roles.filter(r => r.name !== '@everyone' && !r.managed);
  for (const role of deletable) {
    try {
      await apiCall('DELETE', `/guilds/${gid}/roles/${role.id}`, tok);
      log(`🗑  Deleted role @${role.name}`, 'warn');
      await sleep(350);
    } catch (err) {
      log(`⚠ Could not delete role "${role.name}": ${err.message}`, 'warn');
    }
  }

  log('✅ Clean complete — server cleared', 'success');
}

// ── Feature 3: Role Hierarchy ──────────────────────────────────────────────
/**
 * Set role positions after creation so they stack in the correct order.
 * First role in the array gets the highest position (most powerful).
 */
async function setRolePositions(tok, gid, rolePositions, log) {
  if (!rolePositions || rolePositions.length < 2) return;
  log(`📐 Setting role hierarchy (${rolePositions.length} roles)...`);
  try {
    // Discord: higher position number = higher in hierarchy
    // We assign from length down to 1, so index 0 gets highest position
    const payload = rolePositions.map((id, idx) => ({
      id,
      position: rolePositions.length - idx
    }));
    await apiCall('PATCH', `/guilds/${gid}/roles`, tok, payload);
    log('✅ Role hierarchy applied', 'success');
  } catch (err) {
    log(`⚠ Could not set role positions: ${err.message}`, 'warn');
  }
}

// ── Main Deploy ────────────────────────────────────────────────────────────
/**
 * Deploy the full server design to a Discord guild.
 *
 * @param {string}   token    - Discord bot token
 * @param {string}   guildId  - Target guild ID
 * @param {object}   project  - AppState.project
 * @param {object}   options  - {
 *   renameServer, createRoles, createChannels,
 *   skipDuplicates, cleanDeploy, orderRoles
 * }
 * @param {function} onProgress - callback(message, level)
 */
async function deployServer(token, guildId, project, options, onProgress) {
  const tok = token.trim();
  const gid = guildId.trim();
  const log = (msg, level = 'info') => onProgress(msg, level);
  const summary = {
    renamed: false,
    rolesCreated: 0, rolesSkipped: 0,
    categoriesCreated: 0, channelsCreated: 0,
    hierarchySet: false, errors: []
  };

  // ── Connect ──────────────────────────────────────────────────────────────
  log('🔌 Connecting to Discord API...');
  const bot = await apiCall('GET', '/users/@me', tok);
  log(`✅ Authenticated as ${bot.username}#${bot.discriminator || '0'}`, 'success');
  const guild = await apiCall('GET', `/guilds/${gid}`, tok);
  log(`🔍 Found server: "${guild.name}"`, 'success');

  // ── Feature 1: Clean deploy ───────────────────────────────────────────────
  if (options.cleanDeploy) {
    await cleanDeploy(tok, gid, log);
    await sleep(500);
  }

  // ── Fetch existing data ───────────────────────────────────────────────────
  log('📋 Fetching current server data...');
  let existingRoles = [], existingChannels = [];
  try {
    existingRoles    = await apiCall('GET', `/guilds/${gid}/roles`, tok)    || [];
    existingChannels = await apiCall('GET', `/guilds/${gid}/channels`, tok) || [];
  } catch (err) {
    log(`⚠ Could not fetch existing data: ${err.message}`, 'warn');
  }
  const existingRoleNames    = new Set(existingRoles.map(r => r.name.toLowerCase()));
  const existingChannelNames = new Set(existingChannels.map(c => c.name.toLowerCase()));

  // ── Rename server ─────────────────────────────────────────────────────────
  if (options.renameServer && project.name && project.name !== guild.name) {
    log(`✏️  Renaming server to "${project.name}"...`);
    try {
      await apiCall('PATCH', `/guilds/${gid}`, tok, { name: project.name });
      summary.renamed = true;
      log(`✅ Server renamed to "${project.name}"`, 'success');
    } catch (err) {
      const msg = `Could not rename server: ${err.message}`;
      log(`⚠ ${msg}`, 'warn');
      summary.errors.push(msg);
    }
    await sleep(400);
  }

  // ── Create roles ──────────────────────────────────────────────────────────
  const createdRoleIds = []; // track for hierarchy ordering

  if (options.createRoles && project.roles?.length > 0) {
    log(`👥 Creating ${project.roles.length} role(s)...`);

    for (const role of project.roles) {
      try {
        const lowerName = role.name.toLowerCase();
        if (options.skipDuplicates && existingRoleNames.has(lowerName)) {
          log(`⏭  Skipped existing role: @${role.name}`, 'warn');
          summary.rolesSkipped++;
          // Still track position for existing roles if hierarchy ordering is on
          if (options.orderRoles) {
            const existing = existingRoles.find(r => r.name.toLowerCase() === lowerName);
            if (existing) createdRoleIds.push(existing.id);
          }
          continue;
        }

        const created = await apiCall('POST', `/guilds/${gid}/roles`, tok, {
          name:        role.name,
          color:       hexColorToInt(role.color),
          permissions: buildPermissionBits(role.permissions),
          mentionable: false,
          hoist:       false
        });

        existingRoleNames.add(lowerName);
        createdRoleIds.push(created.id);
        summary.rolesCreated++;
        log(`✅ Created role: @${role.name}`);
        await sleep(350);
      } catch (err) {
        const msg = `Failed to create role "${role.name}": ${err.message}`;
        log(`❌ ${msg}`, 'error');
        summary.errors.push(msg);
      }
    }

    // ── Feature 3: Set role hierarchy ────────────────────────────────────────
    if (options.orderRoles && createdRoleIds.length > 1) {
      await sleep(500);
      await setRolePositions(tok, gid, createdRoleIds, log);
      summary.hierarchySet = true;
    }
  }

  // ── Create categories + channels ──────────────────────────────────────────
  if (options.createChannels && project.categories?.length > 0) {
    log(`📁 Creating ${project.categories.length} category/categories...`);

    for (const cat of project.categories) {
      let categoryId = null;

      try {
        const catLower = cat.name.toLowerCase();
        const existingCat = existingChannels.find(
          ch => ch.type === CHANNEL_TYPE.CATEGORY && ch.name.toLowerCase() === catLower
        );

        if (options.skipDuplicates && existingCat) {
          categoryId = existingCat.id;
          log(`⏭  Using existing category: ${cat.name}`, 'warn');
        } else {
          const created = await apiCall('POST', `/guilds/${gid}/channels`, tok, {
            name: cat.name,
            type: CHANNEL_TYPE.CATEGORY
          });
          categoryId = created.id;
          summary.categoriesCreated++;
          log(`✅ Created category: ${cat.name}`);
          await sleep(350);
        }
      } catch (err) {
        const msg = `Failed to create category "${cat.name}": ${err.message}`;
        log(`❌ ${msg}`, 'error');
        summary.errors.push(msg);
        continue;
      }

      for (const ch of (cat.channels || [])) {
        try {
          const chLower = ch.name.toLowerCase();
          if (options.skipDuplicates && existingChannelNames.has(chLower)) {
            log(`⏭  Skipped existing channel: #${ch.name}`, 'warn');
            continue;
          }

          const channelType = ch.type === 'voice' ? CHANNEL_TYPE.VOICE : CHANNEL_TYPE.TEXT;

          // ── Feature 2: Channel topics ─────────────────────────────────────
          const payload = {
            name:      ch.name,
            type:      channelType,
            parent_id: categoryId
          };
          // Only text channels support topics
          if (channelType === CHANNEL_TYPE.TEXT && ch.topic?.trim()) {
            payload.topic = ch.topic.trim().slice(0, 1024); // Discord max topic length
          }

          await apiCall('POST', `/guilds/${gid}/channels`, tok, payload);
          existingChannelNames.add(chLower);
          summary.channelsCreated++;
          const icon = ch.type === 'voice' ? '🔊' : '#';
          const topicHint = payload.topic ? ` (topic set)` : '';
          log(`   ✅ ${icon} ${ch.name}${topicHint}`);
          await sleep(350);
        } catch (err) {
          const msg = `Failed to create channel "${ch.name}": ${err.message}`;
          log(`   ❌ ${msg}`, 'error');
          summary.errors.push(msg);
        }
      }
    }
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  log('', 'divider');
  log('🎉 Deployment complete!', 'success');
  log(`   Roles: ${summary.rolesCreated} created, ${summary.rolesSkipped} skipped`, 'success');
  if (summary.hierarchySet) log('   📐 Role hierarchy applied', 'success');
  log(`   Categories: ${summary.categoriesCreated} created`, 'success');
  log(`   Channels: ${summary.channelsCreated} created`, 'success');
  if (summary.errors.length > 0) {
    log(`   ⚠ ${summary.errors.length} error(s) — review above`, 'warn');
  }

  return summary;
}

// ── Feature 5: Webhook Sender ──────────────────────────────────────────────
/**
 * Send a message/embed to a Discord webhook URL.
 *
 * @param {string} webhookUrl  - Full Discord webhook URL
 * @param {object} messageData - { content, title, description, color, footer, fields[] }
 */
async function sendWebhook(webhookUrl, messageData) {
  if (!webhookUrl?.trim()) throw new DeployError('Webhook URL is required');

  // Validate URL looks like a Discord webhook
  if (!webhookUrl.includes('discord.com/api/webhooks') &&
      !webhookUrl.includes('discordapp.com/api/webhooks')) {
    throw new DeployError('URL does not look like a Discord webhook. Expected: discord.com/api/webhooks/...');
  }

  // Build embed object (only include defined fields)
  const embed = {};
  if (messageData.title?.trim())       embed.title       = messageData.title.trim();
  if (messageData.description?.trim()) embed.description = messageData.description.trim();
  if (messageData.color)               embed.color       = hexColorToInt(messageData.color);
  if (messageData.footer?.trim())      embed.footer      = { text: messageData.footer.trim() };
  if (messageData.fields?.length) {
    embed.fields = messageData.fields
      .filter(f => f.name?.trim() && f.value?.trim())
      .map(f => ({ name: f.name.trim(), value: f.value.trim(), inline: false }));
  }

  const payload = {};
  if (messageData.content?.trim()) payload.content = messageData.content.trim();
  if (Object.keys(embed).length > 0) payload.embeds = [embed];

  if (!payload.content && !payload.embeds) {
    throw new DeployError('Nothing to send — message has no content or embed data');
  }

  return await webhookPost(webhookUrl.trim(), payload);
}

// ── Exports ────────────────────────────────────────────────────────────────
module.exports = { testConnection, deployServer, sendWebhook, DeployError };
