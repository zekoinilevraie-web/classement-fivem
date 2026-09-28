// UI Components & Formatting Helpers for Los Santos Enterprise Portal

const Components = {
  // Format numbers
  formatMoney(num) {
    if (num === undefined || num === null) return '0 $';
    return Number(num).toLocaleString('fr-FR') + ' $';
  },

  formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString('fr-FR');
  },

  // Category Color mapping
  getCategoryColor(categoryId) {
    switch (categoryId) {
      case 'services_publics': return '#3b82f6';
      case 'automobile': return '#ef4444';
      case 'evenementiel': return '#ec4899';
      case 'public_prive': return '#10b981';
      case 'alimentaire': return '#f59e0b';
      default: return '#f59e0b';
    }
  },

  getCategoryIcon(categoryId) {
    switch (categoryId) {
      case 'services_publics': return 'fa-shield-halved';
      case 'automobile': return 'fa-car-side';
      case 'evenementiel': return 'fa-champagne-glasses';
      case 'public_prive': return 'fa-building-columns';
      case 'alimentaire': return 'fa-burger';
      default: return 'fa-briefcase';
    }
  },

  // Toast Notifications
  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-triangle-exclamation';
    if (type === 'gold') icon = 'fa-crown';

    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // Render Podium (1st, 2nd, 3rd)
  renderPodium(topThree, categories, onOpenDetails) {
    const container = document.getElementById('podiumContainer');
    if (!container) return;

    if (!topThree || topThree.length === 0) {
      container.innerHTML = `
        <div class="podium-empty-notice">
          <i class="fa-solid fa-trophy text-gold" style="font-size: 2.5rem; margin-bottom: 12px; display: block;"></i>
          <p>Aucun bilan n'a encore été déposé pour cette semaine dans ce secteur.</p>
          <small class="text-muted">Déposez un bilan hebdomadaire pour faire grimper votre entreprise sur le podium !</small>
        </div>
      `;
      return;
    }

    const first = topThree[0];
    const second = topThree[1] || null;
    const third = topThree[2] || null;

    let html = '';

    // 2nd Place (Silver)
    if (second) {
      const cat = categories.find(c => c.id === second.enterprise.categoryId);
      const catColor = cat ? cat.color : '#cbd5e1';
      html += `
        <div class="podium-column podium-second" data-ent-id="${second.enterprise.id}">
          <div class="podium-card">
            <div class="podium-logo">${second.enterprise.logoText || second.enterprise.name.substring(0, 3)}</div>
            <h4 class="podium-ent-name">${second.enterprise.name}</h4>
            <span class="podium-cat-pill" style="color: ${catColor}">${cat ? cat.name : ''}</span>
            <div class="podium-ca">${this.formatMoney(second.report.turnover)}</div>
            <div class="podium-stats-row">
              <span><i class="fa-solid fa-users"></i> ${second.report.employeeCount} emp.</span>
              <span><i class="fa-solid fa-calendar-check"></i> ${second.report.events?.length || 0} évts</span>
            </div>
            ${second.report.badge ? `<div class="podium-badge-highlight">${second.report.badge}</div>` : ''}
          </div>
          <div class="podium-step">
            <span class="step-rank-number">2</span>
            <span class="step-label">2ème Place</span>
          </div>
        </div>
      `;
    }

    // 1st Place (Gold)
    if (first) {
      const cat = categories.find(c => c.id === first.enterprise.categoryId);
      const catColor = cat ? cat.color : '#f59e0b';
      html += `
        <div class="podium-column podium-first" data-ent-id="${first.enterprise.id}">
          <div class="podium-card">
            <div class="podium-crown-icon">👑</div>
            <div class="podium-logo">${first.enterprise.logoText || first.enterprise.name.substring(0, 3)}</div>
            <h4 class="podium-ent-name">${first.enterprise.name}</h4>
            <span class="podium-cat-pill" style="color: ${catColor}">${cat ? cat.name : ''}</span>
            <div class="podium-ca">${this.formatMoney(first.report.turnover)}</div>
            <div class="podium-stats-row">
              <span><i class="fa-solid fa-users"></i> ${first.report.employeeCount} employés</span>
              <span><i class="fa-solid fa-calendar-check"></i> ${first.report.events?.length || 0} événements</span>
            </div>
            ${first.report.badge ? `<div class="podium-badge-highlight">${first.report.badge}</div>` : `<div class="podium-badge-highlight">🏆 Leader Hebdomadaire</div>`}
          </div>
          <div class="podium-step">
            <span class="step-rank-number">1</span>
            <span class="step-label">1ère Place</span>
          </div>
        </div>
      `;
    }

    // 3rd Place (Bronze)
    if (third) {
      const cat = categories.find(c => c.id === third.enterprise.categoryId);
      const catColor = cat ? cat.color : '#d97706';
      html += `
        <div class="podium-column podium-third" data-ent-id="${third.enterprise.id}">
          <div class="podium-card">
            <div class="podium-logo">${third.enterprise.logoText || third.enterprise.name.substring(0, 3)}</div>
            <h4 class="podium-ent-name">${third.enterprise.name}</h4>
            <span class="podium-cat-pill" style="color: ${catColor}">${cat ? cat.name : ''}</span>
            <div class="podium-ca">${this.formatMoney(third.report.turnover)}</div>
            <div class="podium-stats-row">
              <span><i class="fa-solid fa-users"></i> ${third.report.employeeCount} emp.</span>
              <span><i class="fa-solid fa-calendar-check"></i> ${third.report.events?.length || 0} évts</span>
            </div>
            ${third.report.badge ? `<div class="podium-badge-highlight">${third.report.badge}</div>` : ''}
          </div>
          <div class="podium-step">
            <span class="step-rank-number">3</span>
            <span class="step-label">3ème Place</span>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;

    // Attach click events
    container.querySelectorAll('.podium-column').forEach(col => {
      col.addEventListener('click', () => {
        const entId = col.getAttribute('data-ent-id');
        if (onOpenDetails) onOpenDetails(entId);
      });
    });
  },

  // Render Enterprise Card (Grid view)
  createEnterpriseCard(item, rank, isFounder, canEdit, onOpenDetails, onEditReport, onOpenAward) {
    const { enterprise, report, category } = item;
    const catColor = category ? category.color : '#f59e0b';
    const catIcon = category ? category.icon : 'fa-briefcase';

    let rankClass = '';
    if (rank === 1) rankClass = 'rank-1';
    else if (rank === 2) rankClass = 'rank-2';
    else if (rank === 3) rankClass = 'rank-3';

    const card = document.createElement('div');
    card.className = `enterprise-card ${rank === 1 ? 'card-first-place' : ''}`;
    card.setAttribute('data-ent-id', enterprise.id);

    const hasReport = !!report;
    const caDisplay = hasReport ? this.formatMoney(report.turnover) : 'Non déclaré';
    const profitVal = hasReport ? (report.netProfit !== undefined ? report.netProfit : (report.turnover - (report.expenses || 0))) : 0;
    const profitDisplay = hasReport ? this.formatMoney(profitVal) : '-';
    const isProfitPositive = profitVal >= 0;
    const empDisplay = hasReport ? `${report.employeeCount} employés` : 'Effectif indéfini';
    const bossDisplay = hasReport ? report.bossName : (enterprise.defaultBoss || 'Non assigné');
    const eventsCount = hasReport && report.events ? report.events.length : 0;

    card.innerHTML = `
      <div class="card-top">
        <div class="card-brand-group">
          <div class="card-logo" style="background: ${catColor}20; border-color: ${catColor}50; color: ${catColor};">
            ${enterprise.logoText || enterprise.name.substring(0, 3)}
          </div>
          <div class="card-name-cat">
            <h4 class="card-name">${enterprise.name}</h4>
            <span class="card-cat-badge" style="color: ${catColor}">
              <i class="fa-solid ${catIcon}"></i> ${category ? category.name : ''}
            </span>
          </div>
        </div>
        <div class="card-rank-badge ${rankClass}">
          ${hasReport ? `#${rank}` : 'En attente'}
        </div>
      </div>

      <div class="card-metrics">
        <div class="metric-row-ca">
          <div>
            <span class="metric-label">Chiffre d'Affaires</span>
            <div class="metric-ca-val" style="${!hasReport ? 'color: var(--text-dim); font-size: 1.05rem;' : ''}">${caDisplay}</div>
          </div>
          ${hasReport ? `
            <div style="text-align: right;">
              <span class="metric-label">Bénéfice Net</span>
              <div style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 800; color: ${isProfitPositive ? '#10b981' : '#ef4444'};">
                <i class="fa-solid ${isProfitPositive ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i> ${profitDisplay}
              </div>
            </div>
          ` : ''}
        </div>
        <div class="metric-details-row">
          <span title="Direction / Patron"><i class="fa-solid fa-user-tie text-gold"></i> ${bossDisplay}</span>
          <span title="Salariés déclarés"><i class="fa-solid fa-users text-blue"></i> ${empDisplay}</span>
          <span title="Événements cette semaine"><i class="fa-solid fa-calendar-check text-pink"></i> ${eventsCount} évt(s)</span>
        </div>
      </div>

      ${hasReport && report.badge ? `
        <div class="card-distinction-badge">
          <i class="fa-solid fa-award text-gold"></i>
          <span>${report.badge}</span>
        </div>
      ` : ''}

      <div class="card-actions">
        <button class="btn btn-secondary btn-sm btn-details" title="Consulter le dossier et les événements">
          <i class="fa-solid fa-eye"></i> Fiche
        </button>

        ${canEdit ? `
          <button class="btn btn-primary btn-sm btn-edit" title="Déposer ou modifier le bilan">
            <i class="fa-solid fa-pen-to-square"></i> Bilan
          </button>
        ` : ''}

        ${isFounder && hasReport ? `
          <button class="btn btn-gold btn-sm btn-award" title="Féliciter et décerner une médaille">
            <i class="fa-solid fa-crown"></i> Féliciter
          </button>
        ` : ''}
      </div>
    `;

    // Event listeners
    card.querySelector('.btn-details')?.addEventListener('click', () => onOpenDetails(enterprise.id));
    card.querySelector('.btn-edit')?.addEventListener('click', () => onEditReport(enterprise.id));
    card.querySelector('.btn-award')?.addEventListener('click', () => onOpenAward(report.id, enterprise.name));

    return card;
  },

  // Render Table Row
  createEnterpriseTableRow(item, rank, isFounder, canEdit, onOpenDetails, onEditReport, onOpenAward) {
    const { enterprise, report, category } = item;
    const catColor = category ? category.color : '#f59e0b';
    const hasReport = !!report;
    const profitVal = hasReport ? (report.netProfit !== undefined ? report.netProfit : (report.turnover - (report.expenses || 0))) : 0;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <span class="card-rank-badge ${rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : ''}">
          ${hasReport ? `#${rank}` : '-'}
        </span>
      </td>
      <td>
        <div class="table-ent-cell">
          <div class="card-logo" style="width: 32px; height: 32px; font-size: 0.8rem; background: ${catColor}20; color: ${catColor}; border-color: ${catColor}50;">
            ${enterprise.logoText || enterprise.name.substring(0, 3)}
          </div>
          <strong style="color: #fff;">${enterprise.name}</strong>
        </div>
      </td>
      <td>
        <span style="color: ${catColor}; font-weight: 600; font-size: 0.8rem;">
          ${category ? category.name : ''}
        </span>
      </td>
      <td>${hasReport ? report.bossName : (enterprise.defaultBoss || '-')}</td>
      <td>${hasReport ? report.employeeCount + ' pers.' : '-'}</td>
      <td class="table-ca">${hasReport ? this.formatMoney(report.turnover) : '<span style="color: var(--text-dim);">Non déclaré</span>'}</td>
      <td>
        ${hasReport ? `
          <strong style="color: ${profitVal >= 0 ? '#10b981' : '#ef4444'}; font-family: var(--font-heading);">
            ${this.formatMoney(profitVal)}
          </strong>
        ` : '<span style="color: var(--text-dim);">-</span>'}
      </td>
      <td>
        <span style="color: #f472b6; font-weight: 700;">
          ${hasReport && report.events ? report.events.length : 0} évt(s)
        </span>
      </td>
      <td>
        ${hasReport && report.badge ? `<span class="badge-cat" style="background: rgba(245,158,11,0.2); color: var(--gold);">${report.badge}</span>` : '-'}
      </td>
      <td style="text-align: right;">
        <div style="display: flex; gap: 6px; justify-content: flex-end;">
          <button class="btn btn-secondary btn-sm btn-table-details" title="Détails"><i class="fa-solid fa-eye"></i></button>
          ${canEdit ? `<button class="btn btn-primary btn-sm btn-table-edit" title="Modifier Bilan"><i class="fa-solid fa-pen-to-square"></i></button>` : ''}
          ${isFounder && hasReport ? `<button class="btn btn-gold btn-sm btn-table-award" title="Féliciter"><i class="fa-solid fa-crown"></i></button>` : ''}
        </div>
      </td>
    `;

    tr.querySelector('.btn-table-details')?.addEventListener('click', () => onOpenDetails(enterprise.id));
    tr.querySelector('.btn-table-edit')?.addEventListener('click', () => onEditReport(enterprise.id));
    tr.querySelector('.btn-table-award')?.addEventListener('click', () => onOpenAward(report.id, enterprise.name));

    return tr;
  },

  // Render Event Card
  createEventCard(event, enterpriseName, catColor) {
    const card = document.createElement('div');
    card.className = 'event-card';

    const participants = event.participants ? Number(event.participants) : 0;

    card.innerHTML = `
      <div class="event-card-top">
        <span class="event-type-badge">${event.type || 'Animation'}</span>
        <span class="event-date-chip">
          <i class="fa-regular fa-clock"></i> ${event.date || 'Cette semaine'}
        </span>
      </div>
      <h4 class="event-title">${event.title}</h4>
      <div class="event-ent-source">
        <i class="fa-solid fa-building" style="color: ${catColor};"></i> ${enterpriseName}
      </div>
      <p class="event-desc">${event.description || 'Aucune description spécifiée.'}</p>
      <div class="event-footer">
        <span class="event-participants">
          <i class="fa-solid fa-users"></i> ~${participants} participants
        </span>
        ${event.proofUrl ? `<a href="${event.proofUrl}" target="_blank" class="text-blue" style="font-size: 0.78rem;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Preuve / Photo</a>` : ''}
      </div>
    `;

    return card;
  },

  // Dynamic Event Row inside Report Modal
  createEventBuilderRow(eventData = {}) {
    const row = document.createElement('div');
    row.className = 'builder-row';

    row.innerHTML = `
      <div class="builder-row-top">
        <input type="text" class="form-input ev-title" placeholder="Titre de l'événement (Ex: Soirée Disco, Opération K9...)" value="${eventData.title || ''}" required />
        <button type="button" class="btn-remove-row" title="Supprimer cet événement"><i class="fa-solid fa-trash"></i></button>
      </div>
      <div class="form-row">
        <div class="form-group flex-1" style="margin-bottom: 0;">
          <input type="date" class="form-input ev-date" value="${eventData.date || ''}" />
        </div>
        <div class="form-group flex-1" style="margin-bottom: 0;">
          <input type="text" class="form-input ev-type" placeholder="Type (Ex: Soirée, Vente, Convoi...)" value="${eventData.type || ''}" />
        </div>
        <div class="form-group flex-1" style="margin-bottom: 0;">
          <input type="number" class="form-input ev-participants" placeholder="Participants est." value="${eventData.participants || ''}" min="0" />
        </div>
      </div>
      <textarea class="form-textarea ev-desc" rows="2" placeholder="Description de l'événement et ambiance...">${eventData.description || ''}</textarea>
    `;

    row.querySelector('.btn-remove-row').addEventListener('click', () => {
      row.remove();
      const count = document.querySelectorAll('#eventsBuilderList .builder-row').length;
      document.getElementById('eventCountBadge').textContent = `${count} événement(s)`;
    });

    return row;
  }
};
