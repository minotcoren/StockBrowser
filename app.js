const state = {
  originalData: [],
  allColumns: [],
  displayedColumns: ["Ticker"],
  filters: {},
  exchangeFilter: new Set(),
  hiddenRows: new Set(),
  currentSort: { column: null, order: null },
  expandedRows: new Set(),
  viewMode: "table",
  scatterColumns: [],
  scatterTrendline: false,
  scatterZeroLines: true,
  scatterColorByRecommendation: true,
  scatterPointSize: 5.2
};

const $ = id => document.getElementById(id);

const excelFileInput = $("excelFile");
const columnsModalBackdrop = $("columnsModalBackdrop");
const columnSearchInput = $("columnSearchInput");
const columnOptionsList = $("columnOptionsList");
const selectedColumnsList = $("selectedColumnsList");
const columnPickerStatus = $("columnPickerStatus");
const closeColumnsBtn = $("closeColumnsBtn");
const applyColumnsBtn = $("applyColumnsBtn");
const clearDraftColumnsBtn = $("clearDraftColumnsBtn");
const controls = $("controls");
const dataTable = $("dataTable");
const tableHeader = $("tableHeader");
const tableBody = $("tableBody");
const resultCount = $("resultCount");
const resetBtn = $("resetBtn");
const tableViewBtn = $("tableViewBtn");
const scatterViewBtn = $("scatterViewBtn");
const openAxesBtn = $("openAxesBtn");
const scatterView = $("scatterView");
const scatterPlot = $("scatterPlot");
const scatterHint = $("scatterHint");
const scatterTooltip = $("scatterTooltip");
const invertAxesBtn = $("invertAxesBtn");
const trendlineToggle = $("trendlineToggle");
const trendlineStats = $("trendlineStats");
const zeroLinesToggle = $("zeroLinesToggle");
const recommendationColorsToggle = $("recommendationColorsToggle");
const pointSizeInput = $("pointSizeInput");
const axesModalBackdrop = $("axesModalBackdrop");
const axisSearchInput = $("axisSearchInput");
const axisOptionsList = $("axisOptionsList");
const selectedAxesList = $("selectedAxesList");
const axisPickerStatus = $("axisPickerStatus");
const closeAxesBtn = $("closeAxesBtn");
const applyAxesBtn = $("applyAxesBtn");
const clearDraftAxesBtn = $("clearDraftAxesBtn");

const openConfigsBtn = $("openConfigsBtn");
const configModalBackdrop = $("configModalBackdrop");
const closeConfigsBtn = $("closeConfigsBtn");
const applyConfigBtn = $("applyConfigBtn");
const configSelect = $("configSelect");
const configPreview = $("configPreview");
const configNameInput = $("configNameInput");
const saveConfigBtn = $("saveConfigBtn");
const setDefaultConfigBtn = $("setDefaultConfigBtn");
const deleteConfigBtn = $("deleteConfigBtn");
const defaultConfigLabel = $("defaultConfigLabel");
const infoModalBackdrop = $("infoModalBackdrop");
const closeInfoBtn = $("closeInfoBtn");
const infoModalTitle = $("infoModalTitle");
const infoStatus = $("infoStatus");
const infoSummary = $("infoSummary");
const infoSourceLink = $("infoSourceLink");
const openMarketsBtn = $("openMarketsBtn");
const marketsModalBackdrop = $("marketsModalBackdrop");
const marketMap = $("marketMap");
const exchangeMapCountries = $("exchangeMapCountries");
const exchangeMapLabels = $("exchangeMapLabels");
const marketMapStatus = $("marketMapStatus");
const closeMarketsBtn = $("closeMarketsBtn");
const applyMarketsBtn = $("applyMarketsBtn");
const clearMarketsBtn = $("clearMarketsBtn");
const loadingOverlay = $("loadingOverlay");
const loadingProgressBar = $("loadingProgressBar");
const loadingStatus = $("loadingStatus");
const loadingPercent = $("loadingPercent");
let lastFocusedElement = null;
let loadingTimer = null;
let loadingStartedAt = 0;
let draftExchangeFilter = new Set();
let draftColumnsToAdd = new Set();
let draftAxisColumns = new Set();

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

const EXCHANGE_COUNTRIES = {
  AMS: { countryId: "528", country: "Pays-Bas", lonLat: [4.9, 52.37], labelOffset: [8, -8] },
  BRU: { countryId: "056", country: "Belgique", lonLat: [4.35, 50.85], labelOffset: [12, 14] },
  ISE: { countryId: "372", country: "Irlande", lonLat: [-6.26, 53.35], labelOffset: [0, 0] },
  LIS: { countryId: "620", country: "Portugal", lonLat: [-9.14, 38.72], labelOffset: [0, 0] },
  MIL: { countryId: "380", country: "Italie", lonLat: [9.19, 45.46], labelOffset: [18, -4] },
  OSL: { countryId: "578", country: "Norvege", lonLat: [10.75, 59.91], labelOffset: [0, 0] },
  PAR: { countryId: "250", country: "France", lonLat: [2.35, 48.86], labelOffset: [0, 0] },
  YHD: { countryId: "826", country: "Royaume-Uni", lonLat: [-0.13, 51.51], labelOffset: [0, 0] }
};

const EUROPE_COUNTRY_IDS = new Set([
  "008", "020", "040", "056", "070", "100", "191", "196", "203", "208",
  "233", "246", "250", "276", "300", "348", "352", "372", "380", "428",
  "438", "440", "442", "470", "498", "499", "528", "578", "616", "620",
  "642", "688", "703", "705", "724", "752", "756", "807", "826"
]);

let exchangeMapFeatures = [];
let exchangeMapRendered = false;

const FAVORITE_COLUMNS_STORAGE_KEY = "tableauInteractif.favoriteColumns";
const CUSTOM_CONFIGS_STORAGE_KEY = "tableauInteractif.customConfigs";
const DEFAULT_CONFIG_STORAGE_KEY = "tableauInteractif.defaultConfig";
const LAST_VIEW_STORAGE_KEY = "tableauInteractif.lastView";
const favoriteColumns = loadFavoriteColumns();
let customConfigs = loadCustomConfigs();

function getAllConfigs() {
  return {
    ...CONFIGS,
    ...customConfigs
  };
}

excelFileInput.addEventListener("change", handleFile);
columnSearchInput.addEventListener("input", updateColumnsSelect);
closeColumnsBtn.addEventListener("click", closeColumnsModal);
applyColumnsBtn.addEventListener("click", applyDraftColumns);
clearDraftColumnsBtn.addEventListener("click", clearDraftColumns);
resetBtn.addEventListener("click", resetFilters);
tableViewBtn.addEventListener("click", () => setViewMode("table"));
scatterViewBtn.addEventListener("click", () => setViewMode("scatter"));
openAxesBtn.addEventListener("click", openAxesModal);
invertAxesBtn.addEventListener("click", invertScatterAxes);
trendlineToggle.addEventListener("change", () => {
  state.scatterTrendline = trendlineToggle.checked;
  renderScatterPlot(getFilteredRows());
  saveLastViewConfig();
});
zeroLinesToggle.addEventListener("change", () => {
  state.scatterZeroLines = zeroLinesToggle.checked;
  renderScatterPlot(getFilteredRows());
  saveLastViewConfig();
});
recommendationColorsToggle.addEventListener("change", () => {
  state.scatterColorByRecommendation = recommendationColorsToggle.checked;
  renderScatterPlot(getFilteredRows());
  saveLastViewConfig();
});
pointSizeInput.addEventListener("input", () => {
  state.scatterPointSize = parseFloat(pointSizeInput.value) || 5.2;
  renderScatterPlot(getFilteredRows());
  saveLastViewConfig();
});
axisSearchInput.addEventListener("input", updateAxesSelect);
closeAxesBtn.addEventListener("click", closeAxesModal);
applyAxesBtn.addEventListener("click", applyDraftAxes);
clearDraftAxesBtn.addEventListener("click", clearDraftAxes);

openConfigsBtn.addEventListener("click", openConfigModal);
closeConfigsBtn.addEventListener("click", closeConfigModal);
configSelect.addEventListener("change", updateConfigPreview);
applyConfigBtn.addEventListener("click", applySelectedConfig);
saveConfigBtn.addEventListener("click", saveCurrentConfig);
setDefaultConfigBtn.addEventListener("click", setSelectedConfigAsDefault);
deleteConfigBtn.addEventListener("click", deleteSelectedCustomConfig);
closeInfoBtn.addEventListener("click", closeInfoModal);
openMarketsBtn.addEventListener("click", openMarketsModal);
closeMarketsBtn.addEventListener("click", closeMarketsModal);
applyMarketsBtn.addEventListener("click", applyMarketSelection);
clearMarketsBtn.addEventListener("click", clearMarketSelection);

marketMap.addEventListener("click", e => {
  const node = e.target.closest(".market-region, .exchange-map-label");
  if (node) toggleDraftExchange(node.dataset.exchange);
});

marketMap.addEventListener("keydown", e => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const node = e.target.closest(".market-region");
  if (!node) return;
  e.preventDefault();
  toggleDraftExchange(node.dataset.exchange);
});

configModalBackdrop.addEventListener("click", e => {
  if (e.target === configModalBackdrop) closeConfigModal();
});

columnsModalBackdrop.addEventListener("click", e => {
  if (e.target === columnsModalBackdrop) closeColumnsModal();
});

axesModalBackdrop.addEventListener("click", e => {
  if (e.target === axesModalBackdrop) closeAxesModal();
});

infoModalBackdrop.addEventListener("click", e => {
  if (e.target === infoModalBackdrop) closeInfoModal();
});

marketsModalBackdrop.addEventListener("click", e => {
  if (e.target === marketsModalBackdrop) closeMarketsModal();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !configModalBackdrop.classList.contains("hidden")) {
    closeConfigModal();
  }

  if (e.key === "Escape" && !columnsModalBackdrop.classList.contains("hidden")) {
    closeColumnsModal();
  }

  if (e.key === "Escape" && !axesModalBackdrop.classList.contains("hidden")) {
    closeAxesModal();
  }

  if (e.key === "Escape" && !infoModalBackdrop.classList.contains("hidden")) {
    closeInfoModal();
  }

  if (e.key === "Escape" && !marketsModalBackdrop.classList.contains("hidden")) {
    closeMarketsModal();
  }
});

function startLoadingOverlay(fileName) {
  const steps = [
    "Loading Wealth...",
    "Buying low-quality noise... then deleting it...",
    "Separating signal from BLSHT...",
    "Pricing dreams against reality...",
    "Stacking filters, not excuses...",
    "Preparing the tracker..."
  ];
  let progress = 4;
  let stepIndex = 0;

  clearInterval(loadingTimer);
  resetLoadingOverlay();
  loadingStartedAt = performance.now();
  loadingOverlay.classList.remove("hidden");
  updateLoadingOverlay(progress, `Loading wealth from ${fileName || "ton fichier"}...`, true);

  loadingTimer = setInterval(() => {
    progress = Math.min(progress + Math.random() * 2.2 + 0.7, 86);
    stepIndex = Math.min(
      Math.floor((progress / 88) * steps.length),
      steps.length - 1
    );
    updateLoadingOverlay(progress, steps[stepIndex]);
  }, 650);
}

function updateLoadingOverlay(progress, message, force = false) {
  const current = parseFloat(loadingProgressBar.dataset.progress || "0");
  const next = force ? progress : Math.max(progress, current);
  const displayValue = Math.round(next);
  loadingProgressBar.dataset.progress = String(displayValue);
  loadingProgressBar.style.width = `${displayValue}%`;
  loadingStatus.textContent = message;
  loadingPercent.textContent = `${displayValue}%`;
}

function resetLoadingOverlay() {
  loadingProgressBar.style.transition = "none";
  loadingProgressBar.dataset.progress = "0";
  loadingProgressBar.style.width = "0%";
  loadingStatus.textContent = "Initialisation...";
  loadingPercent.textContent = "0%";
  loadingProgressBar.offsetHeight;
  loadingProgressBar.style.transition = "";
}

function finishLoadingOverlay(message = "Donnees chargees") {
  clearInterval(loadingTimer);
  const elapsed = performance.now() - loadingStartedAt;
  const wait = Math.max(0, 2600 - elapsed);

  setTimeout(() => {
    updateLoadingOverlay(100, message);

    setTimeout(() => {
      loadingOverlay.classList.add("hidden");
    }, 1050);
  }, wait);
}

function failLoadingOverlay(message) {
  clearInterval(loadingTimer);
  updateLoadingOverlay(100, message);

  setTimeout(() => {
    loadingOverlay.classList.add("hidden");
  }, 900);
}

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (typeof Worker === "undefined") {
    alert("Ton navigateur ne supporte pas le chargement en arriere-plan.");
    return;
  }

  startLoadingOverlay(file.name);

  parseExcelFileInWorker(file)
    .then(({ headerRow, rows }) => {
    try {
      if (!headerRow.length) {
        failLoadingOverlay("Fichier vide");
        alert("Fichier vide ou illisible.");
        return;
      }

      updateLoadingOverlay(86, "Calcul des signaux BLSHT...");
      state.allColumns = headerRow;
      state.originalData = rows;
      enrichDataWithComputedColumns();
      state.hiddenRows.clear();
      state.expandedRows.clear();
      state.currentSort = { column: null, order: null };
      state.filters = {};
      state.exchangeFilter.clear();
      state.scatterColumns = getDefaultScatterColumns();

      const configs = getAllConfigs();
      const lastViewConfig = loadLastViewConfig();
      const defaultConfigName = getDefaultConfigName();
      const defaultConfig =
        getValidConfigForCurrentFile(lastViewConfig) ||
        configs[defaultConfigName] ||
        configs["Master Filtre"];

      if (defaultConfig) {
        updateLoadingOverlay(92, "Application de ta strategie...");
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

      updateLoadingOverlay(96, "Construction du cockpit...");
      updateColumnsSelect();
      render();
      finishLoadingOverlay("Wealth tracker ready");
    } catch (error) {
      console.error(error);
      failLoadingOverlay("Chargement interrompu");
      alert("Impossible de lire ce fichier. Verifie qu'il s'agit bien d'un fichier Excel ou CSV valide.");
    }
  })
  .catch(error => {
    console.error(error);
    failLoadingOverlay("Lecture du fichier impossible");
    alert("Impossible de charger le fichier selectionne.");
  });
}

function parseExcelFileInWorker(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = evt => {
      const worker = createExcelWorker();

      worker.onmessage = event => {
        const { type, progress, message, payload, error } = event.data;

        if (type === "progress") {
          updateLoadingOverlay(progress, message);
          return;
        }

        worker.terminate();

        if (type === "done") {
          resolve(payload);
        } else {
          reject(new Error(error || "Excel worker failed"));
        }
      };

      worker.onerror = error => {
        worker.terminate();
        reject(error);
      };

      updateLoadingOverlay(16, "Envoi au moteur anti-BLSHT...");
      worker.postMessage(evt.target.result, [evt.target.result]);
    };

    reader.onerror = () => reject(new Error("FileReader failed"));

    updateLoadingOverlay(8, "Ouverture du deal flow local...");
    reader.readAsArrayBuffer(file);
  });
}

function createExcelWorker() {
  const workerScript = `
    self.onmessage = event => {
      try {
        self.postMessage({ type: "progress", progress: 24, message: "Boot du wealth engine..." });
        importScripts("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.3/xlsx.full.min.js");

        self.postMessage({ type: "progress", progress: 38, message: "Audit du classeur..." });
        const data = new Uint8Array(event.data);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
          self.postMessage({ type: "error", error: "Fichier vide ou illisible." });
          return;
        }

        self.postMessage({ type: "progress", progress: 58, message: "Extraction des lignes investissables..." });
        const sheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const headerRow = jsonData[0] || [];

        self.postMessage({ type: "progress", progress: 76, message: "Nettoyage du bruit de marche..." });
        self.postMessage({
          type: "done",
          payload: {
            headerRow,
            rows: jsonData.slice(1)
          }
        });
      } catch (error) {
        self.postMessage({ type: "error", error: error.message || String(error) });
      }
    };
  `;
  const blob = new Blob([workerScript], { type: "application/javascript" });
  return new Worker(URL.createObjectURL(blob));
}

function render() {
  renderHeader();
  renderFilterRow();
  updateStickyHeaderOffset();
  const filteredRows = getFilteredRows();
  renderRows(filteredRows);
  renderScatterPlot(filteredRows);
  updateViewMode();
  updateColumnsSelect();
  updateAxesSelect();
  updateMarketFilterButton();
  saveLastViewConfig();
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
    const filteredRows = getFilteredRows();
    renderRows(filteredRows);
    renderScatterPlot(filteredRows);
    saveLastViewConfig();
  }, 180);
}

function setViewMode(mode) {
  state.viewMode = mode === "scatter" ? "scatter" : "table";

  if (state.viewMode === "scatter" && getScatterAxisPair().length < 2) {
    state.scatterColumns = getDefaultScatterColumns();
  }

  render();
}

function updateViewMode() {
  const isScatter = state.viewMode === "scatter";
  const tableCard = dataTable.closest(".table-card");

  dataTable.classList.remove("hidden");
  dataTable.classList.toggle("filters-only", isScatter);
  scatterView.classList.toggle("hidden", !isScatter);
  tableCard?.classList.toggle("scatter-mode", isScatter);
  tableViewBtn.classList.toggle("active", !isScatter);
  scatterViewBtn.classList.toggle("active", isScatter);
  openAxesBtn.classList.toggle("hidden", !isScatter);
  openAxesBtn.disabled = getNumericScatterColumns().length < 2;
}

function getNumericScatterColumns() {
  return state.allColumns.filter(
    col =>
      col !== "URL" &&
      !String(col).includes("Year_") &&
      isNumericColumn(col)
  );
}

function getDefaultScatterColumns() {
  const numericColumns = getNumericScatterColumns();
  const preferred = [
    "Mean upside (%)",
    "P/E discount vs industry (%)",
    "Current price",
    "Trailing P/E ratio"
  ].filter(col => numericColumns.includes(col));

  return Array.from(new Set(preferred.concat(numericColumns))).slice(0, 2);
}

function getScatterAxisPair() {
  return state.scatterColumns
    .filter(col => state.allColumns.includes(col) && isNumericColumn(col))
    .slice(0, 2);
}

function renderScatterPlot(data) {
  scatterPlot.innerHTML = "";
  scatterTooltip.classList.add("hidden");
  trendlineToggle.checked = state.scatterTrendline;
  zeroLinesToggle.checked = state.scatterZeroLines;
  recommendationColorsToggle.checked = state.scatterColorByRecommendation;
  pointSizeInput.value = String(state.scatterPointSize);
  trendlineStats.textContent = "R² -";

  const [xColumn, yColumn] = getScatterAxisPair();

  if (!xColumn || !yColumn) {
    scatterHint.textContent = "Choisis deux dimensions numeriques avec le bouton Axes.";
    invertAxesBtn.disabled = true;
    trendlineToggle.disabled = true;
    return;
  }

  invertAxesBtn.disabled = false;
  trendlineToggle.disabled = false;

  if (!window.d3) {
    scatterHint.textContent = "Le moteur graphique D3 n'est pas charge.";
    trendlineToggle.disabled = true;
    return;
  }

  const xIndex = state.allColumns.indexOf(xColumn);
  const yIndex = state.allColumns.indexOf(yColumn);
  const tickerIndex = getFirstColumnIndex(["Ticker", "Ticker symbol"]);
  const recommendationIndex = getFirstColumnIndex(["Recommendation key"]);
  const points = data
    .map(item => {
      const x = parseNumericValue(item.row[xIndex]);
      const y = parseNumericValue(item.row[yIndex]);

      return {
        item,
        x,
        y,
        ticker: tickerIndex >= 0 ? item.row[tickerIndex] : "",
        recommendation: recommendationIndex >= 0 ? item.row[recommendationIndex] : ""
      };
    })
    .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));

  if (!points.length) {
    scatterHint.textContent = "Aucun point exploitable avec ces deux dimensions et les filtres actuels.";
    trendlineToggle.disabled = true;
    return;
  }

  trendlineToggle.disabled = points.length < 2;

  const width = 1080;
  const height = 620;
  const margin = { top: 28, right: 32, bottom: 78, left: 86 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const xExtent = getPaddedExtent(points.map(point => point.x));
  const yExtent = getPaddedExtent(points.map(point => point.y));
  const xScale = d3.scaleLinear().domain(xExtent).nice().range([0, plotWidth]);
  const yScale = d3.scaleLinear().domain(yExtent).nice().range([plotHeight, 0]);
  const svg = d3.select(scatterPlot);
  const plot = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  plot.append("g")
    .attr("class", "scatter-grid")
    .attr("transform", `translate(0,${plotHeight})`)
    .call(d3.axisBottom(xScale).ticks(8).tickSize(-plotHeight).tickFormat(""));

  plot.append("g")
    .attr("class", "scatter-grid")
    .call(d3.axisLeft(yScale).ticks(7).tickSize(-plotWidth).tickFormat(""));

  plot.append("g")
    .attr("class", "scatter-axis")
    .attr("transform", `translate(0,${plotHeight})`)
    .call(d3.axisBottom(xScale).ticks(8).tickFormat(formatAxisTick));

  plot.append("g")
    .attr("class", "scatter-axis")
    .call(d3.axisLeft(yScale).ticks(7).tickFormat(formatAxisTick));

  if (state.scatterZeroLines) {
    renderScatterZeroLines(plot, xScale, yScale, xExtent, yExtent, plotWidth, plotHeight);
  }

  plot.append("text")
    .attr("class", "scatter-axis-label")
    .attr("x", plotWidth / 2)
    .attr("y", plotHeight + 54)
    .attr("text-anchor", "middle")
    .text(xColumn);

  plot.append("text")
    .attr("class", "scatter-axis-label")
    .attr("x", -plotHeight / 2)
    .attr("y", -58)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text(yColumn);

  plot.selectAll(".scatter-point")
    .data(points)
    .enter()
    .append("circle")
    .attr("class", point =>
      state.scatterColorByRecommendation
        ? `scatter-point ${getRecommendationClass(point.item.row)}`
        : "scatter-point"
    )
    .attr("cx", point => xScale(point.x))
    .attr("cy", point => yScale(point.y))
    .attr("r", state.scatterPointSize)
    .on("mouseenter", (event, point) => showScatterTooltip(event, point, xColumn, yColumn))
    .on("mousemove", (event, point) => showScatterTooltip(event, point, xColumn, yColumn))
    .on("mouseleave", () => scatterTooltip.classList.add("hidden"))
    .on("click", (event, point) => openCompanyInfoModal(point.item.row));

  if (state.scatterTrendline && points.length >= 2) {
    renderScatterTrendline(plot, points, xScale, yScale, xExtent);
  }

  scatterHint.textContent = `${points.length}/${data.length} points affiches - X : ${xColumn} - Y : ${yColumn}`;
}

function renderScatterZeroLines(plot, xScale, yScale, xExtent, yExtent, plotWidth, plotHeight) {
  if (xExtent[0] <= 0 && xExtent[1] >= 0) {
    plot.append("line")
      .attr("class", "scatter-zero-line")
      .attr("x1", xScale(0))
      .attr("x2", xScale(0))
      .attr("y1", 0)
      .attr("y2", plotHeight);
  }

  if (yExtent[0] <= 0 && yExtent[1] >= 0) {
    plot.append("line")
      .attr("class", "scatter-zero-line")
      .attr("x1", 0)
      .attr("x2", plotWidth)
      .attr("y1", yScale(0))
      .attr("y2", yScale(0));
  }
}

function renderScatterTrendline(plot, points, xScale, yScale, xExtent) {
  const regression = getLinearRegression(points);
  if (!regression) return;

  const linePoints = xExtent.map(x => ({
    x,
    y: regression.slope * x + regression.intercept
  }));

  plot.append("line")
    .attr("class", "scatter-trendline")
    .attr("x1", xScale(linePoints[0].x))
    .attr("y1", yScale(linePoints[0].y))
    .attr("x2", xScale(linePoints[1].x))
    .attr("y2", yScale(linePoints[1].y));

  trendlineStats.textContent = `R² ${regression.rSquared.toFixed(3)}`;
}

function getLinearRegression(points) {
  const n = points.length;
  const sumX = points.reduce((sum, point) => sum + point.x, 0);
  const sumY = points.reduce((sum, point) => sum + point.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  const numerator = points.reduce(
    (sum, point) => sum + (point.x - meanX) * (point.y - meanY),
    0
  );
  const denominator = points.reduce(
    (sum, point) => sum + Math.pow(point.x - meanX, 2),
    0
  );

  if (!denominator) return null;

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;
  const totalSumSquares = points.reduce(
    (sum, point) => sum + Math.pow(point.y - meanY, 2),
    0
  );
  const residualSumSquares = points.reduce(
    (sum, point) => sum + Math.pow(point.y - (slope * point.x + intercept), 2),
    0
  );
  const rSquared = totalSumSquares
    ? Math.max(0, 1 - residualSumSquares / totalSumSquares)
    : 1;

  return { slope, intercept, rSquared };
}

function getPaddedExtent(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    const pad = Math.abs(min || 1) * 0.1;
    return [min - pad, max + pad];
  }

  const pad = (max - min) * 0.08;
  return [min - pad, max + pad];
}

function formatAxisTick(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: Math.abs(value) < 10 ? 2 : 1
  }).format(value);
}

function showScatterTooltip(event, point, xColumn, yColumn) {
  const rect = scatterPlot.getBoundingClientRect();

  scatterTooltip.innerHTML = `
    <strong>${point.ticker || "N/A"}</strong>
    <span>${xColumn}: ${formatNumber(point.x)}</span>
    <span>${yColumn}: ${formatNumber(point.y)}</span>
    ${point.recommendation ? `<span>${point.recommendation}</span>` : ""}
  `;
  scatterTooltip.style.left = `${event.clientX - rect.left + 14}px`;
  scatterTooltip.style.top = `${event.clientY - rect.top + 14}px`;
  scatterTooltip.classList.remove("hidden");
}

function invertScatterAxes() {
  const axes = getScatterAxisPair();
  if (axes.length < 2) return;

  state.scatterColumns = [axes[1], axes[0]];
  render();
}

function clearColumnFilter(colName) {
  state.filters[colName] = isNumericColumn(colName)
    ? { minVal: "", maxVal: "" }
    : { text: "" };

  render();
}

function getExchangeColumnIndex() {
  return getFirstColumnIndex(["Exchange"]);
}

function getAvailableExchanges() {
  const exchangeIndex = getExchangeColumnIndex();
  if (exchangeIndex < 0) return new Set();

  return new Set(
    state.originalData
      .map(row => String(row[exchangeIndex] ?? "").trim().toUpperCase())
      .filter(Boolean)
  );
}

function ensureExchangeMapRendered() {
  if (exchangeMapRendered) return Promise.resolve();

  if (!window.d3 || !window.topojson) {
    renderExchangeMapFallback("Carte indisponible : librairie de carte non chargee.");
    return Promise.resolve();
  }

  marketMapStatus.textContent = "Chargement des frontieres europeennes...";

  return fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
    .then(response => {
      if (!response.ok) throw new Error("World atlas unavailable");
      return response.json();
    })
    .then(world => {
      const countries = topojson.feature(world, world.objects.countries).features;
      exchangeMapFeatures = countries.filter(country =>
        EUROPE_COUNTRY_IDS.has(normalizeCountryId(country.id))
      );

      renderExchangeMap();
      exchangeMapRendered = true;
    })
    .catch(() => {
      renderExchangeMapFallback("Carte indisponible : frontieres non chargees.");
    });
}

function renderExchangeMap() {
  const projection = d3.geoConicConformal()
    .parallels([37, 62])
    .center([6.5, 51])
    .scale(780)
    .translate([360, 220]);
  const geoPath = d3.geoPath(projection);
  const exchangeByCountry = getExchangeByCountryId();

  exchangeMapCountries.innerHTML = "";
  exchangeMapLabels.innerHTML = "";

  exchangeMapFeatures.forEach(feature => {
    const countryId = normalizeCountryId(feature.id);
    const exchange = exchangeByCountry.get(countryId);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    path.setAttribute("d", geoPath(feature));

    if (exchange) {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.classList.add("market-region");
      group.dataset.exchange = exchange;
      group.setAttribute("tabindex", "0");
      group.setAttribute("role", "button");
      group.setAttribute(
        "aria-label",
        `${EXCHANGE_COUNTRIES[exchange].country} - ${exchange}`
      );
      group.appendChild(path);
      exchangeMapCountries.appendChild(group);
      addExchangeMapLabel(exchange, projection(EXCHANGE_COUNTRIES[exchange].lonLat));
    } else {
      path.classList.add("map-country", "map-country-soft");
      exchangeMapCountries.appendChild(path);
    }
  });
}

function addExchangeMapLabel(exchange, centroid) {
  const [offsetX, offsetY] = EXCHANGE_COUNTRIES[exchange].labelOffset;
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");

  text.classList.add("exchange-map-label");
  text.dataset.exchange = exchange;
  text.setAttribute("x", centroid[0] + offsetX);
  text.setAttribute("y", centroid[1] + offsetY);
  text.textContent = exchange;

  exchangeMapLabels.appendChild(text);
}

function renderExchangeMapFallback(message) {
  exchangeMapCountries.innerHTML = "";
  exchangeMapLabels.innerHTML = "";
  exchangeMapRendered = true;
  marketMapStatus.textContent = message;
}

function getExchangeByCountryId() {
  return new Map(
    Object.entries(EXCHANGE_COUNTRIES).map(([exchange, config]) => [
      config.countryId,
      exchange
    ])
  );
}

function normalizeCountryId(countryId) {
  return String(countryId).padStart(3, "0");
}

function openMarketsModal() {
  lastFocusedElement = document.activeElement;
  const available = getAvailableExchanges();
  draftExchangeFilter = new Set(
    Array.from(state.exchangeFilter).filter(exchange => available.has(exchange))
  );
  marketsModalBackdrop.classList.remove("hidden");
  updateMarketMap();
  ensureExchangeMapRendered().then(updateMarketMap);
  applyMarketsBtn.focus();
}

function closeMarketsModal() {
  marketsModalBackdrop.classList.add("hidden");
  lastFocusedElement?.focus();
}

function toggleDraftExchange(exchange) {
  if (!exchange) return;

  const normalized = exchange.toUpperCase();
  const available = getAvailableExchanges();

  if (!available.has(normalized)) return;

  if (draftExchangeFilter.has(normalized)) {
    draftExchangeFilter.delete(normalized);
  } else {
    draftExchangeFilter.add(normalized);
  }

  updateMarketMap();
}

function applyMarketSelection() {
  const available = getAvailableExchanges();
  state.exchangeFilter = new Set(
    Array.from(draftExchangeFilter).filter(exchange => available.has(exchange))
  );
  closeMarketsModal();
  render();
}

function clearMarketSelection() {
  draftExchangeFilter.clear();
  updateMarketMap();
}

function updateMarketMap() {
  const available = getAvailableExchanges();
  const active = Array.from(draftExchangeFilter);

  marketMap.querySelectorAll(".market-region").forEach(node => {
    const exchange = node.dataset.exchange.toUpperCase();
    const isAvailable = available.has(exchange);
    const isSelected = draftExchangeFilter.has(exchange);

    node.classList.toggle("exchange-available", isAvailable);
    node.classList.toggle("exchange-selected", isSelected);
    node.classList.toggle("exchange-disabled", !isAvailable);
    node.setAttribute("aria-pressed", String(isSelected));
  });

  marketMap.querySelectorAll(".exchange-map-label").forEach(label => {
    const exchange = label.dataset.exchange.toUpperCase();
    const isAvailable = available.has(exchange);
    const isSelected = draftExchangeFilter.has(exchange);

    label.classList.toggle("exchange-available", isAvailable);
    label.classList.toggle("exchange-selected", isSelected);
    label.classList.toggle("exchange-disabled", !isAvailable);
  });

  marketMapStatus.textContent = active.length
    ? `Selection actuelle : ${active.join(", ")}`
    : "Aucun exchange selectionne. Les pays disponibles dependent du fichier importe.";
}

function updateMarketFilterButton() {
  const count = state.exchangeFilter.size;
  const hasAvailableMarkets = getAvailableExchanges().size > 0;
  openMarketsBtn.textContent = count ? `Exchange (${count})` : "Exchange";
  openMarketsBtn.disabled = !hasAvailableMarkets;
  openMarketsBtn.classList.toggle("favorite-active", count > 0);
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

function loadCustomConfigs() {
  try {
    const stored = localStorage.getItem(CUSTOM_CONFIGS_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function saveCustomConfigs() {
  localStorage.setItem(
    CUSTOM_CONFIGS_STORAGE_KEY,
    JSON.stringify(customConfigs)
  );
}

function loadLastViewConfig() {
  try {
    const stored = localStorage.getItem(LAST_VIEW_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveLastViewConfig() {
  if (!state.allColumns.length || !state.displayedColumns.length) return;

  localStorage.setItem(
    LAST_VIEW_STORAGE_KEY,
    JSON.stringify(createConfigFromCurrentState())
  );
}

function getValidConfigForCurrentFile(config) {
  if (!config?.columns?.length) return null;

  const hasMatchingColumn = config.columns.some(col => state.allColumns.includes(col));
  return hasMatchingColumn ? config : null;
}

function getDefaultConfigName() {
  return localStorage.getItem(DEFAULT_CONFIG_STORAGE_KEY) || "Master Filtre";
}

function setDefaultConfigName(name) {
  localStorage.setItem(DEFAULT_CONFIG_STORAGE_KEY, name);
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
  const addColumnsHeaderBtn = button("+", "table-add-columns-btn", openColumnsModal);
  addColumnsHeaderBtn.title = "Ajouter des colonnes";
  addColumnsHeaderBtn.setAttribute("aria-label", "Ajouter des colonnes");
  addColumnsHeaderBtn.disabled = !getAvailableColumnsToAdd().length;
  detailsTh.appendChild(addColumnsHeaderBtn);
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

  if (state.viewMode === "scatter") {
    resultCount.textContent = `${data.length} resultat(s)`;
    return;
  }

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
  const exchangeIndex = getExchangeColumnIndex();

  let rows = state.originalData
    .map((row, index) => ({ row, index }))
    .filter(item => {
      if (state.hiddenRows.has(item.index)) return false;

      if (state.exchangeFilter.size && exchangeIndex >= 0) {
        const exchange = String(item.row[exchangeIndex] ?? "").trim().toUpperCase();
        if (!state.exchangeFilter.has(exchange)) return false;
      }

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

  const availableExchanges = getAvailableExchanges();
  const configuredExchanges = Array.isArray(config.exchangeFilter)
    ? config.exchangeFilter.map(exchange => String(exchange).toUpperCase())
    : [];

  state.exchangeFilter = new Set(
    configuredExchanges.filter(exchange => availableExchanges.has(exchange))
  );

  state.scatterColumns = Array.isArray(config.scatterColumns)
    ? config.scatterColumns.filter(col => state.allColumns.includes(col) && isNumericColumn(col)).slice(0, 2)
    : getDefaultScatterColumns();
  state.viewMode = config.viewMode === "scatter" ? "scatter" : "table";
  state.scatterTrendline = Boolean(config.scatterTrendline);
  state.scatterZeroLines = config.scatterZeroLines !== false;
  state.scatterColorByRecommendation = config.scatterColorByRecommendation !== false;
  state.scatterPointSize = Number.isFinite(Number(config.scatterPointSize))
    ? Number(config.scatterPointSize)
    : 5.2;

  state.hiddenRows.clear();
  state.expandedRows.clear();
}

function applySelectedConfig() {
  const name = configSelect.value;
  const config = getAllConfigs()[name];

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
  populateConfigSelect();
  updateConfigPreview();
  configModalBackdrop.classList.remove("hidden");
  configSelect.focus();
}

function populateConfigSelect(selectedName = configSelect.value || getDefaultConfigName()) {
  configSelect.innerHTML = "";
  const configs = getAllConfigs();

  Object.keys(configs).forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name === getDefaultConfigName() ? `${name} (defaut)` : name;
    configSelect.appendChild(option);
  });

  if (configs[selectedName]) {
    configSelect.value = selectedName;
  }
}

function closeConfigModal() {
  configModalBackdrop.classList.add("hidden");
  lastFocusedElement?.focus();
}

function updateConfigPreview() {
  const name = configSelect.value;
  const config = getAllConfigs()[name];

  configNameInput.value = name || "";
  configPreview.textContent = JSON.stringify(config || {}, null, 2);
  defaultConfigLabel.textContent = getDefaultConfigName()
    ? `Config appliquee a l'ouverture : ${getDefaultConfigName()}`
    : "";
  deleteConfigBtn.disabled = !customConfigs[name];
}

function saveCurrentConfig() {
  const name = configNameInput.value.trim();

  if (!name) {
    alert("Donne un nom a la config.");
    return;
  }

  customConfigs[name] = createConfigFromCurrentState();
  saveCustomConfigs();
  populateConfigSelect(name);
  updateConfigPreview();
}

function createConfigFromCurrentState() {
  const filters = {};

  state.displayedColumns.forEach(col => {
    filters[col] = { ...(state.filters[col] || {}) };
  });

  return {
    columns: state.displayedColumns.slice(),
    filters,
    sort: { ...state.currentSort },
    exchangeFilter: Array.from(state.exchangeFilter),
    viewMode: state.viewMode,
    scatterColumns: state.scatterColumns.slice(),
    scatterTrendline: state.scatterTrendline,
    scatterZeroLines: state.scatterZeroLines,
    scatterColorByRecommendation: state.scatterColorByRecommendation,
    scatterPointSize: state.scatterPointSize
  };
}

function setSelectedConfigAsDefault() {
  const name = configSelect.value;
  if (!getAllConfigs()[name]) return;

  setDefaultConfigName(name);
  populateConfigSelect(name);
  updateConfigPreview();
}

function deleteSelectedCustomConfig() {
  const name = configSelect.value;

  if (!customConfigs[name]) return;

  delete customConfigs[name];
  saveCustomConfigs();

  if (getDefaultConfigName() === name) {
    setDefaultConfigName("Master Filtre");
  }

  populateConfigSelect();
  updateConfigPreview();
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
  state.exchangeFilter.clear();

  render();
}

function openColumnsModal() {
  lastFocusedElement = document.activeElement;
  draftColumnsToAdd.clear();
  columnSearchInput.value = "";
  columnsModalBackdrop.classList.remove("hidden");
  updateColumnsSelect();
  columnSearchInput.focus();
}

function closeColumnsModal() {
  columnsModalBackdrop.classList.add("hidden");
  lastFocusedElement?.focus();
}

function getAvailableColumnsToAdd() {
  return state.allColumns.filter(
    col =>
      col !== "URL" &&
      !String(col).includes("Year_") &&
      !state.displayedColumns.includes(col)
  );
}

function updateColumnsSelect() {
  const query = columnSearchInput.value.trim().toLowerCase();
  const remaining = getAvailableColumnsToAdd();
  const filtered = remaining.filter(
    col => !query || String(col).toLowerCase().includes(query)
  );
  const favorites = filtered.filter(col => favoriteColumns.has(col));
  const others = filtered.filter(col => !favoriteColumns.has(col));
  const orderedColumns = favorites.concat(others);

  if (columnsModalBackdrop.classList.contains("hidden")) return;

  columnOptionsList.innerHTML = "";
  selectedColumnsList.innerHTML = "";

  columnPickerStatus.textContent = `${orderedColumns.length}/${remaining.length}`;

  if (!orderedColumns.length) {
    const empty = document.createElement("p");
    empty.className = "columns-empty";
    empty.textContent = "Aucune colonne disponible.";
    columnOptionsList.appendChild(empty);
  } else {
    orderedColumns.forEach(col => {
      columnOptionsList.appendChild(createColumnOptionRow(col));
    });
  }

  if (!draftColumnsToAdd.size) {
    const empty = document.createElement("p");
    empty.className = "columns-empty";
    empty.textContent = "Coche une ou plusieurs colonnes.";
    selectedColumnsList.appendChild(empty);
  } else {
    Array.from(draftColumnsToAdd).forEach(col => {
      selectedColumnsList.appendChild(createSelectedColumnPill(col));
    });
  }

  applyColumnsBtn.disabled = !draftColumnsToAdd.size;
  clearDraftColumnsBtn.disabled = !draftColumnsToAdd.size;
}

function createColumnOptionRow(col) {
  const row = document.createElement("label");
  row.className = "column-option-row";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = draftColumnsToAdd.has(col);
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      draftColumnsToAdd.add(col);
    } else {
      draftColumnsToAdd.delete(col);
    }

    updateColumnsSelect();
  });

  const name = document.createElement("span");
  name.textContent = col;

  const isFavorite = favoriteColumns.has(col);

  if (isFavorite) {
    row.classList.add("column-option-favorite");
  }

  const favoriteBtn = button(
    isFavorite ? "★" : "☆",
    "column-favorite-btn",
    event => {
      event.preventDefault();
      event.stopPropagation();
      toggleColumnFavorite(col);
    }
  );
  favoriteBtn.classList.toggle("favorite-active", isFavorite);
  favoriteBtn.title = isFavorite
    ? "Retirer des favoris"
    : "Ajouter aux favoris";

  row.append(checkbox, name, favoriteBtn);
  return row;
}

function createSelectedColumnPill(col) {
  const pill = document.createElement("button");
  pill.type = "button";
  pill.className = "selected-column-pill";
  pill.textContent = `${col} x`;
  pill.title = "Retirer de la selection";
  pill.addEventListener("click", () => {
    draftColumnsToAdd.delete(col);
    updateColumnsSelect();
  });

  return pill;
}

function toggleColumnFavorite(col) {
  if (favoriteColumns.has(col)) {
    favoriteColumns.delete(col);
  } else {
    favoriteColumns.add(col);
  }

  saveFavoriteColumns();
  updateColumnsSelect();
}

function clearDraftColumns() {
  draftColumnsToAdd.clear();
  updateColumnsSelect();
}

function applyDraftColumns() {
  const columns = Array.from(draftColumnsToAdd).filter(
    col => state.allColumns.includes(col) && !state.displayedColumns.includes(col)
  );

  columns.forEach(col => {
    state.displayedColumns.push(col);
    state.filters[col] = isNumericColumn(col)
      ? { minVal: "", maxVal: "" }
      : { text: "" };
  });

  draftColumnsToAdd.clear();
  closeColumnsModal();

  if (columns.length) {
    render();
  }
}

function openAxesModal() {
  lastFocusedElement = document.activeElement;
  draftAxisColumns = new Set(getScatterAxisPair());
  axisSearchInput.value = "";
  axesModalBackdrop.classList.remove("hidden");
  updateAxesSelect();
  axisSearchInput.focus();
}

function closeAxesModal() {
  axesModalBackdrop.classList.add("hidden");
  lastFocusedElement?.focus();
}

function updateAxesSelect() {
  const numericColumns = getNumericScatterColumns();

  if (axesModalBackdrop.classList.contains("hidden")) {
    return;
  }

  const query = axisSearchInput.value.trim().toLowerCase();
  const filtered = numericColumns.filter(
    col => !query || String(col).toLowerCase().includes(query)
  );

  axisOptionsList.innerHTML = "";
  selectedAxesList.innerHTML = "";
  axisPickerStatus.textContent = `${filtered.length}/${numericColumns.length}`;

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "columns-empty";
    empty.textContent = "Aucune dimension numerique disponible.";
    axisOptionsList.appendChild(empty);
  } else {
    filtered.forEach(col => {
      axisOptionsList.appendChild(createAxisOptionRow(col));
    });
  }

  if (!draftAxisColumns.size) {
    const empty = document.createElement("p");
    empty.className = "columns-empty";
    empty.textContent = "Choisis deux dimensions.";
    selectedAxesList.appendChild(empty);
  } else {
    Array.from(draftAxisColumns).forEach(col => {
      selectedAxesList.appendChild(createAxisPill(col));
    });
  }

  applyAxesBtn.disabled = draftAxisColumns.size !== 2;
  clearDraftAxesBtn.disabled = !draftAxisColumns.size;
}

function createAxisOptionRow(col) {
  const row = document.createElement("label");
  row.className = "column-option-row";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = draftAxisColumns.has(col);
  checkbox.disabled = !checkbox.checked && draftAxisColumns.size >= 2;
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      draftAxisColumns.add(col);
    } else {
      draftAxisColumns.delete(col);
    }

    updateAxesSelect();
  });

  const name = document.createElement("span");
  name.textContent = col;

  const marker = document.createElement("span");
  marker.className = "axis-order-marker";
  marker.textContent = draftAxisColumns.has(col)
    ? String(Array.from(draftAxisColumns).indexOf(col) + 1)
    : "";

  row.append(checkbox, name, marker);
  return row;
}

function createAxisPill(col) {
  const pill = document.createElement("button");
  pill.type = "button";
  pill.className = "selected-column-pill";
  pill.textContent = `${col} x`;
  pill.title = "Retirer de la selection";
  pill.addEventListener("click", () => {
    draftAxisColumns.delete(col);
    updateAxesSelect();
  });

  return pill;
}

function clearDraftAxes() {
  draftAxisColumns.clear();
  updateAxesSelect();
}

function applyDraftAxes() {
  if (draftAxisColumns.size !== 2) return;

  state.scatterColumns = Array.from(draftAxisColumns);
  state.viewMode = "scatter";
  closeAxesModal();
  render();
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

  fetchCompanyActivitySummary({ ticker, companyName, sector, industry })
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

function fetchCompanyActivitySummary({ ticker, companyName, sector, industry }) {
  const queries = buildCompanySearchQueries({ ticker, companyName, sector, industry });

  if (!queries.length) {
    return Promise.resolve({ summary: "", source: "", url: "" });
  }

  return searchWikipediaCandidates(queries)
    .then(candidates => {
      if (!candidates.length) return [];
      return Promise.all(candidates.slice(0, 6).map(fetchWikipediaSummary));
    })
    .then(results => {
      const ranked = (results || [])
        .filter(result => isLikelyCompanySummary(result, { ticker, companyName }))
        .map(result => ({
          ...result,
          score: scoreCompanySummary(result, { ticker, companyName, sector, industry })
        }))
        .sort((a, b) => b.score - a.score);

      return ranked[0]?.score > 0 ? ranked[0] : { summary: "", source: "", url: "" };
    });
}

function buildCompanySearchQueries({ ticker, companyName, sector, industry }) {
  const cleanTicker = String(ticker || "").trim();
  const cleanName = String(companyName || "").trim();
  const context = [industry, sector].filter(Boolean).join(" ");

  return Array.from(new Set([
    cleanName ? `${cleanName} company` : "",
    cleanName && cleanTicker ? `${cleanName} ${cleanTicker} company` : "",
    cleanName && context ? `${cleanName} ${context} company` : "",
    cleanTicker ? `${cleanTicker} stock company` : "",
    cleanName
  ].filter(Boolean)));
}

function searchWikipediaCandidates(queries) {
  return queries.reduce(
    (chain, query) =>
      chain.then(candidates =>
        candidates.length >= 6
          ? candidates
          : searchWikipediaQuery(query).then(next => mergeWikipediaCandidates(candidates, next))
      ),
    Promise.resolve([])
  );
}

function searchWikipediaQuery(query) {
  const params = new URLSearchParams({
    action: "opensearch",
    search: query,
    limit: "4",
    namespace: "0",
    redirects: "resolve",
    format: "json",
    origin: "*"
  });

  return fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`)
    .then(response => response.json())
    .then(data => data?.[1] || [])
    .catch(() => []);
}

function mergeWikipediaCandidates(existing, next) {
  const seen = new Set(existing);

  next.forEach(title => {
    if (!seen.has(title)) {
      seen.add(title);
      existing.push(title);
    }
  });

  return existing;
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
        title: data.title || pageTitle,
        type: data.type || "",
        description: data.description || "",
        summary: data.extract,
        source: "Source : Wikipedia",
        url: data.content_urls?.desktop?.page || ""
      };
    });
}

function isLikelyCompanySummary(result, { ticker, companyName }) {
  if (!result?.summary || result.type === "disambiguation") return false;

  const haystack = normalizeSearchText([
    result.title,
    result.description,
    result.summary
  ].join(" "));
  const nameTokens = getMeaningfulTokens(companyName);
  const tickerToken = normalizeSearchText(ticker);
  const companyHints = [
    "company",
    "corporation",
    "group",
    "holding",
    "manufacturer",
    "provider",
    "retailer",
    "bank",
    "multinational",
    "public",
    "publicly traded",
    "software",
    "pharmaceutical",
    "semiconductor",
    "stock exchange",
    "listed"
  ];

  const hasNameMatch = nameTokens.some(token => haystack.includes(token));
  const hasTickerMatch = tickerToken && haystack.includes(tickerToken);
  const hasCompanyHint = companyHints.some(hint => haystack.includes(hint));

  return (hasNameMatch || hasTickerMatch) && hasCompanyHint;
}

function scoreCompanySummary(result, { ticker, companyName, sector, industry }) {
  const haystack = normalizeSearchText([
    result.title,
    result.description,
    result.summary
  ].join(" "));
  const title = normalizeSearchText(result.title);
  const nameTokens = getMeaningfulTokens(companyName);
  const tickerToken = normalizeSearchText(ticker);
  let score = 0;

  nameTokens.forEach(token => {
    if (title.includes(token)) score += 5;
    if (haystack.includes(token)) score += 2;
  });

  if (tickerToken && title.includes(tickerToken)) score += 4;
  if (tickerToken && haystack.includes(tickerToken)) score += 1;

  getMeaningfulTokens(industry).forEach(token => {
    if (haystack.includes(token)) score += 1;
  });

  getMeaningfulTokens(sector).forEach(token => {
    if (haystack.includes(token)) score += 1;
  });

  if (haystack.includes("company")) score += 2;
  if (haystack.includes("stock exchange") || haystack.includes("listed")) score += 2;

  return score;
}

function getMeaningfulTokens(value) {
  return normalizeSearchText(value)
    .split(" ")
    .filter(token => token.length >= 3 && !["the", "and", "inc", "ltd", "plc", "sa", "se", "nv"].includes(token));
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
