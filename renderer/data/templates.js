/**
 * templates.js — Preset server template definitions
 * Edit this file freely to add, remove, or modify templates.
 * Each template uses the same data structure as AppState.project.
 */

/* eslint-disable no-unused-vars */
const TEMPLATES = [
  // ══════════════════════════════════════════════════════
  {
    id: 'gaming',
    name: 'Gaming Server',
    icon: '🎮',
    description: 'A full-featured community gaming server with rooms for different games, LFG, and moderation.',
    tags: ['gaming', 'community', 'popular'],
    accent: '#5865f2',
    serverName: 'The Gaming Hub',
    categories: [
      {
        name: '📢 INFORMATION',
        channels: [
          { name: 'announcements', type: 'text' },
          { name: 'rules', type: 'text' },
          { name: 'roles', type: 'text' },
          { name: 'faq', type: 'text' }
        ]
      },
      {
        name: '💬 GENERAL',
        channels: [
          { name: 'general', type: 'text' },
          { name: 'introductions', type: 'text' },
          { name: 'off-topic', type: 'text' },
          { name: 'memes', type: 'text' }
        ]
      },
      {
        name: '🎮 GAMING',
        channels: [
          { name: 'game-discussion', type: 'text' },
          { name: 'looking-for-group', type: 'text' },
          { name: 'game-clips', type: 'text' },
          { name: 'game-reviews', type: 'text' }
        ]
      },
      {
        name: '🔊 VOICE',
        channels: [
          { name: 'General', type: 'voice' },
          { name: 'Gaming Room 1', type: 'voice' },
          { name: 'Gaming Room 2', type: 'voice' },
          { name: 'AFK', type: 'voice' }
        ]
      },
      {
        name: '🛡️ MODERATION',
        channels: [
          { name: 'mod-log', type: 'text' },
          { name: 'staff-chat', type: 'text' },
          { name: 'bot-commands', type: 'text' }
        ]
      }
    ],
    roles: [
      { name: 'Owner',      color: '#f1c40f', permissions: { administrator: true, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Admin',      color: '#e74c3c', permissions: { administrator: true, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Moderator',  color: '#e67e22', permissions: { viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: false, administrator: false } },
      { name: 'Member',     color: '#3498db', permissions: { viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false, administrator: false } },
      { name: 'Unverified', color: '#95a5a6', permissions: { viewChannels: true, sendMessages: false, manageMessages: false, connect: false, manageChannels: false, administrator: false } }
    ]
  },

  // ══════════════════════════════════════════════════════
  {
    id: 'marketplace',
    name: 'Marketplace Server',
    icon: '🛒',
    description: 'A buy/sell/trade server with listings channels, vouch system, and seller verification.',
    tags: ['marketplace', 'commerce', 'popular'],
    accent: '#3ba55c',
    serverName: 'The Marketplace',
    categories: [
      {
        name: '📢 INFORMATION',
        channels: [
          { name: 'announcements', type: 'text' },
          { name: 'rules', type: 'text' },
          { name: 'how-to-buy', type: 'text' },
          { name: 'how-to-sell', type: 'text' }
        ]
      },
      {
        name: '🛒 MARKETPLACE',
        channels: [
          { name: 'listings', type: 'text' },
          { name: 'buying', type: 'text' },
          { name: 'selling', type: 'text' },
          { name: 'price-checks', type: 'text' }
        ]
      },
      {
        name: '⭐ REPUTATION',
        channels: [
          { name: 'reviews', type: 'text' },
          { name: 'vouches', type: 'text' },
          { name: 'report-scam', type: 'text' }
        ]
      },
      {
        name: '🎫 SUPPORT',
        channels: [
          { name: 'open-ticket', type: 'text' },
          { name: 'faq', type: 'text' }
        ]
      },
      {
        name: '👔 STAFF',
        channels: [
          { name: 'staff-chat', type: 'text' },
          { name: 'mod-log', type: 'text' }
        ]
      }
    ],
    roles: [
      { name: 'Owner',           color: '#f1c40f', permissions: { administrator: true, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Admin',           color: '#e74c3c', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Moderator',       color: '#e67e22', permissions: { viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: false, administrator: false } },
      { name: 'Verified Seller', color: '#3ba55c', permissions: { viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false, administrator: false } },
      { name: 'Buyer',           color: '#3498db', permissions: { viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false, administrator: false } },
      { name: 'Member',          color: '#95a5a6', permissions: { viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false, administrator: false } }
    ]
  },

  // ══════════════════════════════════════════════════════
  {
    id: 'community',
    name: 'Community Server',
    icon: '🌍',
    description: 'A welcoming general-purpose community server with creative, media, and lounge spaces.',
    tags: ['community', 'general', 'popular'],
    accent: '#9b59b6',
    serverName: 'Community Hub',
    categories: [
      {
        name: '👋 WELCOME',
        channels: [
          { name: 'welcome', type: 'text' },
          { name: 'rules', type: 'text' },
          { name: 'announcements', type: 'text' },
          { name: 'roles', type: 'text' }
        ]
      },
      {
        name: '💬 GENERAL',
        channels: [
          { name: 'general', type: 'text' },
          { name: 'introductions', type: 'text' },
          { name: 'off-topic', type: 'text' }
        ]
      },
      {
        name: '🎨 CREATIVE',
        channels: [
          { name: 'art-showcase', type: 'text' },
          { name: 'memes', type: 'text' },
          { name: 'photography', type: 'text' }
        ]
      },
      {
        name: '🎵 MEDIA',
        channels: [
          { name: 'music-sharing', type: 'text' },
          { name: 'recommendations', type: 'text' }
        ]
      },
      {
        name: '🔊 LOUNGE',
        channels: [
          { name: 'General', type: 'voice' },
          { name: 'Music Lounge', type: 'voice' },
          { name: 'Study Room', type: 'voice' }
        ]
      },
      {
        name: '🛡️ STAFF',
        channels: [
          { name: 'staff-chat', type: 'text' },
          { name: 'mod-log', type: 'text' }
        ]
      }
    ],
    roles: [
      { name: 'Owner',      color: '#f1c40f', permissions: { administrator: true, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Admin',      color: '#e74c3c', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Moderator',  color: '#2ecc71', permissions: { viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: false, administrator: false } },
      { name: 'Trusted',    color: '#9b59b6', permissions: { viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false, administrator: false } },
      { name: 'Member',     color: '#3498db', permissions: { viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false, administrator: false } },
      { name: 'New Member', color: '#95a5a6', permissions: { viewChannels: true, sendMessages: true, manageMessages: false, connect: false, manageChannels: false, administrator: false } }
    ]
  },

  // ══════════════════════════════════════════════════════
  {
    id: 'minecraft',
    name: 'Minecraft Server',
    icon: '⛏️',
    description: 'Built for Minecraft communities — post your server IP, share builds, coordinate gamemodes.',
    tags: ['gaming', 'minecraft'],
    accent: '#3ba55c',
    serverName: 'MC Community',
    categories: [
      {
        name: '📢 INFO',
        channels: [
          { name: 'announcements', type: 'text' },
          { name: 'rules', type: 'text' },
          { name: 'server-ip', type: 'text' },
          { name: 'updates', type: 'text' }
        ]
      },
      {
        name: '💬 COMMUNITY',
        channels: [
          { name: 'general', type: 'text' },
          { name: 'help', type: 'text' },
          { name: 'suggestions', type: 'text' },
          { name: 'off-topic', type: 'text' }
        ]
      },
      {
        name: '⛏️ MINECRAFT',
        channels: [
          { name: 'survival', type: 'text' },
          { name: 'creative', type: 'text' },
          { name: 'builds', type: 'text' },
          { name: 'screenshots', type: 'text' }
        ]
      },
      {
        name: '🔊 VOICE',
        channels: [
          { name: 'Survival', type: 'voice' },
          { name: 'Creative', type: 'voice' },
          { name: 'AFK', type: 'voice' }
        ]
      }
    ],
    roles: [
      { name: 'Owner',      color: '#f1c40f', permissions: { administrator: true, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Admin',      color: '#e74c3c', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Moderator',  color: '#e67e22', permissions: { viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: false, administrator: false } },
      { name: 'Helper',     color: '#2ecc71', permissions: { viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false, administrator: false } },
      { name: 'Player',     color: '#3498db', permissions: { viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false, administrator: false } },
      { name: 'New Player', color: '#95a5a6', permissions: { viewChannels: true, sendMessages: false, manageMessages: false, connect: false, manageChannels: false, administrator: false } }
    ]
  },

  // ══════════════════════════════════════════════════════
  {
    id: 'creator',
    name: 'Content Creator',
    icon: '🎬',
    description: 'Perfect for YouTubers, streamers, and creators — community, content sharing, and collab requests.',
    tags: ['creator', 'community'],
    accent: '#ed4245',
    serverName: 'Creator Hub',
    categories: [
      {
        name: '📺 ABOUT',
        channels: [
          { name: 'welcome', type: 'text' },
          { name: 'rules', type: 'text' },
          { name: 'announcements', type: 'text' }
        ]
      },
      {
        name: '👥 COMMUNITY',
        channels: [
          { name: 'general', type: 'text' },
          { name: 'introductions', type: 'text' },
          { name: 'feedback', type: 'text' }
        ]
      },
      {
        name: '🎬 CONTENT',
        channels: [
          { name: 'latest-content', type: 'text' },
          { name: 'clips', type: 'text' },
          { name: 'collab-requests', type: 'text' },
          { name: 'behind-the-scenes', type: 'text' }
        ]
      },
      {
        name: '🔊 HANGOUT',
        channels: [
          { name: 'Chill', type: 'voice' },
          { name: 'Watch Party', type: 'voice' }
        ]
      }
    ],
    roles: [
      { name: 'Creator',    color: '#ed4245', permissions: { administrator: true, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Team',       color: '#faa61a', permissions: { viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: false, administrator: false } },
      { name: 'Moderator',  color: '#e67e22', permissions: { viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: false, administrator: false } },
      { name: 'Subscriber', color: '#9b59b6', permissions: { viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false, administrator: false } },
      { name: 'Member',     color: '#3498db', permissions: { viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false, administrator: false } }
    ]
  },

  // ══════════════════════════════════════════════════════
  {
    id: 'staff',
    name: 'Staff Team',
    icon: '🏢',
    description: 'Internal staff coordination server with task tracking, meeting notes, and private leadership channels.',
    tags: ['staff', 'internal', 'operations'],
    accent: '#faa61a',
    serverName: 'Staff HQ',
    categories: [
      {
        name: '📢 GENERAL',
        channels: [
          { name: 'announcements', type: 'text' },
          { name: 'staff-general', type: 'text' },
          { name: 'off-topic', type: 'text' }
        ]
      },
      {
        name: '📋 OPERATIONS',
        channels: [
          { name: 'tasks', type: 'text' },
          { name: 'projects', type: 'text' },
          { name: 'meeting-notes', type: 'text' },
          { name: 'resources', type: 'text' }
        ]
      },
      {
        name: '📊 LOGS',
        channels: [
          { name: 'mod-log', type: 'text' },
          { name: 'ban-log', type: 'text' },
          { name: 'action-log', type: 'text' }
        ]
      },
      {
        name: '🔒 LEADERSHIP',
        channels: [
          { name: 'head-staff', type: 'text' },
          { name: 'private-discussion', type: 'text' }
        ]
      },
      {
        name: '🔊 MEETINGS',
        channels: [
          { name: 'Staff Meeting', type: 'voice' },
          { name: 'Breakout Room', type: 'voice' }
        ]
      }
    ],
    roles: [
      { name: 'Owner',      color: '#f1c40f', permissions: { administrator: true, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Head Admin', color: '#e74c3c', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Admin',      color: '#e67e22', permissions: { viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: false, administrator: false } },
      { name: 'Senior Mod', color: '#faa61a', permissions: { viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: false, administrator: false } },
      { name: 'Moderator',  color: '#3498db', permissions: { viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: false, administrator: false } },
      { name: 'Trial Mod',  color: '#95a5a6', permissions: { viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false, administrator: false } }
    ]
  },

  // ══════════════════════════════════════════════════════
  {
    id: 'minimal',
    name: 'Minimal Server',
    icon: '✨',
    description: 'Clean and simple — just the essentials. Start here and build exactly what you need.',
    tags: ['minimal', 'simple'],
    accent: '#5865f2',
    serverName: 'My Server',
    categories: [
      {
        name: '💬 GENERAL',
        channels: [
          { name: 'general', type: 'text' },
          { name: 'announcements', type: 'text' }
        ]
      },
      {
        name: '🔊 VOICE',
        channels: [
          { name: 'General', type: 'voice' }
        ]
      }
    ],
    roles: [
      { name: 'Admin',  color: '#e74c3c', permissions: { administrator: true, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Member', color: '#3498db', permissions: { viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false, administrator: false } }
    ]
  },

  // ══════════════════════════════════════════════════════
  {
    id: 'music',
    name: 'Music / DJ Server',
    icon: '🎵',
    description: 'A server for music lovers, DJs, and artists to share, collaborate, and listen together.',
    tags: ['music', 'community'],
    accent: '#1db954',
    serverName: 'Music Lounge',
    categories: [
      {
        name: '📢 INFO',
        channels: [
          { name: 'announcements', type: 'text' },
          { name: 'rules', type: 'text' },
          { name: 'updates', type: 'text' }
        ]
      },
      {
        name: '🎵 MUSIC',
        channels: [
          { name: 'music-chat', type: 'text' },
          { name: 'song-requests', type: 'text' },
          { name: 'recommendations', type: 'text' },
          { name: 'now-playing', type: 'text' }
        ]
      },
      {
        name: '🎤 ARTISTS',
        channels: [
          { name: 'artist-showcase', type: 'text' },
          { name: 'collabs', type: 'text' },
          { name: 'beats-feedback', type: 'text' }
        ]
      },
      {
        name: '🔊 VOICE',
        channels: [
          { name: 'Listening Lounge', type: 'voice' },
          { name: 'DJ Booth', type: 'voice' },
          { name: 'Chill Zone', type: 'voice' },
          { name: 'AFK', type: 'voice' }
        ]
      }
    ],
    roles: [
      { name: 'Owner',    color: '#f1c40f', permissions: { administrator: true, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'DJ',       color: '#1db954', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'Artist',   color: '#9b59b6', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'Listener', color: '#3498db', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'Guest',    color: '#95a5a6', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: false, manageChannels: false } }
    ]
  },

  // ══════════════════════════════════════════════════════
  {
    id: 'study',
    name: 'Study Group',
    icon: '📚',
    description: 'A focused study server for students to get help, share resources, and collaborate on subjects.',
    tags: ['study', 'education'],
    accent: '#5865f2',
    serverName: 'Study Hub',
    categories: [
      {
        name: '📢 INFO',
        channels: [
          { name: 'announcements', type: 'text' },
          { name: 'rules', type: 'text' },
          { name: 'resources', type: 'text' }
        ]
      },
      {
        name: '📚 SUBJECTS',
        channels: [
          { name: 'math', type: 'text' },
          { name: 'science', type: 'text' },
          { name: 'english', type: 'text' },
          { name: 'history', type: 'text' },
          { name: 'homework-help', type: 'text' }
        ]
      },
      {
        name: '💬 SOCIAL',
        channels: [
          { name: 'general', type: 'text' },
          { name: 'off-topic', type: 'text' },
          { name: 'introductions', type: 'text' }
        ]
      },
      {
        name: '🔊 STUDY ROOMS',
        channels: [
          { name: 'Quiet Study', type: 'voice' },
          { name: 'Group Study', type: 'voice' },
          { name: 'Tutoring', type: 'voice' },
          { name: 'AFK', type: 'voice' }
        ]
      }
    ],
    roles: [
      { name: 'Owner',      color: '#f1c40f', permissions: { administrator: true, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Tutor',      color: '#5865f2', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: false } },
      { name: 'Student',    color: '#3498db', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'New Member', color: '#95a5a6', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: false, manageChannels: false } }
    ]
  },

  // ══════════════════════════════════════════════════════
  {
    id: 'crypto',
    name: 'Crypto & Trading',
    icon: '💎',
    description: 'A hub for crypto enthusiasts and traders to discuss markets, share signals, and track portfolios.',
    tags: ['crypto', 'trading', 'finance'],
    accent: '#f0b232',
    serverName: 'Crypto Hub',
    categories: [
      {
        name: '📢 INFO',
        channels: [
          { name: 'announcements', type: 'text' },
          { name: 'rules', type: 'text' },
          { name: 'disclaimer', type: 'text' }
        ]
      },
      {
        name: '📈 TRADING',
        channels: [
          { name: 'price-talk', type: 'text' },
          { name: 'signals', type: 'text' },
          { name: 'technical-analysis', type: 'text' },
          { name: 'portfolio-showcase', type: 'text' }
        ]
      },
      {
        name: '🪙 CRYPTO',
        channels: [
          { name: 'bitcoin', type: 'text' },
          { name: 'ethereum', type: 'text' },
          { name: 'altcoins', type: 'text' },
          { name: 'nfts', type: 'text' },
          { name: 'defi', type: 'text' }
        ]
      },
      {
        name: '💬 GENERAL',
        channels: [
          { name: 'general', type: 'text' },
          { name: 'off-topic', type: 'text' },
          { name: 'memes', type: 'text' }
        ]
      },
      {
        name: '🔊 VOICE',
        channels: [
          { name: 'Trading Chat', type: 'voice' },
          { name: 'Alpha Calls', type: 'voice' },
          { name: 'AFK', type: 'voice' }
        ]
      }
    ],
    roles: [
      { name: 'Owner',  color: '#f1c40f', permissions: { administrator: true, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Alpha',  color: '#f0b232', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'Trader', color: '#3498db', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'Member', color: '#95a5a6', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } }
    ]
  },

  // ══════════════════════════════════════════════════════
  {
    id: 'esports',
    name: 'Esports Team',
    icon: '🏆',
    description: 'A competitive esports team server for strategy, scrimmages, VOD reviews, and match scheduling.',
    tags: ['gaming', 'esports', 'competitive'],
    accent: '#ed4245',
    serverName: 'Team HQ',
    categories: [
      {
        name: '📢 INFO',
        channels: [
          { name: 'announcements', type: 'text' },
          { name: 'roster', type: 'text' },
          { name: 'schedule', type: 'text' }
        ]
      },
      {
        name: '🎮 TEAM',
        channels: [
          { name: 'team-chat', type: 'text' },
          { name: 'strategy', type: 'text' },
          { name: 'vod-review', type: 'text' },
          { name: 'scrim-schedule', type: 'text' }
        ]
      },
      {
        name: '🏆 COMPETITIVE',
        channels: [
          { name: 'match-results', type: 'text' },
          { name: 'rankings', type: 'text' },
          { name: 'highlights', type: 'text' }
        ]
      },
      {
        name: '🔊 VOICE',
        channels: [
          { name: 'Team Comms', type: 'voice' },
          { name: 'Scrimmage', type: 'voice' },
          { name: 'Practice Room', type: 'voice' },
          { name: 'AFK', type: 'voice' }
        ]
      }
    ],
    roles: [
      { name: 'Owner',  color: '#f1c40f', permissions: { administrator: true, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Coach',  color: '#ed4245', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: false } },
      { name: 'Player', color: '#e67e22', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'Sub',    color: '#3498db', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'Trial',  color: '#95a5a6', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } }
    ]
  },

  // ══════════════════════════════════════════════════════
  {
    id: 'roleplay',
    name: 'Roleplay Server',
    icon: '🎭',
    description: 'An immersive roleplay server with in-character locations, lore channels, and OOC discussion.',
    tags: ['roleplay', 'community'],
    accent: '#9b59b6',
    serverName: 'RP World',
    categories: [
      {
        name: '📢 INFO',
        channels: [
          { name: 'announcements', type: 'text' },
          { name: 'rules', type: 'text' },
          { name: 'lore', type: 'text' },
          { name: 'character-sheets', type: 'text' }
        ]
      },
      {
        name: '🌍 ROLEPLAY',
        channels: [
          { name: 'town-square', type: 'text' },
          { name: 'tavern', type: 'text' },
          { name: 'marketplace', type: 'text' },
          { name: 'wilderness', type: 'text' },
          { name: 'dark-alley', type: 'text' }
        ]
      },
      {
        name: '💬 OOC',
        channels: [
          { name: 'out-of-character', type: 'text' },
          { name: 'introductions', type: 'text' },
          { name: 'plot-discussion', type: 'text' }
        ]
      },
      {
        name: '🔊 VOICE',
        channels: [
          { name: 'RP Voice', type: 'voice' },
          { name: 'OOC Lounge', type: 'voice' },
          { name: 'AFK', type: 'voice' }
        ]
      }
    ],
    roles: [
      { name: 'Owner',       color: '#f1c40f', permissions: { administrator: true, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Game Master', color: '#9b59b6', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: false } },
      { name: 'Veteran',     color: '#e67e22', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'Member',      color: '#3498db', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'New Player',  color: '#95a5a6', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: false, manageChannels: false } }
    ]
  },

  // ══════════════════════════════════════════════════════
  {
    id: 'art',
    name: 'Art Community',
    icon: '🎨',
    description: 'A creative community for artists to showcase work, give feedback, and find commissions.',
    tags: ['art', 'creative', 'community'],
    accent: '#e74c3c',
    serverName: 'Art Gallery',
    categories: [
      {
        name: '📢 INFO',
        channels: [
          { name: 'announcements', type: 'text' },
          { name: 'rules', type: 'text' },
          { name: 'resources', type: 'text' }
        ]
      },
      {
        name: '🎨 GALLERY',
        channels: [
          { name: 'showcase', type: 'text' },
          { name: 'feedback', type: 'text' },
          { name: 'wip', type: 'text' },
          { name: 'digital-art', type: 'text' },
          { name: 'traditional-art', type: 'text' },
          { name: 'photography', type: 'text' }
        ]
      },
      {
        name: '💬 COMMUNITY',
        channels: [
          { name: 'general', type: 'text' },
          { name: 'art-chat', type: 'text' },
          { name: 'commissions-open', type: 'text' },
          { name: 'tutorials', type: 'text' }
        ]
      },
      {
        name: '🔊 VOICE',
        channels: [
          { name: 'Draw Together', type: 'voice' },
          { name: 'Crit Session', type: 'voice' },
          { name: 'Chill', type: 'voice' },
          { name: 'AFK', type: 'voice' }
        ]
      }
    ],
    roles: [
      { name: 'Owner',           color: '#f1c40f', permissions: { administrator: true, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Featured Artist', color: '#e74c3c', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'Artist',          color: '#e67e22', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'Art Lover',       color: '#3498db', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'New Member',      color: '#95a5a6', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } }
    ]
  },

  // ══════════════════════════════════════════════════════
  {
    id: 'programming',
    name: 'Programming & Tech',
    icon: '💻',
    description: 'A developer community for code help, project showcases, tech discussion, and job postings.',
    tags: ['programming', 'tech', 'community'],
    accent: '#3498db',
    serverName: 'Dev Community',
    categories: [
      {
        name: '📢 INFO',
        channels: [
          { name: 'announcements', type: 'text' },
          { name: 'rules', type: 'text' },
          { name: 'resources', type: 'text' },
          { name: 'job-board', type: 'text' }
        ]
      },
      {
        name: '💻 CODING',
        channels: [
          { name: 'general-dev', type: 'text' },
          { name: 'help-desk', type: 'text' },
          { name: 'code-review', type: 'text' },
          { name: 'project-showcase', type: 'text' },
          { name: 'open-source', type: 'text' }
        ]
      },
      {
        name: '🛠 LANGUAGES',
        channels: [
          { name: 'javascript', type: 'text' },
          { name: 'python', type: 'text' },
          { name: 'web-dev', type: 'text' },
          { name: 'backend', type: 'text' },
          { name: 'mobile', type: 'text' },
          { name: 'gamedev', type: 'text' }
        ]
      },
      {
        name: '🔊 VOICE',
        channels: [
          { name: 'Dev Chat', type: 'voice' },
          { name: 'Pair Programming', type: 'voice' },
          { name: 'AFK', type: 'voice' }
        ]
      }
    ],
    roles: [
      { name: 'Owner',       color: '#f1c40f', permissions: { administrator: true, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Senior Dev',  color: '#3498db', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: false } },
      { name: 'Developer',   color: '#2ecc71', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'Student',     color: '#e67e22', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'Member',      color: '#95a5a6', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } }
    ]
  },

  // ══════════════════════════════════════════════════════
  {
    id: 'anime',
    name: 'Anime Community',
    icon: '🌸',
    description: 'A welcoming community for anime fans to discuss series, share fan art, and track seasonal shows.',
    tags: ['anime', 'community', 'entertainment'],
    accent: '#ff6b9d',
    serverName: 'Anime Den',
    categories: [
      {
        name: '📢 INFO',
        channels: [
          { name: 'announcements', type: 'text' },
          { name: 'rules', type: 'text' },
          { name: 'roles-info', type: 'text' }
        ]
      },
      {
        name: '🌸 ANIME',
        channels: [
          { name: 'anime-discussion', type: 'text' },
          { name: 'manga', type: 'text' },
          { name: 'recommendations', type: 'text' },
          { name: 'fan-art', type: 'text' },
          { name: 'memes', type: 'text' }
        ]
      },
      {
        name: '📺 SEASONAL',
        channels: [
          { name: 'currently-watching', type: 'text' },
          { name: 'episode-discussion', type: 'text' },
          { name: 'reviews', type: 'text' }
        ]
      },
      {
        name: '🔊 VOICE',
        channels: [
          { name: 'Watch Party', type: 'voice' },
          { name: 'Chill Chat', type: 'voice' },
          { name: 'AFK', type: 'voice' }
        ]
      }
    ],
    roles: [
      { name: 'Owner',      color: '#f1c40f', permissions: { administrator: true, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Mod',        color: '#ff6b9d', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: false } },
      { name: 'Weeb',       color: '#9b59b6', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'Member',     color: '#3498db', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'New Member', color: '#95a5a6', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } }
    ]
  },

  // ══════════════════════════════════════════════════════
  {
    id: 'business',
    name: 'Business & Agency',
    icon: '💼',
    description: 'An internal server for businesses and agencies — departments, project tracking, and meetings.',
    tags: ['business', 'professional', 'internal'],
    accent: '#2c3e50',
    serverName: 'Business HQ',
    categories: [
      {
        name: '📢 COMPANY',
        channels: [
          { name: 'announcements', type: 'text' },
          { name: 'company-news', type: 'text' },
          { name: 'policies', type: 'text' }
        ]
      },
      {
        name: '💼 DEPARTMENTS',
        channels: [
          { name: 'general', type: 'text' },
          { name: 'marketing', type: 'text' },
          { name: 'development', type: 'text' },
          { name: 'design', type: 'text' },
          { name: 'sales', type: 'text' },
          { name: 'support', type: 'text' }
        ]
      },
      {
        name: '📊 PROJECTS',
        channels: [
          { name: 'active-projects', type: 'text' },
          { name: 'completed', type: 'text' },
          { name: 'feedback', type: 'text' },
          { name: 'deadlines', type: 'text' }
        ]
      },
      {
        name: '🔊 MEETINGS',
        channels: [
          { name: 'All Hands', type: 'voice' },
          { name: 'Department Meeting', type: 'voice' },
          { name: '1-on-1', type: 'voice' },
          { name: 'AFK', type: 'voice' }
        ]
      }
    ],
    roles: [
      { name: 'CEO',       color: '#f1c40f', permissions: { administrator: true, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Manager',   color: '#e74c3c', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: false } },
      { name: 'Team Lead', color: '#e67e22', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'Employee',  color: '#3498db', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'Intern',    color: '#95a5a6', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } }
    ]
  },

  // ══════════════════════════════════════════════════════
  {
    id: 'support',
    name: 'Support Server',
    icon: '🎫',
    description: 'A structured support server with ticketing, bug reports, FAQs, and a community lounge.',
    tags: ['support', 'community'],
    accent: '#57f287',
    serverName: 'Support Center',
    categories: [
      {
        name: '📢 INFO',
        channels: [
          { name: 'announcements', type: 'text' },
          { name: 'rules', type: 'text' },
          { name: 'faq', type: 'text' },
          { name: 'status', type: 'text' }
        ]
      },
      {
        name: '🎫 SUPPORT',
        channels: [
          { name: 'open-a-ticket', type: 'text' },
          { name: 'general-help', type: 'text' },
          { name: 'bug-reports', type: 'text' },
          { name: 'feature-requests', type: 'text' }
        ]
      },
      {
        name: '📋 RESOLVED',
        channels: [
          { name: 'closed-tickets', type: 'text' },
          { name: 'known-issues', type: 'text' }
        ]
      },
      {
        name: '💬 COMMUNITY',
        channels: [
          { name: 'general', type: 'text' },
          { name: 'off-topic', type: 'text' }
        ]
      },
      {
        name: '🔊 VOICE',
        channels: [
          { name: 'Support Call', type: 'voice' },
          { name: 'Waiting Room', type: 'voice' },
          { name: 'AFK', type: 'voice' }
        ]
      }
    ],
    roles: [
      { name: 'Owner',         color: '#f1c40f', permissions: { administrator: true, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Support Lead',  color: '#57f287', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: false } },
      { name: 'Support Agent', color: '#2ecc71', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'Member',        color: '#3498db', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'New User',      color: '#95a5a6', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } }
    ]
  },

  // ══════════════════════════════════════════════════════
  {
    id: 'music-production',
    name: 'Music Production',
    icon: '🎹',
    description: 'A server for producers and artists to share beats, give feedback, find collabs, and drop releases.',
    tags: ['music', 'production', 'creative'],
    accent: '#e67e22',
    serverName: 'Beat Lab',
    categories: [
      {
        name: '📢 INFO',
        channels: [
          { name: 'announcements', type: 'text' },
          { name: 'rules', type: 'text' },
          { name: 'resources', type: 'text' }
        ]
      },
      {
        name: '🎹 PRODUCTION',
        channels: [
          { name: 'beat-showcase', type: 'text' },
          { name: 'feedback', type: 'text' },
          { name: 'techniques', type: 'text' },
          { name: 'samples-packs', type: 'text' },
          { name: 'daw-chat', type: 'text' }
        ]
      },
      {
        name: '🎤 ARTISTS',
        channels: [
          { name: 'artist-profile', type: 'text' },
          { name: 'collabs-wanted', type: 'text' },
          { name: 'releases', type: 'text' }
        ]
      },
      {
        name: '🔊 VOICE',
        channels: [
          { name: 'Studio Session', type: 'voice' },
          { name: 'Listening Party', type: 'voice' },
          { name: 'AFK', type: 'voice' }
        ]
      }
    ],
    roles: [
      { name: 'Owner',      color: '#f1c40f', permissions: { administrator: true, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Producer',   color: '#e67e22', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: false } },
      { name: 'Artist',     color: '#9b59b6', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'Listener',   color: '#3498db', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'New Member', color: '#95a5a6', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } }
    ]
  },

  // ══════════════════════════════════════════════════════
  {
    id: 'sports',
    name: 'Sports Fan Club',
    icon: '⚽',
    description: 'A fan club server for sports lovers to discuss matches, predictions, stats, and fantasy leagues.',
    tags: ['sports', 'community', 'entertainment'],
    accent: '#27ae60',
    serverName: 'Sports Zone',
    categories: [
      {
        name: '📢 INFO',
        channels: [
          { name: 'announcements', type: 'text' },
          { name: 'rules', type: 'text' },
          { name: 'schedule', type: 'text' }
        ]
      },
      {
        name: '⚽ SPORTS',
        channels: [
          { name: 'match-discussion', type: 'text' },
          { name: 'highlights', type: 'text' },
          { name: 'predictions', type: 'text' },
          { name: 'stats', type: 'text' },
          { name: 'transfers', type: 'text' }
        ]
      },
      {
        name: '💬 COMMUNITY',
        channels: [
          { name: 'general', type: 'text' },
          { name: 'off-topic', type: 'text' },
          { name: 'memes', type: 'text' },
          { name: 'fantasy-league', type: 'text' }
        ]
      },
      {
        name: '🔊 VOICE',
        channels: [
          { name: 'Match Day', type: 'voice' },
          { name: 'General', type: 'voice' },
          { name: 'AFK', type: 'voice' }
        ]
      }
    ],
    roles: [
      { name: 'Owner',      color: '#f1c40f', permissions: { administrator: true, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: true } },
      { name: 'Mod',        color: '#27ae60', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: true, connect: true, manageChannels: false } },
      { name: 'Fan',        color: '#3498db', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } },
      { name: 'New Member', color: '#95a5a6', permissions: { administrator: false, viewChannels: true, sendMessages: true, manageMessages: false, connect: true, manageChannels: false } }
    ]
  },

  // ══════════════════════════════════════════════════════
  {
    id: 'blank',
    name: 'Blank Template',
    icon: '📄',
    description: 'Start completely fresh. No categories, no channels, no roles — a clean slate.',
    tags: ['blank', 'custom'],
    accent: '#5c5f77',
    serverName: 'New Server',
    categories: [],
    roles: []
  }
];
