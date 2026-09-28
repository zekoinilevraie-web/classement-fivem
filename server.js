const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to extract user from x-user-id header
function authMiddleware(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (userId) {
    const user = db.getUserById(userId);
    if (user) {
      req.user = user;
    }
  }
  next();
}

app.use(authMiddleware);

// --- Auth Routes ---
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Identifiant et mot de passe requis' });
  }

  const user = db.getUserByCredentials(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  const { password: _, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

// ==========================================
// DISCORD OAUTH2 & ROLE VERIFICATION ROUTES
// ==========================================

function getEffectiveRedirectUri(req, cfg) {
  if (process.env.APP_URL) {
    return `${process.env.APP_URL.replace(/\/$/, '')}/api/auth/discord/callback`;
  }
  if (cfg && cfg.redirectUri && !cfg.redirectUri.includes('localhost')) {
    return cfg.redirectUri;
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}/api/auth/discord/callback`;
}

// Get OAuth URL or status
app.get('/api/auth/discord/url', (req, res) => {
  const cfg = db.getDiscordConfig();
  const isConfigured = !!(cfg.clientId && cfg.clientSecret);
  
  if (!isConfigured) {
    return res.json({
      isConfigured: false,
      message: 'Discord OAuth n\'est pas encore configuré avec un Client ID.'
    });
  }

  const effectiveUri = getEffectiveRedirectUri(req, cfg);
  const redirectUri = encodeURIComponent(effectiveUri);
  const scope = encodeURIComponent('identify guilds guilds.members.read');
  const url = `https://discord.com/api/oauth2/authorize?client_id=${cfg.clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;

  res.json({
    isConfigured: true,
    url
  });
});

// Discord OAuth Callback
app.get('/api/auth/discord/callback', async (req, res) => {
  const { code } = req.query;
  const cfg = db.getDiscordConfig();

  if (!code) {
    return res.redirect('/index.html?error=code_missing');
  }

  try {
    const effectiveUri = getEffectiveRedirectUri(req, cfg);
    // 1. Exchange code for access token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: effectiveUri
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Discord OAuth Token Error:', tokenData);
      return res.redirect('/index.html?error=discord_token_failed');
    }

    // 2. Fetch User Identity
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const discordUser = await userRes.json();

    // 3. Fetch Member Roles in the configured Guild
    let memberRoles = [];
    if (cfg.guildId) {
      try {
        let roleIds = [];
        // Try user guild member endpoint
        const memberRes = await fetch(`https://discord.com/api/users/@me/guilds/${cfg.guildId}/member`, {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        if (memberRes.ok) {
          const memberData = await memberRes.json();
          roleIds = memberData.roles || [];
          if (memberData.nick) {
            memberRoles.push(memberData.nick);
          }
        } else if (cfg.botToken) {
          // Fallback to bot token query
          const botRes = await fetch(`https://discord.com/api/guilds/${cfg.guildId}/members/${discordUser.id}`, {
            headers: { Authorization: `Bot ${cfg.botToken}` }
          });
          if (botRes.ok) {
            const memberData = await botRes.json();
            roleIds = memberData.roles || [];
            if (memberData.nick) {
              memberRoles.push(memberData.nick);
            }
          }
        }

        // If bot token is available, resolve role IDs to actual role names
        memberRoles = [...memberRoles, ...roleIds];
        if (cfg.botToken && roleIds.length > 0) {
          try {
            const guildRolesRes = await fetch(`https://discord.com/api/guilds/${cfg.guildId}/roles`, {
              headers: { Authorization: `Bot ${cfg.botToken}` }
            });
            if (guildRolesRes.ok) {
              const guildRoles = await guildRolesRes.json();
              const roleMap = new Map(guildRoles.map(r => [r.id, r.name]));
              for (const id of roleIds) {
                const name = roleMap.get(id);
                if (name) memberRoles.push(name);
              }
            }
          } catch (rErr) {
            console.warn('Could not fetch guild roles names:', rErr.message);
          }
        }
      } catch (err) {
        console.error('Error fetching guild member roles:', err);
      }
    }

    // 4. Resolve session using database mapping
    const resolved = db.resolveDiscordUserSession(discordUser, memberRoles);

    // Redirect to frontend with successful authentication
    res.redirect(`/index.html?discord_auth=success&uid=${encodeURIComponent(resolved.user.id)}`);
  } catch (err) {
    console.error('Discord OAuth Callback Exception:', err);
    res.redirect(`/index.html?error=${encodeURIComponent(err.message)}`);
  }
});

// Self-select or link enterprise for Discord authenticated users (when bot is not present on Discord)
app.post('/api/auth/discord/select-enterprise', (req, res) => {
  if (!req.user || req.user.authProvider !== 'discord') {
    return res.status(401).json({ error: 'Connexion Discord requise' });
  }
  const { statusRole, enterpriseId } = req.body;
  const ent = db.data.enterprises.find(e => e.id === enterpriseId);
  if (!ent) return res.status(400).json({ error: 'Entreprise introuvable' });

  const isCoPatron = statusRole && statusRole.toLowerCase().includes('co');
  const roleTitle = isCoPatron ? 'Co-Patron(e)' : 'Patron(e)';
  const icon = isCoPatron ? '🤝' : '👑';

  req.user.role = 'patron';
  req.user.enterpriseAccess = ent.id;
  req.user.categoryAccess = ent.categoryId;
  req.user.matchedDiscordRole = `${icon} ${roleTitle} ${ent.name}`;
  const baseName = req.user.displayName.replace(/\(.*?\)/g, '').trim();
  req.user.displayName = `${req.user.matchedDiscordRole} (${baseName || req.user.username})`;

  db.save();
  res.json({ success: true, user: req.user });
});

// Discord OAuth Simulator / Quick Test Mode (for immediate testing of Patron + Enterprise dual roles)
app.post('/api/auth/discord/simulate', (req, res) => {
  const { roleName, roles, statusRole, enterpriseRole, username, discordId } = req.body;

  let rolesToTest = [];
  if (Array.isArray(roles) && roles.length > 0) {
    rolesToTest = roles;
  } else if (statusRole || enterpriseRole) {
    if (statusRole) rolesToTest.push(statusRole);
    if (enterpriseRole) rolesToTest.push(enterpriseRole);
  } else if (roleName) {
    if (roleName.includes('+')) {
      rolesToTest = roleName.split('+').map(s => s.trim());
    } else {
      rolesToTest = [roleName];
    }
  }

  if (rolesToTest.length === 0) {
    return res.status(400).json({ error: 'Rôle Discord requis pour la simulation' });
  }

  // Prevent simulating Fondateur or Admin publicly
  const hasForbidden = rolesToTest.some(r => {
    const nr = r.toLowerCase();
    return nr.includes('fondateur') || nr.includes('staff') || nr.includes('admin');
  });
  if (hasForbidden && (!req.user || req.user.role !== 'fondateur')) {
    return res.status(403).json({ error: 'Le rôle Fondateur ne peut pas être simulé publiquement' });
  }

  const roleLabel = rolesToTest.join(' + ');
  const simulatedDiscordUser = {
    id: discordId || 'sim_' + Date.now(),
    username: username || ('dc_' + roleLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')),
    global_name: `${username || 'Citoyen Discord'} [${roleLabel}]`,
    avatar: null
  };

  const resolved = db.resolveDiscordUserSession(simulatedDiscordUser, rolesToTest);
  res.json({
    success: true,
    user: resolved.user,
    matchedRole: resolved.matchedRole,
    enterprise: resolved.enterprise,
    category: resolved.category
  });
});

// Admin Discord Configuration
app.get('/api/discord/config', (req, res) => {
  if (!req.user || req.user.role !== 'fondateur') {
    return res.status(403).json({ error: 'Accès réservé au Fondateur' });
  }
  res.json(db.getDiscordConfig());
});

app.post('/api/discord/config', (req, res) => {
  if (!req.user || req.user.role !== 'fondateur') {
    return res.status(403).json({ error: 'Accès réservé au Fondateur' });
  }
  const updated = db.saveDiscordConfig(req.body);
  res.json({ success: true, config: updated });
});

// Admin Discord Role Mappings
app.get('/api/discord/mappings', (req, res) => {
  if (!req.user || req.user.role !== 'fondateur') {
    return res.status(403).json({ error: 'Accès réservé au Fondateur' });
  }
  res.json(db.getDiscordRoleMappings());
});

app.post('/api/discord/mappings', (req, res) => {
  if (!req.user || req.user.role !== 'fondateur') {
    return res.status(403).json({ error: 'Accès réservé au Fondateur' });
  }
  try {
    const saved = db.saveDiscordRoleMapping(req.body);
    res.json({ success: true, mapping: saved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/discord/mappings/:id', (req, res) => {
  if (!req.user || req.user.role !== 'fondateur') {
    return res.status(403).json({ error: 'Accès réservé au Fondateur' });
  }
  try {
    db.deleteDiscordRoleMapping(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Categories & Enterprises ---
app.get('/api/categories', (req, res) => {
  const categories = db.getCategories(req.user);
  res.json(categories);
});

app.get('/api/enterprises', (req, res) => {
  const enterprises = db.getEnterprises(req.user);
  res.json(enterprises);
});

// --- Weeks ---
app.get('/api/weeks', (req, res) => {
  res.json(db.getWeeks());
});

app.post('/api/weeks', (req, res) => {
  if (!req.user || req.user.role !== 'fondateur') {
    return res.status(403).json({ error: 'Accès réservé au Fondateur' });
  }
  const { title, startDate, endDate, setActive } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Le titre de la semaine est obligatoire' });
  }
  const week = db.createWeek(title, startDate, endDate, setActive !== false);
  res.json(week);
});

app.post('/api/weeks/set-active', (req, res) => {
  if (!req.user || req.user.role !== 'fondateur') {
    return res.status(403).json({ error: 'Accès réservé au Fondateur' });
  }
  const { weekId } = req.body;
  try {
    const updated = db.setActiveWeek(weekId);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Reports & Rankings ---
app.get('/api/reports', (req, res) => {
  const { weekId } = req.query;
  const reports = db.getReports(weekId, req.user);
  res.json(reports);
});

app.post('/api/reports', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Veuillez vous connecter pour enregistrer un rapport' });
  }

  try {
    const saved = db.saveReport(req.body, req.user);
    res.json({ success: true, report: saved });
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/reports/:id/award', (req, res) => {
  if (!req.user || req.user.role !== 'fondateur') {
    return res.status(403).json({ error: 'Seul le Fondateur peut décerner des distinctions et félicitations' });
  }

  const { badge, comment } = req.body;
  try {
    const updated = db.validateAndAwardReport(req.params.id, badge, comment);
    res.json({ success: true, report: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Founder User Management ---
app.get('/api/users', (req, res) => {
  if (!req.user || req.user.role !== 'fondateur') {
    return res.status(403).json({ error: 'Accès réservé au Fondateur' });
  }
  res.json(db.getUsers());
});

app.post('/api/users', (req, res) => {
  if (!req.user || req.user.role !== 'fondateur') {
    return res.status(403).json({ error: 'Accès réservé au Fondateur' });
  }
  try {
    const saved = db.saveUser(req.body);
    res.json({ success: true, user: saved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  if (!req.user || req.user.role !== 'fondateur') {
    return res.status(403).json({ error: 'Accès réservé au Fondateur' });
  }
  try {
    db.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Enterprise Management ---
app.post('/api/enterprises', (req, res) => {
  if (!req.user || req.user.role !== 'fondateur') {
    return res.status(403).json({ error: 'Accès réservé au Fondateur' });
  }
  const { name, categoryId, defaultBoss, logoText } = req.body;
  if (!name || !categoryId) {
    return res.status(400).json({ error: 'Nom et catégorie requis' });
  }
  try {
    const ent = db.addEnterprise(name, categoryId, defaultBoss, logoText);
    res.json({ success: true, enterprise: ent });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Stats & Overview ---
app.get('/api/stats', (req, res) => {
  const { weekId } = req.query;
  const reports = db.getReports(weekId, req.user);
  const enterprises = db.getEnterprises(req.user);

  let totalTurnover = 0;
  let totalExpenses = 0;
  let totalNetProfit = 0;
  let totalEmployees = 0;
  let totalEvents = 0;

  reports.forEach(r => {
    totalTurnover += Number(r.turnover) || 0;
    totalExpenses += Number(r.expenses) || 0;
    totalNetProfit += Number(r.netProfit !== undefined ? r.netProfit : (r.turnover - (r.expenses || 0))) || 0;
    totalEmployees += Number(r.employeeCount) || 0;
    if (r.events && Array.isArray(r.events)) {
      totalEvents += r.events.length;
    }
  });

  res.json({
    totalTurnover,
    totalExpenses,
    totalNetProfit,
    totalEmployees,
    totalEvents,
    enterprisesReportedCount: reports.length,
    totalEnterprisesCount: enterprises.length
  });
});

// --- Discord Export ---
app.get('/api/export/discord', (req, res) => {
  const { weekId } = req.query;
  const week = db.getWeeks().find(w => w.id === weekId) || db.getActiveWeek();
  const reports = db.data.reports.filter(r => r.weekId === week.id);
  const categories = db.data.categories;
  const enterprises = db.data.enterprises;

  let md = `🏆 **BILAN HEBDOMADAIRE DES ENTREPRISES - ${week.title.toUpperCase()}** 🏆\n`;
  md += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  const sortedReports = [...reports].sort((a, b) => (b.turnover || 0) - (a.turnover || 0));

  let totalCityCA = 0;
  let totalCityProfit = 0;
  let totalEmployees = 0;
  let totalEvents = 0;

  reports.forEach(r => {
    totalCityCA += Number(r.turnover) || 0;
    totalCityProfit += Number(r.netProfit !== undefined ? r.netProfit : (r.turnover - (r.expenses || 0))) || 0;
    totalEmployees += Number(r.employeeCount) || 0;
    if (r.events) totalEvents += r.events.length;
  });

  md += `📊 **STATISTIQUES GLOBALES :**\n`;
  md += `💰 **Chiffre d'Affaires Global :** ${totalCityCA.toLocaleString('fr-FR')} $\n`;
  md += `📈 **Bénéfice Net Total Cumulé :** ${totalCityProfit.toLocaleString('fr-FR')} $\n`;
  md += `👥 **Salariés Actifs Déclarés :** ${totalEmployees}\n`;
  md += `🎉 **Événements Organisés :** ${totalEvents}\n`;
  md += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (sortedReports.length > 0) {
    md += `👑 **PODIUM DE LA SEMAINE :**\n`;
    const medals = ['🥇 1ère Place', '🥈 2ème Place', '🥉 3ème Place'];
    sortedReports.slice(0, 3).forEach((r, idx) => {
      const ent = enterprises.find(e => e.id === r.enterpriseId);
      const profit = r.netProfit !== undefined ? r.netProfit : (r.turnover - (r.expenses || 0));
      md += `${medals[idx]} : **${ent ? ent.name : r.enterpriseId}** - CA: ${Number(r.turnover).toLocaleString('fr-FR')} $ (Bénéfice: ${Number(profit).toLocaleString('fr-FR')} $) | ${r.employeeCount} employés\n`;
      if (r.founderComment) {
        md += `  ↳ *Message du Fondateur : "${r.founderComment}"*\n`;
      }
    });
    md += `\n`;
  }

  categories.forEach(cat => {
    const catReports = sortedReports.filter(r => r.categoryId === cat.id);
    if (catReports.length > 0) {
      md += `📁 **${cat.name.toUpperCase()}**\n`;
      catReports.forEach(r => {
        const ent = enterprises.find(e => e.id === r.enterpriseId);
        const badge = r.badge ? ` [${r.badge}]` : '';
        const profit = r.netProfit !== undefined ? r.netProfit : (r.turnover - (r.expenses || 0));
        md += `• **${ent ? ent.name : r.enterpriseId}** : CA ${Number(r.turnover).toLocaleString('fr-FR')} $ | Bénéfice Net ${Number(profit).toLocaleString('fr-FR')} $ | Patron: ${r.bossName}${badge}\n`;
        if (r.events && r.events.length > 0) {
          r.events.forEach(ev => {
            md += `    ▫️ *${ev.title}* (${ev.participants || 0} participants)\n`;
          });
        }
      });
      md += `\n`;
    }
  });

  md += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  md += `*Généré automatiquement par le Portail Officiel du Fondateur*\n`;

  res.json({ markdown: md });
});

app.listen(PORT, () => {
  console.log(`Serveur Classement Entreprise démarré sur http://localhost:${PORT}`);
});
