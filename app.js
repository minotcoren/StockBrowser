const state = {
  originalData: [],
  allColumns: [],
  displayedColumns: ["Ticker"],
  filters: {},
  hiddenRows: new Set(),
  currentSort: { column: null, order: null },
  expandedRows: new Set()
};

const $ = id => document.getElementById(id);

const excelFileInput = $("excelFile");
const columnSearchInput = $("columnSearchInput");
const columnsSelect = $("columnsSelect");
const toggleFavoriteColumnBtn = $("toggleFavoriteColumnBtn");
const addColumnBtn = $("addColumnBtn");
const controls = $("controls");
const dataTable = $("dataTable");
const tableHeader = $("tableHeader");
const tableBody = $("tableBody");
const resultCount = $("resultCount");
const resetBtn = $("resetBtn");

const openConfigsBtn = $("openConfigsBtn");
const configModalBackdrop = $("configModalBackdrop");
const closeConfigsBtn = $("closeConfigsBtn");
const applyConfigBtn = $("applyConfigBtn");
const configSelect = $("configSelect");
const configPreview = $("configPreview");
const infoModalBackdrop = $("infoModalBackdrop");
const closeInfoBtn = $("closeInfoBtn");
const infoModalTitle = $("infoModalTitle");
const infoStatus = $("infoStatus");
const infoSummary = $("infoSummary");
const infoSourceLink = $("infoSourceLink");
let lastFocusedElement = null;

const DETAIL_GROUPS = [
  { key: "financials", label: "Compte de resultat" },
  { key: "balance", label: "Bilan" },
  { key: "cashflow", label: "Cash-flow" },
  { key: "annual", label: "Autres donnees annuelles" }
];

const COMPUTED_COLUMNS = [
  "Industry avg P/E",
  "P/E discount vs industry (%)",
  "Bearish upside (%)",
  "Mean upside (%)",
  "Bullish upside (%)"
];

const FAVORITE_COLUMNS_STORAGE_KEY = "tableauInteractif.favoriteColumns";
const favoriteColumns = loadFavoriteColumns();

excelFileInput.addEventListener("change", handleFile);
columnSearchInput.addEventListener("input", updateColumnsSelect);
columnsSelect.addEventListener("change", updateFavoriteColumnButton);
toggleFavoriteColumnBtn.addEventListener("click", toggleSelectedColumnFavorite);
addColumnBtn.addEventListener("click", addSelectedColumn);
resetBtn.addEventListener("click", resetFilters);

openConfigsBtn.addEventListener("click", openConfigModal);
closeConfigsBtn.addEventListener("click", closeConfigModal);
configSelect.addEventListener("change", updateConfigPreview);
applyConfigBtn.addEventListener("click", applySelectedConfig);
closeInfoBtn.addEventListener("click", closeInfoModal);

configModalBackdrop.addEventListener("click", e => {
  if (e.target === configModalBackdrop) closeConfigModal();
});

infoModalBackdrop.addEventListener("click", e => {
  if (e.target === infoModalBackdrop) closeInfoModal();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !configModalBackdrop.classList.contains("hidden")) {
    closeConfigModal();
  }

  if (e.key === "Escape" && !infoModalBackdrop.classList.contains("hidden")) {
    closeInfoModal();
  }
});

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (typeof XLSX === "undefined") {
    alert("La librairie XLSX n'est pas chargee. Verifie ta connexion ou installe-la localement.");
    return;
  }

  const reader = new FileReader();

  reader.onload = evt => {
    try {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        alert("Fichier vide ou illisible.");
        return;
      }

      const sheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const headerRow = jsonData[0] || [];

      if (!jsonData.length || !headerRow.length) {
        alert("Fichier vide ou illisible.");
        return;
      }

      state.allColumns = headerRow;
      state.originalData = jsonData.slice(1);
      enrichDataWithComputedColumns();
      state.hiddenRows.clear();
      state.expandedRows.clear();
      state.currentSort = { column: null, order: null };
      state.filters = {};

      const defaultConfig = CONFIGS["Master Filtre"];

      if (defaultConfig) {
        applyConfig(defaultConfig);
      } else {
        state.displayedColumns = state.allColumns.includes("Ticker")
          ? ["Ticker"]
          : state.allColumns.slice(0, 1);
        state.displayedColumns.forEach(col => {
          state.filters[col] = isNumericColumn(col)
            ? { minVal: "", maxVal: "" }
            : { text: "" };
        });
      }

      controls.classList.remove("hidden");
      dataTable.classList.remove("hidden");

      updateColumnsSelect();
      render();
    } catch (error) {
      console.error(error);
      alert("Impossible de lire ce fichier. Verifie qu'il s'agit bien d'un fichier Excel ou CSV valide.");
    }
  };

  reader.onerror = () => {
    alert("Impossible de charger le fichier selectionne.");
  };

  reader.readAsArrayBuffer(file);
}

function render() {
  renderHeader();
  renderFilterRow();
  updateStickyHeaderOffset();
  renderRows(getFilteredRows());
  updateColumnsSelect();
}

function updateStickyHeaderOffset() {
  const mainHeaderRow = tableHeader.querySelector("tr:not(.filter-row)");
  if (!mainHeaderRow) return;

  const applyOffset = () => {
    const height = mainHeaderRow.getBoundingClientRect().height;
    dataTable.style.setProperty("--table-header-height", `${height}px`);
  };

  applyOffset();
  requestAnimationFrame(applyOffset);
}

function renderFilteredRowsDebounced() {
  clearTimeout(renderFilteredRowsDebounced.timer);
  renderFilteredRowsDebounced.timer = setTimeout(() => {
    renderRows(getFilteredRows());
  }, 180);
}

function clearColumnFilter(colName) {
  state.filters[colName] = isNumericColumn(colName)
    ? { minVal: "", maxVal: "" }
    : { text: "" };

  render();
}

function getRecommendationClass(row) {
  const recommendationIndex = getFirstColumnIndex(["Recommendation key"]);
  if (recommendationIndex < 0) return "";

  const recommendation = String(row[recommendationIndex] ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]+/g, "-");

  return recommendation ? `recommendation-${recommendation}` : "";
}

function loadFavoriteColumns() {
  try {
    const stored = localStorage.getItem(FAVORITE_COLUMNS_STORAGE_KEY);
    const values = stored ? JSON.parse(stored) : [];
    return new Set(Array.isArray(values) ? values : []);
  } catch {
    return new Set();
  }
}

function saveFavoriteColumns() {
  localStorage.setItem(
    FAVORITE_COLUMNS_STORAGE_KEY,
    JSON.stringify(Array.from(favoriteColumns))
  );
}

function enrichDataWithComputedColumns() {
  const industryIndex = getFirstColumnIndex([
    "Industry",
    "Industry display name",
    "Industry key"
  ]);
  const sectorIndex = getFirstColumnIndex([
    "Sector",
    "Sector display name",
    "Sector key"
  ]);
  const peIndex = getFirstColumnIndex(["Trailing P/E ratio"]);
  const currentPriceIndex = getFirstColumnIndex(["Current price"]);
  const targetLowIndex = getFirstColumnIndex(["Target low price"]);
  const targetMeanIndex = getFirstColumnIndex([
    "Target mean price",
    "Target median price"
  ]);
  const targetHighIndex = getFirstColumnIndex(["Target high price"]);

  const peerGroupIndex = industryIndex >= 0 ? industryIndex : sectorIndex;
  if (peerGroupIndex < 0) return;

  const peerPeValues = new Map();

  state.originalData.forEach(row => {
    const peerGroup = normalizePeerGroup(row[peerGroupIndex]);
    const pe = peIndex >= 0 ? parseNumericValue(row[peIndex]) : NaN;

    if (!peerGroup || !isUsablePe(pe)) return;

    if (!peerPeValues.has(peerGroup)) {
      peerPeValues.set(peerGroup, []);
    }

    peerPeValues.get(peerGroup).push(pe);
  });

  const peerAveragePe = new Map();

  peerPeValues.forEach((values, peerGroup) => {
    peerAveragePe.set(
      peerGroup,
      values.reduce((sum, value) => sum + value, 0) / values.length
    );
  });

  const computedStartIndex = state.allColumns.length;
  state.allColumns = state.allColumns.concat(COMPUTED_COLUMNS);

  state.originalData = state.originalData.map(row => {
    const nextRow = row.slice();
    const peerGroup = normalizePeerGroup(nextRow[peerGroupIndex]);
    const peerAvgPe = peerAveragePe.get(peerGroup) ?? "";
    const pe = peIndex >= 0 ? parseNumericValue(nextRow[peIndex]) : NaN;
    const currentPrice =
      currentPriceIndex >= 0 ? parseNumericValue(nextRow[currentPriceIndex]) : NaN;

    const computedValues = [
      peerAvgPe,
      getPeDiscount(pe, peerAvgPe),
      getUpside(currentPrice, targetLowIndex >= 0 ? nextRow[targetLowIndex] : ""),
      getUpside(currentPrice, targetMeanIndex >= 0 ? nextRow[targetMeanIndex] : ""),
      getUpside(currentPrice, targetHighIndex >= 0 ? nextRow[targetHighIndex] : "")
    ];

    computedValues.forEach((value, index) => {
      nextRow[computedStartIndex + index] = value;
    });

    return nextRow;
  });
}

function getFirstColumnIndex(names) {
  return names
    .map(name => state.allColumns.indexOf(name))
    .find(index => index >= 0) ?? -1;
}

function normalizePeerGroup(value) {
  return String(value ?? "").trim();
}

function isUsablePe(value) {
  return Number.isFinite(value) && value > 0 && value <= 200;
}

function getPeDiscount(pe, sectorAvgPe) {
  if (!isUsablePe(pe) || !isUsablePe(sectorAvgPe)) return "";
  return ((sectorAvgPe - pe) / sectorAvgPe) * 100;
}

function getUpside(currentPrice, targetPrice) {
  const target = parseNumericValue(targetPrice);
  if (!Number.isFinite(currentPrice) || currentPrice <= 0 || !Number.isFinite(target)) {
    return "";
  }

  return ((target - currentPrice) / currentPrice) * 100;
}

function renderHeader() {
  tableHeader.innerHTML = "";

  const row = document.createElement("tr");

  const resetTh = document.createElement("th");
  const resetHiddenBtn = button("↺", "remove-btn", () => {
    state.hiddenRows.clear();
    render();
  });
  resetHiddenBtn.title = "Reafficher les lignes masquees";
  resetTh.appendChild(resetHiddenBtn);
  row.appendChild(resetTh);

  state.displayedColumns.forEach(colName => {
    const th = document.createElement("th");
    th.classList.add(isNumericColumn(colName) ? "numeric-column" : "text-column");
    th.draggable = true;

    th.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", colName);
    });

    th.addEventListener("dragover", e => e.preventDefault());

    th.addEventListener("drop", e => {
      e.preventDefault();

      const from = state.displayedColumns.indexOf(
        e.dataTransfer.getData("text/plain")
      );
      const to = state.displayedColumns.indexOf(colName);

      if (from !== -1 && to !== -1 && from !== to) {
        const [moved] = state.displayedColumns.splice(from, 1);
        state.displayedColumns.splice(to, 0, moved);
        render();
      }
    });

    const headerContent = document.createElement("div");
    headerContent.className = "column-header";

    const title = document.createElement("div");
    title.className = "column-title";
    title.textContent = colName;

    const actions = document.createElement("div");
    actions.className = "column-actions";

    const clearFilterBtn = button("⌫", "header-action-btn clear-filter-btn", () => {
      clearColumnFilter(colName);
    });
    clearFilterBtn.title = "Effacer le filtre de cette colonne";

    const removeBtn = button("×", "header-action-btn remove-btn", () => {
      state.displayedColumns = state.displayedColumns.filter(c => c !== colName);
      delete state.filters[colName];

      if (state.currentSort.column === colName) {
        state.currentSort = { column: null, order: null };
      }

      render();
    });
    removeBtn.title = "Supprimer la colonne";

    actions.appendChild(clearFilterBtn);
    actions.appendChild(removeBtn);

    ["asc", "desc"].forEach(order => {
      const sortBtn = button(order === "asc" ? "↑" : "↓", "header-action-btn sort-btn", () => {
        state.currentSort = { column: colName, order };
        render();
      });
      sortBtn.title = order === "asc" ? "Tri croissant" : "Tri decroissant";

      if (
        state.currentSort.column === colName &&
        state.currentSort.order === order
      ) {
        sortBtn.classList.add("sort-active");
      }

      actions.appendChild(sortBtn);
    });

    headerContent.appendChild(title);
    headerContent.appendChild(actions);
    th.appendChild(headerContent);
    row.appendChild(th);
  });

  const detailsTh = document.createElement("th");
  detailsTh.textContent = "Details";
  row.appendChild(detailsTh);

  tableHeader.appendChild(row);
}

function renderFilterRow() {
  const row = document.createElement("tr");
  row.classList.add("filter-row");

  row.appendChild(document.createElement("th"));

  state.displayedColumns.forEach(colName => {
    const th = document.createElement("th");
    const isNum = isNumericColumn(colName);
    th.classList.add(isNum ? "numeric-column" : "text-column");

    if (colName === "Ticker" || !isNum) {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Filtrer...";
      input.value = state.filters[colName]?.text || "";

      input.addEventListener("input", () => {
        state.filters[colName] = { text: input.value.trim() };
        renderFilteredRowsDebounced();
      });

      th.appendChild(input);
    } else {
      const filter = state.filters[colName] || { minVal: "", maxVal: "" };
      state.filters[colName] = filter;

      const wrapper = document.createElement("div");
      wrapper.className = "range-filter";

      ["minVal", "maxVal"].forEach((key, index) => {
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = index === 0 ? "Min" : "Max";
        input.value = filter[key] || "";

        input.addEventListener("input", () => {
          state.filters[colName][key] = input.value.trim();
          renderFilteredRowsDebounced();
        });

        wrapper.appendChild(input);
      });

      th.appendChild(wrapper);
    }

    row.appendChild(th);
  });

  row.appendChild(document.createElement("th"));
  tableHeader.appendChild(row);
}

function renderRows(data) {
  tableBody.innerHTML = "";

  if (!data.length) {
    const emptyTr = document.createElement("tr");
    emptyTr.className = "empty-row";

    const emptyTd = document.createElement("td");
    emptyTd.colSpan = state.displayedColumns.length + 2;
    emptyTd.textContent = "Aucun resultat pour ces filtres.";

    emptyTr.appendChild(emptyTd);
    tableBody.appendChild(emptyTr);
    resultCount.textContent = "0 resultat";
    return;
  }

  data.forEach(item => {
    const { row, index } = item;

    const tr = document.createElement("tr");
    tr.classList.add(getRecommendationClass(row));

    const removeTd = document.createElement("td");
    removeTd.appendChild(
      button("×", "row-remove-btn", () => {
        state.hiddenRows.add(index);
        renderRows(getFilteredRows());
      })
    );
    tr.appendChild(removeTd);

    state.displayedColumns.forEach(colName => {
      const td = document.createElement("td");
      const colIndex = state.allColumns.indexOf(colName);
      const value = row[colIndex];
      td.classList.add(isNumericColumn(colName) ? "numeric-column" : "text-column");
      addValueTone(td, colName, value);

      if (colName === "Ticker") {
        td.appendChild(createTickerCell(value, row));
      } else {
        td.textContent = formatTableValue(colName, value);
      }

      tr.appendChild(td);
    });

    const detailsTd = document.createElement("td");
    detailsTd.appendChild(
      button("Voir", "btn secondary", () => toggleDetails(tr, item))
    );
    tr.appendChild(detailsTd);

    tableBody.appendChild(tr);

    if (state.expandedRows.has(index)) {
      insertDetailsRow(tr, item);
    }
  });

  resultCount.textContent = `${data.length} resultat(s)`;
}

function getFilteredRows() {
  let rows = state.originalData
    .map((row, index) => ({ row, index }))
    .filter(item => {
      if (state.hiddenRows.has(item.index)) return false;

      return state.displayedColumns.every(colName => {
        const colIndex = state.allColumns.indexOf(colName);
        if (colIndex < 0) return true;

        const raw = item.row[colIndex];
        const value = String(raw ?? "").trim();
        const filter = state.filters[colName];

        if (!filter) return true;

        if ("text" in filter) {
          const text = filter.text.toLowerCase();
          return !text || value.toLowerCase().includes(text);
        }

        const num = parseNumericValue(value);
        const min = filter.minVal;
        const max = filter.maxVal;

        if ((min || max) && Number.isNaN(num)) return false;
        if (min && num < parseNumericValue(min)) return false;
        if (max && num > parseNumericValue(max)) return false;

        return true;
      });
    });

  if (state.currentSort.column) {
    const colIndex = state.allColumns.indexOf(state.currentSort.column);
    const direction = state.currentSort.order === "asc" ? 1 : -1;

    rows.sort((a, b) => {
      const aValue = a.row[colIndex];
      const bValue = b.row[colIndex];

      const aNum = parseNumericValue(aValue);
      const bNum = parseNumericValue(bValue);

      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
        return (aNum - bNum) * direction;
      }

      return String(aValue ?? "").localeCompare(String(bValue ?? "")) * direction;
    });
  }

  return rows;
}

function applyConfig(config, options = {}) {
  state.displayedColumns = (config.columns || ["Ticker"]).filter(
    col => col !== "URL" && state.allColumns.includes(col)
  );

  if (!state.displayedColumns.length && state.allColumns.length) {
    state.displayedColumns = state.allColumns.slice(0, 1);
  }

  state.filters = {};

  state.displayedColumns.forEach(col => {
    const provided = config.filters?.[col];

    if (provided?.text !== undefined) {
      state.filters[col] = { text: provided.text };
    } else if (provided) {
      state.filters[col] = {
        minVal: provided.minVal ?? "",
        maxVal: provided.maxVal ?? ""
      };
    } else if (isNumericColumn(col)) {
      state.filters[col] = { minVal: "", maxVal: "" };
    } else {
      state.filters[col] = { text: "" };
    }
  });

  if (!options.skipSort && config.sort) {
    state.currentSort = config.sort;
  }

  state.hiddenRows.clear();
  state.expandedRows.clear();
}

function applySelectedConfig() {
  const name = configSelect.value;
  const config = CONFIGS[name];

  if (!config) return;

  const missing = (config.columns || []).filter(
    col => col !== "URL" && !state.allColumns.includes(col)
  );

  if (missing.length) {
    alert("Colonnes absentes du fichier : " + missing.join(", "));
  }

  applyConfig(config);
  closeConfigModal();
  render();
}

function openConfigModal() {
  lastFocusedElement = document.activeElement;
  configSelect.innerHTML = "";

  Object.keys(CONFIGS).forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    configSelect.appendChild(option);
  });

  updateConfigPreview();
  configModalBackdrop.classList.remove("hidden");
  configSelect.focus();
}

function closeConfigModal() {
  configModalBackdrop.classList.add("hidden");
  lastFocusedElement?.focus();
}

function updateConfigPreview() {
  const name = configSelect.value;
  configPreview.textContent = JSON.stringify(CONFIGS[name], null, 2);
}

function addSelectedColumn() {
  const col = columnsSelect.value;
  if (!col) return;

  state.displayedColumns.push(col);

  state.filters[col] = isNumericColumn(col)
    ? { minVal: "", maxVal: "" }
    : { text: "" };

  render();
}

function resetFilters() {
  state.filters = {};

  state.displayedColumns.forEach(col => {
    state.filters[col] = isNumericColumn(col)
      ? { minVal: "", maxVal: "" }
      : { text: "" };
  });

  state.hiddenRows.clear();
  state.expandedRows.clear();
  state.currentSort = { column: null, order: null };

  render();
}

function updateColumnsSelect() {
  const previousValue = columnsSelect.value;
  const query = columnSearchInput.value.trim().toLowerCase();
  columnsSelect.innerHTML = "";

  const remaining = state.allColumns.filter(
    col =>
      col !== "URL" &&
      !String(col).includes("Year_") &&
      !state.displayedColumns.includes(col) &&
      (!query || String(col).toLowerCase().includes(query))
  );

  const favorites = remaining.filter(col => favoriteColumns.has(col));
  const others = remaining.filter(col => !favoriteColumns.has(col));

  appendColumnOptions("Favoris", favorites);
  appendColumnOptions(favorites.length ? "Toutes les colonnes" : "", others);

  if (remaining.includes(previousValue)) {
    columnsSelect.value = previousValue;
  }

  const hasRemaining = Boolean(remaining.length);
  columnsSelect.disabled = !hasRemaining;
  addColumnBtn.disabled = !hasRemaining;
  toggleFavoriteColumnBtn.disabled = !hasRemaining;
  updateFavoriteColumnButton();
}

function appendColumnOptions(label, columns) {
  if (!columns.length) return;

  const parent = label ? document.createElement("optgroup") : columnsSelect;
  if (label) parent.label = label;

  columns.forEach(col => {
    const option = document.createElement("option");
    option.value = col;
    option.textContent = favoriteColumns.has(col) ? `★ ${col}` : col;
    parent.appendChild(option);
  });

  if (label) columnsSelect.appendChild(parent);
}

function updateFavoriteColumnButton() {
  const col = columnsSelect.value;
  const isFavorite = favoriteColumns.has(col);

  toggleFavoriteColumnBtn.textContent = isFavorite ? "★" : "☆";
  toggleFavoriteColumnBtn.classList.toggle("favorite-active", isFavorite);
  toggleFavoriteColumnBtn.title = isFavorite
    ? "Retirer des favoris"
    : "Ajouter aux favoris";
}

function toggleSelectedColumnFavorite() {
  const col = columnsSelect.value;
  if (!col) return;

  if (favoriteColumns.has(col)) {
    favoriteColumns.delete(col);
  } else {
    favoriteColumns.add(col);
  }

  saveFavoriteColumns();
  updateColumnsSelect();
}

function toggleDetails(mainRow, item) {
  if (state.expandedRows.has(item.index)) {
    state.expandedRows.delete(item.index);

    const next = mainRow.nextSibling;
    if (next?.classList.contains("detail-row")) next.remove();

    return;
  }

  state.expandedRows.add(item.index);
  insertDetailsRow(mainRow, item);
}

function insertDetailsRow(mainRow, item) {
  const detailTr = document.createElement("tr");
  detailTr.classList.add("detail-row");

  const td = document.createElement("td");
  td.colSpan = state.displayedColumns.length + 2;

  const sections = getYearlyDetailSections(item);

  if (!sections.length) {
    td.textContent = "Aucun detail disponible pour cette ligne.";
    detailTr.appendChild(td);
    mainRow.parentNode.insertBefore(detailTr, mainRow.nextSibling);
    focusDetailRow(detailTr);
    return;
  }

  const panel = document.createElement("div");
  panel.className = "detail-panel";
  panel.appendChild(createUnifiedDetailTable(sections));

  td.appendChild(panel);
  detailTr.appendChild(td);

  mainRow.parentNode.insertBefore(detailTr, mainRow.nextSibling);
  focusDetailRow(detailTr);
}

function getYearlyDetailSections(item) {
  const sectionsByKey = new Map(
    DETAIL_GROUPS.map(group => [
      group.key,
      {
        ...group,
        years: new Set(),
        metrics: new Map()
      }
    ])
  );

  state.allColumns.forEach((columnName, index) => {
    const parsed = parseYearlyColumnName(columnName);
    if (!parsed) return;

    const { groupKey, metricName, year } = parsed;
    const section = sectionsByKey.get(groupKey);
    if (!section) return;

    section.years.add(year);

    const value = item.row[index];
    if (isEmptyValue(value)) return;

    if (!section.metrics.has(metricName)) {
      section.metrics.set(metricName, new Map());
    }

    section.metrics.get(metricName).set(year, value);
  });

  const sections = DETAIL_GROUPS.map(group => sectionsByKey.get(group.key))
    .map(section => ({
      ...section,
      years: Array.from(section.years).sort(),
      metrics: Array.from(section.metrics.entries()).map(([name, values]) => ({
        name,
        values
      }))
    }))
    .filter(section => section.years.length && section.metrics.length);

  const primarySections = sections.filter(section => section.key !== "annual");
  return primarySections.length
    ? primarySections
    : sections.filter(section => section.key === "annual");
}

function parseYearlyColumnName(columnName) {
  const name = String(columnName).trim();

  const prefixed = name.match(/^(financials|balance|cashflow)_(.+)_(20\d{2})$/);
  if (prefixed) {
    return {
      groupKey: prefixed[1],
      metricName: prefixed[2],
      year: prefixed[3]
    };
  }

  const annual = name.match(/^(.+)\s+\((20\d{2})\)$/);
  if (annual) {
    return {
      groupKey: "annual",
      metricName: annual[1],
      year: annual[2]
    };
  }

  return null;
}

function focusDetailRow(detailRow) {
  const tableCard = dataTable.closest(".table-card");

  if (tableCard) {
    tableCard.scrollLeft = 0;
  }

  detailRow.scrollIntoView({
    block: "nearest",
    behavior: "smooth"
  });
}

function createUnifiedDetailTable(sections) {
  const years = Array.from(
    new Set(sections.flatMap(section => section.years))
  ).sort();

  const tableWrap = document.createElement("div");
  tableWrap.className = "detail-table-wrap";

  const table = document.createElement("table");
  table.className = "detail-mini-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.appendChild(textCell("th", "KPI"));

  years.forEach(year => {
    headerRow.appendChild(textCell("th", year));
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  sections.forEach(section => {
    const groupRow = document.createElement("tr");
    groupRow.className = "detail-group-row";

    const groupCell = textCell(
      "td",
      `${section.label} (${section.metrics.length} KPI)`
    );
    groupCell.colSpan = years.length + 1;
    groupRow.appendChild(groupCell);
    tbody.appendChild(groupRow);

    section.metrics.forEach(metric => {
      const row = document.createElement("tr");
      row.appendChild(textCell("td", humanizeMetricName(metric.name)));

      years.forEach(year => {
        row.appendChild(textCell("td", formatDetailValue(metric.values.get(year))));
      });

      tbody.appendChild(row);
    });
  });

  table.appendChild(tbody);
  tableWrap.appendChild(table);

  return tableWrap;
}

function humanizeMetricName(metricName) {
  return String(metricName).replace(/\s+/g, " ").trim();
}

function formatDetailValue(value) {
  if (isEmptyValue(value)) return "";

  if (typeof value === "number" && Number.isFinite(value)) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2
    }).format(value);
  }

  return String(value);
}

function formatTableValue(columnName, value) {
  if (isEmptyValue(value)) return "";

  const number = typeof value === "number" ? value : parseNumericValue(value);

  if (COMPUTED_COLUMNS.includes(columnName) && Number.isFinite(number)) {
    const formatted = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: columnName.includes("(%)") ? 1 : 2
    }).format(number);

    return columnName.includes("(%)") ? `${formatted}%` : formatted;
  }

  if (isNumericColumn(columnName) && Number.isFinite(number)) {
    return formatNumber(number);
  }

  return value;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2
  }).format(value);
}

function createTickerCell(ticker, row) {
  const wrapper = document.createElement("div");
  wrapper.className = "cell-with-action";

  const link = document.createElement("a");
  link.href = buildYahooQuoteUrl(ticker);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = ticker ?? "N/A";

  wrapper.appendChild(link);

  if (!isEmptyValue(ticker)) {
    const infoBtn = button("i", "info-cell-btn", () => {
      openCompanyInfoModal(row);
    });
    infoBtn.title = `Chercher l'activite de ${ticker}`;
    infoBtn.setAttribute("aria-label", `Chercher l'activite de ${ticker}`);
    wrapper.appendChild(infoBtn);
  }

  return wrapper;
}

function openCompanyInfoModal(row) {
  const ticker = getRowValueByNames(row, ["Ticker", "Ticker symbol"]);
  const longName = getRowValueByNames(row, ["Long company name"]);
  const shortName = getRowValueByNames(row, ["Short company name"]);
  const excelSummary = getRowValueByNames(row, ["Company long business summary"]);
  const website = getRowValueByNames(row, ["Website URL"]);
  const sector = getRowValueByNames(row, ["Sector", "Sector display name"]);
  const industry = getRowValueByNames(row, ["Industry", "Industry display name"]);
  const companyName = longName || shortName || ticker;

  lastFocusedElement = document.activeElement;
  infoModalTitle.textContent = `${companyName || "Entreprise"}${ticker ? ` (${ticker})` : ""}`;
  infoStatus.textContent = "Recherche de l'activite de l'entreprise...";
  infoSummary.textContent = "";
  infoSourceLink.textContent = "Ouvrir la source";
  infoSourceLink.classList.add("hidden");
  infoSourceLink.removeAttribute("href");
  infoModalBackdrop.classList.remove("hidden");
  closeInfoBtn.focus();

  fetchCompanyActivitySummary({ ticker, companyName })
    .then(result => {
      if (result.summary) {
        infoStatus.textContent = result.source || "Resume trouve";
        infoSummary.textContent = result.summary;

        if (result.url) {
          infoSourceLink.href = result.url;
          infoSourceLink.classList.remove("hidden");
        }

        return;
      }

      showExcelCompanySummary({
        excelSummary,
        website,
        sector,
        industry
      });
    })
    .catch(() => {
      showExcelCompanySummary({
        excelSummary,
        website,
        sector,
        industry
      });
    });
}

function showExcelCompanySummary({ excelSummary, website, sector, industry }) {
  if (excelSummary) {
    infoStatus.textContent = "Resume issu du fichier Excel";
    infoSummary.textContent = [
      excelSummary,
      sector ? `Secteur : ${sector}` : "",
      industry ? `Industrie : ${industry}` : ""
    ].filter(Boolean).join("\n\n");

    if (website) {
      infoSourceLink.href = website;
      infoSourceLink.textContent = "Ouvrir le site de l'entreprise";
      infoSourceLink.classList.remove("hidden");
    }

    return;
  }

  infoStatus.textContent = "Aucune information trouvee.";
  infoSummary.textContent = "Le web n'a pas renvoye de resume exploitable et le fichier Excel ne contient pas de description pour cette entreprise.";
}

function getRowValueByNames(row, names) {
  const index = getFirstColumnIndex(names);
  return index >= 0 ? row[index] : "";
}

function fetchCompanyActivitySummary({ ticker, companyName }) {
  const query = [companyName, ticker].filter(Boolean).join(" ");

  if (!query) {
    return Promise.resolve({ summary: "", source: "", url: "" });
  }

  return searchWikipediaPage(query)
    .then(pageTitle => {
      if (!pageTitle && companyName && companyName !== ticker) {
        return searchWikipediaPage(companyName);
      }

      return pageTitle;
    })
    .then(pageTitle => {
      if (!pageTitle) return { summary: "", source: "", url: "" };
      return fetchWikipediaSummary(pageTitle);
    });
}

function searchWikipediaPage(query) {
  const params = new URLSearchParams({
    action: "opensearch",
    search: query,
    limit: "1",
    namespace: "0",
    redirects: "resolve",
    format: "json",
    origin: "*"
  });

  return fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`)
    .then(response => response.json())
    .then(data => data?.[1]?.[0] || "");
}

function fetchWikipediaSummary(pageTitle) {
  const urlTitle = encodeURIComponent(pageTitle.replace(/\s+/g, "_"));

  return fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${urlTitle}`)
    .then(response => {
      if (!response.ok) return null;
      return response.json();
    })
    .then(data => {
      if (!data?.extract) {
        return { summary: "", source: "", url: "" };
      }

      return {
        summary: data.extract,
        source: "Source : Wikipedia",
        url: data.content_urls?.desktop?.page || ""
      };
    });
}

function closeInfoModal() {
  infoModalBackdrop.classList.add("hidden");
  lastFocusedElement?.focus();
}

function addValueTone(cell, columnName, value) {
  if (!COMPUTED_COLUMNS.includes(columnName) || !columnName.includes("(%)")) return;

  const number = typeof value === "number" ? value : parseNumericValue(value);
  if (!Number.isFinite(number) || number === 0) return;

  cell.classList.add(number > 0 ? "value-positive" : "value-negative");
}

function isEmptyValue(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function isNumericColumn(colName) {
  const colIndex = state.allColumns.indexOf(colName);
  if (colIndex < 0) return false;

  let checked = 0;
  let numeric = 0;

  for (const row of state.originalData) {
    if (checked >= 30) break;

    const value = row[colIndex];
    if (value === undefined || value === null || String(value).trim() === "") {
      continue;
    }

    checked++;

    if (!Number.isNaN(parseNumericValue(value))) {
      numeric++;
    }
  }

  return checked > 0 && numeric / checked >= 0.6;
}

function parseNumericValue(value) {
  if (value === undefined || value === null || value === "") return NaN;

  let clean = String(value).replace(/[€$£¥]/g, "").trim();
  let multiplier = 1;

  const suffix = clean.match(/([MBK%])$/i);

  if (suffix) {
    const s = suffix[1].toUpperCase();

    if (s === "B") multiplier = 1e9;
    if (s === "M") multiplier = 1e6;
    if (s === "K") multiplier = 1e3;

    clean = clean.slice(0, -1);
  }

  if (clean.includes(",") && clean.includes(".")) {
    clean = clean.replace(/,/g, "");
  } else if (clean.includes(",")) {
    clean = clean.replace(/,/g, ".");
  }

  const number = parseFloat(clean);

  return Number.isNaN(number) ? NaN : number * multiplier;
}

function buildYahooQuoteUrl(ticker) {
  const cleanTicker = String(ticker || "").trim();
  return cleanTicker ? `https://finance.yahoo.com/quote/${cleanTicker}/` : "#";
}

function button(text, className, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = text;
  btn.className = className;
  btn.addEventListener("click", onClick);
  return btn;
}

function textCell(tag, text) {
  const cell = document.createElement(tag);
  cell.textContent = text ?? "";
  return cell;
}
