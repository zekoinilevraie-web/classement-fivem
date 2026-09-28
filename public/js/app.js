// Main Application Controller for Los Santos Enterprise Ranking System

const State = {
  currentUser: null,
  activeWeekId: null,
  selectedCategory: 'all', // 'all' or categoryId
  searchQuery: '',
  sortBy: 'ca_desc',
  viewMode: 'grid', // 'grid' or 'table'
  
  categories: [],
  enterprises: [],
  weeks: [],
  reports: [],
  stats: null,

  // Founder Simulation State (lets founder view as a specific referent)
  simulatedCategory: null
};

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  await initSession();
  setupGlobalEventListeners();
  await loadWeeksAndInitialData();
});

async function initSession() {
  // Check if returning from Discord OAuth redirect
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('discord_auth') === 'success' && urlParams.get('uid')) {
    const userStub = { id: urlParams.get('uid') };
    API.setStoredUser(userStub);
    try {
      const fullUser = await API.getMe();
      State.currentUser = fullUser;
      window.history.replaceState({}, document.title, window.location.pathname);
      Components.showToast(`Authentification Discord réussie ! Rôle détecté : ${fullUser.matchedDiscordRole || fullUser.displayName}`, 'gold');
    } catch {
      // Fallback
    }
  }

  let user = API.getStoredUser();
  if (!user) {
    // Attempt auto-login as Fondateur by default for effortless first run
    try {
      user = await API.login('fondateur', 'admin');
    } catch {
      // If login fails, prompt modal
      openModal('modalLogin');
      return;
    }
  }

  State.currentUser = user;
  updateUserUI();
}

function updateUserUI() {
  const user = State.currentUser;
  if (!user) return;

  const isFounder = user.role === 'fondateur';
  const displayName = document.getElementById('userDisplayName');
  const roleBadge = document.getElementById('userRoleBadge');
  const dropdownUsername = document.getElementById('dropdownUsername');
  const dropdownAccess = document.getElementById('dropdownAccess');
  const adminBtn = document.getElementById('btnAdminPanel');
  const founderSimBar = document.getElementById('founderSimBar');
  const isolationNotice = document.getElementById('categoryIsolationNotice');
  const discordNotice = document.getElementById('discordStatusBanner');
  const discordRoleNotice = document.getElementById('discordRoleNotice');
  const userAvatar = document.getElementById('userAvatar');

  if (displayName) displayName.textContent = user.displayName;
  if (dropdownUsername) dropdownUsername.textContent = `@${user.username}`;

  // Avatar handling (Discord or default)
  if (userAvatar) {
    if (user.avatar && user.avatar.startsWith('http')) {
      userAvatar.innerHTML = `<img src="${user.avatar}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`;
    } else if (isFounder) {
      userAvatar.innerHTML = '👑';
    } else {
      userAvatar.innerHTML = '👤';
    }
  }

  // Discord Banner
  if (user.authProvider === 'discord') {
    if (discordNotice) discordNotice.classList.remove('hidden');
    if (discordRoleNotice) {
      if (!user.enterpriseAccess && user.role !== 'fondateur') {
        discordRoleNotice.innerHTML = `Membre Discord Certifié &bull; <button type="button" class="btn btn-sm btn-primary" id="btnTriggerClaim" style="margin-left: 8px; font-size: 0.72rem; padding: 3px 10px; cursor: pointer;"><i class="fa-solid fa-link"></i> Lier mon Entreprise</button>`;
        document.getElementById('btnTriggerClaim')?.addEventListener('click', openClaimModal);
      } else {
        discordRoleNotice.textContent = user.matchedDiscordRole || 'Lead Discord';
      }
    }
  } else {
    if (discordNotice) discordNotice.classList.add('hidden');
  }

  if (isFounder) {
    if (roleBadge) {
      roleBadge.textContent = 'Fondateur (SuperAdmin)';
      roleBadge.className = 'user-role-badge text-gold';
    }
    if (dropdownAccess) dropdownAccess.textContent = 'Accès : Tout le serveur';
    if (adminBtn) adminBtn.classList.remove('hidden');
    if (founderSimBar) founderSimBar.classList.remove('hidden');
    if (isolationNotice) isolationNotice.classList.add('hidden');
  } else {
    // Referent or Enterprise Patron Role
    if (roleBadge) {
      if (user.authProvider === 'discord') {
        roleBadge.textContent = `Discord : ${user.matchedDiscordRole || 'Vérifié'}`;
        roleBadge.className = 'user-role-badge text-blue';
      } else {
        roleBadge.textContent = user.role === 'patron' ? 'Patron d\'Entreprise' : 'Référent de Secteur';
        roleBadge.className = 'user-role-badge text-blue';
      }
    }
    if (dropdownAccess) {
      const catObj = State.categories.find(c => c.id === user.categoryAccess);
      const entObj = State.enterprises.find(e => e.id === user.enterpriseAccess);
      if (entObj) {
        dropdownAccess.textContent = `Accès : ${entObj.name} (${catObj ? catObj.name : ''})`;
      } else {
        dropdownAccess.textContent = `Accès secteur : ${catObj ? catObj.name : user.categoryAccess}`;
      }
    }
    if (adminBtn) adminBtn.classList.add('hidden');
    if (founderSimBar) founderSimBar.classList.add('hidden');

    // Enable Isolation notice
    if (isolationNotice) {
      isolationNotice.classList.remove('hidden');
      const catObj = State.categories.find(c => c.id === user.categoryAccess);
      const entObj = State.enterprises.find(e => e.id === user.enterpriseAccess);
      const span = document.getElementById('isolatedCategoryName');
      if (span) {
        span.textContent = entObj ? `${entObj.name} [${catObj ? catObj.name : ''}]` : (catObj ? catObj.name : user.categoryAccess);
      }
    }

    // Force selection of isolated category
    State.selectedCategory = user.categoryAccess;
  }
}

// ==========================================================================
// DATA LOADING
// ==========================================================================
async function loadWeeksAndInitialData() {
  try {
    const weeks = await API.getWeeks();
    State.weeks = weeks;

    const select = document.getElementById('weekSelect');
    select.innerHTML = '';
    weeks.forEach(w => {
      const opt = document.createElement('option');
      opt.value = w.id;
      opt.textContent = w.title + (w.isActive ? ' (En cours)' : '');
      if (w.isActive) opt.selected = true;
      select.appendChild(opt);
    });

    const activeWeek = weeks.find(w => w.isActive) || weeks[0];
    State.activeWeekId = activeWeek ? activeWeek.id : null;

    await refreshAllData();
  } catch (err) {
    Components.showToast('Erreur lors du chargement initial : ' + err.message, 'error');
  }
}

async function refreshAllData() {
  try {
    const [categories, enterprises, reports, stats] = await Promise.all([
      API.getCategories(),
      API.getEnterprises(),
      API.getReports(State.activeWeekId),
      API.getStats(State.activeWeekId)
    ]);

    State.categories = categories;
    State.enterprises = enterprises;
    State.reports = reports;
    State.stats = stats;

    // Check isolation logic
    const user = State.currentUser;
    const isSimulating = State.simulatedCategory !== null;

    if (user && user.role !== 'fondateur') {
      State.selectedCategory = user.categoryAccess;
    } else if (isSimulating) {
      State.selectedCategory = State.simulatedCategory;
    }

    renderCategoryTabs();
    renderOverviewStats();
    renderLeaderboardAndPodium();
    renderEventsFeed();
  } catch (err) {
    Components.showToast('Erreur lors de la synchronisation : ' + err.message, 'error');
  }
}

// ==========================================================================
// RENDERERS
// ==========================================================================

function renderOverviewStats() {
  let reports = State.reports;
  let enterprises = State.enterprises;

  if (State.selectedCategory && State.selectedCategory !== 'all') {
    reports = reports.filter(r => r.categoryId === State.selectedCategory);
    enterprises = enterprises.filter(e => e.categoryId === State.selectedCategory);
  }

  let totalCA = 0;
  let totalNetProfit = 0;
  let totalEmployees = 0;
  let totalEvents = 0;

  reports.forEach(r => {
    totalCA += Number(r.turnover) || 0;
    totalNetProfit += Number(r.netProfit !== undefined ? r.netProfit : (r.turnover - (r.expenses || 0))) || 0;
    totalEmployees += Number(r.employeeCount) || 0;
    if (r.events && Array.isArray(r.events)) {
      totalEvents += r.events.length;
    }
  });

  const statTotalCA = document.getElementById('statTotalCA');
  const statTotalEmployees = document.getElementById('statTotalEmployees');
  const statTotalEvents = document.getElementById('statTotalEvents');
  const statReportsCount = document.getElementById('statReportsCount');
  const statCAHint = document.getElementById('statCAHint');

  if (statTotalCA) statTotalCA.textContent = Components.formatMoney(totalCA);
  if (statTotalEmployees) statTotalEmployees.textContent = Components.formatNumber(totalEmployees);
  if (statTotalEvents) statTotalEvents.textContent = Components.formatNumber(totalEvents);
  if (statReportsCount) statReportsCount.textContent = `${reports.length} / ${enterprises.length}`;

  if (statCAHint) {
    const profitFmt = Components.formatMoney(totalNetProfit);
    statCAHint.innerHTML = `Bénéfice net global : <strong class="text-green">${profitFmt}</strong>`;
  }
}

function renderCategoryTabs() {
  const container = document.getElementById('categoryTabsContainer');
  if (!container) return;

  const user = State.currentUser;
  const isFounder = user && user.role === 'fondateur';
  const isSimulating = State.simulatedCategory !== null;

  container.innerHTML = '';

  if (isFounder && !isSimulating) {
    const allBtn = document.createElement('button');
    allBtn.className = `cat-tab-btn ${State.selectedCategory === 'all' ? 'active' : ''}`;
    allBtn.style.setProperty('--cat-accent-color', 'var(--gold)');
    allBtn.innerHTML = `
      <i class="fa-solid fa-trophy"></i>
      <span>Vue Globale (Toutes)</span>
      <span class="cat-tab-badge">${State.enterprises.length}</span>
    `;
    allBtn.addEventListener('click', () => {
      State.selectedCategory = 'all';
      renderCategoryTabs();
      renderOverviewStats();
      renderLeaderboardAndPodium();
      renderEventsFeed();
    });
    container.appendChild(allBtn);
  }

  let allowedCategories = State.categories;
  if (!isFounder) {
    allowedCategories = State.categories.filter(c => c.id === user.categoryAccess);
  } else if (isSimulating) {
    allowedCategories = State.categories.filter(c => c.id === State.simulatedCategory);
  }

  allowedCategories.forEach(cat => {
    const count = State.enterprises.filter(e => e.categoryId === cat.id).length;
    const btn = document.createElement('button');
    const isActive = State.selectedCategory === cat.id;
    btn.className = `cat-tab-btn ${isActive ? 'active' : ''}`;
    btn.style.setProperty('--cat-accent-color', cat.color);
    btn.innerHTML = `
      <i class="fa-solid ${cat.icon}"></i>
      <span>${cat.name}</span>
      <span class="cat-tab-badge">${count}</span>
    `;

    btn.addEventListener('click', () => {
      State.selectedCategory = cat.id;
      renderCategoryTabs();
      renderOverviewStats();
      renderLeaderboardAndPodium();
      renderEventsFeed();
    });

    container.appendChild(btn);
  });
}

function getRankedEnterprises() {
  let list = State.enterprises.map(ent => {
    const rep = State.reports.find(r => r.enterpriseId === ent.id);
    const cat = State.categories.find(c => c.id === ent.categoryId);
    return {
      enterprise: ent,
      report: rep || null,
      category: cat || null
    };
  });

  // Filter by category
  if (State.selectedCategory && State.selectedCategory !== 'all') {
    list = list.filter(item => item.enterprise.categoryId === State.selectedCategory);
  }

  // Filter by enterprise access if role is patron
  const user = State.currentUser;
  if (user && user.role === 'patron' && user.enterpriseAccess) {
    // Put user's enterprise first
    list.sort((a, b) => {
      if (a.enterprise.id === user.enterpriseAccess) return -1;
      if (b.enterprise.id === user.enterpriseAccess) return 1;
      return 0;
    });
  }

  // Filter by search query
  if (State.searchQuery.trim()) {
    const q = State.searchQuery.toLowerCase();
    list = list.filter(item => {
      const nameMatch = item.enterprise.name.toLowerCase().includes(q);
      const bossMatch = item.report && item.report.bossName.toLowerCase().includes(q);
      const catMatch = item.category && item.category.name.toLowerCase().includes(q);
      return nameMatch || bossMatch || catMatch;
    });
  }

  // Sort
  list.sort((a, b) => {
    const aRep = a.report;
    const bRep = b.report;

    if (State.sortBy === 'ca_desc') {
      const caA = aRep ? Number(aRep.turnover) : -1;
      const caB = bRep ? Number(bRep.turnover) : -1;
      return caB - caA;
    }
    if (State.sortBy === 'events_desc') {
      const evA = (aRep && aRep.events) ? aRep.events.length : -1;
      const evB = (bRep && bRep.events) ? bRep.events.length : -1;
      return evB - evA;
    }
    if (State.sortBy === 'employees_desc') {
      const empA = aRep ? Number(aRep.employeeCount) : -1;
      const empB = bRep ? Number(bRep.employeeCount) : -1;
      return empB - empA;
    }
    if (State.sortBy === 'name_asc') {
      return a.enterprise.name.localeCompare(b.enterprise.name);
    }
    return 0;
  });

  return list;
}

function renderLeaderboardAndPodium() {
  const ranked = getRankedEnterprises();
  const user = State.currentUser;
  const isFounder = user && user.role === 'fondateur' && State.simulatedCategory === null;

  // Podium
  const topThreeWithReports = ranked.filter(item => item.report && Number(item.report.turnover) > 0).slice(0, 3);
  Components.renderPodium(topThreeWithReports, State.categories, openEnterpriseDetails);

  // Update counts badge
  const heading = document.getElementById('rankingHeading');
  const countBadge = document.getElementById('rankingCountBadge');
  if (countBadge) countBadge.textContent = `${ranked.length} Entreprise(s)`;

  if (heading) {
    if (State.selectedCategory === 'all') {
      heading.innerHTML = `<i class="fa-solid fa-ranking-star text-gold"></i> Classement Général & Bénéfices des Entreprises`;
    } else {
      const catObj = State.categories.find(c => c.id === State.selectedCategory);
      heading.innerHTML = `<i class="fa-solid ${catObj?.icon || 'fa-ranking-star'}" style="color: ${catObj?.color || '#f59e0b'};"></i> Secteur : ${catObj ? catObj.name : ''}`;
    }
  }

  // Grid container
  const gridContainer = document.getElementById('enterprisesGrid');
  gridContainer.innerHTML = '';

  // Table body
  const tableBody = document.getElementById('enterprisesTableBody');
  tableBody.innerHTML = '';

  ranked.forEach((item, index) => {
    const rank = index + 1;
    const canEdit = isUserAuthorizedToEdit(item.enterprise.categoryId, item.enterprise.id);

    const card = Components.createEnterpriseCard(
      item,
      rank,
      isFounder,
      canEdit,
      openEnterpriseDetails,
      openEditReportModal,
      openAwardModal
    );
    gridContainer.appendChild(card);

    const row = Components.createEnterpriseTableRow(
      item,
      rank,
      isFounder,
      canEdit,
      openEnterpriseDetails,
      openEditReportModal,
      openAwardModal
    );
    tableBody.appendChild(row);
  });
}

function renderEventsFeed() {
  const container = document.getElementById('eventsFeedContainer');
  if (!container) return;
  container.innerHTML = '';

  let reports = State.reports;
  if (State.selectedCategory && State.selectedCategory !== 'all') {
    reports = reports.filter(r => r.categoryId === State.selectedCategory);
  }

  const allEvents = [];
  reports.forEach(r => {
    if (r.events && Array.isArray(r.events)) {
      const ent = State.enterprises.find(e => e.id === r.enterpriseId);
      const cat = State.categories.find(c => c.id === r.categoryId);
      r.events.forEach(ev => {
        allEvents.push({
          event: ev,
          enterpriseName: ent ? ent.name : r.enterpriseId,
          catColor: cat ? cat.color : '#f59e0b'
        });
      });
    }
  });

  if (allEvents.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="fa-solid fa-champagne-glasses text-pink" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
        <p>Aucun événement n'a encore été renseigné dans les bilans de cette semaine.</p>
      </div>
    `;
    return;
  }

  allEvents.forEach(item => {
    const card = Components.createEventCard(item.event, item.enterpriseName, item.catColor);
    container.appendChild(card);
  });
}

function isUserAuthorizedToEdit(categoryId, enterpriseId) {
  const user = State.currentUser;
  if (!user) return false;
  if (user.role === 'fondateur') return true;
  if (user.role === 'patron' && user.enterpriseAccess === enterpriseId) return true;
  if (user.role === 'referent' && user.categoryAccess === categoryId) return true;
  return false;
}

// ==========================================================================
// MODALS LOGIC
// ==========================================================================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

function openClaimModal() {
  const select = document.getElementById('claimEnterpriseSelect');
  if (!select) return;
  select.innerHTML = '';

  State.categories.forEach(cat => {
    const ents = State.enterprises.filter(e => e.categoryId === cat.id);
    if (ents.length === 0) return;
    const group = document.createElement('optgroup');
    group.label = `${cat.name}`;
    ents.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = `${e.name}`;
      group.appendChild(opt);
    });
    select.appendChild(group);
  });

  openModal('modalClaimEnterprise');
}

// 1. Report Modal
function openEditReportModal(enterpriseId = null) {
  const user = State.currentUser;
  if (!user) {
    openModal('modalLogin');
    return;
  }

  const select = document.getElementById('reportEnterpriseSelect');
  select.innerHTML = '';

  let allowed = State.enterprises;
  if (user.role === 'patron' && user.enterpriseAccess) {
    allowed = allowed.filter(e => e.id === user.enterpriseAccess);
  } else if (user.role === 'referent' && user.categoryAccess) {
    allowed = allowed.filter(e => e.categoryId === user.categoryAccess);
  }

  allowed.forEach(ent => {
    const opt = document.createElement('option');
    opt.value = ent.id;
    opt.textContent = ent.name;
    if (enterpriseId && ent.id === enterpriseId) opt.selected = true;
    select.appendChild(opt);
  });

  const activeWeek = State.weeks.find(w => w.id === State.activeWeekId);
  document.getElementById('reportWeekDisplay').value = activeWeek ? activeWeek.title : '';

  fillReportFormData(select.value);

  select.onchange = () => {
    fillReportFormData(select.value);
  };

  openModal('modalReport');
}

function updateProfitPreview() {
  const ca = Number(document.getElementById('reportTurnover')?.value) || 0;
  const exp = Number(document.getElementById('reportExpenses')?.value) || 0;
  const profit = ca - exp;
  const profitInput = document.getElementById('reportNetProfit');
  const help = document.getElementById('profitPreviewHelp');

  if (profitInput) profitInput.value = profit;
  if (help) {
    const margin = ca > 0 ? ((profit / ca) * 100).toFixed(1) : 0;
    if (profit >= 0) {
      help.innerHTML = `Bénéfice Net : <strong class="text-green">+${Components.formatMoney(profit)}</strong> (Marge : ${margin} %)`;
      help.className = 'form-help text-green';
    } else {
      help.innerHTML = `Déficit Net : <strong class="text-red">${Components.formatMoney(profit)}</strong> (Marge négative)`;
      help.className = 'form-help text-red';
    }
  }
}

function fillReportFormData(entId) {
  const existingReport = State.reports.find(r => r.enterpriseId === entId && r.weekId === State.activeWeekId);
  const ent = State.enterprises.find(e => e.id === entId);

  const builder = document.getElementById('eventsBuilderList');
  builder.innerHTML = '';

  if (existingReport) {
    document.getElementById('reportTurnover').value = existingReport.turnover || '';
    document.getElementById('reportExpenses').value = existingReport.expenses !== undefined ? existingReport.expenses : '';
    document.getElementById('reportNetProfit').value = existingReport.netProfit !== undefined ? existingReport.netProfit : (existingReport.turnover - (existingReport.expenses || 0));
    document.getElementById('reportEmployees').value = existingReport.employeeCount || '';
    document.getElementById('reportBossName').value = existingReport.bossName || '';
    document.getElementById('reportNotes').value = existingReport.notes || '';

    if (existingReport.events && existingReport.events.length > 0) {
      existingReport.events.forEach(ev => {
        builder.appendChild(Components.createEventBuilderRow(ev));
      });
    }
  } else {
    document.getElementById('reportTurnover').value = '';
    document.getElementById('reportExpenses').value = '';
    document.getElementById('reportNetProfit').value = '';
    document.getElementById('reportEmployees').value = '';
    document.getElementById('reportBossName').value = ent?.defaultBoss || '';
    document.getElementById('reportNotes').value = '';
  }

  updateProfitPreview();
  const count = builder.querySelectorAll('.builder-row').length;
  document.getElementById('eventCountBadge').textContent = `${count} événement(s)`;
}

// 2. Award Modal
function openAwardModal(reportId, enterpriseName) {
  document.getElementById('awardReportId').value = reportId;
  document.getElementById('awardModalTargetName').textContent = `Félicitations pour : ${enterpriseName}`;
  
  const report = State.reports.find(r => r.id === reportId);
  if (report) {
    document.getElementById('awardBadgeSelect').value = report.badge || '🏆 Entreprise de la Semaine';
    document.getElementById('awardComment').value = report.founderComment || '';
  }

  openModal('modalAward');
}

// 3. Details Dossier Modal
function openEnterpriseDetails(enterpriseId) {
  const ent = State.enterprises.find(e => e.id === enterpriseId);
  if (!ent) return;

  const cat = State.categories.find(c => c.id === ent.categoryId);
  const report = State.reports.find(r => r.enterpriseId === ent.id && r.weekId === State.activeWeekId);
  const catColor = cat ? cat.color : '#f59e0b';

  const headerGroup = document.getElementById('detailsHeaderGroup');
  headerGroup.innerHTML = `
    <div class="logo-shield" style="background: ${catColor}; color: #000; width: 44px; height: 44px; font-size: 1.2rem;">
      <i class="fa-solid ${cat ? cat.icon : 'fa-building'}"></i>
    </div>
    <div>
      <h3 class="modal-title">${ent.name}</h3>
      <p class="modal-subtitle" style="color: ${catColor}; font-weight: 700;">${cat ? cat.name : ''}</p>
    </div>
  `;

  const body = document.getElementById('detailsModalBody');
  const turnover = report ? Components.formatMoney(report.turnover) : 'Non renseigné';
  const expenses = report ? Components.formatMoney(report.expenses || 0) : '0 $';
  const profitVal = report ? (report.netProfit !== undefined ? report.netProfit : (report.turnover - (report.expenses || 0))) : 0;
  const netProfit = report ? Components.formatMoney(profitVal) : 'Non calculé';
  const employees = report ? `${report.employeeCount} employés` : 'Indéfini';
  const boss = report ? report.bossName : (ent.defaultBoss || 'Non assigné');
  const events = report && report.events ? report.events : [];

  let eventsHtml = '';
  if (events.length > 0) {
    eventsHtml = `
      <div style="margin-top: 20px;">
        <h5 style="color: #fff; margin-bottom: 12px; font-size: 1rem;"><i class="fa-solid fa-champagne-glasses text-pink"></i> Événements & Animations réalisés cette semaine :</h5>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${events.map(ev => `
            <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <strong style="color: #fff; font-size: 0.95rem;">${ev.title}</strong>
                <span class="event-type-badge">${ev.type || 'Événement'}</span>
              </div>
              <div style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 6px;">
                <i class="fa-regular fa-clock"></i> ${ev.date || 'Cette semaine'} &bull; <i class="fa-solid fa-users text-blue"></i> ~${ev.participants || 0} participants
              </div>
              <p style="font-size: 0.82rem; color: var(--text-muted);">${ev.description || ''}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else {
    eventsHtml = `<p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 14px;">Aucun événement déclaré pour cette semaine.</p>`;
  }

  let founderCommentHtml = '';
  if (report && (report.badge || report.founderComment)) {
    founderCommentHtml = `
      <div class="dossier-founder-quote">
        <span class="quote-author"><i class="fa-solid fa-crown text-gold"></i> Distinction Officielle du Fondateur :</span>
        ${report.badge ? `<div style="font-weight: 800; color: #fff; font-size: 1rem; margin-bottom: 6px;">${report.badge}</div>` : ''}
        ${report.founderComment ? `<p class="quote-text">"${report.founderComment}"</p>` : ''}
      </div>
    `;
  }

  body.innerHTML = `
    <!-- Financial Breakdown Cards -->
    <div class="dossier-stats-grid" style="grid-template-columns: repeat(4, 1fr);">
      <div class="dossier-stat-tile">
        <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Chiffre d'Affaires</span>
        <div class="dossier-stat-num text-gold">${turnover}</div>
      </div>
      <div class="dossier-stat-tile">
        <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Charges Déclarées</span>
        <div class="dossier-stat-num text-dim" style="font-size: 1.15rem;">${expenses}</div>
      </div>
      <div class="dossier-stat-tile">
        <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Bénéfice Net</span>
        <div class="dossier-stat-num ${profitVal >= 0 ? 'text-green' : 'text-red'}">${netProfit}</div>
      </div>
      <div class="dossier-stat-tile">
        <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Personnel</span>
        <div class="dossier-stat-num text-blue">${employees}</div>
      </div>
    </div>

    ${founderCommentHtml}

    ${report && report.notes ? `
      <div style="background: rgba(0,0,0,0.25); border-radius: var(--radius-md); padding: 14px; margin-bottom: 20px;">
        <span style="font-size: 0.78rem; font-weight: 700; color: #cbd5e1; display: block; margin-bottom: 6px;"><i class="fa-solid fa-clipboard-list text-gold"></i> Notes & Bilan d'activité :</span>
        <p style="font-size: 0.85rem; color: var(--text-muted);">${report.notes}</p>
      </div>
    ` : ''}

    ${eventsHtml}
  `;

  const footer = document.getElementById('detailsModalFooter');
  const user = State.currentUser;
  const isFounder = user && user.role === 'fondateur';
  const canEdit = isUserAuthorizedToEdit(ent.categoryId, ent.id);

  footer.innerHTML = `
    <button type="button" class="btn btn-secondary" data-close="modalDetails">Fermer</button>
    ${canEdit ? `<button type="button" class="btn btn-primary" id="btnDetailsEdit"><i class="fa-solid fa-pen-to-square"></i> Modifier Bilan</button>` : ''}
    ${isFounder && report ? `<button type="button" class="btn btn-gold" id="btnDetailsAward"><i class="fa-solid fa-crown"></i> Féliciter</button>` : ''}
  `;

  footer.querySelector('[data-close="modalDetails"]').addEventListener('click', () => closeModal('modalDetails'));
  footer.querySelector('#btnDetailsEdit')?.addEventListener('click', () => {
    closeModal('modalDetails');
    openEditReportModal(ent.id);
  });
  footer.querySelector('#btnDetailsAward')?.addEventListener('click', () => {
    closeModal('modalDetails');
    openAwardModal(report.id, ent.name);
  });

  openModal('modalDetails');
}

// 4. Admin Panel
async function openAdminPanel() {
  const user = State.currentUser;
  if (!user || user.role !== 'fondateur') {
    Components.showToast('Accès restreint au Fondateur', 'error');
    return;
  }

  await loadAdminUsersTable();
  await loadAdminWeeksTable();
  await loadAdminEnterprisesTable();
  await loadDiscordExport();
  await loadAdminDiscordConfig();
  await loadAdminDiscordMappingsTable();

  // Populate mapping enterprise dropdown
  const entSelect = document.getElementById('mapEnterpriseSelect');
  if (entSelect) {
    entSelect.innerHTML = '';
    State.enterprises.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = `${e.name} (${e.categoryId})`;
      entSelect.appendChild(opt);
    });
  }

  openModal('modalAdmin');
}

async function loadAdminUsersTable() {
  try {
    const users = await API.getUsers();
    const tbody = document.getElementById('adminUsersTableBody');
    tbody.innerHTML = '';

    users.forEach(u => {
      const catObj = State.categories.find(c => c.id === u.categoryAccess);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${u.username}</strong></td>
        <td>${u.displayName} ${u.authProvider === 'discord' ? '<i class="fa-brands fa-discord text-blue"></i>' : ''}</td>
        <td><span class="user-role-badge ${u.role === 'fondateur' ? 'text-gold' : 'text-blue'}">${u.role.toUpperCase()}</span></td>
        <td>${catObj ? `<span class="badge-cat" style="background: ${catObj.color}20; color: ${catObj.color};">${catObj.name}</span>` : 'Tous les secteurs (Fondateur)'}</td>
        <td>
          ${u.role !== 'fondateur' ? `
            <button class="btn btn-secondary btn-sm btn-delete-user" data-uid="${u.id}"><i class="fa-solid fa-trash text-red"></i></button>
          ` : '<span class="text-dim">Protégé</span>'}
        </td>
      `;

      tr.querySelector('.btn-delete-user')?.addEventListener('click', async () => {
        if (confirm(`Supprimer l'accès pour ${u.displayName} ?`)) {
          await API.deleteUser(u.id);
          Components.showToast('Compte supprimé avec succès');
          loadAdminUsersTable();
        }
      });

      tbody.appendChild(tr);
    });
  } catch (err) {
    Components.showToast('Erreur chargement utilisateurs : ' + err.message, 'error');
  }
}

async function loadAdminWeeksTable() {
  const tbody = document.getElementById('adminWeeksTableBody');
  tbody.innerHTML = '';

  State.weeks.forEach(w => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${w.title}</strong></td>
      <td>${w.startDate || '-'} au ${w.endDate || '-'}</td>
      <td>${w.isActive ? '<span class="badge-cat" style="background: #10b981; color: #fff;">Active</span>' : '<span class="text-dim">Archivée</span>'}</td>
      <td>
        ${!w.isActive ? `<button class="btn btn-sm btn-secondary btn-set-active" data-wid="${w.id}">Activer cette semaine</button>` : '-'}
      </td>
    `;

    tr.querySelector('.btn-set-active')?.addEventListener('click', async () => {
      await API.setActiveWeek(w.id);
      Components.showToast(`Semaine activée : ${w.title}`);
      await loadWeeksAndInitialData();
      await loadAdminWeeksTable();
    });

    tbody.appendChild(tr);
  });
}

async function loadAdminEnterprisesTable() {
  const tbody = document.getElementById('adminEnterprisesTableBody');
  tbody.innerHTML = '';

  State.enterprises.forEach(e => {
    const cat = State.categories.find(c => c.id === e.categoryId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code>${e.id}</code></td>
      <td><strong>${e.name}</strong></td>
      <td><span style="color: ${cat ? cat.color : '#f59e0b'}; font-weight: 700;">${cat ? cat.name : e.categoryId}</span></td>
      <td>${e.defaultBoss || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadDiscordExport() {
  try {
    const data = await API.getDiscordExport(State.activeWeekId);
    const textarea = document.getElementById('discordExportText');
    if (textarea) textarea.value = data.markdown;
  } catch (err) {
    console.error('Failed to load discord export:', err);
  }
}

// Discord Admin Config & Role Mappings
async function loadAdminDiscordConfig() {
  try {
    const cfg = await API.getDiscordConfig();
    const idInput = document.getElementById('cfgDiscordClientId');
    const secInput = document.getElementById('cfgDiscordClientSecret');
    const guildInput = document.getElementById('cfgDiscordGuildId');
    const botInput = document.getElementById('cfgDiscordBotToken');

    if (idInput) idInput.value = cfg.clientId || '';
    if (secInput) secInput.value = cfg.clientSecret || '';
    if (guildInput) guildInput.value = cfg.guildId || '';
    if (botInput) botInput.value = cfg.botToken || '';
  } catch (err) {
    console.error('Error loading discord config:', err);
  }
}

async function loadAdminDiscordMappingsTable() {
  try {
    const mappings = await API.getDiscordRoleMappings();
    const tbody = document.getElementById('adminDiscordMappingsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    mappings.forEach(m => {
      const ent = State.enterprises.find(e => e.id === m.enterpriseAccess);
      const cat = State.categories.find(c => c.id === m.categoryAccess);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong class="text-blue"><i class="fa-brands fa-discord"></i> ${m.discordRoleName}</strong></td>
        <td><span class="user-role-badge ${m.role === 'fondateur' ? 'text-gold' : 'text-blue'}">${m.role.toUpperCase()}</span></td>
        <td>${ent ? `<strong>${ent.name}</strong>` : (m.role === 'fondateur' ? 'Toutes (SuperAdmin)' : 'Secteur complet')}</td>
        <td>${cat ? `<span class="badge-cat" style="background: ${cat.color}20; color: ${cat.color};">${cat.name}</span>` : 'Toutes'}</td>
        <td>
          <button class="btn btn-secondary btn-sm btn-delete-map" data-mid="${m.id}"><i class="fa-solid fa-trash text-red"></i></button>
        </td>
      `;

      tr.querySelector('.btn-delete-map')?.addEventListener('click', async () => {
        if (confirm(`Supprimer la règle pour le rôle Discord '${m.discordRoleName}' ?`)) {
          await API.deleteDiscordRoleMapping(m.id);
          Components.showToast('Règle supprimée');
          await loadAdminDiscordMappingsTable();
        }
      });

      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading discord mappings:', err);
  }
}

// ==========================================================================
// EVENT LISTENERS & SETUP
// ==========================================================================

function setupGlobalEventListeners() {
  // Week Selector Change
  document.getElementById('weekSelect')?.addEventListener('change', async (e) => {
    State.activeWeekId = e.target.value;
    await refreshAllData();
  });

  // Search input
  const searchInput = document.getElementById('searchInput');
  const clearSearch = document.getElementById('clearSearch');
  searchInput?.addEventListener('input', (e) => {
    State.searchQuery = e.target.value;
    clearSearch?.classList.toggle('hidden', !State.searchQuery);
    renderLeaderboardAndPodium();
  });
  clearSearch?.addEventListener('click', () => {
    searchInput.value = '';
    State.searchQuery = '';
    clearSearch.classList.add('hidden');
    renderLeaderboardAndPodium();
  });

  // Sort select
  document.getElementById('sortSelect')?.addEventListener('change', (e) => {
    State.sortBy = e.target.value;
    renderLeaderboardAndPodium();
  });

  // View mode toggles
  const btnGrid = document.getElementById('btnViewGrid');
  const btnTable = document.getElementById('btnViewTable');
  const gridContainer = document.getElementById('enterprisesGrid');
  const tableContainer = document.getElementById('enterprisesTableContainer');

  btnGrid?.addEventListener('click', () => {
    btnGrid.classList.add('active');
    btnTable.classList.remove('active');
    gridContainer.classList.remove('hidden');
    tableContainer.classList.add('hidden');
    State.viewMode = 'grid';
  });

  btnTable?.addEventListener('click', () => {
    btnTable.classList.add('active');
    btnGrid.classList.remove('active');
    gridContainer.classList.add('hidden');
    tableContainer.classList.remove('hidden');
    State.viewMode = 'table';
  });

  // User Dropdown toggle
  const userPill = document.getElementById('userPill');
  const userMenu = document.getElementById('userDropdownMenu');
  userPill?.addEventListener('click', (e) => {
    e.stopPropagation();
    userMenu?.classList.toggle('hidden');
  });
  document.addEventListener('click', () => {
    userMenu?.classList.add('hidden');
  });

  // Switch Account & Logout
  document.getElementById('btnSwitchAccount')?.addEventListener('click', () => {
    userMenu?.classList.add('hidden');
    openModal('modalLogin');
  });
  document.getElementById('btnLogout')?.addEventListener('click', () => {
    API.logout();
    State.currentUser = null;
    State.simulatedCategory = null;
    openModal('modalLogin');
  });

  // Action Header Buttons
  document.getElementById('btnNewReport')?.addEventListener('click', () => {
    openEditReportModal();
  });
  document.getElementById('btnAdminPanel')?.addEventListener('click', () => {
    openAdminPanel();
  });
  document.getElementById('btnExportDiscordQuick')?.addEventListener('click', async () => {
    openAdminPanel();
    document.querySelector('.admin-tab-btn[data-tab="tabDiscord"]')?.click();
  });

  // Discord Login Top Button
  document.getElementById('btnDiscordLoginTop')?.addEventListener('click', () => {
    openModal('modalLogin');
  });

  // Real Discord OAuth Connect Button
  document.getElementById('btnConnectDiscordOAuth')?.addEventListener('click', async () => {
    try {
      const res = await API.getDiscordAuthUrl();
      if (res.isConfigured && res.url) {
        window.location.href = res.url;
      } else {
        Components.showToast('Veuillez configurer votre Client ID Discord dans le Panel Fondateur, ou utilisez le testeur instantané ci-dessous !', 'gold');
      }
    } catch (err) {
      Components.showToast('Erreur Discord : ' + err.message, 'error');
    }
  });

  // Instant Discord Role Simulator Button (Dual Roles: Status + Enterprise)
  document.getElementById('btnTestDiscordSim')?.addEventListener('click', async () => {
    const statusRole = document.getElementById('discordSimStatusSelect')?.value || '👑 Patron(e)';
    const enterpriseRole = document.getElementById('discordSimEnterpriseSelect')?.value || '👮 SASP';
    try {
      const res = await API.simulateDiscordLogin({ statusRole, enterpriseRole });
      State.currentUser = res.user;
      State.simulatedCategory = null;
      updateUserUI();
      closeModal('modalLogin');
      const label = res.matchedRole || `${statusRole} + ${enterpriseRole}`;
      Components.showToast(`Rôles Discord [${label}] validés ! Accès entreprise débloqué.`, 'success');
      await refreshAllData();
    } catch (err) {
      Components.showToast('Erreur simulation Discord : ' + err.message, 'error');
    }
  });

  // 1-Click Quick Preset Discord Roles
  document.querySelectorAll('.btn-preset-role').forEach(btn => {
    btn.addEventListener('click', async () => {
      const statusRole = btn.getAttribute('data-status');
      const entRole = btn.getAttribute('data-ent');

      // Sync select dropdowns
      const statusSelect = document.getElementById('discordSimStatusSelect');
      const entSelect = document.getElementById('discordSimEnterpriseSelect');
      if (statusSelect && statusRole) statusSelect.value = statusRole;
      if (entSelect && entRole) entSelect.value = entRole;

      try {
        const roles = entRole ? [statusRole, entRole] : [statusRole];
        const res = await API.simulateDiscordLogin({ roles });
        State.currentUser = res.user;
        State.simulatedCategory = null;
        updateUserUI();
        closeModal('modalLogin');
        const label = res.matchedRole || roles.join(' + ');
        Components.showToast(`Rôles Discord [${label}] validés ! Accès débloqué.`, 'success');
        await refreshAllData();
      } catch (err) {
        Components.showToast('Erreur simulation Discord : ' + err.message, 'error');
      }
    });
  });

  // Submit Claim Enterprise for Discord Members
  document.getElementById('formClaimEnterprise')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const statusRole = document.getElementById('claimStatusSelect').value;
      const enterpriseId = document.getElementById('claimEnterpriseSelect').value;
      const updatedUser = await API.selectDiscordEnterprise(statusRole, enterpriseId);
      State.currentUser = updatedUser;
      closeModal('modalClaimEnterprise');
      Components.showToast(`Liaison réussie ! Vous êtes désormais ${updatedUser.matchedDiscordRole}`, 'success');
      updateUserUI();
      await refreshAllData();
    } catch (err) {
      Components.showToast('Erreur : ' + err.message, 'error');
    }
  });

  // Generic Modal Close Buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      closeModal(modalId);
    });
  });

  // Dynamic Profit Calculation on typing in Report Form
  document.getElementById('reportTurnover')?.addEventListener('input', updateProfitPreview);
  document.getElementById('reportExpenses')?.addEventListener('input', updateProfitPreview);

  // Dynamic Event Builder inside Report Form
  document.getElementById('btnAddEventRow')?.addEventListener('click', () => {
    const list = document.getElementById('eventsBuilderList');
    list.appendChild(Components.createEventBuilderRow());
    const count = list.querySelectorAll('.builder-row').length;
    document.getElementById('eventCountBadge').textContent = `${count} événement(s)`;
  });

  // Submit Weekly Report
  document.getElementById('formWeeklyReport')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const enterpriseId = document.getElementById('reportEnterpriseSelect').value;
      const turnover = Number(document.getElementById('reportTurnover').value) || 0;
      const expenses = Number(document.getElementById('reportExpenses').value) || 0;
      const netProfit = Number(document.getElementById('reportNetProfit').value) || (turnover - expenses);
      const employeeCount = Number(document.getElementById('reportEmployees').value) || 0;
      const bossName = document.getElementById('reportBossName').value.trim();
      const notes = document.getElementById('reportNotes').value.trim();

      const events = [];
      document.querySelectorAll('#eventsBuilderList .builder-row').forEach(row => {
        const title = row.querySelector('.ev-title')?.value.trim();
        const date = row.querySelector('.ev-date')?.value;
        const type = row.querySelector('.ev-type')?.value.trim();
        const participants = Number(row.querySelector('.ev-participants')?.value) || 0;
        const description = row.querySelector('.ev-desc')?.value.trim();
        if (title) {
          events.push({
            id: 'ev_' + Date.now() + Math.random().toString().slice(2, 5),
            title,
            date,
            type,
            participants,
            description
          });
        }
      });

      await API.saveReport({
        weekId: State.activeWeekId,
        enterpriseId,
        turnover,
        expenses,
        netProfit,
        employeeCount,
        bossName,
        events,
        notes
      });

      Components.showToast('Bilan et bénéfices enregistrés avec succès !', 'success');
      closeModal('modalReport');
      await refreshAllData();
    } catch (err) {
      Components.showToast('Erreur : ' + err.message, 'error');
    }
  });

  // Submit Founder Award
  document.getElementById('formAward')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const reportId = document.getElementById('awardReportId').value;
      let badge = document.getElementById('awardBadgeSelect').value;
      if (badge === 'custom') {
        badge = document.getElementById('customBadgeInput').value.trim();
      }
      const comment = document.getElementById('awardComment').value.trim();

      await API.awardReport(reportId, badge, comment);
      Components.showToast('Distinction et message du Fondateur décernés !', 'gold');
      closeModal('modalAward');
      await refreshAllData();
    } catch (err) {
      Components.showToast('Erreur : ' + err.message, 'error');
    }
  });

  // Custom Badge select toggle
  document.getElementById('awardBadgeSelect')?.addEventListener('change', (e) => {
    const isCustom = e.target.value === 'custom';
    document.getElementById('customBadgeGroup')?.classList.toggle('hidden', !isCustom);
  });

  // Login Form
  document.getElementById('formLogin')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userIn = document.getElementById('loginUsername').value.trim();
    const passIn = document.getElementById('loginPassword').value.trim();

    try {
      const user = await API.login(userIn, passIn);
      State.currentUser = user;
      State.simulatedCategory = null;
      updateUserUI();
      closeModal('modalLogin');
      Components.showToast(`Bienvenue, ${user.displayName} !`, 'success');
      await refreshAllData();
    } catch (err) {
      Components.showToast(err.message, 'error');
    }
  });

  // 1-Click Quick Login Buttons
  document.querySelectorAll('.btn-quick-login').forEach(btn => {
    btn.addEventListener('click', async () => {
      const u = btn.getAttribute('data-user');
      const p = btn.getAttribute('data-pass');
      try {
        const user = await API.login(u, p);
        State.currentUser = user;
        State.simulatedCategory = null;
        updateUserUI();
        closeModal('modalLogin');
        Components.showToast(`Connecté en tant que ${user.displayName}`, 'success');
        await refreshAllData();
      } catch (err) {
        Components.showToast(err.message, 'error');
      }
    });
  });

  // Founder Simulation Bar Buttons
  document.querySelectorAll('.founder-sim-bar .sim-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.founder-sim-bar .sim-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const role = btn.getAttribute('data-role');
      if (role === 'fondateur') {
        State.simulatedCategory = null;
        State.selectedCategory = 'all';
        document.getElementById('categoryIsolationNotice')?.classList.add('hidden');
      } else {
        State.simulatedCategory = role;
        State.selectedCategory = role;
        const notice = document.getElementById('categoryIsolationNotice');
        if (notice) {
          notice.classList.remove('hidden');
          const catObj = State.categories.find(c => c.id === role);
          document.getElementById('isolatedCategoryName').textContent = catObj ? catObj.name : role;
        }
      }

      renderCategoryTabs();
      renderOverviewStats();
      renderLeaderboardAndPodium();
      renderEventsFeed();
    });
  });

  // Admin Modal Tabs
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-tab-panel').forEach(p => p.classList.add('hidden'));

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(tabId)?.classList.remove('hidden');
    });
  });

  // Admin: Open New User Form
  const btnOpenUserForm = document.getElementById('btnOpenNewUserForm');
  const formUser = document.getElementById('formUser');
  btnOpenUserForm?.addEventListener('click', () => {
    formUser.classList.toggle('hidden');
    document.getElementById('adminUserId').value = '';
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminDisplayName').value = '';
    document.getElementById('adminPassword').value = '';
  });
  document.getElementById('btnCancelUserForm')?.addEventListener('click', () => {
    formUser.classList.add('hidden');
  });

  // Admin: Role select changes category dropdown requirement
  document.getElementById('adminRoleSelect')?.addEventListener('change', (e) => {
    const isRef = e.target.value === 'referent';
    document.getElementById('adminCategoryGroup')?.classList.toggle('hidden', !isRef);
  });

  // Admin: Submit User Save
  formUser?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const username = document.getElementById('adminUsername').value.trim();
      const displayName = document.getElementById('adminDisplayName').value.trim();
      const password = document.getElementById('adminPassword').value.trim();
      const role = document.getElementById('adminRoleSelect').value;
      const categoryAccess = role === 'referent' ? document.getElementById('adminCategorySelect').value : null;

      await API.saveUser({
        username,
        displayName,
        password,
        role,
        categoryAccess
      });

      Components.showToast('Compte enregistré avec succès !', 'success');
      formUser.classList.add('hidden');
      await loadAdminUsersTable();
    } catch (err) {
      Components.showToast('Erreur : ' + err.message, 'error');
    }
  });

  // Admin: Create Week
  document.getElementById('formNewWeek')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const title = document.getElementById('newWeekTitle').value.trim();
      const startDate = document.getElementById('newWeekStart').value;
      const endDate = document.getElementById('newWeekEnd').value;

      await API.createWeek(title, startDate, endDate, true);
      Components.showToast(`Nouvelle semaine "${title}" créée et activée !`, 'success');
      document.getElementById('newWeekTitle').value = '';
      await loadWeeksAndInitialData();
      await loadAdminWeeksTable();
    } catch (err) {
      Components.showToast('Erreur : ' + err.message, 'error');
    }
  });

  // Admin: Add Enterprise
  document.getElementById('formNewEnterprise')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const name = document.getElementById('newEntName').value.trim();
      const categoryId = document.getElementById('newEntCategory').value;
      const defaultBoss = document.getElementById('newEntBoss').value.trim();

      await API.addEnterprise({ name, categoryId, defaultBoss });
      Components.showToast(`Entreprise "${name}" ajoutée au répertoire !`, 'success');
      document.getElementById('newEntName').value = '';
      document.getElementById('newEntBoss').value = '';
      await refreshAllData();
      await loadAdminEnterprisesTable();
    } catch (err) {
      Components.showToast('Erreur : ' + err.message, 'error');
    }
  });

  // Admin: Copy Discord Export
  document.getElementById('btnCopyDiscord')?.addEventListener('click', () => {
    const text = document.getElementById('discordExportText')?.value;
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        Components.showToast('Texte Discord copié dans le presse-papiers !', 'success');
      }).catch(() => {
        Components.showToast('Veuillez copier le texte manuellement.', 'error');
      });
    }
  });

  // Admin: Discord API Config Save
  document.getElementById('formDiscordConfig')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const clientId = document.getElementById('cfgDiscordClientId').value.trim();
      const clientSecret = document.getElementById('cfgDiscordClientSecret').value.trim();
      const guildId = document.getElementById('cfgDiscordGuildId').value.trim();
      const botToken = document.getElementById('cfgDiscordBotToken').value.trim();

      await API.saveDiscordConfig({ clientId, clientSecret, guildId, botToken });
      Components.showToast('Configuration Discord OAuth enregistrée !', 'success');
    } catch (err) {
      Components.showToast('Erreur Discord : ' + err.message, 'error');
    }
  });

  // Admin: Toggle Discord Mapping Form
  const btnOpenMapping = document.getElementById('btnOpenNewMappingForm');
  const formMapping = document.getElementById('formDiscordMapping');
  btnOpenMapping?.addEventListener('click', () => {
    formMapping.classList.toggle('hidden');
    document.getElementById('mappingId').value = '';
    document.getElementById('mapDiscordRoleName').value = '';
  });
  document.getElementById('btnCancelMappingForm')?.addEventListener('click', () => {
    formMapping.classList.add('hidden');
  });

  // Admin: Role Type changes mapping options
  document.getElementById('mapRoleType')?.addEventListener('change', (e) => {
    const val = e.target.value;
    const entGroup = document.getElementById('mapEnterpriseGroup');
    const catGroup = document.getElementById('mapCategoryGroup');
    if (val === 'patron') {
      entGroup?.classList.remove('hidden');
      catGroup?.classList.remove('hidden');
    } else if (val === 'referent') {
      entGroup?.classList.add('hidden');
      catGroup?.classList.remove('hidden');
    } else {
      entGroup?.classList.add('hidden');
      catGroup?.classList.add('hidden');
    }
  });

  // Admin: Submit Discord Role Mapping Save
  formMapping?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const discordRoleName = document.getElementById('mapDiscordRoleName').value.trim();
      const role = document.getElementById('mapRoleType').value;
      const enterpriseAccess = role === 'patron' ? document.getElementById('mapEnterpriseSelect').value : null;
      let categoryAccess = role === 'patron' ? null : document.getElementById('mapCategorySelect').value;

      if (role === 'patron' && enterpriseAccess) {
        const ent = State.enterprises.find(x => x.id === enterpriseAccess);
        if (ent) categoryAccess = ent.categoryId;
      }

      await API.saveDiscordRoleMapping({
        discordRoleName,
        role,
        enterpriseAccess,
        categoryAccess
      });

      Components.showToast(`Règle pour le rôle Discord '${discordRoleName}' enregistrée !`, 'success');
      formMapping.classList.add('hidden');
      await loadAdminDiscordMappingsTable();
    } catch (err) {
      Components.showToast('Erreur : ' + err.message, 'error');
    }
  });
}
