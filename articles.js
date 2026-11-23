var ZeroStockArticles = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/articles.mjs
  var articles_exports = {};
  __export(articles_exports, {
    ARTICLE_KINDS: () => ARTICLE_KINDS,
    applyStockMovement: () => applyStockMovement,
    articleKind: () => articleKind,
    assignContainerUnits: () => assignContainerUnits,
    calculateConfiguration: () => calculateConfiguration,
    configurationMaterials: () => configurationMaterials,
    containerMovementRows: () => containerMovementRows,
    createMovementMetadata: () => createMovementMetadata,
    kindLabel: () => kindLabel,
    movementMetadata: () => movementMetadata,
    parseSerialNumbers: () => parseSerialNumbers,
    sameMovementIdentity: () => sameMovementIdentity,
    serialDependencies: () => serialDependencies,
    unassignedStock: () => unassignedStock,
    validateArticle: () => validateArticle,
    validateMovement: () => validateMovement
  });

  // src/container-serials.mjs
  function invalid(message) {
    const error = new Error(message);
    error.code = "INVALID_CONTAINER_SERIAL";
    throw error;
  }
  function parseSerialNumbers(input) {
    const list = typeof input === "string" ? input.split(/\r\n|[\r\n]/).filter((line) => line.trim()) : input;
    if (!Array.isArray(list) || !list.length) invalid("Mindestens eine Seriennummer vom Containeretikett erfassen.");
    const seen = /* @__PURE__ */ new Set();
    for (const value of list) {
      if (typeof value !== "string") invalid("Seriennummern als Text erfassen.");
      const number = value.trim();
      if (!number || number.length > 120 || /[\x00-\x1f\x7f]/.test(number) || /[\uD800-\uDFFF]/u.test(number)) {
        invalid("Je Zeile eine Seriennummer mit h\xF6chstens 120 Zeichen erfassen.");
      }
      if (seen.has(number)) invalid("Seriennummer mehrfach erfasst: " + number);
      seen.add(number);
    }
    return [...seen];
  }
  function unitKey(number) {
    const bytes = new TextEncoder().encode(number);
    return "s" + Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  function unitRevision(unit) {
    if (!unit) return "new";
    return unit.moveId ? "move:" + unit.moveId : "assigned:" + unit.updatedAt;
  }
  function serialOrigins(article, numbers) {
    return numbers.map((number) => unitRevision(article.containerUnits?.[unitKey(number)]));
  }
  function inStock(article) {
    return Object.values(article.containerUnits || {}).filter((unit) => unit.status === "in").length;
  }
  function unassignedStock(article) {
    return Number(article.stock) - inStock(article);
  }
  function updateUnits(article, numbers, action, move) {
    if (article.kind !== "container") invalid("Seriennummern geh\xF6ren zu Containerartikeln.");
    const units = { ...article.containerUnits };
    for (const [index, number] of numbers.entries()) {
      const key = unitKey(number), previous = units[key];
      if (move.serialOrigins && move.serialOrigins[index] !== unitRevision(previous)) {
        invalid("Der Zustand wurde zwischenzeitlich ge\xE4ndert. Etikett und Bestand pr\xFCfen: " + number);
      }
      if (action === "assign" && previous) invalid("Seriennummer bereits zugeordnet: " + number);
      if (action === "in" && previous?.status === "in") invalid("Container bereits im Lager: " + number);
      if ((action === "out" || action === "shrink") && previous?.status !== "in") {
        invalid("F\xFCr diese Seriennummer ist kein Container im Lager zugeordnet: " + number);
      }
      units[key] = {
        number,
        status: action === "assign" ? "in" : action,
        updatedAt: move.ts,
        ...move.id ? { moveId: move.id } : {},
        ...move.partner ? { partner: move.partner } : {},
        ...move.reference ? { reference: move.reference } : {}
      };
    }
    const updated = { ...article, containerUnits: units };
    updated.serialStock = inStock(updated);
    return updated;
  }
  function assignContainerUnits(article, input, ts) {
    const numbers = parseSerialNumbers(input);
    if (numbers.length > unassignedStock(article)) invalid("Mehr Etiketten als unzugeordnete Container im Bestand.");
    return updateUnits(article, numbers, "assign", { ts });
  }
  function applyStockMovement(article, move) {
    const qty = Number(move.qty), current = Number(article.stock);
    const stock = current + (move.type === "in" ? qty : -qty);
    if (!["in", "out", "shrink"].includes(move.type) || !Number.isSafeInteger(qty) || qty <= 0 || !Number.isSafeInteger(current) || current < 0 || !Number.isSafeInteger(stock)) throw Error("INVALID_STOCK");
    if (stock < 0) throw Error("INSUFFICIENT_STOCK_SERVER");
    let result = article;
    if (move.serialNumbers !== void 0) {
      const numbers = parseSerialNumbers(move.serialNumbers);
      if (numbers.length !== qty) invalid("Die Buchungsmenge muss der Anzahl Etiketten entsprechen.");
      result = updateUnits(article, numbers, move.type, move);
    } else if (article.containerUnits && move.type !== "in" && qty > unassignedStock(article)) {
      invalid("F\xFCr diesen Bestand ist eine Buchung mit Seriennummern erforderlich.");
    }
    return { ...result, stock };
  }

  // src/articles.mjs
  var ARTICLE_KINDS = Object.freeze(["carton", "plate", "container"]);
  var messages = {
    INVALID_KIND: "Bitte eine g\xFCltige Artikelart w\xE4hlen.",
    INVALID_BOOKING: "Die Buchungsdaten sind ung\xFCltig. Bitte Menge und Textfelder pr\xFCfen.",
    IMMUTABLE_ARTICLE: "Die Artikelnummer kann nach dem Anlegen nicht ge\xE4ndert werden.",
    IMMUTABLE_KIND: "Die bereits festgelegte Artikelart kann nicht ge\xE4ndert werden.",
    REQUIRED_TEXT: "Artikelnummer, Bezeichnung und Lagerplatz sind erforderlich.",
    INVALID_TEXT: "Ein Textfeld ist ung\xFCltig oder zu lang.",
    INVALID_QUANTITY: "Mengen m\xFCssen sichere ganze Zahlen ab null sein.",
    INVALID_THRESHOLDS: "Der Warnbestand muss mindestens dem Mindestbestand entsprechen.",
    INVALID_ORDER: "Die gew\xFCnschte Anzahl muss eine positive ganze Zahl sein.",
    INVALID_CONTAINER: "Bitte einen vorhandenen, aktiven Containerartikel w\xE4hlen.",
    INVALID_PLATE: "Eine Plate-Komponente fehlt, ist inaktiv oder hat eine andere Artikelart.",
    EMPTY_COMPONENTS: "Mindestens eine Plate-Komponente ist erforderlich.",
    DUPLICATE_COMPONENT: "Jeder Plate-Artikel darf nur einmal vorkommen.",
    INVALID_COMPONENT: "Jede Plate-Menge muss eine positive ganze Zahl sein.",
    INVALID_CONFIGURATION: "Die Container-Konfiguration ist ung\xFCltig. Bitte pr\xFCfen und erneut speichern.",
    QUANTITY_OVERFLOW: "Die angefragte Menge ist zu gross f\xFCr eine sichere Berechnung."
  };
  function fail(code) {
    const error = new Error(messages[code]);
    error.code = code;
    throw error;
  }
  function text(value, maximum, required = false) {
    if (value == null) value = "";
    if (typeof value !== "string") fail("INVALID_TEXT");
    const result = value.trim();
    if (result.length > maximum) fail("INVALID_TEXT");
    if (required && !result) fail("REQUIRED_TEXT");
    return result;
  }
  function whole(value, positive = false, code = "INVALID_QUANTITY") {
    if (typeof value === "string" && !value.trim()) fail(code);
    if (!["string", "number"].includes(typeof value)) fail(code);
    const n = Number(value);
    if (!Number.isSafeInteger(n) || n < (positive ? 1 : 0)) fail(code);
    return n;
  }
  function articleKind(article) {
    if (article?.kind == null || article.kind === "") return "carton";
    return ARTICLE_KINDS.includes(article.kind) ? article.kind : "unknown";
  }
  function kindLabel(kind, language = "de") {
    return (language === "en" ? { carton: "Carton", plate: "Plate", container: "Container", unknown: "Unknown article type" } : { carton: "Karton", plate: "Plate", container: "Container", unknown: "Unbekannte Artikelart" })[kind] || "Artikel";
  }
  function validateArticle(input, previous) {
    const kind = input.kind ?? "carton";
    if (!ARTICLE_KINDS.includes(kind)) fail("INVALID_KIND");
    if (previous?.kind && previous.kind !== kind) fail("IMMUTABLE_KIND");
    if (previous?.article && text(input.article, 120, true) !== previous.article) fail("IMMUTABLE_ARTICLE");
    const result = {
      id: input.id,
      article: text(input.article, 120, true),
      name: text(input.name, 200, true),
      location: text(input.location, 120, true),
      kind,
      stock: whole(input.stock),
      warn: whole(input.warn),
      min: whole(input.min),
      externalRef: text(input.externalRef, 120)
    };
    if (result.warn < result.min) fail("INVALID_THRESHOLDS");
    return result;
  }
  function configurationMaterials(containerId, plates, articles) {
    const byId = new Map(articles.map((a) => [String(a.id), a]));
    const target = byId.get(String(containerId));
    if (!target || target.active === false || articleKind(target) !== "container") fail("INVALID_CONTAINER");
    if (!Array.isArray(plates) || !plates.length) fail("EMPTY_COMPONENTS");
    const seen = /* @__PURE__ */ new Set();
    return [{ cartonId: String(containerId), qty: 1 }, ...plates.map((row) => {
      const id = String(row.cartonId || "");
      if (seen.has(id)) fail("DUPLICATE_COMPONENT");
      seen.add(id);
      const plate = byId.get(id);
      if (!plate || plate.active === false || articleKind(plate) !== "plate") fail("INVALID_PLATE");
      return { cartonId: id, qty: whole(row.qty, true, "INVALID_COMPONENT") };
    })];
  }
  function calculateConfiguration(configuration, articles, quantity) {
    const n = whole(quantity, true, "INVALID_ORDER");
    if (configuration?.kind !== "container" || !Array.isArray(configuration.materials)) fail("INVALID_CONFIGURATION");
    const targetId = String(configuration.containerId || "");
    const targetRows = configuration.materials.filter((m) => String(m.cartonId) === targetId);
    if (targetRows.length !== 1 || targetRows[0].qty !== 1) fail("INVALID_CONFIGURATION");
    const materials = configurationMaterials(
      targetId,
      configuration.materials.filter((m) => String(m.cartonId) !== targetId),
      articles
    );
    const byId = new Map(articles.map((a) => [String(a.id), a]));
    let capacity = Number.MAX_SAFE_INTEGER, bottleneck = "";
    const lines = materials.map((m) => {
      const article = byId.get(m.cartonId);
      const available = whole(article.stock);
      const required = n * m.qty;
      if (!Number.isSafeInteger(required)) fail("QUANTITY_OVERFLOW");
      const possible = Math.floor(available / m.qty);
      if (possible < capacity) {
        capacity = possible;
        bottleneck = m.cartonId;
      }
      return {
        id: m.cartonId,
        article: article.article,
        name: article.name,
        kind: articleKind(article),
        perUnit: m.qty,
        available,
        required,
        missing: Math.max(0, required - available),
        remaining: Math.max(0, available - required)
      };
    });
    return { capacity, bottleneck, canFulfill: lines.every((x) => x.missing === 0), quantity: n, lines };
  }
  function movementMetadata(record = {}) {
    const result = {};
    if (record.articleKind != null) {
      if (!ARTICLE_KINDS.includes(record.articleKind)) fail("INVALID_KIND");
      result.articleKind = record.articleKind;
    }
    for (const [key, maximum] of [["externalRef", 120], ["partner", 120], ["reference", 200]]) {
      if (record[key] == null) continue;
      const value = text(record[key], maximum);
      if (value || key === "externalRef") result[key] = value;
    }
    if (record.serialNumbers !== void 0) {
      if (record.articleKind !== "container") fail("INVALID_BOOKING");
      result.serialNumbers = parseSerialNumbers(record.serialNumbers);
      if (record.serialOrigins !== void 0) {
        if (!Array.isArray(record.serialOrigins) || record.serialOrigins.length !== result.serialNumbers.length || record.serialOrigins.some((value) => typeof value !== "string" || !value || value.length > 200)) fail("INVALID_BOOKING");
        result.serialOrigins = [...record.serialOrigins];
      }
    }
    return result;
  }
  function createMovementMetadata(article, options = {}) {
    const numbers = articleKind(article) === "container" ? parseSerialNumbers(options.serialNumbers) : options.serialNumbers;
    const metadata = movementMetadata({
      articleKind: articleKind(article),
      externalRef: article.externalRef || "",
      partner: options.partner,
      reference: options.reference,
      serialNumbers: numbers
    });
    if (metadata.serialNumbers) metadata.serialOrigins = serialOrigins(article, metadata.serialNumbers);
    return metadata;
  }
  function validateMovement(move) {
    if (!["in", "out", "shrink"].includes(move.type)) fail("INVALID_BOOKING");
    const metadata = movementMetadata(move), qty = whole(move.qty, true, "INVALID_BOOKING");
    if (metadata.serialNumbers && metadata.serialNumbers.length !== qty) fail("INVALID_BOOKING");
    return {
      ...move,
      ...metadata,
      qty,
      cartonId: text(move.cartonId, 120, true),
      article: text(move.article, 120, true),
      userId: text(move.userId, 128, true),
      userName: text(move.userName, 120),
      reason: text(move.reason, 500),
      note: text(move.note, 1e3)
    };
  }
  function sameMovementIdentity(a, b) {
    return a.userId === b.userId && a.cartonId === b.cartonId && a.type === b.type && Number(a.qty) === Number(b.qty) && ["articleKind", "externalRef", "partner", "reference"].every((key) => (a[key] ?? "") === (b[key] ?? "")) && JSON.stringify(a.serialNumbers ?? null) === JSON.stringify(b.serialNumbers ?? null) && JSON.stringify(a.serialOrigins ?? null) === JSON.stringify(b.serialOrigins ?? null);
  }
  function serialDependencies(move) {
    return (move.serialNumbers || []).map((number) => JSON.stringify([move.cartonId, number]));
  }
  function containerMovementRows(movements, articles) {
    const byId = new Map(articles.map((a) => [String(a.id), a]));
    return movements.filter((m) => (m.articleKind || articleKind(byId.get(String(m.cartonId)))) === "container").map((m) => {
      const article = byId.get(String(m.cartonId));
      const meta = movementMetadata(m);
      return {
        id: m.serverId || m.id,
        articleId: m.cartonId,
        article: m.article || article?.article || "",
        externalRef: meta.externalRef ?? (m.articleKind ? "" : article?.externalRef || ""),
        direction: m.type,
        quantity: Number(m.qty),
        ts: Number(m.ts) || 0,
        userName: m.userName || "",
        partner: meta.partner || "",
        reference: meta.reference || "",
        serialNumbers: meta.serialNumbers || [],
        stockAfter: Number(m.stockAfter)
      };
    });
  }
  return __toCommonJS(articles_exports);
})();
