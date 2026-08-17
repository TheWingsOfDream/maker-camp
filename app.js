/* =========================================================
   灵感卡片墙 · 秋风落叶版 · 逻辑
   ========================================================= */

(() => {
  'use strict';

  // ---------- 常量 ----------
  const STORAGE_KEY = 'inspiration_cards_v2';
  const SETTINGS_KEY = 'inspiration_settings_v2';

  const LEAF_TYPES = ['maple', 'ginkgo', 'platanus', 'oak', 'birch'];

  // 6 种叶型的完整 SVG path（viewBox 0 0 100 120，匹配 300:360 比例）
  // 叶身覆盖 y=10~95（对应 CSS 中文字区域 top:18% bottom:22%），叶柄 y=95~115
  const LEAF_DEFS = {
    maple: { // 经典 5 裂枫叶
      body: 'M50,10 L58,28 L70,22 L66,38 L82,42 L72,54 L84,72 L62,64 L60,86 L50,78 L40,86 L38,64 L16,72 L28,54 L18,42 L34,38 L30,22 L42,28 Z',
      stem: 'M50,78 L50,112',
      veins: ['M50,76 L50,15','M50,42 L24,28','M50,42 L76,28','M50,55 L20,55','M50,55 L80,55','M50,66 L42,80','M50,66 L58,80']
    },
    ginkgo: { // 银杏扇形（顶部微凹）
      body: 'M50,88 Q20,78 22,42 Q26,14 45,14 Q50,24 55,14 Q74,14 78,42 Q80,78 50,88 Z',
      stem: 'M50,88 L50,114',
      veins: ['M50,86 L30,22','M50,86 L40,18','M50,86 L48,16','M50,86 L52,16','M50,86 L60,18','M50,86 L70,22']
    },
    platanus: { // 梧桐掌状 3~5 裂
      body: 'M50,12 Q35,16 30,30 Q15,28 18,48 Q12,58 25,66 Q22,80 38,80 Q42,92 50,86 Q58,92 62,80 Q78,80 75,66 Q88,58 82,48 Q85,28 70,30 Q65,16 50,12 Z',
      stem: 'M50,86 L50,112',
      veins: ['M50,84 L50,18','M50,45 L22,36','M50,45 L78,36','M50,60 L20,62','M50,60 L80,62']
    },
    oak: { // 橡叶波浪边
      body: 'M50,10 Q40,12 35,22 Q28,20 25,30 Q18,32 22,42 Q15,48 22,55 Q15,62 25,65 Q22,75 32,75 Q35,85 42,82 Q46,90 50,88 Q54,90 58,82 Q65,85 68,75 Q78,75 75,65 Q85,62 78,55 Q85,48 78,42 Q82,32 75,30 Q72,20 65,22 Q60,12 50,10 Z',
      stem: 'M50,88 L50,112',
      veins: ['M50,86 L50,18','M50,35 L25,32','M50,35 L75,32','M50,50 L22,50','M50,50 L78,50','M50,65 L25,68','M50,65 L75,68']
    },
    willow: { // 柳叶细长披针
      body: 'M50,10 Q62,25 60,50 Q58,72 50,88 Q42,72 40,50 Q38,25 50,10 Z',
      stem: 'M50,88 L50,114',
      veins: ['M50,86 L50,15','M50,25 L42,22','M50,25 L58,22','M50,40 L40,38','M50,40 L60,38','M50,55 L40,55','M50,55 L60,55','M50,70 L42,72','M50,70 L58,72']
    },
    birch: { // 桦叶卵形
      body: 'M50,12 Q68,15 72,35 Q75,58 65,75 Q58,88 50,88 Q42,88 35,75 Q25,58 28,35 Q32,15 50,12 Z',
      stem: 'M50,88 L50,112',
      veins: ['M50,86 L50,18','M50,30 L35,28','M50,30 L65,28','M50,45 L30,48','M50,45 L70,48','M50,60 L32,65','M50,60 L68,65','M50,75 L40,80','M50,75 L60,80']
    },
  };

  // 标签 → 叶型/颜色 映射（更贴近真实秋色）
  const TAG_LEAF_MAP = [
    { tags: ['语录'], type: 'maple', color: '#c1351a' },        // 深红枫
    { tags: ['读书', '读书笔记', '阅读'], type: 'ginkgo', color: '#e8a823' }, // 金黄银杏
    { tags: ['灵感'], type: 'platanus', color: '#c9742a' },      // 橙棕梧桐
    { tags: ['写作'], type: 'birch', color: '#a8782c' },        // 黄褐桦
    { tags: ['摘抄', '摘录'], type: 'oak', color: '#8f3f22' },  // 暗红棕橡
  ];
  const DEFAULT_LEAF = { type: 'birch', color: '#d9a441' };

  // 真实秋色系预设（12 色，按色相分布）
  const PRESET_COLORS = [
    '#b21f0e', '#c1351a', '#d94e2f', '#e07a2c',
    '#e88c30', '#e8a823', '#f0c041', '#d9a441',
    '#c9742a', '#a8782c', '#8f3f22', '#6b2e15'
  ];

  // 三层配置
  const LAYERS = [
    { name: 'far',  scale: 0.65, opacity: 0.55, speed: 0.18, swayAmp: 12, z: 1 },
    { name: 'mid',  scale: 0.85, opacity: 0.82, speed: 0.32, swayAmp: 28, z: 2 },
    { name: 'near', scale: 1.05, opacity: 1.00, speed: 0.50, swayAmp: 46, z: 3 },
  ];

  const WIND_CHANGE_INTERVAL = 7000; // 风向切换间隔
  const HOVER_SCALE = 1.18;
  const LEAF_MARGIN_X = 60;

  // ---------- 状态 ----------
  let cards = [];
  let settings = { atmosphere: 'dusk', sort: 'latest' };
  let editingId = null;
  let pendingDeleteId = null;
  let currentQuery = '';
  let manageQuery = '';
  let formTags = [];
  let formLeafType = 'maple';
  let formLeafColor = '#d94e2f';

  // 动画运行时
  let motions = []; // 每片叶子的运动状态
  let wind = 0;
  let windTarget = 0;
  let rafId = null;
  let lastTime = 0;
  let searchStartTime = 0;
  let vh = window.innerHeight;
  let vw = window.innerWidth;

  // ---------- DOM ----------
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const leavesContainer = $('#leaves');
  const emptyState = $('#emptyState');
  const cardCountEl = $('#cardCount');

  const dockPanel = $('#dockPanel');
  const dockSearch = $('#dockSearch');
  const searchInput = $('#searchInput');
  const sortPop = $('#sortPop');
  const atmospherePop = $('#atmospherePop');

  const detailOverlay = $('#detailOverlay');
  const editOverlay = $('#editOverlay');
  const confirmOverlay = $('#confirmOverlay');
  const managePanel = $('#managePanel');
  const toastEl = $('#toast');

  const cardForm = $('#cardForm');
  const tagsBox = $('#tagsBox');
  const tagInput = $('#tagInput');
  const previewLeaf = $('#previewLeaf');
  const leafTypeRow = $('#leafTypeRow');
  const presetColorsEl = $('#presetColors');
  const autoLeafCheck = $('#autoLeaf');

  // ---------- 工具 ----------
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function fmtDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  // hex → 暗一级（阴影色）
  function shade(hex, amt = 0.75) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v * amt)));
    return `#${f(r).toString(16).padStart(2, '0')}${f(g).toString(16).padStart(2, '0')}${f(b).toString(16).padStart(2, '0')}`;
  }

  function highlight(text, query) {
    const safe = esc(text);
    const q = (query || '').trim();
    if (!q) return safe;
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return safe.replace(re, '<mark>$1</mark>');
  }

  // 根据标签推算叶型/颜色
  function leafFromTags(tags) {
    if (tags && tags.length) {
      for (const t of tags) {
        const found = TAG_LEAF_MAP.find(m => m.tags.includes(t));
        if (found) return { type: found.type, color: found.color };
      }
    }
    return { ...DEFAULT_LEAF };
  }

  // ---------- 存储 ----------
  function loadCards() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : [];
      if (Array.isArray(data)) {
        return data.filter(c => c && c.id && c.title != null).map(c => ({
          ...c,
          leaf: c.leaf || leafFromTags(c.tags),
          tags: Array.isArray(c.tags) ? c.tags : [],
        }));
      }
    } catch (e) { console.warn('读取卡片失败', e); }
    return [];
  }
  function saveCards() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cards)); }
    catch (e) { console.error('保存失败', e); showToast('保存失败：存储空间可能不足'); }
  }
  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return { ...settings, ...JSON.parse(raw) };
    } catch (e) {}
    return settings;
  }
  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}
  }

  // ---------- CRUD ----------
  function addCard(data) {
    const now = Date.now();
    const card = {
      id: uid(),
      title: data.title.trim(),
      body: data.body.trim(),
      source: (data.source || '').trim(),
      tags: data.tags.slice(),
      leaf: data.leaf || leafFromTags(data.tags),
      createdAt: now,
      updatedAt: now,
    };
    cards.unshift(card);
    saveCards();
    return card;
  }
  function updateCard(id, data) {
    const c = cards.find(x => x.id === id);
    if (!c) return null;
    c.title = data.title.trim();
    c.body = data.body.trim();
    c.source = (data.source || '').trim();
    c.tags = data.tags.slice();
    c.leaf = data.leaf || c.leaf;
    c.updatedAt = Date.now();
    saveCards();
    return c;
  }
  function removeCard(id) {
    cards = cards.filter(x => x.id !== id);
    saveCards();
  }

  // ---------- 排序 + 分层分配 ----------
  function getSortedCards() {
    let list = cards.slice();
    if (settings.sort === 'latest') {
      list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } else if (settings.sort === 'random') {
      list = shuffle(list);
    } else if (settings.sort === 'source') {
      list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      const groups = {};
      list.forEach(c => {
        const k = (c.source || '未标注来源').trim() || '未标注来源';
        (groups[k] = groups[k] || []).push(c);
      });
      list = [];
      Object.keys(groups).sort().forEach(k => { list = list.concat(groups[k]); });
    }
    return list;
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // 给排好序的列表分配层级（决定景深）
  function assignLayers(list) {
    const n = list.length;
    if (n === 0) return [];
    const assignments = new Array(n);
    if (settings.sort === 'latest') {
      // 最新的进近层，中间进中层，最旧进远层
      list.forEach((c, i) => {
        const r = i / Math.max(1, n - 1);
        assignments[i] = r < 0.3 ? 2 : (r < 0.7 ? 1 : 0);
      });
    } else if (settings.sort === 'source') {
      // 按来源分组时，每组内最新在近层
      let lastSource = null, groupIdx = 0, groupLen = 0;
      const groups = {};
      list.forEach((c, i) => {
        const k = (c.source || '未标注来源').trim() || '未标注来源';
        (groups[k] = groups[k] || []).push(i);
      });
      Object.values(groups).forEach(idxs => {
        const gl = idxs.length;
        idxs.forEach((idx, gi) => {
          const r = gi / Math.max(1, gl - 1);
          assignments[idx] = r < 0.34 ? 2 : (r < 0.7 ? 1 : 0);
        });
      });
    } else {
      // 随机
      list.forEach((_, i) => { assignments[i] = pick([0, 1, 2]); });
    }
    return assignments;
  }

  // 按来源分组的水平区域
  function getXForLayer(layerIdx, card, sourceIndex, sourceCount) {
    const baseRange = vw - LEAF_MARGIN_X * 2;
    if (settings.sort === 'source' && sourceCount > 1) {
      // 该来源所在象限
      const segW = baseRange / sourceCount;
      const segStart = LEAF_MARGIN_X + sourceIndex * segW;
      return segStart + Math.random() * segW * 0.8;
    }
    return LEAF_MARGIN_X + Math.random() * baseRange;
  }

  // ---------- 叶片元素 ----------
  // 直接渲染完整 path（叶柄棕色 + 叶身填色 + 叶脉浅色），不依赖外部 SVG defs
  function leafSvgInner(type, color) {
    const def = LEAF_DEFS[type] || LEAF_DEFS.birch;
    const veins = (def.veins || []).map(d => `<path class="leaf-vein-line" d="${d}"/>`).join('');
    return `
      <path class="leaf-stem" d="${def.stem}"/>
      <path class="leaf-body-path" d="${def.body}" style="fill:${color}"/>
      ${veins}
    `;
  }

  function buildLeafEl(card) {
    const el = document.createElement('div');
    el.className = 'leaf';
    el.dataset.id = card.id;

    const leaf = card.leaf || leafFromTags(card.tags);
    const shadeColor = shade(leaf.color, 0.6);

    el.innerHTML = `
      <svg class="leaf-shape" viewBox="0 0 100 120" preserveAspectRatio="none">
        ${leafSvgInner(leaf.type, leaf.color)}
      </svg>
      <div class="leaf-content">
        <h3 class="leaf-title">${esc(card.title)}</h3>
        <p class="leaf-body">${esc(card.body)}</p>
      </div>
      <div class="leaf-actions">
        <button type="button" data-act="edit" title="编辑" aria-label="编辑">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </button>
        <button type="button" data-act="delete" title="删除" aria-label="删除">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>
    `;
    el.style.setProperty('--leaf-shade', shadeColor);

    el.addEventListener('click', (e) => {
      const actBtn = e.target.closest('[data-act]');
      if (actBtn) {
        e.stopPropagation();
        if (actBtn.dataset.act === 'edit') openEdit(card.id);
        else if (actBtn.dataset.act === 'delete') askDelete(card.id);
        return;
      }
      // 点击叶子：移到屏幕正中、放大覆盖全屏，再展开菜单
      expandLeafToFullscreen(card.id);
    });
    return el;
  }

  // ---------- 舞台渲染 ----------
  // 创建单片叶子的 motion 对象（不立即追加到 motions）
  function createMotion(card, layerIdx, sourceIdx, sourceCount) {
    const layer = LAYERS[layerIdx] || LAYERS[0];
    const el = buildLeafEl(card);
    el.style.zIndex = layer.z;
    el.style.opacity = 0;
    leavesContainer.appendChild(el);
    const baseRot = rand(-12, 12);
    return {
      el,
      card,
      layerIdx,
      x: getXForLayer(layerIdx, card, sourceIdx, sourceCount),
      y: -rand(80, 260),
      speed: layer.speed * rand(0.85, 1.15),
      scale: layer.scale,
      baseOpacity: layer.opacity,
      baseZ: layer.z,
      swayAmp: layer.swayAmp * rand(0.8, 1.2),
      swayPeriod: rand(2.2, 4.5),
      swayPhase: rand(0, Math.PI * 2),
      rotStart: baseRot,
      rotAmp: rand(6, 14),
      rotPeriod: rand(3, 6),
      rotPhase: rand(0, Math.PI * 2),
      rot: baseRot,
      curScale: layer.scale,
      curOpacity: 0,
      fadeInT: 600,
      releaseDelay: 0,
      frozen: false,
      expanding: false,
      searchMatched: true,
      searchHidden: false,
      hexTarget: null,
      hexSettled: false,
      fx: 0, fy: 0,
    };
  }

  function renderStage() {
    const list = getSortedCards();
    const layerAssignments = assignLayers(list);

    // 来源分组辅助
    let sourceMap = {}, sourceList = [];
    if (settings.sort === 'source') {
      list.forEach(c => {
        const k = (c.source || '未标注来源').trim() || '未标注来源';
        if (!(k in sourceMap)) { sourceMap[k] = sourceList.length; sourceList.push(k); }
      });
    }

    // 清理旧元素
    leavesContainer.innerHTML = '';
    motions = [];
    expandingMotion = null;

    if (list.length === 0) {
      emptyState.hidden = false;
      cardCountEl.textContent = '0 片';
      return;
    }
    emptyState.hidden = true;
    cardCountEl.textContent = `${list.length} 片`;

    list.forEach((card, i) => {
      const layerIdx = layerAssignments[i] || 0;
      const sourceIdx = settings.sort === 'source' ? sourceMap[(card.source || '未标注来源').trim() || '未标注来源'] : 0;
      const sourceCount = settings.sort === 'source' ? sourceList.length : 1;
      const m = createMotion(card, layerIdx, sourceIdx, sourceCount);
      // 估算下落时长并错开释放，避免叶子集中落下
      const fallMs = estimateFallMs(m.speed);
      m.releaseDelay = (i / list.length) * fallMs * 0.7;
      m.curOpacity = 0;
      motions.push(m);
    });

    applySearchFilter();
    if (!rafId) startLoop();
  }

  // 追加单张新叶（不重建全部），并安排释放节奏
  function appendLeaf(card) {
    // 分配层：新叶子进近层（高优先级）
    const layerIdx = 2;
    // 来源索引
    let sourceIdx = 0, sourceCount = 1;
    if (settings.sort === 'source') {
      const srcKey = (card.source || '未标注来源').trim() || '未标注来源';
      const existing = new Set(motions.map(m => (m.card.source || '未标注来源').trim() || '未标注来源'));
      sourceCount = Math.max(existing.size, existing.size + (existing.has(srcKey) ? 0 : 1));
      const arr = Array.from(existing);
      arr.push(srcKey);
      const unique = Array.from(new Set(arr));
      sourceIdx = unique.indexOf(srcKey);
      if (sourceIdx < 0) sourceIdx = unique.length - 1;
      sourceCount = unique.length;
    }
    const m = createMotion(card, layerIdx, sourceIdx, sourceCount);
    motions.push(m);
    if (motions.filter(x => !x.flyAway).length === 1) {
      emptyState.hidden = true;
    }
    cardCountEl.textContent = `${cards.length} 片`;
    if (!rafId) startLoop();
  }

  // 更新已存在叶子的内容（编辑后），不重建舞台
  function updateLeafCard(card) {
    const m = motions.find(x => x.card && x.card.id === card.id);
    if (!m) return false;
    m.card = card;
    // 重建 DOM 内容（保留位置和动画状态）
    const newEl = buildLeafEl(card);
    newEl.style.zIndex = m.baseZ;
    newEl.style.opacity = m.curOpacity;
    newEl.style.transform = m.el.style.transform;
    m.el.replaceWith(newEl);
    m.el = newEl;
    return true;
  }

  // 从 motions 移除单片叶子（删除时），不重建舞台
  function detachMotion(id) {
    const idx = motions.findIndex(m => m.card && m.card.id === id);
    if (idx === -1) return;
    const m = motions[idx];
    if (m.el && m.el.parentNode) m.el.parentNode.removeChild(m.el);
    motions.splice(idx, 1);
    if (expandingMotion === m) expandingMotion = null;
    cardCountEl.textContent = `${cards.length} 片`;
    if (motions.filter(x => !x.flyAway).length === 0) {
      emptyState.hidden = false;
    }
  }

  // 缓动函数
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, k) => a + (b - a) * k;
  // 估算单片叶子的下落时长（毫秒）
  // 下落距离 ≈ vh + 340（屏幕高 + 叶子高 + 缓冲），speed 单位是 px/帧（约 60fps）
  function estimateFallMs(speed) {
    const fallPx = vh + 340;
    const sp = speed || 0.3;
    return (fallPx / sp) * 16.67;
  }

  // ---------- 动画循环 ----------
  function startLoop() {
    lastTime = performance.now();
    function tick(now) {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min(50, now - lastTime);
      lastTime = now;
      const t = now / 1000;

      // 风力缓动
      wind += (windTarget - wind) * 0.008;

      // === 斥力计算：屏幕边缘 + 叶片之间（软斥力，不硬约束） ===
      const edgeK = 0.35;                    // 边缘斥力系数
      const edgeMargin = 90;                 // 距屏幕边缘 < 90px 时开始排斥
      const pairK = 1.4;                     // 叶片间斥力系数
      const pairMinDist = 165;               // 两叶中心距 < 165px 时开始排斥
      const hasQuery = !!currentQuery.trim();

      // 1. 初始化斥力分量
      motions.forEach(m => {
        m.fx = 0; m.fy = 0;
      });
      const active = motions.filter(m =>
        !m.expanding && !m.flyAway && m.el && !m.frozen &&
        !(hasQuery && m.searchMatched && m.hexTarget) // 搜索命中飞向堆积时不加斥力
      );
      // 2. 屏幕边缘斥力（仅左右，不加上边框斥力，避免突兀）
      active.forEach(m => {
        const rx = 150 * m.curScale;  // 叶子 x 方向半宽（≈）
        const left   = m.x + rx;      // 叶左边界
        const right  = m.x + 300 * m.curScale - rx; // 叶右边界（近似）
        // 左边缘
        if (left < edgeMargin) {
          const d = edgeMargin - left;
          m.fx += edgeK * d * d * 0.005 + 0.6;
        }
        // 右边缘
        if (right > vw - edgeMargin) {
          const d = right - (vw - edgeMargin);
          m.fx -= edgeK * d * d * 0.005 + 0.6;
        }
      });
      // 3. 叶片间斥力（两两配对，推开彼此）
      for (let i = 0; i < active.length; i++) {
        for (let j = i + 1; j < active.length; j++) {
          const a = active[i], b = active[j];
          // 中心点（近似：x + 半宽，y + 半高）
          const ax = a.x + 150 * a.curScale;
          const ay = a.y + 180 * a.curScale;
          const bx = b.x + 150 * b.curScale;
          const by = b.y + 180 * b.curScale;
          const dx = bx - ax;
          const dy = by - ay;
          const dist2 = dx * dx + dy * dy;
          // 最小作用距离 = pairMinDist * 两叶平均 scale
          const avgScale = (a.curScale + b.curScale) / 2;
          const minD = pairMinDist * avgScale;
          const minD2 = minD * minD;
          if (dist2 < minD2 && dist2 > 1) {
            const dist = Math.sqrt(dist2);
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minD - dist;
            const f = pairK * overlap * overlap * 0.01; // 软平方斥力
            // 相同力加在两个叶子上，方向相反
            a.fx -= nx * f;
            a.fy -= ny * f * 0.7; // y 方向只推 70%，避免影响下落
            b.fx += nx * f;
            b.fy += ny * f * 0.7;
          }
        }
      }
      // === 斥力计算结束 ===

      motions.forEach(m => {
        if (m.expanding || !m.el) return; // 展开全屏中或元素已失效

        // 先应用斥力到 x/y（只影响非飞离、非搜索堆积的叶子）
        if (!m.flyAway && !m.frozen && !(hasQuery && m.searchMatched && m.hexTarget)) {
          m.x += m.fx || 0;
          m.y += m.fy || 0;
        }

        // 飘走动画（删除时）：加速向右上方旋转飘出 + 淡出
        if (m.flyAway) {
          m.x += m.flyVx * (dt / 16.67);
          m.y += m.flyVy * (dt / 16.67);
          m.flyVy += 0.15 * (dt / 16.67); // 微弱重力，先升后飘
          m.rot += m.flyRot * (dt / 16.67);
          m.flyOpacity = Math.max(0, m.flyOpacity - 0.018 * (dt / 16.67));
          m.el.style.transform = `translate3d(${m.x}px, ${m.y}px, 0) rotate(${m.rot}deg) scale(${m.curScale})`;
          m.el.style.opacity = m.flyOpacity;
          m.el.style.zIndex = 9999;
          return;
        }

        // 0. 释放延迟（错开释放，避免集中）
        if (m.releaseDelay > 0) {
          m.releaseDelay = Math.max(0, m.releaseDelay - dt);
          // 延迟期间保持静止 + 隐藏
          m.el.style.opacity = '0';
          m.el.style.transform = `translate3d(${m.x}px, ${m.y}px, 0) rotate(${m.rot}deg) scale(${m.curScale})`;
          return;
        }

        // 1. 顶部缓入
        if (m.fadeInT > 0) {
          m.fadeInT = Math.max(0, m.fadeInT - dt);
        }

        // 2. 下落 / 搜索堆积（hasQuery 在循环外已声明）
        if (hasQuery && m.searchMatched && m.hexTarget) {
          // 搜索命中：飞向六角堆积位置
          m.x = lerp(m.x, m.hexTarget.x, 0.10);
          m.y = lerp(m.y, m.hexTarget.y, 0.10);
          if (Math.abs(m.hexTarget.x - m.x) < 1.5 && Math.abs(m.hexTarget.y - m.y) < 1.5) {
            m.hexSettled = true;
          }
        } else if (!m.frozen) {
          // 正常下落（搜索未命中加速）
          const fallMul = m.searchHidden ? 6.0 : 1.0;
          m.y += m.speed * (dt / 16.67) * fallMul;
        }

        // 3. 摆动 + 旋转/scale lerp
        const sway = Math.sin(t / m.swayPeriod + m.swayPhase) * m.swayAmp;
        let targetRot, targetScale;
        if (m.frozen) {
          // 悬停：摆正 + 放大 + 前置
          targetRot = 0;
          targetScale = m.scale * HOVER_SCALE;
          m.el.style.zIndex = 9999;
        } else if (hasQuery && m.searchMatched && m.hexTarget) {
          // 搜索命中：飞向堆积位置 + 缩小到 0.6
          targetRot = lerp(m.rot, 0, 0.12);
          targetScale = 0.6;
          m.el.style.zIndex = m.baseZ;
        } else {
          targetRot = m.rotStart + Math.sin(t / m.rotPeriod + m.rotPhase) * m.rotAmp;
          targetScale = m.scale;
          m.el.style.zIndex = m.baseZ;
        }
        const lerpK = m.frozen ? 0.20 : 0.14;
        m.rot = lerp(m.rot, targetRot, lerpK);
        m.curScale = lerp(m.curScale, targetScale, lerpK);

        // 4. 透明度
        let targetOpacity;
        if (m.fadeInT > 0) {
          const prog = 1 - m.fadeInT / 600;
          targetOpacity = (m.searchHidden ? 0 : m.baseOpacity) * easeOutCubic(prog);
        } else if (m.searchHidden) {
          // 未命中：在上半屏保持可见，下半屏才开始淡出，让用户能看到加速下落过程
          targetOpacity = m.y > vh * 0.5 ? 0 : m.baseOpacity;
        } else {
          targetOpacity = m.baseOpacity;
        }
        // 未命中时慢淡出（系数小），让用户能看到加速下落过程
        const opacityK = m.searchHidden ? 0.04 : 0.18;
        m.curOpacity = lerp(m.curOpacity, targetOpacity, opacityK);

        const displayX = m.x + ((m.hexSettled || (hasQuery && m.searchMatched && m.hexTarget)) ? 0 : sway + wind);
        m.el.style.transform = `translate3d(${displayX}px, ${m.y}px, 0) rotate(${m.rot}deg) scale(${m.curScale})`;
        m.el.style.opacity = m.curOpacity;

        // 5. 回收（出屏后重新从顶部进入）
        if (m.y > vh + 80 && !(hasQuery && m.searchMatched)) {
          if (m.searchHidden) {
            // 未命中：3秒内从顶部重新进入继续加速下落，3秒后彻底消失
            if (performance.now() - searchStartTime < 3000) {
              m.y = -rand(50, 250);
              m.curOpacity = m.baseOpacity;
            } else {
              m.curOpacity = 0;
              m.el.style.opacity = '0';
            }
          } else {
            // 回收后重新进入：给个小随机延迟，避免多片叶子同时从顶部进入造成集中
            m.y = -rand(80, 260);
            const sourceIdx = getSourceIdx(m.card);
            const sourceCount = getSourceCount();
            m.x = getXForLayer(m.layerIdx, m.card, sourceIdx, sourceCount);
            m.fadeInT = 600;
            m.curOpacity = 0;
            // 根据当前屏幕可见叶子数估算错开延迟
            const visibleCount = motions.filter(x => !x.flyAway && x.y > -100 && x.y < vh).length;
            const interval = Math.max(400, Math.min(2500, 8000 / Math.max(visibleCount, 1)));
            m.releaseDelay = rand(interval * 0.3, interval);
          }
        }
      });
    }
    tick(performance.now());
  }

  function getSourceIdx(card) {
    if (settings.sort !== 'source') return 0;
    const k = (card.source || '未标注来源').trim() || '未标注来源';
    const list = [];
    const map = {};
    getSortedCards().forEach(c => {
      const ck = (c.source || '未标注来源').trim() || '未标注来源';
      if (!(ck in map)) { map[ck] = list.length; list.push(ck); }
    });
    return map[k] || 0;
  }
  function getSourceCount() {
    if (settings.sort !== 'source') return 1;
    const set = new Set();
    cards.forEach(c => set.add((c.source || '未标注来源').trim() || '未标注来源'));
    return set.size;
  }

  // ---------- 悬停冻结 ----------
  // 悬停：迅速停住 → lerp 摆正 + 放大 + 前置；移开立即恢复自由下落
  leavesContainer.addEventListener('mouseover', (e) => {
    const leaf = e.target.closest('.leaf');
    if (!leaf) return;
    const m = motions.find(x => x.el === leaf);
    if (m && !m.frozen && !m.expanding) {
      m.frozen = true;
      m.el.classList.add('frozen');
    }
  });
  leavesContainer.addEventListener('mouseout', (e) => {
    const leaf = e.target.closest('.leaf');
    if (!leaf) return;
    const related = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.leaf');
    if (related === leaf) return;
    const m = motions.find(x => x.el === leaf);
    if (m && m.frozen) {
      // 立即解冻，恢复自由下落
      m.frozen = false;
      m.el.classList.remove('frozen');
    }
  });

  // ---------- Dock 磁吸放大（MAC 风格：width/height + flexbox 自动推开） ----------
  let dockMouseX = Infinity;
  let dockBaseLayout = null; // 缓存每个控件的基础中心位置和尺寸
  const DOCK_SIGMA = 70;
  const DOCK_MAX_BOOST = 0.6;

  function calcDockBaseLayout() {
    const items = $$('.dock-item');
    // 临时清除内联 width/height 读取基础布局
    const saved = items.map(item => {
      const s = { w: item.style.width, h: item.style.height };
      item.style.width = ''; item.style.height = '';
      return s;
    });
    const layout = items.map(item => {
      const r = item.getBoundingClientRect();
      return { center: r.left + r.width / 2, w: r.width, h: r.height };
    });
    // 恢复
    items.forEach((item, i) => {
      item.style.width = saved[i].w;
      item.style.height = saved[i].h;
    });
    return layout;
  }

  function updateDockMagnify() {
    if (!dockBaseLayout) dockBaseLayout = calcDockBaseLayout();
    const items = $$('.dock-item');
    items.forEach((item, i) => {
      const base = dockBaseLayout[i];
      if (!base) return;
      const dist = Math.abs(dockMouseX - base.center);
      let boost = 0;
      if (dist < DOCK_SIGMA * 3) {
        boost = Math.exp(-(dist * dist) / (2 * DOCK_SIGMA * DOCK_SIGMA)) * DOCK_MAX_BOOST;
      }
      // 用 width/height 增大，flexbox 自动让相邻控件偏移
      item.style.width = (base.w * (1 + boost)) + 'px';
      item.style.height = (base.h * (1 + boost)) + 'px';
    });
  }
  dockPanel.addEventListener('mouseenter', () => {
    dockBaseLayout = calcDockBaseLayout();
  });
  dockPanel.addEventListener('mousemove', (e) => {
    dockMouseX = e.clientX;
    updateDockMagnify();
  });
  dockPanel.addEventListener('mouseleave', () => {
    dockMouseX = Infinity;
    $$('.dock-item').forEach(item => {
      item.style.width = ''; item.style.height = '';
    });
  });

  // ---------- Dock 按钮动作 ----------
  dockPanel.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    sortPop.hidden = true;
    atmospherePop.hidden = true;
    if (act === 'search') toggleSearch();
    else if (act === 'sort') sortPop.hidden = false;
    else if (act === 'atmosphere') atmospherePop.hidden = false;
    else if (act === 'manage') toggleManage();
    else if (act === 'new') openEdit(null);
  });

  function toggleSearch() {
    if (dockSearch.hidden) {
      dockSearch.hidden = false;
      searchInput.focus();
    } else {
      dockSearch.hidden = true;
      searchInput.value = '';
      currentQuery = '';
      applySearchFilter();
    }
  }

  // ---------- 搜索 ----------
  let searchTimer = null;
  searchInput.addEventListener('input', (e) => {
    currentQuery = e.target.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applySearchFilter, 120);
  });

  // 六角密堆积位置计算：命中的叶子堆积在屏幕底部
  function computeHexPack(count) {
    const positions = [];
    if (count === 0) return positions;
    const s = 0.6;                  // 堆积时统一 scale
    const leafW = 300 * s;          // 缩小后宽 180
    const leafH = 360 * s;          // 缩小后高 216
    const dx = leafW;               // 水平间距
    const dy = leafH * 0.866;       // 六角密堆积垂直间距 = h·sin60°
    const cols = Math.max(1, Math.floor((vw - 40) / dx));
    const startX = (vw - cols * dx) / 2;
    const bottomY = vh - 160;      // 距底部 160px，避开 Dock 栏遮挡
    let row = 0, col = 0;
    for (let i = 0; i < count; i++) {
      const offsetX = (row % 2) * dx / 2; // 奇数行偏移半宽
      const centerX = startX + col * dx + offsetX + dx / 2;
      const centerY = bottomY - row * dy - dy / 2;
      // 转为 translate3d 值（左上角，考虑 scale 以中心缩放）
      positions.push({ x: centerX - 150 * s, y: centerY - 180 * s });
      col++;
      if (col >= cols - (row % 2)) { col = 0; row++; }
    }
    return positions;
  }

  let prevHasQuery = false;
  function applySearchFilter() {
    const q = currentQuery.trim().toLowerCase();
    const hasQuery = !!q;
    // 仅在搜索从"无→有"时重置未命中叶子位置，避免打字时乱闪
    const justStarted = hasQuery && !prevHasQuery;
    if (justStarted) searchStartTime = performance.now();
    prevHasQuery = hasQuery;
    const matchedMotions = [];
    motions.forEach(m => {
      const matched = !hasQuery || matchCard(m.card, q);
      const wasHidden = m.searchHidden;
      m.searchMatched = matched;
      m.searchHidden = !matched && hasQuery;
      m.el.classList.toggle('search-hidden', m.searchHidden);
      m.el.classList.toggle('matched', hasQuery && matched);
      // 重置堆积状态（搜索变化时重新堆积）
      m.hexTarget = null;
      m.hexSettled = false;
      // 仅在刚开始搜索时，将未命中叶子重置到屏幕上方
      if (justStarted && m.searchHidden && m.y > 0) {
        m.y = -rand(50, 250);
        m.curOpacity = m.baseOpacity;
      }
      updateLeafContent(m, q);
      if (matched && hasQuery) matchedMotions.push(m);
    });
    // 为命中的叶子分配六角堆积位置
    if (hasQuery && matchedMotions.length > 0) {
      const positions = computeHexPack(matchedMotions.length);
      matchedMotions.forEach((m, i) => {
        m.hexTarget = positions[i] || positions[positions.length - 1];
      });
    }
    // 空状态
    if (hasQuery && matchedMotions.length === 0) {
      emptyState.hidden = false;
      emptyState.querySelector('p').textContent = '这片林子里没找到哦';
      emptyState.querySelector('span').textContent = '试试其他关键词？';
    } else if (cards.length > 0) {
      emptyState.hidden = true;
      emptyState.querySelector('p').textContent = '这片林子还空着';
      emptyState.querySelector('span').textContent = '点底部的「+ 新建」让第一片叶子飘进来';
    }
  }

  function matchCard(c, q) {
    return (c.title || '').toLowerCase().includes(q) ||
      (c.body || '').toLowerCase().includes(q) ||
      (c.source || '').toLowerCase().includes(q) ||
      (c.tags || []).some(t => String(t).toLowerCase().includes(q));
  }

  function updateLeafContent(m, q) {
    const card = m.card;
    const titleEl = m.el.querySelector('.leaf-title');
    const bodyEl = m.el.querySelector('.leaf-body');
    const sourceEl = m.el.querySelector('.leaf-source');
    if (titleEl) titleEl.innerHTML = highlight(card.title, q);
    if (bodyEl) bodyEl.innerHTML = highlight(card.body, q);
    if (sourceEl) sourceEl.innerHTML = highlight(card.source || '', q);
  }

  // ---------- 排序切换 ----------
  sortPop.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sort]');
    if (!btn) return;
    settings.sort = btn.dataset.sort;
    saveSettings();
    sortPop.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
    sortPop.hidden = true;
    renderStage();
  });

  // ---------- 氛围切换 ----------
  atmospherePop.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-atmosphere]');
    if (!btn) return;
    settings.atmosphere = btn.dataset.atmosphere;
    saveSettings();
    applyAtmosphere();
    atmospherePop.hidden = true;
  });
  function applyAtmosphere() {
    document.body.dataset.atmosphere = settings.atmosphere;
    atmospherePop.querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', b.dataset.atmosphere === settings.atmosphere);
    });
  }

  // 点击外部关闭气泡
  document.addEventListener('click', (e) => {
    if (!sortPop.hidden && !e.target.closest('[data-act="sort"]') && !e.target.closest('#sortPop')) sortPop.hidden = true;
    if (!atmospherePop.hidden && !e.target.closest('[data-act="atmosphere"]') && !e.target.closest('#atmospherePop')) atmospherePop.hidden = true;
  });

  // ---------- 详情弹窗 ----------
  // 点击叶子：移到屏幕正中 → 放大覆盖全屏 → 展开菜单
  let expandingMotion = null;
  function expandLeafToFullscreen(id) {
    const m = motions.find(x => x.card.id === id);
    if (!m || m.expanding) return;
    expandingMotion = m;
    m.expanding = true;
    m.frozen = true;
    m.el.classList.add('expanding', 'frozen');

    const leafW = 300; // 固定布局尺寸（不受 transform 影响）
    const leafH = 360;
    // 直接读取当前窗口尺寸，避免全局变量过期
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const s = Math.max(cw / leafW, ch / leafH) * 1.6; // 放大系数补偿，确保覆盖全屏
    // 用 transform-origin: 0 0（左上角缩放），坐标计算更直观
    m.el.style.transformOrigin = '0 0';
    const targetX = (cw - leafW * s) / 2;
    const targetY = (ch - leafH * s) / 2;

    m.el.style.zIndex = 10000;
    m.el.style.opacity = '1';
    m.el.style.filter = 'none'; // 移除 drop-shadow 避免影响渲染
    m.el.style.transition = 'none'; // 先清除 transition
    void m.el.offsetWidth; // 强制重排
    // 双重 rAF 确保浏览器记录起始状态后再设置目标
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        m.el.style.transition = 'transform 0.65s cubic-bezier(.2,.7,.3,1), opacity 0.5s';
        m.el.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) rotate(0deg) scale(${s})`;
      });
    });
    // transition 0.65s 完成后打开详情
    setTimeout(() => openDetail(id), 720);
  }

  function openDetail(id) {
    const c = cards.find(x => x.id === id);
    if (!c) return;
    $('#detailTitle').innerHTML = highlight(c.title, currentQuery);
    $('#detailBody').innerHTML = highlight(c.body, currentQuery);
    $('#detailSource').textContent = c.source || '未标注';
    $('#detailTime').textContent = `创建 ${fmtDate(c.createdAt)} · 修改 ${fmtDate(c.updatedAt)}`;
    const tagsEl = $('#detailTags');
    tagsEl.innerHTML = (c.tags || []).length
      ? c.tags.map(t => `<span class="detail-tag">${esc(t)}</span>`).join('')
      : '<span style="color:var(--ink-3);font-size:13px">无标签</span>';

    // 角落装饰叶片
    const leaf = c.leaf || leafFromTags(c.tags);
    $('#detailLeafCorner').innerHTML = `<svg viewBox="0 0 100 120">${leafSvgInner(leaf.type, leaf.color)}</svg>`;

    detailOverlay.dataset.id = id;
    detailOverlay.hidden = false;
  }
  function closeDetail() {
    detailOverlay.hidden = true;
    // 恢复展开全屏的叶子回原位
    if (expandingMotion) {
      const m = expandingMotion;
      void m.el.offsetWidth;
      m.el.style.transformOrigin = ''; // 恢复默认
      m.el.style.filter = ''; // 恢复 drop-shadow
      m.el.style.transform = `translate3d(${m.x}px, ${m.y}px, 0) rotate(${m.rot}deg) scale(${m.curScale})`;
      m.el.style.opacity = m.curOpacity;
      setTimeout(() => {
        m.el.style.transition = '';
        m.expanding = false;
        m.el.classList.remove('expanding');
        m.frozen = false;
        m.el.classList.remove('frozen');
        expandingMotion = null;
      }, 700);
    }
  }

  $('#detailEditBtn').addEventListener('click', () => {
    const id = detailOverlay.dataset.id;
    closeDetail();
    openEdit(id);
  });
  $('#detailDeleteBtn').addEventListener('click', () => {
    const id = detailOverlay.dataset.id;
    closeDetail();
    askDelete(id);
  });

  // ---------- 编辑/新建 ----------
  function openEdit(id) {
    editingId = id || null;
    const c = id ? cards.find(x => x.id === id) : null;
    $('#editHeading').textContent = id ? '编辑这片叶' : '新建一片叶';

    cardForm.title.value = c?.title || '';
    cardForm.body.value = c?.body || '';
    cardForm.source.value = c?.source || '';
    formTags = c ? [...(c.tags || [])] : [];

    const leaf = c?.leaf || leafFromTags([]);
    formLeafType = leaf.type;
    formLeafColor = leaf.color;
    cardForm.color.value = leaf.color;
    autoLeafCheck.checked = !c; // 新建默认自动

    renderTags();
    renderLeafTypeButtons();
    renderPresetColors();
    updatePreview();
    editOverlay.hidden = false;
    setTimeout(() => cardForm.title.focus(), 50);
  }
  function closeEdit() {
    editOverlay.hidden = true;
    editingId = null;
    formTags = [];
  }

  function renderTags() {
    tagsBox.innerHTML = formTags.map((t, i) =>
      `<span class="tag-chip">${esc(t)}<button type="button" data-i="${i}" aria-label="移除">×</button></span>`
    ).join('');
    tagsBox.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        formTags.splice(parseInt(b.dataset.i, 10), 1);
        renderTags();
        if (autoLeafCheck.checked) autoSelectLeaf();
        updatePreview();
      });
    });
  }
  tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const v = tagInput.value.trim();
      if (v && !formTags.includes(v)) {
        formTags.push(v);
        renderTags();
        if (autoLeafCheck.checked) autoSelectLeaf();
        updatePreview();
      }
      tagInput.value = '';
    } else if (e.key === 'Backspace' && !tagInput.value && formTags.length) {
      formTags.pop();
      renderTags();
      if (autoLeafCheck.checked) autoSelectLeaf();
      updatePreview();
    }
  });

  // 生成 6 种叶型选择按钮（HTML 中 leafTypeRow 原为空）
  function buildLeafTypeButtons() {
    leafTypeRow.innerHTML = LEAF_TYPES.map(type => {
      const isActive = type === formLeafType;
      const color = isActive ? formLeafColor : '#a08566';
      return `<button type="button" class="leaf-type-btn${isActive ? ' active' : ''}" data-type="${type}" aria-label="${type}">
        <svg viewBox="0 0 100 120">${leafSvgInner(type, color)}</svg>
      </button>`;
    }).join('');
  }
  function renderLeafTypeButtons() {
    leafTypeRow.querySelectorAll('.leaf-type-btn').forEach(b => {
      const isActive = b.dataset.type === formLeafType;
      b.classList.toggle('active', isActive);
      // 重新渲染 SVG 内联 path 以更新叶身颜色
      const color = isActive ? formLeafColor : '#a08566';
      const svg = b.querySelector('svg');
      if (svg) svg.innerHTML = leafSvgInner(b.dataset.type, color);
    });
  }
  leafTypeRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.leaf-type-btn');
    if (!btn) return;
    formLeafType = btn.dataset.type;
    autoLeafCheck.checked = false;
    renderLeafTypeButtons();
    updatePreview();
  });

  function renderPresetColors() {
    presetColorsEl.innerHTML = PRESET_COLORS.map(c =>
      `<button type="button" class="preset-color${c === formLeafColor ? ' active' : ''}" data-c="${c}" style="background:${c}" title="${c}"></button>`
    ).join('');
    presetColorsEl.querySelectorAll('.preset-color').forEach(b => {
      b.addEventListener('click', () => {
        formLeafColor = b.dataset.c;
        cardForm.color.value = formLeafColor;
        autoLeafCheck.checked = false;
        renderPresetColors();
        renderLeafTypeButtons();
        updatePreview();
      });
    });
  }
  cardForm.color.addEventListener('input', () => {
    formLeafColor = cardForm.color.value;
    autoLeafCheck.checked = false;
    renderPresetColors();
    renderLeafTypeButtons();
    updatePreview();
  });
  autoLeafCheck.addEventListener('change', () => {
    if (autoLeafCheck.checked) autoSelectLeaf();
    updatePreview();
  });

  function autoSelectLeaf() {
    const l = leafFromTags(formTags);
    formLeafType = l.type;
    formLeafColor = l.color;
    cardForm.color.value = l.color;
    renderLeafTypeButtons();
    renderPresetColors();
  }

  function updatePreview() {
    const leaf = { type: formLeafType, color: formLeafColor };
    previewLeaf.innerHTML = `
      <svg class="leaf-shape" viewBox="0 0 100 120" preserveAspectRatio="none">
        ${leafSvgInner(leaf.type, leaf.color)}
      </svg>
      <div class="pl-content">
        <h3 class="pl-title">${esc(cardForm.title.value || '标题预览')}</h3>
        <p class="pl-body">${esc(cardForm.body.value || '正文预览内容…')}</p>
      </div>
    `;
  }
  cardForm.title.addEventListener('input', updatePreview);
  cardForm.body.addEventListener('input', updatePreview);

  cardForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      title: cardForm.title.value,
      body: cardForm.body.value,
      source: cardForm.source.value,
      tags: formTags.slice(),
      leaf: { type: formLeafType, color: formLeafColor },
    };
    if (!data.title.trim() || !data.body.trim()) {
      showToast('标题和正文不能为空');
      return;
    }
    if (editingId) {
      updateCard(editingId, data);
      updateLeafCard(data); // 只更新该叶子内容，不重建舞台
      showToast('已更新这一片');
    } else {
      addCard(data);
      appendLeaf(data); // 只追加新叶，不重建舞台
      showToast('一片新叶已入林 🍂');
    }
    closeEdit();
    renderManageGrid();
  });

  // ---------- 删除确认 ----------
  function askDelete(id) {
    pendingDeleteId = id;
    confirmOverlay.hidden = false;
  }
  $('#confirmYes').addEventListener('click', () => {
    if (pendingDeleteId) {
      const id = pendingDeleteId;
      pendingDeleteId = null;
      confirmOverlay.hidden = true;
      if (!detailOverlay.hidden) closeDetail();
      // 先播放飘走动画，完成后再删除
      flyAwayAndDelete(id);
    } else {
      confirmOverlay.hidden = true;
    }
  });
  // 叶子飘走动画：加速向右上方旋转飘出 + 淡出，完成后删除数据
  function flyAwayAndDelete(id) {
    const m = motions.find(x => x.card && x.card.id === id);
    if (!m) { removeCard(id); detachMotion(id); renderManageGrid(); showToast('叶子已飘落 🍂'); return; }
    m.flyAway = true;
    m.frozen = true;
    // 飘走方向：右上方，随机角度
    m.flyVx = rand(2, 5);
    m.flyVy = -rand(3, 7);
    m.flyRot = rand(3, 8);
    m.flyOpacity = 1;
    showToast('叶子已飘落 🍂');
    // 1.2 秒后真正删除（只移除该叶子，不重建舞台）
    setTimeout(() => {
      removeCard(id);
      detachMotion(id);
      renderManageGrid();
    }, 1200);
  }
  $('#confirmNo').addEventListener('click', () => {
    pendingDeleteId = null;
    confirmOverlay.hidden = true;
  });

  // ---------- 管理面板 ----------
  function toggleManage() {
    if (managePanel.hidden) openManage(); else closeManage();
  }
  function openManage() {
    managePanel.hidden = false;
    manageQuery = '';
    $('#manageSearch').value = '';
    renderManageGrid();
  }
  function closeManage() { managePanel.hidden = true; }
  function renderManageGrid() {
    const grid = $('#manageGrid');
    if (managePanel.hidden) return;
    const list = filterCards(getSortedCards(), manageQuery);
    if (list.length === 0) {
      grid.innerHTML = `<div class="manage-empty">${cards.length === 0 ? '还没有叶子' : '没有匹配的叶子'}</div>`;
      return;
    }
    grid.innerHTML = '';
    list.forEach(c => {
      const leaf = c.leaf || leafFromTags(c.tags);
      const el = document.createElement('div');
      el.className = 'm-card';
      el.innerHTML = `
        <div class="m-leaf">
          <svg viewBox="0 0 100 120">${leafSvgInner(leaf.type, leaf.color)}</svg>
        </div>
        <div class="m-info">
          <div class="m-title">${highlight(c.title, manageQuery)}</div>
          <div class="m-body">${highlight(c.body, manageQuery)}</div>
          ${(c.tags || []).length ? `<div class="m-tags">${c.tags.map(t => `<span class="m-tag">${esc(t)}</span>`).join('')}</div>` : ''}
          <div class="m-meta">
            <span class="m-source">${c.source ? highlight(c.source, manageQuery) : '未标注'}</span>
            <span>${fmtDate(c.updatedAt).slice(0, 10)}</span>
          </div>
          <div class="m-actions">
            <button type="button" data-act="view">查看</button>
            <button type="button" data-act="edit">编辑</button>
            <button type="button" class="m-del" data-act="delete">删除</button>
          </div>
        </div>
      `;
      el.querySelectorAll('[data-act]').forEach(b => {
        b.addEventListener('click', () => {
          const act = b.dataset.act;
          if (act === 'view') openDetail(c.id);
          else if (act === 'edit') openEdit(c.id);
          else if (act === 'delete') askDelete(c.id);
        });
      });
      grid.appendChild(el);
    });
  }
  function filterCards(list, query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return list;
    return list.filter(c => matchCard(c, q));
  }
  $('#manageSearch').addEventListener('input', (e) => {
    manageQuery = e.target.value;
    renderManageGrid();
  });

  // ---------- Toast ----------
  let toastTimer = null;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2200);
  }

  // ---------- 通用关闭 ----------
  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-close-detail]') || e.target === detailOverlay) closeDetail();
    if (e.target.matches('[data-close-edit]') || e.target === editOverlay) closeEdit();
    if (e.target.matches('[data-close-manage]')) closeManage();
    if (e.target === confirmOverlay) { pendingDeleteId = null; confirmOverlay.hidden = true; }
  });

  // ---------- 键盘 ----------
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!confirmOverlay.hidden) { $('#confirmNo').click(); return; }
      if (!editOverlay.hidden) { closeEdit(); return; }
      if (!detailOverlay.hidden) { closeDetail(); return; }
      if (!managePanel.hidden) { closeManage(); return; }
      if (!sortPop.hidden) { sortPop.hidden = true; return; }
      if (!atmospherePop.hidden) { atmospherePop.hidden = true; return; }
      if (!dockSearch.hidden) { toggleSearch(); return; }
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault(); openEdit(null);
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      if (dockSearch.hidden) toggleSearch();
      else searchInput.focus();
    }
  });

  // ---------- 窗口尺寸 ----------
  window.addEventListener('resize', () => {
    vh = window.innerHeight;
    vw = window.innerWidth;
  });

  // ---------- 风向周期切换 ----------
  setInterval(() => {
    windTarget = (Math.random() - 0.5) * 50;
  }, WIND_CHANGE_INTERVAL);

  // ---------- 初始化 ----------
  function seedIfEmpty() {
    if (cards.length > 0) return;
    const now = Date.now();
    const samples = [
      { title: '关于专注', body: '你不必把每件事都做完，只需要把重要的事做完。专注不是同时做很多事，而是敢于一次只做一件事。', source: '《深度工作》', tags: ['语录', '读书'] },
      { title: '灵感的保质期', body: '灵感像闪电，来时不打招呼，走时不留痕迹。它唯一的敌人不是批评，而是「等一下再记」。', source: '随手记', tags: ['灵感'] },
      { title: '慢慢来', body: '慢慢来，比较快。所有看起来毫不费力的事，背后都是反复的打磨。', source: '某本书的扉页', tags: ['摘抄'] },
      { title: '关于写作', body: '写不出来的时候，就先写一句废话。运动起来的笔，比空想更快抵达句子。', source: '写作笔记', tags: ['写作'] },
      { title: '秋日小记', body: '秋风起时，把脑子里的句子都抖一抖，落叶一样铺满桌面，再一片片拾起。', source: '自己', tags: ['灵感', '秋'] },
      { title: '一句喜欢的话', body: '愿你有前进一寸的勇气，亦有后退一尺的从容。', source: '网络', tags: ['语录'] },
    ];
    samples.forEach((s, i) => {
      cards.push({
        id: uid(),
        ...s,
        leaf: leafFromTags(s.tags),
        createdAt: now - i * 86400000,
        updatedAt: now - i * 3600000,
      });
    });
    saveCards();
  }

  function init() {
    cards = loadCards();
    settings = loadSettings();
    applyAtmosphere();

    // 排序按钮初始
    sortPop.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.sort === settings.sort));

    // 生成叶型选择按钮（HTML 中为空）
    buildLeafTypeButtons();

    seedIfEmpty();
    renderStage();
    startLoop();
  }

  init();
})();
