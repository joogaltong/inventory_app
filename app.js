const refs = {
  appShell: document.querySelector(".app-shell"),
  authGate: document.getElementById("auth-gate"),
  authForm: document.getElementById("auth-form"),
  authUsername: document.getElementById("auth-username"),
  authPassword: document.getElementById("auth-password"),
  authStatus: document.getElementById("auth-status"),

  screenTitle: document.getElementById("screen-title"),
  todayBadge: document.getElementById("today-badge"),

  nav: document.getElementById("bottom-nav"),
  navButtons: Array.from(document.querySelectorAll(".nav-btn")),
  views: Array.from(document.querySelectorAll(".view")),
  quickButtons: Array.from(document.querySelectorAll("[data-go-view]")),

  statItems: document.getElementById("stat-items"),
  statTotal: document.getElementById("stat-total"),
  statIn: document.getElementById("stat-in"),
  statOut: document.getElementById("stat-out"),

  lowList: document.getElementById("low-list"),
  lowEmpty: document.getElementById("low-empty"),

  txForm: document.getElementById("tx-form"),
  txItem: document.getElementById("tx-item"),
  txType: document.getElementById("tx-type"),
  txQty: document.getElementById("tx-qty"),
  txDate: document.getElementById("tx-date"),
  txRack: document.getElementById("tx-rack"),
  scanRackBtn: document.getElementById("scan-rack-btn"),
  txBarcode: document.getElementById("tx-barcode"),
  scanBarcodeBtn: document.getElementById("scan-barcode-btn"),
  txNote: document.getElementById("tx-note"),
  txFormStatus: document.getElementById("tx-form-status"),
  txSearch: document.getElementById("tx-search"),
  txFilter: document.getElementById("tx-filter"),
  txList: document.getElementById("tx-list"),
  txEmpty: document.getElementById("tx-empty"),

  stockBody: document.getElementById("stock-body"),
  stockEmpty: document.getElementById("stock-empty"),
  stockSearch: document.getElementById("stock-search"),
  stockZoneFilter: document.getElementById("stock-zone-filter"),

  exportBtn: document.getElementById("export-json-btn"),
  importFile: document.getElementById("import-json-file"),
  clearBtn: document.getElementById("clear-data-btn"),
  logoutBtn: document.getElementById("logout-btn"),
  settingsStatus: document.getElementById("settings-status"),

  companyExcelFile: document.getElementById("company-excel-file"),
  exportCompanyBtn: document.getElementById("export-company-btn"),
  exportCompanyZonesBtn: document.getElementById("export-company-zones-btn"),
  companyStatus: document.getElementById("company-status"),

  gsheetUrl: document.getElementById("gsheet-url"),
  gsheetSyncBtn: document.getElementById("gsheet-sync-btn"),
  gsheetCsvFile: document.getElementById("gsheet-csv-file"),
  gsheetStatus: document.getElementById("gsheet-status"),

  scannerModal: document.getElementById("barcode-scanner-modal"),
  scannerTitle: document.getElementById("scanner-title"),
  scannerVideo: document.getElementById("scanner-video"),
  scannerStatus: document.getElementById("scanner-status"),
  scannerCloseBtn: document.getElementById("scanner-close-btn"),
};

const KEYS = {
  tx: "inventory_v2_transactions",
  min: "inventory_v2_min_stock",
  baseline: "inventory_v2_baseline_4danji",
  templateMeta: "inventory_v2_company_template_meta",
  templateBlobB64: "inventory_v2_company_template_b64",
  gsheetUrl: "inventory_v2_google_sheet_url",
  authSession: "inventory_v2_auth_session",
  view: "inventory_v2_active_view",
  legacyTx: "inventory_app_transactions_v1",
  legacyMin: "inventory_app_min_stock_v1",
  legacyBaseline: "inventory_app_baseline_stock_v1",
};

const COMPANY_TEMPLATE_DB = {
  name: "inventory_v2_db",
  version: 1,
  store: "binary_assets",
  templateKey: "company_4danji_template",
};

const VIEW_LABELS = {
  home: "홈",
  records: "기록",
  stock: "재고",
  settings: "설정",
};
const VIEW_ORDER = Object.keys(VIEW_LABELS);
const APP_TITLE = "올파포 4단지 재고관리";
const VISIBLE_CATEGORIES = ["미화용품", "세제", "소모품"];
const VISIBLE_CATEGORY_KEYS = new Set(VISIBLE_CATEGORIES.map((v) => normalizeText(v)));
const STOCK_ZONES = ["전체", "피트니스", "게스트하우스", "계단실"];
const DEFAULT_SCAN_FORMATS = [
  "code_128",
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "codabar",
  "qr_code",
];

const APP_CONFIG = window.APP_CONFIG && typeof window.APP_CONFIG === "object" ? window.APP_CONFIG : {};
const AUTH_CONFIG = APP_CONFIG.auth && typeof APP_CONFIG.auth === "object" ? APP_CONFIG.auth : {};
const CLOUD_CONFIG = APP_CONFIG.cloudSync && typeof APP_CONFIG.cloudSync === "object" ? APP_CONFIG.cloudSync : {};
const SUPABASE_CONFIG = APP_CONFIG.supabase && typeof APP_CONFIG.supabase === "object" ? APP_CONFIG.supabase : {};

const AUTH_USERS = Array.isArray(AUTH_CONFIG.users)
  ? AUTH_CONFIG.users
      .map((row) => ({
        username: String(row?.username || "").trim(),
        password: String(row?.password || ""),
      }))
      .filter((row) => row.username && row.password)
  : [];
const AUTH_SESSION_HOURS = Math.max(1, Number(AUTH_CONFIG.sessionHours || 72));
const AUTH_ENABLED = Boolean(AUTH_CONFIG.enabled && AUTH_USERS.length);

const SUPABASE_PROJECT_REF = String(SUPABASE_CONFIG.projectRef || "").trim();
const SUPABASE_PROJECT_URL = String(
  SUPABASE_CONFIG.projectUrl || (SUPABASE_PROJECT_REF ? `https://${SUPABASE_PROJECT_REF}.supabase.co` : "")
)
  .trim()
  .replace(/\/+$/, "");
const SUPABASE_ANON_KEY = String(SUPABASE_CONFIG.anonKey || "").trim();
const SUPABASE_STATE_TABLE = String(SUPABASE_CONFIG.stateTable || "inventory_state").trim();
const SUPABASE_STATE_ROW_ID = String(SUPABASE_CONFIG.stateRowId || "4danji-main").trim();
const SUPABASE_SYNC_ENABLED = Boolean(
  SUPABASE_CONFIG.enabled && SUPABASE_PROJECT_URL && SUPABASE_ANON_KEY && SUPABASE_STATE_TABLE && SUPABASE_STATE_ROW_ID
);

const CLOUD_SYNC_ENABLED = Boolean(CLOUD_CONFIG.enabled);
const CLOUD_API_BASE = String(CLOUD_CONFIG.baseUrl || "").trim();
const CLOUD_API_TOKEN = String(CLOUD_CONFIG.token || "").trim();
const CLOUD_PULL_ON_INIT = CLOUD_CONFIG.pullOnInit !== false;
const CLOUD_AUTO_PUSH = CLOUD_CONFIG.autoPush !== false;
const CLOUD_PUSH_DEBOUNCE_MS = Math.max(300, Number(CLOUD_CONFIG.pushDebounceMs || 1200));
const CLOUD_REQUEST_TIMEOUT_MS = Math.max(3000, Number(CLOUD_CONFIG.timeoutMs || 15000));
const REMOTE_SYNC_ENABLED = CLOUD_SYNC_ENABLED || SUPABASE_SYNC_ENABLED;

let selectedType = "전체";
let selectedStockZone = "전체";
let companyTemplateBuffer = null;
let cloudHydrated = !REMOTE_SYNC_ENABLED;
let cloudPushInFlight = false;
let cloudPushQueued = false;
let cloudPushTimer = null;
let cloudPushSuspendCount = 0;
let cloudPushHadError = false;
let activeViewName = "home";
let scannerStream = null;
let scannerDetector = null;
let scannerTimer = null;
let scannerDetectBusy = false;
let scannerIsActive = false;
let scannerTarget = "item";

function applySafeAreaFallbackForIOS() {
  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isNativeApp =
    Boolean(window.Capacitor?.isNativePlatform?.()) ||
    Boolean(window.Capacitor && typeof window.Capacitor === "object");

  const rootStyle = document.documentElement.style;
  if (isIOS && isNativeApp) {
    // iOS WebView에서 env(safe-area-inset-top)이 0으로 잡히는 경우를 위한 강제 보정
    rootStyle.setProperty("--safe-top-fallback", "56px");
    rootStyle.setProperty("--safe-bottom-fallback", "20px");
    return;
  }

  rootStyle.setProperty("--safe-top-fallback", "0px");
  rootStyle.setProperty("--safe-bottom-fallback", "0px");
}

function createId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `tx-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function formatDateValue(value) {
  return String(value || "").slice(0, 10);
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()]/g, "");
}

function isVisibleCategory(category) {
  return VISIBLE_CATEGORY_KEYS.has(normalizeText(category));
}

function resolveZoneByRackBarcode(rackBarcode) {
  const text = normalizeText(rackBarcode);
  if (text.includes("guesthouse") || text.includes("guest-house")) return "게스트하우스";
  if (text.includes("b2stairs") || text.includes("stairs") || text.includes("계단")) return "계단실";
  return "피트니스";
}

function levenshteinDistance(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  const m = left.length;
  const n = right.length;
  if (!m) return n;
  if (!n) return m;

  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return dp[n];
}

function nameSimilarityScore(input, candidate) {
  const a = normalizeText(input);
  const b = normalizeText(candidate);
  if (!a || !b) return 0;
  if (a === b) return 1;

  if (a.includes(b) || b.includes(a)) {
    const shortLen = Math.min(a.length, b.length);
    const longLen = Math.max(a.length, b.length);
    const ratio = shortLen / longLen;
    if (shortLen <= 1) return ratio * 0.7;
    if (shortLen === 2) return Math.max(0.78, ratio);
    return Math.max(0.86, ratio);
  }

  const maxLen = Math.max(a.length, b.length);
  const distance = levenshteinDistance(a, b);
  let score = 1 - distance / maxLen;
  if (a[0] === b[0]) score += 0.03;
  return Math.max(0, Math.min(1, score));
}

function findBestNameMatch(input, candidates, { minScore = 0.78, minGap = 0.06 } = {}) {
  const source = Array.isArray(candidates) ? candidates : [];
  let best = null;
  let second = null;

  source.forEach((name, index) => {
    const score = nameSimilarityScore(input, name);
    if (!best || score > best.score) {
      second = best;
      best = { index, name, score };
      return;
    }
    if (!second || score > second.score) {
      second = { index, name, score };
    }
  });

  if (!best || best.score < minScore) return null;
  if (second && best.score - second.score < minGap) return null;
  return best;
}

function getVisibleStockRows(stockRows, { applyZoneFilter = false } = {}) {
  let rows = stockRows.filter((row) => row.qty !== 0 && isVisibleCategory(row.category));
  if (applyZoneFilter && selectedStockZone !== "전체") {
    rows = rows.filter((row) => resolveZoneByRackBarcode(row.rackBarcode) === selectedStockZone);
  }
  return rows;
}

function makeItemKey(item, rackBarcode, itemBarcode) {
  const itemN = normalizeText(item);
  const barcodeN = normalizeText(itemBarcode);

  if (itemN) return `i:${itemN}`;
  return `b:${barcodeN}`;
}

function isAuthEnabled() {
  return AUTH_ENABLED;
}

function setAuthStatus(message, isError = false) {
  if (!refs.authStatus) return;
  const text = String(message || "").trim();
  refs.authStatus.textContent = text;
  refs.authStatus.style.display = text ? "block" : "none";
  refs.authStatus.style.color = isError ? "#ffd7d7" : "#d8fff0";
}

function saveAuthSession(username) {
  saveJSON(
    KEYS.authSession,
    {
      username: String(username || "").trim(),
      issuedAt: new Date().toISOString(),
    },
    { skipSync: true }
  );
}

function clearAuthSession() {
  localStorage.removeItem(KEYS.authSession);
}

function getValidAuthSession() {
  if (!isAuthEnabled()) return { username: "", issuedAt: "" };
  const session = loadJSON(KEYS.authSession, null);
  const username = String(session?.username || "").trim();
  const issuedAt = String(session?.issuedAt || "");
  if (!username || !issuedAt) return null;

  const matchedUser = AUTH_USERS.find((row) => row.username === username);
  if (!matchedUser) return null;

  const issuedAtMs = Date.parse(issuedAt);
  if (!Number.isFinite(issuedAtMs)) return null;
  const ageMs = Date.now() - issuedAtMs;
  if (ageMs < 0) return null;
  if (ageMs > AUTH_SESSION_HOURS * 60 * 60 * 1000) return null;
  return { username, issuedAt };
}

function setAuthGateVisible(isVisible) {
  if (!refs.authGate) return;
  const visible = Boolean(isVisible);
  refs.authGate.classList.toggle("is-active", visible);
  refs.authGate.setAttribute("aria-hidden", visible ? "false" : "true");
  document.body.classList.toggle("auth-locked", visible);
}

function ensureAuthGateState() {
  if (!isAuthEnabled()) {
    setAuthGateVisible(false);
    if (refs.logoutBtn) refs.logoutBtn.style.display = "none";
    return;
  }

  if (refs.logoutBtn) refs.logoutBtn.style.display = "inline-flex";
  const validSession = getValidAuthSession();
  if (validSession) {
    setAuthGateVisible(false);
    setAuthStatus("");
    return;
  }

  clearAuthSession();
  setAuthStatus("");
  setAuthGateVisible(true);
  window.requestAnimationFrame(() => {
    refs.authUsername?.focus();
  });
}

function attemptLogin(username, password) {
  const user = String(username || "").trim();
  const pass = String(password || "");
  if (!user || !pass) return false;

  const matched = AUTH_USERS.find((row) => row.username === user && row.password === pass);
  if (!matched) return false;

  saveAuthSession(matched.username);
  setAuthGateVisible(false);
  setAuthStatus("");
  if (refs.authForm) refs.authForm.reset();
  setSettingsStatus(`로그인됨: ${matched.username}`);
  return true;
}

function isCloudSyncEnabled() {
  return CLOUD_SYNC_ENABLED;
}

function isSupabaseSyncEnabled() {
  return SUPABASE_SYNC_ENABLED;
}

function isRemoteSyncEnabled() {
  return REMOTE_SYNC_ENABLED;
}

function getDefaultGoogleSheetUrl() {
  return String(APP_CONFIG.defaultGoogleSheetUrl || "").trim();
}

function buildApiUrl(endpoint) {
  const path = String(endpoint || "").trim();
  if (!path) return "/";
  if (/^https?:\/\//i.test(path)) return path;
  if (!CLOUD_API_BASE) return path;
  const base = CLOUD_API_BASE.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function buildSupabaseUrl(endpoint) {
  const path = String(endpoint || "").trim();
  if (!path) return SUPABASE_PROJECT_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SUPABASE_PROJECT_URL}${normalizedPath}`;
}

function withCloudPushSuspended(callback) {
  cloudPushSuspendCount += 1;
  try {
    return callback();
  } finally {
    cloudPushSuspendCount = Math.max(0, cloudPushSuspendCount - 1);
  }
}

function loadGsheetUrl() {
  const saved = localStorage.getItem(KEYS.gsheetUrl);
  if (saved && saved.trim()) return saved.trim();
  return getDefaultGoogleSheetUrl();
}

function saveGsheetUrl(url, { skipSync = false } = {}) {
  const value = String(url || "").trim();
  localStorage.setItem(KEYS.gsheetUrl, value);
  if (!skipSync) scheduleCloudPush("gsheet-url");
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutMs = Math.max(1000, Number(options.timeoutMs || CLOUD_REQUEST_TIMEOUT_MS));
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const { timeoutMs: _timeoutMs, ...rest } = options;
    return await fetch(url, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function apiFetch(endpoint, options = {}) {
  const headers = new Headers(options.headers || {});
  if (CLOUD_API_TOKEN) headers.set("X-App-Token", CLOUD_API_TOKEN);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetchWithTimeout(buildApiUrl(endpoint), { ...options, headers });
}

async function supabaseFetch(endpoint, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("apikey", SUPABASE_ANON_KEY);
  headers.set("Authorization", `Bearer ${SUPABASE_ANON_KEY}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetchWithTimeout(buildSupabaseUrl(endpoint), { ...options, headers });
}

function parseSupabaseError(payload, status) {
  if (payload && typeof payload === "object") {
    const message = payload.message || payload.error || payload.error_description || payload.hint;
    if (message) return String(message);
  }
  return `HTTP ${status}`;
}

function normalizeMinStockMap(value) {
  if (!value || typeof value !== "object") return {};
  const out = {};
  Object.entries(value).forEach(([key, raw]) => {
    const mapKey = String(key || "").trim();
    if (!mapKey) return;
    const number = Math.max(0, Math.floor(Number(raw || 0)));
    if (!Number.isFinite(number)) return;
    out[mapKey] = number;
  });
  return out;
}

function getStatePayloadForServer() {
  const templateMeta = loadJSON(KEYS.templateMeta, null);
  return {
    transactions: loadTransactions(),
    minStock: loadMinStockMap(),
    baseline: loadBaselineRows(),
    activeView: normalizeView(localStorage.getItem(KEYS.view) || "home"),
    gsheetUrl: loadGsheetUrl(),
    templateMeta: templateMeta && typeof templateMeta === "object" ? templateMeta : null,
  };
}

function applyServerStateToLocal(serverState) {
  const tx = Array.isArray(serverState?.transactions) ? serverState.transactions.map(sanitizeTransaction).filter(Boolean) : [];
  const baseline = Array.isArray(serverState?.baseline)
    ? serverState.baseline
        .map((row) => ({
          item: String(row?.item || "").trim(),
          category: String(row?.category || "").trim(),
          qty: Number(row?.qty || 0),
          rackBarcode: String(row?.rackBarcode || "").trim(),
          itemBarcode: String(row?.itemBarcode || "").trim(),
        }))
        .filter((row) => row.item)
    : [];
  const minStock = normalizeMinStockMap(serverState?.minStock);
  const activeView = normalizeView(serverState?.activeView || "home");
  const gsheetUrl = String(serverState?.gsheetUrl || "").trim();
  const templateMeta = serverState?.templateMeta && typeof serverState.templateMeta === "object" ? serverState.templateMeta : null;

  withCloudPushSuspended(() => {
    saveJSON(KEYS.tx, tx, { skipSync: true });
    saveJSON(KEYS.min, minStock, { skipSync: true });
    saveJSON(KEYS.baseline, baseline, { skipSync: true });
    localStorage.setItem(KEYS.view, activeView);
    saveGsheetUrl(gsheetUrl || getDefaultGoogleSheetUrl(), { skipSync: true });
    if (templateMeta) {
      saveJSON(KEYS.templateMeta, templateMeta, { skipSync: true });
    } else {
      localStorage.removeItem(KEYS.templateMeta);
    }
  });
}

async function pullTemplateFromServer() {
  if (!isCloudSyncEnabled()) return false;
  const response = await apiFetch("/api/template");
  if (response.status === 404) return false;

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok || !payload?.ok || !payload.template_b64) {
    throw new Error(payload?.error || `HTTP ${response.status}`);
  }

  const buffer = base64ToArrayBuffer(payload.template_b64);
  companyTemplateBuffer = buffer.slice(0);
  try {
    await saveCompanyTemplateBuffer(companyTemplateBuffer, payload.meta || {});
  } catch {
    // 로컬 저장 실패여도 메모리에는 유지
  }
  return true;
}

async function pushTemplateToServer(buffer, meta = {}) {
  if (!isCloudSyncEnabled()) return;
  const copied = copyArrayBuffer(buffer);
  if (!copied) return;

  const response = await apiFetch("/api/template", {
    method: "PUT",
    body: JSON.stringify({
      template_b64: arrayBufferToBase64(copied),
      meta,
    }),
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || `HTTP ${response.status}`);
  }
}

async function clearTemplateOnServer() {
  if (!isCloudSyncEnabled()) return;
  const response = await apiFetch("/api/template", { method: "DELETE" });
  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    throw new Error(payload?.error || `HTTP ${response.status}`);
  }
}

function hasLocalStateToSeed(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (Array.isArray(payload.transactions) && payload.transactions.length) return true;
  if (Array.isArray(payload.baseline) && payload.baseline.length) return true;
  if (payload.minStock && typeof payload.minStock === "object" && Object.keys(payload.minStock).length) return true;
  return false;
}

async function pullStateFromSupabase() {
  if (!isSupabaseSyncEnabled()) return { hasRemote: false };
  const endpoint =
    `/rest/v1/${SUPABASE_STATE_TABLE}` +
    `?select=id,state,updated_at` +
    `&id=eq.${encodeURIComponent(SUPABASE_STATE_ROW_ID)}` +
    `&limit=1`;
  const response = await supabaseFetch(endpoint, { method: "GET" });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    throw new Error(parseSupabaseError(payload, response.status));
  }

  const row = Array.isArray(payload) ? payload[0] : null;
  if (!row || !row.state || typeof row.state !== "object") {
    return { hasRemote: false };
  }

  applyServerStateToLocal(row.state);
  refs.gsheetUrl.value = loadGsheetUrl();
  return { hasRemote: true };
}

async function pushStateToSupabase(reason = "local-change") {
  if (!isSupabaseSyncEnabled()) return;
  const row = {
    id: SUPABASE_STATE_ROW_ID,
    state: {
      ...getStatePayloadForServer(),
      _meta: {
        source: "inventory-app",
        reason,
        savedAt: new Date().toISOString(),
      },
    },
    updated_at: new Date().toISOString(),
  };

  const response = await supabaseFetch(`/rest/v1/${SUPABASE_STATE_TABLE}?on_conflict=id`, {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify([row]),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    throw new Error(parseSupabaseError(payload, response.status));
  }
}

async function pullStateFromServer() {
  if (!isRemoteSyncEnabled()) return false;

  if (isSupabaseSyncEnabled()) {
    const pulled = await pullStateFromSupabase();
    if (!pulled.hasRemote) {
      const localPayload = getStatePayloadForServer();
      if (hasLocalStateToSeed(localPayload)) {
        await pushStateToSupabase("seed-local-state");
      }
    }
    cloudHydrated = true;
    return true;
  }

  if (!isCloudSyncEnabled()) return false;
  const response = await apiFetch("/api/state");
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok || !payload?.ok || !payload.state) {
    throw new Error(payload?.error || `HTTP ${response.status}`);
  }

  applyServerStateToLocal(payload.state);
  refs.gsheetUrl.value = loadGsheetUrl();

  const remoteTemplateSavedAt = String(payload.state?.templateMeta?.savedAt || "");
  const localTemplateMeta = loadJSON(KEYS.templateMeta, {});
  const localTemplateSavedAt = String(localTemplateMeta?.savedAt || "");

  if (payload.state?.templateAvailable) {
    const shouldFetchTemplate = !companyTemplateBuffer || remoteTemplateSavedAt !== localTemplateSavedAt;
    if (shouldFetchTemplate) {
      try {
        await pullTemplateFromServer();
      } catch (error) {
        console.warn("[cloud-sync] template pull failed:", error.message || error);
      }
    }
  } else {
    companyTemplateBuffer = null;
    try {
      await clearCompanyTemplateBuffer();
    } catch {
      // 로컬 템플릿 삭제 실패는 무시
    }
  }

  cloudHydrated = true;
  return true;
}

async function pushStateToServer(reason = "local-change") {
  if (!isRemoteSyncEnabled() || !CLOUD_AUTO_PUSH) return;
  if (!cloudHydrated || cloudPushSuspendCount > 0) return;
  if (cloudPushInFlight) {
    cloudPushQueued = true;
    return;
  }

  cloudPushInFlight = true;
  try {
    if (isSupabaseSyncEnabled()) {
      await pushStateToSupabase(reason);
    } else {
      const response = await apiFetch("/api/state", {
        method: "PUT",
        body: JSON.stringify({ state: getStatePayloadForServer(), reason }),
      });
      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || `HTTP ${response.status}`);
      }
    }
    cloudPushHadError = false;
  } catch (error) {
    cloudPushHadError = true;
    console.warn("[cloud-sync] state push failed:", error.message || error);
  } finally {
    cloudPushInFlight = false;
    if (cloudPushQueued) {
      cloudPushQueued = false;
      scheduleCloudPush("queued");
    }
  }
}

function scheduleCloudPush(reason = "local-change") {
  if (!isRemoteSyncEnabled() || !CLOUD_AUTO_PUSH) return;
  if (!cloudHydrated || cloudPushSuspendCount > 0) return;

  cloudPushQueued = true;
  if (cloudPushTimer) clearTimeout(cloudPushTimer);
  cloudPushTimer = setTimeout(() => {
    cloudPushTimer = null;
    if (!cloudPushQueued) return;
    cloudPushQueued = false;
    void pushStateToServer(reason);
  }, CLOUD_PUSH_DEBOUNCE_MS);
}

function loadJSON(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJSON(key, value, { skipSync = false, reason = key } = {}) {
  localStorage.setItem(key, JSON.stringify(value));
  if (!skipSync) scheduleCloudPush(reason);
}

function openCompanyTemplateDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("브라우저에서 IndexedDB를 지원하지 않습니다."));
      return;
    }

    const request = window.indexedDB.open(COMPANY_TEMPLATE_DB.name, COMPANY_TEMPLATE_DB.version);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(COMPANY_TEMPLATE_DB.store)) {
        db.createObjectStore(COMPANY_TEMPLATE_DB.store, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB 열기에 실패했습니다."));
  });
}

function copyArrayBuffer(data) {
  if (data instanceof ArrayBuffer) return data.slice(0);
  if (ArrayBuffer.isView(data)) {
    const { buffer, byteOffset, byteLength } = data;
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }
  return null;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function saveCompanyTemplateBuffer(buffer, meta = {}) {
  const copied = copyArrayBuffer(buffer);
  if (!copied) throw new Error("저장할 기준표 데이터 형식이 올바르지 않습니다.");

  let indexedDbSaved = false;
  let localSaved = false;

  try {
    const db = await openCompanyTemplateDb();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(COMPANY_TEMPLATE_DB.store, "readwrite");
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error || new Error("IndexedDB 저장이 취소되었습니다."));
        tx.onerror = () => reject(tx.error || new Error("IndexedDB 저장에 실패했습니다."));

        tx.objectStore(COMPANY_TEMPLATE_DB.store).put({
          key: COMPANY_TEMPLATE_DB.templateKey,
          buffer: copied,
          savedAt: new Date().toISOString(),
        });
      });
      indexedDbSaved = true;
    } finally {
      db.close();
    }
  } catch {
    indexedDbSaved = false;
  }

  try {
    const b64 = arrayBufferToBase64(copied);
    localStorage.setItem(KEYS.templateBlobB64, b64);
    localSaved = true;
  } catch {
    localSaved = false;
  }

  saveJSON(KEYS.templateMeta, {
    name: String(meta?.name || "").trim(),
    bytes: copied.byteLength,
    savedAt: new Date().toISOString(),
    storage: {
      indexedDb: indexedDbSaved,
      localStorage: localSaved,
    },
  });

  if (!indexedDbSaved && !localSaved) {
    throw new Error("기준표 템플릿 저장에 실패했습니다.");
  }
  return { indexedDbSaved, localSaved };
}

async function loadCompanyTemplateBuffer() {
  try {
    const db = await openCompanyTemplateDb();
    try {
      const record = await new Promise((resolve, reject) => {
        const tx = db.transaction(COMPANY_TEMPLATE_DB.store, "readonly");
        tx.onabort = () => reject(tx.error || new Error("IndexedDB 조회가 취소되었습니다."));
        tx.onerror = () => reject(tx.error || new Error("IndexedDB 조회에 실패했습니다."));

        const request = tx.objectStore(COMPANY_TEMPLATE_DB.store).get(COMPANY_TEMPLATE_DB.templateKey);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error("IndexedDB 조회에 실패했습니다."));
      });

      const loaded = copyArrayBuffer(record?.buffer);
      if (loaded) return loaded;
    } finally {
      db.close();
    }
  } catch {
    // IndexedDB 불가 환경에서는 localStorage 백업 사용
  }

  const b64 = localStorage.getItem(KEYS.templateBlobB64);
  if (!b64) return null;
  try {
    return base64ToArrayBuffer(b64);
  } catch {
    return null;
  }
}

async function ensureCompanyTemplateBufferLoaded() {
  if (companyTemplateBuffer) return true;
  const loaded = await loadCompanyTemplateBuffer();
  if (!loaded) return false;
  companyTemplateBuffer = loaded;
  return true;
}

async function clearCompanyTemplateBuffer() {
  if (window.indexedDB) {
    try {
      const db = await openCompanyTemplateDb();
      try {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(COMPANY_TEMPLATE_DB.store, "readwrite");
          tx.oncomplete = () => resolve();
          tx.onabort = () => reject(tx.error || new Error("IndexedDB 삭제가 취소되었습니다."));
          tx.onerror = () => reject(tx.error || new Error("IndexedDB 삭제에 실패했습니다."));
          tx.objectStore(COMPANY_TEMPLATE_DB.store).delete(COMPANY_TEMPLATE_DB.templateKey);
        });
      } finally {
        db.close();
      }
    } catch {
      // IndexedDB 삭제 실패 시 localStorage 삭제는 계속 진행
    }
  }
  localStorage.removeItem(KEYS.templateBlobB64);
  localStorage.removeItem(KEYS.templateMeta);
}

function sanitizeTransaction(input) {
  const item = String(input?.item || "").trim();
  const type = String(input?.type || "") === "출고" ? "출고" : "입고";
  const qty = Number(input?.qty || 0);
  const date = formatDateValue(input?.date);

  if (!item || !date || !Number.isFinite(qty) || qty <= 0) return null;

  return {
    id: String(input?.id || createId()),
    item,
    category: String(input?.category || "").trim(),
    type,
    qty: Math.floor(qty),
    date,
    rackBarcode: String(input?.rackBarcode || "").trim(),
    itemBarcode: String(input?.itemBarcode || "").trim(),
    note: String(input?.note || "").trim(),
    isInitial: Boolean(input?.isInitial),
  };
}

function loadTransactions() {
  const list = loadJSON(KEYS.tx, []);
  if (!Array.isArray(list)) return [];
  return list.map(sanitizeTransaction).filter(Boolean);
}

function saveTransactions(list) {
  saveJSON(KEYS.tx, list, { reason: "transactions" });
}

function loadMinStockMap() {
  const map = loadJSON(KEYS.min, {});
  return map && typeof map === "object" ? map : {};
}

function saveMinStockMap(map) {
  saveJSON(KEYS.min, map, { reason: "min-stock" });
}

function loadBaselineRows() {
  const rows = loadJSON(KEYS.baseline, []);
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      const item = String(row?.item || "").trim();
      if (!item) return null;
      return {
        item,
        category: String(row?.category || "").trim(),
        qty: Number(row?.qty || 0),
        rackBarcode: String(row?.rackBarcode || "").trim(),
        itemBarcode: String(row?.itemBarcode || "").trim(),
      };
    })
    .filter(Boolean);
}

function saveBaselineRows(rows) {
  saveJSON(KEYS.baseline, rows, { reason: "baseline" });
}

function findBaselineRowByItem(item, baselineRows = loadBaselineRows()) {
  const key = normalizeText(item);
  if (!key) return null;
  return baselineRows.find((row) => normalizeText(row.item) === key) || null;
}

function findBaselineMatch(item, baselineRows = loadBaselineRows(), { allowFuzzy = false } = {}) {
  const exact = findBaselineRowByItem(item, baselineRows);
  if (exact) return { row: exact, matchedBy: "exact", score: 1 };
  if (!allowFuzzy) return null;

  const best = findBestNameMatch(
    item,
    baselineRows.map((row) => row.item),
    { minScore: 0.8, minGap: 0.05 }
  );
  if (!best) return null;

  return {
    row: baselineRows[best.index],
    matchedBy: "fuzzy",
    score: best.score,
  };
}

function buildBarcodeSourceMap(baselineRows, transactions) {
  const source = {};

  baselineRows.forEach((row) => {
    const key = normalizeText(row.item);
    if (!key) return;
    if (!source[key]) source[key] = { rackBarcode: "", itemBarcode: "" };

    const rackBarcode = String(row.rackBarcode || "").trim();
    const itemBarcode = String(row.itemBarcode || "").trim();
    if (rackBarcode && !source[key].rackBarcode) source[key].rackBarcode = rackBarcode;
    if (itemBarcode && !source[key].itemBarcode) source[key].itemBarcode = itemBarcode;
  });

  const orderedTx = [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1));
  orderedTx.forEach((tx) => {
    const key = normalizeText(tx.item);
    if (!key) return;
    if (!source[key]) source[key] = { rackBarcode: "", itemBarcode: "" };

    const rackBarcode = String(tx.rackBarcode || "").trim();
    const itemBarcode = String(tx.itemBarcode || "").trim();
    if (rackBarcode && !source[key].rackBarcode) source[key].rackBarcode = rackBarcode;
    if (itemBarcode && !source[key].itemBarcode) source[key].itemBarcode = itemBarcode;
  });

  return source;
}

function mergeBaselineWithSavedBarcodes(nextRows, previousBaselineRows, transactions) {
  const barcodeSource = buildBarcodeSourceMap(previousBaselineRows, transactions);
  let restoredRackCount = 0;
  let restoredItemCount = 0;

  const mergedRows = nextRows.map((row) => {
    const next = { ...row };
    const key = normalizeText(next.item);
    const source = key ? barcodeSource[key] : null;
    if (!source) return next;

    if (!next.rackBarcode && source.rackBarcode) {
      next.rackBarcode = source.rackBarcode;
      restoredRackCount += 1;
    }
    if (!next.itemBarcode && source.itemBarcode) {
      next.itemBarcode = source.itemBarcode;
      restoredItemCount += 1;
    }
    return next;
  });

  return { rows: mergedRows, restoredRackCount, restoredItemCount };
}

function updateBaselineBarcodeForItem(item, { rackBarcode = "", itemBarcode = "" } = {}) {
  const itemKey = normalizeText(item);
  if (!itemKey) return { updated: false };

  const baselineRows = loadBaselineRows();
  if (!baselineRows.length) return { updated: false };

  let updated = false;
  const nextRows = baselineRows.map((row) => ({ ...row }));
  const target = nextRows.find((row) => normalizeText(row.item) === itemKey);
  if (!target) return { updated: false };

  const nextRackBarcode = String(rackBarcode || "").trim();
  const nextItemBarcode = String(itemBarcode || "").trim();

  if (nextRackBarcode && target.rackBarcode !== nextRackBarcode) {
    target.rackBarcode = nextRackBarcode;
    updated = true;
  }
  if (nextItemBarcode && target.itemBarcode !== nextItemBarcode) {
    target.itemBarcode = nextItemBarcode;
    updated = true;
  }

  if (updated) saveBaselineRows(nextRows);
  return { updated };
}

function applyBaselineBarcodeToTransactions(baselineRows) {
  const transactions = loadTransactions();
  let changed = 0;

  const updated = transactions.map((tx) => {
    const base = findBaselineRowByItem(tx.item, baselineRows);
    if (!base) return tx;

    const next = { ...tx };
    if (!next.category && base.category) next.category = base.category;
    if (!next.rackBarcode && base.rackBarcode) next.rackBarcode = base.rackBarcode;
    if (!next.itemBarcode && base.itemBarcode) next.itemBarcode = base.itemBarcode;

    if (
      next.category !== tx.category ||
      next.rackBarcode !== tx.rackBarcode ||
      next.itemBarcode !== tx.itemBarcode
    ) {
      changed += 1;
    }
    return next;
  });

  if (changed > 0) {
    saveTransactions(updated);
  }
  return changed;
}

function pickField(row, names) {
  for (const name of names) {
    if (!Object.prototype.hasOwnProperty.call(row, name)) continue;
    const value = String(row[name] ?? "").trim();
    if (value) return value;
  }
  return "";
}

function readSheetRowsFromCsvText(csvText) {
  const wb = XLSX.read(csvText, { type: "string" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

function readWorkbookFromArrayBuffer(buffer) {
  return XLSX.read(buffer, {
    type: "array",
    cellStyles: true,
    cellNF: true,
    cellDates: true,
  });
}

function downloadArrayBufferFile(buffer, fileName, mimeType) {
  const blob = new Blob([buffer], {
    type:
      mimeType ||
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toGoogleCsvUrl(rawUrl) {
  const input = String(rawUrl || "").trim();
  if (!input) return "";
  try {
    const url = new URL(input);
    if (!url.hostname.includes("docs.google.com")) return input;
    const match = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return input;
    const sheetId = match[1];
    let gid = url.searchParams.get("gid");
    if (!gid && url.hash.startsWith("#gid=")) gid = url.hash.replace("#gid=", "");
    if (!gid) gid = "0";
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  } catch {
    return input;
  }
}

async function fetchTextWithCorsFallback(url) {
  const primary = await fetch(url);
  if (primary.ok) return await primary.text();

  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const proxied = await fetch(proxyUrl);
  if (proxied.ok) return await proxied.text();
  throw new Error(`HTTP ${primary.status}`);
}

function syncBaselineBarcodeFromRows(rows) {
  const baselineRows = loadBaselineRows();
  if (!baselineRows.length) {
    throw new Error("먼저 4단지 기준표를 불러오세요.");
  }
  const nextBaselineRows = baselineRows.map((row) => ({ ...row }));
  const baselineMap = {};
  nextBaselineRows.forEach((row, idx) => {
    const key = normalizeText(row.item);
    if (key && baselineMap[key] === undefined) baselineMap[key] = idx;
  });

  const unmatched = [];
  let matched = 0;
  let changed = 0;

  rows.forEach((row) => {
    const item = pickField(row, ["품목명", "item", "Item", "상품명"]);
    if (!item) return;
    const rack = pickField(row, ["렉바코드", "rack_barcode", "RackBarcode"]);
    const barcode = pickField(row, ["물품바코드", "item_barcode", "ItemBarcode", "바코드"]);
    if (!rack && !barcode) return;

    const key = normalizeText(item);
    const idx = baselineMap[key];
    if (idx === undefined) {
      unmatched.push({ item, rackBarcode: rack, itemBarcode: barcode });
      return;
    }

    matched += 1;
    const target = nextBaselineRows[idx];
    let rowChanged = false;
    if (rack && target.rackBarcode !== rack) {
      target.rackBarcode = rack;
      rowChanged = true;
    }
    if (barcode && target.itemBarcode !== barcode) {
      target.itemBarcode = barcode;
      rowChanged = true;
    }
    if (rowChanged) changed += 1;
  });

  saveBaselineRows(nextBaselineRows);
  const txUpdated = applyBaselineBarcodeToTransactions(nextBaselineRows);
  return { matched, changed, txUpdated, unmatched };
}

async function syncBarcodeFromGoogleUrl(rawUrl) {
  if (typeof XLSX === "undefined") {
    throw new Error("엑셀/CSV 라이브러리를 불러오지 못했습니다.");
  }
  const url = toGoogleCsvUrl(rawUrl);
  if (!url) throw new Error("구글시트 URL을 입력해 주세요.");
  refs.gsheetUrl.value = url;
  saveGsheetUrl(url);

  const text = await fetchTextWithCorsFallback(url);
  const rows = readSheetRowsFromCsvText(text);
  return syncBaselineBarcodeFromRows(rows);
}

async function syncBarcodeFromCsvFile(file) {
  if (typeof XLSX === "undefined") {
    throw new Error("엑셀/CSV 라이브러리를 불러오지 못했습니다.");
  }
  const text = await file.text();
  const rows = readSheetRowsFromCsvText(text);
  return syncBaselineBarcodeFromRows(rows);
}

function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return NaN;
    const cleaned = trimmed.replace(/,/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  return NaN;
}

function getCellValue(sheet, row, col) {
  const addr = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
  return sheet[addr]?.v;
}

function getCellText(sheet, row, col) {
  const addr = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
  const cell = sheet[addr];
  if (!cell) return "";
  const value = cell.w ?? cell.v ?? "";
  return String(value).trim();
}

function buildStockRows(transactions) {
  const rowsByKey = {};
  const baselineRows = loadBaselineRows();

  baselineRows.forEach((base) => {
    const key = makeItemKey(base.item, base.rackBarcode, base.itemBarcode);
    rowsByKey[key] = {
      key,
      item: base.item,
      category: base.category || "",
      rackBarcode: base.rackBarcode || "",
      itemBarcode: base.itemBarcode || "",
      qty: Number.isFinite(base.qty) ? base.qty : 0,
    };
  });

  const ordered = [...transactions].sort((a, b) => (a.date > b.date ? 1 : -1));

  ordered.forEach((tx) => {
    if (tx.isInitial) return;

    const key = makeItemKey(tx.item, tx.rackBarcode, tx.itemBarcode);
    if (!rowsByKey[key]) {
      rowsByKey[key] = {
        key,
        item: tx.item,
        category: tx.category || "",
        rackBarcode: tx.rackBarcode || "",
        itemBarcode: tx.itemBarcode || "",
        qty: 0,
      };
    }

    const row = rowsByKey[key];
    row.qty += tx.type === "입고" ? tx.qty : -tx.qty;

    if (!row.rackBarcode && tx.rackBarcode) row.rackBarcode = tx.rackBarcode;
    if (!row.itemBarcode && tx.itemBarcode) row.itemBarcode = tx.itemBarcode;
    if (!row.item && tx.item) row.item = tx.item;
    if (!row.category && tx.category) row.category = tx.category;
  });

  return Object.values(rowsByKey).sort((a, b) => a.item.localeCompare(b.item, "ko-KR"));
}

function setSettingsStatus(message, isError = false) {
  refs.settingsStatus.textContent = message;
  refs.settingsStatus.style.color = isError ? "#b73333" : "#5d6f89";
}

function setCompanyStatus(message, isError = false) {
  refs.companyStatus.textContent = message;
  refs.companyStatus.style.color = isError ? "#b73333" : "#5d6f89";
}

function setTxFormStatus(message, isError = false) {
  if (!refs.txFormStatus) return;
  refs.txFormStatus.textContent = message || "";
  refs.txFormStatus.style.color = isError ? "#b73333" : "#5d6f89";
}

function canUseCameraBarcodeScanner() {
  return (
    typeof window !== "undefined" &&
    "BarcodeDetector" in window &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  );
}

function setScannerStatus(message, isError = false) {
  if (!refs.scannerStatus) return;
  refs.scannerStatus.textContent = String(message || "");
  refs.scannerStatus.style.color = isError ? "#b73333" : "#375575";
}

function setScannerModalVisible(isVisible) {
  if (!refs.scannerModal) return;
  const visible = Boolean(isVisible);
  refs.scannerModal.classList.toggle("is-active", visible);
  refs.scannerModal.setAttribute("aria-hidden", visible ? "false" : "true");
}

function stopScannerLoop() {
  if (scannerTimer) {
    clearTimeout(scannerTimer);
    scannerTimer = null;
  }
  scannerDetectBusy = false;
  scannerIsActive = false;
}

async function stopScannerCamera() {
  stopScannerLoop();
  if (scannerStream) {
    scannerStream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        // track stop 실패는 무시
      }
    });
    scannerStream = null;
  }

  if (refs.scannerVideo) {
    try {
      refs.scannerVideo.pause();
    } catch {
      // video pause 실패는 무시
    }
    refs.scannerVideo.srcObject = null;
  }
}

async function closeBarcodeScanner() {
  await stopScannerCamera();
  setScannerModalVisible(false);
}

function scheduleScannerDetectTick() {
  if (!scannerIsActive) return;
  scannerTimer = window.setTimeout(() => {
    void runScannerDetectTick();
  }, 120);
}

async function runScannerDetectTick() {
  if (!scannerIsActive) return;
  if (scannerDetectBusy) {
    scheduleScannerDetectTick();
    return;
  }
  if (!scannerDetector || !refs.scannerVideo || refs.scannerVideo.readyState < 2) {
    scheduleScannerDetectTick();
    return;
  }

  scannerDetectBusy = true;
  try {
    const detected = await scannerDetector.detect(refs.scannerVideo);
    const first = Array.isArray(detected) ? detected.find((row) => String(row?.rawValue || "").trim()) : null;
    const value = first ? String(first.rawValue || "").trim() : "";
    if (value) {
      if (scannerTarget === "rack") {
        refs.txRack.value = value;
        setTxFormStatus(`렉바코드 스캔 완료: ${value}`);
      } else {
        refs.txBarcode.value = value;
        setTxFormStatus(`물품바코드 스캔 완료: ${value}`);
      }
      await closeBarcodeScanner();
      return;
    }
  } catch {
    // 일부 기기에서 일시적으로 detect 오류가 발생할 수 있어 재시도
  } finally {
    scannerDetectBusy = false;
  }

  scheduleScannerDetectTick();
}

async function createBarcodeDetector() {
  const Detector = window.BarcodeDetector;
  if (!Detector) throw new Error("이 브라우저는 바코드 스캔을 지원하지 않습니다.");

  if (typeof Detector.getSupportedFormats !== "function") {
    return new Detector();
  }

  const supported = await Detector.getSupportedFormats();
  const available = Array.isArray(supported) ? supported : [];
  const formats = DEFAULT_SCAN_FORMATS.filter((fmt) => available.includes(fmt));
  if (!formats.length) return new Detector();
  return new Detector({ formats });
}

async function openBarcodeScanner(target) {
  if (!canUseCameraBarcodeScanner()) {
    setTxFormStatus("현재 기기/브라우저는 카메라 자동 스캔을 지원하지 않습니다. 직접 입력해 주세요.", true);
    return;
  }

  const nextTarget = target === "rack" ? "rack" : "item";
  scannerTarget = nextTarget;
  if (refs.scannerTitle) {
    refs.scannerTitle.textContent = nextTarget === "rack" ? "렉바코드 스캔" : "물품바코드 스캔";
  }
  setScannerStatus("카메라를 여는 중...");
  setScannerModalVisible(true);

  try {
    await stopScannerCamera();
    scannerDetector = await createBarcodeDetector();

    scannerStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
      },
    });

    if (!refs.scannerVideo) throw new Error("카메라 뷰를 찾지 못했습니다.");
    refs.scannerVideo.srcObject = scannerStream;
    await refs.scannerVideo.play();

    setScannerStatus("바코드를 화면 중앙에 맞춰주세요.");
    scannerIsActive = true;
    scheduleScannerDetectTick();
  } catch (error) {
    await closeBarcodeScanner();
    const message = error && typeof error === "object" && "message" in error ? error.message : String(error || "");
    setTxFormStatus(`카메라 스캔 실패: ${message || "카메라 접근 권한을 확인해 주세요."}`, true);
  }
}

function rebuildInitialTransactionsFromBaseline(baselineRows) {
  const nonInitial = loadTransactions().filter((tx) => !tx.isInitial);
  const today = formatDateValue(new Date().toISOString());

  const initialTx = baselineRows
    .filter((row) => Number(row.qty || 0) > 0)
    .map((row) =>
      sanitizeTransaction({
        item: row.item,
        category: row.category || "",
        type: "입고",
        qty: row.qty,
        date: today,
        rackBarcode: row.rackBarcode || "",
        itemBarcode: row.itemBarcode || "",
        note: "초기재고(4단지 기준표)",
        isInitial: true,
      })
    )
    .filter(Boolean);

  saveTransactions([...nonInitial, ...initialTx]);
  return initialTx.length;
}

function find4DanjiSheetName(workbook) {
  if (workbook.Sheets["4단지"]) return "4단지";
  return (
    workbook.SheetNames.find((name) => String(name || "").trim() === "4단지") ||
    workbook.SheetNames.find((name) => String(name || "").includes("4단지")) ||
    ""
  );
}

function analyze4DanjiSheet(sheet) {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
  const maxCol = range.e.c + 1;
  const maxRow = range.e.r + 1;

  let itemCol = 4;
  let categoryCol = 3;
  let useCol = 6;
  let storeCol = 7;
  let totalCol = 8;
  let headerRow = 4;
  let dayRow = 5;

  for (let r = 1; r <= Math.min(maxRow, 20); r++) {
    const rowTexts = [];
    for (let c = 1; c <= Math.min(maxCol, 80); c++) {
      rowTexts.push(getCellText(sheet, r, c));
    }
    const hasItem = rowTexts.some((t) => t.includes("품목명"));
    if (!hasItem) continue;
    headerRow = r;
    dayRow = Math.min(r + 1, maxRow);

    for (let c = 1; c <= rowTexts.length; c++) {
      const text = rowTexts[c - 1];
      if (!text) continue;
      if (text === "분류" || text.includes("분류")) categoryCol = c;
      if (text.includes("품목명")) itemCol = c;
      if (text.includes("사용중인")) useCol = c;
      if (text.includes("재고수량")) storeCol = c;
      if (text.includes("총") && text.includes("보유")) totalCol = c;
    }
    break;
  }

  const itemRowByName = {};
  const baselineRows = [];
  const itemRows = [];
  let blankCount = 0;
  const dataStartRow = Math.min(headerRow + 2, maxRow);

  for (let r = dataStartRow; r <= maxRow; r++) {
    const item = getCellText(sheet, r, itemCol);
    if (!item) {
      blankCount += 1;
      if (blankCount >= 25) break;
      continue;
    }
    blankCount = 0;

    const key = normalizeText(item);
    if (!key || itemRowByName[key]) continue;
    itemRowByName[key] = r;
    const category = getCellText(sheet, r, categoryCol);

    const total = toNumber(getCellValue(sheet, r, totalCol));
    const use = toNumber(getCellValue(sheet, r, useCol));
    const store = toNumber(getCellValue(sheet, r, storeCol));
    const qty = Number.isFinite(store)
      ? store
      : Number.isFinite(total)
        ? total
        : (Number.isFinite(use) ? use : 0) + (Number.isFinite(store) ? store : 0);

    baselineRows.push({
      item,
      category,
      qty,
      rackBarcode: "",
      itemBarcode: "",
    });

    itemRows.push({
      row: r,
      item,
      itemKey: key,
      category,
    });
  }

  const monthDayToCol = {};
  for (let c = 1; c <= maxCol; c++) {
    const header = getCellText(sheet, headerRow, c);
    if (!header || !header.includes("사용") || !header.includes("수량")) continue;
    const monthMatch = header.match(/(\d+)\s*월/);
    if (!monthMatch) continue;
    const month = Number(monthMatch[1]);
    if (!Number.isFinite(month)) continue;

    for (let cc = c; cc <= maxCol; cc++) {
      const marker = getCellText(sheet, dayRow, cc);
      if (!marker) continue;
      if (marker === "계") break;
      const day = Number(marker);
      if (!Number.isInteger(day) || day < 1 || day > 31) continue;
      monthDayToCol[`${month}-${day}`] = cc;
    }
  }

  return {
    itemRowByName,
    monthDayToCol,
    baselineRows,
    itemRows,
    maxCol,
  };
}

async function importCompanyExcel(file) {
  if (typeof XLSX === "undefined") {
    throw new Error("엑셀 라이브러리를 불러오지 못했습니다.");
  }

  const buffer = await file.arrayBuffer();
  const workbook = readWorkbookFromArrayBuffer(buffer);
  const sheetName = find4DanjiSheetName(workbook);
  if (!sheetName) {
    throw new Error("4단지 시트를 찾지 못했습니다.");
  }

  const sheet = workbook.Sheets[sheetName];
  const analyzed = analyze4DanjiSheet(sheet);
  if (!analyzed.baselineRows.length) {
    throw new Error("4단지 시트에서 품목 데이터를 읽지 못했습니다.");
  }

  const previousBaselineRows = loadBaselineRows();
  const existingTransactions = loadTransactions();
  const merged = mergeBaselineWithSavedBarcodes(analyzed.baselineRows, previousBaselineRows, existingTransactions);

  saveBaselineRows(merged.rows);
  const initialCount = rebuildInitialTransactionsFromBaseline(merged.rows);
  const txUpdated = applyBaselineBarcodeToTransactions(merged.rows);
  companyTemplateBuffer = buffer.slice(0);

  const mappedDays = Object.keys(analyzed.monthDayToCol).length;
  let templateSaved = false;
  let templateSyncedToCloud = false;
  let templateSaveInfo = { indexedDbSaved: false, localSaved: false };
  try {
    templateSaveInfo = await saveCompanyTemplateBuffer(companyTemplateBuffer, { name: file?.name || "4단지 기준표" });
    templateSaved = true;
  } catch {
    templateSaved = false;
  }

  if (templateSaved && isCloudSyncEnabled()) {
    try {
      await pushTemplateToServer(companyTemplateBuffer, {
        name: file?.name || "4단지 기준표",
        storage: {
          indexedDb: templateSaveInfo.indexedDbSaved,
          localStorage: templateSaveInfo.localSaved,
        },
      });
      templateSyncedToCloud = true;
    } catch (error) {
      setSettingsStatus(`기준표 반영 완료(클라우드 템플릿 업로드 실패): ${error.message}`, true);
    }
  }

  const storageNotes = [];
  if (templateSaveInfo.indexedDbSaved) storageNotes.push("IDB");
  if (templateSaveInfo.localSaved) storageNotes.push("LOCAL");
  if (templateSyncedToCloud) storageNotes.push("CLOUD");
  const storageNoteText = storageNotes.length ? storageNotes.join("+") : "저장실패";

  setCompanyStatus(
    `기준표 연결 완료: 품목 ${merged.rows.length}개 / 날짜칸 ${mappedDays}개 / 초기기록 ${initialCount}건 / 바코드복원(렉 ${merged.restoredRackCount}개, 물품 ${merged.restoredItemCount}개) (표시분류: ${VISIBLE_CATEGORIES.join(", ")})${templateSaved ? ` / 템플릿 저장 ${storageNoteText}` : " / 템플릿 저장 실패"}`
  );
  setSettingsStatus(
    templateSaved
      ? `4단지 기준 재고 ${merged.rows.length}개 + 초기기록 ${initialCount}건 반영${txUpdated ? ` / 거래 바코드 보정 ${txUpdated}건` : ""}`
      : `기준표는 반영됐지만 DB 저장에 실패했습니다. 이 경우 새로고침 후 다시 불러와야 합니다.`,
    !templateSaved
  );
}

async function exportCompanyExcelWithOutbound() {
  if (typeof XLSX === "undefined") {
    throw new Error("엑셀 라이브러리를 불러오지 못했습니다.");
  }
  if (!companyTemplateBuffer) {
    const restored = await ensureCompanyTemplateBufferLoaded();
    if (!restored) {
      throw new Error("먼저 4단지 기준표 파일을 불러오세요.");
    }
  }
  const outbound = loadTransactions().filter((tx) => tx.type === "출고" && !tx.isInitial);
  if (!outbound.length) {
    throw new Error("반영할 출고 기록이 없습니다.");
  }

  const today = formatDateValue(new Date().toISOString());
  const fileName = `4단지_출고반영_${today}.xlsx`;

  let response;
  try {
    response = await apiFetch("/api/export-company-with-outbound", {
      method: "POST",
      body: JSON.stringify({
        mode: "outbound",
        template_b64: arrayBufferToBase64(companyTemplateBuffer.slice(0)),
        transactions: loadTransactions(),
        file_name: fileName,
      }),
    });
  } catch {
    throw new Error("원본 양식 보존 내보내기 API 연결에 실패했습니다. 서버 주소/실행 상태를 확인해 주세요.");
  }

  let result = null;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok || !result?.ok) {
    const apiError = result?.error || `HTTP ${response.status}`;
    if (response.status === 404 || response.status === 405) {
      throw new Error("내보내기 API 경로를 찾지 못했습니다. 서버 버전이 최신인지 확인해 주세요.");
    }
    throw new Error(`내보내기 실패: ${apiError}`);
  }

  if (!result.workbook_b64) {
    throw new Error("내보내기 결과 파일 데이터가 없습니다.");
  }

  const workbookBuffer = base64ToArrayBuffer(result.workbook_b64);
  downloadArrayBufferFile(workbookBuffer, result.file_name || fileName);

  const summary = result.summary || {};
  const appliedCount = Number(summary.applied_count || 0);
  const notes = [];
  if (summary.missing_items_count) notes.push(`품목불일치 ${summary.missing_items_count}건`);
  if (summary.missing_dates_count) notes.push(`날짜칸없음 ${summary.missing_dates_count}건`);
  if (summary.fuzzy_matched_count) notes.push(`유사매칭 ${summary.fuzzy_matched_count}건`);

  setCompanyStatus(
    notes.length
      ? `원본양식 반영 완료: ${appliedCount}건 (${notes.join(", ")})`
      : `원본양식 반영 완료: ${appliedCount}건을 회사엑셀에 기입했습니다.`
  );
}

async function exportCompanyExcelByZones() {
  if (typeof XLSX === "undefined") {
    throw new Error("엑셀 라이브러리를 불러오지 못했습니다.");
  }
  if (!companyTemplateBuffer) {
    const restored = await ensureCompanyTemplateBufferLoaded();
    if (!restored) {
      throw new Error("먼저 4단지 기준표 파일을 불러오세요.");
    }
  }

  const transactions = loadTransactions();
  const baselineRows = loadBaselineRows();
  const outbound = transactions.filter((tx) => tx.type === "출고" && !tx.isInitial);
  const today = formatDateValue(new Date().toISOString());
  const fileName = `4단지_출고반영_구역별_${today}.xlsx`;

  let response;
  try {
    response = await apiFetch("/api/export-company-by-zones", {
      method: "POST",
      body: JSON.stringify({
        mode: "zones",
        template_b64: arrayBufferToBase64(companyTemplateBuffer.slice(0)),
        transactions,
        baseline_rows: baselineRows,
        file_name: fileName,
      }),
    });
  } catch {
    throw new Error("원본 양식 보존 구역내보내기 API 연결에 실패했습니다. 서버 주소/실행 상태를 확인해 주세요.");
  }

  let result = null;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok || !result?.ok) {
    const apiError = result?.error || `HTTP ${response.status}`;
    if (response.status === 404 || response.status === 405) {
      throw new Error("구역내보내기 API 경로를 찾지 못했습니다. 서버 버전이 최신인지 확인해 주세요.");
    }
    throw new Error(`구역내보내기 실패: ${apiError}`);
  }

  if (!result.workbook_b64) {
    throw new Error("구역내보내기 결과 파일 데이터가 없습니다.");
  }

  const workbookBuffer = base64ToArrayBuffer(result.workbook_b64);
  downloadArrayBufferFile(workbookBuffer, result.file_name || fileName);

  const summary = result.summary || {};
  const zoneSummaries = Array.isArray(summary.zone_summaries) ? summary.zone_summaries : [];
  const summaryText = zoneSummaries
    .map((row) => {
      const zone = row.zone || "-";
      const lineCount = Number(row.included_line_count || 0);
      const appliedCount = Number(row.applied_count || 0);
      const fuzzyCount = Number(row.fuzzy_matched_count || 0);
      return `${zone}: 품목줄 ${lineCount}개 / 출고반영 ${appliedCount}건${fuzzyCount ? ` / 유사매칭 ${fuzzyCount}건` : ""}`;
    })
    .join(" | ");

  const modeText = outbound.length ? `출고기록 ${outbound.length}건 기준` : "출고기록 0건(품목줄만 생성)";
  const unmatchedCount = Number(summary.unmatched_count || 0);
  if (unmatchedCount) {
    setCompanyStatus(`구역별 원본양식 내보내기 완료 (${modeText}): ${summaryText} / 미반영 ${unmatchedCount}건`);
  } else {
    setCompanyStatus(`구역별 원본양식 내보내기 완료 (${modeText}): ${summaryText}`);
  }
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setTodayDefaults() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const today = `${yyyy}-${mm}-${dd}`;

  refs.txDate.value = today;
  refs.todayBadge.textContent = today;
}

function normalizeView(view) {
  return Object.prototype.hasOwnProperty.call(VIEW_LABELS, view) ? view : "home";
}

function setActiveView(view, { persist = true } = {}) {
  const current = normalizeView(String(view || "").trim());
  const previous = normalizeView(activeViewName);
  const prevIndex = VIEW_ORDER.indexOf(previous);
  const currentIndex = VIEW_ORDER.indexOf(current);
  const directionClass =
    previous === current ? "" : currentIndex >= prevIndex ? "is-forward" : "is-backward";

  refs.views.forEach((section) => {
    const isActive = section.id === `view-${current}`;
    section.classList.remove("is-forward", "is-backward");
    section.classList.toggle("is-active", isActive);
    if (isActive && directionClass) section.classList.add(directionClass);
    section.setAttribute("aria-hidden", isActive ? "false" : "true");
  });

  refs.navButtons.forEach((button) => {
    const isActive = button.dataset.view === current;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  refs.screenTitle.textContent = APP_TITLE;
  document.title = `${APP_TITLE} · ${VIEW_LABELS[current]}`;
  activeViewName = current;

  if (persist) {
    localStorage.setItem(KEYS.view, current);
    scheduleCloudPush("active-view");
  }
}

function migrateLegacyDataIfNeeded() {
  const current = loadJSON(KEYS.tx, null);
  const currentBaseline = loadJSON(KEYS.baseline, null);
  if (Array.isArray(current) && current.length && Array.isArray(currentBaseline) && currentBaseline.length) return;

  const legacyTx = loadJSON(KEYS.legacyTx, []);
  const legacyBaseline = loadJSON(KEYS.legacyBaseline, {});

  const converted = Array.isArray(legacyTx) ? legacyTx.map(sanitizeTransaction).filter(Boolean) : [];
  if (converted.length) {
    saveTransactions(converted);
  }

  const baselineRows = [];
  if (legacyBaseline && typeof legacyBaseline === "object") {
    Object.values(legacyBaseline).forEach((row) => {
      if (!row || typeof row !== "object") return;
      const item = String(row.item || "").trim();
      if (!item) return;
      baselineRows.push({
        item,
        category: String(row.category || "").trim(),
        qty: Number(row.qty || 0),
        rackBarcode: String(row.rackBarcode || "").trim(),
        itemBarcode: String(row.itemBarcode || "").trim(),
      });
    });
  }
  if (baselineRows.length) {
    saveBaselineRows(baselineRows);
  }

  const legacyMin = loadJSON(KEYS.legacyMin, {});
  if (legacyMin && typeof legacyMin === "object") {
    saveMinStockMap(legacyMin);
  }

  if (converted.length || baselineRows.length) {
    setSettingsStatus(`기존 데이터 이관: 거래 ${converted.length}건 / 기준재고 ${baselineRows.length}개`);
  }
}

function renderStats(transactions, stockRows) {
  const visibleRows = getVisibleStockRows(stockRows);
  const now = new Date();
  const monthToken = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const monthIn = transactions
    .filter((tx) => !tx.isInitial && tx.date.startsWith(monthToken) && tx.type === "입고")
    .reduce((sum, tx) => sum + tx.qty, 0);

  const monthOut = transactions
    .filter((tx) => !tx.isInitial && tx.date.startsWith(monthToken) && tx.type === "출고")
    .reduce((sum, tx) => sum + tx.qty, 0);

  refs.statItems.textContent = formatNumber(visibleRows.length);
  refs.statTotal.textContent = formatNumber(visibleRows.reduce((sum, row) => sum + row.qty, 0));
  refs.statIn.textContent = formatNumber(monthIn);
  refs.statOut.textContent = formatNumber(monthOut);
}

function renderLowStock(stockRows, minStockMap) {
  const rows = getVisibleStockRows(stockRows)
    .map((row) => {
      const min = Number(minStockMap[row.key] || 0);
      return {
        ...row,
        min,
        isLow: min > 0 && row.qty <= min,
      };
    })
    .filter((row) => row.isLow)
    .sort((a, b) => a.qty - b.qty || a.item.localeCompare(b.item, "ko-KR"));

  refs.lowList.innerHTML = "";

  rows.slice(0, 8).forEach((row, index) => {
    const li = document.createElement("li");
    li.style.setProperty("--stagger-index", String(index + 1));
    li.innerHTML = `<span>${escapeHtml(row.item)}</span><span>${row.qty} / 최소 ${row.min}</span>`;
    refs.lowList.appendChild(li);
  });

  refs.lowEmpty.style.display = rows.length ? "none" : "block";
}

function renderTxList(transactions) {
  const keyword = refs.txSearch.value.trim().toLowerCase();

  const rows = transactions.filter((tx) => {
    if (selectedType !== "전체" && tx.type !== selectedType) return false;

    if (!keyword) return true;
    const target = `${tx.item} ${tx.rackBarcode} ${tx.itemBarcode} ${tx.note}`.toLowerCase();
    return target.includes(keyword);
  });

  refs.txList.innerHTML = "";

  rows.forEach((tx, index) => {
    const zone = resolveZoneByRackBarcode(tx.rackBarcode);
    const card = document.createElement("article");
    card.className = "tx-card";
    card.style.setProperty("--stagger-index", String(Math.min(index, 10)));
    card.innerHTML = `
      <div class="tx-top">
        <div>
          <div class="tx-item">${escapeHtml(tx.item)}</div>
          <div class="tx-date">${tx.date}</div>
        </div>
        <div class="tx-top-right">
          <span class="type-badge ${tx.type === "입고" ? "in" : "out"}">${tx.type} ${tx.qty}</span>
          ${tx.isInitial ? '<span class="tx-lock-badge">초기재고</span>' : ""}
          <button type="button" class="tx-delete-btn" data-tx-id="${escapeHtml(tx.id)}">삭제</button>
        </div>
      </div>
      <div class="tx-bottom">
        ${tx.isInitial ? "<span>구분: 초기재고</span>" : ""}
        ${tx.category ? `<span>분류: ${escapeHtml(tx.category)}</span>` : ""}
        <span>구역: ${zone}</span>
        <span>렉: ${escapeHtml(tx.rackBarcode || "-")}</span>
        <span>물품: ${escapeHtml(tx.itemBarcode || "-")}</span>
        ${tx.note ? `<span>메모: ${escapeHtml(tx.note)}</span>` : ""}
      </div>
    `;
    refs.txList.appendChild(card);
  });

  refs.txEmpty.style.display = rows.length ? "none" : "block";
}

function renderStock(stockRows, minStockMap) {
  const keyword = String(refs.stockSearch?.value || "").trim().toLowerCase();
  let visibleRows = getVisibleStockRows(stockRows, { applyZoneFilter: true });
  if (keyword) {
    visibleRows = visibleRows.filter((row) => {
      const haystack = `${row.item} ${row.rackBarcode} ${row.itemBarcode}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }
  refs.stockBody.innerHTML = "";

  visibleRows.forEach((row, index) => {
    const min = Number(minStockMap[row.key] || 0);
    const isLow = min > 0 && row.qty <= min;
    const zone = resolveZoneByRackBarcode(row.rackBarcode);

    const tr = document.createElement("tr");
    tr.className = "stock-row";
    tr.style.setProperty("--stagger-index", String(Math.min(index, 14)));
    tr.innerHTML = `
      <td><strong>${escapeHtml(row.item)}</strong></td>
      <td>${escapeHtml(row.category || "-")}</td>
      <td>${zone}</td>
      <td>${escapeHtml(row.rackBarcode || "-")}</td>
      <td>${escapeHtml(row.itemBarcode || "-")}</td>
      <td>${row.qty}</td>
      <td>
        <input
          class="min-input"
          type="number"
          min="0"
          step="1"
          value="${min}"
          data-stock-key="${escapeHtml(row.key)}"
        />
      </td>
      <td><span class="status-pill ${isLow ? "low" : "ok"}">${isLow ? "부족" : "정상"}</span></td>
    `;

    refs.stockBody.appendChild(tr);
  });

  refs.stockEmpty.style.display = visibleRows.length ? "none" : "block";
}

function render() {
  const transactions = loadTransactions().sort((a, b) => (a.date < b.date ? 1 : -1));
  const stockRows = buildStockRows(transactions);
  const minStockMap = loadMinStockMap();

  renderStats(transactions, stockRows);
  renderLowStock(stockRows, minStockMap);
  renderTxList(transactions);
  renderStock(stockRows, minStockMap);
}

function exportToJson() {
  const now = new Date();
  const dateToken = formatDateValue(now.toISOString());

  const payload = {
    version: 2,
    exportedAt: now.toISOString(),
    transactions: loadTransactions(),
    minStock: loadMinStockMap(),
    baseline: loadBaselineRows(),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `inventory_v2_backup_${dateToken}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  setSettingsStatus("백업 파일을 저장했습니다.");
}

function importFromJsonFile(file) {
  return file.text().then((text) => {
    const parsed = JSON.parse(text);
    const incomingTx = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.transactions) ? parsed.transactions : [];
    const sanitizedTx = incomingTx.map(sanitizeTransaction).filter(Boolean);

    if (!sanitizedTx.length && incomingTx.length) {
      throw new Error("유효한 거래 데이터가 없습니다.");
    }

    const minStock = parsed?.minStock;
    const minMap = minStock && typeof minStock === "object" ? minStock : {};

    const baseline = Array.isArray(parsed?.baseline) ? parsed.baseline : [];
    const baselineRows = baseline
      .map((row) => ({
        item: String(row?.item || "").trim(),
        category: String(row?.category || "").trim(),
        qty: Number(row?.qty || 0),
        rackBarcode: String(row?.rackBarcode || "").trim(),
        itemBarcode: String(row?.itemBarcode || "").trim(),
      }))
      .filter((row) => row.item);

    saveTransactions(sanitizedTx);
    saveMinStockMap(minMap);
    saveBaselineRows(baselineRows);
    setSettingsStatus(`복원 완료: 거래 ${sanitizedTx.length}건 / 기준재고 ${baselineRows.length}개`);
  });
}

function bindEvents() {
  refs.authForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = refs.authUsername?.value || "";
    const password = refs.authPassword?.value || "";
    const ok = attemptLogin(username, password);
    if (!ok) {
      setAuthStatus("아이디 또는 비밀번호를 확인해 주세요.", true);
      return;
    }
    setAuthStatus("");
  });

  refs.logoutBtn?.addEventListener("click", () => {
    const ok = confirm("로그아웃할까요?");
    if (!ok) return;
    clearAuthSession();
    ensureAuthGateState();
    setActiveView("home");
  });

  refs.nav.addEventListener("click", (event) => {
    const button = event.target.closest(".nav-btn");
    if (!button) return;
    setActiveView(button.dataset.view);
  });

  refs.quickButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveView(button.dataset.goView);
    });
  });

  refs.scanRackBtn?.addEventListener("click", () => {
    void openBarcodeScanner("rack");
  });

  refs.scanBarcodeBtn?.addEventListener("click", () => {
    void openBarcodeScanner("item");
  });

  refs.scannerCloseBtn?.addEventListener("click", () => {
    void closeBarcodeScanner();
  });

  refs.scannerModal?.addEventListener("click", (event) => {
    if (event.target === refs.scannerModal) {
      void closeBarcodeScanner();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) return;
    void closeBarcodeScanner();
  });

  window.addEventListener("beforeunload", () => {
    void stopScannerCamera();
  });

  refs.txForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const baselineRows = loadBaselineRows();
    const enteredItem = refs.txItem.value;
    const baselineMatch = findBaselineMatch(enteredItem, baselineRows, { allowFuzzy: true });
    const baseline = baselineMatch?.row || null;
    const canonicalItem = baseline?.item || enteredItem;

    const transaction = sanitizeTransaction({
      item: canonicalItem,
      category: baseline?.category || "",
      type: refs.txType.value,
      qty: refs.txQty.value,
      date: refs.txDate.value,
      rackBarcode: refs.txRack.value || baseline?.rackBarcode || "",
      itemBarcode: refs.txBarcode.value || baseline?.itemBarcode || "",
      note: refs.txNote.value,
    });

    if (!transaction) return;

    const transactions = loadTransactions();
    transactions.push(transaction);
    saveTransactions(transactions);
    const baselineBarcodeUpdate = updateBaselineBarcodeForItem(transaction.item, {
      rackBarcode: transaction.rackBarcode,
      itemBarcode: transaction.itemBarcode,
    });
    let txPatchedByBarcode = 0;
    if (baselineBarcodeUpdate.updated) {
      txPatchedByBarcode = applyBaselineBarcodeToTransactions(loadBaselineRows());
    }

    refs.txForm.reset();
    setTodayDefaults();
    refs.txType.value = "입고";
    let formStatus = "저장 완료";
    let formStatusError = false;
    if (baselineMatch?.matchedBy === "fuzzy") {
      formStatus = `유사 품목 자동변환: "${enteredItem}" -> "${baseline.item}"`;
    } else if (!baselineMatch) {
      formStatus = "기준표 미일치 품목으로 저장했습니다. 내보내기 시 미반영될 수 있습니다.";
      formStatusError = true;
    }
    if (baselineBarcodeUpdate.updated) {
      formStatus += txPatchedByBarcode
        ? ` / 바코드 기준 저장(거래보정 ${txPatchedByBarcode}건)`
        : " / 바코드 기준 저장";
    }
    setTxFormStatus(formStatus, formStatusError);

    render();
    setActiveView("records");
  });

  refs.txSearch.addEventListener("input", render);

  refs.txItem.addEventListener("blur", () => {
    const enteredItem = refs.txItem.value.trim();
    if (!enteredItem) {
      setTxFormStatus("");
      return;
    }
    const baselineMatch = findBaselineMatch(enteredItem, loadBaselineRows(), { allowFuzzy: true });
    const baseline = baselineMatch?.row;
    if (!baseline) {
      setTxFormStatus("기준표에 없는 품목명입니다.", true);
      return;
    }
    if (baselineMatch.matchedBy === "fuzzy" && normalizeText(enteredItem) !== normalizeText(baseline.item)) {
      refs.txItem.value = baseline.item;
      setTxFormStatus(`유사 품목 자동선택: "${enteredItem}" -> "${baseline.item}"`);
    } else {
      setTxFormStatus("");
    }
    if (!refs.txRack.value.trim() && baseline.rackBarcode) refs.txRack.value = baseline.rackBarcode;
    if (!refs.txBarcode.value.trim() && baseline.itemBarcode) refs.txBarcode.value = baseline.itemBarcode;
  });

  refs.txList.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".tx-delete-btn");
    if (!deleteButton) return;

    const txId = String(deleteButton.dataset.txId || "");
    if (!txId) return;

    const transactions = loadTransactions();
    const target = transactions.find((tx) => tx.id === txId);
    if (!target) return;

    const message = target.isInitial
      ? `초기재고 기록 삭제: ${target.date} ${target.item} ${target.type} ${target.qty}\n삭제 후 다시 기준표를 불러오면 초기재고가 재생성됩니다.`
      : `기록 삭제: ${target.date} ${target.item} ${target.type} ${target.qty}`;
    const ok = confirm(message);
    if (!ok) return;

    saveTransactions(transactions.filter((tx) => tx.id !== txId));
    setTxFormStatus("기록 1건을 삭제했습니다.");
    render();
  });

  refs.txFilter.addEventListener("click", (event) => {
    const button = event.target.closest(".seg");
    if (!button) return;

    selectedType = button.dataset.type || "전체";
    refs.txFilter.querySelectorAll(".seg").forEach((seg) => seg.classList.remove("is-active"));
    button.classList.add("is-active");

    render();
  });

  refs.stockBody.addEventListener("change", (event) => {
    const input = event.target.closest(".min-input");
    if (!input) return;

    const key = input.dataset.stockKey;
    const value = Math.max(0, Math.floor(Number(input.value || 0)));
    const map = loadMinStockMap();

    map[key] = value;
    saveMinStockMap(map);
    render();
  });

  refs.stockSearch?.addEventListener("input", render);

  refs.stockZoneFilter.addEventListener("click", (event) => {
    const button = event.target.closest(".seg");
    if (!button) return;
    const zone = String(button.dataset.zone || "전체");
    selectedStockZone = STOCK_ZONES.includes(zone) ? zone : "전체";
    refs.stockZoneFilter.querySelectorAll(".seg").forEach((seg) => seg.classList.remove("is-active"));
    button.classList.add("is-active");
    render();
  });

  refs.exportBtn.addEventListener("click", exportToJson);

  refs.importFile.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    importFromJsonFile(file)
      .then(() => render())
      .catch((error) => setSettingsStatus(`복원 실패: ${error.message}`, true))
      .finally(() => {
        event.target.value = "";
      });
  });

  refs.gsheetUrl.addEventListener("change", () => {
    saveGsheetUrl(refs.gsheetUrl.value);
  });

  refs.gsheetSyncBtn.addEventListener("click", async () => {
    try {
      const result = await syncBarcodeFromGoogleUrl(refs.gsheetUrl.value);
      const unmatchedText = result.unmatched.length ? ` / 불일치 ${result.unmatched.length}건` : "";
      refs.gsheetStatus.textContent =
        `동기화 완료: 매칭 ${result.matched}건, 바코드갱신 ${result.changed}건, 거래보정 ${result.txUpdated}건${unmatchedText}`;
      refs.gsheetStatus.style.color = "#5d6f89";
      render();
    } catch (error) {
      refs.gsheetStatus.textContent = `동기화 실패: ${error.message}`;
      refs.gsheetStatus.style.color = "#b73333";
    }
  });

  refs.gsheetCsvFile.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await syncBarcodeFromCsvFile(file);
      const unmatchedText = result.unmatched.length ? ` / 불일치 ${result.unmatched.length}건` : "";
      refs.gsheetStatus.textContent =
        `CSV 동기화 완료: 매칭 ${result.matched}건, 바코드갱신 ${result.changed}건, 거래보정 ${result.txUpdated}건${unmatchedText}`;
      refs.gsheetStatus.style.color = "#5d6f89";
      render();
    } catch (error) {
      refs.gsheetStatus.textContent = `CSV 동기화 실패: ${error.message}`;
      refs.gsheetStatus.style.color = "#b73333";
    } finally {
      event.target.value = "";
    }
  });

  refs.companyExcelFile.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    importCompanyExcel(file)
      .then(() => render())
      .catch((error) => setCompanyStatus(`연결 실패: ${error.message}`, true))
      .finally(() => {
        event.target.value = "";
      });
  });

  refs.exportCompanyBtn.addEventListener("click", async () => {
    try {
      await exportCompanyExcelWithOutbound();
    } catch (error) {
      setCompanyStatus(`반영 실패: ${error.message}`, true);
    }
  });

  refs.exportCompanyZonesBtn.addEventListener("click", async () => {
    try {
      await exportCompanyExcelByZones();
    } catch (error) {
      setCompanyStatus(`구역별 내보내기 실패: ${error.message}`, true);
    }
  });

  refs.clearBtn.addEventListener("click", async () => {
    const ok = confirm("모든 거래/재고 기준 데이터를 초기화할까요?");
    if (!ok) return;

    await closeBarcodeScanner();

    withCloudPushSuspended(() => {
      saveJSON(KEYS.tx, [], { skipSync: true });
      saveJSON(KEYS.min, {}, { skipSync: true });
      saveJSON(KEYS.baseline, [], { skipSync: true });
      localStorage.removeItem(KEYS.templateMeta);
      saveGsheetUrl(getDefaultGoogleSheetUrl(), { skipSync: true });
      localStorage.setItem(KEYS.view, "home");
    });
    companyTemplateBuffer = null;
    try {
      await clearCompanyTemplateBuffer();
    } catch {
      // 로컬 DB 삭제 실패 시에도 나머지 데이터 초기화는 진행
    }
    selectedStockZone = "전체";

    selectedType = "전체";
    refs.txFilter.querySelectorAll(".seg").forEach((seg) => {
      seg.classList.toggle("is-active", seg.dataset.type === "전체");
    });
    refs.stockZoneFilter.querySelectorAll(".seg").forEach((seg) => {
      seg.classList.toggle("is-active", seg.dataset.zone === "전체");
    });

    setSettingsStatus("초기화 완료: 모든 데이터가 삭제되었습니다.");
    setCompanyStatus("기준표 파일을 먼저 불러오세요.");
    refs.gsheetStatus.textContent = "바코드 동기화를 아직 하지 않았습니다.";
    refs.gsheetStatus.style.color = "#5d6f89";
    refs.gsheetUrl.value = loadGsheetUrl();

    if (isCloudSyncEnabled()) {
      try {
        await clearTemplateOnServer();
      } catch (error) {
        setSettingsStatus(`로컬 초기화 완료 (클라우드 템플릿 삭제 실패): ${error.message}`, true);
      }
    }
    if (isRemoteSyncEnabled()) {
      scheduleCloudPush("clear-all");
    }

    render();
    setActiveView("home");
  });
}

async function init() {
  applySafeAreaFallbackForIOS();
  window.addEventListener("resize", applySafeAreaFallbackForIOS);

  setTodayDefaults();
  migrateLegacyDataIfNeeded();
  bindEvents();
  ensureAuthGateState();
  refs.gsheetUrl.value = loadGsheetUrl();

  if (isRemoteSyncEnabled() && CLOUD_PULL_ON_INIT) {
    try {
      await pullStateFromServer();
      const syncLabel = isSupabaseSyncEnabled() ? "Supabase" : "클라우드";
      setSettingsStatus(`${syncLabel} 동기화 연결 완료: 폰/PC가 같은 데이터를 사용합니다.`);
    } catch (error) {
      cloudHydrated = true;
      const syncLabel = isSupabaseSyncEnabled() ? "Supabase" : "클라우드";
      setSettingsStatus(`${syncLabel} 연결 실패(로컬 모드 유지): ${error.message}`, true);
    }
  } else {
    cloudHydrated = true;
  }

  let restoredTemplate = false;
  try {
    if (!companyTemplateBuffer) {
      const savedBuffer = await loadCompanyTemplateBuffer();
      if (savedBuffer) {
        companyTemplateBuffer = savedBuffer;
        restoredTemplate = true;
      }
    } else {
      restoredTemplate = true;
    }
  } catch {
    restoredTemplate = false;
  }

  const baselineCount = loadBaselineRows().length;
  const templateMeta = loadJSON(KEYS.templateMeta, {});
  if (baselineCount && restoredTemplate) {
    const savedName = String(templateMeta?.name || "").trim();
    const savedDate = formatDateValue(templateMeta?.savedAt || "");
    setCompanyStatus(
      `기준재고 ${baselineCount}개 + 기준표 자동복구 완료${savedName ? ` (${savedName})` : ""}${savedDate ? ` / 저장일 ${savedDate}` : ""}. 바로 엑셀 반영 저장 가능합니다.`
    );
  } else if (baselineCount) {
    setCompanyStatus(
      `기준재고 ${baselineCount}개가 저장됨. 엑셀 반영 저장 전에는 기준표 파일을 다시 불러오세요.`
    );
  }

  const savedView = localStorage.getItem(KEYS.view) || "home";
  setActiveView(savedView, { persist: false });
  render();
  ensureAuthGateState();
}

init();
