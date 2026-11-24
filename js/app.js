/* Nouvelle Partie + : logique du prototype (sans serveur, s'ouvre en double-clic).
   Deux sources de jeux :
   - la démo (js/data.js) : 62 jeux enrichis à la main (textes en français, humeurs, avis d'exemple) ;
   - le catalogue IGDB (data/catalogue.js) s'il a été téléchargé avec importer-catalogue.bat.
   Quand le catalogue est là, les jeux de la démo gardent leurs textes et le reste vient d'IGDB. */
(() => {
  'use strict';

  const DEMO = window.JEUX || [];
  const FORTS = window.FORTS, HUM = window.HUMEURS;
  const CAT = window.CATALOGUE && window.CATALOGUE.jeux ? window.CATALOGUE : null;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const main = $('#main');
  const reduit = matchMedia('(prefers-reduced-motion: reduce)');

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'");
  const cle = (s) => norm(s).replace(/[^a-z0-9]+/g, ' ').trim();
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
  const nb = (n) => Number(n).toLocaleString('fr-FR');
  const pl = (n, un, plusieurs) => (n > 1 ? plusieurs : un);

  const VERDICTS = ['Coup de cœur', 'Bon', 'Bof', 'Pas pour moi'];

  /* ---------- Traductions des données IGDB ---------- */
  const GENRES_FR = {
    'Point-and-click': 'Point & click', Fighting: 'Combat', Shooter: 'Tir', Music: 'Musique', Platform: 'Plateforme',
    Puzzle: 'Énigmes', Racing: 'Course', 'Real Time Strategy (RTS)': 'Stratégie en temps réel', 'Role-playing (RPG)': 'RPG',
    Simulator: 'Simulation', Sport: 'Sport', Strategy: 'Stratégie', 'Turn-based strategy (TBS)': 'Stratégie au tour par tour',
    Tactical: 'Tactique', "Hack and slash/Beat 'em up": "Beat'em all", 'Quiz/Trivia': 'Quiz', Pinball: 'Flipper',
    Adventure: 'Aventure', Indie: 'Indépendant', Arcade: 'Arcade', 'Visual Novel': 'Visual novel', 'Card & Board Game': 'Cartes et plateau', MOBA: 'MOBA'
  };
  const THEMES_FR = {
    Action: 'Action', Fantasy: 'Fantasy', 'Science fiction': 'Science-fiction', Horror: 'Horreur', Thriller: 'Thriller', Survival: 'Survie',
    Historical: 'Historique', Stealth: 'Infiltration', Comedy: 'Comédie', Business: 'Gestion', Drama: 'Drame', 'Non-fiction': 'Documentaire',
    Sandbox: 'Bac à sable', Educational: 'Éducatif', Kids: 'Pour les enfants', 'Open world': 'Monde ouvert', Warfare: 'Guerre',
    Party: 'Party game', '4X': '4X', Mystery: 'Mystère', Romance: 'Romance'
  };
  const FAMILLES = ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile', 'Rétro et autres'];
  function famille(nom) {
    if (/playstation|\bpsp\b|vita|^ps\d/i.test(nom)) return 'PlayStation';
    if (/xbox/i.test(nom)) return 'Xbox';
    if (/nintendo|switch|wii|game ?boy|gamecube|famicom|\bnes\b|snes|\bds\b|3ds|virtual boy/i.test(nom)) return 'Nintendo';
    if (/ios|android|mobile|windows phone/i.test(nom)) return 'Mobile';
    if (/windows|linux|mac|dos\b|^pc\b|\(pc\)/i.test(nom)) return 'PC';
    return 'Rétro et autres';
  }
  // Les noms des machines tels que les joueurs français les disent.
  const COURT = {
    'PC (Microsoft Windows)': 'PC', 'Xbox Series X|S': 'Xbox Series', 'PlayStation 5': 'PS5', 'PlayStation 4': 'PS4', 'Nintendo Switch': 'Switch', 'Nintendo Switch 2': 'Switch 2', 'Xbox One': 'Xbox One', Mac: 'Mac', Linux: 'Linux', iOS: 'iOS', Android: 'Android',
    'PlayStation 3': 'PS3', 'PlayStation 2': 'PS2', PlayStation: 'PS1', 'PlayStation Vita': 'PS Vita', 'PlayStation Portable': 'PSP', 'PlayStation VR': 'PS VR', 'PlayStation VR2': 'PS VR2',
    'Xbox 360': 'Xbox 360', Xbox: 'Xbox (2001)', 'Wii U': 'Wii U', Wii: 'Wii', 'Nintendo DS': 'DS', 'Nintendo DSi': 'DSi', 'Nintendo 3DS': '3DS', 'Nintendo GameCube': 'GameCube', 'Nintendo 64': 'N64',
    'Super Nintendo Entertainment System': 'Super Nintendo', 'Nintendo Entertainment System': 'NES', 'Family Computer': 'Famicom', 'Super Famicom': 'Super Famicom', 'Game Boy Advance': 'GBA', 'Game Boy Color': 'Game Boy Color', 'Game Boy': 'Game Boy',
    'Sega Mega Drive/Genesis': 'Mega Drive', 'Sega Saturn': 'Saturn', Dreamcast: 'Dreamcast', 'Sega Master System/Mark III': 'Master System', 'Sega Game Gear': 'Game Gear',
    'Google Stadia': 'Stadia', 'Web browser': 'Navigateur', 'Legacy Mobile Device': 'Ancien mobile', 'Commodore C64/128/MAX': 'C64', 'Atari ST/STE': 'Atari ST', 'Meta Quest 2': 'Quest 2', 'Meta Quest 3': 'Quest 3'
  };
  // Les machines d'aujourd'hui d'abord, puis les anciennes, de la plus récente à la plus ancienne.
  const ORDRE_MACHINES = ['PC', 'PS5', 'Xbox Series', 'Switch 2', 'Switch', 'PS4', 'Xbox One', 'Mac', 'Linux', 'iOS', 'Android', 'PS VR2', 'Quest 3', 'Quest 2', 'SteamVR', 'PS VR',
    'PS3', 'Xbox 360', 'Wii U', '3DS', 'PS Vita', 'Wii', 'DS', 'PSP', 'PS2', 'GameCube', 'Xbox (2001)', 'GBA', 'Dreamcast', 'PS1', 'N64', 'Saturn', 'Game Boy Color', 'Super Nintendo', 'Mega Drive', 'Game Boy', 'NES', 'Master System', 'Arcade', 'DOS', 'Stadia'];
  const rangMachine = (x) => { const i = ORDRE_MACHINES.indexOf(x); return i < 0 ? 999 : i; };
  const trierMachines = (l) => [...l].sort((a, b) => rangMachine(a) - rangMachine(b));

  // Nos familles de jeux (pour filtrer), calculées depuis les genres, thèmes et mots-clés IGDB.
  const TYPES = [
    ['RPG', 'RPG'], ['Action', "jeu d'action"], ['Aventure', "jeu d'aventure"], ['Plateforme', 'jeu de plateforme'], ['Roguelite', 'roguelite'],
    ['Metroidvania', 'metroidvania'], ['Énigmes', "jeu d'énigmes"], ['Narratif', 'jeu narratif'], ['Gestion', 'jeu de gestion'], ['Stratégie', 'jeu de stratégie'],
    ['Monde ouvert', 'monde ouvert'], ['Tir', 'jeu de tir'], ['Combat', 'jeu de combat'], ['Course', 'jeu de course'], ['Sport', 'jeu de sport'],
    ['Horreur', "jeu d'horreur"], ['Cartes', 'jeu de cartes'], ['Soulslike', 'soulslike'], ['MOBA', 'MOBA'], ['Battle royale', 'battle royale'], ['Rythme', 'jeu de rythme'],
    ["Beat'em all", "beat'em all"]
  ];
  // Comment on y joue : seul, à deux, en coop, contre d'autres joueurs en ligne…
  const GENRES_VERSUS = ['Fighting', 'Sport', 'Racing', 'Real Time Strategy (RTS)'];
  function joueursIgdb(g, e, m) {
    const G = (x) => g.includes(x), E = (x) => e.includes(x), M = (x) => m.includes(x);
    const mort = E('multi-mort'); // « dead multiplayer » : les serveurs sont fermés
    const multi = M('Multiplayer');
    // Contre d'autres joueurs, avec une force de 0 à 3 :
    // 3 = c'est le cœur du jeu (MOBA, battle royale, jeu multijoueur sans mode solo : Valorant, LoL) ;
    // 2 = IGDB le dit (pvp, esports, 5v5…) ; 1 = on le devine (jeu de combat, sport, course, stratégie ou tir en multi).
    const versus = multi && GENRES_VERSUS.some(G); // combat, sport, course, stratégie en multi : c'est du versus
    const tirMulti = multi && G('Shooter') && !M('Co-operative') && !E('coop');
    const battleRoyale = M('Battle Royale') && (G('Shooter') || G('Platform') || !g.some((x) => ['Racing', 'Sport'].includes(x))); // pas Forza Horizon
    const coeur = !M('Massively Multiplayer Online (MMO)') && (G('MOBA') || battleRoyale || (multi && !M('Single player') && (E('pvp') || G('Shooter') || GENRES_VERSUS.some(G))));
    const pvp = mort ? 0 : coeur ? 3 : E('pvp') || versus ? 2 : tirMulti ? 1 : 0;
    const coop = M('Co-operative') || E('coop');
    const canape = M('Split screen') || E('canape');
    const mmo = M('Massively Multiplayer Online (MMO)');
    return {
      solo: m.length === 0 || M('Single player'), coop, canape, pvp, mmo, mort,
      coopForte: E('coop'), localForte: E('canape'), // IGDB insiste sur la coop (« online co-op ») ou le jeu sur le même écran (« couch co-op »)
      deux: coop || canape || (multi && ['Fighting', 'Sport', 'Racing'].some(G)),
      groupe: multi || mmo || M('Battle Royale') || coop
    };
  }
  // IGDB colle « RPG » sur beaucoup de jeux qui n'en sont pas (Tropico 5, Broken Sword 5, Potion Craft, Les Sims).
  // Avec un point & click, une simulation ou des énigmes, on veut une preuve : combat au tour par tour, JRPG, choix qui comptent,
  // stratégie au tour par tour, hack'n'slash. Sans preuve, le jeu reste un RPG pour la recherche, mais passe après les vrais.
  const rpgDouteux = (g, e) => g.includes('Role-playing (RPG)')
    && (g.includes('Point-and-click') || g.includes('Simulator') || (g.includes('Puzzle') && !g.includes('Turn-based strategy (TBS)') && !g.includes("Hack and slash/Beat 'em up")))
    && !['sujet:tourpartour', 'sujet:jrpg', 'sujet:choix'].some((x) => e.includes(x))
    && !['Turn-based strategy (TBS)', "Hack and slash/Beat 'em up", 'Tactical'].some((x) => g.includes(x));
  function typesIgdb(g, t, e, m) {
    const s = new Set();
    const G = (x) => g.includes(x), T = (x) => t.includes(x), E = (x) => e.includes(x);
    if (G('Role-playing (RPG)') && !G('MOBA')) s.add('RPG'); // IGDB range League of Legends dans les RPG
    if (T('Action') || G('Shooter') || G('Fighting') || G("Hack and slash/Beat 'em up")) s.add('Action');
    const tir = G('Shooter') || G("Hack and slash/Beat 'em up");
    if (G('Adventure') || G('Point-and-click')) s.add('Aventure');
    if (G('Platform')) s.add('Plateforme');
    if (E('roguelite')) s.add('Roguelite');
    if (E('metroidvania')) s.add('Metroidvania');
    if (G('Puzzle')) s.add('Énigmes');
    if (G('Visual Novel') || E('narratif') || T('Drama')) s.add('Narratif');
    // IGDB met « simulation » sur GTA III, Call of Duty 4 ou Fallout 4 : on veut une vraie gestion.
    const tactiqueOuTour = G('Turn-based strategy (TBS)') || G('Tactical');
    if (T('Business') || (E('gestion') && !tactiqueOuTour && g.some((x) => ['Simulator', 'Strategy', 'Real Time Strategy (RTS)'].includes(x)))
      || (E('base') && G('Simulator') && !tactiqueOuTour && !G('Real Time Strategy (RTS)') && !G('Adventure') && !G('Shooter')) || E('sujet:citybuilder') || E('fort:colonie') || E('fort:automatisation')
      || (G('Simulator') && !tactiqueOuTour && !G('Shooter') && !G('Real Time Strategy (RTS)') && (G('Strategy') || !g.some((x) => ['Adventure', 'Racing', 'Sport', 'Fighting', 'Platform', "Hack and slash/Beat 'em up", 'Music', 'Arcade'].includes(x))))) s.add('Gestion'); // pas Company of Heroes ni Guitar Hero
    // Valorant est « tactique », pas un jeu de stratégie ; Suikoden II ou L.A. Noire ont « stratégie » chez IGDB sans en être.
    if (G('Real Time Strategy (RTS)') || (G('Turn-based strategy (TBS)') && (!G('Role-playing (RPG)') || G('Tactical'))) || T('4X')
      || ((G('Strategy') || (G('Tactical') && !G('Shooter'))) && !g.some((x) => ['Role-playing (RPG)', 'Adventure', 'Shooter', 'Platform'].includes(x)))) s.add('Stratégie');
    if (T('Open world')) s.add('Monde ouvert');
    if (G('Shooter')) s.add('Tir');
    if (G('Fighting') && !G('Role-playing (RPG)') && !T('Open world') && !T('Survival')) s.add('Combat'); // « un jeu de combat » = Street Fighter, pas Batman
    if (G("Hack and slash/Beat 'em up")) s.add("Beat'em all");
    if (G('Racing') && !tir) s.add('Course'); // IGDB range GTA dans les jeux de course
    if (G('Sport') && !(G('Racing') && !E('sujet:foot'))) s.add('Sport'); // Forza n'est pas un jeu de sport, Rocket League si
    if (T('Horror')) s.add('Horreur');
    if (G('Card & Board Game') || E('cartes')) s.add('Cartes');
    if (E('soulslike') && !G('Turn-based strategy (TBS)') && !E('sujet:tourpartour')) s.add('Soulslike'); // pas Clair Obscur
    if (G('MOBA')) s.add('MOBA');
    if (m.includes('Battle Royale') && (G('Shooter') || G('Platform') || !g.some((x) => ['Racing', 'Sport'].includes(x)))) s.add('Battle royale'); // pas Forza Horizon
    if (G('Music') || E('sujet:rythme')) s.add('Rythme');
    if (m.includes('Co-operative') || m.includes('Split screen')) s.add('Coop');
    return [...s];
  }
  // Les sujets (« un jeu de pirates », « dans l'espace ») : mots-clés IGDB triés par l'import, plus les thèmes IGDB.
  const SUJETS_THEMES = { Historical: 'historique', Romance: 'romance', Comedy: 'comedie', Kids: 'enfants', Party: 'ambiance', Stealth: 'infiltration', Survival: 'survie', Sandbox: 'sandbox', 'Science fiction': 'sf', Fantasy: 'fantasy', Mystery: 'enquete', Warfare: 'guerre' };
  const sujetsIgdb = (t, e) => [...new Set([...e.filter((x) => x.startsWith('sujet:')).map((x) => x.slice(6)), ...t.map((x) => SUJETS_THEMES[x]).filter(Boolean)])];
  const sujetsForts = (e) => e.filter((x) => x.startsWith('fort:')).map((x) => x.slice(5));
  // En attendant les avis des joueurs, on estime les humeurs à partir du genre.
  function humeursEstimees(g, t, e, m, jx) {
    const h = {};
    const ajoute = (k, v) => { h[k] = Math.min(60, (h[k] || 0) + v); };
    const G = (x) => g.includes(x), T = (x) => t.includes(x), E = (x) => e.includes(x);
    const sombre = T('Horror') || T('Warfare') || T('Survival') || T('Thriller');
    const nerveux = G('Shooter') || G('Fighting') || G("Hack and slash/Beat 'em up") || T('Warfare');
    const arene = G('MOBA') || m.includes('Battle Royale');
    // Un jeu dur, nerveux, sombre ou compétitif n'est jamais « tranquille », même si un mot-clé le dit.
    const pasCalme = sombre || nerveux || T('Action') || E('difficile') || E('soulslike') || E('roguelite') || jx.pvp;
    if (E('tranquille') && !pasCalme) ajoute('detente', 40);
    if (!pasCalme && (G('Simulator') || G('Puzzle') || G('Visual Novel') || T('Kids') || T('Comedy') || T('Party'))) ajoute('detente', 22);
    if (G('Shooter') || G('Fighting') || G("Hack and slash/Beat 'em up") || G('Arcade') || T('Warfare')) ajoute('defouler', 30);
    if (T('Action')) ajoute('defouler', 12);
    if (G('Puzzle') || G('Strategy') || G('Real Time Strategy (RTS)') || G('Turn-based strategy (TBS)') || G('Tactical') || G('Card & Board Game') || G('Point-and-click') || T('Mystery') || T('4X')) ajoute('reflechir', 30);
    if (T('Drama') || T('Romance') || G('Visual Novel') || E('narratif')) ajoute('emotion', 30);
    if (T('Horror') || T('Thriller')) ajoute('frissons', 40);
    if (T('Survival')) ajoute('frissons', 15);
    if (!arene && (T('Open world') || T('Fantasy') || T('Science fiction') || G('Role-playing (RPG)'))) ajoute('evasion', 25);
    if (E('difficile') || E('soulslike')) ajoute('defi', 40);
    if (E('roguelite')) ajoute('encoreune', 35);
    if (jx.pvp) ajoute('encoreune', 30); // une partie, puis une autre…
    if (G('Arcade') || G('Card & Board Game')) ajoute('encoreune', 15);
    if (m.includes('Co-operative') || m.includes('Split screen') || m.includes('Multiplayer') || m.includes('Massively Multiplayer Online (MMO)')) ajoute('plusieurs', 35);
    return h;
  }

  /* ---------- Construction de la liste unique de jeux ---------- */
  const TOUS = [];
  const PAR_ID = {};
  const DEPUIS_IGDB = {};

  function depuisDemo(d) {
    const j = Object.assign({}, d);
    j.demo = true;
    j.familles = [...new Set(d.plateformes.map(famille))];
    const aPlusieurs = ['deux', 'groupe'].includes(d.joueurs);
    j.jSet = { solo: !d.deuxSeulement, deux: aPlusieurs, groupe: d.joueurs === 'groupe', canape: aPlusieurs, coop: aPlusieurs, coopForte: aPlusieurs, pvp: 0 };
    j.populaire = d.nbAvis;
    return j;
  }
  const demoParCle = {};
  DEMO.forEach((d) => {
    demoParCle[cle(d.titre) + '|' + d.annee] = d;
    if (d.nomIgdb) demoParCle[cle(d.nomIgdb) + '|' + d.annee] = d;
  });
  const demoUtilises = new Set();

  // Le genre affiché : le genre principal d'abord (« Aventure, monde ouvert, énigmes », pas « Énigmes, Aventure »).
  const ORDRE_GENRES = ['Role-playing (RPG)', 'Shooter', 'Fighting', "Hack and slash/Beat 'em up", 'Platform', 'Racing', 'Sport', 'Real Time Strategy (RTS)', 'Turn-based strategy (TBS)', 'Strategy', 'Tactical', 'MOBA',
    'Adventure', 'Simulator', 'Point-and-click', 'Visual Novel', 'Card & Board Game', 'Music', 'Puzzle', 'Quiz/Trivia', 'Pinball', 'Arcade'];
  function genreAffiche(g, t, douteux) {
    if (douteux && g.length > 1) g = g.filter((x) => x !== 'Role-playing (RPG)'); // « Tropico 5 : stratégie, simulation », pas « RPG »
    if (g.includes('MOBA')) g = ['MOBA', ...g.filter((x) => x !== 'MOBA' && x !== 'Role-playing (RPG)')]; // League of Legends n'est pas un RPG
    const l = [...g.filter((x) => x !== 'Indie').sort((a, b) => (a === 'MOBA' ? -1 : b === 'MOBA' ? 1 : ORDRE_GENRES.indexOf(a) - ORDRE_GENRES.indexOf(b))).map((x) => GENRES_FR[x] || x),
      ...t.filter((x) => ['Horror', 'Open world', 'Survival', 'Stealth'].includes(x)).map((x) => THEMES_FR[x])].slice(0, 3);
    if (!l.length) return 'Jeu vidéo';
    return l.map((x, i) => (i === 0 || /^[A-Z]{2,}/.test(x) ? x : x.toLowerCase())).join(', ');
  }
  // Les jeux sans fin : sport, course, combat, arcade pure, MMO, MOBA, battle royale, jeux en ligne contre d'autres.
  // Pas de « durée de l'histoire » (« Forza Horizon 5 : ~1 h »), et on ne les « finit » pas : on y a joué.
  const ARCADE_FINISSABLE = ['Platform', 'Adventure', 'Role-playing (RPG)', 'Shooter', "Hack and slash/Beat 'em up"];
  const sansFin = (g, m, jx) => (g.some((x) => ['Sport', 'Racing', 'Fighting', 'Pinball', 'Quiz/Trivia', 'MOBA'].includes(x)) && !g.some((x) => ['Adventure', 'Role-playing (RPG)', 'Shooter', 'Platform'].includes(x)))
    || (g.includes('Arcade') && !g.some((x) => ARCADE_FINISSABLE.includes(x))) || m.some((x) => /MMO|Battle Royale/.test(x)) || (jx.pvp && !jx.solo)
    || (g.includes('Fighting') && !g.some((x) => ['Adventure', 'Role-playing (RPG)'].includes(x))); // Smash Bros. (combat + plateforme) ne se « finit » pas
  // Gratuits sur Steam (importer-textes.bat), en plus de la mention « free-to-play » d'IGDB.
  const GRATUITS_STEAM = new Set((window.TEXTES_FR && window.TEXTES_FR.gratuits) || []);

  if (CAT) {
    const P = CAT.plateformes, Gn = CAT.genres, Th = CAT.themes, Et = CAT.etiquettes, Mo = CAT.modes;
    const STEAM_IDS = CAT.steam || {};
    CAT.jeux.forEach((r) => {
      const [id, nom, annee, jaq, pl, ge, th, et, mo, note, nbNotes, histoireBrute, series, aCotesBrut] = r;
      const g = ge.map((i) => Gn[i]), t = th.map((i) => (Th[i].startsWith('4X') ? '4X' : Th[i])), e = et.map((i) => Et[i]), m = mo.map((i) => Mo[i]);
      const jx = joueursIgdb(g, e, m);
      if (/^counter-strike|rainbow six:? siege|^valorant$|^overwatch\b|^team fortress/i.test(nom)) jx.pvp = 3; // le cœur du jeu, même avec un mode solo
      const finJamais = sansFin(g, m, jx);
      // Au-delà de 300 h, ce sont des erreurs de saisie ; un roguelite « fini en 1 h », c'est la première victoire, pas la fin.
      // Sea of Thieves « 246 h d'histoire » : au-delà de 100 h, seulement pour un RPG ou un jeu de stratégie (sinon on ne sait pas).
      const histoire = histoireBrute && histoireBrute <= 300 && !(histoireBrute > 100 && !g.some((x) => ['Role-playing (RPG)', 'Strategy', 'Turn-based strategy (TBS)', 'Real Time Strategy (RTS)', 'Simulator'].includes(x))) && !finJamais && !(e.includes('roguelite') && histoireBrute < 4) ? Math.round(histoireBrute) : 0;
      const k = cle(nom);
      const d = demoParCle[k + '|' + annee] || demoParCle[k + '|' + (annee - 1)] || demoParCle[k + '|' + (annee + 1)];
      let j;
      if (d && !demoUtilises.has(d.id)) {
        demoUtilises.add(d.id);
        j = depuisDemo(d);
        j.populaire = nbNotes || d.nbAvis;
        // Les familles précises qu'on a pu oublier à la main (Hollow Knight est aussi un metroidvania),
        // mais pas les thèmes larges d'IGDB (Undertale n'est pas un jeu d'horreur pour un joueur).
        j.tags = [...new Set([...(d.tags || []), ...typesIgdb(g, t, e, m).filter((x) => ['Metroidvania', 'Roguelite', 'Monde ouvert', 'Cartes', 'Coop', 'Soulslike'].includes(x))])];
        Object.assign(j.jSet, { coop: j.jSet.coop || jx.coop, coopForte: j.jSet.coopForte || jx.coopForte, pvp: jx.pvp, mmo: jx.mmo, mort: jx.mort });
      } else {
        j = {
          id: 'i' + id, titre: nom, annee, coverId: jaq, demo: false,
          plateformes: trierMachines([...new Set(pl.map((i) => COURT[P[i][0]] || P[i][1] || P[i][0]))]),
          familles: [...new Set(pl.map((i) => famille(P[i][0])))],
          genre: genreAffiche(g, t, rpgDouteux(g, e)),
          tags: typesIgdb(g, t, e, m),
          hum: humeursEstimees(g, t, e, m, jx), humEstime: true,
          histoire, sansFin: finJamais,
          jSet: jx,
          populaire: nbNotes, forts: {}, suites: []
        };
        if (STEAM_IDS[id]) j.appSteam = STEAM_IDS[id];
      }
      j.igdb = id;
      if (!j.demo && rpgDouteux(g, e)) j.rpgDouteux = true;
      // Ce que les joueurs n'appellent pas un RPG, même si IGDB le dit (vérifié sur les 160 « RPG » les plus connus).
      if ((j.tags || []).includes('RPG') && /^(?:bioshock|red dead|dishonored|metro (?:2033|last light|exodus)|prey\b|dying light|god of war|star wars: the force unleashed|darksiders|oxenfree|payday|marvel rivals|marvel's guardians|spore|x-?com|heroes of might|might & magic: heroes|blasphemous|the binding of isaac|to the moon|the sims|fallout shelter|pok[eé]mon go|assassin's creed(?:$| ii| iii| iv| brotherhood| revelations| unity| rogue| syndicate| black flag|: director)|middle-earth: shadow|castle crashers|ghost of (?:tsushima|y[oō]tei)|shenmue|[oō]kami|star citizen|maneater)/i.test(nom)) {
        j.tags = j.tags.filter((x) => x !== 'RPG');
        j.rpgDouteux = true;
        if (!j.demo) j.genre = genreAffiche(g, t, true);
      }
      if ((j.tags || []).includes('Énigmes') && (j.tags || []).includes('Vue FPS')) j.tags = j.tags.filter((x) => x !== 'Plateforme'); // Portal n'est pas un jeu de plateforme
      if ((j.tags || []).includes('Plateforme') && /assassin's creed|uncharted|god of war|infamous|batman: arkham|spider-man|shadow of the colossus|darksiders|the last of us|^horizon|tomb raider|grand theft auto|red dead|far cry|zelda|metal gear|ghost of|sekiro|devil may cry|bayonetta|hellblade/i.test(nom)) j.tags = j.tags.filter((x) => x !== 'Plateforme'); // un jeu d'action-aventure, pas un jeu de plateforme
      if (/^among us|goose goose duck|lockdown protocol|project winter|dread hunger|feign\b|town of salem|werewolf/i.test(nom)) { j.tags = (j.tags || []).filter((x) => x !== 'Stratégie'); j.deduction = true; } // un jeu de soirée à imposteur, pas StarCraft
      if ((j.tags || []).includes('Horreur') && /^batman: arkham/i.test(nom)) j.tags = j.tags.filter((x) => x !== 'Horreur');
      if ((j.tags || []).includes('Horreur') && /^(?:the ultimate )?doom\b/i.test(nom) && !/doom 3|doom iii/i.test(nom)) j.tags = j.tags.filter((x) => x !== 'Horreur');
      if ((j.tags || []).includes('Énigmes') && ['Plateforme', 'Action'].every((x) => j.tags.includes(x)) && !/portal|talos|braid|\bfez\b|^inside$|^limbo$|trine|captain toad|unravel|little nightmares|it takes two|split fiction/i.test(nom)) { j.tags = j.tags.filter((x) => x !== 'Énigmes'); j.enigmesSecondaires = true; }
      // « Un jeu d'énigmes » : Portal ou The Witness, pas Zelda, Resident Evil ni Half-Life (IGDB met « puzzle » partout).
      if ((j.tags || []).includes('Énigmes') && !/portal|talos|antichamber|superliminal|turing test|q\.?u\.?b\.?e|the witness|baba is you|braid|\bfez\b|^inside$|^limbo$/i.test(nom)
        && ((j.tags || []).some((x) => ['Tir', 'Horreur', "Beat'em all", 'RPG', 'Monde ouvert', 'Soulslike'].includes(x)) || /zelda|assassin's creed|tomb raider|god of war|uncharted|prince of persia|darksiders|infamous|^lego|shadow of the colossus|mirror's edge|beyond good|alice: madness|the last guardian|okami|ōkami|metroid/i.test(nom))) { j.tags = j.tags.filter((x) => x !== 'Énigmes'); j.enigmesSecondaires = true; } // retiré des « jeux d'énigmes », gardé pour rapprocher deux Zelda
      // Un hack'n'slash à la Diablo : Path of Exile, Grim Dawn, Titan Quest.
      if (g.includes('Role-playing (RPG)') && g.includes("Hack and slash/Beat 'em up") && e.includes('vue-iso')) j.diablo = true;
      if (e.includes('nft')) j.fan = true; // jeux à jetons : jamais proposés, comme les jeux de fans
      if (e.includes('vr-seul')) j.vrSeul = true;
      j.sujets = sujetsIgdb(t, e);
      // Les grands jeux « tout public » mignons de Nintendo et consorts (IGDB ne le dit pas) : Mario Odyssey va avec Astro Bot, pas avec Prototype.
      if (/^(?:super )?mario\b|^new super mario|\bkirby\b|\byoshi\b|donkey kong|sackboy|astro bot|astro's playroom|crash bandicoot|^spyro|^rayman|banjo|yooka|a hat in time|ratchet|captain toad|pikmin|animal crossing|luigi's mansion|\btoad\b|sonic (?:mania|frontiers|generations|colors|forces|superstars|adventure)|psychonauts|tearaway|little big planet|littlebigplanet/i.test(nom) && !j.sujets.includes('mignon')) j.sujets.push('mignon');
      // Les soulslike qu'IGDB oublie (Demon's Souls, Bloodborne…).
      if (/\b(?:dark souls|demon's souls|bloodborne|sekiro|elden ring|lies of p|nioh|mortal shell|lords of the fallen|salt and sanctuary|code vein|the surge)\b/i.test(nom) && !(j.tags || []).includes('Soulslike')) j.tags = [...(j.tags || []), 'Soulslike'];
      // Les séries japonaises qu'IGDB ne marque pas « JRPG » (Grandia, Shining Force…) : pas des RPG occidentaux.
      if (g.includes('Role-playing (RPG)') && !j.sujets.includes('jrpg') && /\b(?:grandia|shining (?:force|resonance|tears|wind)|tales of|star ocean|ys\b|trails (?:of|in|through|into)|the legend of heroes|atelier|fire emblem|persona|shin megami|dragon quest|final fantasy|kingdom hearts|xenoblade|xenogears|xenosaga|suikoden|breath of fire|chrono|disgaea|lufia|phantasy star|wild arms|\.hack|valkyria|octopath|bravely|lunar|mana\b|seiken|nier|like a dragon|pokemon|pokémon|digimon|ni no kuni|the world ends with you|front mission|ogre battle|tactics ogre|vandal hearts|langrisser|super robot wars|growlanser|arc the lad|legend of legaia)\b/i.test(nom)) j.sujets.push('jrpg');
      // Japonais sans être des « JRPG » pour les joueurs : pas des RPG occidentaux non plus.
      const japonais = g.includes('Role-playing (RPG)') && /\b(?:yakuza|monster hunter|shenmue|dragon's dogma|devil may cry|bayonetta|metal gear|code vein|god eater|toukiden|nioh|wo long)\b/i.test(nom);
      // Ce que les connaisseurs demandent : « un point & click », « un 4X », « un RPG tactique », « en 2D », « un CRPG »…
      const plus = [];
      if (g.includes('Point-and-click')) plus.push('pointclick');
      if (t.includes('4X')) plus.push('4x');
      if (g.includes('Real Time Strategy (RTS)')) plus.push('rts');
      // Fire Emblem, XCOM, Counter-Strike ; pas Pokémon (seulement « tour par tour »), ni Dragon Age Inquisition ou The Division.
      if (g.includes('Tactical') && (g.includes('Turn-based strategy (TBS)') || e.includes('sujet:tourpartour') || g.includes('Real Time Strategy (RTS)') || (g.includes('Shooter') && !g.includes('Role-playing (RPG)')))) plus.push('tactique');
      if (e.includes('sujet:boomer') || (g.includes('Shooter') && (e.includes('vue-fps') || e.includes('vue-fps-seule')) && annee && annee <= 1999)) plus.push('boomer');
      if (e.includes('sujet:survivalhorror') || (t.includes('Horror') && t.includes('Survival'))) plus.push('survivalhorror');
      if ((j.tags || []).includes('Cartes') && (j.tags || []).includes('Roguelite')) plus.push('deckbuilder');
      if (j.diablo) plus.push('diablolike');
      if (/skylanders|^lego\b|disney|pixar|paw patrol|peppa|barbie|my little pony|spongebob|toy story|\bdora\b|bluey|cars\b.*(?:race|mater)|hello kitty/i.test(nom)) plus.push('enfants'); // les licences pour enfants
      if (e.includes('vue-iso')) plus.push('iso');
      if (e.includes('vue-cote')) plus.push('2d');
      else if (e.includes('vue-3e') || e.includes('vue-fps') || e.includes('vue-fps-seule')) plus.push('3d');
      // Un RPG occidental : pas un JRPG, ni un souls de FromSoftware.
      if ((j.tags || []).includes('RPG') && !j.sujets.includes('jrpg') && !j.sujets.includes('anime') && !japonais && !(j.tags || []).includes('Soulslike')) plus.push('occidental');
      // Un action-RPG : des combats en temps réel (Diablo, The Witcher), pas Fire Emblem (« action » chez IGDB) ni un FPS.
      if ((j.tags || []).includes('RPG') && (g.includes("Hack and slash/Beat 'em up") || ((j.tags || []).includes('Action') && !g.some((x) => ['Turn-based strategy (TBS)', 'Tactical', 'Shooter', 'Card & Board Game', 'Visual Novel'].includes(x)) && !e.includes('sujet:tourpartour')))) plus.push('actionrpg');
      // Une simulation de course : Gran Turismo, Assetto Corsa ; pas Need for Speed, Driver ni Wii Sports.
      if (g.includes('Simulator') && g.includes('Racing') && !g.includes('Arcade') && !/need for speed|\bdriver\b|burnout|mario kart|crash team|sonic .*racing|wii sports|midnight club|the crew|forza horizon|test drive unlimited/i.test(nom)) plus.push('simu');
      else if (g.includes('Simulator') && g.includes('Sport') && !g.includes('Racing') && !/wii sports|mario/i.test(nom)) plus.push('simu');
      if (/mario kart|kart\b|crash team racing|team sonic racing|sonic (?:&|and) (?:sega|all-stars) racing|diddy kong racing|chocobo gp/i.test(nom)) plus.push('kart');
      if ((j.tags || []).includes('Narratif') || j.sujets.includes('choix')) plus.push('recit');
      // Un CRPG : RPG occidental en vue de dessus, sur PC, pas en pixel 2D (Undertale) ni un hack'n'slash (Diablo).
      const surPc = pl.some((i) => famille(P[i][0]) === 'PC');
      // Ni simulation (Les Sims, XCOM), ni tir (Isaac), ni roguelite (Diablo), ni jeu court d'action (Bastion, Transistor).
      const dureeJ = j.histoire || histoire;
      if ((j.tags || []).includes('RPG') && e.includes('vue-iso') && plus.includes('occidental') && surPc && !e.includes('vue-cote') && !e.includes('vue-3e') && !e.includes('roguelite') && !e.includes('pvp') && !(e.includes('en-ligne') && t.includes('Action'))
        && !j.sujets.includes('pixel') && !(j.tags || []).some((x) => ["Beat'em all", 'Stratégie', 'Gestion', 'Cartes', 'PvP'].includes(x)) && !m.some((x) => /MMO/.test(x)) && !g.some((x) => ["Hack and slash/Beat 'em up", 'Simulator', 'Shooter', 'Point-and-click'].includes(x))
        && !(g.includes('Turn-based strategy (TBS)') && !g.includes('Adventure') && !g.includes('Tactical')) // Heroes of Might and Magic
        && !(t.includes('Action') && !g.some((x) => ['Strategy', 'Tactical', 'Turn-based strategy (TBS)'].includes(x))) && !(dureeJ && dureeJ < 15)) plus.push('crpg');
      j.sujets = [...new Set([...j.sujets, ...plus])];
      j.inde = g.includes('Indie');
      if (m.some((x) => /MMO/.test(x))) j.mmo = true;
      if (g.filter((x) => x !== 'Indie').length >= 6 && (nbNotes || 0) < 150) j.fourreTout = true;
      if ((j.tags || []).includes('Gestion') && /flight sim|truck sim|train sim|bus sim|ship sim|euro truck|american truck|x-plane|\bdcs\b|car mechanic|powerwash|house flipper|goat simulator|surgeon simulator|job simulator|my summer car|construction simulator|farming simulator 1[0-9]? ?$/i.test(nom) && !/farming simulator/i.test(nom)) j.tags = j.tags.filter((x) => x !== 'Gestion');
      if (e.includes('fangame') && !/black mesa|touhou|holocure/i.test(nom)) j.fan = true; // Black Mesa ou Touhou Luna Nights sont vendus officiellement // les jeux de fans (Pokémon Infinite Fusion) : on ne les propose pas
      if (e.includes('gacha') && annee >= 2012) j.gacha = true;
      if (e.includes('vue-iso')) j.tags = [...new Set([...(j.tags || []), 'Vue iso'])]; // pour « comme Baldur's Gate » : les autres CRPG
      if (e.includes('vue-cote')) j.tags = [...new Set([...(j.tags || []), 'Vue 2D'])];
      // « comme Doom » : d'autres FPS, pas The Last of Us ; ni EarthBound, dont seuls les combats sont « à la première personne ».
      const vraiFps = e.includes('vue-fps-seule') && !e.includes('vue-iso') && !e.includes('vue-cote');
      if (vraiFps) j.tags = [...new Set([...(j.tags || []), 'Vue FPS'])];
      j.sujetsForts = sujetsForts(e);
      j.sombre = t.some((x) => ['Horror', 'Thriller', 'Warfare'].includes(x));
      if (e.includes('vue-fps') || e.includes('vue-fps-seule')) j.vueFps = vraiFps ? 2 : 1;
      if (e.includes('en-ligne')) j.jSet.enLigne = true;
      if (jx.pvp >= 2) j.tags = [...new Set([...(j.tags || []), 'PvP'])]; // pour « comme Valorant » : d'autres jeux compétitifs
      if (e.includes('gratuit') || GRATUITS_STEAM.has(id)) j.gratuit = true;
      // Steam ou IGDB disent « gratuit » pour un premier épisode offert, une démo ou un vieux freeware introuvable : dans le doute, on ne l'affiche pas.
      if (j.gratuit && /^(?:life is strange(?: 2)?|the stanley parable|plants vs\. zombies|f\.e\.a\.r\.|grand theft auto(?: 2)?|injustice: gods among us|command & conquer(?:: tiberian sun)?|angry birds|simcity|re-volt|unreal tournament iii|ratchet & clank: into the nexus|the suffering|thehunter: call of the wild|tell me why|the council|shadow warrior|europa universalis iv|broken sword: the smoking mirror)$/i.test(nom)) j.gratuit = false;
      // Les jeux en ligne dont les serveurs ont fermé : on n'en propose jamais.
      if (/^(?:xdefiant|dauntless|need for speed: world|animal crossing: pocket camp|concord|anthem|multiversus|knockout city|spellbreak|rumbleverse|hyper scape|crucible|the cycle: frontier|babylon's fall|crossfirex|lawbreakers|paragon|battleborn|evolve|the culling|warhaven|hyenas|elyon|bleeding edge|catalyst black|apex legends mobile|battlefield heroes|tom clancy's xdefiant|counter-strike: global offensive)$/i.test(nom) || (/^overwatch$/i.test(nom) && annee < 2020)) j.ferme = true; // CS:GO et Overwatch (2016) ont été remplacés par leur suite
      j.series = series || [];
      j.note = (nbNotes || 0) >= 5 ? note : 0; // « 80/100 » sur une seule note ne veut rien dire
      j.nbNotes = nbNotes;
      if (!j.histoire && histoire) j.histoire = histoire;
      if (aCotesBrut === -1) j.aCotes = -1; // durées IGDB fausses, corrigées à la main pour l'histoire seulement
      else if (!finJamais && aCotesBrut && aCotesBrut <= 500) j.aCotes = Math.round(aCotesBrut); // Skyrim : ~39 h d'histoire, ~107 h avec les quêtes annexes
      TOUS.push(j);
      PAR_ID[j.id] = j;
      DEPUIS_IGDB[id] = j.id;
    });
  }
  DEMO.forEach((d) => { if (!demoUtilises.has(d.id)) { const j = depuisDemo(d); TOUS.push(j); PAR_ID[j.id] = j; } });
  // Avec le vrai catalogue, aucun chiffre inventé : les verdicts, pourcentages d'humeurs et avis de la démo étaient des exemples.
  // On garde ce qui est rédigé (présentation, points forts, suites conseillées) ; les humeurs deviennent notre estimation.
  if (CAT) TOUS.forEach((j) => { if (j.demo) { delete j.verdicts; delete j.nbAvis; j.avis = []; j.humEstime = true; j.humRedac = true; } });
  // Pour la recherche : « ff 7 » trouve « Final Fantasy VII », « gta 5 » trouve « Grand Theft Auto V ».
  const ROMAINS = { ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15, xvi: 16 };
  // Les abréviations des joueurs. Le texte est déjà découpé (« p5 » devient « p 5 »), d'où les espaces.
  const SIGLES = [
    ['gta', 'grand theft auto'], ['ff', 'final fantasy'], ['rdr', 'red dead redemption'], ['cod', 'call of duty'], ['botw', 'breath of the wild'], ['totk', 'tears of the kingdom'],
    ['bg', "baldur's gate"], ['mgs', 'metal gear solid'], ['ac', "assassin's creed"], ['tlou', 'the last of us'], ['kh', 'kingdom hearts'], ['dmc', 'devil may cry'], ['gow', 'god of war'],
    ['hk', 'hollow knight'], ['kcd', 'kingdom come deliverance'], ['mhw', 'monster hunter world'], ['p 5', 'persona 5'], ['p 4', 'persona 4'], ['p 3', 'persona 3'], ['e 33', 'expedition 33'],
    ['re 2', 'resident evil 2'], ['re 3', 'resident evil 3'], ['re 4', 'resident evil 4'], ['re 7', 'resident evil 7'], ['re 8', 'resident evil village'], ['ds 1', 'dark souls'], ['ds 2', 'dark souls 2'], ['ds 3', 'dark souls 3'],
    ['er', 'elden ring'], ['bg 3', "baldur's gate 3"], ['acnh', 'animal crossing new horizons'], ['mk 8', 'mario kart 8'], ['smo', 'super mario odyssey'],
    ['lol', 'league of legends'], ['csgo', 'counter strike global offensive'], ['cs', 'counter strike'], ['wow', 'world of warcraft'], ['ow', 'overwatch'], ['r 6', 'rainbow six'],
    ['tft', 'teamfight tactics'], ['rl', 'rocket league'], ['dbd', 'dead by daylight'], ['ffxiv', 'final fantasy 14'], ['gw 2', 'guild wars 2'], ['eft', 'escape from tarkov'],
    ['bf', 'battlefield'], ['sf 6', 'street fighter 6'], ['poe', 'path of exile'], ['hs', 'hearthstone'], ['ssbu', 'super smash bros ultimate']
  ].sort((a, b) => b[0].length - a[0].length);
  const pourRecherche = (s) => norm(s).replace(/[^a-z0-9' ]+/g, ' ').replace(/([a-z])(\d)/g, '$1 $2').split(/\s+/).filter(Boolean).map((m) => (ROMAINS[m] ? String(ROMAINS[m]) : m)).join(' ');
  const deplierSigles = (s) => {
    let x = ' ' + s + ' ';
    for (const [k, v] of SIGLES) x = x.split(' ' + k + ' ').join(' ' + v + ' ');
    return x.trim();
  };
  TOUS.forEach((j) => { j._n = pourRecherche(j.titre); });
  // La bibliothèque Steam du joueur (importer-steam.bat), si elle a été importée.
  const BIB = window.BIBLIOTHEQUE && window.BIBLIOTHEQUE.jeux ? window.BIBLIOTHEQUE : null;
  const sansEdition = (n) => n.replace(/\s+(?:game of the year|goty|director's cut|complete|definitive|enhanced|deluxe|ultimate|gold|remastered|anniversary)(?: edition)?\s*$/, '').replace(/\s+\S+\s+edition$|\s+edition$/, '').trim();
  // Un nom venu d'ailleurs (Steam, Game Pass) → UN seul jeu du catalogue : le titre exact d'abord, sinon sans « Edition »,
  // et entre plusieurs versions, la plus connue.
  const indexNoms = (() => {
    let exact = null, court = null;
    return (nom) => {
      if (!exact) {
        exact = new Map(); court = new Map();
        TOUS.forEach((j) => {
          if (!exact.has(j._n)) exact.set(j._n, []);
          exact.get(j._n).push(j);
          const c = sansEdition(j._n);
          if (!court.has(c)) court.set(c, []);
          court.get(c).push(j);
        });
      }
      const n = pourRecherche(nom), c = sansEdition(n);
      const l = exact.get(n) || exact.get(c) || court.get(c) || [];
      return l.reduce((m, j) => (!m || (j.populaire || 0) > (m.populaire || 0) ? j : m), null);
    };
  })();
  if (BIB) {
    const parApp = new Map(TOUS.filter((j) => j.steam || j.appSteam).map((j) => [j.steam || j.appSteam, j]));
    BIB.jeux.forEach(([app, nom, min]) => {
      const j = parApp.get(app) || indexNoms(nom);
      if (j) j.possede = { minutes: Math.max(min, (j.possede || {}).minutes || 0) };
    });
  }
  const NB_POSSEDES = BIB ? TOUS.filter((j) => j.possede).length : 0;
  // Le Game Pass (liste téléchargée avec le catalogue), si elle existe.
  const ABO = window.ABONNEMENTS && window.ABONNEMENTS.gamepass ? window.ABONNEMENTS : null;
  // Les noms du Microsoft Store portent souvent la version : « (Windows) », « pour Xbox Series X|S », « Édition Standard »…
  const nomBoutique = (n) => {
    let x = n.replace(/[™®©]/g, '').replace(/\s*\((?:windows|pc|aper[çc]u|game preview|preview|xbox[^)]*)\)\s*/gi, ' ').trim();
    for (let i = 0; i < 2; i += 1) x = x.replace(/\s*[-–:]?\s*(?:pack cross-gen|version num[ée]rique|[ée]dition\b[^:–-]*|(?:windows 10|xbox one|xbox series x\|s) edition|standard edition|pour xbox.*|sur xbox.*|xbox one|xbox series x\|s|windows 10|windows|pc)\s*$/i, '').trim();
    return x;
  };
  if (ABO) ABO.gamepass.forEach(([nom, listes]) => { const j = indexNoms(nom) || indexNoms(nomBoutique(nom)); if (j) j.gamepass = [...new Set([...(j.gamepass || []), ...listes])]; });
  const NB_GAMEPASS = ABO ? TOUS.filter((j) => j.gamepass).length : 0;
  const texteGamePass = (l) => (l.length > 1 ? 'sur console et PC' : l[0] === 'pc' ? 'sur PC' : 'sur console');

  // Séries (franchises et collections IGDB) : « tous les Zelda ».
  const SERIES = (CAT && CAT.series) || [];
  const SERIES_N = SERIES.map((n) => pourRecherche(n.replace(/^the /i, '')));
  // IGDB range Smash Bros. et Mario Kart 8 dans la série Zelda (Link y fait une apparition). Pour un joueur,
  // un jeu fait partie d'une série si son titre le dit, ou s'il n'appartient pas à une foule de séries à la fois.
  const MOTS_VIDES_SERIE = new Set(['legend', 'legends', 'saga', 'series', 'collection', 'the', 'of', 'and', 'tales']);
  const motsSerie = SERIES_N.map((n) => n.split(' ').filter((m) => m.length >= 3 && !MOTS_VIDES_SERIE.has(m)));
  const dansSerie = (j, i) => (j.series || []).length <= 4 || motsSerie[i].some((m) => (' ' + j._n + ' ').includes(' ' + m + ' '));
  const JEUX_SERIE = SERIES.map(() => []);
  TOUS.forEach((j) => (j.series || []).forEach((i) => JEUX_SERIE[i] && dansSerie(j, i) && JEUX_SERIE[i].push(j)));
  JEUX_SERIE.forEach((l) => l.sort((a, b) => (a.annee || 9999) - (b.annee || 9999)));
  // Un même titre en double (portage, réédition au même nom, « Super Mario Galaxy 2 » 2025) : seule la version connue est proposée.
  {
    const parNom = new Map();
    for (const j of TOUS) { const t = parNom.get(j._n); if (!t || (j.populaire || 0) > (t.populaire || 0)) parNom.set(j._n, j); }
    for (const j of TOUS) { const t = parNom.get(j._n); if (t !== j && (j.populaire || 0) < 100 && (j.populaire || 0) * 5 < (t.populaire || 0)) j.doublon = true; }
    // Un jeu sans date de sortie, ou daté de l'an prochain, n'est pas encore sorti : on ne le propose pas.
    const an = new Date().getFullYear();
    for (const j of TOUS) if (!j.demo && (!j.annee || j.annee > an)) j.ferme = true;
  }
  const PAR_POPULARITE = [...TOUS].filter((j) => !j.fan && !j.doublon && !j.ferme).sort((a, b) => (b.populaire || 0) - (a.populaire || 0)); // sans les jeux de fans (on ne les propose jamais)
  // Une note donnée par 30 personnes ne vaut pas une note donnée par 3 000 : tant qu'il y a peu de notes,
  // on la rapproche de la moyenne (sinon « American Chopper » passe devant Zelda).
  const noteFiable = (j) => (j.note ? ((j.nbNotes || 0) * j.note + 120 * 70) / ((j.nbNotes || 0) + 120) : j.verdicts ? j.verdicts[0] : 0);
  const ANNEE = new Date().getFullYear();
  // « The Witcher 3: Wild Hunt » → « The Witcher 3 » dans les phrases ; « Hollow Knight: Silksong » reste entier.
  const titreCourt = (j) => { const m = j.titre.match(/^(.{3,}?(?:\b\d{1,2}|\b[IVX]{1,4}))\s*[:–-]\s+\S/); return m ? m[1] : j.titre; };

  /* ---------- Images ---------- */
  const STEAM = 'https://cdn.akamai.steamstatic.com/steam/apps/';
  const IGDB_IMG = 'https://images.igdb.com/igdb/image/upload/';
  function jaquette(j, grand) {
    if (j.steam) return STEAM + j.steam + '/library_600x900.jpg';
    if (j.coverId) return IGDB_IMG + (grand ? 't_cover_big_2x/' : 't_cover_big/') + j.coverId + '.jpg';
    return '';
  }
  function grandeImage(j, f) {
    if (j.steam) return STEAM + j.steam + '/library_hero.jpg';
    if (f && f.a && f.a[0]) return IGDB_IMG + 't_1080p/' + f.a[0] + '.jpg';
    if (f && f.s && f.s[0]) return IGDB_IMG + 't_1080p/' + f.s[0] + '.jpg';
    return j.coverId ? IGDB_IMG + 't_cover_big_2x/' + j.coverId + '.jpg' : '';
  }
  const calques = (u) => `<img class="lamp-base" src="${u}" alt=""><img class="lamp-lit" src="${u}" alt=""><div class="lamp-voile"></div>`;

  document.addEventListener('error', (e) => {
    const im = e.target;
    if (!(im instanceof HTMLImageElement)) return;
    const lampe = im.closest('.lamp');
    if (lampe) { lampe.classList.add('sans-image'); return; }
    const d = document.createElement('div');
    d.className = 'img-secours';
    d.style.aspectRatio = im.dataset.ratio || '2 / 3';
    d.textContent = im.dataset.titre || '';
    im.replaceWith(d);
  }, true);

  /* ---------- Détails IGDB, chargés à la demande ---------- */
  const FICHES = {};
  const PAQUETS = {};
  window.__fiches = (n, donnees) => { Object.assign(FICHES, donnees); PAQUETS[n] = true; };
  function chargerFiche(j) {
    if (!CAT || !j.igdb) return Promise.resolve(null);
    const n = j.igdb % (CAT.paquets || 200);
    if (PAQUETS[n]) return Promise.resolve(FICHES[j.igdb] || null);
    return new Promise((ok) => {
      const s = document.createElement('script');
      s.src = `data/fiches/f${n}.js`;
      s.onload = () => ok(FICHES[j.igdb] || null);
      s.onerror = () => ok(null);
      document.head.append(s);
    });
  }
  // Les textes en français (importer-textes.bat) : texte de l'éditeur sur Steam, Wikipédia, ou traduction soignée.
  const TEXTES = {};
  const PAQUETS_TEXTES = {};
  window.__textes = (n, donnees) => { Object.assign(TEXTES, donnees); PAQUETS_TEXTES[n] = true; };
  function chargerTexte(j) {
    const T = window.TEXTES_FR;
    if (!T || !j.igdb) return Promise.resolve(null);
    const n = j.igdb % (T.paquets || 200);
    if (PAQUETS_TEXTES[n]) return Promise.resolve(TEXTES[j.igdb] || null);
    return new Promise((ok) => {
      const s = document.createElement('script');
      s.src = `data/textes/t${n}.js`;
      s.onload = () => ok(TEXTES[j.igdb] || null);
      s.onerror = () => ok(null);
      document.head.append(s);
    });
  }
  const lienWiki = (titre) => 'https://fr.wikipedia.org/wiki/' + encodeURIComponent(titre.replace(/ /g, '_'));
  function blocTexte(tx) {
    if (!tx) return '';
    const [texte, source, wiki] = tx;
    const credit = source === 's' ? "La présentation de l'éditeur, sur Steam."
      : source === 'w' ? `D'après Wikipédia (licence CC BY-SA). <a href="${lienWiki(wiki)}" target="_blank" rel="noopener">Lire l'article</a>`
      : source === 't' ? "Traduit de l'anglais par Nouvelle Partie +."
      : '';
    const plus = source !== 'w' && wiki ? ` <a href="${lienWiki(wiki)}" target="_blank" rel="noopener">L'article Wikipédia</a>` : '';
    if (!texte) return wiki ? `<p class="sous source-texte"><a href="${lienWiki(wiki)}" target="_blank" rel="noopener">Lire l'article Wikipédia sur ce jeu</a></p>` : '';
    return `<div class="resume"><p class="pitch">${esc(texte)}</p><p class="sous source-texte">${credit}${plus}</p></div>`;
  }
  const studioDe = (j, f) => j.studio || (f && f.dev && f.dev.join(', ')) || '';

  /* ---------- Journal et compte (gardés dans le navigateur) ---------- */
  const CLE_JOURNAL = 'nouvelle-partie-journal';
  const CLE_COMPTE = 'nouvelle-partie-compte';
  const vide = () => ({ finis: {}, envies: [], passes: [] });
  const lireLocal = (k, defaut) => { try { return JSON.parse(localStorage.getItem(k) || 'null') || defaut; } catch (e) { return defaut; } };
  const ecrireLocal = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* on continue en mémoire */ } };
  let journal = Object.assign(vide(), lireLocal(CLE_JOURNAL, {}));
  let compte = lireLocal(CLE_COMPTE, null);
  function sauver() { ecrireLocal(CLE_JOURNAL, journal); majEntete(); }
  function majEntete() {
    const n = Object.keys(journal.finis).length;
    $$('.nb-journal').forEach((x) => { x.textContent = n ? String(n) : ''; });
    const lien = $('#lien-compte');
    if (compte) { lien.textContent = compte.pseudo; lien.href = '#/journal'; lien.classList.add('connecte'); lien.setAttribute('aria-label', `Connecté : ${compte.pseudo}, voir mon journal`); }
    else { lien.textContent = 'Se connecter'; lien.href = '#/connexion'; lien.classList.remove('connecte'); lien.removeAttribute('aria-label'); }
  }
  function basculerEnvie(id) {
    const i = journal.envies.indexOf(id);
    if (i >= 0) journal.envies.splice(i, 1); else journal.envies.push(id);
    sauver();
    return i < 0;
  }

  let minuteur;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(minuteur);
    minuteur = setTimeout(() => t.classList.remove('on'), 3200);
  }

  /* ---------- Morceaux d'interface ---------- */
  const fleche = '<svg width="22" height="12" viewBox="0 0 22 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 6h20"></path><path d="M16 1l5 5-5 5"></path></svg>';
  const loupe = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>';
  const duree = (j) => (j.histoire ? '~' + j.histoire + ' h' : '');
  const meta = (j) => [j.annee || '', duree(j)].filter(Boolean).join(' · ');

  function cover(j, info) {
    return `<a class="cover" href="#/jeu/${j.id}" data-jeu="${j.id}"><div class="img"><img data-vt src="${jaquette(j)}" alt="" loading="lazy" data-titre="${esc(j.titre)}"></div><span class="c-t">${esc(j.titre)}</span><span class="c-m">${info ?? meta(j)}</span></a>`;
  }
  function champJeu(id, etiquette, exemple, visible) {
    return `<div class="search grand">${visible ? '' : `<label for="${id}" class="sr">${etiquette}</label>`}${loupe}<input id="${id}" type="search" placeholder="${exemple}" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="${id}-liste" aria-autocomplete="list"><div class="suggest" id="${id}-liste" role="listbox" aria-label="Jeux trouvés" hidden></div></div>`;
  }
  const scoreAime = (j) => (j.note ? j.note + '/100' : j.verdicts ? j.verdicts[0] + ' % de coups de cœur' : meta(j));

  /* ---------- Recherche par titre ---------- */
  // Toutes les correspondances, les plus pertinentes d'abord. Un titre qui commence par le mot
  // cherché ne passe plus devant un jeu bien plus connu qui le contient (« zelda »).
  function chercherTout(q) {
    const t = deplierSigles(pourRecherche(q.trim()));
    if (!t) return [];
    const mots = t.split(/\s+/);
    const series = new Set();
    if (t.length >= 3) SERIES_N.forEach((n, i) => { if (n === t || n.startsWith(t + ' ') || n.includes(' ' + t) || n.startsWith(t)) series.add(i); });
    const res = [];
    for (const j of TOUS) {
      const n = j._n;
      let s = n === t ? 6 : n.startsWith(t + ' ') || n.includes(' ' + t + ' ') || n.endsWith(' ' + t) ? 3.4 : n.startsWith(t) || n.includes(' ' + t) ? 3 : n.includes(t) ? 1.6 : 0;
      if (!s && mots.length > 1 && mots.every((m) => n.includes(m))) s = 1.4;
      if (!s && series.size && (j.series || []).some((i) => series.has(i) && dansSerie(j, i))) s = 1.2;
      if (s) res.push([s + Math.log10((j.populaire || 0) + 1) * 0.9, j]);
    }
    return res.sort((a, b) => b[0] - a[0]).map((x) => x[1]);
  }
  const chercher = (q, max = 8) => chercherTout(q).slice(0, max);
  // La série la plus proche de ce qu'on a tapé (pour « Voir toute la série »).
  function serieDe(q) {
    const t = deplierSigles(pourRecherche(q.trim()));
    if (t.length < 3) return -1;
    let best = -1;
    SERIES_N.forEach((n, i) => {
      if (!(n === t || n.startsWith(t + ' ') || n.endsWith(' ' + t) || n.includes(' ' + t + ' ') || n.startsWith(t))) return;
      if (best < 0 || JEUX_SERIE[i].length > JEUX_SERIE[best].length) best = i;
    });
    return best >= 0 && JEUX_SERIE[best].length >= 2 ? best : -1;
  }

  function autocomplete(input, liste, choisir, pour = '') {
    if (!input || !liste) return;
    let items = [];
    let tous = [];
    let sel = -1;
    // « Le jeu que tu viens de finir » : le premier jeu proposé est déjà en surbrillance, Entrée le choisit.
    const defaut = () => (pour === 'fini' && items.length ? 0 : -1);
    const pageResultats = () => '#/recherche?q=' + encodeURIComponent(input.value.trim()) + (pour ? '&pour=' + pour : '');
    const fermer = () => { liste.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); sel = -1; };
    const peindre = () => {
      if (!input.value.trim()) { fermer(); return; }
      if (sel < 0) { tous = chercherTout(input.value); items = tous.slice(0, 8); }
      liste.innerHTML = items.length
        ? items.map((j, i) => `<button type="button" role="option" tabindex="-1" id="${liste.id}-${i}" aria-selected="${i === (sel >= 0 ? sel : defaut())}" data-id="${j.id}"><img src="${jaquette(j)}" alt="" data-titre=""><span><span class="s-t">${esc(j.titre)}</span><br><span class="s-m">${[j.annee, j.plateformes.slice(0, 3).join(', ')].filter(Boolean).join(' · ')}</span></span></button>`).join('')
          + (tous.length > items.length ? `<a class="s-tout" href="${pageResultats()}">Voir les ${nb(tous.length)} jeux pour « ${esc(input.value.trim())} » ${fleche}</a>` : '')
        : `<div class="vide">Aucun jeu « ${esc(input.value)} » ${CAT ? 'dans le catalogue' : "dans le prototype (62 jeux tant que le catalogue complet n'est pas téléchargé)"}.</div>`;
      liste.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      if (sel >= 0) input.setAttribute('aria-activedescendant', `${liste.id}-${sel}`); else input.removeAttribute('aria-activedescendant');
    };
    input.addEventListener('input', () => { sel = -1; peindre(); });
    input.addEventListener('focus', () => { if (input.value.trim()) { sel = -1; peindre(); } });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); sel = (sel + 1) % items.length; peindre(); }
      else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); sel = (sel - 1 + items.length) % items.length; peindre(); }
      else if (e.key === 'Enter') {
        if (!input.value.trim()) return;
        e.preventDefault();
        // Un seul jeu, ou le titre exact : on y va. Sinon, la page avec tous les résultats.
        const exact = tous[0] && tous[0]._n === deplierSigles(pourRecherche(input.value.trim()));
        const j = sel >= 0 ? items[sel] : tous.length === 1 || exact ? tous[0] : defaut() >= 0 ? items[0] : null;
        if (!tous.length) return; // la liste reste ouverte avec « Aucun jeu… »
        fermer();
        if (j) choisir(j); else if (tous.length) { const h = pageResultats(); input.blur(); location.hash = h; }
      }
      else if (e.key === 'Escape') fermer();
    });
    liste.addEventListener('mousedown', (e) => e.preventDefault());
    liste.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-id]');
      if (b) { fermer(); choisir(PAR_ID[b.dataset.id]); }
      else if (e.target.closest('.s-tout')) { fermer(); input.blur(); }
    });
    input.addEventListener('blur', () => setTimeout(fermer, 120));
  }

  /* ---------- La lampe ---------- */
  // Sur ordinateur, la lumière suit la souris. Sur téléphone, personne ne doit poser le doigt : la lampe vit seule
  // (elle balance doucement, comme une ampoule au bout de son fil), descend quand on fait défiler la page,
  // et suit l'inclinaison du téléphone quand Android la donne. Rien n'est jamais plus sombre faute de doigt.
  const tactile = matchMedia('(hover: none), (pointer: coarse)');
  const lampesVues = new Set();
  let incline = null; // dernière inclinaison du téléphone, en % de l'image

  function activerLampes(racine = document) {
    $$('[data-lampe]', racine).forEach((el) => {
      if (el.dataset.pret) return;
      el.dataset.pret = '1';
      let tx = 62, ty = 38, x = 62, y = 38, raf = 0;
      const pas = () => {
        x += (tx - x) * 0.11;
        y += (ty - y) * 0.11;
        el.style.setProperty('--x', x.toFixed(2) + '%');
        el.style.setProperty('--y', y.toFixed(2) + '%');
        raf = Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05 ? requestAnimationFrame(pas) : 0;
      };
      const viser = (nx, ny) => { tx = Math.max(4, Math.min(96, nx)); ty = Math.max(4, Math.min(96, ny)); if (!raf) raf = requestAnimationFrame(pas); };
      el.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; const r = el.getBoundingClientRect(); viser(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100); });
      el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') viser(62, 38); });
      // Sur téléphone : le balancement, le défilement et l'inclinaison décident ensemble où tombe la lumière.
      el._lampe = {
        el,
        vers(t) {
          const r = el.getBoundingClientRect();
          if (r.bottom < 0 || r.top > innerHeight) return;
          const defile = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height)));
          const bx = incline ? incline.x : 60, by = incline ? incline.y : 34 + defile * 36;
          viser(bx + Math.sin(t / 2300) * 16 + Math.sin(t / 900) * 2.5, by + Math.cos(t / 3100) * 9);
        },
      };
      lampesVues.add(el._lampe);
      // La lumière s'allume quand l'image arrive.
      if (!reduit.matches) { el.classList.add('eteinte'); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('eteinte'))); }
      balancer();
    });
    lampesVues.forEach((l) => { if (!l.el.isConnected) lampesVues.delete(l); });
  }
  // Le balancement ne tourne que sur téléphone, quand une grande image est à l'écran, et jamais page cachée.
  let rafBalance = 0;
  function balancer() {
    if (rafBalance || !tactile.matches || reduit.matches) return;
    const tour = (t) => {
      rafBalance = 0;
      lampesVues.forEach((l) => (l.el.isConnected ? l.vers(t) : lampesVues.delete(l)));
      if (lampesVues.size && !document.hidden) rafBalance = requestAnimationFrame(tour);
    };
    rafBalance = requestAnimationFrame(tour);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) balancer(); });

  // L'inclinaison du téléphone déplace la lumière, là où le navigateur la donne sans rien demander (Android).
  // Sur iPhone il faudrait une autorisation : on ne la demande pas, le balancement suffit.
  if (tactile.matches && window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    addEventListener('deviceorientation', (e) => {
      if (e.gamma == null || e.beta == null || reduit.matches) return;
      incline = { x: 50 + Math.max(-30, Math.min(30, e.gamma)) * 1.3, y: 38 + Math.max(-25, Math.min(25, e.beta - 50)) * 1.1 };
    }, { passive: true });
  }

  // Les jaquettes : sur ordinateur, elles s'allument sous la souris. Sur téléphone, elles restent bien éclairées ;
  // celle qui passe au centre de l'écran (ou de son étagère) reçoit un halo chaud, et chacune prend un reflet
  // de lumière la première fois qu'elle apparaît.
  const jaquettesVisibles = new Set();
  let obsJaquettes = null, obsReflets = null, pointLumiere = null, rafJaquettes = 0;
  function eclairerJaquettes() {
    if (rafJaquettes) return;
    rafJaquettes = requestAnimationFrame(() => {
      rafJaquettes = 0;
      const tact = tactile.matches;
      if (!tact && !pointLumiere) return;
      const px = pointLumiere ? pointLumiere.x : innerWidth / 2, py = pointLumiere ? pointLumiere.y : innerHeight * 0.45;
      // Sur téléphone, une zone ovale au milieu de l'écran (plus haute que large) ; sur ordinateur, un cercle autour de la souris.
      const Rx = tact ? Math.max(130, innerWidth * 0.4) : 360, Ry = tact ? Math.max(200, innerHeight * 0.36) : 360;
      jaquettesVisibles.forEach((c) => {
        if (!c.isConnected) { jaquettesVisibles.delete(c); return; }
        const r = (c.firstElementChild || c).getBoundingClientRect();
        const e = Math.max(0, 1 - Math.hypot((r.left + r.width / 2 - px) / Rx, (r.top + r.height / 2 - py) / Ry));
        c.style.setProperty('--e', e.toFixed(2));
      });
    });
  }
  function suivreJaquettes(racine = document) {
    if (!('IntersectionObserver' in window) || reduit.matches) return;
    if (!obsJaquettes) {
      obsJaquettes = new IntersectionObserver((entrees) => {
        entrees.forEach((en) => { if (en.isIntersecting) jaquettesVisibles.add(en.target); else jaquettesVisibles.delete(en.target); });
        eclairerJaquettes();
      }, { rootMargin: '150px' });
      // Le reflet : une seule fois par jaquette, quand elle entre vraiment à l'écran, en cascade.
      obsReflets = new IntersectionObserver((entrees) => {
        let n = 0;
        entrees.forEach((en) => {
          if (!en.isIntersecting) return;
          obsReflets.unobserve(en.target);
          en.target.style.setProperty('--d', Math.min(n++, 6) * 90 + 'ms');
          en.target.classList.add('reflet');
        });
      }, { threshold: 0.55 });
      document.documentElement.classList.add('jaquettes-lumiere');
      addEventListener('scroll', eclairerJaquettes, { passive: true, capture: true }); // aussi les étagères qui défilent sur le côté
      addEventListener('resize', eclairerJaquettes, { passive: true });
    }
    $$('.cover', racine).forEach((c) => { if (!c.dataset.lumiere) { c.dataset.lumiere = '1'; obsJaquettes.observe(c); obsReflets.observe(c); } });
  }
  // Tout ce qui apparaît dans la page (nouvelle page, résultats d'une envie) profite de la lumière.
  let attenteLumiere = 0;
  new MutationObserver(() => {
    if (attenteLumiere) return;
    attenteLumiere = requestAnimationFrame(() => { attenteLumiere = 0; const m = $('#main'); if (m) { activerLampes(m); suivreJaquettes(m); eclairerJaquettes(); } });
  }).observe(document.getElementById('main') || document.body, { childList: true, subtree: true });

  // Sur ordinateur, la même lampe pour toute la page : elle suit la souris partout, même quand on descend.
  // Sur téléphone, pas de pièce assombrie : la page reste claire, la lumière vit dans les images et les jaquettes.
  function lampeGlobale() {
    const el = $('#lampe-globale');
    if (!el || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const calquesLampe = $$('.lg', el);
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, vue = false;
    const poser = () => { const t = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`; calquesLampe.forEach((c) => { c.style.transform = t; }); };
    const pas = () => {
      const k = reduit.matches ? 1 : 0.2;
      x += (tx - x) * k;
      y += (ty - y) * k;
      poser();
      raf = Math.abs(tx - x) > 0.4 || Math.abs(ty - y) > 0.4 ? requestAnimationFrame(pas) : 0;
    };
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (!vue) { vue = true; document.documentElement.classList.add('lampe-active'); x = tx = e.clientX; y = ty = e.clientY; poser(); }
      tx = e.clientX; ty = e.clientY;
      el.classList.add('on');
      pointLumiere = { x: tx, y: ty };
      eclairerJaquettes();
      if (!raf) raf = requestAnimationFrame(pas);
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => el.classList.remove('on'));
    addEventListener('blur', () => el.classList.remove('on'));
  }

  /* ---------- Recommandation après un jeu fini ---------- */
  const topHum = (j, n) => Object.entries(j.hum || {}).sort((a, b) => b[1] - a[1]).slice(0, n).map((x) => x[0]);
  const LIBELLE_TYPE = Object.assign(Object.fromEntries(TYPES), { PvP: 'jeu compétitif en ligne', Coop: 'jeu en coop' });

  // Plus une famille est rare, plus la partager compte (« metroidvania » dit plus que « action »).
  const RARETE = (() => {
    const n = {};
    TOUS.forEach((j) => (j.tags || []).forEach((t) => { n[t] = (n[t] || 0) + 1; }));
    return Object.fromEntries(Object.entries(n).map(([t, c]) => [t, Math.log(TOUS.length / c)]));
  })();
  // Les sujets partagés comptent aussi (Stardew Valley et ses fermes mignonnes en pixel art), surtout les sujets « forts ».
  const SUJETS_TROP_COURANTS = new Set(['fantasy', 'sf', 'magie', 'anime', 'robots', 'guerre', 'aliens', 'chiens', 'chats', 'chevaux', '3d', 'recit', 'occidental', 'actionrpg', '2d', 'iso']);
  // Un sujet rare partagé (usines, deckbuilder, tactique) rapproche bien plus qu'un sujet courant (fantasy).
  const RARETE_SUJET = (() => {
    const n = {};
    TOUS.forEach((j) => (j.sujets || []).forEach((k) => { n[k] = (n[k] || 0) + 1; }));
    return Object.fromEntries(Object.entries(n).map(([k, c]) => [k, Math.max(0.3, Math.min(3, Math.log2(TOUS.length / c) * 0.45))]));
  })();
  // Combien d'années de trop un jeu a par rapport au jeu de référence : 0 jusqu'à 8 ans plus vieux, plafonné à 18.
  const retardEpoque = (base, c) => (base && base.annee && c.annee ? Math.min(18, Math.max(0, base.annee - c.annee - 8)) : 0);
  // Deux RPG de familles différentes se ressemblent moins : un CRPG n'est pas Elden Ring, un RPG occidental n'est pas un JRPG.
  const ecartRpg = (a, b) => {
    if (!(a.tags || []).includes('RPG') || !(b.tags || []).includes('RPG')) return 0;
    const sa = a.sujets || [], sb = b.sujets || [];
    return (sa.includes('crpg') !== sb.includes('crpg') ? 2 : 0) + ((sa.includes('jrpg') && sb.includes('occidental')) || (sb.includes('jrpg') && sa.includes('occidental')) ? 2 : 0);
  };
  // Le style (pixel art, rétro, belle musique) rapproche moins que le jeu lui-même : Celeste n'est pas « comme Undertale ».
  const STYLE = new Set(['pixel', 'retro', 'bandeson', 'dessin', 'mignon']);
  // La vue (première personne, de dessus, de côté) rapproche peu, sauf pour un jeu de tir : Kingdom Come n'est pas « comme Voidtrain ».
  const VUES = new Set(['Vue FPS', 'Vue iso', 'Vue 2D']);
  // « Survie » ou « bac à sable » d'IGDB : un thème large (Tomb Raider en a), qui ne compte vraiment qu'entre deux jeux de survie ou de construction.
  const THEMES_LARGES = new Set(['survie', 'sandbox']);
  const memeFamille = (a, b) => ['Monde ouvert', 'Gestion'].some((t) => (a.tags || []).includes(t) && (b.tags || []).includes(t));
  // Des énigmes « de fond » (Zelda) rapprochent deux Zelda, pas un Zelda d'un vrai jeu d'énigmes.
  const poidsTag = (a, b, t) => (VUES.has(t) && !(a.tags || []).includes('Tir') ? 0.4 : 1);
  const proximite = (a, b) => (a.tags || []).filter((t) => t !== 'Coop' && (b.tags || []).includes(t)).reduce((s, t) => s + (RARETE[t] || 0) * poidsTag(a, b, t), 0) + (a.enigmesSecondaires && b.enigmesSecondaires ? (RARETE['Énigmes'] || 0) * 0.6 : 0)
    + (a.sujetsForts || []).filter((x) => !STYLE.has(x) && (b.sujetsForts || []).includes(x)).length * 1.5
    + (a.sujets || []).filter((x) => !SUJETS_TROP_COURANTS.has(x) && (b.sujets || []).includes(x)).reduce((s, k) => s + (RARETE_SUJET[k] || 0.5) * (STYLE.has(k) || (THEMES_LARGES.has(k) && !memeFamille(a, b)) ? 0.5 : 1), 0)
    - ecartRpg(a, b);
  // Ce qui définit un jeu pour un joueur : « comme The Witness », c'est un jeu d'énigmes avant tout, pas BioShock.
  const IDENTITES = ['Énigmes', 'Soulslike', 'Metroidvania', 'Roguelite', 'Cartes', 'Rythme', 'Combat', 'Course', 'Sport', 'Gestion', 'Stratégie', 'MOBA', 'Battle royale', 'RPG', 'Plateforme', 'Horreur'];
  // « Plateforme » ne définit pas un jeu d'action-aventure (Tomb Raider, Assassin's Creed, Portal) : seulement un vrai jeu de plateforme.
  const PLATEFORME_SECONDAIRE = ['Tir', 'RPG', "Beat'em all", 'Horreur', 'Énigmes'];
  const identite = (j) => (j.tags || []).filter((t) => IDENTITES.includes(t) && !(t === 'Plateforme' && (j.tags || []).some((x) => PLATEFORME_SECONDAIRE.includes(x)))).sort((x, y) => (RARETE[y] || 0) - (RARETE[x] || 0))[0];
  // Et le sujet qui le définit, quand il en a un : « comme Factorio », c'est une usine ; « comme Baldur's Gate 3 », un CRPG.
  const SUJETS_IDENTITE = ['automatisation', 'colonie', 'deckbuilder', 'citybuilder', 'survivalhorror', 'boomer', 'pointclick', '4x', 'crpg', 'diablolike'];
  const identiteSujet = (j) => (j.sujets || []).filter((k) => SUJETS_IDENTITE.includes(k)).sort((x, y) => (RARETE_SUJET[y] || 0) - (RARETE_SUJET[x] || 0))[0];
  // Les genres qui changent tout : un FPS, un RPG ou un jeu d'horreur ne se joue pas comme The Witness.
  const GENRES_LOURDS = ['Tir', 'RPG', 'Horreur', "Beat'em all", 'Combat', 'Course', 'Sport', 'Stratégie', 'Gestion', 'Cartes', 'Rythme', 'MOBA', 'Battle royale', 'Monde ouvert', 'Roguelite', 'Soulslike'];
  // Les jeux proches d'un jeu : les suites des joueurs, puis les « jeux similaires » d'IGDB qui partagent vraiment
  // quelque chose avec lui (IGDB met parfois un jeu de cuisine à côté d'Avowed), complétés par les jeux connus
  // de la même famille. Les jeux de la même série sont à part (ils ont leur étagère).
  function voisins(j, f, max = 12, exclus = new Set()) {
    const res = [];
    const vus = new Set([j.id, ...exclus]);
    (j.suites || []).forEach((id, i) => { const c = PAR_ID[id]; if (c && !vus.has(c.id)) { vus.add(c.id); res.push([1000 - i, c]); } });
    const seuil = Math.max(2, Math.min(4, proximite(j, j) * 0.5));
    const sim = new Set(((f && f.sim) || []).map((n) => DEPUIS_IGDB[n]).filter(Boolean));
    // Les « similaires » d'IGDB ont un petit bonus, mais un jeu connu et vraiment proche passe devant un inconnu.
    const candidats = new Set([...sim, ...PAR_POPULARITE.slice(0, 3000).map((c) => c.id)]);
    const idJ = identite(j), idSJ = identiteSujet(j), tagsJ = (j.tags || []).filter((t) => t !== 'Coop');
    candidats.forEach((id) => {
      const c = PAR_ID[id];
      if (!c || vus.has(id) || c.doublon || c.ferme || (c.fan && !j.fan)) return;
      const p = proximite(j, c);
      // Les mêmes garde-fous que partout : pas The Elder Scrolls II (1996) « dans la même veine » que Kingdom Come 2.
      if (p >= seuil || (sim.has(id) && p >= Math.max(1, seuil * 0.5))) res.push([p * 2 + Math.log10((c.populaire || 0) + 1) * 2 + (sim.has(id) ? 6 : 0) - ecartAvec(j, c, idJ, idSJ, tagsJ) * 0.5, c]);
    });
    return res.sort((a, b) => b[0] - a[0]).map((x) => x[1]).slice(0, max);
  }

  async function recommander(base, e) {
    const f = await chargerFiche(base);
    const proches = new Set(voisins(base, f, 30).map((c) => c.id));
    const suitesJoueurs = new Set(base.suites || []);
    const exclus = new Set([base.id, ...Object.keys(journal.finis), ...journal.passes]);
    const baseVR = vrSeulement(base);
    const aime = e.aime || [];
    const hum = e.hum || [];
    const negatif = e.v >= 2;
    const baseTop = topHum(base, 2);
    const tc = titreCourt(base);
    const idB = identite(base), idSB = identiteSujet(base), tagsB = (base.tags || []).filter((t) => t !== 'Coop');
    // Ce qui change par rapport au jeu fini : la durée, quand l'écart est net.
    const ecart = (c) => (c.histoire && base.histoire ? (c.histoire <= base.histoire * 0.6 ? `, en plus court (~${c.histoire} h)` : c.histoire >= base.histoire * 1.6 ? `, en plus long (~${c.histoire} h)` : '') : '');
    const res = [];
    for (const c of TOUS) {
      // Tout le catalogue peut sortir (plus seulement les 4 000 jeux les plus connus), sauf la réalité virtuelle
      // seule quand le jeu fini n'en était pas.
      if (exclus.has(c.id) || c.doublon || c.ferme || (c.fan && !base.fan) || (!baseVR && vrSeulement(c))) continue;
      let s = 0;
      let raison, court;
      const communs = (c.tags || []).filter((t) => (base.tags || []).includes(t) && t !== 'Coop').sort((x, y) => (RARETE[y] || 0) - (RARETE[x] || 0));
      // Une note fiable (rapprochée de la moyenne quand il y a peu de votes) : un jeu noté 100 par 3 personnes ne passe pas devant.
      const pop = Math.log10((c.populaire || 0) + 1) * 0.5 + (c.verdicts ? c.verdicts[0] / 40 : (noteFiable(c) || 60) / 50);
      if (negatif) {
        s = (communs.length === 0 ? 4 : 0) + pop;
        hum.forEach((h) => { s += ((c.hum || {})[h] || 0) / 15; });
        const f0 = Object.keys(c.forts || {})[0];
        court = f0 ? cap(c.forts[f0]) + '.' : cap(c.genre || 'autre chose') + (c.histoire ? ', ~' + c.histoire + ' h.' : '.');
        raison = `Rien à voir avec ${tc}. ${court}`;
      } else {
        let fort = null;
        aime.forEach((k) => { if (c.forts && c.forts[k]) { s += 4; fort = fort || k; } });
        s += proximite(base, c) * 0.8;
        hum.forEach((h) => { s += ((c.hum || {})[h] || 0) / 12; });
        baseTop.forEach((h) => { s += ((c.hum || {})[h] || 0) / 25; });
        const suite = suitesJoueurs.has(c.id);
        const proche = proches.has(c.id);
        if (suite) s += 3;
        if (proche) s += 5;
        // La suite d'une série (Doom → Doom Eternal), si elle est connue et ressemble au jeu fini : c'est souvent ce qu'on lance ensuite.
        if (!suite && c.annee > (base.annee || 9999) && c.annee - base.annee <= 12 && (c.populaire || 0) >= 30 && (base.series || []).some((i) => (c.series || []).includes(i))
          && (!idB || (c.tags || []).includes(idB)) && proximite(base, c) >= 3) s += 4;
        s += pop * 1.2; // un jeu connu et bien noté passe devant un inconnu qui coche les mêmes cases
        if (!suite && (c.populaire || 0) < 20) s -= (20 - (c.populaire || 0)) / 2; // presque personne ne l'a noté : on ne le met pas en tête (Youtubers Life 2 après Les Sims)
        // Après un jeu de 2019, pas un jeu de 1990 : plus il est vieux par rapport au jeu fini, moins il remonte
        // (rien jusqu'à 8 ans d'écart, puis de plus en plus ; les jeux plus récents ne sont jamais pénalisés).
        if (!suite) s -= ecartAvec(base, c, idB, idSB, tagsB) * 0.4 + retardEpoque(base, c) * 0.6; // l'époque compte autant que dans « comme… »
        const humVise = hum.find((h) => ((c.hum || {})[h] || 0) >= 20);
        if (fort) { court = cap(c.forts[fort]) + '.'; raison = `Tu as aimé ${FORTS[fort]} dans ${tc}. ${court}`; }
        else if (suite) { raison = `Après ${tc}, c'est celui qu'on te conseille en premier.`; court = `À lancer juste après ${tc}.`; }
        else if (proche) { raison = `Dans la même veine que ${tc}${ecart(c)}.`; court = raison; }
        else if (humVise) { raison = c.humEstime ? `Comme ${tc}, un jeu pour ${HUM[humVise]}.` : `Comme ${tc}, un jeu pour ${HUM[humVise]} : ${c.hum[humVise]} % des joueurs le disent.`; court = cap(`un jeu pour ${HUM[humVise]}.`); }
        else if (communs.length) { raison = `De la même famille que ${tc} : ${LIBELLE_TYPE[communs[0]] || communs[0]}${ecart(c)}.`; court = cap((LIBELLE_TYPE[communs[0]] || communs[0]) + ecart(c)) + '.'; }
        else { raison = noteFiable(c) >= 80 ? `Un des jeux les mieux notés : ${c.note}/100.` : cap((Object.values(c.forts || {})[0] || c.genre || '')) + '.'; court = raison; }
      }
      res.push({ j: c, s, raison, court });
    }
    // Une seule version de chaque jeu, et pas une autre version du jeu fini (Disco Elysium puis Disco Elysium: The Final Cut).
    const garde = new Set(uneVersion(res.sort((a, b) => b.s - a.s).map((x) => x.j), base).map((c) => c.id));
    // Un seul jeu par titre, même à des années d'écart (Demon's Souls 2009 ou son remake de 2020, pas les deux).
    const titres = new Set([racineTitre(base._n)]);
    const tries = res.filter((x) => { if (!garde.has(x.j.id)) return false; const r = racineTitre(x.j._n); if (titres.has(r)) return false; titres.add(r); return true; });
    // Après God of War (2018), pas cinq God of War de suite : deux au plus en tête, les autres plus loin.
    const serieB = new Set(base.series || []);
    const deLaSerie = (c) => (c.series || []).some((i) => serieB.has(i));
    const tete = [], plusTard = [];
    let nbSerie = 0;
    // Et pas trois FIFA après Rocket League : un seul jeu de chaque autre série en tête.
    const autresVues = new Set();
    tries.forEach((x) => {
      if (deLaSerie(x.j) && !suitesJoueurs.has(x.j.id)) { if (nbSerie < 2) { nbSerie += 1; tete.push(x); } else plusTard.push(x); return; }
      const ss = (x.j.series || []).filter((i) => !serieB.has(i));
      if (ss.length && ss.some((i) => autresVues.has(i)) && tete.length < 10) { plusTard.push(x); return; }
      ss.forEach((i) => autresVues.add(i));
      tete.push(x);
    });
    return [...tete.slice(0, 10), ...plusTard.slice(0, 2), ...tete.slice(10), ...plusTard.slice(2)].slice(0, 60);
  }

  /* ---------- Accueil ---------- */
  const EN_LUMIERE = ['e33', 'plague2', 'hollowknight', 'eldenring', 'rdr2', 'outerwilds', 'gris', 'tsushima'];
  const PAIRES = [['hades', 'deadcells'], ['celeste', 'hollowknight'], ['witcher3', 'kcd2'], ['outerwilds', 'obradinn'], ['ittakestwo', 'splitfiction'], ['e33', 'metaphor']];

  function suite(a, b) {
    const f = Object.keys(b.forts).find((k) => a.forts[k]) || Object.keys(b.forts)[0];
    return `<a class="suite" href="#/jeu/${b.id}" data-jeu="${b.id}">
      <span class="avant"><img src="${jaquette(a)}" alt="" loading="lazy"></span>
      <span class="txt"><span class="de">Après ${esc(titreCourt(a))}</span><span class="vers">${esc(b.titre)}</span><span class="pourquoi">${esc(cap(b.forts[f]))}.</span></span>
      <span class="apres"><img data-vt src="${jaquette(b)}" alt="" loading="lazy"></span></a>`;
  }

  const jeuxPourHumeur = (k) => PAR_POPULARITE.filter((j) => ((j.hum || {})[k] || 0) >= 20);

  // Les étagères sous le grand visuel, communes aux deux versions de l'accueil.
  function sectionsAccueil() {
    const courts = PAR_POPULARITE.filter((x) => x.histoire && x.histoire <= 5).slice(0, 14);
    const aimes = CAT
      ? [...TOUS].filter((x) => (x.nbNotes || 0) >= 150 && x.note && x.annee <= ANNEE).sort((a, b) => noteFiable(b) - noteFiable(a)).slice(0, 14)
      : [...TOUS].sort((a, b) => b.verdicts[0] - a.verdicts[0]).slice(0, 12);
    const cles = ['detente', 'defouler', 'reflechir', 'emotion', 'evasion', 'defi', 'frissons', 'plusieurs', 'encoreune'];
    const paires = PAIRES.filter(([a, b]) => PAR_ID[a] && PAR_ID[b]);
    return `
      <div class="wrap">
        ${paires.length ? `<section class="section">
          <div class="section-tete"><h2>Les suites qui marchent</h2><p>Quoi lancer juste après avoir fini un jeu.</p></div>
          <div class="suites">${paires.map(([a, b]) => suite(PAR_ID[a], PAR_ID[b])).join('')}</div>
        </section>` : ''}
        <section class="section">
          <div class="section-tete"><h2>Pour un soir</h2><p>Ils se finissent en quelques heures et on y repense longtemps.</p></div>
          <div class="etagere">${courts.map((x) => cover(x)).join('')}</div>
        </section>
        <section class="section">
          <div class="section-tete"><h2>Selon ton humeur</h2><a class="lien-fleche" href="#/envie">Décrire mon envie ${fleche}</a></div>
          <div class="humeurs">${cles.map((k) => {
            const jeux = jeuxPourHumeur(k);
            return `<a class="humeur" href="#/envie?h=${k}"><span class="h-nom">Pour ${HUM[k]}</span><span class="h-jeux">${jeux.slice(0, 5).map((x) => `<img src="${jaquette(x)}" alt="" loading="lazy" data-titre="">`).join('')}</span></a>`;
          }).join('')}</div>
        </section>
        <section class="section">
          <div class="section-tete"><h2>Les plus aimés</h2><a class="lien-fleche" href="#/explorer?tri=notes">Tout explorer ${fleche}</a></div>
          <div class="etagere">${aimes.map((x) => cover(x, scoreAime(x))).join('')}</div>
        </section>
      </div>`;
  }
  const enLumiere = () => PAR_ID[EN_LUMIERE[Math.floor(Math.random() * EN_LUMIERE.length)]] || PAR_POPULARITE[0];
  const cartelLumiere = (j) => `<p class="cartel-lumiere">En lumière : <a href="#/jeu/${j.id}">${esc(j.titre)}</a><br>${esc(j.studio || '')}${j.studio ? ', ' : ''}${j.annee || ''}</p>`;

  // Accueil A (validé le 19/11) : on entre par le jeu qu'on vient de finir.
  function accueil() {
    const j = enLumiere();
    main.innerHTML = `
      <section class="hero lamp" data-lampe aria-labelledby="titre-accueil">${calques(grandeImage(j))}
        <div class="hero-in">
          <div class="hero-txt">
            <h1 id="titre-accueil">Et toi&nbsp;?<br>À quoi tu joues&nbsp;?</h1>
            <p>Dis-nous le jeu que tu viens de finir et ce que tu en as pensé. On te propose le suivant.</p>
            ${champJeu('fini-q', 'Le jeu que tu viens de finir', 'Hades, Celeste, Elden Ring…')}
            <a class="autre" href="#/envie">Rien fini en ce moment ? Dis ce qui te tente ${fleche}</a>
          </div>
          ${cartelLumiere(j)}
        </div>
      </section>
      ${sectionsAccueil()}`;
    autocomplete($('#fini-q'), $('#fini-q-liste'), (g) => { location.hash = '#/fini/' + g.id; }, 'fini');
    return '';
  }

  // Exemples d'envies, montrés sous le champ de « Ce qui me tente ».
  const EXEMPLES_ENVIE = ['un truc court pour ce soir', 'me vider la tête après le boulot', 'une histoire qui prend aux tripes', 'à deux sur le canapé', 'un jeu gratuit entre potes', 'comme Hades mais plus calme'];
  /* ---------- Fiche d'un jeu ---------- */
  async function fiche([id]) {
    const j = PAR_ID[id];
    if (!j) return introuvable();
    const [f, tx] = await Promise.all([chargerFiche(j), chargerTexte(j)]);
    const fait = journal.finis[id];
    const veut = journal.envies.includes(id);
    const hums = Object.entries(j.hum || {}).sort((a, b) => b[1] - a[1]);
    const avis = [...(j.avis || [])];
    if (fait && fait.phrase) avis.unshift({ pseudo: compte ? compte.pseudo : 'Toi', v: fait.v, aime: (fait.aime || [])[0], t: fait.phrase, spoil: fait.spoil });
    const studio = studioDe(j, f);
    const ttb = f && f.ttb ? f.ttb : null;
    // Pas de durée pour un jeu sans fin (« League of Legends : ~14 452 h »), ni de chiffre absurde.
    // Même calcul que l'import : entre « en fonçant » et « normalement » (qui compte aussi les à-côtés).
    const ttbHistoire = ttb ? (ttb[0] && ttb[1] ? ttb[0] ** 0.7 * ttb[1] ** 0.3 : ttb[1] ? ttb[1] * 0.6 : ttb[0]) : 0;
    const aCotes = j.sansFin || j.aCotes === -1 ? 0 : j.aCotes || (ttb && ttb[1] <= 500 && !j.demo && Math.round(ttb[1])) || 0;
    const histoire = j.sansFin ? 0 : j.histoire || (ttbHistoire && ttbHistoire <= 300 && Math.round(ttbHistoire)) || 0;
    const completBrut = j.sansFin || j.aCotes === -1 ? 0 : j.complet || (ttb && ttb[2] <= 500 && Math.round(ttb[2])) || 0;
    const complet = completBrut > histoire * 1.1 ? completBrut : 0; // « Tout faire » plus court que l'histoire : donnée fausse
    const js = j.jSet;
    const joueurs = j.deuxSeulement ? 'à deux uniquement'
      : [js.solo && 'solo', js.coop ? 'en coop' : js.deux && 'à deux', js.canape && 'sur le même écran', js.pvp && "contre d'autres joueurs en ligne", !js.coop && !js.pvp && js.groupe && 'à plusieurs'].filter(Boolean).join(', ') || 'solo';
    const multiMort = js.mort ? " (le jeu en ligne n'existe plus : serveurs fermés)" : '';
    // On ne « finit » pas League of Legends ou FIFA : on y a joué.
    const motFini = j.sansFin ? 'Joué' : 'Fini';
    const boutonFini = fait
      ? `<a class="btn fait" href="#/fini/${id}">${fait.v != null ? motFini + ' · ' + VERDICTS[fait.v] : motFini + ' · donner mon avis'}</a>`
      : `<a class="btn principal" href="#/fini/${id}">${j.sansFin ? "J'y ai joué" : "Je l'ai fini"}</a>`;
    const ligne = (t, v) => (v ? `<dt>${t}</dt><dd>${esc(v)}</dd>` : '');
    const sesSeries = (j.series || []).filter((i) => JEUX_SERIE[i] && JEUX_SERIE[i].length >= 2).sort((a, b) => JEUX_SERIE[b].length - JEUX_SERIE[a].length);
    const grandeSerie = sesSeries[0];
    // Les 14 jeux les plus connus de la série, rangés par date de sortie (pas six obscurs spin-off d'abord).
    const autresSerie = grandeSerie != null ? JEUX_SERIE[grandeSerie].filter((x) => x !== j).sort((a, b) => (b.populaire || 0) - (a.populaire || 0)).slice(0, 14).sort((a, b) => (a.annee || 9999) - (b.annee || 9999)) : [];
    const suites = voisins(j, f, 12, new Set(autresSerie.map((x) => x.id)));
    const captures = (f && f.s) || [];
    const humsEstimees = j.humEstime ? hums.filter(([, p]) => p >= 25).slice(0, 2).map(([k]) => HUM[k]) : [];
    const listeFr = (l) => (l.length > 1 ? l.slice(0, -1).join(', ') + ' et ' + l[l.length - 1] : l[0] || '');
    main.innerHTML = `
      <section class="fiche-hero lamp" data-lampe aria-labelledby="titre-jeu">${calques(grandeImage(j, f))}
        <div class="fiche-hero-in">
          <img class="fiche-cover" src="${jaquette(j, true)}" alt="Jaquette de ${esc(j.titre)}" data-titre="${esc(j.titre)}" style="view-transition-name: jaquette">
          <div class="fiche-titre">
            <h1 id="titre-jeu">${esc(j.titre)}</h1>
            <p class="qui">${[studio, j.annee, j.genre].filter(Boolean).map(esc).join(' · ')}</p>
            <div class="actions">${boutonFini}<button class="btn" type="button" data-envie="${id}" aria-pressed="${veut}">${veut ? 'Dans ma liste' : 'Je veux y jouer'}</button><a class="btn discret" href="#/envie?c=${encodeURIComponent(id)}">Des jeux dans cet esprit</a></div>
          </div>
        </div>
      </section>
      <div class="wrap">
        <div class="fiche-corps">
          <dl class="cartel">
            ${ligne('Genre', j.genre)}${ligne('Studio', studio)}${ligne('Éditeur', f && f.ed && f.ed.join(', '))}${ligne('Sortie', j.annee)}
            ${ligne('Sur', trierMachines(j.plateformes).join(', '))}${ligne('Histoire', histoire ? '~' + histoire + ' h' : '')}${ligne('Avec les à-côtés', aCotes && aCotes >= histoire * 1.3 && (!complet || aCotes < complet) ? '~' + aCotes + ' h' : '')}${ligne('Tout faire', complet ? '~' + complet + ' h' : '')}
            ${j.gamepass && !j.gratuit ? `<dt>Game Pass</dt><dd>Oui, ${texteGamePass(j.gamepass)}</dd>` : ''}
            ${sesSeries.length ? `<dt>Série</dt><dd>${sesSeries.slice(0, 3).map((i) => `<a href="#/recherche?serie=${i}">${esc(SERIES[i])}</a>`).join(', ')}</dd>` : ''}
            ${j.demo ? ligne('Petites sessions', j.sessions ? 'oui' : 'plutôt non') : ''}${ligne('Joueurs', cap(joueurs) + multiMort)}${ligne('Prix', j.gratuit ? 'Gratuit (free-to-play)' : '')}${ligne('Attention', j.ferme && j.annee ? (j.annee > ANNEE ? 'Pas encore sorti' : /counter-strike|overwatch/i.test(j.titre) ? 'Remplacé par sa suite, il ne se joue plus' : 'Serveurs fermés, il ne se joue plus') : '')}${ligne('Plutôt pour', humsEstimees.length ? listeFr(humsEstimees) + (j.humRedac ? ' (notre estimation)' : " (d'après son genre)") : '')}${j.verdicts ? ligne('Note IGDB', j.note ? j.note + '/100 (' + nb(j.nbNotes) + ' notes)' : '') : ''}
          </dl>
          <div class="fiche-principal">
            ${j.pitch ? `<p class="pitch">${esc(j.pitch)}</p>` : blocTexte(tx)}
            ${j.verdicts || j.note ? `<section class="bloc" aria-label="Verdict des joueurs">
              ${j.verdicts ? `
              <div class="verdict-tete"><span class="grand-chiffre">${j.verdicts[0]} %</span><p>de coups de cœur sur ${nb(j.nbAvis)} avis</p></div>
              <div class="verdicts" role="img" aria-label="${VERDICTS.map((v, i) => v + ' ' + j.verdicts[i] + ' %').join(', ')}">${j.verdicts.map((p, i) => `<span class="v${i}" style="width:${p}%"></span>`).join('')}</div>
              <div class="legende" aria-hidden="true">${VERDICTS.map((v, i) => `<span><i class="v${i}"></i><b>${j.verdicts[i]} %</b>${v}</span>`).join('')}</div>`
              : `<div class="verdict-tete"><span class="grand-chiffre">${j.note}</span><p>sur 100 : la moyenne de ${nb(j.nbNotes)} ${pl(j.nbNotes, 'note', 'notes')} de joueurs et de critiques, d'après IGDB.</p></div>`}
            </section>` : ''}
            ${hums.length && !j.humEstime ? `<section class="bloc">
              <h2>C'est un jeu pour…</h2>
              <p class="sous">${j.humEstime ? "Estimé d'après son genre, en attendant les avis des joueurs." : "Ce que les joueurs ont répondu après l'avoir fini."}</p>
              <div class="barres${j.humEstime ? ' estime' : ''}">${hums.map(([k, p]) => `<div class="barre"><span>${cap(HUM[k])}</span><span class="piste" aria-hidden="true"><span style="width:${p}%"></span></span><span class="pc">${j.humEstime ? '' : p + ' %'}</span></div>`).join('')}</div>
            </section>` : ''}
            ${Object.keys(j.forts || {}).length ? `<section class="bloc">
              <h2>Ses points forts</h2>
              <dl class="forts">${Object.entries(j.forts).map(([k, t]) => `<dt>${cap(FORTS[k])}</dt><dd>${esc(cap(t))}.</dd>`).join('')}</dl>
            </section>` : ''}
            ${captures.length ? `<section class="bloc"><h2>En images</h2><div class="captures">${captures.map((c) => `<img src="${IGDB_IMG}t_screenshot_med/${c}.jpg" alt="Capture d'écran de ${esc(j.titre)}" loading="lazy" data-ratio="16 / 9">`).join('')}</div></section>` : ''}
            <section class="bloc">
              <h2>Ce qu'ils en disent</h2>
              ${avis.length
                ? `<div class="avis">${avis.map((a) => `<blockquote${a.spoil ? ' class="spoil"' : ''}>${a.spoil ? '<button type="button" class="montrer-spoil" aria-expanded="false">Cet avis dévoile un moment clé. Le lire quand même</button>' : ''}<p${a.spoil ? ' hidden' : ''}>${esc(a.t)}</p><footer><b>${esc(a.pseudo)}</b>${a.v != null ? `<span class="tag ${a.v === 0 ? 'v0' : ''}">${VERDICTS[a.v]}</span>` : ''}${a.aime ? `<span>a préféré ${FORTS[a.aime]}</span>` : ''}</footer></blockquote>`).join('')}</div>`
                : `<p class="sous">Personne n'a encore donné son avis ici. <a href="#/fini/${id}">${j.sansFin ? 'Tu y as joué ?' : "Tu l'as fini ?"} Le tien sera le premier.</a></p>`}
            </section>
            ${j.igdb && f && f.url ? `<p class="sous credit">Données : <a href="${esc(f.url)}" target="_blank" rel="noopener">fiche IGDB.com</a></p>` : ''}
          </div>
        </div>
        ${autresSerie.length ? `<section class="section">
          <div class="section-tete"><h2>La série ${esc(SERIES[grandeSerie])}</h2><a class="lien-fleche" href="#/recherche?serie=${grandeSerie}">${JEUX_SERIE[grandeSerie].length > autresSerie.length + 1 ? `Les ${nb(JEUX_SERIE[grandeSerie].length)} jeux, dans l'ordre` : "Dans l'ordre de sortie"} ${fleche}</a></div>
          <div class="etagere">${autresSerie.slice(0, 14).map((s) => cover(s)).join('')}</div>
        </section>` : ''}
        ${suites.length ? `<section class="section">
          <div class="section-tete"><h2>${j.suites && j.suites.length ? `Après ${esc(j.titre)}, on te conseille` : 'Dans la même veine'}</h2><a class="lien-fleche" href="#/envie?c=${encodeURIComponent(j.id)}">Affiner ${fleche}</a></div>
          <div class="etagere">${suites.map((s) => {
            const k = Object.keys(s.forts || {}).find((x) => (j.forts || {})[x]);
            return cover(s, k ? 'Pour ' + FORTS[k] : meta(s));
          }).join('')}</div>
        </section>` : ''}
      </div>`;
    return j.titre;
  }

  /* ---------- J'ai fini un jeu ---------- */
  function puce(nom, valeur, texte, coches) {
    return `<label><input type="checkbox" name="${nom}" value="${valeur}" ${(coches || []).includes(valeur) ? 'checked' : ''}><span>${esc(cap(texte))}</span></label>`;
  }

  function fini([id]) {
    const j = PAR_ID[id];
    if (!j) {
      main.innerHTML = `<div class="wrap"><div class="page-tete"><h1>Tu viens de finir quoi ?</h1><p class="sous">Tape le nom du jeu, on s'occupe du reste.</p><div style="max-width:640px">${champJeu('fini-q2', 'Le jeu que tu viens de finir', 'Le jeu que tu viens de finir')}</div></div></div>`;
      autocomplete($('#fini-q2'), $('#fini-q2-liste'), (g) => { location.hash = '#/fini/' + g.id; }, 'fini');
      setTimeout(() => $('#fini-q2') && $('#fini-q2').focus(), 50);
      return "J'ai fini un jeu";
    }
    const deja = journal.finis[id] || {};
    const fortsJeu = Object.keys(j.forts || {}).length ? Object.keys(j.forts) : ['combats', 'histoire', 'ambiance', 'musique', 'exploration', 'defi'];
    const autres = Object.keys(FORTS).filter((k) => !fortsJeu.includes(k));
    main.innerHTML = `
      <div class="wrap">
        <div class="fini">
          <aside class="fini-cote">
            <img src="${jaquette(j, true)}" alt="Jaquette de ${esc(j.titre)}" data-titre="${esc(j.titre)}" style="view-transition-name: jaquette">
            <div><p style="color:var(--texte-2)">${j.sansFin ? 'Tu as joué à' : 'Tu as fini'}</p><h1>${esc(j.titre)}</h1></div>
          </aside>
          <form class="fini-form" id="form-fini" novalidate>
            <fieldset class="question">
              <legend>T'en as pensé quoi ?</legend>
              <div class="choix-verdict">${VERDICTS.map((v, i) => `<label><input type="radio" name="v" value="${i}" ${deja.v === i ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div>
            </fieldset>
            <fieldset class="question">
              <legend>Qu'est-ce que tu as préféré ?</legend>
              <p class="aide">Plusieurs réponses possibles. C'est ce qui guide le jeu qu'on va te proposer.</p>
              <div class="puces">
                ${fortsJeu.map((k) => puce('aime', k, FORTS[k], deja.aime)).join('')}
                <span class="puces-in" id="plus-forts" ${autres.some((k) => (deja.aime || []).includes(k)) ? '' : 'hidden'}>${autres.map((k) => puce('aime', k, FORTS[k], deja.aime)).join('')}</span>
                <button type="button" class="voir-plus" aria-expanded="false" aria-controls="plus-forts">Autre chose</button>
              </div>
            </fieldset>
            <fieldset class="question">
              <legend>C'était un jeu pour…</legend>
              <div class="puces">${Object.keys(HUM).map((k) => puce('hum', k, HUM[k], deja.hum)).join('')}</div>
            </fieldset>
            <div class="question">
              <label class="q" for="phrase">Ton avis en une phrase</label>
              <p class="aide">Facultatif. Ce que tu dirais à un pote qui hésite à le lancer.</p>
              <input class="phrase-avis" id="phrase" name="phrase" maxlength="160" autocomplete="off" value="${esc(deja.phrase || '')}" placeholder="Par exemple : dur au début, impossible à lâcher ensuite">
              <p class="compteur" id="compteur">${(deja.phrase || '').length} / 160</p>
              <label class="case"><input type="checkbox" id="spoil" ${deja.spoil ? 'checked' : ''}><span>Mon avis dévoile un moment clé : le cacher par défaut</span></label>
            </div>
            <fieldset class="question">
              <legend>Deux infos pour aider les autres</legend>
              <p class="aide">Facultatif. Ça aide ceux qui hésitent à le lancer.</p>
              <div class="puces">
                ${[['facile', 'facile à prendre en main'], ['accroche', "il faut s'accrocher au début"]].map(([v, t]) => `<label><input type="radio" name="prise" value="${v}" ${deja.prise === v ? 'checked' : ''}><span>${cap(t)}</span></label>`).join('')}
              </div>
              <div class="puces" style="margin-top:10px">
                ${[['sessions', 'se joue par petites sessions'], ['soirees', 'plutôt en longues soirées']].map(([v, t]) => `<label><input type="radio" name="rythme" value="${v}" ${deja.rythme === v ? 'checked' : ''}><span>${cap(t)}</span></label>`).join('')}
              </div>
            </fieldset>
            <div class="envoi">
              <button class="btn principal" type="submit">Enregistrer et voir mon prochain jeu</button>
              <p class="note" id="note-envoi" role="status"></p>
            </div>
          </form>
        </div>
      </div>
      <div id="prochain"></div>`;

    const form = $('#form-fini');
    const plus = $('.voir-plus', form);
    plus.addEventListener('click', () => {
      const zone = $('#plus-forts');
      zone.hidden = !zone.hidden;
      plus.setAttribute('aria-expanded', String(!zone.hidden));
      plus.textContent = zone.hidden ? 'Autre chose' : 'Moins de choix';
    });
    $('#phrase').addEventListener('input', (e) => { $('#compteur').textContent = e.target.value.length + ' / 160'; });
    form.addEventListener('change', (e) => { if (e.target.name === 'v') $('#note-envoi').textContent = ''; });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = form.querySelector('input[name="v"]:checked');
      if (!v) {
        $('#note-envoi').textContent = "Choisis d'abord ton verdict, juste au-dessus.";
        form.querySelector('input[name="v"]').focus();
        return;
      }
      const entree = {
        v: Number(v.value),
        aime: $$('input[name="aime"]:checked', form).map((x) => x.value),
        hum: $$('input[name="hum"]:checked', form).map((x) => x.value),
        phrase: $('#phrase').value.trim(),
        spoil: $('#spoil').checked || undefined,
        prise: (form.querySelector('input[name="prise"]:checked') || {}).value,
        rythme: (form.querySelector('input[name="rythme"]:checked') || {}).value,
        // Un avis sur un jeu « déjà joué avant » ne le fait pas compter dans « Ton année ».
        ...(journal.finis[id] && journal.finis[id].avant ? { avant: true } : { date: (journal.finis[id] && journal.finis[id].date) || new Date().toISOString() })
      };
      const premiereFois = !journal.finis[id] || journal.finis[id].v == null;
      journal.finis[id] = entree;
      journal.envies = journal.envies.filter((x) => x !== id);
      sauver();
      toast(premiereFois ? (compte ? 'Ajouté à ton journal.' : 'Ajouté à ton journal sur cet appareil. Crée un compte pour le garder partout.') : 'Ton avis est mis à jour.');
      afficherProchain(j, entree);
    });
    return (j.sansFin ? "J'ai joué à " : "J'ai fini ") + j.titre;
  }

  /* ---------- La carte de fin de partie, à partager ---------- */
  function chargerImage(url) {
    return new Promise((ok) => {
      if (!url) { ok(null); return; }
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => ok(im);
      im.onerror = () => ok(null);
      setTimeout(() => ok(null), 5000);
      im.src = url;
    });
  }
  function couper(ctx, texte, largeur, max) {
    const mots = String(texte).split(/\s+/);
    const l = [];
    let ligne = '';
    for (const m of mots) {
      const essai = ligne ? ligne + ' ' + m : m;
      if (ctx.measureText(essai).width > largeur && ligne) { l.push(ligne); ligne = m; } else ligne = essai;
    }
    if (ligne) l.push(ligne);
    if (l.length > max) { l.length = max; l[max - 1] = l[max - 1].replace(/\s*\S*$/, '') + '…'; }
    return l;
  }
  async function dessinerCarte(base, entree, suivant, avecImage) {
    const W = 1080, H = 1350, M = 84;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#0E0D0C';
    ctx.fillRect(0, 0, W, H);
    if (avecImage) {
      const im = await chargerImage(grandeImage(base, await chargerFiche(base)));
      if (im) {
        const h = 820, r = Math.max(W / im.width, h / im.height);
        ctx.save();
        ctx.filter = 'brightness(0.42) saturate(0.55)';
        ctx.drawImage(im, (W - im.width * r) / 2, (h - im.height * r) / 2, im.width * r, im.height * r);
        ctx.restore();
        const lampe = ctx.createRadialGradient(W * 0.68, 300, 0, W * 0.68, 300, 520);
        lampe.addColorStop(0, 'rgba(240,176,63,0.16)');
        lampe.addColorStop(1, 'rgba(240,176,63,0)');
        ctx.fillStyle = lampe;
        ctx.fillRect(0, 0, W, h);
        const fondu = ctx.createLinearGradient(0, 360, 0, h);
        fondu.addColorStop(0, 'rgba(14,13,12,0)');
        fondu.addColorStop(1, 'rgba(14,13,12,1)');
        ctx.fillStyle = fondu;
        ctx.fillRect(0, 0, W, h);
      }
    }
    let y = 560;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#A79F93';
    ctx.font = '500 36px "Plex Sans"';
    ctx.fillText(base.sansFin ? "J'ai joué à" : "J'ai fini", M, y);
    ctx.font = '800 128px "Big Shoulders"';
    ctx.fillStyle = '#ECE6DC';
    for (const l of couper(ctx, base.titre, W - 2 * M, 3)) { y += 118; ctx.fillText(l, M, y); }
    y += 76;
    if (entree.v != null) {
      ctx.font = '600 38px "Plex Sans"';
      const t = VERDICTS[entree.v];
      const w = ctx.measureText(t).width + 44;
      ctx.strokeStyle = '#F0B03F';
      ctx.lineWidth = 3;
      ctx.strokeRect(M, y - 44, w, 64);
      ctx.fillStyle = '#F0B03F';
      ctx.fillText(t, M + 22, y);
      y += 74;
    }
    if (entree.aime && entree.aime[0]) {
      ctx.font = '400 34px "Plex Sans"';
      ctx.fillStyle = '#A79F93';
      for (const l of couper(ctx, "Ce que j'ai préféré : " + FORTS[entree.aime[0]], W - 2 * M, 2)) { y += 6; ctx.fillText(l, M, y); y += 42; }
    }
    if (entree.phrase && !entree.spoil) {
      ctx.font = '400 40px "Plex Sans"';
      ctx.fillStyle = '#D8D0C3';
      y += 18;
      for (const l of couper(ctx, '« ' + entree.phrase + ' »', W - 2 * M, 3)) { ctx.fillText(l, M, y); y += 54; }
    }
    if (suivant) {
      y = Math.max(y + 30, H - 330);
      ctx.fillStyle = '#2E2A26';
      ctx.fillRect(M, y, W - 2 * M, 2);
      y += 66;
      ctx.font = '500 32px "Plex Sans"';
      ctx.fillStyle = '#A79F93';
      ctx.fillText('Mon prochain jeu', M, y);
      ctx.font = '800 76px "Big Shoulders"';
      ctx.fillStyle = '#ECE6DC';
      for (const l of couper(ctx, suivant.titre, W - 2 * M, 1)) { y += 80; ctx.fillText(l, M, y); }
    }
    ctx.font = '800 48px "Big Shoulders"';
    ctx.fillStyle = '#ECE6DC';
    ctx.fillText('Nouvelle Partie', M, H - 70);
    const wl = ctx.measureText('Nouvelle Partie ').width;
    ctx.fillStyle = '#F0B03F';
    ctx.fillText('+', M + wl, H - 70);
    ctx.font = '400 28px "Plex Sans"';
    ctx.fillStyle = '#A79F93';
    const accroche = 'Et toi ? À quoi tu joues ?';
    ctx.fillText(accroche, W - M - ctx.measureText(accroche).width, H - 76);
    return cv;
  }
  // « se détendre » → « me détendre » / « te détendre » ; « s'évader » → « m'évader ».
  const humeurPour = (h, pronom) => HUM[h].replace(/^se /, pronom + ' ').replace(/^s'/, pronom.charAt(0) + "'");
  // Le bilan de l'année, à partager (façon Letterboxd).
  function bilanAnnee(annee) {
    const finis = Object.entries(journal.finis).filter(([id, e]) => PAR_ID[id] && e.date && new Date(e.date).getFullYear() === annee);
    const jeux = finis.map(([id, e]) => [PAR_ID[id], e]).filter(([j]) => !j.sansFin); // LoL ou FIFA ne comptent pas comme « finis »
    const coeurs = jeux.filter(([, e]) => e.v === 0).map(([j]) => j);
    const heures = jeux.reduce((t, [j]) => t + (j.histoire || 0), 0);
    const comptes = {};
    jeux.forEach(([j, e]) => (e.hum && e.hum.length ? e.hum : topHum(j, 1)).forEach((h) => { comptes[h] = (comptes[h] || 0) + 1; }));
    const humeur = Object.entries(comptes).sort((a, b) => b[1] - a[1])[0];
    const familles = {};
    jeux.forEach(([j]) => (j.tags || []).filter((t) => t !== 'Coop').forEach((t) => { familles[t] = (familles[t] || 0) + 1; }));
    const famille = Object.entries(familles).sort((a, b) => b[1] - a[1])[0];
    return { annee, n: jeux.length, coeurs, heures, humeur: humeur && humeur[0], famille: famille && famille[0], jeux: jeux.map(([j]) => j) };
  }
  function dessinerAnnee(b) {
    const W = 1080, H = 1350, M = 84;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#0E0D0C';
    ctx.fillRect(0, 0, W, H);
    const lampe = ctx.createRadialGradient(W * 0.72, 260, 0, W * 0.72, 260, 620);
    lampe.addColorStop(0, 'rgba(240,176,63,0.13)');
    lampe.addColorStop(1, 'rgba(240,176,63,0)');
    ctx.fillStyle = lampe;
    ctx.fillRect(0, 0, W, H);
    let y = 210;
    ctx.fillStyle = '#A79F93';
    ctx.font = '500 36px "Plex Sans"';
    ctx.fillText('Mon année de jeu', M, y);
    ctx.font = '800 220px "Big Shoulders"';
    ctx.fillStyle = '#ECE6DC';
    y += 200;
    ctx.fillText(String(b.annee), M - 6, y);
    const chiffres = [[b.n, pl(b.n, 'jeu fini', 'jeux finis')], ['~' + b.heures, "heures d'histoire"], [b.coeurs.length, pl(b.coeurs.length, 'coup de cœur', 'coups de cœur')]];
    y += 110;
    chiffres.forEach(([v, t], i) => {
      const x = M + i * 310;
      ctx.font = '800 96px "Big Shoulders"';
      ctx.fillStyle = i === 2 ? '#F0B03F' : '#ECE6DC';
      ctx.fillText(String(v), x, y);
      ctx.font = '400 30px "Plex Sans"';
      ctx.fillStyle = '#A79F93';
      ctx.fillText(t, x, y + 46);
    });
    y += 150;
    ctx.fillStyle = '#2E2A26';
    ctx.fillRect(M, y, W - 2 * M, 2);
    y += 80;
    ctx.font = '400 38px "Plex Sans"';
    ctx.fillStyle = '#D8D0C3';
    if (b.humeur) { ctx.fillText('Je joue surtout pour ' + humeurPour(b.humeur, 'me') + '.', M, y); y += 58; }
    if (b.famille) { ctx.fillText("Mon genre de l'année : " + (LIBELLE_TYPE[b.famille] || b.famille).replace(/^jeu (de |d')/, '') + '.', M, y); y += 58; }
    if (b.coeurs.length) {
      y += 40;
      ctx.font = '500 32px "Plex Sans"';
      ctx.fillStyle = '#A79F93';
      ctx.fillText(pl(b.coeurs.length, 'Mon coup de cœur', 'Mes coups de cœur'), M, y);
      ctx.font = '800 64px "Big Shoulders"';
      ctx.fillStyle = '#ECE6DC';
      b.coeurs.slice(0, 4).forEach((j) => { y += 72; couper(ctx, j.titre, W - 2 * M, 1).forEach((l) => ctx.fillText(l, M, y)); });
    }
    ctx.font = '800 48px "Big Shoulders"';
    ctx.fillStyle = '#ECE6DC';
    ctx.fillText('Nouvelle Partie', M, H - 70);
    const wl = ctx.measureText('Nouvelle Partie ').width;
    ctx.fillStyle = '#F0B03F';
    ctx.fillText('+', M + wl, H - 70);
    ctx.font = '400 28px "Plex Sans"';
    ctx.fillStyle = '#A79F93';
    const accroche = 'Et toi ? À quoi tu joues ?';
    ctx.fillText(accroche, W - M - ctx.measureText(accroche).width, H - 76);
    return cv;
  }
  async function partagerAnnee(b, zone) {
    zone.innerHTML = '<p class="sous">On prépare ton image…</p>';
    if (document.fonts) await Promise.all(['800 220px "Big Shoulders"', '400 38px "Plex Sans"', '500 32px "Plex Sans"'].map((f) => document.fonts.load(f).catch(() => null)));
    const blob = await versBlob(dessinerAnnee(b));
    if (!blob) { zone.innerHTML = "<p class=\"sous\">Ton navigateur n'a pas réussi à créer l'image.</p>"; return; }
    const nom = `mon-annee-de-jeu-${b.annee}.png`;
    const fichier = typeof File === 'function' ? new File([blob], nom, { type: 'image/png' }) : null;
    if (fichier && navigator.canShare && navigator.canShare({ files: [fichier] })) {
      try { await navigator.share({ files: [fichier], title: `Mon année de jeu ${b.annee}` }); zone.innerHTML = ''; return; } catch (e) { if (e.name === 'AbortError') { zone.innerHTML = ''; return; } }
    }
    const url = URL.createObjectURL(blob);
    zone.innerHTML = `<figure class="carte-apercu"><img src="${url}" alt="Mon année de jeu ${b.annee} : ${b.n} jeux finis, ${b.coeurs.length} coups de cœur"><figcaption><a class="btn principal" href="${url}" download="${nom}">Télécharger l'image</a><span class="sous">À poster où tu veux : Discord, Insta, X…</span></figcaption></figure>`;
  }

  const versBlob = (cv) => new Promise((ok) => { try { cv.toBlob((b) => ok(b), 'image/png'); } catch (e) { ok(null); } });
  async function partagerCarte(base, entree, suivant, zone) {
    zone.innerHTML = '<p class="sous">On prépare ton image…</p>';
    if (document.fonts) await Promise.all(['800 128px "Big Shoulders"', '400 40px "Plex Sans"', '600 38px "Plex Sans"', '500 32px "Plex Sans"'].map((f) => document.fonts.load(f).catch(() => null)));
    let blob = await versBlob(await dessinerCarte(base, entree, suivant, true));
    if (!blob) blob = await versBlob(await dessinerCarte(base, entree, suivant, false));
    if (!blob) { zone.innerHTML = "<p class=\"sous\">Ton navigateur n'a pas réussi à créer l'image.</p>"; return; }
    const nom = 'fin-de-partie-' + cle(base.titre).replace(/ /g, '-') + '.png';
    const fichier = typeof File === 'function' ? new File([blob], nom, { type: 'image/png' }) : null;
    if (fichier && navigator.canShare && navigator.canShare({ files: [fichier] })) {
      try { await navigator.share({ files: [fichier], title: (base.sansFin ? "J'ai joué à " : "J'ai fini ") + base.titre }); zone.innerHTML = ''; return; } catch (e) { if (e.name === 'AbortError') { zone.innerHTML = ''; return; } }
    }
    const url = URL.createObjectURL(blob);
    zone.innerHTML = `<figure class="carte-apercu"><img src="${url}" alt="Ta carte de fin de partie : ${esc(base.titre)}, ${entree.v != null ? VERDICTS[entree.v] : ''}${suivant ? ', prochain jeu ' + esc(suivant.titre) : ''}"><figcaption><a class="btn principal" href="${url}" download="${nom}">Télécharger l'image</a><span class="sous">À poster où tu veux : Discord, Insta, X…</span></figcaption></figure>`;
  }

  // Après un gros jeu : des jeux courts, bien notés, d'une autre famille, pour faire la transition.
  function pourSouffler(base, deja) {
    const exclus = new Set([base.id, ...deja, ...Object.keys(journal.finis), ...journal.passes]);
    const tags = (base.tags || []).filter((t) => t !== 'Coop');
    return PAR_POPULARITE.filter((c) => !exclus.has(c.id) && c.histoire > 0 && c.histoire <= 6 && !(c.tags || []).some((t) => tags.includes(t))
      && retardEpoque(base, c) <= 4 && !c.gacha // pas Super Mario World (1990) pour souffler après Kingdom Come 2
      && (c.verdicts ? c.verdicts[0] >= 70 : (c.note || 0) >= 80 && (c.nbNotes || 0) >= 100)).slice(0, 3);
  }

  async function afficherProchain(base, entree) {
    const zone = $('#prochain');
    zone.innerHTML = '<div class="wrap"><p class="rien">On cherche ton prochain jeu…</p></div>';
    let propositions = await recommander(base, entree);
    let nbDejaFaits = 0;
    let i = 0;
    const peindre = async (defiler) => {
      const p = propositions[i];
      if (!p) {
        zone.innerHTML = `<div class="wrap"><div class="rien"><strong>Tu as fait le tour des propositions.</strong>${CAT ? 'Essaie « Ce qui me tente » pour chercher autrement.' : "Le prototype ne contient que 62 jeux tant que le catalogue complet n'est pas téléchargé."}</div></div>`;
        return;
      }
      const f = await chargerFiche(p.j);
      const alts = propositions.slice(i + 1, i + 3);
      const souffles = entree.v < 2 && (base.histoire || 0) >= 20 ? pourSouffler(base, [p.j.id, ...alts.map((a) => a.j.id)]) : [];
      const veut = journal.envies.includes(p.j.id);
      zone.innerHTML = `
        <section class="prochain" aria-labelledby="titre-prochain">
          <div class="prochain-hero lamp" data-lampe>${calques(grandeImage(p.j, f))}
            <div class="prochain-in">
              <p class="annonce">${entree.v >= 2 ? "Pas pour toi ? On change d'air." : 'Ton prochain jeu'}</p>
              <h2 id="titre-prochain" tabindex="-1">${esc(p.j.titre)}</h2>
              <p class="raison">${esc(p.raison)}</p>
              <p class="infos">${[p.j.genre, p.j.histoire ? 'histoire ~' + p.j.histoire + ' h' : '', p.j.plateformes.slice(0, 6).join(', ')].filter(Boolean).map(esc).join(' · ')}</p>
              <div class="actions">
                <button class="btn principal" type="button" data-prendre aria-pressed="${veut}">${veut ? 'Dans ta liste' : 'Je le prends'}</button>
                <button class="btn" type="button" data-autre>Un autre</button>
                <button class="btn discret" type="button" data-deja>Déjà joué</button>
                <a class="btn discret" href="#/jeu/${p.j.id}">Voir la fiche</a>
                <button class="btn discret" type="button" data-partager>Partager ma fin de partie</button>
              </div>
              <div class="zone-partage" id="zone-partage" aria-live="polite"></div>
            </div>
          </div>
          ${nbDejaFaits >= 2 ? `<div class="wrap"><p class="connaisseur">Tu connais déjà les classiques. <a class="lien-fleche" href="#/envie?c=${encodeURIComponent(base.id)}&connu=peu">Des jeux dans le même esprit, mais moins connus ${fleche}</a></p></div>` : ''}
          ${alts.length ? `<div class="wrap"><h3 class="ou-titre">Ou alors</h3><div class="ou-alors">${alts.map((a) => `<a class="alt" href="#/jeu/${a.j.id}" data-jeu="${a.j.id}"><img data-vt src="${jaquette(a.j)}" alt="" loading="lazy" data-titre="${esc(a.j.titre)}"><span><span class="a-t">${esc(a.j.titre)}</span><p class="a-r">${esc(a.court)}</p></span></a>`).join('')}</div></div>` : ''}
          ${souffles.length ? `<div class="wrap souffler"><h3 class="ou-titre">Pas encore prêt pour un gros jeu ?</h3><p class="sous">Après ${base.histoire ? `~${base.histoire} heures dans ${esc(titreCourt(base))}` : esc(titreCourt(base))}, un jeu court et différent fait du bien. Trois idées pour changer d'air sans t'engager.</p><div class="ou-alors">${souffles.map((c) => `<a class="alt" href="#/jeu/${c.id}" data-jeu="${c.id}"><img data-vt src="${jaquette(c)}" alt="" loading="lazy" data-titre="${esc(c.titre)}"><span><span class="a-t">${esc(c.titre)}</span><p class="a-r">${esc(['~' + c.histoire + ' h', c.genre].filter(Boolean).join(' · '))}</p></span></a>`).join('')}</div></div>` : ''}
        </section>`;
      activerLampes(zone);
      if (defiler) {
        zone.scrollIntoView({ behavior: reduit.matches ? 'auto' : 'smooth', block: 'start' });
        $('#titre-prochain').focus({ preventScroll: true });
      }
    };
    zone.onclick = async (e) => {
      const p = propositions[i];
      if (!p) return;
      if (e.target.closest('[data-partager]')) { await partagerCarte(base, entree, p.j, $('#zone-partage')); return; }
      if (e.target.closest('[data-prendre]')) {
        const ajoute = basculerEnvie(p.j.id);
        toast(ajoute ? `${p.j.titre} est dans ta liste « Je veux y jouer ».` : `${p.j.titre} est retiré de ta liste.`);
        await peindre(false);
      } else if (e.target.closest('[data-autre]')) {
        i += 1;
        await peindre(false);
        if ($('#titre-prochain')) $('#titre-prochain').focus({ preventScroll: true });
      } else if (e.target.closest('[data-deja]')) {
        journal.finis[p.j.id] = { v: null, avant: true }; // joué avant : pas de date, ne compte pas dans « Ton année »
        nbDejaFaits += 1;
        sauver();
        toast(`${p.j.titre} : noté comme déjà joué.`);
        propositions = propositions.filter((x) => x.j.id !== p.j.id);
        await peindre(false);
        if ($('#titre-prochain')) $('#titre-prochain').focus({ preventScroll: true });
      }
    };
    await peindre(true);
  }

  /* ---------- Ce qui me tente : la phrase à trous ---------- */
  const OPTIONS = {
    g: [['', 'jeu'], ...TYPES],
    h: [['', "pour n'importe quelle humeur"], ['detente', 'tranquille'], ['defouler', 'pour me défouler'], ['reflechir', 'qui fait réfléchir'], ['emotion', 'qui me touche'], ['frissons', 'qui fait un peu peur'], ['evasion', "où je peux m'évader"], ['defi', 'qui me résiste'], ['encoreune', 'où on enchaîne les parties']],
    d: [['', 'peu importe la durée'], ['sessions', 'qui se joue par petites sessions'], ['5', 'fini en une soirée ou deux'], ['15', 'en moins de 15 heures'], ['30', 'qui ne prend pas 600 heures'], ['long', "où je peux m'installer longtemps"]],
    j: [['', 'seul ou à plusieurs'], ['solo', 'à jouer seul'], ['deux', 'à jouer à deux'], ['groupe', 'à jouer entre potes'], ['pvp', "contre d'autres joueurs en ligne"]],
    p: [['', "sur n'importe quelle machine"], ['PC', 'sur PC'], ['PS5', 'sur PS5'], ['PS4', 'sur PS4'], ['PlayStation', 'sur une PlayStation'], ['XboxSeries', 'sur Xbox Series'], ['XboxOne', 'sur Xbox One'], ['Xbox', 'sur Xbox'],
      ['Switch2', 'sur Switch 2'], ['Switch', 'sur Switch'], ['Nintendo', 'sur une Nintendo'], ['Mobile', 'sur téléphone']]
  };
  const NOMS_FILTRES = { g: 'Genre', h: 'Humeur', d: 'Durée', j: 'Joueurs', p: 'Machine' };
  // « Sur Switch » : les jeux Switch (pas la Super Nintendo, ni les exclusivités Switch 2). La Switch 2 lit aussi les jeux Switch,
  // la PS5 les jeux PS4, la Xbox Series les jeux Xbox One. Les jeux de la démo disent juste « Xbox ».
  const MACHINES_PRECISES = {
    Switch: (x) => x === 'Switch', Switch2: (x) => /^Switch/.test(x), PS5: (x) => x === 'PS5' || x === 'PS4', PS4: (x) => x === 'PS4',
    XboxSeries: (x) => ['Xbox Series', 'Xbox One', 'Xbox'].includes(x), XboxOne: (x) => ['Xbox One', 'Xbox'].includes(x)
  };
  const plateformeSur = (x, p) => (MACHINES_PRECISES[p] ? MACHINES_PRECISES[p](x) : famille(x) === p);
  const surMachine = (c, p) => (MACHINES_PRECISES[p] ? c.plateformes.some(MACHINES_PRECISES[p]) : c.familles.includes(p));

  // Comprendre une envie écrite librement, en français de tous les jours.
  // On repère d'abord ce que le joueur ne veut pas (« pas d'horreur », « sans prise de tête »),
  // puis un jeu de référence (« comme Hades »), puis le reste.
  const MOTS_TYPES = [
    [/\bmoba\b/, 'MOBA'], [/battle ?royale|\bbr\b/, 'Battle royale'], [/\bsouls(?:like|-like)?\b/, 'Soulslike'],
    [/jeux? (?:de )?rythme|rythmique|\bmusical|guitar hero|jeux? de danse/, 'Rythme'], [/beat ?'?em|beat them all|hack ?(?:'?n'?|and) ?slash|\bbta\b/, "Beat'em all"],
    [/\bj?rpg\b|jeu de role|\barpg\b/, 'RPG'], [/rogue/, 'Roguelite'], [/metroidvania/, 'Metroidvania'], [/monde ouvert|open world/, 'Monde ouvert'],
    [/plate-?formes?/, 'Plateforme'], [/enigmes?|puzzles?|casse-tetes?/, 'Énigmes'], [/strategie|\bstrat\b|\b4 ?x\b|\brts\b|temps reel/, 'Stratégie'],
    [/course|voitures?|rallye|kart/, 'Course'], [/gestion|ferme|simulation|construire|batir|city ?builder|colonie|usine|automatisation/, 'Gestion'], [/\bfoot\b|sports?|basket|tennis/, 'Sport'],
    [/\btir\b|fps|shooter|flingue/, 'Tir'], [/point (?:and|&|n|'n') ?click|pointer-? ?cliquer/, 'Aventure'], [/combats?|baston|fighting/, 'Combat'], [/horreur|flippant|qui fait peur/, 'Horreur'], [/cartes?|deck/, 'Cartes'],
    [/narratif|histoire|recit/, 'Narratif'], [/aventure/, 'Aventure'], [/action|bourrin/, 'Action']
  ];
  // Les sujets : [mots du joueur, code, comment on l'écrit].
  const SUJETS = [
    [/survival ?horror/, 'survivalhorror', 'Survival horror'], [/horreur psycholog|psychologique/, 'horreurpsy', 'Horreur psychologique'],
    [/boomer ?shooter|fps (?:retro|a l'ancienne|old ?school)|shooter (?:retro|old ?school)/, 'boomer', "Un FPS à l'ancienne"],
    [/point (?:and|&|n|'n') ?click|pointer-? ?cliquer/, 'pointclick', 'Point & click'], [/\b4 ?x\b/, '4x', 'Un 4X'], [/\brts\b|temps reel/, 'rts', 'En temps réel'],
    [/tactique|tactical|\bsrpg\b/, 'tactique', 'Tactique'], [/deck-? ?build/, 'deckbuilder', 'Deckbuilder'], [/colonie|colony/, 'colonie', 'Gérer une colonie'],
    [/usine|automatisation|factory|chaine de production/, 'automatisation', "Usines et automatisation"],
    [/\bcrpg\b|rpg a l'ancienne|a la baldur|a la divinity|a la pillars/, 'crpg', 'Un CRPG'], [/diablo-? ?like|a la diablo|\bhns\b|h ?& ?s\b|hack ?(?:'?n'?|and) ?slash (?:rpg|en vue|a la)/, 'diablolike', "Un hack'n'slash à la Diablo"], [/isometrique|vue de dessus/, 'iso', 'En vue isométrique'], [/\b2 ?d\b/, '2d', 'En 2D'], [/\b3 ?d\b/, '3d', 'En 3D'],
    [/action-? ?rpg|\ba-?rpg\b/, 'actionrpg', 'Orienté action'], [/occidental|\bwrpg\b/, 'occidental', 'Un RPG occidental'],
    [/simu(?:lation)? (?:de |automobile|auto)|sim ?racing|simu auto/, 'simu', 'En simulation'],
    [/(?:bonne|super|belle|grande|vraie|tres bonne|excellente) histoire|scenario|bien ecrit|narration|histoire (?:prenante|forte|marquante)/, 'recit', 'Avec une vraie histoire'],
    [/zombie/, 'zombies', 'Avec des zombies'], [/pirate|corsaire|flibustier/, 'pirates', 'Avec des pirates'], [/extraterrestre|\baliens?\b/, 'aliens', 'Avec des extraterrestres'],
    [/l'espace|spatial|vaisseau|galaxie|astronaute|planetes/, 'espace', "Dans l'espace"], [/dragon/, 'dragons', 'Avec des dragons'],
    [/post-?apo|apocalyp|fin du monde/, 'postapo', 'Post-apocalyptique'], [/enquete|detective|polar|policier|mystere|meurtre/, 'enquete', 'Une enquête'],
    [/pixel/, 'pixel', 'En pixel art'], [/football americain|\bnfl\b/, 'footus', 'Football américain'], [/\bfoot\b|football|soccer/, 'foot', 'Du foot'],
    [/basket|\bnba\b/, 'basket', 'Du basket'], [/tennis/, 'tennis', 'Du tennis'], [/\bgolf/, 'golf', 'Du golf'], [/baseball/, 'baseball', 'Du baseball'],
    [/\bskate/, 'skate', 'Du skate'], [/\bcatch\b/, 'catch', 'Du catch'], [/\bboxe\b/, 'boxe', 'De la boxe'], [/ninja/, 'ninjas', 'Avec des ninjas'],
    [/samoura|samurai/, 'samourais', 'Avec des samouraïs'], [/viking/, 'vikings', 'Avec des Vikings'], [/moyen ?age|medieval|chevalier/, 'medieval', 'Au Moyen Âge'],
    [/cyberpunk/, 'cyberpunk', 'Cyberpunk'], [/western|far ?west|cow-?boy/, 'western', 'Un western'], [/mytholog|dieux grecs|dieux nordiques/, 'mythologie', 'Mythologie'],
    [/dinosaure/, 'dinosaures', 'Avec des dinosaures'], [/\bchats?\b|chaton/, 'chats', 'Avec des chats'], [/\bchiens?\b|toutou/, 'chiens', 'Avec des chiens'],
    [/vampire/, 'vampires', 'Avec des vampires'], [/robot|mecha/, 'robots', 'Avec des robots'], [/voyage(?:r)? dans le temps/, 'temps', 'Voyage dans le temps'],
    [/sous l'eau|sous-marin|ocean|plongee/, 'sousleau', "Sous l'eau"], [/cuisine|cuisiner/, 'cuisine', 'Cuisine'], [/\bpeche\b|pecher/, 'peche', 'Pêche'],
    [/chevaux|\bcheval\b|equitation/, 'chevaux', 'Avec des chevaux'], [/\btrains?\b/, 'trains', 'Des trains'], [/magie|sorcier|sorciere|magicien/, 'magie', 'De la magie'],
    [/super-? ?heros|super heros/, 'superheros', 'Super-héros'], [/fantome|hante/, 'fantomes', 'Fantômes'], [/guerre|militaire|soldat|ww ?2/, 'guerre', 'La guerre'],
    [/\banime\b|manga/, 'anime', 'Style anime'], [/mignon|kawaii|trop chou/, 'mignon', 'Mignon'], [/\bjrpg\b|rpg japonais/, 'jrpg', 'Un JRPG'],
    [/city ?builder|construire (?:une|ma) ville|batir (?:une|ma) ville|gerer (?:une|ma) ville/, 'citybuilder', 'Construire une ville'], [/choix qui comptent|choix importants|mes choix|choix moraux|plusieurs fins/, 'choix', 'Des choix qui comptent'],
    [/\bretro\b|old ?school/, 'retro', 'Style rétro'],
    [/tour par tour/, 'tourpartour', 'Au tour par tour'], [/dessine a la main|fait main/, 'dessin', 'Dessiné à la main'], [/belle musique|bonne musique|bande-? ?son|\bost\b/, 'bandeson', 'Une belle bande-son'],
    [/historique|antiquite|egypte|rome antique|jeu d'epoque/, 'historique', 'Historique'], [/romance|histoire d'amour|romantique|dating/, 'romance', 'Romance'],
    [/drole|rigolo|humour|marrant|absurde/, 'comedie', 'Drôle'], [/infiltration|furtif|discretion/, 'infiltration', 'Infiltration'],
    [/survie|survival/, 'survie', 'Survie'], [/bac a sable|sandbox/, 'sandbox', 'Bac à sable'], [/science-? ?fiction|\bsci-? ?fi\b|futuriste/, 'sf', 'Science-fiction'],
    [/fantasy|heroic/, 'fantasy', 'Fantasy'], [/jeu d'ambiance|party game|soiree entre amis/, 'ambiance', "Jeu d'ambiance"]
  ];
  const NOM_SUJET = Object.fromEntries(SUJETS.map(([, k, n]) => [k, n]));
  const DECENNIES = { 1980: 'Des années 80', 1990: 'Des années 90', 2000: 'Des années 2000', 2010: 'Des années 2010' };
  const AVANT_REFERENCE = /\b(?:un peu comme|comme|genre|style|dans le style de|facon|dans la veine de|dans l'esprit de|similaire a|proche de|j'ai adore|j'ai aime|j'ai kiffe|j'ai fini|je viens de finir)\s+/;
  function trouverReference(t) {
    const m = t.match(new RegExp(AVANT_REFERENCE.source + "([a-z0-9' :.!-]{2,48})"));
    if (!m) return null;
    let mots = m[1].split(/\s+(?=(?:mais|en plus|en moins|sans|pas|qui|avec|sur|pour|a deux|en|et|ou)\b)|[,.!?]/)[0].trim().split(/\s+/);
    while (mots.length) {
      const bout = mots.join(' ');
      const cible = deplierSigles(pourRecherche(bout));
      if (cible.length >= 3 && !MOTS_TYPES.some(([re]) => re.test(' ' + bout + ' '))) {
        const j = chercherTout(bout)[0];
        if (j && (j._n === cible || j._n.startsWith(cible) || j._n.includes(' ' + cible))) return { j, texte: m[0].replace(m[1], '') + bout };
      }
      mots = mots.slice(0, -1);
    }
    return null;
  }

  function comprendre(texte) {
    let t = ' ' + norm(texte).replace(/[,.;!?]/g, ' , ') + ' ';
    const f = {};
    // Ce qu'on ne veut pas.
    if (/pas (?:\d{3,}|des centaines d')\s*h|pas (?:trop )?(?:long|grand|vaste|immense)|pas une eternite|pas des heures|pas 600/.test(t)) f.d = '30';
    if (/pas (?:trop )?(?:dur|difficile|exigeant)|sans (?:prise de tete|stress|pression)|pas (?:de |trop )?prise de tete|pas (?:trop )?complique|pas (?:\d+ )?menus|pas (?:de )?(?:\d+ ?h(?:eures)? de )?tuto|(?:\d+|trop de|plein de) menus|\d+ ?h(?:eures)? de tuto|arbres? de competences|usine a gaz|facile a prendre en main|simple a prendre|(?:ne |n')?joue (?:jamais|pas|peu|presque pas)|debutant|pas (?:un )?gamer|pas gameuse|novice|premier jeu|jamais joue/.test(t)) f.facile = '1';
    if (/pas (?:de |en )?(?:multi|en ligne|online)|sans (?:connexion|internet|multi)|hors (?:ligne|connexion)/.test(t)) f.j = 'solo';
    if (/(?:pas|sans|surtout pas) (?:de |d'|du )?(?:pvp|competiti|ranked|affronter d'autres|versus|joueurs en face)/.test(t)) f.sansPvp = '1';
    if (/(?:pas|sans|aucun|aucune) (?:de |d')?(?:combat|violence|bagarre|arme|sang|tuer)|non[- ]violent|pas violent|paisible/.test(t)) f.paisible = '1';
    if (/canape|meme ecran|ecran (?:partage|scinde)|split ?screen/.test(t)) { f.ecran = '1'; f.j = f.j || (/a (?:3|4|trois|quatre)\b|a plusieurs|entre potes|entre amis/.test(t) ? 'groupe' : 'deux'); }
    t = t.replace(/\b(?:pas|sans|surtout pas|aucun|evite[rz]?|plus jamais)\s+(?:de |d'|du |des |la |le |les |un |une |trop |jeux? (?:de |d')?)*([a-z0-9'-]+(?: [a-z0-9'-]+)?)/g, (tout, mot) => {
      const type = MOTS_TYPES.find(([re]) => re.test(' ' + mot + ' '));
      if (type && !f.x && !f.paisible) f.x = type[1];
      return ' , ';
    });
    // Un jeu de référence : « comme Hades », « genre Outer Wilds ».
    const ref = trouverReference(t);
    if (ref) { f.c = ref.j.id; t = t.replace(ref.texte, ' , '); }

    const a = (re) => re.test(t);
    const type = MOTS_TYPES.find(([re]) => a(re));
    if (type && type[1] !== f.x) f.g = type[1];
    // Jusqu'à deux sujets (« un JRPG au tour par tour »).
    let sujets = SUJETS.filter(([re, k]) => a(re) && !(k === 'enquete' && f.g === 'Horreur')).map(([, k]) => k);
    if (sujets.includes('survivalhorror')) sujets = sujets.filter((k) => k !== 'survie');
    if (sujets.includes('boomer')) sujets = sujets.filter((k) => k !== 'retro');
    if (sujets.includes('tactique') && (f.g === 'Tir' || a(/\bfps\b|shooter/))) f.g = 'Tir'; // « un FPS tactique » : Counter-Strike, pas Civilization
    sujets = sujets.slice(0, 3);
    if (sujets.length) {
      f.sujet = sujets.join(',');
      if (sujets.includes('jrpg') && !f.g) f.g = 'RPG';
      if (['iso', 'actionrpg', 'occidental', 'crpg'].some((k) => sujets.includes(k)) && (!f.g || f.g === 'Action') && (a(/rpg|jeu de role/) || sujets.includes('occidental'))) f.g = 'RPG';
      if (['survivalhorror', 'horreurpsy'].some((k) => sujets.includes(k))) f.g = 'Horreur';
      if (sujets.includes('boomer')) { f.g = 'Tir'; f.vue = 'fps'; }
      if (sujets.includes('pointclick') && !f.g) f.g = 'Aventure';
      if (['4x', 'rts'].some((k) => sujets.includes(k))) f.g = 'Stratégie';
      if (sujets.includes('deckbuilder')) f.g = 'Cartes';
      if (sujets.includes('simu') && a(/course|voiture|auto|rallye|racing/)) f.g = 'Course';
      if (['colonie', 'automatisation'].some((k) => sujets.includes(k)) && !f.g) f.g = 'Gestion';
      if (sujets.includes('citybuilder') && f.g === 'Gestion') delete f.g; // le sujet suffit, plus précis
    }
    if (a(/\bfps\b|premiere personne|vue subjective/)) f.vue = 'fps';
    if (a(/\binde\b|\bindie\b|independant/)) f.inde = '1';
    if (a(/moins connus?|peu connus?|meconnus?|pepites?|cache(?:s|e|es)?\b|sous-? ?cotes?|underrated|\boriginal(?:e|aux)?\b(?<!bande originale)|atypique|\bovni\b|hors des sentiers|que personne ne connait|pas (?:un |les )?(?:grands? )?classiques?|confidentiel/)) f.connu = 'peu';
    else if (a(/triple ?a\b|\baaa\b|gros jeux?|grosses? productions?|blockbuster|gros budget/)) f.connu = 'gros';
    const anneeExacte = t.match(/(?:sortis?e?s?|de|en) (19[7-9]\d|20[0-3]\d)\b/) || t.match(/ (19[89]\d|20[0-3]\d) /);
    const depuis = t.match(/(?:depuis|apres|a partir de) (19[7-9]\d|20[0-3]\d)\b/);
    if (depuis) f.depuis = depuis[1]; else if (anneeExacte) f.annee = anneeExacte[1];
    if (a(/\bmoderne|recents? et/) && !f.depuis && !f.annee && !f.recent) f.depuis = String(ANNEE - 12);
    if (a(/meilleurs?|les mieux notes|\btop\b|chefs?-? ?d'?oeuvre|incontournable/)) f.meilleurs = '1';
    if (a(/pour debuter|pour commencer|accessible|debutant/)) f.facile = '1';

    if (a(/tranquil|chill|cosy|cozy|calme|relax|detente|zen|doux|pose|reposant|vider la tete|decompresser|apres le (?:boulot|taf|travail)|m'endormir/)) f.h = 'detente';
    else if (a(/defoul|nerveux|intense|bourrin|adrenaline|patate/)) f.h = 'defouler';
    else if (a(/reflechi|cerveau|neurone|creuser la tete/)) f.h = 'reflechir';
    else if (a(/emouv|pleur|emotion|triste|touchant|chialer|prend aux tripes|marquant/)) f.h = 'emotion';
    else if (a(/peur|flipp|angoiss|frisson/)) f.h = 'frissons';
    else if (a(/evader|evasion|voyag|immense|grand monde/)) f.h = 'evasion';
    else if (!f.facile && a(/\bdur\b|difficile|defi|challenge|exigeant|corse|qui me resiste/)) f.h = 'defi';
    else if (a(/addict|encore une|enchain|rejouer|chronophage/)) f.h = 'encoreune';

    if (!f.d) {
      const nombre = t.match(/(?:moins de|max(?:imum)?|pas plus de|en)\s*(\d{1,3})\s*(?:h\b|heures?)/);
      if (a(/petites? sessions?|par sessions?|\d{1,2} ?(?:min|minutes)\b|(?:j'ai|juste|seulement) (?:une|1|deux|2) ?(?:petite )?h(?:eures?)?\b|une petite heure|entre deux|a lacher|pause|parties? rapides?|une game|des games|quelques parties/)) f.d = 'sessions';
      else if (nombre) { const n = Number(nombre[1]); f.d = n <= 5 ? '5' : n <= 15 ? '15' : n <= 30 ? '30' : ''; }
      else if (a(/une soiree|un soir\b|en une heure|deux heures|ce soir et (?:c'est )?fini/) || (a(/court|rapide|petit jeu/) && a(/ce soir|cette nuit/))) f.d = '5';
      else if (a(/court|rapide|petit jeu|week-?end/)) f.d = '15';
      else if (a(/\blong\b|m'installer|des centaines|infini|sans fin|chronophage|des mois|des annees de jeu/)) f.d = 'long';
    }

    // Avec qui : contre d'autres en ligne, en coop, à deux, entre potes, seul.
    if (!f.sansPvp && a(/competiti|\bcompet\b|parties? classees?|en classee?s?\b|mode classe|ranked|\bpvp\b|e-?sports?|contre d'autres|contre des (?:gens|joueurs)|\b\d ?v ?\d\b|1 ?contre ?1|en versus|affronter d'autres|tryhard/)) f.j = 'pvp';
    if (a(/\bcoop|co-op|cooperati|ensemble contre|en equipe contre|\bpve\b/)) f.coop = '1';
    if (!f.ecran && a(/en ligne|online|\bmulti\b|multijoueur|avec des potes a distance/)) {
      // « un jeu de combat en ligne » : on veut affronter d'autres joueurs. « un fps en ligne avec des potes » : on veut jouer ensemble.
      if (!f.j && !f.coop && !f.sansPvp && ['Combat', 'Sport', 'Course', 'MOBA', 'Battle royale'].includes(f.g)) f.j = 'pvp';
      if (f.j !== 'pvp') f.enLigne = '1';
    }
    if (!f.j) {
      if (a(/a deux|en duo|ma copine|mon copain|ma femme|mon mari|ma meuf|mon mec|en couple|canape|avec (?:mon fils|ma fille|mon petit|ma petite|mes enfants|mon neveu|ma niece|mon frere|ma soeur)/)) f.j = 'deux';
      else if (a(/entre potes|a plusieurs|avec des (?:amis|potes|copains)|avec mes (?:potes|amis|copains)|avec les potes|entre amis|en groupe|en equipe|en squad|a (?:3|4|5|trois|quatre|cinq)\b|en ligne|online|\bmulti\b|multijoueur/)) f.j = 'groupe';
      else if (a(/\bseul\b|solo/)) f.j = 'solo';
    }
    if (a(/enfant|mon fils|ma fille|mon petit|ma petite|gamin|gosse|neveu|niece|en famille|pour la famille|\b\d{1,2} ans\b/)) f.enfants = '1';
    if (a(/gratuit|\bf2p\b|free ?to ?play|sans (?:rien )?payer|\b0 ?(?:euros?|e)\b/)) f.gratuit = '1';
    if (a(/recent|vient de sortir|viennent de sortir|nouveaute|sortis? cette annee|de cette annee/)) f.recent = '1';
    const dec = t.match(/annees (?:19)?([5-9]0)\b|annees (2000|2010)\b/);
    if (dec) f.an = dec[2] || ('19' + dec[1]);
    else if (a(/vieux jeux?|\bancien|a l'ancienne/)) f.ancien = '1';

    if (a(/switch ?2/)) f.p = 'Switch2';
    else if (a(/switch/)) f.p = 'Switch';
    else if (a(/nintendo|\b3ds\b|\bwii\b|game ?boy/)) f.p = 'Nintendo';
    else if (a(/\bps ?5\b/)) f.p = 'PS5';
    else if (a(/\bps ?4\b/)) f.p = 'PS4';
    else if (a(/\bps ?\d|playstation/)) f.p = 'PlayStation';
    else if (a(/xbox series|series [xs]\b/)) f.p = 'XboxSeries';
    else if (a(/xbox one/)) f.p = 'XboxOne';
    else if (a(/xbox/)) f.p = 'Xbox';
    else if (a(/\bpc\b/) || (a(/steam/) && !a(/(?:ma|mon) (?:bibliotheque )?steam|dans (?:mon|ma) steam/))) f.p = 'PC';
    else if (a(/telephone|mobile|portable|android|iphone/)) f.p = 'Mobile';
    if (a(/\bvr\b|realite virtuelle|casque|quest/)) f.vr = '1';
    if (a(/dans ma liste|ma liste d'envies/)) f.liste = '1';
    else if (a(/que j'ai deja|que je possede|que j'ai achete|ma bibliotheque|mon backlog|ma pile|dans mon steam|sur mon steam/)) { if (BIB) f.steam = '1'; else f.liste = '1'; }
    if (ABO && a(/game ?pass|gamepass/)) f.gp = '1';
    return f;
  }

  // Ce qui se joue bien par petites sessions : jeux à parties courtes, ou jeux courts.
  const TYPES_SESSIONS = new Set(['Roguelite', 'Énigmes', 'Course', 'Sport', 'Combat', 'Cartes', 'MOBA', 'Battle royale', 'Rythme']);
  // Les jeux en réalité virtuelle seulement ne sortent que si on les demande.
  const vrSeulement = (c) => !!c.vrSeul || (c.plateformes.length > 0 && c.plateformes.every((x) => /VR|Quest|Oculus|Vive|Rift/i.test(x)));
  // Par petites sessions : roguelites, cartes, rythme, parties en ligne, ou jeux de course, de sport, de combat, d'énigmes
  // « purs » (pas GTA, rangé dans la course, ni Majora's Mask, rangé dans les énigmes), ou jeux très courts.
  const SESSIONS_FORTES = ['Roguelite', 'Cartes', 'Rythme', 'MOBA', 'Battle royale'];
  const SESSIONS_SI_PUR = ['Course', 'Sport', 'Combat', 'Énigmes'];
  // Les vrais jeux « à parties » (roguelite, cartes, compétitif, course, puzzle pur), puis, à défaut, les jeux très courts.
  const sessionsVraies = (c) => {
    if (c.sessions === true) return true;
    if (c.sessions === false) return false;
    const t = c.tags || [];
    return t.some((x) => SESSIONS_FORTES.includes(x)) || c.jSet.pvp >= 3
      || (t.some((x) => SESSIONS_SI_PUR.includes(x)) && !t.some((x) => ['Aventure', 'RPG', 'Monde ouvert', 'Narratif'].includes(x)));
  };
  const parSessions = (c) => sessionsVraies(c) || (c.sessions !== false && c.histoire > 0 && c.histoire <= 6);
  // Les jeux en ligne sans fin (vraiment compétitifs, MMO) : on peut y passer des centaines d'heures.
  const sansFinEnLigne = (c) => (c.jSet.pvp >= 3 || !!c.jSet.mmo) && enLignePossible(c);
  // Jouer en ligne suppose une machine qui le permet (pas la Super Nintendo) et des serveurs encore ouverts.
  const MACHINES_EN_LIGNE = ['PC', 'PS5', 'Xbox Series', 'Switch 2', 'Switch', 'PS4', 'Xbox One', 'Mac', 'Linux', 'iOS', 'Android', 'PS3', 'Xbox 360', 'Wii U', 'PS Vita', '3DS', 'Wii', 'Xbox'];
  const enLignePossible = (c) => !c.jSet.mort && (c.annee || 0) >= 2004 && c.plateformes.some((x) => MACHINES_EN_LIGNE.includes(x));
  // Repérer un jeu vraiment « sur » un sujet par son titre (Sea of Thieves pour les pirates, pas Metroid Prime et ses pirates de l'espace).
  const TITRE_SUJET = {
    pirates: /pirate|buccaneer|black flag|sea of thieves|monkey island|one piece|skull and bones/, zombies: /zombie|dead|undead|resident evil|dying light|plants vs/,
    espace: /space|star|galax|cosmo|planet|mass effect|outer wilds|no man/, dragons: /dragon|skyrim/, chats: /\bcats?\b|kitty|neko|stray/, chiens: /\bdogs?\b|puppy/,
    foot: /fifa|soccer|football|\bfc \d|pro evolution|efootball/, vampires: /vampire|dracula|castlevania|bloodlines/, ninjas: /ninja|shinobi|sekiro/, western: /red dead|west|cowboy|desperados/,
    cuisine: /cook|chef|kitchen|overcooked|restaurant/, robots: /robot|mech|titanfall|armored core/, dinosaures: /dino|jurassic|primal/, enquete: /detective|sherlock|ace attorney|noire|murder|case/,
    postapo: /fallout|metro|wasteland|apocalyp|last of us|mad max|days gone/, survie: /valheim|\brust\b|\braft\b|don't starve|dayz|7 days|the forest|grounded|subnautica|\bark\b|conan exiles|zomboid|terraria|minecraft|v rising|palworld|enshrouded/, cyberpunk: /cyberpunk|deus ex|ghostrunner|observer/, peche: /fish/, trains: /train|rail/, golf: /golf/,
    tennis: /tennis/, basket: /nba|basket/, citybuilder: /cities|simcity|anno \d|pharaoh|caesar|banished|frostpunk|tropico|manor lords|against the storm|timberborn|city/, medieval: /kingdom come|knight|chivalry|mordhau|medieval/, vikings: /viking|valhalla|valheim|northgard/
  };
  const pourEnfants = (c) => ((c.hum || {}).defi || 0) < 40 && !(c.tags || []).includes('Soulslike') && (c.sujets || []).some((x) => x === 'enfants' || x === 'famille' || (x === 'mignon' && !(c.tags || []).some((t) => ['Tir', 'Combat'].includes(t))))
    && !c.sombre && !(c.tags || []).includes('Horreur') && !(c.sujets || []).includes('guerre');
  const paisible = (c) => !(c.tags || []).some((t) => ['Action', 'Tir', 'Combat', "Beat'em all", 'RPG', 'Soulslike', 'MOBA', 'Battle royale', 'PvP', 'Horreur'].includes(t)) && !c.sombre && ((c.hum || {}).defouler || 0) < 30;
  // Les jeux proches d'un jeu de référence : suites des joueurs + jeux proches IGDB (si sa fiche est chargée).
  const cacheProches = new Map();
  function prochesDe(base) {
    const f = base.igdb ? FICHES[base.igdb] : null;
    const cleCache = base.id + (f ? '+' : '');
    if (!cacheProches.has(cleCache)) cacheProches.set(cleCache, { suites: new Set(base.suites || []), proches: new Set(voisins(base, f, 40).map((c) => c.id)) });
    return cacheProches.get(cleCache);
  }

  // Les coups de cœur du joueur servent à départager : « proche de X, que tu as adoré ».
  const coeursDuJoueur = () => Object.entries(journal.finis).filter(([, e]) => e.v === 0).map(([id]) => PAR_ID[id]).filter(Boolean).slice(-6);
  // Seulement un vrai lien : la suite que les joueurs ont choisie, ou un jeu jugé similaire par IGDB qui partage
  // vraiment une famille avec lui. Partager « action » et « aventure » ne fait pas de Batman un cousin de The Witcher 3.
  const coeurProche = (c, coeurs) => coeurs.find((g) => g !== c && ((g.suites || []).includes(c.id)
    || (c.igdb && FICHES[g.igdb] && (FICHES[g.igdb].sim || []).includes(c.igdb) && proximite(g, c) >= 1.5)));
  let coeursCites = new Set(); // « Proche de X, que tu as adoré » : une fois par série de propositions, pas sur chaque carte
  const machinesPour = (c, f, n) => (f.p ? [...c.plateformes.filter((x) => plateformeSur(x, f.p)), ...c.plateformes.filter((x) => !plateformeSur(x, f.p))] : c.plateformes).slice(0, n);
  // « Connu » : beaucoup de notes, ou d'une grande série (Metal Gear, Zelda), ou récent et acclamé (Astro Bot).
  const POP_SERIE = (() => { const m = {}; TOUS.forEach((j) => (j.series || []).forEach((i) => { m[i] = Math.max(m[i] || 0, j.populaire || 0); })); return m; })();
  // Le jeu le plus connu de chaque œuvre : « Disco Elysium: The Final Cut » est aussi connu que Disco Elysium.
  let POP_OEUVRE = null;
  const popOeuvre = (c) => {
    if (!POP_OEUVRE) { POP_OEUVRE = new Map(); TOUS.forEach((x) => { const r = racineTitre(x._n); POP_OEUVRE.set(r, Math.max(POP_OEUVRE.get(r) || 0, x.populaire || 0)); }); }
    return POP_OEUVRE.get(racineTitre(c._n)) || 0;
  };
  // L'année du dernier épisode de chaque série (NBA 2K, EA Sports FC, Football Manager).
  const SPORTS = ['foot', 'basket', 'tennis', 'golf', 'baseball', 'footus', 'catch', 'boxe'];
  // L'année du jeu le plus récent de chaque sport (un FIFA de 2016 a dix ans de retard sur le foot d'aujourd'hui).
  const DERNIER_SPORT = (() => { const m = {}; TOUS.forEach((j) => (j.sujets || []).forEach((k) => { if (SPORTS.includes(k) && (j.populaire || 0) >= 5 && j.annee <= ANNEE) m[k] = Math.max(m[k] || 0, j.annee || 0); })); return m; })();
  const DERNIER_EPISODE = (() => { const m = {}; TOUS.forEach((j) => (j.series || []).forEach((i) => { m[i] = Math.max(m[i] || 0, j.annee || 0); })); return m; })();
  // IGDB compte peu de notes pour les jeux PC et indépendants : Factorio (318) ou Tunic (260) sont pourtant très connus.
  const estConnu = (c) => Math.max(c.populaire || 0, popOeuvre(c)) >= (c.inde ? 200 : 300) || (c.series || []).some((i) => (POP_SERIE[i] || 0) >= 600)
    || (c.annee >= ANNEE - 3 && (c.populaire || 0) >= 90 && (c.note || 0) >= 86);
  // Ce qui éloigne un jeu du jeu de référence, en points de « comme X » : une autre époque, un autre genre de fond,
  // une autre façon de jouer. Sert à « comme X » et après un jeu fini (une suite choisie par les joueurs n'est jamais pénalisée).
  function ecartAvec(base, c, idBase = identite(base), idSujetBase = identiteSujet(base), baseTags = (base.tags || []).filter((t) => t !== 'Coop')) {
    let e = 0;
    e += retardEpoque(base, c) * 1.2; // « comme A Plague Tale » : pas un jeu des années 90
    if (idBase && !(c.tags || []).includes(idBase)) e += 9;
    if (base.vueFps === 2 && !c.vueFps && (base.tags || []).includes('Tir')) e += 6; // « comme Doom » : un FPS, pas Dead Space
    if (idSujetBase && !(c.sujets || []).includes(idSujetBase)) e += 10;
    e += Math.min(9, (c.tags || []).filter((t) => GENRES_LOURDS.includes(t) && !baseTags.includes(t)).length * 3);
    if (!baseTags.includes('Action') && (c.tags || []).includes('Action')) e += 5 + ((c.tags || []).some((t) => ['Tir', "Beat'em all", 'Combat', 'Soulslike'].includes(t)) ? 5 : 0); // un jeu calme pour un jeu calme (pas Batman après Firewatch)
    // Une durée sans commune mesure : pas un JRPG de 70 h après une balade de 4 h.
    if (base.histoire && c.histoire && base.histoire <= 15 && c.histoire >= base.histoire * 5) e += 5;
    if (base.histoire && c.histoire && base.histoire >= 40 && c.histoire * 8 <= base.histoire) e += 3;
    const bs = base.sujets || [], cs = c.sujets || [];
    if ((bs.includes('3d') && cs.includes('2d') && !cs.includes('3d')) || (bs.includes('2d') && !bs.includes('3d') && cs.includes('3d') && !cs.includes('2d'))) e += 4; // Momodora n'est pas « comme Elden Ring »
    if (c.gacha && !base.gacha) e += 16; // jamais Wuthering Waves après Elden Ring
    if (cs.includes('ambiance') && !bs.includes('ambiance')) e += 4; // un jeu de soirée pour un jeu de soirée (pas Mario Party après Hearthstone)
    if (base.inde && !c.inde) e += 5; // après Bastion, Transistor ou Hades avant Horizon
    if ((base.tags || []).includes('Vue iso') && !(c.tags || []).includes('Vue iso') && !(base.tags || []).includes('Tir')) e += 4;
    if (base.deduction && !c.deduction) e += 6 + (cs.includes('ambiance') ? 0 : 8); // après Among Us : un jeu de soirée, pas Call of Duty
    if (cs.includes('enfants') && !bs.includes('enfants') && !bs.includes('mignon')) e += 6; // pas Skylanders pour Diablo II
    if (cs.includes('kart') !== bs.includes('kart')) e += 20; // Mario Kart n'est pas « comme Forza Horizon »
    // Même façon de jouer : un jeu compétitif pour un jeu compétitif, un jeu solo pour un jeu solo.
    if (base.jSet.pvp >= 3 && (c.jSet.pvp || 0) < 2) e += 12;
    if ((base.jSet.pvp || 0) < 1 && (c.jSet.pvp || 0) >= 3 && !c.jSet.solo) e += 12; // pas Marvel Rivals « comme A Way Out »
    if (!base.jSet.groupe && !c.jSet.solo) e += 12;
    if (!base.jSet.solo && c.jSet.solo && (c.histoire >= 10 || (c.tags || []).some((t) => ['Aventure', 'RPG', 'Monde ouvert'].includes(t)))) e += 12; // Valorant n'a rien à voir avec GTA V
    if (c.mmo && !base.mmo) e += 6; // pas Black Desert après Kingdom Come
    if (base.jSet.solo && !c.jSet.solo && (c.jSet.pvp || 0) >= 2) e += 8; // pas Rust après Borderlands
    if (base.jSet.solo && !base.jSet.coopForte && !c.jSet.solo) e += 6; // un jeu qu'on peut faire seul pour un jeu qu'on fait seul
    if (!base.jSet.solo && (base.jSet.pvp || 0) >= 3 && c.jSet.solo && (c.jSet.pvp || 0) < 3) e += 8; // Overwatch : Valorant, pas Perfect Dark
    if (baseTags.includes('Aventure') && !baseTags.includes('Tir') && !(c.tags || []).includes('Aventure')) e += 4; // A Way Out : pas Battlefield 3
    const mobileSeul = (j) => j.familles && j.familles.length && j.familles.every((x) => x === 'Mobile' || x === 'Navigateur');
    if (mobileSeul(c) && !mobileSeul(base)) e += 10; // pas Mario Kart Tour ni Aquapark.io après Mario Kart 8
    if (/^roblox$|garry's mod|^vrchat|^rec room|^dreams$|^core$|^fortnite creative/i.test(c._n || '') && !/roblox|garry|vrchat|rec room/i.test(base._n || '')) e += 10; // une plateforme de mini-jeux n'est pas « comme Mario »
    if (!base.jSet.solo && base.jSet.coop && !c.jSet.coop) e += 12; // un jeu à deux pour un jeu à deux
    if ((c.tags || []).includes('Horreur') && !baseTags.includes('Horreur')) e += 6; // pas Stranded Deep après Stardew Valley
    if ((cs.includes('mignon') || cs.includes('enfants')) && !['mignon', 'enfants', 'famille'].some((k) => bs.includes(k))) e += 2;
    if ((cs.includes('mignon') || cs.includes('enfants')) && !bs.includes('mignon') && !bs.includes('enfants') && (base.tags || []).some((t) => ['RPG', 'Horreur', 'Tir', 'Soulslike'].includes(t))) e += 4; // pas Zelda: A Link Between Worlds après Kingdom Come
    return e;
  }

  function filtrer(f, options = {}) {
    const res = [];
    const coeurs = options.sansFinis ? coeursDuJoueur() : [];
    const base = f.c ? PAR_ID[f.c] : null;
    const ref = base ? prochesDe(base) : null;
    const baseTags = base ? (base.tags || []).filter((t) => t !== 'Coop') : [];
    const baseHum = base ? topHum(base, 3) : [];
    // Un jeu peu décrit (Wind Waker : action, aventure) garde des résultats : le seuil ne dépasse jamais 60 % de sa propre proximité.
    const seuilBase = base ? Math.min(Math.max(1.5, Math.min(3.5, proximite(base, base) * 0.45)), proximite(base, base) * 0.6) : 0;
    const idBase = base ? identite(base) : null;
    const idSujetBase = base ? identiteSujet(base) : null;
    const sportVoulu = (f.sujet || '').split(',').find((k) => SPORTS.includes(k));
    for (const c of TOUS) {
      if (c === base || c.doublon || c.ferme || (c.fan && !(base && base.fan))) continue;
      if (options.sansFinis && journal.finis[c.id]) continue;
      if (options.sansFinis && !f.vr && vrSeulement(c)) continue; // seulement dans « Ce qui me tente »
      if (options.sansFinis && c.jSet.mort && !c.jSet.solo) continue; // jeu uniquement en ligne dont les serveurs sont fermés : injouable
      if (f.g && !(c.tags || []).includes(f.g)) continue;
      if (f.x && (c.tags || []).includes(f.x)) continue;
      // Facile à prendre en main : pas de jeu dur, de stratégie, de MOBA, ni de gros RPG à systèmes (Baldur's Gate 3).
      if (f.facile && (((c.hum || {}).defi || 0) >= 45 || (c.tags || []).some((t) => ['Stratégie', 'Soulslike', 'MOBA'].includes(t) && t !== f.g) || ((c.tags || []).includes('RPG') && c.histoire >= 40))) continue;
      if (f.ecran && !c.jSet.canape) continue;
      if (f.coop && !c.jSet.coop) continue;
      if (f.sansPvp && c.jSet.pvp) continue;
      if (f.gratuit && !c.gratuit) continue;
      if (f.sujet && !f.sujet.split(',').every((k) => (c.sujets || []).includes(k) || (k === 'retro' && c.annee && c.annee <= 2000))) continue;
      if (f.vue && !c.vueFps) continue;
      if ((f.enLigne || f.j === 'pvp') && !enLignePossible(c)) continue;
      if (f.enfants && !pourEnfants(c)) continue;
      if (f.paisible && !paisible(c)) continue;
      if (f.recent && !(c.annee >= ANNEE - 1 && c.annee <= ANNEE)) continue;
      if (f.annee && c.annee !== Number(f.annee)) continue;
      if (f.depuis && !(c.annee >= Number(f.depuis))) continue;
      if (f.inde && !c.inde) continue;
      // « Parmi les mieux notés » : une vraie note (assez de votes), 80 ou plus.
      if (f.meilleurs && !((c.verdicts && c.verdicts[0] >= 80) || ((c.nbNotes || 0) >= 40 && (noteFiable(c) || 0) >= 80))) continue;
      // « Moins connu » : peu de notes sur IGDB, mais de bonnes notes ; « un gros jeu » : très connu, pas indé.
      if (f.connu === 'peu' && (estConnu(c) || c.gacha || (c.populaire || 0) < 50 || (c.note && c.note < 75))) continue;
      if (f.connu === 'gros' && (c.inde || !((c.populaire || 0) >= 250 || (c.annee >= ANNEE - 2 && (c.populaire || 0) >= 60)))) continue;
      if (f.an && !(c.annee >= Number(f.an) && c.annee <= Number(f.an) + 9)) continue;
      if (f.ancien && !(c.annee && c.annee <= 2005)) continue;
      const dansListe = journal.envies.includes(c.id);
      if (f.liste && !dansListe) continue;
      if (f.steam && !c.possede) continue;
      if (f.gp && !c.gamepass) continue;
      if (f.d === 'sessions' && !parSessions(c)) continue;
      // Durée demandée : un jeu dont on ne connaît pas la durée n'est pas écarté, il passe en fin de liste (sauf dans Explorer).
      let inconnu = false;
      const bonneDuree = f.d === 'long' ? c.histoire >= 40 || c.aCotes >= 70 || sansFinEnLigne(c) : f.d && f.d !== 'sessions' ? c.histoire && c.histoire <= Number(f.d) : true;
      if (!bonneDuree) {
        if (c.histoire || c.sansFin || options.dureeStricte) continue;
        inconnu = true;
      }
      let lien = 0;
      if (base) {
        // « Comme X » : la ressemblance compte plus que la popularité. Être une suite choisie par les joueurs ou un
        // voisin reconnu ajoute un bonus, sans remplacer la ressemblance (Dota 2 passe devant un MOBA inconnu).
        // Partager ce qui définit le jeu (des énigmes pour The Witness, une usine pour Factorio) compte double.
        const p = proximite(base, c) + (idBase && (c.tags || []).includes(idBase) ? RARETE[idBase] || 0 : 0) + (idSujetBase && (c.sujets || []).includes(idSujetBase) ? 3 : 0);
        const suite = ref.suites.has(c.id), voisin = ref.proches.has(c.id);
        // Les « jeux similaires » d'IGDB : souvent ce qu'un connaisseur attend (Factorio → Satisfactory).
        const similaire = !!(base.igdb && c.igdb && FICHES[base.igdb] && (FICHES[base.igdb].sim || []).includes(c.igdb));
        if (!suite && !voisin && !(similaire && p >= 1) && p < seuilBase) continue;
        // Un voisin ou un « similaire » qui n'a pas ce qui définit le jeu (Red Dead Redemption 2 pour The Witcher 3) perd son bonus.
        const identiteOk = (!idBase || (c.tags || []).includes(idBase)) && (!idSujetBase || (c.sujets || []).includes(idSujetBase));
        lien = p * 2.5 + (suite ? 16 : voisin ? (identiteOk ? 8 : 2) : 0) + (similaire ? (identiteOk ? 10 : 2) : 0) + baseHum.reduce((acc, h) => acc + Math.min((c.hum || {})[h] || 0, (base.hum || {})[h] || 0) / 15, 0);
        if (!suite) lien -= ecartAvec(base, c, idBase, idSujetBase, baseTags);
        else lien -= retardEpoque(base, c) * 1.2; // « comme Tomb Raider (2013) » : pas l'épisode de 1996
      }
      if (f.j === 'solo' && !c.jSet.solo) continue;
      if (f.j === 'deux' && !c.jSet.deux) continue;
      if (f.j === 'groupe' && (!c.jSet.groupe || c.jSet.mort)) continue;
      if (f.j === 'pvp' && !(c.jSet.pvp >= 2)) continue;
      if (f.p && !surMachine(c, f.p)) continue;
      // La note fiable (rapprochée de 70 quand il y a peu de votes) : un jeu noté 92 par 30 personnes ne passe pas devant.
      let s = Math.log10((c.populaire || 0) + 1) * (base ? 5.5 : 4) + (c.note ? noteFiable(c) / 6 : c.verdicts ? c.verdicts[0] / 4 : 55 / 6) + lien + (dansListe ? 8 : 0) + (coeurs.length && coeurProche(c, coeurs) ? 5 : 0)
        + (f.steam ? (c.possede.minutes < 120 ? 6 : c.possede.minutes > 1200 ? -6 : 0) : 0)
        - (base && !(ref && ref.suites.has(c.id)) && (c.populaire || 0) < 20 ? (20 - (c.populaire || 0)) / 2 : 0); // « comme Minecraft » : pas d'abord un jeu que presque personne n'a noté
      // Ce qui rend un jeu plus pertinent pour cette envie précise.
      const js = c.jSet;
      const sujetsC = c.sujets || [];
      // Contre d'autres : le cœur du jeu (LoL, Valorant) passe devant un mode en ligne en bonus, sauf pour les jeux de combat,
      // de sport et de course, où tout le monde se bat contre tout le monde.
      if (f.g === 'RPG' && c.rpgDouteux) s -= 12; // un vrai RPG avant Tropico 5
      if (f.connu === 'peu') s += (((c.populaire || 0) * (c.note || 70) + 30 * 70) / ((c.populaire || 0) + 30)) / 3 - Math.log10((c.populaire || 0) + 1) * 4;
      if (c.fourreTout) s -= 8; // un petit jeu qui coche tous les genres d'IGDB (Lurkers) : rarement ce qu'on cherche // la qualité avant la notoriété, sans croire 3 notes à 95/100
      if (f.meilleurs) s += noteFiable(c) / 3;
      if (f.g === 'Combat' && sujetsC.includes('ambiance')) s -= 6; // Gang Beasts est un jeu de fête, pas un jeu de combat pour apprendre
      if ((f.g === 'Combat' || (base && (base.tags || []).includes('Combat'))) && (c.tags || []).includes('Plateforme') && !(base && (base.tags || []).includes('Plateforme'))) s -= 8;
      if (f.g === 'Plateforme' && (c.tags || []).some((x) => ['Tir', 'Monde ouvert', 'RPG', "Beat'em all"].includes(x))) s -= 6; // Mario avant Uncharted // « jeu de combat » : Street Fighter avant Smash
      if (f.g === 'Horreur') s -= ((c.tags || []).includes('RPG') ? 6 : 0) + (sujetsC.includes('guerre') ? 6 : 0) + ((c.tags || []).some((x) => ['Course', 'Sport', 'Combat'].includes(x)) ? 8 : 0); // pas Diablo II ni Call of Duty: World at War
      if (f.g === 'Horreur' && (c.tags || []).includes('Tir') && (c.tags || []).some((x) => ['Monde ouvert', 'RPG'].includes(x))) s -= 4; // Resident Evil avant BioShock
      if (f.g === 'Horreur') s += (sujetsC.includes('survivalhorror') || sujetsC.includes('horreurpsy') ? 8 : 0) - ((c.tags || []).includes('Tir') && !sujetsC.includes('survivalhorror') ? 4 : 0);
      if (f.g === 'Stratégie' && (c.tags || []).includes('Tir')) s -= 10; // IGDB met Overwatch dans la stratégie
      // « Un jeu de gestion » : Stardew Valley ou RimWorld avant Civilization, XCOM ou Terraria.
      if (f.g === 'Gestion') s += (['citybuilder', 'colonie', 'automatisation', 'ferme'].some((k) => sujetsC.includes(k)) ? 4 : 0) - (sujetsC.includes('tourpartour') ? 8 : 0)
        - ((c.tags || []).some((x) => ['Aventure', 'Tir', 'Monde ouvert', "Beat'em all", 'Roguelite', 'Énigmes', 'Plateforme', 'Vue FPS'].includes(x)) ? 5 : 0);
      // « Un jeu d'énigmes » : Portal ou The Witness avant Zelda.
      if (f.g === 'Énigmes') s -= ((c.tags || []).some((x) => ['Monde ouvert', 'RPG', "Beat'em all", 'Tir', 'Horreur', 'Metroidvania', 'Soulslike'].includes(x)) ? 6 : 0) + ((c.tags || []).includes('Action') ? 4 : 0);
      if (f.g === 'Stratégie' && (c.tags || []).some((x) => ['MOBA', 'Cartes'].includes(x))) s -= 10; // pas Dota 2 ni Hearthstone
      if (f.g === 'Stratégie' && !['rts', '4x', 'tourpartour', 'tactique', 'citybuilder'].some((k) => sujetsC.includes(k))) s -= 10; // pas TagPro, Chivalry 2 ni GeoGuessr
      // « Un jeu narratif » : Life is Strange ou Firewatch avant les jeux d'action à grand spectacle.
      if (f.g === 'Narratif') s += (sujetsC.includes('recit') ? 4 : 0) + ((c.tags || []).includes('Aventure') ? 2 : 0) - ((c.tags || []).some((x) => ['Tir', "Beat'em all", 'Monde ouvert'].includes(x)) ? 5 : 0) - ((c.tags || []).includes('RPG') ? 4 : 0) - ((c.tags || []).includes('Horreur') ? 4 : 0);
      if (f.g === 'Plateforme' && c.vueFps) s -= 6; // un plateformer 3D, c'est Mario, pas Portal
      if (f.g === 'Cartes' && (sujetsC.includes('jrpg') || (c.tags || []).includes('Monde ouvert'))) s -= 8; // pas Final Fantasy VIII pour son jeu de cartes
      if ((f.sujet || '').split(',').includes('tactique') && (c.tags || []).some((x) => ['Battle royale', 'Monde ouvert'].includes(x))) s -= 6; // ni Apex ni Far Cry
      if ((f.sujet || '').split(',').includes('simu') && sujetsC.includes('kart')) s -= 10;
      // Le foot ou le basket de cette année : NBA 2K26 avant NBA 2K17.
      const annuel = /\b(?:19|20)\d{2}\b|\b2k\d{1,2}\b|\b(?:fifa|fc|pes|madden(?: nfl)?|nhl|mlb(?: the show)?|nba live|f1|wrc|ufc|wwe(?: 2k)?|pga tour|tennis world tour) \d{1,2}\b/i.test(c.titre);
      if (f.g === 'Sport' && !sportVoulu && annuel && c.annee && !f.ancien && !f.an && !f.annee) s -= Math.min(20, Math.max(0, ...(c.series || []).map((i) => (DERNIER_EPISODE[i] || 0) - c.annee)) * 3); // FIFA 26, pas FIFA 17
      if (f.g === 'Sport') s -= (sujetsC.includes('peche') && !(f.sujet || '').includes('peche') ? 6 : 0) + (sujetsC.includes('simu') && !(f.sujet || '').includes('simu') ? 4 : 0);
      if (sportVoulu && c.annee && !f.ancien && !f.an && !f.annee) {
        const retard = Math.max(0, ...(c.series || []).map((i) => (DERNIER_EPISODE[i] || 0) - c.annee), (DERNIER_SPORT[sportVoulu] || 0) - c.annee - 1);
        if (retard >= 8) continue; // le foot d'aujourd'hui, pas FIFA 14 (sauf « un vieux jeu de foot »)
        s -= Math.min(30, retard * 3);
      }
      if (f.d === 'sessions' && sessionsVraies(c)) s += 8; // « une partie de 30 minutes » : Balatro avant une campagne de 4 h
      // Contre d'autres : un jeu sans solo et peu connu a souvent fermé ses serveurs (Atlas Reactor, Total War: Arena) ;
      // en stratégie, StarCraft II et sa campagne restent des jeux compétitifs.
      if (f.j === 'pvp') s += ['Combat', 'Sport', 'Course'].includes(f.g) ? (js.pvp >= 2 ? 6 : 0) : f.g === 'Stratégie' ? (js.pvp >= 2 ? 10 : 0) : js.pvp >= 3 ? ((c.populaire || 0) >= 100 ? 16 : 6) : js.pvp === 2 ? 6 : 0;
      // Seulement sur téléphone : pas pour qui cherche un jeu sur PC ou console (Boom Beach).
      if (!(f.p && /mobile|ios|android/i.test(f.p)) && c.familles && c.familles.length && c.familles.every((x) => x === 'Mobile')) s -= 6;
      const fete = (f.sujet || '').split(',').some((k) => k === 'comedie' || k === 'ambiance');
      if (f.j === 'groupe') s += (js.coopForte ? 6 : js.coop ? 2 : 0) + (fete && sujetsC.includes('ambiance') ? 6 : 0) + (f.enLigne && js.enLigne ? 3 : 0) + (!js.solo ? 2 : 0) + (!f.coop && js.pvp >= 2 ? 2 : 0) + (js.mmo ? 2 : 0);
      if (f.j === 'deux') s += (js.coopForte ? 6 : 0) + (js.canape ? 3 : 0) + (c.deuxSeulement ? 6 : 0);
      if (f.ecran) s += (js.localForte ? 4 : 0) + (sujetsC.includes('ambiance') ? 4 : 0);
      // À trois ou quatre sur le canapé : les jeux de fête, de course, de sport, de combat, de plateforme ; pas un RPG à deux.
      if (f.ecran && f.j === 'groupe') s += (sujetsC.includes('ambiance') || (c.tags || []).some((t) => ['Course', 'Sport', 'Combat', 'Plateforme'].includes(t)) ? 6 : 0) - ((c.tags || []).includes('RPG') ? 6 : 0);
      if (f.j === 'groupe' || f.j === 'deux' || f.ecran) s += Math.max(0, (c.annee || 0) - 2005) * 0.3; // jouer ensemble, plutôt sur une console d'aujourd'hui
      if (f.enLigne || f.j === 'pvp') s -= Math.max(0, 2012 - (c.annee || 2012)) * 0.8; // un jeu en ligne de 2005 n'a plus grand monde
      if (f.coop) s += (js.coopForte ? 8 : 0) - (js.pvp >= 3 ? 8 : 0);
      if (f.vue) s += c.vueFps === 2 ? 6 : 0; // un « vrai » FPS plutôt que GTA V et sa vue à la première personne en option
      if (f.sujet && f.sujet.split(',').some((k) => ['foot', 'basket', 'tennis', 'golf', 'baseball', 'footus', 'catch', 'boxe'].includes(k))) s += Math.max(0, (c.annee || 0) - 2010) * 0.8; // le foot de cette année, pas FIFA 14
      if (f.facile) s -= ((c.hum || {}).defi || 0) / 4; // « un souls pas trop dur » : Tunic, pas Bloodborne
      if ((f.sujet || '').split(',').includes('cuisine') && ((c.tags || []).includes('Tir') || sujetsC.includes('survie'))) s -= 8; // Overcooked, pas Rust
      if (f.facile) s += ((c.sujets || []).some((x) => ['famille', 'mignon', 'enfants'].includes(x)) ? 5 : 0) + (((c.hum || {}).detente || 0) >= 20 ? 3 : 0);
      // Un sujet seulement effleuré (Elden Ring a « plusieurs fins », Donkey Kong 2 un chat quelque part) passe après les jeux qui en parlent vraiment.
      if (f.sujet) f.sujet.split(',').forEach((k) => { const fort = (c.sujetsForts || []).includes(k), titre = !!(TITRE_SUJET[k] && TITRE_SUJET[k].test(c._n)); s += (fort ? 10 : 0) + (titre ? 8 : 0) - (fort || titre ? 0 : 5); });
      if (f.h) {
        const v = (c.hum || {})[f.h] || 0;
        const tranquilleQuandMeme = f.h === 'detente' && c.rythme === 'pose' && v >= 8;
        if (v < 15 && !tranquilleQuandMeme) continue;
        s += v / (c.humEstime && !c.humRedac ? 4 : 2); // nos estimations rédigées valent mieux qu'une estimation au genre
      }
      res.push([s - (inconnu ? 1000 : 0), c, inconnu]);
    }
    res.sort((a, b) => b[0] - a[0]);
    return Object.assign(res.map((x) => x[1]), { inconnus: new Set(res.filter((x) => x[2]).map((x) => x[1].id)) });
  }

  function ligneJeu(c, f, inconnu) {
    const infos = [c.genre, c.histoire ? '~' + c.histoire + ' h' : inconnu ? 'Durée inconnue' : f.d === 'long' && sansFinEnLigne(c) ? 'Sans fin' : '', c.gratuit ? 'Gratuit' : ''];
    if (f.h && (c.hum || {})[f.h]) infos.push(c.humEstime ? cap(HUM[f.h]) + ' (estimé)' : cap(HUM[f.h]) + ' : ' + c.hum[f.h] + ' %');
    if (f.p) infos.push(c.plateformes.filter((x) => plateformeSur(x, f.p)).slice(0, 3).join(', '));
    // L'année et les machines pour tout le monde (c'est ce qui décide), puis le pitch quand on en a un.
    const meta = c.annee ? `${c.annee}${c.plateformes.length ? ' · ' + machinesPour(c, f, 5).join(', ') : ''}` : '';
    const score = c.verdicts ? `<b>${c.verdicts[0]} %</b>coups de cœur` : c.note ? `<b>${c.note}</b>sur 100` : '';
    return `<a class="ligne-jeu" href="#/jeu/${c.id}" data-jeu="${c.id}"><img data-vt src="${jaquette(c)}" alt="" loading="lazy" data-titre="${esc(c.titre)}">
      <span><span class="l-t">${esc(c.titre)}</span>${meta ? `<p class="l-p">${esc(meta)}</p>` : ''}${c.pitch ? `<p class="l-d">${esc(c.pitch)}</p>` : ''}<span class="l-i">${infos.filter(Boolean).map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</span></span>
      <span class="l-c">${score}</span></a>`;
  }

  function presque(f) {
    const pistes = Object.keys(f).map((k) => {
      const sans = { ...f };
      delete sans[k];
      return { k, n: filtrer(sans, { sansFinis: true }).length };
    }).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
    if (!pistes.length) return 'Change un des mots soulignés.';
    const libelle = (k) => (OPTIONS[k] ? `Sans « ${OPTIONS[k].find((o) => o[0] === f[k])[1]} »` : {
      c: 'Sans le jeu de référence', x: "Sans l'exclusion", facile: "Même si ça demande un peu d'effort", ecran: 'Même en ligne', vr: 'Sans la réalité virtuelle', liste: 'Hors de ma liste',
      steam: 'Hors de ma bibliothèque Steam', gp: 'Hors du Game Pass', coop: 'Même sans coop', sansPvp: "Même s'il faut affronter d'autres joueurs", gratuit: 'Même payant',
      sujet: `Sans « ${(f.sujet || '').split(',').map((x) => (NOM_SUJET[x] || '').toLowerCase()).join(', ')} »`, enfants: 'Pas seulement pour les enfants', paisible: 'Même avec des combats',
      recent: 'Même plus ancien', annee: 'Toutes les années', depuis: 'Toutes les années', inde: 'Pas seulement les indés', connu: 'Connus ou pas', meilleurs: 'Pas seulement les mieux notés', an: 'Toutes les époques', ancien: 'Toutes les époques', vue: 'Pas forcément à la première personne', enLigne: 'Même sans jeu en ligne'
    }[k]);
    return 'En lâchant un critère, tu aurais :<div class="presque">' + pistes.map((x) => `<button type="button" data-lacher="${x.k}">${esc(libelle(x.k))}<span>${nb(x.n)} ${pl(x.n, 'jeu', 'jeux')}</span></button>`).join('') + '</div>';
  }

  // Pourquoi ce jeu colle à l'envie : deux ou trois raisons concrètes, pas un pourcentage magique.
  function raisonsEnvie(c, f, role) {
    const r = [];
    const base = f.c ? PAR_ID[f.c] : null;
    if (base) {
      const ref = prochesDe(base);
      const commun = (c.tags || []).filter((t) => (base.tags || []).includes(t) && t !== 'Coop').sort((x, y) => (RARETE[y] || 0) - (RARETE[x] || 0))[0];
      const tb = titreCourt(base);
      if (ref.suites.has(c.id)) r.push(`La suite qu'on conseille après ${tb}.`);
      else if (ref.proches.has(c.id)) r.push(`Dans la même veine que ${tb}.`);
      else if (commun) r.push(`De la même famille que ${tb} : ${LIBELLE_TYPE[commun] || commun}.`);
    }
    if (f.h && ((c.hum || {})[f.h] || 0) >= 30 && !c.humEstime) r.push(`Pour ${c.hum[f.h]} % des joueurs, c'est un jeu pour ${HUM[f.h]}.`);
    else if (f.h && ((c.hum || {})[f.h] || 0) >= 25 && c.humRedac) r.push(cap(`un jeu pour ${HUM[f.h]}.`));
    if (c.gratuit) r.push('Gratuit (free-to-play).');
    if (f.d === 'sessions') r.push(c.jSet.pvp >= 3 ? 'Ça se joue partie par partie.' : c.histoire > 0 && c.histoire <= 6 && !c.sessions ? `Court : ~${c.histoire} h en tout.` : 'Des parties courtes : tu lâches quand tu veux.');
    else if (c.histoire) r.push(f.d === '5' ? `~${c.histoire} h : une soirée ou deux.` : f.d === 'long' && c.aCotes >= 70 && c.histoire < 40 ? `~${c.histoire} h pour l'histoire, ~${c.aCotes} h avec les quêtes annexes.` : `~${c.histoire} h pour l'histoire.`);
    else if (f.d === 'long' && sansFinEnLigne(c)) r.push("Sans fin : on peut y passer des centaines d'heures.");
    if (role === 'hasard') r.push(c.verdicts ? `${c.verdicts[0]} % de coups de cœur.` : c.note ? `${c.note}/100 sur IGDB.` : '');
    if (role === 'sure') r.push(c.verdicts ? `${c.verdicts[0]} % de coups de cœur.` : c.note ? `${c.note}/100 sur IGDB, ${nb(c.nbNotes)} notes.` : '');
    if (f.ecran) r.push(f.j === 'groupe' ? 'Se joue à plusieurs sur le même écran.' : 'Se joue à deux sur le même écran.');
    if (c.possede) r.unshift(c.possede.minutes === 0 ? 'Déjà dans ta bibliothèque Steam, pas encore lancé.' : c.possede.minutes < 120 ? 'Dans ta bibliothèque Steam, à peine commencé.' : `Dans ta bibliothèque Steam (${Math.round(c.possede.minutes / 60)} h de jeu).`);
    else if (journal.envies.includes(c.id)) r.unshift('Dans ta liste « Je veux y jouer ».');
    if (f.gp && c.gamepass) r.splice(c.possede || journal.envies.includes(c.id) ? 1 : 0, 0, `Dans le Game Pass ${texteGamePass(c.gamepass)}.`);
    else if (!base) { const g = coeurProche(c, coeursDuJoueur()); if (g && !coeursCites.has(g.id)) { coeursCites.add(g.id); r.unshift(`Proche de ${titreCourt(g)}, que tu as adoré.`); } }
    if (role === 'pepite') r.push(c.nbNotes ? `Seulement ${nb(c.nbNotes)} notes sur IGDB, mais ${c.note}/100.` : 'Moins connu, et pourtant très aimé.');
    if (f.p) {
      const l = c.plateformes.filter((x) => plateformeSur(x, f.p)).slice(0, 3);
      const compatible = { Switch2: ['Switch 2', 'Switch 2'], PS5: ['PS5', 'PS5'], XboxSeries: ['Xbox Series', 'Xbox Series'] }[f.p];
      if (l.length) r.push('Sur ' + l.join(', ') + (compatible && !l.includes(compatible[0]) ? ` (marche sur ${compatible[1]})` : '') + '.');
    }
    // Une seule raison, c'est maigre : on dit au moins si le jeu est aimé.
    if (r.filter(Boolean).length < 2 && role !== 'sure' && role !== 'hasard' && role !== 'pepite' && noteFiable(c) >= 75) r.push(c.verdicts ? `${c.verdicts[0]} % de coups de cœur.` : `${c.note}/100 sur IGDB, ${nb(c.nbNotes)} notes.`);
    // Jamais une carte sans raison : au moins ce que c'est, et sa note.
    if (!r.filter(Boolean).length) r.push(cap(c.genre || 'jeu vidéo') + (c.note ? ` : ${c.note}/100 sur IGDB.` : '.'));
    return r.filter(Boolean).slice(0, 3);
  }
  // La même œuvre sous plusieurs versions : « The Last of Us », « The Last of Us Remastered », « … Definitive Edition ».
  // Aussi « Divinity: Original Sin II - Definitive Edition », « OneShot: World Machine Edition », « Disco Elysium: The Final Cut ».
  // Une version (« Remastered », « Definitive Edition », « Director's Cut ») va avec le jeu d'origine sorti avant elle ;
  // deux jeux du même nom mais d'années différentes (God of War 2005 et 2018, Doom 1993 et 2016) restent deux jeux.
  const SUFFIXE_VERSION = /\s+(?:game of the year|goty|director's cut|complete|definitive|enhanced|deluxe|gold|remastered|remaster|anniversary|special|hd|redux|reloaded|royal|golden|fes|warmastered|ultimate edition|(?:the )?final cut|world machine|part i)(?: edition)?(?: director's cut)?\s*$/;
  const racineTitre = (n) => n.replace(SUFFIXE_VERSION, '').replace(SUFFIXE_VERSION, '').trim();
  let ANNEES_ORIGINES = null;
  const oeuvre = (c) => {
    if (!ANNEES_ORIGINES) {
      ANNEES_ORIGINES = new Map();
      TOUS.forEach((x) => { if (racineTitre(x._n) === x._n && x.annee) { const l = ANNEES_ORIGINES.get(x._n) || []; l.push(x.annee); ANNEES_ORIGINES.set(x._n, l); } });
      ANNEES_ORIGINES.forEach((l) => l.sort((a, b) => a - b));
    }
    let r = racineTitre(c._n);
    // « Portal: Still Alive », « Dark Souls II: Scholar of the First Sin » : le jeu avant les deux-points existe et sort
    // la même année ou juste avant : c'est une version de ce jeu (mais « God of War: Ghost of Sparta » reste un autre jeu).
    const avant = String(c.titre || '').split(/\s*[:–]\s+|\s+-\s+/)[0];
    if (avant && avant.length < String(c.titre || '').length) {
      const ra = racineTitre(pourRecherche(avant.toLowerCase()));
      const anneesAvant = ANNEES_ORIGINES.get(ra) || [];
      if (ra !== r && anneesAvant.some((y) => c.annee && y <= c.annee && c.annee - y <= 2)) r = ra;
    }
    const annees = ANNEES_ORIGINES.get(r) || [];
    const a = r === c._n ? c.annee : !ANNEES_ORIGINES.has(r) ? c.annee : [...annees].reverse().find((y) => y <= (c.annee || 9999)) || 'v' + c.annee; // pas d'original avant lui : on ne devine pas
    return r + '|' + (a || '');
  };
  // Une seule version de chaque jeu dans une liste, et pas une autre version d'un jeu déjà fini ni du jeu de référence.
  const uneVersion = (liste, base) => {
    const vues = new Set([...Object.keys(journal.finis).map((id) => PAR_ID[id]).filter(Boolean).map(oeuvre), ...(base ? [oeuvre(base)] : [])]);
    // Et pas deux fois le même titre à quelques années d'écart (OneShot 2014 et OneShot 2016).
    const annees = new Map();
    return liste.filter((c) => {
      const o = oeuvre(c), r = racineTitre(c._n);
      if (vues.has(o) || (annees.get(r) || []).some((y) => Math.abs(y - (c.annee || 0)) <= 4)) return false;
      vues.add(o); annees.set(r, [...(annees.get(r) || []), c.annee || 0]);
      return true;
    });
  };
  function troisPropositions(res, ecartes, inconnus = new Set(), avecReference = false, sujetsVoulus = [], base = null) {
    const libres = res.filter((c) => !ecartes.has(c.id) && !inconnus.has(c.id));
    const pris = new Set();
    // Pas The Last of Us ET The Last of Us Remastered (ni les deux Resident Evil 4) dans les trois propositions,
    // et pas trois jeux de la série du jeu de référence (« comme Resident Evil 4 » : un seul autre Resident Evil).
    const oeuvres = new Set();
    let memeSerie = 0;
    const deLaSerie = (c) => !!(base && (base.series || []).some((i) => (c.series || []).includes(i)));
    // Trois séries différentes quand c'est possible (pas God of War II et III ensemble).
    const series = new Set();
    let varie = true;
    const dejaPris = (c) => oeuvres.has(racineTitre(c._n)) || (memeSerie >= 1 && deLaSerie(c)) || (varie && (c.series || []).some((i) => series.has(i)));
    const prendre = (c) => { if (c) { pris.add(c.id); oeuvres.add(racineTitre(c._n)); (c.series || []).forEach((i) => series.add(i)); if (deLaSerie(c)) memeSerie += 1; } return c; };
    // Une autre série seulement si elle est dans les 8 premiers : pas « Olympic Games Tokyo 2020 » pour varier après NBA 2K27.
    const premier = (l) => { const r = l.slice(0, 8).find((c) => !pris.has(c.id) && !dejaPris(c)); if (r) return r; varie = false; const r2 = l.find((c) => !pris.has(c.id) && !dejaPris(c)); varie = true; return r2; };
    const sport = sujetsVoulus.some((k) => SPORTS.includes(k));
    const proche = prendre(premier(libres));
    const note = (c) => (c.verdicts ? c.verdicts[0] : c.note || 0);
    // La valeur sûre : parmi les 5 jeux les plus pertinents, le mieux noté par beaucoup de monde.
    const sure = prendre(libres.slice(0, 5).filter((c) => !pris.has(c.id) && !dejaPris(c) && (c.verdicts || (c.nbNotes || 0) >= 150)).sort((a, b) => (sport ? (b.annee || 0) - (a.annee || 0) : 0) || noteFiable(b) - noteFiable(a))[0] || premier(libres));
    // La pépite : un jeu peu connu (20 à 200 notes) mais très bien noté, pris parmi TOUS les jeux qui collent,
    // pas seulement les premiers (qui sont presque toujours des jeux connus).
    const idB = base ? identite(base) : null;
    const vraiePepite = libres.slice(0, avecReference ? 15 : 150).filter((c) => !pris.has(c.id) && !dejaPris(c) && (!idB || (c.tags || []).includes(idB)) && (!sujetsVoulus.length || sujetsVoulus.every((k) => (c.sujetsForts || []).includes(k) || (TITRE_SUJET[k] && TITRE_SUJET[k].test(c._n)))) && c.annee && c.annee < ANNEE && (!avecReference || !base || !base.annee || Math.abs(c.annee - base.annee) <= 12) && (CAT ? (c.nbNotes || 0) >= 40 && (c.nbNotes || 0) < 200 && (c.note || 0) >= 82 : (c.nbAvis || 0) < 2000)).sort((a, b) => noteFiable(b) - noteFiable(a))[0];
    const pepite = prendre(vraiePepite || premier(libres));
    return [['proche', 'Le plus proche', proche], ['sure', 'La valeur sûre', sure], vraiePepite ? ['pepite', 'La pépite', pepite] : ['autre', 'Une autre idée', pepite]].filter((x) => x[2]);
  }
  function carteProposition([role, titre, c], f) {
    const veut = journal.envies.includes(c.id);
    return `<article class="choix-carte">
      <h3>${titre}</h3>
      <a class="choix-jeu" href="#/jeu/${c.id}" data-jeu="${c.id}"><span class="img"><img data-vt src="${jaquette(c)}" alt="" loading="lazy" data-titre="${esc(c.titre)}"></span>
        <span><span class="c-t">${esc(c.titre)}</span><span class="c-m">${esc([c.annee, machinesPour(c, f, 4).join(', ')].filter(Boolean).join(' · '))}</span></span></a>
      <ul class="choix-raisons">${raisonsEnvie(c, f, role).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <div class="choix-actions"><button class="btn" type="button" data-envie="${c.id}" aria-pressed="${veut}">${veut ? 'Dans ma liste' : 'Je veux y jouer'}</button><button class="btn discret" type="button" data-joue="${c.id}">Déjà joué</button><button class="btn discret" type="button" data-pas="${c.id}">Pas celui-là</button></div>
    </article>`;
  }

  const PAR_PAGE = 40;
  function envie(_, params) {
    const f = {};
    Object.keys(OPTIONS).forEach((k) => { const v = params.get(k); if (v && OPTIONS[k].some((o) => o[0] === v)) f[k] = v; });
    let extras = {};
    if (params.get('c') && PAR_ID[params.get('c')]) extras.c = params.get('c');
    if (params.get('x') && TYPES.some(([k]) => k === params.get('x'))) extras.x = params.get('x');
    if (params.get('facile')) extras.facile = '1';
    if (params.get('ecran')) extras.ecran = '1';
    if (params.get('vr')) extras.vr = '1';
    if (params.get('liste')) extras.liste = '1';
    if (params.get('steam') && BIB) extras.steam = '1';
    if (params.get('gp') && ABO) extras.gp = '1';
    ['coop', 'sansPvp', 'gratuit', 'enfants', 'paisible', 'recent', 'ancien', 'enLigne', 'inde', 'meilleurs'].forEach((k) => { if (params.get(k)) extras[k] = '1'; });
    if (['peu', 'gros'].includes(params.get('connu'))) extras.connu = params.get('connu');
    ['annee', 'depuis'].forEach((k) => { if (/^(?:19|20)\d\d$/.test(params.get(k) || '')) extras[k] = params.get(k); });
    if (params.get('vue') === 'fps') extras.vue = 'fps';
    if (params.get('sujet') && params.get('sujet').split(',').every((k) => NOM_SUJET[k])) extras.sujet = params.get('sujet');
    if (params.get('an') && DECENNIES[params.get('an')]) extras.an = params.get('an');
    let tirage = 0;
    let inconnus = new Set();
    const ecartes = new Set();
    // Trier la liste (les trois propositions, elles, restent les plus pertinentes).
    const TRIS = [['', 'Pertinence'], ['note', 'Les mieux notés'], ['court', 'Les plus courts'], ['recent', 'Les plus récents'], ['populaire', 'Les plus populaires']];
    let tri = TRIS.some(([v]) => v && v === params.get('tri')) ? params.get('tri') : '';
    // Les filtres qu'on ajoute en un geste, sous les propositions.
    const AFFINER = [['gratuit', 'Gratuits'], ['coop', 'En coop'], ['sansPvp', "Sans affronter d'autres joueurs"], ['meilleurs', 'Parmi les mieux notés'], ['connu', 'Moins connus'],
      ['depuis', 'Sortis ces 5 dernières années'], ['d', 'En moins de 15 heures'], ['paisible', 'Sans combat'], ['inde', 'Indés']];
    const affinerActif = (k, filtres) => (k === 'd' ? !!filtres.d : !!filtres[k]);
    const trou = (k, ponct) => `<span class="trou"><label class="sr" for="f-${k}">${NOMS_FILTRES[k]}</label><select id="f-${k}" data-f="${k}">${OPTIONS[k].map(([v, t]) => `<option value="${esc(v)}" ${(f[k] || '') === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>${ponct || ''}</span>`;
    main.innerHTML = `
      <div class="wrap envie">
        <h1 class="sr">Ce qui me tente</h1>
        <div class="envie-libre">
          <label for="libre">Écris ton envie</label>
          <div class="champ"><input id="libre" type="text" autocomplete="off" placeholder="un RPG tranquille qui ne prend pas 600 heures" value="${esc(params.get('t') || '')}"></div>
          <p class="compris" id="compris" aria-live="polite"></p>
          <p class="exemples">Par exemple : ${EXEMPLES_ENVIE.map((x) => `<a href="#/envie?t=${encodeURIComponent(x)}">${esc(x)}</a>`).join(', ')}.</p>
        </div>
        <p class="phrase">J'ai envie d'un ${trou('g')} ${trou('h', ',')} ${trou('d', ',')} ${trou('j', ',')} ${trou('p', '.')}</p>
        <div class="extras" id="extras"></div>
        <section class="choix" id="choix" aria-label="Trois propositions pour ton envie"></section>
        <div class="resultats-tete"><div><h2 id="nb-resultats" aria-live="polite"></h2><p class="nb-notes" id="nb-notes" hidden></p></div><button class="btn discret" type="button" id="raz">Tout remettre à zéro</button></div>
        <div class="filtres tri-barre" id="tri-barre">
          <label for="e-tri">Trier par<select id="e-tri">${TRIS.map(([v, t]) => `<option value="${v}" ${v === tri ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
          <label for="e-affiner">Affiner<select id="e-affiner"></select></label>
        </div>
        <div id="resultats"></div>
      </div>`;

    const mesure = document.createElement('canvas').getContext('2d');
    const ajuster = (s) => {
      const st = getComputedStyle(s);
      mesure.font = `${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
      s.style.width = Math.ceil(mesure.measureText(s.options[s.selectedIndex].text).width + 2) + 'px';
      s.classList.toggle('libre', !s.value);
    };
    const lireFiltres = () => {
      const r = { ...extras };
      $$('select[data-f]').forEach((s) => { if (s.value) r[s.dataset.f] = s.value; });
      return r;
    };
    const NOM_EXTRA = {
      c: (v) => `Dans l'esprit de ${PAR_ID[v].titre}`, x: (v) => `Sans ${(LIBELLE_TYPE[v] || v).replace(/^jeu (de |d')/, '')}`, facile: () => 'Facile à prendre en main', ecran: () => 'Sur le même écran',
      vr: () => 'En réalité virtuelle aussi', liste: () => 'Dans ma liste « Je veux y jouer »', steam: () => 'Dans ma bibliothèque Steam', gp: () => 'Dans le Game Pass',
      coop: () => 'En coop', sansPvp: () => "Sans affronter d'autres joueurs", gratuit: () => 'Gratuit', sujet: (v) => v.split(',').map((k, i) => (i ? NOM_SUJET[k].charAt(0).toLowerCase() + NOM_SUJET[k].slice(1) : NOM_SUJET[k])).join(', '), enfants: () => 'Pour les enfants',
      paisible: () => 'Sans combat', recent: () => 'Sorti récemment', annee: (v) => 'Sorti en ' + v, depuis: (v) => 'Depuis ' + v, inde: () => 'Indé',
      connu: (v) => (v === 'peu' ? 'Moins connu' : 'Un gros jeu'), meilleurs: () => 'Parmi les mieux notés', an: (v) => DECENNIES[v], ancien: () => "Un jeu d'avant 2006", vue: () => 'À la première personne', enLigne: () => 'En ligne'
    };
    const peindreExtras = () => {
      $('#extras').innerHTML = Object.keys(extras).map((k) => `<button type="button" class="extra" data-extra="${k}">${esc(NOM_EXTRA[k](extras[k]))}<span aria-hidden="true">×</span><span class="sr">, retirer</span></button>`).join('')
        + (!extras.steam && NB_POSSEDES ? `<button type="button" class="extra ajout" data-ajout="steam">Choisir dans ma bibliothèque Steam (${nb(NB_POSSEDES)} jeux)<span aria-hidden="true">+</span></button>` : '')
        + (!extras.gp && NB_GAMEPASS ? `<button type="button" class="extra ajout" data-ajout="gp">Dans le Game Pass (${nb(NB_GAMEPASS)} jeux)<span aria-hidden="true">+</span></button>` : '')
        // Pour ceux qui connaissent déjà tous les classiques : un clic, et on sort des sentiers battus.
        + (!extras.connu ? '<button type="button" class="extra ajout" data-ajout="connu" data-valeur="peu">Seulement des jeux moins connus<span aria-hidden="true">+</span></button>' : '')
        + (!extras.liste && journal.envies.length >= 3 ? `<button type="button" class="extra ajout" data-ajout="liste">Choisir dans ma liste (${journal.envies.length} jeux)<span aria-hidden="true">+</span></button>` : '');
      if (extras.c && PAR_ID[extras.c]) chargerFiche(PAR_ID[extras.c]).then(() => { if (extras.c) maj(); });
    };
    let res = [];
    let liste = [];
    let montres = 0;
    const trier = (l) => {
      if (!tri) return l;
      const cle = {
        note: (c) => -(noteFiable(c) || (c.verdicts ? c.verdicts[0] : 0)),
        court: (c) => (c.histoire > 0 ? c.histoire : 1e6),
        recent: (c) => -(c.annee || 0),
        populaire: (c) => -(c.populaire || 0),
      }[tri];
      // Les jeux dont on ne sait rien sur ce point (pas de note, durée inconnue) restent en fin de liste,
      // et un jeu que presque personne n'a noté passe après les autres (« les plus courts » ne doit pas devenir « les plus obscurs »).
      const peuConnu = (c) => (c.verdicts || (c.populaire || 0) >= 40 ? 0 : 1);
      return l.map((c, i) => [peuConnu(c), cle(c), i, c]).sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]).map((x) => x[3]);
    };
    const peindreAffiner = (filtres) => {
      const libres = AFFINER.filter(([k]) => !affinerActif(k, filtres));
      $('#e-affiner').innerHTML = `<option value="">${libres.length ? 'Ajouter un filtre' : 'Tous les filtres sont pris'}</option>` + libres.map(([k, t]) => `<option value="${k}">${t}</option>`).join('');
      $('#tri-barre').hidden = !res.length || !Object.keys(filtres).length;
    };
    const plus = () => {
      const filtres = lireFiltres();
      const lot = liste.slice(montres, montres + PAR_PAGE);
      $('.liste-jeux').insertAdjacentHTML('beforeend', lot.map((c) => ligneJeu(c, filtres, inconnus.has(c.id))).join(''));
      montres += lot.length;
      $('#plus-resultats').hidden = montres >= liste.length;
    };
    const maj = () => {
      const filtres = lireFiltres();
      $$('select[data-f]').forEach(ajuster);
      const brut = filtrer(filtres, { sansFinis: true });
      inconnus = brut.inconnus;
      res = uneVersion(brut.filter((c) => !ecartes.has(c.id)), filtres.c && PAR_ID[filtres.c]);
      liste = trier(res);
      peindreAffiner(filtres);
      const nbInconnus = res.filter((c) => inconnus.has(c.id)).length;
      const nbConnus = res.length - nbInconnus;
      montres = 0;
      let trois = res.length && Object.keys(filtres).length ? troisPropositions(res, ecartes, inconnus, !!filtres.c, filtres.sujet ? filtres.sujet.split(',') : [], filtres.c ? PAR_ID[filtres.c] : null) : [];
      coeursCites = new Set();
      if (tirage) {
        const bons = res.filter((c) => !inconnus.has(c.id) && (c.verdicts || ((c.note || 0) >= 82 && (c.nbNotes || 0) >= 60)));
        const melange = (c) => { let h = tirage; for (const ch of c.id) h = (h * 31 + ch.charCodeAt(0)) % 1000003; return h; };
        trois = (bons.length >= 3 ? bons : res).slice(0, 600).sort((a, b) => melange(a) - melange(b)).slice(0, 3).map((c) => ['hasard', 'Tiré au sort', c]);
      }
      $('#choix').innerHTML = trois.length
        ? `<div class="choix-tete"><h2 class="choix-titre">${tirage ? 'Au hasard, parmi les bons' : (new Date().getHours() >= 17 || new Date().getHours() < 4 ? 'Pour ce soir' : "Pour aujourd'hui") + ', on te propose'}</h2><button class="btn discret" type="button" data-hasard>${tirage ? 'Retirer au sort' : 'Surprends-moi'}</button></div><div class="choix-grille">${trois.map((x) => carteProposition(x, filtres)).join('')}</div>`
        : res.length && Object.keys(filtres).length
          ? `<div class="choix-tete vide"><p>On ne connaît la durée d'aucun de ces jeux : ils sont dans la liste en dessous, à vérifier sur leur fiche.</p></div>`
          : `<div class="choix-tete vide"><p>Pas d'idée précise ? Laisse le hasard choisir parmi des jeux bien notés.</p><button class="btn" type="button" data-hasard>Surprends-moi</button></div>`;
      const nbFinis = Object.keys(journal.finis).length;
      $('#nb-resultats').textContent = !Object.keys(filtres).length ? 'Les plus populaires, en attendant ton envie'
        : !res.length ? 'Aucun jeu ne colle'
        : !nbConnus ? `${nb(nbInconnus)} ${pl(nbInconnus, 'jeu', 'jeux')} dont on ne connaît pas la durée`
        : `${nb(nbConnus)} ${pl(nbConnus, 'jeu qui colle', 'jeux qui collent')}`;
      const notes = [nbConnus && nbInconnus ? `Et ${nb(nbInconnus)} ${pl(nbInconnus, 'autre', 'autres')} dont on ne connaît pas la durée, en fin de liste.` : '', res.length && nbFinis ? 'Sans les jeux que tu as finis.' : ''].filter(Boolean);
      $('#nb-notes').textContent = notes.join(' ');
      $('#nb-notes').hidden = !notes.length;
      $('#resultats').innerHTML = res.length
        ? '<div class="liste-jeux"></div><button class="btn plus-resultats" type="button" id="plus-resultats">Voir plus de jeux</button>'
        : `<div class="rien"><strong>Rien ${CAT ? 'dans le catalogue' : 'dans le prototype'} pour cette envie.</strong>${presque(filtres)}</div>`;
      if (res.length) plus();
      const qs = new URLSearchParams(filtres);
      const t = $('#libre').value.trim();
      if (t) qs.set('t', t);
      if (tri) qs.set('tri', tri);
      history.replaceState(null, '', '#/envie' + (qs.toString() ? '?' + qs : ''));
    };
    $('#choix').addEventListener('click', (e) => {
      if (e.target.closest('[data-hasard]')) { tirage = 1 + Math.floor(Math.random() * 999983); maj(); return; }
      const joue = e.target.closest('[data-joue]');
      if (joue) {
        // Gardé dans le journal : on ne le reproposera plus, ici ni après un jeu fini.
        if (!journal.finis[joue.dataset.joue]) journal.finis[joue.dataset.joue] = { v: null, avant: true };
        sauver();
        maj();
        toast(`${PAR_ID[joue.dataset.joue].titre} : noté comme déjà joué. On t'en propose un autre.`);
        return;
      }
      const b = e.target.closest('[data-pas]');
      if (!b) return;
      ecartes.add(b.dataset.pas);
      maj();
      toast("C'est noté, on t'en propose un autre.");
    });
    $('#extras').addEventListener('click', (e) => {
      const ajout = e.target.closest('[data-ajout]');
      if (ajout) { extras[ajout.dataset.ajout] = ajout.dataset.valeur || '1'; peindreExtras(); maj(); return; }
      const b = e.target.closest('[data-extra]');
      if (!b) return;
      delete extras[b.dataset.extra];
      peindreExtras();
      maj();
    });
    $('#resultats').addEventListener('click', (e) => {
      if (e.target.closest('#plus-resultats')) { plus(); return; }
      const b = e.target.closest('[data-lacher]');
      if (!b) return;
      if (OPTIONS[b.dataset.lacher]) $('#f-' + b.dataset.lacher).value = '';
      else { delete extras[b.dataset.lacher]; peindreExtras(); }
      maj();
    });
    $$('select[data-f]').forEach((s) => s.addEventListener('change', () => { $('#compris').textContent = ''; tirage = 0; maj(); }));
    $('#e-tri').addEventListener('change', (e) => { tri = e.target.value; maj(); });
    $('#e-affiner').addEventListener('change', (e) => {
      const k = e.target.value;
      if (!k) return;
      if (k === 'd') $('#f-d').value = '15';
      else extras[k] = k === 'connu' ? 'peu' : k === 'depuis' ? String(ANNEE - 5) : '1';
      peindreExtras();
      maj();
      toast(`Filtre ajouté : ${AFFINER.find((x) => x[0] === k)[1].toLowerCase()}. La croix, en haut, le retire.`);
    });
    let attente;
    const lireLibre = () => {
      const texte = $('#libre').value;
      if (!texte.trim()) { $('#compris').textContent = ''; maj(); return; }
      const c = comprendre(texte);
      tirage = 0;
      Object.keys(OPTIONS).forEach((k) => { $('#f-' + k).value = c[k] || ''; });
      extras = {};
      ['c', 'x', 'facile', 'ecran', 'vr', 'liste', 'steam', 'gp', 'coop', 'sansPvp', 'gratuit', 'sujet', 'enfants', 'paisible', 'recent', 'an', 'ancien', 'vue', 'enLigne', 'inde', 'connu', 'annee', 'depuis', 'meilleurs'].forEach((k) => { if (c[k]) extras[k] = c[k]; });
      peindreExtras();
      const morceaux = [...Object.keys(OPTIONS).filter((k) => c[k]).map((k) => OPTIONS[k].find((o) => o[0] === c[k])[1]), ...Object.keys(extras).map((k) => { const x = NOM_EXTRA[k](extras[k]); return x.charAt(0).toLowerCase() + x.slice(1); })];
      $('#compris').textContent = morceaux.length ? 'Compris : ' + morceaux.join(', ') + '. Tu peux corriger chaque mot souligné.' : "Je n'ai pas reconnu de critère. Choisis directement dans la phrase en dessous.";
      maj();
    };
    $('#libre').addEventListener('input', () => { clearTimeout(attente); attente = setTimeout(lireLibre, 250); });
    $('#raz').addEventListener('click', () => { $('#libre').value = ''; $$('select[data-f]').forEach((s) => { s.value = ''; }); extras = {}; tirage = 0; tri = ''; $('#e-tri').value = ''; ecartes.clear(); peindreExtras(); $('#compris').textContent = ''; maj(); });
    peindreExtras();
    if (params.get('t') && !Object.keys(f).length && !Object.keys(extras).length) lireLibre(); else maj();
    // Les jeux proches de tes coups de cœur ne sont connus qu'une fois leurs fiches chargées.
    const coeursAcharger = coeursDuJoueur().filter((g) => g.igdb && !FICHES[g.igdb]);
    if (coeursAcharger.length) { const rendu = jetonRendu; Promise.all(coeursAcharger.map(chargerFiche)).then(() => { if (rendu === jetonRendu) maj(); }); }
    if (document.fonts) document.fonts.ready.then(() => $$('select[data-f]').forEach(ajuster));
    return 'Ce qui me tente';
  }

  /* ---------- Explorer ---------- */
  function explorer(_, params) {
    const g = params.get('g') || '';
    const d = params.get('d') || '';
    const p = params.get('p') || '';
    const jo = params.get('j') || '';
    const prix = params.get('prix') || '';
    const tri = params.get('tri') || 'populaires';
    const sel = (id, nom, opts, val) => `<label for="${id}">${nom}<select id="${id}">${opts.map(([v, t]) => `<option value="${esc(v)}" ${v === val ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
    main.innerHTML = `
      <div class="wrap">
        <div class="page-tete"><h1>Explorer</h1><p class="sous">${CAT ? `${nb(TOUS.length)} jeux, toutes machines confondues. Données IGDB du ${esc(CAT.date.split('-').reverse().join('/'))}.` : "62 jeux pour l'instant. Lance importer-catalogue.bat pour avoir le catalogue complet."}</p></div>
        <div class="filtres">
          ${sel('x-p', 'Machine', [['', 'Toutes'], ...FAMILLES.map((x) => [x, x])], p)}
          ${sel('x-g', 'Genre', [['', 'Tous'], ...TYPES.map(([k, t]) => [k, cap(t.replace(/^jeu (de |d')/, ''))])], g)}
          ${sel('x-d', "Durée de l'histoire", [['', 'Peu importe'], ['5', 'Moins de 5 h'], ['15', 'Moins de 15 h'], ['30', 'Moins de 30 h'], ['long', 'Plus de 40 h']], d)}
          ${sel('x-j', 'Joueurs', [['', 'Peu importe'], ['solo', 'Seul'], ['deux', 'À deux'], ['coop', 'En coop'], ['pvp', "Contre d'autres en ligne"]], jo)}
          ${sel('x-prix', 'Prix', [['', 'Peu importe'], ['gratuit', 'Gratuits']], prix)}
          ${sel('x-tri', 'Trier par', [['populaires', 'Les plus populaires'], ['notes', 'Les mieux notés'], ['courts', 'Les plus courts'], ['recents', 'Les plus récents'], ['az', 'De A à Z']], tri)}
        </div>
        <p id="x-nb" class="mono" style="color:var(--texte-2);margin-bottom:20px" aria-live="polite"></p>
        <div class="grille" id="x-grille"></div>
        <button class="btn plus-resultats" type="button" id="x-plus" hidden>Voir plus de jeux</button>
      </div>`;
    let res = [];
    let montres = 0;
    const plus = () => {
      const lot = res.slice(montres, montres + 60);
      $('#x-grille').insertAdjacentHTML('beforeend', lot.map((c) => cover(c, $('#x-tri').value === 'notes' ? scoreAime(c) : undefined)).join(''));
      montres += lot.length;
      $('#x-plus').hidden = montres >= res.length;
    };
    const maj = () => {
      const f = { g: $('#x-g').value, d: $('#x-d').value, p: $('#x-p').value };
      const jv = $('#x-j').value;
      if (jv === 'coop') f.coop = '1'; else if (jv) f.j = jv;
      if ($('#x-prix').value) f.gratuit = '1';
      const t = $('#x-tri').value;
      res = filtrer(f, { dureeStricte: true });
      if (f.g === 'RPG') res = res.filter((x) => !x.rpgDouteux); // en parcourant un genre, Les Sims n'ont rien à faire dans les RPG
      if (t === 'populaires') res.sort((a, b) => (b.populaire || 0) - (a.populaire || 0));
      else if (t === 'notes') res = res.filter((x) => (x.verdicts || (x.nbNotes || 0) >= 30) && x.annee && x.annee <= ANNEE).sort((a, b) => noteFiable(b) - noteFiable(a));
      else if (t === 'courts') res = res.filter((x) => x.histoire).sort((a, b) => a.histoire - b.histoire);
      else if (t === 'recents') res.sort((a, b) => (b.annee || 0) - (a.annee || 0));
      else if (t === 'az') res.sort((a, b) => a.titre.localeCompare(b.titre));
      $('#x-nb').textContent = `${nb(res.length)} ${pl(res.length, 'jeu', 'jeux')}`;
      $('#x-grille').innerHTML = res.length ? '' : '<p class="rien">Aucun jeu avec ces filtres.</p>';
      montres = 0;
      plus();
      const qs = new URLSearchParams(Object.entries({ g: f.g, d: f.d, p: f.p, j: jv, prix: $('#x-prix').value, tri: t }).filter(([, v]) => v && v !== 'populaires'));
      history.replaceState(null, '', '#/explorer' + (qs.toString() ? '?' + qs : ''));
    };
    $$('.filtres select').forEach((s) => s.addEventListener('change', maj));
    $('#x-plus').addEventListener('click', plus);
    maj();
    return 'Explorer';
  }

  /* ---------- Résultats de recherche et séries ---------- */
  function recherche(_, params) {
    const q = (params.get('q') || '').trim();
    const pour = params.get('pour') === 'fini' ? 'fini' : '';
    const iSerie = params.has('serie') ? Number(params.get('serie')) : -1;
    const serie = iSerie >= 0 && SERIES[iSerie] ? iSerie : -1;
    const tri = params.get('tri') || (serie >= 0 ? 'anciens' : 'pertinence');
    if (pour !== 'fini' && serie < 0 && q) $('#q').value = q;
    const titre = serie >= 0 ? SERIES[serie] : q ? `« ${q} »` : 'Recherche';
    const lien = (j) => (pour === 'fini' ? '#/fini/' + j.id : '#/jeu/' + j.id);
    main.innerHTML = `
      <div class="wrap">
        <div class="page-tete">
          ${pour === 'fini' ? '<p class="sur-titre">Lequel as-tu fini ?</p>' : serie >= 0 ? '<p class="sur-titre">La série</p>' : ''}
          <h1>${esc(titre)}</h1>
          <p class="sous" id="r-nb" aria-live="polite"></p>
          <p id="r-serie"></p>
        </div>
        <div class="filtres">
          <label for="r-tri">Trier par<select id="r-tri">
            ${[['pertinence', 'Pertinence'], ['populaires', 'Les plus populaires'], ['anciens', 'Du plus ancien au plus récent'], ['recents', 'Du plus récent au plus ancien']].filter(([v]) => serie < 0 || v !== 'pertinence').map(([v, t]) => `<option value="${v}" ${v === tri ? 'selected' : ''}>${t}</option>`).join('')}
          </select></label>
        </div>
        <div class="grille" id="r-grille"></div>
        <button class="btn plus-resultats" type="button" id="r-plus" hidden>Voir plus de jeux</button>
      </div>`;
    let res = [];
    let montres = 0;
    const carte = (j) => cover(j).replace(`href="#/jeu/${j.id}"`, `href="${lien(j)}"`);
    const plus = () => {
      const lot = res.slice(montres, montres + 60);
      $('#r-grille').insertAdjacentHTML('beforeend', lot.map(carte).join(''));
      montres += lot.length;
      $('#r-plus').hidden = montres >= res.length;
    };
    const maj = () => {
      const t = $('#r-tri').value;
      res = serie >= 0 ? [...JEUX_SERIE[serie]] : chercherTout(q);
      if (t === 'populaires') res.sort((a, b) => (b.populaire || 0) - (a.populaire || 0));
      else if (t === 'anciens') res.sort((a, b) => (a.annee || 9999) - (b.annee || 9999));
      else if (t === 'recents') res.sort((a, b) => (b.annee || 0) - (a.annee || 0));
      $('#r-nb').textContent = res.length ? `${nb(res.length)} ${pl(res.length, 'jeu', 'jeux')}` : '';
      $('#r-tri').closest('.filtres').hidden = res.length < 2; // rien à trier
      $('#r-grille').innerHTML = res.length ? '' : `<p class="rien"><strong>Aucun jeu trouvé.</strong>Vérifie l'orthographe, ou essaie un autre mot du titre.</p>`;
      montres = 0;
      plus();
      const qs = new URLSearchParams(Object.entries({ q: serie < 0 ? q : '', serie: serie >= 0 ? serie : '', pour, tri: t === (serie >= 0 ? 'anciens' : 'pertinence') ? '' : t }).filter(([, v]) => v !== ''));
      history.replaceState(null, '', '#/recherche?' + qs);
    };
    const s = serie < 0 && q ? serieDe(q) : -1;
    if (s >= 0) $('#r-serie').innerHTML = `<a class="lien-fleche" href="#/recherche?serie=${s}${pour ? '&pour=' + pour : ''}">Toute la série ${esc(SERIES[s])}, dans l'ordre de sortie (${nb(JEUX_SERIE[s].length)} jeux) ${fleche}</a>`;
    $('#r-tri').addEventListener('change', maj);
    $('#r-plus').addEventListener('click', plus);
    maj();
    return serie >= 0 ? SERIES[serie] : q ? 'Recherche : ' + q : 'Recherche';
  }

  /* ---------- Connexion / inscription ---------- */
  function connexion(_, params) {
    if (compte && !params.get('mode')) { location.replace('#/journal'); return ''; }
    const mode = params.get('mode') === 'inscription' ? 'inscription' : 'connexion';
    const fond = PAR_ID.hollowknight || PAR_POPULARITE[0];
    main.innerHTML = `
      <div class="connexion">
        <section class="connexion-art lamp" data-lampe aria-hidden="true">${calques(grandeImage(fond))}</section>
        <section class="connexion-panneau" aria-labelledby="titre-connexion">
          <h1 id="titre-connexion">${mode === 'inscription' ? 'Crée ton compte' : 'Content de te revoir'}</h1>
          <p class="connexion-pourquoi">${mode === 'inscription'
            ? 'Ton journal te suit sur ton téléphone comme sur ton PC, et chaque jeu que tu notes affine les prochaines propositions.'
            : 'Connecte-toi pour retrouver ton journal et tes envies.'}</p>
          <div class="onglets" role="tablist" aria-label="Connexion ou inscription">
            <a role="tab" href="#/connexion?mode=connexion" aria-selected="${mode === 'connexion'}">Se connecter</a>
            <a role="tab" href="#/connexion?mode=inscription" aria-selected="${mode === 'inscription'}">Créer un compte</a>
          </div>
          <div class="fournisseurs">
            <button class="btn" type="button" data-fournisseur="Steam">Continuer avec Steam</button>
            <button class="btn" type="button" data-fournisseur="Discord">Continuer avec Discord</button>
            <button class="btn" type="button" data-fournisseur="Google">Continuer avec Google</button>
          </div>
          <p class="note-fournisseur" id="note-fournisseur" role="status"></p>
          <p class="separateur"><span>ou avec ton e-mail</span></p>
          <form id="form-compte" novalidate>
            ${mode === 'inscription' ? `<div class="champ-form"><label for="c-pseudo">Pseudo</label><input id="c-pseudo" autocomplete="username" maxlength="20" aria-describedby="e-pseudo"><p class="erreur" id="e-pseudo"></p></div>` : ''}
            <div class="champ-form"><label for="c-email">E-mail</label><input id="c-email" type="email" autocomplete="email" aria-describedby="e-email"><p class="erreur" id="e-email"></p></div>
            <div class="champ-form"><label for="c-mdp">Mot de passe</label>
              <div class="mdp"><input id="c-mdp" type="password" autocomplete="${mode === 'inscription' ? 'new-password' : 'current-password'}" aria-describedby="e-mdp a-mdp"><button type="button" class="voir-mdp" aria-pressed="false">Afficher</button></div>
              <p class="aide-champ" id="a-mdp">${mode === 'inscription' ? '8 caractères minimum.' : ''}</p>
              <p class="erreur" id="e-mdp"></p></div>
            <button class="btn principal large" type="submit">${mode === 'inscription' ? 'Créer mon compte' : 'Me connecter'}</button>
          </form>
          <p class="demo-note">Prototype : aucun compte n'est vraiment créé et ton mot de passe n'est enregistré nulle part. Seuls ton pseudo et ton e-mail restent sur cet appareil.</p>
        </section>
      </div>`;
    $('.voir-mdp').addEventListener('click', (e) => {
      const champ = $('#c-mdp');
      const visible = champ.type === 'password';
      champ.type = visible ? 'text' : 'password';
      e.currentTarget.textContent = visible ? 'Masquer' : 'Afficher';
      e.currentTarget.setAttribute('aria-pressed', String(visible));
    });
    $$('[data-fournisseur]').forEach((b) => b.addEventListener('click', () => {
      $('#note-fournisseur').textContent = `Dans la vraie version, ce bouton ouvre la page de connexion ${b.dataset.fournisseur}${b.dataset.fournisseur === 'Steam' ? " et propose d'importer ta bibliothèque" : ''}. Pour le prototype, utilise ton e-mail.`;
    }));
    $('#form-compte').addEventListener('submit', (e) => {
      e.preventDefault();
      const erreurs = {};
      const email = $('#c-email').value.trim();
      const mdp = $('#c-mdp').value;
      const pseudo = mode === 'inscription' ? $('#c-pseudo').value.trim() : email.split('@')[0];
      if (mode === 'inscription' && !/^[\p{L}\p{N}_.-]{3,20}$/u.test(pseudo)) erreurs.pseudo = 'Entre 3 et 20 caractères : lettres, chiffres, point, tiret ou tiret bas.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) erreurs.email = 'Cette adresse e-mail ne semble pas complète.';
      if (mode === 'inscription' ? mdp.length < 8 : !mdp) erreurs.mdp = mode === 'inscription' ? 'Il faut au moins 8 caractères.' : 'Entre ton mot de passe.';
      ['pseudo', 'email', 'mdp'].forEach((k) => {
        const zone = $('#e-' + k);
        const champ = $('#c-' + k);
        if (zone) zone.textContent = erreurs[k] || '';
        if (champ) champ.setAttribute('aria-invalid', String(!!erreurs[k]));
      });
      const premier = ['pseudo', 'email', 'mdp'].find((k) => erreurs[k]);
      if (premier) { $('#c-' + premier).focus(); return; }
      compte = { pseudo, email, depuis: new Date().toISOString() };
      ecrireLocal(CLE_COMPTE, compte);
      majEntete();
      toast(mode === 'inscription' ? `Bienvenue, ${pseudo}. Ton journal est rattaché à ton compte.` : `Content de te revoir, ${pseudo}.`);
      location.hash = params.get('retour') ? '#' + params.get('retour') : '#/journal';
    });
    return mode === 'inscription' ? 'Créer un compte' : 'Se connecter';
  }

  /* ---------- Mon journal ---------- */
  function pageJournal() {
    const finis = Object.entries(journal.finis).filter(([id]) => PAR_ID[id]).sort((a, b) => (b[1].date || '').localeCompare(a[1].date || ''));
    const envies = journal.envies.map((id) => PAR_ID[id]).filter(Boolean);
    const bandeau = compte
      ? `<p class="bandeau-compte">Connecté : <b>${esc(compte.pseudo)}</b> <button class="lien-bouton" type="button" id="deconnexion">Se déconnecter</button></p>`
      : `<p class="bandeau-compte">Ton journal est gardé sur cet appareil. <a href="#/connexion?mode=inscription&amp;retour=/journal">Crée un compte</a> pour le retrouver partout.</p>`;
    if (!finis.length && !envies.length) {
      main.innerHTML = `<div class="wrap"><div class="page-tete"><h1>Mon journal</h1>${bandeau}<p style="color:var(--texte-2);max-width:560px">Il est vide pour l'instant. Commence par le dernier jeu que tu as fini : on te demande ce que tu en as pensé, et on te propose le suivant.</p><div style="max-width:640px;margin-top:12px">${champJeu('journal-q', 'Le dernier jeu que tu as fini', 'Le dernier jeu que tu as fini')}</div></div></div>`;
      autocomplete($('#journal-q'), $('#journal-q-liste'), (g) => { location.hash = '#/fini/' + g.id; }, 'fini');
      brancherDeconnexion();
      return 'Mon journal';
    }
    const recents = finis.filter(([, e]) => !e.avant);
    const heures = recents.reduce((t, [id]) => t + (PAR_ID[id].histoire || 0), 0);
    const coeurs = finis.filter(([, e]) => e.v === 0).length;
    const nbFinis = recents.filter(([id]) => !PAR_ID[id].sansFin).length;
    const nbJoues = recents.length - nbFinis;
    const nbAvant = finis.length - recents.length;
    const date = (iso) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
    const entree = (j, e) => `<div class="entree">
        <img src="${jaquette(j)}" alt="" loading="lazy" data-titre="${esc(j.titre)}">
        <div><a class="e-t" href="#/jeu/${j.id}">${esc(j.titre)}</a>
          <div class="e-l">${e.v != null ? `<span class="tag ${e.v === 0 ? 'v0' : ''}">${VERDICTS[e.v]}</span>` : `<a href="#/fini/${j.id}">Donner mon avis</a>`}${(e.aime || []).map((k) => `<span class="tag">${FORTS[k]}</span>`).join('')}</div>
          ${e.phrase ? `<p class="e-p">« ${esc(e.phrase)} »</p>` : ''}</div>
        <span class="e-d">${e.avant ? 'Déjà joué' : date(e.date)}</span></div>`;
    main.innerHTML = `
      <div class="wrap">
        <div class="page-tete">
          <h1>Mon journal</h1>
          ${bandeau}
          <div class="stats"><span><b>${nbFinis}</b>${pl(nbFinis, 'jeu fini', 'jeux finis')}</span>${nbJoues ? `<span><b>${nbJoues}</b>${pl(nbJoues, 'jeu sans fin', 'jeux sans fin')}</span>` : ''}<span><b>~${heures}</b>heures d'histoire</span>${nbAvant ? `<span><b>${nbAvant}</b>${pl(nbAvant, 'déjà joué avant', 'déjà joués avant')}</span>` : ''}<span><b>${coeurs}</b>${pl(coeurs, 'coup de cœur', 'coups de cœur')}</span></div>
          ${BIB ? `<p class="bandeau-compte">Ta bibliothèque Steam est reliée (${nb(NB_POSSEDES)} jeux reconnus, importée le ${esc(BIB.date.split('-').reverse().join('/'))}). <a href="#/envie?steam=1">Choisir un jeu dedans</a></p>` : ''}
        </div>
        ${(() => {
          const b = bilanAnnee(new Date().getFullYear());
          if (!b.n) return '';
          return `<section class="section annee" aria-labelledby="t-annee"><div class="section-tete"><h2 id="t-annee">Ton année ${b.annee}</h2><button class="btn discret" type="button" id="partager-annee">Partager mon année</button></div>
            <p class="annee-txt">${nb(b.n)} ${pl(b.n, 'jeu fini', 'jeux finis')}${b.heures ? `, environ ${nb(b.heures)} heures d'histoire` : ''}${b.coeurs.length ? `, ${b.coeurs.length} ${pl(b.coeurs.length, 'coup de cœur', 'coups de cœur')}` : ''}.${b.humeur ? ` Tu as surtout joué pour ${humeurPour(b.humeur, 'te')}.` : ''}</p>
            <div class="zone-partage" id="zone-annee" aria-live="polite"></div></section>`;
        })()}
        ${finis.length ? `<section class="section"><div class="section-tete"><h2>${nbJoues ? 'Finis et joués' : 'Finis'}</h2><a class="lien-fleche" href="#/fini">J'en ai fini un autre ${fleche}</a></div><div>${finis.map(([id, e]) => entree(PAR_ID[id], e)).join('')}</div></section>` : ''}
        ${envies.length ? `<section class="section"><div class="section-tete"><h2>Je veux y jouer</h2></div><div class="etagere">${envies.map((c) => cover(c)).join('')}</div></section>` : ''}
        <div class="effacer"><button class="btn discret" type="button" id="effacer">Tout effacer</button></div>
      </div>`;
    if ($('#partager-annee')) $('#partager-annee').addEventListener('click', () => partagerAnnee(bilanAnnee(new Date().getFullYear()), $('#zone-annee')));
    const b = $('#effacer');
    b.addEventListener('click', () => {
      if (b.dataset.sur) { journal = vide(); sauver(); toast('Ton journal est vide.'); rendre(); return; }
      b.dataset.sur = '1';
      b.textContent = 'Confirmer : tout effacer';
      b.classList.remove('discret');
    });
    brancherDeconnexion();
    return 'Mon journal';
  }
  function brancherDeconnexion() {
    const d = $('#deconnexion');
    if (!d) return;
    d.addEventListener('click', () => {
      compte = null;
      ecrireLocal(CLE_COMPTE, null);
      majEntete();
      toast('Tu es déconnecté. Ton journal reste sur cet appareil.');
      rendre();
    });
  }

  function introuvable() {
    main.innerHTML = `<div class="wrap"><div class="page-tete"><h1>Rien par ici</h1><p style="color:var(--texte-2)">Cette page n'existe pas, ou ce jeu n'est pas dans le catalogue.</p><p><a class="lien-fleche" href="#/">Retour à l'accueil ${fleche}</a></p></div></div>`;
    return 'Page introuvable';
  }

  /* ---------- Navigation ---------- */
  const ROUTES = { '': accueil, jeu: fiche, fini, envie, explorer, recherche, journal: pageJournal, connexion };
  let jetonRendu = 0;

  async function rendre() {
    const moi = ++jetonRendu;
    const brut = location.hash.replace(/^#/, '') || '/';
    const [chemin, qs] = brut.split('?');
    const morceaux = chemin.split('/').filter(Boolean);
    const page = ROUTES[morceaux[0] || ''] || introuvable;
    const titre = await page(morceaux.slice(1), new URLSearchParams(qs || ''));
    if (moi !== jetonRendu) return;
    document.title = (titre ? titre + ' · ' : '') + 'Nouvelle Partie +';
    $$('a[data-nav]').forEach((a) => { if (a.dataset.nav === (morceaux[0] || '')) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    fermerRecherche();
    activerLampes();
  }

  // Sur téléphone, la recherche se replie derrière une loupe : l'en-tête tient sur une ligne.
  const enTete = $('.top'), boutonLoupe = $('#ouvrir-recherche');
  function fermerRecherche() {
    if (!enTete || !enTete.classList.contains('cherche')) return;
    enTete.classList.remove('cherche');
    if (boutonLoupe) boutonLoupe.setAttribute('aria-expanded', 'false');
  }
  if (boutonLoupe) {
    boutonLoupe.addEventListener('click', () => {
      const ouvert = enTete.classList.toggle('cherche');
      boutonLoupe.setAttribute('aria-expanded', String(ouvert));
      if (ouvert) $('#q').focus(); else $('#q').blur();
    });
    $('#q').addEventListener('keydown', (e) => { if (e.key === 'Escape' && !e.target.value) { fermerRecherche(); boutonLoupe.focus(); } });
  }

  let premier = true;
  function naviguer() {
    const faire = async () => {
      await rendre();
      window.scrollTo(0, 0);
      if (!premier) main.focus({ preventScroll: true });
      premier = false;
    };
    if (!premier && document.startViewTransition && !reduit.matches) {
      const t = document.startViewTransition(faire);
      [t.ready, t.finished, t.updateCallbackDone].forEach((p) => p && p.catch(() => {}));
    } else faire();
  }

  document.addEventListener('click', (e) => {
    const lien = e.target.closest('a[data-jeu]');
    if (!lien) return;
    const im = lien.querySelector('img[data-vt]');
    if (!im) return;
    $$('img').forEach((x) => { if (x.style.viewTransitionName) x.style.viewTransitionName = ''; });
    im.style.viewTransitionName = 'jaquette';
  });

  document.addEventListener('click', (e) => {
    const b = e.target.closest('.montrer-spoil');
    if (!b) return;
    const p = b.nextElementSibling;
    p.hidden = !p.hidden;
    b.setAttribute('aria-expanded', String(!p.hidden));
    b.textContent = p.hidden ? 'Cet avis dévoile un moment clé. Le lire quand même' : "Cacher l'avis";
  });

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-envie]');
    if (!b) return;
    const ajoute = basculerEnvie(b.dataset.envie);
    b.setAttribute('aria-pressed', String(ajoute));
    b.textContent = ajoute ? 'Dans ma liste' : 'Je veux y jouer';
    toast(ajoute ? 'Ajouté à « Je veux y jouer ».' : 'Retiré de ta liste.');
  });

  const dateFr = (iso) => (iso ? iso.split('-').reverse().join('/') : '');
  if (CAT) $('#credit-donnees').textContent = `Catalogue : IGDB.com (${nb(TOUS.length)} jeux, mis à jour le ${dateFr(CAT.date)}).${window.TEXTES_FR ? ' Présentations : éditeurs (Steam) et Wikipédia (CC BY-SA).' : ''}${ABO ? ` Game Pass : liste Xbox France du ${dateFr(ABO.date)}.` : ''}`;
  // Pour les tests automatiques (outils/), sans effet sur le site.
  window.__np = { TOUS, PAR_ID, filtrer, comprendre, proximite, voisins, oeuvre: (c) => oeuvre(c), recommander: (b, e) => recommander(b, e) };
  autocomplete($('#q'), $('#q-liste'), (j) => { $('#q').value = ''; location.hash = '#/jeu/' + j.id; });
  window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/recherche')) $('#q').value = ''; });
  window.addEventListener('hashchange', naviguer);
  lampeGlobale();
  majEntete();
  naviguer();
})();
