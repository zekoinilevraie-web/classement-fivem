const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Predefined categories requested by user
const INITIAL_CATEGORIES = [
  {
    id: 'services_publics',
    name: 'Services Publics',
    color: '#3b82f6',
    icon: 'fa-shield-halved',
    description: 'Forces de l\'ordre, justice, secours et institutions gouvernementales'
  },
  {
    id: 'automobile',
    name: 'Automobile',
    color: '#ef4444',
    icon: 'fa-car-side',
    description: 'Concessions, garages de customisation et clubs automobiles'
  },
  {
    id: 'evenementiel',
    name: 'Événementiel',
    color: '#ec4899',
    icon: 'fa-champagne-glasses',
    description: 'Clubs, bars, médias, agences et lieux de divertissement nocturne'
  },
  {
    id: 'public_prive',
    name: 'Publics & Privés',
    color: '#10b981',
    icon: 'fa-building-columns',
    description: 'Industrie, sécurité privée, logistique, transports et immobilier'
  },
  {
    id: 'alimentaire',
    name: 'Alimentaire',
    color: '#f59e0b',
    icon: 'fa-burger',
    description: 'Restauration, fast-foods, épiceries et cafés'
  }
];

// All enterprises matching the user's FiveM server and Discord roles
const INITIAL_ENTERPRISES = [
  // Services Publics
  { id: 'gouv', name: 'Gouvernement', categoryId: 'services_publics', defaultBoss: 'Gouverneur', logoText: 'GOV' },
  { id: 'fbi', name: 'FBI', categoryId: 'services_publics', defaultBoss: 'Directeur FBI', logoText: 'FBI' },
  { id: 'doj', name: 'DOJ', categoryId: 'services_publics', defaultBoss: 'Procureur Général', logoText: 'DOJ' },
  { id: 'sasp', name: 'SASP', categoryId: 'services_publics', defaultBoss: 'Colonel SASP', logoText: 'SASP' },
  { id: 'cabinet_avocat', name: 'Cabinet Avocat', categoryId: 'services_publics', defaultBoss: 'Bâtonnier', logoText: 'AVO' },
  { id: 'ems', name: 'EMS', categoryId: 'services_publics', defaultBoss: 'Directeur EMS', logoText: 'EMS' },
  { id: 'gouv_cayo', name: 'Gouvernement Cayo', categoryId: 'services_publics', defaultBoss: 'Gouverneur Cayo', logoText: 'CAYO' },
  { id: 'national_guard', name: 'National Guard', categoryId: 'services_publics', defaultBoss: 'Général NG', logoText: 'NG' },

  // Automobile
  { id: 'concession_auto', name: 'Concess Auto', categoryId: 'automobile', defaultBoss: 'Directeur Concession', logoText: 'CA' },
  { id: 'reaper_custom', name: 'Reaper Custom', categoryId: 'automobile', defaultBoss: 'Chef Reaper', logoText: 'REA' },
  { id: 'car_club_76', name: 'Car Club 76', categoryId: 'automobile', defaultBoss: 'Président CC76', logoText: 'C76' },
  { id: 'flints_auto', name: 'Flints Auto', categoryId: 'automobile', defaultBoss: 'Directeur Flints', logoText: 'FLI' },
  { id: 'phoenix_custom', name: 'Phoenix Custom', categoryId: 'automobile', defaultBoss: 'Chef d\'Atelier Phoenix', logoText: 'PHX' },
  { id: 'mosely_auto', name: 'Mosleys', categoryId: 'automobile', defaultBoss: 'Gérant Mosely', logoText: 'MOS' },
  { id: 'ls_custom', name: 'LS-CUSTOM', categoryId: 'automobile', defaultBoss: 'Gérant LS Custom', logoText: 'LSC' },

  // Publique - Privé
  { id: 'group_6', name: 'Groupe6', categoryId: 'public_prive', defaultBoss: 'Directeur Group 6', logoText: 'G6' },
  { id: 'ls_postal', name: 'LS Postal', categoryId: 'public_prive', defaultBoss: 'Chef d\'Agence Postale', logoText: 'LSP' },
  { id: 'weazel_news', name: 'Weazel News', categoryId: 'public_prive', defaultBoss: 'Rédacteur en Chef', logoText: 'WZL' },
  { id: 'tabac', name: 'Tabac', categoryId: 'public_prive', defaultBoss: 'Gérant Tabac', logoText: 'TAB' },
  { id: 'taxi', name: 'Taxi', categoryId: 'public_prive', defaultBoss: 'Responsable Flotte Taxi', logoText: 'TAX' },
  { id: 'cuve_industrie', name: 'Cuivre-Industries', categoryId: 'public_prive', defaultBoss: 'Directeur Cuve Industrie', logoText: 'CUV' },
  { id: 'vigneron', name: 'Vigneron', categoryId: 'public_prive', defaultBoss: 'Maître de Chai', logoText: 'VIG' },
  { id: 'studio_photo', name: 'Studio Photo', categoryId: 'public_prive', defaultBoss: 'Directeur Studio Photo', logoText: 'PHO' },
  { id: 'cayo_ferraille', name: 'Cayo Ferraille', categoryId: 'public_prive', defaultBoss: 'Chef de Chantier Cayo', logoText: 'CAY' },
  { id: 'dynasty_8', name: 'Dynasty 8', categoryId: 'public_prive', defaultBoss: 'Directeur Agence D8', logoText: 'D8' },
  { id: 'medvedev_maritime', name: 'Medvedev Maritime', categoryId: 'public_prive', defaultBoss: 'Capitaine d\'Armement', logoText: 'MED' },
  { id: 'securo', name: 'Securo', categoryId: 'public_prive', defaultBoss: 'Directeur des Opérations', logoText: 'SEC' },

  // Événementiel
  { id: 'unicorn', name: 'Unicorn', categoryId: 'evenementiel', defaultBoss: 'Directeur Unicorn', logoText: 'UNI' },
  { id: 'yellow_jack', name: 'Yellow Jack', categoryId: 'evenementiel', defaultBoss: 'Gérant Yellow Jack', logoText: 'YEL' },
  { id: 'nocturnal', name: 'Nocturnal', categoryId: 'evenementiel', defaultBoss: 'Directeur Nocturnal', logoText: 'NOC' },
  { id: 'perico_bar', name: 'Perico BAR', categoryId: 'evenementiel', defaultBoss: 'Gérant Perico Bar', logoText: 'PER' },
  { id: 'hookah_club', name: 'Hookah Club', categoryId: 'evenementiel', defaultBoss: 'Gérant Hookah Club', logoText: 'HKH' },
  { id: 'club_97', name: 'Club 97', categoryId: 'evenementiel', defaultBoss: 'Propriétaire Club 97', logoText: 'C97' },
  { id: 'label_97', name: 'Label 97', categoryId: 'evenementiel', defaultBoss: 'Directeur Artistique', logoText: 'L97' },
  { id: 'suncheon_plaza', name: 'Suncheon Plaza', categoryId: 'evenementiel', defaultBoss: 'Directeur Suncheon', logoText: 'SUN' },
  { id: 'tequi_la_la', name: 'Tequi-la-la', categoryId: 'evenementiel', defaultBoss: 'Gérant Tequi-la-la', logoText: 'TEQ' },

  // Alimentaire
  { id: 'burger_shot', name: 'Burger Shot', categoryId: 'alimentaire', defaultBoss: 'Manager Burger Shot', logoText: 'BS' },
  { id: 'casa_bellini', name: 'Casa Bellini', categoryId: 'alimentaire', defaultBoss: 'Chef Casa Bellini', logoText: 'BEL' },
  { id: 'cat_cafe', name: 'CatCafé', categoryId: 'alimentaire', defaultBoss: 'Gérant Cat Café', logoText: 'CAT' },
  { id: 'ltd_little_seoul', name: 'LTD Little Seoul', categoryId: 'alimentaire', defaultBoss: 'Gérant LTD Little Seoul', logoText: 'LTD2' },
  { id: 'ltd_forum_drive', name: 'LTD Forum Drive', categoryId: 'alimentaire', defaultBoss: 'Gérant LTD Forum Drive', logoText: 'LTD4' },
  { id: 'ltd_grove_street', name: 'LTD Groove Street', categoryId: 'alimentaire', defaultBoss: 'Gérant LTD Grove Street', logoText: 'LTD3' },
  { id: 'ltd_mirror_park', name: 'LTD Mirror Park', categoryId: 'alimentaire', defaultBoss: 'Gérant LTD Mirror Park', logoText: 'LTD1' }
];

// Normalizer utility for Discord role matching (handles Unicode mathematical bold, emojis, ZWJ, accents)
function normalizeDiscordRole(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFKD')
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Extended_Pictographic}|[\u200B-\u200D\uFE00-\uFE0F]/gu, '')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[·\-_&.,;:()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Enterprise dictionary with exact Discord aliases from screenshots
const DISCORD_ENTERPRISE_MAP = [
  // Services Publics
  { id: 'gouv', categoryId: 'services_publics', name: 'Gouvernement', aliases: ['us gouvernement', 'gouvernement', 'gov'] },
  { id: 'doj', categoryId: 'services_publics', name: 'DOJ', aliases: ['doj', 'justice'] },
  { id: 'cabinet_avocat', categoryId: 'services_publics', name: 'Cabinet Avocat', aliases: ['cabinet avocat', 'cabinet d avocats', 'avocat'] },
  { id: 'fbi', categoryId: 'services_publics', name: 'FBI', aliases: ['fbi', 'federal'] },
  { id: 'sasp', categoryId: 'services_publics', name: 'SASP', aliases: ['sasp', 'police', 'lspd'] },
  { id: 'ems', categoryId: 'services_publics', name: 'EMS', aliases: ['ems', 'hopital', 'secours'] },
  { id: 'gouv_cayo', categoryId: 'services_publics', name: 'Gouvernement Cayo', aliases: ['gouvernement cayo', 'cayo'] },
  { id: 'national_guard', categoryId: 'services_publics', name: 'National Guard', aliases: ['national guard', 'ng', 'armee'] },

  // Automobile
  { id: 'concession_auto', categoryId: 'automobile', name: 'Concess Auto', aliases: ['concess auto', 'concession auto', 'concession'] },
  { id: 'reaper_custom', categoryId: 'automobile', name: 'Reaper Custom', aliases: ['reaper custom', 'reaper'] },
  { id: 'car_club_76', categoryId: 'automobile', name: 'Car Club 76', aliases: ['carclub', 'car club 76', 'car club'] },
  { id: 'flints_auto', categoryId: 'automobile', name: 'Flints Auto', aliases: ['flints auto', 'flints'] },
  { id: 'phoenix_custom', categoryId: 'automobile', name: 'Phoenix Custom', aliases: ['phoenix custom', 'phoenix'] },
  { id: 'mosely_auto', categoryId: 'automobile', name: 'Mosleys', aliases: ['mosleys', 'mosely auto okaz', 'mosely'] },
  { id: 'ls_custom', categoryId: 'automobile', name: 'LS-CUSTOM', aliases: ['ls custom', 'lscustom'] },

  // Publique - Privé
  { id: 'group_6', categoryId: 'public_prive', name: 'Groupe6', aliases: ['groupe6', 'group 6', 'groupe 6', 'g6'] },
  { id: 'ls_postal', categoryId: 'public_prive', name: 'LS Postal', aliases: ['ls postal', 'postal', 'lsp'] },
  { id: 'weazel_news', categoryId: 'public_prive', name: 'Weazel News', aliases: ['weazel news', 'weazel', 'journal'] },
  { id: 'tabac', categoryId: 'public_prive', name: 'Tabac', aliases: ['tabac'] },
  { id: 'taxi', categoryId: 'public_prive', name: 'Taxi', aliases: ['taxi', 'taxis'] },
  { id: 'cuve_industrie', categoryId: 'public_prive', name: 'Cuivre-Industries', aliases: ['cuivre industries', 'cuve industrie', 'cuivre'] },
  { id: 'vigneron', categoryId: 'public_prive', name: 'Vigneron', aliases: ['vigneron', 'vin'] },
  { id: 'studio_photo', categoryId: 'public_prive', name: 'Studio Photo', aliases: ['studio photo', 'photo'] },
  { id: 'cayo_ferraille', categoryId: 'public_prive', name: 'Cayo Ferraille', aliases: ['cayo ferraille', 'ferraille'] },
  { id: 'dynasty_8', categoryId: 'public_prive', name: 'Dynasty 8', aliases: ['dynasty 8', 'dynasty', 'immo'] },
  { id: 'medvedev_maritime', categoryId: 'public_prive', name: 'Medvedev Maritime', aliases: ['medvedev maritime', 'medvedev'] },
  { id: 'securo', categoryId: 'public_prive', name: 'Securo', aliases: ['securo', 'securo serv'] },

  // Événementiel
  { id: 'unicorn', categoryId: 'evenementiel', name: 'Unicorn', aliases: ['unicorn', 'vanilla unicorn'] },
  { id: 'yellow_jack', categoryId: 'evenementiel', name: 'Yellow Jack', aliases: ['yellow jack', 'yellow'] },
  { id: 'nocturnal', categoryId: 'evenementiel', name: 'Nocturnal', aliases: ['nocturnal'] },
  { id: 'perico_bar', categoryId: 'evenementiel', name: 'Perico BAR', aliases: ['perico bar', 'perico'] },
  { id: 'hookah_club', categoryId: 'evenementiel', name: 'Hookah Club', aliases: ['hookah club', 'hookah', 'chicha'] },
  { id: 'club_97', categoryId: 'evenementiel', name: 'Club 97', aliases: ['club 97', 'club97'] },
  { id: 'label_97', categoryId: 'evenementiel', name: 'Label 97', aliases: ['label 97', 'label97'] },
  { id: 'suncheon_plaza', categoryId: 'evenementiel', name: 'Suncheon Plaza', aliases: ['suncheon plaza', 'suncheon'] },
  { id: 'tequi_la_la', categoryId: 'evenementiel', name: 'Tequi-la-la', aliases: ['tequi la la', 'tequila'] },

  // Alimentaire
  { id: 'burger_shot', categoryId: 'alimentaire', name: 'Burger Shot', aliases: ['burger shot', 'burgershot'] },
  { id: 'casa_bellini', categoryId: 'alimentaire', name: 'Casa Bellini', aliases: ['casa bellini', 'bellini'] },
  { id: 'cat_cafe', categoryId: 'alimentaire', name: 'CatCafé', aliases: ['catcafe', 'cat cafe', 'cat'] },
  { id: 'ltd_little_seoul', categoryId: 'alimentaire', name: 'LTD Little Seoul', aliases: ['ltd little seoul', 'little seoul'] },
  { id: 'ltd_forum_drive', categoryId: 'alimentaire', name: 'LTD Forum Drive', aliases: ['ltd forum drive', 'forum drive'] },
  { id: 'ltd_grove_street', categoryId: 'alimentaire', name: 'LTD Groove Street', aliases: ['ltd groove street', 'ltd grove street', 'groove street', 'grove street'] },
  { id: 'ltd_mirror_park', categoryId: 'alimentaire', name: 'LTD Mirror Park', aliases: ['ltd mirror park', 'mirror park'] }
];

// Sector aliases from screenshots
const DISCORD_SECTOR_MAP = [
  { id: 'services_publics', name: 'Services Publics', aliases: ['service public', 'services publics'] },
  { id: 'automobile', name: 'Automobile', aliases: ['secteur automobile', 'automobile', 'auto'] },
  { id: 'public_prive', name: 'Publics & Privés', aliases: ['publique prive', 'publics et prives', 'public prive'] },
  { id: 'evenementiel', name: 'Événementiel', aliases: ['secteur evenementiel', 'evenementiel', 'event'] },
  { id: 'alimentaire', name: 'Alimentaire', aliases: ['secteur alimentaire', 'alimentaire', 'food'] }
];

const INITIAL_WEEKS = [
  {
    id: 'semaine_39_2026',
    title: 'Semaine 39 - Septembre 2026',
    startDate: '2026-09-21',
    endDate: '2026-09-27',
    isActive: true,
    isClosed: false
  },
  {
    id: 'semaine_38_2026',
    title: 'Semaine 38 - Septembre 2026',
    startDate: '2026-09-14',
    endDate: '2026-09-20',
    isActive: false,
    isClosed: true
  }
];

// Predefined accounts with passwords and roles
const INITIAL_USERS = [
  {
    id: 'usr_fondateur',
    username: 'fondateur',
    displayName: 'Fondateur Suprême',
    role: 'fondateur',
    categoryAccess: null,
    enterpriseAccess: null,
    password: 'admin'
  },
  {
    id: 'usr_ref_services_publics',
    username: 'ref_services',
    displayName: 'Référent Services Publics',
    role: 'referent',
    categoryAccess: 'services_publics',
    enterpriseAccess: null,
    password: 'pass'
  },
  {
    id: 'usr_ref_auto',
    username: 'ref_auto',
    displayName: 'Référent Automobile',
    role: 'referent',
    categoryAccess: 'automobile',
    enterpriseAccess: null,
    password: 'pass'
  },
  {
    id: 'usr_ref_evenementiel',
    username: 'ref_evenementiel',
    displayName: 'Référent Événementiel',
    role: 'referent',
    categoryAccess: 'evenementiel',
    enterpriseAccess: null,
    password: 'pass'
  },
  {
    id: 'usr_ref_public_prive',
    username: 'ref_public_prive',
    displayName: 'Référent Publics & Privés',
    role: 'referent',
    categoryAccess: 'public_prive',
    enterpriseAccess: null,
    password: 'pass'
  },
  {
    id: 'usr_ref_alimentaire',
    username: 'ref_alimentaire',
    displayName: 'Référent Alimentaire',
    role: 'referent',
    categoryAccess: 'alimentaire',
    enterpriseAccess: null,
    password: 'pass'
  }
];

// Seed Discord OAuth Configuration
const INITIAL_DISCORD_CONFIG = {
  enabled: true,
  clientId: '',
  clientSecret: '',
  guildId: '',
  botToken: '',
  redirectUri: 'http://localhost:3000/api/auth/discord/callback'
};

// Seed Discord Role Mappings based strictly on the user's server screenshot
const INITIAL_DISCORD_ROLE_MAPPINGS = [
  { id: 'map_fondateur', discordRoleName: '👑 Fondateur', discordRoleId: '', role: 'fondateur', categoryAccess: null, enterpriseAccess: null },
  { id: 'map_staff', discordRoleName: 'Staff', discordRoleId: '', role: 'fondateur', categoryAccess: null, enterpriseAccess: null },
  { id: 'map_patron_generic', discordRoleName: '👑 Patron(e)', discordRoleId: '', role: 'patron', categoryAccess: null, enterpriseAccess: null },
  { id: 'map_copatron_generic', discordRoleName: '🤝 Co-Patron(e)', discordRoleId: '', role: 'patron', categoryAccess: null, enterpriseAccess: null },
  
  // Secteur Services Publics
  { id: 'map_ref_sp', discordRoleName: '🏛️ Service Public', discordRoleId: '', role: 'referent', categoryAccess: 'services_publics', enterpriseAccess: null },
  { id: 'map_gouv', discordRoleName: 'us Gouvernement', discordRoleId: '', role: 'patron', categoryAccess: 'services_publics', enterpriseAccess: 'gouv' },
  { id: 'map_doj', discordRoleName: '⚖️ DOJ', discordRoleId: '', role: 'patron', categoryAccess: 'services_publics', enterpriseAccess: 'doj' },
  { id: 'map_avocat', discordRoleName: '👨‍⚖️ Cabinet Avocat', discordRoleId: '', role: 'patron', categoryAccess: 'services_publics', enterpriseAccess: 'cabinet_avocat' },
  { id: 'map_fbi', discordRoleName: '🥷 FBI', discordRoleId: '', role: 'patron', categoryAccess: 'services_publics', enterpriseAccess: 'fbi' },
  { id: 'map_sasp', discordRoleName: '👮 SASP', discordRoleId: '', role: 'patron', categoryAccess: 'services_publics', enterpriseAccess: 'sasp' },
  { id: 'map_ems', discordRoleName: '🚑 EMS', discordRoleId: '', role: 'patron', categoryAccess: 'services_publics', enterpriseAccess: 'ems' },
  { id: 'map_gouv_cayo', discordRoleName: '🏝️ · GOUVERNEMENT CAYO', discordRoleId: '', role: 'patron', categoryAccess: 'services_publics', enterpriseAccess: 'gouv_cayo' },
  { id: 'map_ng', discordRoleName: '🪖 National Guard', discordRoleId: '', role: 'patron', categoryAccess: 'services_publics', enterpriseAccess: 'national_guard' },

  // Secteur Automobile
  { id: 'map_ref_auto', discordRoleName: '🚘 Secteur Automobile', discordRoleId: '', role: 'referent', categoryAccess: 'automobile', enterpriseAccess: null },
  { id: 'map_concession', discordRoleName: '🏎️ Concess Auto', discordRoleId: '', role: 'patron', categoryAccess: 'automobile', enterpriseAccess: 'concession_auto' },
  { id: 'map_reaper', discordRoleName: '🔧 Reaper Custom', discordRoleId: '', role: 'patron', categoryAccess: 'automobile', enterpriseAccess: 'reaper_custom' },
  { id: 'map_carclub', discordRoleName: '🔧 · CarClub', discordRoleId: '', role: 'patron', categoryAccess: 'automobile', enterpriseAccess: 'car_club_76' },
  { id: 'map_flints', discordRoleName: '🔧 Flints Auto', discordRoleId: '', role: 'patron', categoryAccess: 'automobile', enterpriseAccess: 'flints_auto' },
  { id: 'map_phoenix', discordRoleName: '🛠️ Phoenix Custom', discordRoleId: '', role: 'patron', categoryAccess: 'automobile', enterpriseAccess: 'phoenix_custom' },
  { id: 'map_mosleys', discordRoleName: '🚗 Mosleys', discordRoleId: '', role: 'patron', categoryAccess: 'automobile', enterpriseAccess: 'mosely_auto' },
  { id: 'map_lscustom', discordRoleName: '🔧 · 𝐋𝐒-𝐂𝐔𝐒𝐓𝐎𝐌', discordRoleId: '', role: 'patron', categoryAccess: 'automobile', enterpriseAccess: 'ls_custom' },

  // Secteur Publique - Privé
  { id: 'map_ref_pubpriv', discordRoleName: '🏙️ Publique - Privé', discordRoleId: '', role: 'referent', categoryAccess: 'public_prive', enterpriseAccess: null },
  { id: 'map_groupe6', discordRoleName: '👥 Groupe6', discordRoleId: '', role: 'patron', categoryAccess: 'public_prive', enterpriseAccess: 'group_6' },
  { id: 'map_lspostal', discordRoleName: '📦 LS Postal', discordRoleId: '', role: 'patron', categoryAccess: 'public_prive', enterpriseAccess: 'ls_postal' },
  { id: 'map_weazel', discordRoleName: '📰 Weazel News', discordRoleId: '', role: 'patron', categoryAccess: 'public_prive', enterpriseAccess: 'weazel_news' },
  { id: 'map_tabac', discordRoleName: '🚬 Tabac', discordRoleId: '', role: 'patron', categoryAccess: 'public_prive', enterpriseAccess: 'tabac' },
  { id: 'map_taxi', discordRoleName: '🚕 Taxi', discordRoleId: '', role: 'patron', categoryAccess: 'public_prive', enterpriseAccess: 'taxi' },
  { id: 'map_cuivre', discordRoleName: '💎 cuivre-industries', discordRoleId: '', role: 'patron', categoryAccess: 'public_prive', enterpriseAccess: 'cuve_industrie' },
  { id: 'map_vigneron', discordRoleName: '🍇 Vigneron', discordRoleId: '', role: 'patron', categoryAccess: 'public_prive', enterpriseAccess: 'vigneron' },
  { id: 'map_studio_photo', discordRoleName: '📷 Studio Photo', discordRoleId: '', role: 'patron', categoryAccess: 'public_prive', enterpriseAccess: 'studio_photo' },
  { id: 'map_cayo_ferraille', discordRoleName: '⛏️ cayo ferraille', discordRoleId: '', role: 'patron', categoryAccess: 'public_prive', enterpriseAccess: 'cayo_ferraille' },
  { id: 'map_dynasty8', discordRoleName: '🏢 Dynasty 8', discordRoleId: '', role: 'patron', categoryAccess: 'public_prive', enterpriseAccess: 'dynasty_8' },
  { id: 'map_medvedev', discordRoleName: '⚓ · 𝐌𝐄𝐃𝐕𝐄𝐃𝐄𝐕-𝐌𝐀𝐑𝐈𝐓𝐈𝐌𝐄-&...', discordRoleId: '', role: 'patron', categoryAccess: 'public_prive', enterpriseAccess: 'medvedev_maritime' },

  // Secteur Événementiel
  { id: 'map_ref_event', discordRoleName: '🎭 Secteur Événementiel', discordRoleId: '', role: 'referent', categoryAccess: 'evenementiel', enterpriseAccess: null },
  { id: 'map_unicorn', discordRoleName: '🦄 Unicorn', discordRoleId: '', role: 'patron', categoryAccess: 'evenementiel', enterpriseAccess: 'unicorn' },
  { id: 'map_yellow', discordRoleName: '🎸 Yellow Jack', discordRoleId: '', role: 'patron', categoryAccess: 'evenementiel', enterpriseAccess: 'yellow_jack' },
  { id: 'map_nocturnal', discordRoleName: '🌴 Nocturnal', discordRoleId: '', role: 'patron', categoryAccess: 'evenementiel', enterpriseAccess: 'nocturnal' },
  { id: 'map_perico', discordRoleName: '🍹 Perico BAR', discordRoleId: '', role: 'patron', categoryAccess: 'evenementiel', enterpriseAccess: 'perico_bar' },
  { id: 'map_hookah', discordRoleName: '💨 Hookah Club', discordRoleId: '', role: 'patron', categoryAccess: 'evenementiel', enterpriseAccess: 'hookah_club' },
  { id: 'map_club97', discordRoleName: '🍸 Club 97', discordRoleId: '', role: 'patron', categoryAccess: 'evenementiel', enterpriseAccess: 'club_97' },
  { id: 'map_label97', discordRoleName: '🎵 Label 97', discordRoleId: '', role: 'patron', categoryAccess: 'evenementiel', enterpriseAccess: 'label_97' },

  // Secteur Alimentaire
  { id: 'map_ref_alim', discordRoleName: '🍔 Secteur Alimentaire', discordRoleId: '', role: 'referent', categoryAccess: 'alimentaire', enterpriseAccess: null },
  { id: 'map_burger', discordRoleName: '🍔 Burger Shot', discordRoleId: '', role: 'patron', categoryAccess: 'alimentaire', enterpriseAccess: 'burger_shot' },
  { id: 'map_bellini', discordRoleName: '🍕 Casa Bellini', discordRoleId: '', role: 'patron', categoryAccess: 'alimentaire', enterpriseAccess: 'casa_bellini' },
  { id: 'map_catcafe', discordRoleName: '☕ CatCafé', discordRoleId: '', role: 'patron', categoryAccess: 'alimentaire', enterpriseAccess: 'cat_cafe' },
  { id: 'map_ltd_seoul', discordRoleName: '🌿 LTD Little Seoul', discordRoleId: '', role: 'patron', categoryAccess: 'alimentaire', enterpriseAccess: 'ltd_little_seoul' },
  { id: 'map_ltd_forum', discordRoleName: '🌿 LTD Forum Drive', discordRoleId: '', role: 'patron', categoryAccess: 'alimentaire', enterpriseAccess: 'ltd_forum_drive' },
  { id: 'map_ltd_grove', discordRoleName: '🌿 LTD Groove Street', discordRoleId: '', role: 'patron', categoryAccess: 'alimentaire', enterpriseAccess: 'ltd_grove_street' },
  { id: 'map_ltd_mirror', discordRoleName: '🌿 LTD Mirror Park', discordRoleId: '', role: 'patron', categoryAccess: 'alimentaire', enterpriseAccess: 'ltd_mirror_park' }
];

// Realistic seed reports with turnover, expenses, and net profit
const INITIAL_REPORTS = [
  // Événementiel
  {
    id: 'rep_unicorn_s39',
    weekId: 'semaine_39_2026',
    enterpriseId: 'unicorn',
    categoryId: 'evenementiel',
    turnover: 1850000,
    expenses: 450000, // Charges salariales & approvisionnements
    netProfit: 1400000, // Bénéfice net
    employeeCount: 14,
    bossName: 'Tony Montana & Sarah Vance',
    events: [
      {
        id: 'ev_1',
        title: 'Grande Soirée Champagne & Néons',
        date: '2026-09-25',
        type: 'Soirée Clubbing',
        participants: 65,
        description: 'Soirée VIP avec DJ international, show exclusif et tombola pour une sportive.',
        proofUrl: ''
      },
      {
        id: 'ev_2',
        title: 'After-Party Pole Dance Cup',
        date: '2026-09-27',
        type: 'Compétition / Spectacle',
        participants: 45,
        description: 'Concours de danse avec jury et 200k$ de dotation.',
        proofUrl: ''
      }
    ],
    notes: 'Excellente semaine, chiffre d\'affaires et bénéfice records grâce à la convention du week-end.',
    badge: '🏆 Entreprise de la Semaine',
    founderComment: 'Félicitations au staff de l\'Unicorn pour l\'ambiance incroyable et la régularité !',
    updatedAt: '2026-09-28T10:00:00Z',
    updatedBy: 'ref_evenementiel'
  },
  {
    id: 'rep_tequila_s39',
    weekId: 'semaine_39_2026',
    enterpriseId: 'tequi_la_la',
    categoryId: 'evenementiel',
    turnover: 1250000,
    expenses: 320000,
    netProfit: 930000,
    employeeCount: 9,
    bossName: 'Jack Rock',
    events: [
      {
        id: 'ev_3',
        title: 'Concert Rock & Dégustation Bières',
        date: '2026-09-24',
        type: 'Concert Live',
        participants: 40,
        description: 'Groupe live des Lost MC et service au bar illimité.',
        proofUrl: ''
      }
    ],
    notes: 'Fréquentation stable, beaucoup de nouveaux clients motards.',
    badge: '⚡ Ambiance Électrique',
    founderComment: 'Toujours une valeur sûre pour l\'animation nocturne.',
    updatedAt: '2026-09-28T11:15:00Z',
    updatedBy: 'ref_evenementiel'
  },
  {
    id: 'rep_weazel_s39',
    weekId: 'semaine_39_2026',
    enterpriseId: 'weazel_news',
    categoryId: 'evenementiel',
    turnover: 920000,
    expenses: 240000,
    netProfit: 680000,
    employeeCount: 8,
    bossName: 'April O\'Neil',
    events: [
      {
        id: 'ev_4',
        title: 'Interview en direct du Gouverneur & Débat Citoyen',
        date: '2026-09-26',
        type: 'Émission Débat',
        participants: 80,
        description: 'Retransmission publique sur écran géant à Legion Square.',
        proofUrl: ''
      }
    ],
    notes: 'Couverture médiatique de tous les gros braquages et événements de la semaine.',
    badge: '📰 Média d\'Or',
    founderComment: 'Un travail journalistique impeccable cette semaine.',
    updatedAt: '2026-09-28T12:00:00Z',
    updatedBy: 'ref_evenementiel'
  },

  // Automobile
  {
    id: 'rep_concession_s39',
    weekId: 'semaine_39_2026',
    enterpriseId: 'concession_auto',
    categoryId: 'automobile',
    turnover: 3400000,
    expenses: 1200000, // Coût achat importation véhicules
    netProfit: 2200000,
    employeeCount: 11,
    bossName: 'Bruce Wayne',
    events: [
      {
        id: 'ev_6',
        title: 'Vente aux Enchères de Supercars',
        date: '2026-09-26',
        type: 'Vente aux Enchères',
        participants: 70,
        description: 'Vente exclusive de 4 modèles import rares avec champagne offert.',
        proofUrl: ''
      }
    ],
    notes: 'Record de ventes de supercars cette semaine.',
    badge: '💎 Top Chiffre d\'Affaires',
    founderComment: 'Un moteur économique majeur pour l\'État.',
    updatedAt: '2026-09-28T14:30:00Z',
    updatedBy: 'ref_auto'
  },
  {
    id: 'rep_ls_custom_s39',
    weekId: 'semaine_39_2026',
    enterpriseId: 'ls_custom',
    categoryId: 'automobile',
    turnover: 2150000,
    expenses: 650000,
    netProfit: 1500000,
    employeeCount: 16,
    bossName: 'Dominic Toretto',
    events: [
      {
        id: 'ev_5',
        title: 'Rassemblement & Concours Lowriders',
        date: '2026-09-23',
        type: 'Meet Automobile',
        participants: 55,
        description: 'Exposition de plus de 30 véhicules préparés, battle hydraulique.',
        proofUrl: ''
      }
    ],
    notes: 'Gros pic de commandes moteurs et peintures nacrées.',
    badge: '🥇 Leader Mécanique',
    founderComment: 'Chiffre impressionnant, équipe réactive et présente en ville.',
    updatedAt: '2026-09-28T14:00:00Z',
    updatedBy: 'ref_auto'
  },

  // Alimentaire
  {
    id: 'rep_burger_shot_s39',
    weekId: 'semaine_39_2026',
    enterpriseId: 'burger_shot',
    categoryId: 'alimentaire',
    turnover: 890000,
    expenses: 280000,
    netProfit: 610000,
    employeeCount: 18,
    bossName: 'Ronald Mac',
    events: [
      {
        id: 'ev_7',
        title: 'Grand Défi Burger Géant & Tombola',
        date: '2026-09-22',
        type: 'Animation Restaurant',
        participants: 50,
        description: 'Concours du plus gros mangeur de Bleeder Burger avec lots en cash.',
        proofUrl: ''
      }
    ],
    notes: 'Service non-stop assuré presque 20h/24 par notre équipe nombreuse.',
    badge: '🍔 Roi du Fast Food',
    founderComment: 'Super investissement dans les recrutements et la présence en ville !',
    updatedAt: '2026-09-28T15:00:00Z',
    updatedBy: 'ref_alimentaire'
  },
  {
    id: 'rep_casa_bellini_s39',
    weekId: 'semaine_39_2026',
    enterpriseId: 'casa_bellini',
    categoryId: 'alimentaire',
    turnover: 760000,
    expenses: 210000,
    netProfit: 550000,
    employeeCount: 10,
    bossName: 'Lorenzo Bellini',
    events: [
      {
        id: 'ev_8',
        title: 'Soirée Gastronomique Italienne',
        date: '2026-09-25',
        type: 'Dîner de Gala',
        participants: 35,
        description: 'Menu 5 services avec accord mets et vins pour les notables de la ville.',
        proofUrl: ''
      }
    ],
    notes: 'Clients très satisfaits du service à table soigné.',
    badge: '⭐ Saveur & Élégance',
    founderComment: 'Bravo pour la qualité du RP gastronomique.',
    updatedAt: '2026-09-28T15:20:00Z',
    updatedBy: 'ref_alimentaire'
  },

  // Services Publics
  {
    id: 'rep_sasp_s39',
    weekId: 'semaine_39_2026',
    enterpriseId: 'sasp',
    categoryId: 'services_publics',
    turnover: 1450000, // Amendes / Saisies reversées
    expenses: 420000, // Salaires agents, munitions, carburant
    netProfit: 1030000, // Excédent budgétaire / Bénéfice reversé
    employeeCount: 32,
    bossName: 'Commandant Miller',
    events: [
      {
        id: 'ev_9',
        title: 'Journée Portes Ouvertes & Démonstration K9',
        date: '2026-09-24',
        type: 'Portes Ouvertes',
        participants: 60,
        description: 'Accueil des citoyens au poste de police, tirs d\'initiation et stand de recrutement.',
        proofUrl: ''
      }
    ],
    notes: 'Taux de criminalité en baisse et patrouilles renforcées le soir.',
    badge: '🛡️ Ordre & Protection',
    founderComment: 'Effectif exemplaire et excellente présence sur le terrain.',
    updatedAt: '2026-09-28T16:00:00Z',
    updatedBy: 'ref_services'
  },
  {
    id: 'rep_ems_s39',
    weekId: 'semaine_39_2026',
    enterpriseId: 'ems',
    categoryId: 'services_publics',
    turnover: 1100000,
    expenses: 310000,
    netProfit: 790000,
    employeeCount: 24,
    bossName: 'Dr. House',
    events: [
      {
        id: 'ev_10',
        title: 'Campagne de Don du Sang & Formation Premiers Secours',
        date: '2026-09-22',
        type: 'Santé Publique',
        participants: 45,
        description: 'Sensibilisation aux gestes qui sauvent et bilans de santé offerts.',
        proofUrl: ''
      }
    ],
    notes: 'Intervention sur plus de 180 appels d\'urgences cette semaine.',
    badge: '❤️ Anges Gardiens',
    founderComment: 'Les citoyens peuvent compter sur vous jour et nuit, merci !',
    updatedAt: '2026-09-28T16:30:00Z',
    updatedBy: 'ref_services'
  },

  // Publics et Privés
  {
    id: 'rep_group_6_s39',
    weekId: 'semaine_39_2026',
    enterpriseId: 'group_6',
    categoryId: 'public_prive',
    turnover: 1650000,
    expenses: 520000,
    netProfit: 1130000,
    employeeCount: 15,
    bossName: 'Marcus Vance',
    events: [
      {
        id: 'ev_11',
        title: 'Opération Convoi Blindé Sécurisé',
        date: '2026-09-25',
        type: 'Sécurité & Transport de Fonds',
        participants: 25,
        description: 'Convoi interbancaire de grande envergure avec escorte armée.',
        proofUrl: ''
      }
    ],
    notes: 'Zéro incident sur les transferts de fonds de la semaine.',
    badge: '💼 Rigueur & Sécurité',
    founderComment: 'Travail sérieux et professionnel.',
    updatedAt: '2026-09-28T17:00:00Z',
    updatedBy: 'ref_public_prive'
  },
  {
    id: 'rep_dynasty_8_s39',
    weekId: 'semaine_39_2026',
    enterpriseId: 'dynasty_8',
    categoryId: 'public_prive',
    turnover: 2800000,
    expenses: 780000,
    netProfit: 2020000,
    employeeCount: 8,
    bossName: 'Victoria Sterling',
    events: [
      {
        id: 'ev_12',
        title: 'Visite VIP du Nouveau Quartier Résidentiel de Vinewood',
        date: '2026-09-26',
        type: 'Visite Immobilière',
        participants: 30,
        description: 'Cocktail de présentation des villas de luxe et appartements standing.',
        proofUrl: ''
      }
    ],
    notes: '9 biens vendus et 14 baux commerciaux renouvelés.',
    badge: '🏰 Prestige Immobilier',
    founderComment: 'Superbe dynamisme économique pour les nouveaux arrivants.',
    updatedAt: '2026-09-28T17:30:00Z',
    updatedBy: 'ref_public_prive'
  }
];

class Database {
  constructor() {
    this.data = {
      categories: INITIAL_CATEGORIES,
      enterprises: INITIAL_ENTERPRISES,
      weeks: INITIAL_WEEKS,
      users: INITIAL_USERS,
      reports: INITIAL_REPORTS,
      discordConfig: INITIAL_DISCORD_CONFIG,
      discordRoleMappings: INITIAL_DISCORD_ROLE_MAPPINGS,
      settings: {
        activeWeekId: 'semaine_39_2026',
        appName: 'Portail des Entreprises de Los Santos',
        cityName: 'Los Santos',
        currencySymbol: '$'
      }
    };
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        if (!this.data.categories || this.data.categories.length === 0) this.data.categories = INITIAL_CATEGORIES;
        if (!this.data.enterprises || this.data.enterprises.length === 0) {
          this.data.enterprises = INITIAL_ENTERPRISES;
        } else {
          INITIAL_ENTERPRISES.forEach(ie => {
            if (!this.data.enterprises.some(e => e.id === ie.id)) {
              this.data.enterprises.push(ie);
            }
          });
        }

        if (!this.data.users || this.data.users.length === 0) this.data.users = INITIAL_USERS;
        if (!this.data.weeks || this.data.weeks.length === 0) this.data.weeks = INITIAL_WEEKS;
        if (!this.data.reports) this.data.reports = INITIAL_REPORTS;
        if (!this.data.discordConfig) this.data.discordConfig = INITIAL_DISCORD_CONFIG;

        if (!this.data.discordRoleMappings || this.data.discordRoleMappings.length === 0) {
          this.data.discordRoleMappings = INITIAL_DISCORD_ROLE_MAPPINGS;
        } else {
          INITIAL_DISCORD_ROLE_MAPPINGS.forEach(im => {
            if (!this.data.discordRoleMappings.some(m => m.id === im.id)) {
              this.data.discordRoleMappings.push(im);
            }
          });
        }
      } catch (err) {
        console.error('Error loading DB file, reinitializing default:', err);
        this.save();
      }
    } else {
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  getCategories(user) {
    if (!user || user.role === 'fondateur') {
      return this.data.categories;
    }
    if (user.categoryAccess) {
      return this.data.categories.filter(c => c.id === user.categoryAccess);
    }
    return [];
  }

  getEnterprises(user) {
    if (!user || user.role === 'fondateur') {
      return this.data.enterprises;
    }
    if (user.role === 'patron' && user.enterpriseAccess) {
      return this.data.enterprises.filter(e => e.id === user.enterpriseAccess);
    }
    if (user.categoryAccess) {
      return this.data.enterprises.filter(e => e.categoryId === user.categoryAccess);
    }
    return [];
  }

  getWeeks() {
    return this.data.weeks;
  }

  getActiveWeek() {
    const active = this.data.weeks.find(w => w.isActive);
    return active || this.data.weeks[0];
  }

  getReports(weekId, user) {
    const targetWeekId = weekId || this.getActiveWeek().id;
    let list = this.data.reports.filter(r => r.weekId === targetWeekId);

    if (user && user.role !== 'fondateur') {
      if (user.role === 'patron' && user.enterpriseAccess) {
        list = list.filter(r => r.enterpriseId === user.enterpriseAccess);
      } else if (user.categoryAccess) {
        list = list.filter(r => r.categoryId === user.categoryAccess);
      }
    }
    return list;
  }

  saveReport(reportData, user) {
    const ent = this.data.enterprises.find(e => e.id === reportData.enterpriseId);
    if (!ent) throw new Error('Entreprise introuvable');

    if (user.role !== 'fondateur') {
      if (user.role === 'patron' && user.enterpriseAccess !== ent.id) {
        throw new Error('Action non autorisée: vous ne pouvez gérer que votre entreprise.');
      }
      if (user.role === 'referent' && user.categoryAccess !== ent.categoryId) {
        throw new Error('Action non autorisée: vous ne pouvez gérer que votre catégorie attribuée.');
      }
    }

    const weekId = reportData.weekId || this.getActiveWeek().id;
    let existingIndex = this.data.reports.findIndex(
      r => r.weekId === weekId && r.enterpriseId === reportData.enterpriseId
    );

    const turnover = Number(reportData.turnover) || 0;
    const expenses = Number(reportData.expenses) || 0;
    const netProfit = reportData.netProfit !== undefined ? Number(reportData.netProfit) : (turnover - expenses);

    const reportObj = {
      id: existingIndex >= 0 ? this.data.reports[existingIndex].id : 'rep_' + Date.now(),
      weekId: weekId,
      enterpriseId: ent.id,
      categoryId: ent.categoryId,
      turnover: turnover,
      expenses: expenses,
      netProfit: netProfit,
      employeeCount: Number(reportData.employeeCount) || 0,
      bossName: reportData.bossName || ent.defaultBoss || '',
      events: Array.isArray(reportData.events) ? reportData.events : [],
      notes: reportData.notes || '',
      badge: (existingIndex >= 0 && this.data.reports[existingIndex].badge) || reportData.badge || '',
      founderComment: (existingIndex >= 0 && this.data.reports[existingIndex].founderComment) || reportData.founderComment || '',
      updatedAt: new Date().toISOString(),
      updatedBy: user.displayName || user.username
    };

    if (existingIndex >= 0) {
      this.data.reports[existingIndex] = {
        ...this.data.reports[existingIndex],
        ...reportObj,
        badge: reportData.badge !== undefined ? reportData.badge : this.data.reports[existingIndex].badge,
        founderComment: reportData.founderComment !== undefined ? reportData.founderComment : this.data.reports[existingIndex].founderComment
      };
    } else {
      this.data.reports.push(reportObj);
    }

    this.save();
    return existingIndex >= 0 ? this.data.reports[existingIndex] : reportObj;
  }

  validateAndAwardReport(reportId, badge, comment) {
    const report = this.data.reports.find(r => r.id === reportId);
    if (!report) throw new Error('Rapport introuvable');
    if (badge !== undefined) report.badge = badge;
    if (comment !== undefined) report.founderComment = comment;
    report.updatedAt = new Date().toISOString();
    this.save();
    return report;
  }

  createWeek(title, startDate, endDate, setAsActive = true) {
    const id = 'semaine_' + Date.now();
    if (setAsActive) {
      this.data.weeks.forEach(w => w.isActive = false);
    }
    const newWeek = {
      id,
      title,
      startDate,
      endDate,
      isActive: setAsActive,
      isClosed: false
    };
    this.data.weeks.unshift(newWeek);
    if (setAsActive) {
      this.data.settings.activeWeekId = id;
    }
    this.save();
    return newWeek;
  }

  setActiveWeek(weekId) {
    const target = this.data.weeks.find(w => w.id === weekId);
    if (!target) throw new Error('Semaine introuvable');
    this.data.weeks.forEach(w => w.isActive = (w.id === weekId));
    this.data.settings.activeWeekId = weekId;
    this.save();
    return target;
  }

  getUsers() {
    return this.data.users.map(({ password, ...u }) => u);
  }

  getUserByCredentials(username, password) {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
  }

  getUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  saveUser(userData) {
    let user;
    if (userData.id) {
      user = this.data.users.find(u => u.id === userData.id);
      if (!user) throw new Error('Utilisateur introuvable');
      user.displayName = userData.displayName || user.displayName;
      user.role = userData.role || user.role;
      user.categoryAccess = userData.categoryAccess !== undefined ? userData.categoryAccess : user.categoryAccess;
      user.enterpriseAccess = userData.enterpriseAccess !== undefined ? userData.enterpriseAccess : user.enterpriseAccess;
      if (userData.password) user.password = userData.password;
    } else {
      if (this.data.users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
        throw new Error('Ce nom d\'utilisateur existe déjà');
      }
      user = {
        id: 'usr_' + Date.now(),
        username: userData.username,
        displayName: userData.displayName || userData.username,
        role: userData.role || 'referent',
        categoryAccess: userData.categoryAccess || null,
        enterpriseAccess: userData.enterpriseAccess || null,
        password: userData.password || '1234'
      };
      this.data.users.push(user);
    }
    this.save();
    const { password, ...safeUser } = user;
    return safeUser;
  }

  deleteUser(userId) {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) throw new Error('Utilisateur non trouvé');
    if (user.role === 'fondateur' && user.username === 'fondateur') {
      throw new Error('Impossible de supprimer le compte Fondateur principal');
    }
    this.data.users = this.data.users.filter(u => u.id !== userId);
    this.save();
    return true;
  }

  addEnterprise(name, categoryId, defaultBoss = '', logoText = '') {
    const cat = this.data.categories.find(c => c.id === categoryId);
    if (!cat) throw new Error('Catégorie invalide');
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
    const ent = {
      id,
      name,
      categoryId,
      defaultBoss,
      logoText: logoText || name.substring(0, 3).toUpperCase()
    };
    this.data.enterprises.push(ent);
    this.save();
    return ent;
  }

  // ==========================================
  // DISCORD OAUTH & ROLE MAPPING SYSTEM
  // ==========================================
  getDiscordConfig() {
    return this.data.discordConfig || INITIAL_DISCORD_CONFIG;
  }

  saveDiscordConfig(config) {
    this.data.discordConfig = {
      ...this.getDiscordConfig(),
      ...config
    };
    this.save();
    return this.data.discordConfig;
  }

  getDiscordRoleMappings() {
    return this.data.discordRoleMappings || INITIAL_DISCORD_ROLE_MAPPINGS;
  }

  saveDiscordRoleMapping(mappingData) {
    let mapping;
    if (mappingData.id) {
      mapping = this.data.discordRoleMappings.find(m => m.id === mappingData.id);
      if (!mapping) throw new Error('Règle de mapping introuvable');
      mapping.discordRoleName = mappingData.discordRoleName || mapping.discordRoleName;
      mapping.discordRoleId = mappingData.discordRoleId !== undefined ? mappingData.discordRoleId : mapping.discordRoleId;
      mapping.role = mappingData.role || mapping.role;
      mapping.categoryAccess = mappingData.categoryAccess !== undefined ? mappingData.categoryAccess : mapping.categoryAccess;
      mapping.enterpriseAccess = mappingData.enterpriseAccess !== undefined ? mappingData.enterpriseAccess : mapping.enterpriseAccess;
    } else {
      mapping = {
        id: 'map_' + Date.now(),
        discordRoleName: mappingData.discordRoleName,
        discordRoleId: mappingData.discordRoleId || '',
        role: mappingData.role || 'patron',
        categoryAccess: mappingData.categoryAccess || null,
        enterpriseAccess: mappingData.enterpriseAccess || null
      };
      this.data.discordRoleMappings.push(mapping);
    }
    this.save();
    return mapping;
  }

  deleteDiscordRoleMapping(mappingId) {
    this.data.discordRoleMappings = this.data.discordRoleMappings.filter(m => m.id !== mappingId);
    this.save();
    return true;
  }

  /**
   * Resolves Discord Roles to an application user session.
   * Handles multi-roles (e.g. ['👑 Patron(e)', '👮 SASP'])
   * as well as Co-Patron, Sector Referents, and SuperAdmin.
   */
  resolveDiscordUserSession(discordUser, memberRoles = []) {
    let rolesList = [];
    if (Array.isArray(memberRoles)) {
      rolesList = memberRoles;
    } else if (typeof memberRoles === 'string') {
      if (memberRoles.includes('+')) {
        rolesList = memberRoles.split('+').map(s => s.trim());
      } else if (memberRoles.includes(',')) {
        rolesList = memberRoles.split(',').map(s => s.trim());
      } else {
        rolesList = [memberRoles];
      }
    }

    const normalizedList = rolesList.map(r => normalizeDiscordRole(r)).filter(Boolean);

    // 1. Fondateur / Staff / Admin check
    const isFounder = normalizedList.some(r =>
      r.includes('fondateur') || r.includes('founder') || r.includes('staff') || r.includes('superadmin') || r === 'admin'
    );
    if (isFounder) {
      return this._upsertDiscordSession(discordUser, {
        role: 'fondateur',
        categoryAccess: null,
        enterpriseAccess: null,
        matchedDiscordRole: '👑 Fondateur (SuperAdmin)'
      });
    }

    // 2. Check for Patron / Co-Patron rank in user roles
    const isCoPatron = normalizedList.some(r => r.includes('co patron'));
    const isPatron = isCoPatron || normalizedList.some(r => r.includes('patron'));

    // 3. Find Enterprise match
    let matchedEnterprise = null;
    let matchedRawRole = '';

    // First: check custom database mappings
    const mappings = this.getDiscordRoleMappings();
    for (const r of rolesList) {
      const normR = normalizeDiscordRole(r);
      const match = mappings.find(m => 
        (m.discordRoleName && normalizeDiscordRole(m.discordRoleName) === normR) ||
        (m.discordRoleId && m.discordRoleId === String(r))
      );
      if (match && match.enterpriseAccess) {
        matchedEnterprise = this.data.enterprises.find(e => e.id === match.enterpriseAccess);
        if (matchedEnterprise) {
          matchedRawRole = r;
          break;
        }
      }
    }

    // Second: check intelligent dictionary with aliases
    if (!matchedEnterprise) {
      for (const ent of DISCORD_ENTERPRISE_MAP) {
        for (let i = 0; i < normalizedList.length; i++) {
          const nr = normalizedList[i];
          if (nr === 'patron e' || nr === 'co patron e' || nr === 'patron' || nr === 'co patron') continue;

          const isAliasMatch = ent.aliases.some(alias => {
            const normAlias = normalizeDiscordRole(alias);
            return nr === normAlias || nr.includes(normAlias) || normAlias.includes(nr);
          });

          if (isAliasMatch) {
            matchedEnterprise = this.data.enterprises.find(e => e.id === ent.id);
            if (matchedEnterprise) {
              matchedRawRole = rolesList[i];
              break;
            }
          }
        }
        if (matchedEnterprise) break;
      }
    }

    // If Enterprise found:
    if (matchedEnterprise) {
      const statusTitle = isCoPatron ? 'Co-Patron(e)' : (isPatron ? 'Patron(e)' : 'Patron(e)');
      const icon = isCoPatron ? '🤝' : '👑';
      const fullDisplay = `${icon} ${statusTitle} ${matchedEnterprise.name}`;

      return this._upsertDiscordSession(discordUser, {
        role: 'patron',
        enterpriseAccess: matchedEnterprise.id,
        categoryAccess: matchedEnterprise.categoryId,
        matchedDiscordRole: fullDisplay
      });
    }

    // 4. Sector Referent Check (e.g. '🚘 Secteur Automobile')
    let matchedSector = null;
    for (const sec of DISCORD_SECTOR_MAP) {
      for (let i = 0; i < normalizedList.length; i++) {
        const nr = normalizedList[i];
        if (sec.aliases.some(alias => nr === normalizeDiscordRole(alias) || nr.includes(normalizeDiscordRole(alias)))) {
          matchedSector = this.data.categories.find(c => c.id === sec.id);
          if (matchedSector) break;
        }
      }
      if (matchedSector) break;
    }

    if (matchedSector) {
      return this._upsertDiscordSession(discordUser, {
        role: 'referent',
        enterpriseAccess: null,
        categoryAccess: matchedSector.id,
        matchedDiscordRole: `Référent ${matchedSector.name}`
      });
    }

    // 5. User has Patron role but no enterprise assigned
    if (isPatron) {
      return this._upsertDiscordSession(discordUser, {
        role: 'unassigned_patron',
        enterpriseAccess: null,
        categoryAccess: null,
        matchedDiscordRole: isCoPatron ? '🤝 Co-Patron(e) (Sans Entreprise assignée)' : '👑 Patron(e) (Sans Entreprise assignée)'
      });
    }

    // 6. Default Guest
    return this._upsertDiscordSession(discordUser, {
      role: 'guest',
      enterpriseAccess: null,
      categoryAccess: null,
      matchedDiscordRole: 'Membre Discord (Sans rôle entreprise)'
    });
  }

  _upsertDiscordSession(discordUser, sessionData) {
    const discordId = discordUser.id || 'sim_' + Date.now();
    const username = discordUser.username || discordUser.global_name || 'discord_user';
    const displayName = discordUser.global_name || discordUser.username || 'Citoyen Discord';
    const avatar = discordUser.avatar 
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : 'https://cdn.discordapp.com/embed/avatars/0.png';

    let user = this.data.users.find(u => u.discordId === discordId);
    if (!user) {
      user = {
        id: 'usr_dc_' + discordId,
        discordId: discordId,
        username: 'dc_' + username.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        displayName: `${sessionData.matchedDiscordRole} (${displayName})`,
        avatar: avatar,
        authProvider: 'discord',
        role: sessionData.role,
        categoryAccess: sessionData.categoryAccess,
        enterpriseAccess: sessionData.enterpriseAccess,
        matchedDiscordRole: sessionData.matchedDiscordRole
      };
      this.data.users.push(user);
    } else {
      user.displayName = `${sessionData.matchedDiscordRole} (${displayName})`;
      user.avatar = avatar;
      user.role = sessionData.role;
      user.categoryAccess = sessionData.categoryAccess;
      user.enterpriseAccess = sessionData.enterpriseAccess;
      user.matchedDiscordRole = sessionData.matchedDiscordRole;
    }

    this.save();
    const { password, ...safeUser } = user;
    return {
      user: safeUser,
      matchedRole: sessionData.matchedDiscordRole,
      enterprise: this.data.enterprises.find(e => e.id === sessionData.enterpriseAccess) || null,
      category: this.data.categories.find(c => c.id === sessionData.categoryAccess) || null
    };
  }
}

module.exports = new Database();
