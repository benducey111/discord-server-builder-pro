/* ════════════════════════════════════════
   PROJECT MANAGER MODULE
   (Helper module — core logic in renderer.js)
════════════════════════════════════════ */

const ProjectManager = (() => {

  function getProjectSummary() {
    const p = AppState.project;
    const totalChannels = p.categories.reduce((s, c) => s + c.channels.length, 0);
    const totalMsgs = Object.values(p.messages).filter(m => m && m.title).length;
    return {
      name: p.name,
      categories: p.categories.length,
      channels: totalChannels,
      roles: p.roles.length,
      messages: totalMsgs,
      lastUpdated: p.updatedAt
    };
  }

  function validateProject(data) {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.name !== 'string') return false;
    if (!Array.isArray(data.categories)) return false;
    if (!Array.isArray(data.roles)) return false;
    return true;
  }

  function sanitizeProject(data) {
    return {
      name: String(data.name || 'My Server').slice(0, 100),
      description: String(data.description || '').slice(0, 500),
      categories: (data.categories || []).map(cat => ({
        id: String(cat.id || Date.now()),
        name: String(cat.name || 'Category').slice(0, 100),
        collapsed: Boolean(cat.collapsed),
        channels: (cat.channels || []).map(ch => ({
          id: String(ch.id || Date.now()),
          name: String(ch.name || 'channel').slice(0, 100),
          type: ch.type === 'voice' ? 'voice' : 'text'
        }))
      })),
      roles: (data.roles || []).map(role => ({
        id: String(role.id || Date.now()),
        name: String(role.name || 'Role').slice(0, 100),
        color: /^#[0-9a-f]{6}$/i.test(role.color) ? role.color : '#5865f2',
        permissions: {
          viewChannels: Boolean(role.permissions?.viewChannels),
          sendMessages: Boolean(role.permissions?.sendMessages),
          manageMessages: Boolean(role.permissions?.manageMessages),
          connect: Boolean(role.permissions?.connect),
          manageChannels: Boolean(role.permissions?.manageChannels),
          administrator: Boolean(role.permissions?.administrator)
        }
      })),
      messages: {
        welcome: data.messages?.welcome || null,
        rules: data.messages?.rules || null,
        tickets: data.messages?.tickets || null,
        prices: data.messages?.prices || null,
        vouches: data.messages?.vouches || null,
        giveaway: data.messages?.giveaway || null
      },
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  return { getProjectSummary, validateProject, sanitizeProject };
})();
