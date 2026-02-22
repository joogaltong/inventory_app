const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawn } = require("child_process");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 5173);
const CANONICAL_HOST = process.env.CANONICAL_HOST || "127.0.0.1";
const CANONICAL_ORIGIN = `http://${CANONICAL_HOST}:${PORT}`;

const ROOT = __dirname;
const WWW_DIR = path.join(ROOT, "www");
const DATA_DIR = process.env.INVENTORY_DATA_DIR || path.join(ROOT, "data");
const STATE_FILE = path.join(DATA_DIR, "state.json");
const TEMPLATE_FILE = path.join(DATA_DIR, "company_template.bin");
const PYTHON_SCRIPT = path.join(ROOT, "scripts", "export_company_excel.py");

const JSON_LIMIT_BYTES = 80 * 1024 * 1024;
const TEMPLATE_LIMIT_BYTES = 60 * 1024 * 1024;
const APP_TOKEN = String(process.env.APP_TOKEN || "").trim();

const VIEWS = new Set(["home", "records", "stock", "settings"]);
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};
const BASE_HEADERS = {
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-App-Token, Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

function nowIso() {
  return new Date().toISOString();
}

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function writeFileAtomicSync(filePath, content) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tempPath = path.join(dir, `${path.basename(filePath)}.tmp-${process.pid}-${Date.now()}`);
  fs.writeFileSync(tempPath, content);
  fs.renameSync(tempPath, filePath);
}

function createDefaultState() {
  return {
    version: 1,
    updatedAt: nowIso(),
    transactions: [],
    minStock: {},
    baseline: [],
    activeView: "home",
    gsheetUrl: "",
    templateMeta: null,
  };
}

function normalizeDate(value) {
  return String(value || "").slice(0, 10);
}

function sanitizeTransaction(input) {
  const item = String(input?.item || "").trim();
  const date = normalizeDate(input?.date);
  const qty = Number(input?.qty || 0);
  if (!item || !date || !Number.isFinite(qty) || qty <= 0) return null;
  return {
    id: String(input?.id || `tx-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`),
    item,
    category: String(input?.category || "").trim(),
    type: String(input?.type || "") === "출고" ? "출고" : "입고",
    qty: Math.floor(qty),
    date,
    rackBarcode: String(input?.rackBarcode || "").trim(),
    itemBarcode: String(input?.itemBarcode || "").trim(),
    note: String(input?.note || "").trim(),
    isInitial: Boolean(input?.isInitial),
  };
}

function sanitizeBaselineRow(row) {
  const item = String(row?.item || "").trim();
  if (!item) return null;
  const qty = Number(row?.qty || 0);
  return {
    item,
    category: String(row?.category || "").trim(),
    qty: Number.isFinite(qty) ? qty : 0,
    rackBarcode: String(row?.rackBarcode || "").trim(),
    itemBarcode: String(row?.itemBarcode || "").trim(),
  };
}

function sanitizeMinStock(map) {
  if (!map || typeof map !== "object") return {};
  const out = {};
  Object.entries(map).forEach(([key, value]) => {
    const name = String(key || "").trim();
    if (!name) return;
    const n = Math.max(0, Math.floor(Number(value || 0)));
    if (!Number.isFinite(n)) return;
    out[name] = n;
  });
  return out;
}

function sanitizeTemplateMeta(meta, fallbackBytes = 0) {
  if (!meta || typeof meta !== "object") return null;
  const name = String(meta.name || "").trim();
  const savedAt = String(meta.savedAt || nowIso());
  const bytesInput = Number(meta.bytes || fallbackBytes || 0);
  const bytes = Number.isFinite(bytesInput) ? Math.max(0, Math.floor(bytesInput)) : 0;
  const storage = meta.storage && typeof meta.storage === "object" ? meta.storage : {};
  return {
    name,
    bytes,
    savedAt,
    storage: {
      serverFile: Boolean(storage.serverFile ?? true),
      indexedDb: Boolean(storage.indexedDb),
      localStorage: Boolean(storage.localStorage),
    },
  };
}

function sanitizeState(input) {
  const fallback = createDefaultState();
  const tx = Array.isArray(input?.transactions)
    ? input.transactions.map(sanitizeTransaction).filter(Boolean)
    : fallback.transactions;
  const baseline = Array.isArray(input?.baseline)
    ? input.baseline.map(sanitizeBaselineRow).filter(Boolean)
    : fallback.baseline;
  const activeView = VIEWS.has(String(input?.activeView || "").trim()) ? String(input.activeView) : "home";
  const gsheetUrl = String(input?.gsheetUrl || "").trim();

  return {
    version: 1,
    updatedAt: String(input?.updatedAt || fallback.updatedAt),
    transactions: tx,
    minStock: sanitizeMinStock(input?.minStock),
    baseline,
    activeView,
    gsheetUrl,
    templateMeta: sanitizeTemplateMeta(input?.templateMeta),
  };
}

function readJsonFile(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

let state = createDefaultState();
ensureDataDir();
const initialState = readJsonFile(STATE_FILE, null);
if (initialState) {
  state = sanitizeState(initialState);
} else {
  writeFileAtomicSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
}

function saveState() {
  state.updatedAt = nowIso();
  writeFileAtomicSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
}

function hasTemplate() {
  try {
    return fs.existsSync(TEMPLATE_FILE) && fs.statSync(TEMPLATE_FILE).size > 0;
  } catch {
    return false;
  }
}

function readTemplateBase64() {
  if (!hasTemplate()) return "";
  return fs.readFileSync(TEMPLATE_FILE).toString("base64");
}

function saveTemplateBase64(templateB64, meta) {
  const b64 = String(templateB64 || "").trim();
  if (!b64) throw new Error("template_b64 값이 필요합니다.");
  const buffer = Buffer.from(b64, "base64");
  if (!buffer.length) throw new Error("template_b64 디코딩 결과가 비어 있습니다.");
  if (buffer.length > TEMPLATE_LIMIT_BYTES) throw new Error("기준표 템플릿 파일이 너무 큽니다.");

  writeFileAtomicSync(TEMPLATE_FILE, buffer);
  state.templateMeta = sanitizeTemplateMeta(
    {
      ...(meta || {}),
      bytes: buffer.length,
      savedAt: nowIso(),
      storage: { ...(meta?.storage || {}), serverFile: true },
    },
    buffer.length
  );
  saveState();
}

function clearTemplate() {
  try {
    if (fs.existsSync(TEMPLATE_FILE)) fs.unlinkSync(TEMPLATE_FILE);
  } catch {
    // 템플릿 파일 삭제 실패는 상태 정리와 분리
  }
  state.templateMeta = null;
  saveState();
}

function getClientState() {
  return {
    version: state.version,
    updatedAt: state.updatedAt,
    transactions: state.transactions,
    minStock: state.minStock,
    baseline: state.baseline,
    activeView: state.activeView,
    gsheetUrl: state.gsheetUrl,
    templateMeta: state.templateMeta,
    templateAvailable: hasTemplate(),
  };
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    ...BASE_HEADERS,
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(body));
}

function sendEmpty(res, statusCode = 204) {
  res.writeHead(statusCode, BASE_HEADERS);
  res.end();
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, 404, { ok: false, error: "파일을 찾을 수 없습니다." });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      ...BASE_HEADERS,
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
    });
    res.end(content);
  });
}

function resolveStaticPath(pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const safePath = path.normalize(path.join(WWW_DIR, requested));
  if (!safePath.startsWith(WWW_DIR)) return "";
  return safePath;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];

    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > JSON_LIMIT_BYTES) {
        reject(new Error("요청 데이터가 너무 큽니다."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("JSON 파싱에 실패했습니다."));
      }
    });

    req.on("error", (error) => {
      reject(error);
    });
  });
}

function runPythonExport(payload) {
  return new Promise((resolve, reject) => {
    const child = spawn("python3", [PYTHON_SCRIPT], { cwd: ROOT });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || stdout.trim() || `Python 종료 코드 ${code}`));
        return;
      }
      try {
        const parsed = JSON.parse(stdout || "{}");
        resolve(parsed);
      } catch {
        reject(new Error("Python 결과 파싱에 실패했습니다."));
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

function ensureTemplateInPayload(payload) {
  if (String(payload?.template_b64 || "").trim()) return payload;
  const fromDisk = readTemplateBase64();
  if (!fromDisk) {
    throw new Error("기준표 템플릿이 서버에 없습니다. 먼저 기준표를 불러오세요.");
  }
  return { ...payload, template_b64: fromDisk };
}

function isAuthorized(req) {
  if (!APP_TOKEN) return true;
  const appHeader = String(req.headers["x-app-token"] || "").trim();
  if (appHeader && appHeader === APP_TOKEN) return true;

  const auth = String(req.headers.authorization || "").trim();
  if (!auth) return false;
  if (auth === APP_TOKEN) return true;
  if (auth.startsWith("Bearer ") && auth.slice(7).trim() === APP_TOKEN) return true;
  return false;
}

function mergeStatePatch(current, patch) {
  const next = { ...current };
  if (Object.prototype.hasOwnProperty.call(patch, "transactions")) next.transactions = patch.transactions;
  if (Object.prototype.hasOwnProperty.call(patch, "minStock")) next.minStock = patch.minStock;
  if (Object.prototype.hasOwnProperty.call(patch, "baseline")) next.baseline = patch.baseline;
  if (Object.prototype.hasOwnProperty.call(patch, "activeView")) next.activeView = patch.activeView;
  if (Object.prototype.hasOwnProperty.call(patch, "gsheetUrl")) next.gsheetUrl = patch.gsheetUrl;
  if (Object.prototype.hasOwnProperty.call(patch, "templateMeta")) next.templateMeta = patch.templateMeta;
  return sanitizeState(next);
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 400, { ok: false, error: "잘못된 요청입니다." });
    return;
  }

  if (req.method === "OPTIONS") {
    sendEmpty(res, 204);
    return;
  }

  const parsed = new URL(req.url, CANONICAL_ORIGIN);
  const pathname = parsed.pathname;
  const method = String(req.method || "GET").toUpperCase();

  const hostHeader = String(req.headers.host || "").toLowerCase();
  const isCanonicalHost = hostHeader === `${CANONICAL_HOST}:${PORT}`;
  const isLocalAlias =
    hostHeader.startsWith("localhost:") ||
    hostHeader.startsWith("127.0.0.1:") ||
    hostHeader.startsWith("0.0.0.0:") ||
    hostHeader.startsWith("[::1]:");
  const shouldRedirect = process.env.DISABLE_LOCAL_REDIRECT !== "1" && !isCanonicalHost && isLocalAlias && (method === "GET" || method === "HEAD");
  if (shouldRedirect) {
    res.writeHead(308, {
      ...BASE_HEADERS,
      Location: `${CANONICAL_ORIGIN}${req.url}`,
    });
    res.end();
    return;
  }

  if (pathname.startsWith("/api/") && pathname !== "/api/health" && !isAuthorized(req)) {
    sendJson(res, 401, { ok: false, error: "인증 실패: X-App-Token 헤더를 확인하세요." });
    return;
  }

  if (method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      service: "inventory-web-server",
      updatedAt: state.updatedAt,
      templateAvailable: hasTemplate(),
      tokenRequired: Boolean(APP_TOKEN),
    });
    return;
  }

  if (method === "GET" && pathname === "/api/state") {
    sendJson(res, 200, { ok: true, state: getClientState() });
    return;
  }

  if ((method === "PUT" || method === "POST") && pathname === "/api/state") {
    try {
      const payload = await readJsonBody(req);
      const patch = payload && typeof payload === "object" ? payload.state ?? payload : {};
      state = mergeStatePatch(state, patch);
      saveState();
      sendJson(res, 200, { ok: true, state: getClientState() });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error.message || "상태 저장 실패" });
    }
    return;
  }

  if (method === "GET" && pathname === "/api/template") {
    const templateB64 = readTemplateBase64();
    if (!templateB64) {
      sendJson(res, 404, { ok: false, error: "저장된 기준표 템플릿이 없습니다." });
      return;
    }
    sendJson(res, 200, { ok: true, template_b64: templateB64, meta: state.templateMeta || null });
    return;
  }

  if ((method === "PUT" || method === "POST") && pathname === "/api/template") {
    try {
      const payload = await readJsonBody(req);
      saveTemplateBase64(payload?.template_b64, payload?.meta || {});
      sendJson(res, 200, { ok: true, meta: state.templateMeta });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error.message || "템플릿 저장 실패" });
    }
    return;
  }

  if (method === "DELETE" && pathname === "/api/template") {
    clearTemplate();
    sendJson(res, 200, { ok: true });
    return;
  }

  if (method === "POST" && pathname === "/api/export-company-with-outbound") {
    try {
      const payload = await readJsonBody(req);
      const result = await runPythonExport(ensureTemplateInPayload(payload));
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error.message || "내보내기 처리 실패" });
    }
    return;
  }

  if (method === "POST" && pathname === "/api/export-company-by-zones") {
    try {
      const payload = await readJsonBody(req);
      const result = await runPythonExport(ensureTemplateInPayload(payload));
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error.message || "내보내기 처리 실패" });
    }
    return;
  }

  if (method === "GET") {
    const filePath = resolveStaticPath(pathname);
    if (!filePath) {
      sendJson(res, 403, { ok: false, error: "접근이 허용되지 않습니다." });
      return;
    }
    sendFile(res, filePath);
    return;
  }

  sendJson(res, 405, { ok: false, error: "지원하지 않는 메서드입니다." });
});

server.listen(PORT, HOST, () => {
  console.log(`[inventory-web] http://${HOST}:${PORT}`);
  console.log(`[inventory-web] data dir: ${DATA_DIR}`);
  if (APP_TOKEN) {
    console.log("[inventory-web] API token auth enabled");
  }
});
