import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hubDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(hubDir, "..");
const docsDir = path.join(repoRoot, "docs");
const historyDir = path.join(docsDir, "history");

async function main() {
    const config = await loadConfig();
    validateConfig(config);

    const syncResult = await fetchSourceIds(config);
    await writeArtifacts(syncResult, config);

    if (config.feishu.enabled) {
        await pushToFeishu(syncResult, config);
    } else {
        console.log("Feishu sync skipped.");
    }

    console.log(`Sync complete: ${syncResult.count} ids for ${syncResult.date}`);
}

async function loadConfig() {
    const localConfig = await readJsonIfExists(path.join(hubDir, "local.config.json"));

    return {
        source: {
            mode: envOr(localConfig, "source.mode", "simple"),
            url: envOr(localConfig, "source.url", ""),
            method: envOr(localConfig, "source.method", "GET").toUpperCase(),
            headers: jsonEnvOr(localConfig, "SOURCE_HEADERS_JSON", "source.headers", {}),
            bodyJson: jsonEnvOr(localConfig, "SOURCE_BODY_JSON", "source.bodyJson", {}),
            bodyForm: jsonEnvOr(localConfig, "SOURCE_BODY_FORM_JSON", "source.bodyForm", {}),
            segmentedKeys: jsonEnvOr(localConfig, "SOURCE_SEGMENT_KEYS_JSON", "source.segmentedKeys", []),
            stopText: envNamedOr(localConfig, "SOURCE_SEGMENT_STOP_TEXT", "source.stopText", ""),
            valuePath: envNamedOr(localConfig, "SOURCE_SEGMENT_VALUE_PATH", "source.valuePath", "value"),
            decodeUri: boolEnvOr(localConfig, "SOURCE_SEGMENT_DECODE_URI", "source.decodeUri", false),
            replaceQuestionWithPercent: boolEnvOr(localConfig, "SOURCE_SEGMENT_REPLACE_QUESTION", "source.replaceQuestionWithPercent", false)
        },
        publicBaseUrl: envNamedOr(localConfig, "PUBLIC_BASE_URL", "publicBaseUrl", ""),
        feishu: {
            enabled: boolEnvOr(localConfig, "FEISHU_ENABLED", "feishu.enabled", false),
            appId: envNamedOr(localConfig, "FEISHU_APP_ID", "feishu.appId", ""),
            appSecret: envNamedOr(localConfig, "FEISHU_APP_SECRET", "feishu.appSecret", ""),
            appToken: envNamedOr(localConfig, "FEISHU_APP_TOKEN", "feishu.appToken", ""),
            tableId: envNamedOr(localConfig, "FEISHU_TABLE_ID", "feishu.tableId", ""),
            dateField: envNamedOr(localConfig, "FEISHU_DATE_FIELD", "feishu.dateField", "date"),
            contentField: envNamedOr(localConfig, "FEISHU_CONTENT_FIELD", "feishu.contentField", "content"),
            countField: envNamedOr(localConfig, "FEISHU_COUNT_FIELD", "feishu.countField", "count"),
            statusField: envNamedOr(localConfig, "FEISHU_STATUS_FIELD", "feishu.statusField", "status"),
            updatedAtField: envNamedOr(localConfig, "FEISHU_UPDATED_AT_FIELD", "feishu.updatedAtField", "updated_at"),
            hashField: envNamedOr(localConfig, "FEISHU_HASH_FIELD", "feishu.hashField", "sha256")
        }
    };
}

function validateConfig(config) {
    if (!config.source.url) {
        throw new Error("Missing source.url / SOURCE_URL");
    }
    if (config.source.mode === "segmentedForm" && !Array.isArray(config.source.segmentedKeys)) {
        throw new Error("segmentedForm requires SOURCE_SEGMENT_KEYS_JSON as an array");
    }
}

async function fetchSourceIds(config) {
    const date = formatDate(new Date());
    const updatedAt = new Date().toISOString();

    let ids;
    if (config.source.mode === "segmentedForm") {
        ids = await fetchSegmentedForm(config.source);
    } else {
        ids = await fetchSimple(config.source);
    }

    const uniqueIds = uniqueList(ids);
    const text = uniqueIds.join("\n");
    const sha256 = crypto.createHash("sha256").update(text, "utf8").digest("hex");

    return {
        version: 1,
        date,
        updatedAt,
        count: uniqueIds.length,
        sha256,
        ids: uniqueIds,
        text
    };
}

async function fetchSimple(source) {
    const init = {
        method: source.method,
        headers: { ...source.headers }
    };

    if (source.method !== "GET" && Object.keys(source.bodyJson).length) {
        init.headers["content-type"] = init.headers["content-type"] || "application/json";
        init.body = JSON.stringify(source.bodyJson);
    } else if (source.method !== "GET" && Object.keys(source.bodyForm).length) {
        init.headers["content-type"] = init.headers["content-type"] || "application/x-www-form-urlencoded";
        init.body = new URLSearchParams(source.bodyForm).toString();
    }

    const response = await fetch(source.url, init);
    if (!response.ok) {
        throw new Error(`Source request failed: ${response.status}`);
    }

    const text = await response.text();
    return parsePayload(text);
}

async function fetchSegmentedForm(source) {
    const chunks = [];
    for (const key of source.segmentedKeys) {
        const formBody = { ...source.bodyForm, key };
        const response = await fetch(source.url, {
            method: source.method || "POST",
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                ...source.headers
            },
            body: new URLSearchParams(formBody).toString()
        });

        if (!response.ok) {
            throw new Error(`Segment request failed: ${response.status} for key ${key}`);
        }

        const raw = await response.text();
        let decoded = extractSegmentValue(raw, source);
        if (source.stopText && decoded.includes(source.stopText)) {
            decoded = decoded.replace(source.stopText, "").trim();
            if (decoded) {
                chunks.push(decoded);
            }
            break;
        }

        if (decoded) {
            chunks.push(decoded);
        }
    }

    return parsePayload(chunks.join("\n"));
}

function extractSegmentValue(raw, source) {
    let value = String(raw || "");
    try {
        const parsed = JSON.parse(value);
        const candidate = getByPath(parsed, source.valuePath);
        if (candidate !== undefined && candidate !== null) {
            value = String(candidate);
        }
    } catch {
        value = String(raw || "");
    }

    if (source.replaceQuestionWithPercent) {
        value = value.replace(/\?/g, "%");
    }
    if (source.decodeUri) {
        try {
            value = decodeURIComponent(value);
        } catch {
            // keep original value
        }
    }

    return value.trim();
}

function parsePayload(raw) {
    const text = String(raw || "").replace(/^\uFEFF/, "").trim();
    if (!text) {
        return [];
    }

    try {
        const parsed = JSON.parse(text);
        const idsFromJson = parseJsonIds(parsed);
        if (idsFromJson.length) {
            return idsFromJson;
        }
    } catch {
        // fall through to text parsing
    }

    return extractIdsFromText(text);
}

function parseJsonIds(value) {
    if (value === null || value === undefined) {
        return [];
    }

    if (Array.isArray(value)) {
        return uniqueList(value.flatMap((item) => parseJsonIds(item)));
    }

    if (typeof value === "string" || typeof value === "number") {
        const id = normalizeId(value);
        return id ? [id] : [];
    }

    if (typeof value === "object") {
        const priorityKeys = ["ids", "items", "data", "list", "records", "rows", "values", "content"];
        const collected = [];
        for (const key of priorityKeys) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                collected.push(...parseJsonIds(value[key]));
            }
        }
        if (collected.length) {
            return uniqueList(collected);
        }
        if (Object.prototype.hasOwnProperty.call(value, "id")) {
            const directId = normalizeId(value.id);
            if (directId) {
                return [directId];
            }
        }
    }

    return [];
}

function extractIdsFromText(text) {
    return uniqueList(
        String(text)
            .split(/\r\n|\r|\n/)
            .map((line) => normalizeId(line))
            .filter(Boolean)
    );
}

function normalizeId(value) {
    const match = String(value ?? "").match(/\d+/);
    return match ? match[0] : "";
}

function uniqueList(list) {
    return [...new Set(list.map((item) => String(item).trim()).filter(Boolean))];
}

async function writeArtifacts(result, config) {
    await fs.mkdir(historyDir, { recursive: true });

    const latestJson = buildLatestJson(result, config);
    const historyJsonPath = path.join(historyDir, `${result.date}.json`);
    const historyTxtPath = path.join(historyDir, `${result.date}.txt`);
    const latestJsonPath = path.join(docsDir, "latest.json");
    const latestTxtPath = path.join(docsDir, "latest.txt");

    await fs.writeFile(latestJsonPath, JSON.stringify(latestJson, null, 2) + "\n", "utf8");
    await fs.writeFile(latestTxtPath, result.text + (result.text ? "\n" : ""), "utf8");
    await fs.writeFile(historyJsonPath, JSON.stringify(latestJson, null, 2) + "\n", "utf8");
    await fs.writeFile(historyTxtPath, result.text + (result.text ? "\n" : ""), "utf8");
}

function buildLatestJson(result, config) {
    const json = {
        version: result.version,
        date: result.date,
        updatedAt: result.updatedAt,
        count: result.count,
        sha256: result.sha256,
        ids: result.ids
    };

    if (config.publicBaseUrl) {
        json.urls = {
            latestJson: `${trimRightSlash(config.publicBaseUrl)}/latest.json`,
            latestTxt: `${trimRightSlash(config.publicBaseUrl)}/latest.txt`,
            historyJson: `${trimRightSlash(config.publicBaseUrl)}/history/${result.date}.json`,
            historyTxt: `${trimRightSlash(config.publicBaseUrl)}/history/${result.date}.txt`
        };
    }

    return json;
}

async function pushToFeishu(result, config) {
    const feishu = config.feishu;
    if (!feishu.appId || !feishu.appSecret || !feishu.appToken || !feishu.tableId) {
        throw new Error("Feishu sync enabled but required credentials are missing");
    }

    const tokenResponse = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify({
            app_id: feishu.appId,
            app_secret: feishu.appSecret
        })
    });
    if (!tokenResponse.ok) {
        throw new Error(`Feishu token request failed: ${tokenResponse.status}`);
    }

    const tokenJson = await tokenResponse.json();
    if (!tokenJson.tenant_access_token) {
        throw new Error(`Feishu token response invalid: ${JSON.stringify(tokenJson)}`);
    }

    const fields = {};
    fields[feishu.dateField] = result.date;
    fields[feishu.contentField] = result.text;
    fields[feishu.countField] = result.count;
    fields[feishu.statusField] = "success";
    fields[feishu.updatedAtField] = result.updatedAt;
    fields[feishu.hashField] = result.sha256;

    const recordResponse = await fetch(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${feishu.appToken}/tables/${feishu.tableId}/records`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${tokenJson.tenant_access_token}`,
                "content-type": "application/json; charset=utf-8"
            },
            body: JSON.stringify({ fields })
        }
    );

    if (!recordResponse.ok) {
        const errorBody = await recordResponse.text();
        throw new Error(`Feishu record create failed: ${recordResponse.status} ${errorBody}`);
    }

    console.log("Feishu record created.");
}

function getByPath(value, dotPath) {
    const parts = String(dotPath || "value").split(".");
    let current = value;
    for (const part of parts) {
        if (current == null || !Object.prototype.hasOwnProperty.call(current, part)) {
            return undefined;
        }
        current = current[part];
    }
    return current;
}

function trimRightSlash(value) {
    return String(value || "").replace(/\/+$/, "");
}

function formatDate(date) {
    return [
        date.getUTCFullYear(),
        pad(date.getUTCMonth() + 1),
        pad(date.getUTCDate())
    ].join("-");
}

function pad(value) {
    return value < 10 ? `0${value}` : String(value);
}

async function readJsonIfExists(filePath) {
    try {
        const text = await fs.readFile(filePath, "utf8");
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function envOr(localConfig, pathKey, fallback) {
    const envKey = toEnvKey(pathKey);
    if (process.env[envKey] !== undefined && process.env[envKey] !== "") {
        return process.env[envKey];
    }
    const localValue = getLocal(localConfig, pathKey);
    if (localValue !== undefined && localValue !== null && localValue !== "") {
        return localValue;
    }
    return fallback;
}

function envNamedOr(localConfig, envKey, pathKey, fallback) {
    if (process.env[envKey] !== undefined && process.env[envKey] !== "") {
        return process.env[envKey];
    }
    const localValue = getLocal(localConfig, pathKey);
    if (localValue !== undefined && localValue !== null && localValue !== "") {
        return localValue;
    }
    return fallback;
}

function jsonEnvOr(localConfig, envKey, pathKey, fallback) {
    if (process.env[envKey]) {
        return JSON.parse(process.env[envKey]);
    }
    const localValue = getLocal(localConfig, pathKey);
    return localValue !== undefined && localValue !== null ? localValue : fallback;
}

function boolEnvOr(localConfig, envKey, pathKey, fallback) {
    if (process.env[envKey] !== undefined) {
        return /^(1|true|yes)$/i.test(process.env[envKey]);
    }
    const localValue = getLocal(localConfig, pathKey);
    return localValue !== undefined && localValue !== null ? Boolean(localValue) : fallback;
}

function getLocal(localConfig, pathKey) {
    if (!localConfig) {
        return undefined;
    }
    const parts = pathKey.split(".");
    let current = localConfig;
    for (const part of parts) {
        if (current == null || !Object.prototype.hasOwnProperty.call(current, part)) {
            return undefined;
        }
        current = current[part];
    }
    return current;
}

function toEnvKey(pathKey) {
    return String(pathKey).replace(/\./g, "_").toUpperCase();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
