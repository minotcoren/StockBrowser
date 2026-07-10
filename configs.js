const CONFIGS = {


  "Quality Cash Compounder": {
    columns: [
      "Ticker",
      "Industry",
      "Market capitalization",
      "Current price",
      "Trailing P/E ratio",
      "Return on equity",
      "Revenue growth (%)",
      "Earnings growth",
      "Debt-to-equity ratio",
      "Free cash flow",
      "Operating cash flow",
      "cashflow_Free Cash Flow_2025",
      "Free Cash Flow (2024)",
      "Free Cash Flow (2023)",
      "cashflow_Operating Cash Flow_2025",
      "Operating Cash Flow (2024)",
      "Operating Cash Flow (2023)",
      "financials_Total Revenue_2025",
      "Total Revenue (2024)",
      "Total Revenue (2023)",
      "financials_Operating Income_2025",
      "Operating Income (2024)",
      "Operating Income (2023)",
      "balance_Net Debt_2025",
      "Net Debt (2024)"
    ],
    filters: {
      "Market capitalization": { minVal: "50000000", maxVal: "" },
      "Trailing P/E ratio": { minVal: "8", maxVal: "25" },
      "Return on equity": { minVal: "0.15", maxVal: "" },
      "Revenue growth (%)": { minVal: "0.05", maxVal: "" },
      "Earnings growth": { minVal: "0.05", maxVal: "" },
      "Debt-to-equity ratio": { minVal: "", maxVal: "60" },
      "cashflow_Free Cash Flow_2025": { minVal: "0", maxVal: "" },
      "Free Cash Flow (2024)": { minVal: "0", maxVal: "" },
      "Free Cash Flow (2023)": { minVal: "0", maxVal: "" },
      "cashflow_Operating Cash Flow_2025": { minVal: "0", maxVal: "" },
      "Operating Cash Flow (2024)": { minVal: "0", maxVal: "" }
    },
    sort: { column: "Return on equity", order: "desc" }
  },

  "Deep Value Cash Positive": {
    columns: [
      "Ticker",
      "Industry",
      "Market capitalization",
      "Enterprise value",
      "Current price",
      "Trailing P/E ratio",
      "Enterprise value to EBITDA",
      "Price-to-book ratio",
      "P/E discount vs industry (%)",
      "Return on equity",
      "Free cash flow",
      "Operating cash flow",
      "cashflow_Free Cash Flow_2025",
      "Free Cash Flow (2024)",
      "cashflow_Operating Cash Flow_2025",
      "Operating Cash Flow (2024)",
      "balance_Net Debt_2025",
      "Net Debt (2024)",
      "Debt-to-equity ratio"
    ],
    filters: {
      "Market capitalization": { minVal: "30000000", maxVal: "" },
      "Trailing P/E ratio": { minVal: "", maxVal: "10" },
      "Enterprise value to EBITDA": { minVal: "", maxVal: "6" },
      "Price-to-book ratio": { minVal: "", maxVal: "1.5" },
      "P/E discount vs industry (%)": { minVal: "20", maxVal: "" },
      "Return on equity": { minVal: "0.08", maxVal: "" },
      "cashflow_Free Cash Flow_2025": { minVal: "0", maxVal: "" },
      "Free Cash Flow (2024)": { minVal: "0", maxVal: "" },
      "Debt-to-equity ratio": { minVal: "", maxVal: "50" }
    },
    sort: { column: "Enterprise value to EBITDA", order: "asc" }
  },

  "Profitable Growth With Cash": {
    columns: [
      "Ticker",
      "Industry",
      "Market capitalization",
      "Current price",
      "Trailing P/E ratio",
      "Revenue growth (%)",
      "Earnings growth",
      "Return on equity",
      "Operating margins",
      "Profit margins",
      "Free cash flow",
      "Operating cash flow",
      "financials_Total Revenue_2025",
      "Total Revenue (2024)",
      "Total Revenue (2023)",
      "financials_Net Income_2025",
      "Net Income (2024)",
      "Net Income (2023)",
      "cashflow_Free Cash Flow_2025",
      "Free Cash Flow (2024)",
      "Debt-to-equity ratio"
    ],
    filters: {
      "Market capitalization": { minVal: "50000000", maxVal: "" },
      "Trailing P/E ratio": { minVal: "10", maxVal: "35" },
      "Revenue growth (%)": { minVal: "0.10", maxVal: "" },
      "Earnings growth": { minVal: "0.10", maxVal: "" },
      "Return on equity": { minVal: "0.15", maxVal: "" },
      "Operating margins": { minVal: "0.10", maxVal: "" },
      "cashflow_Free Cash Flow_2025": { minVal: "0", maxVal: "" },
      "Debt-to-equity ratio": { minVal: "", maxVal: "80" }
    },
    sort: { column: "Revenue growth (%)", order: "desc" }
  },

  "Net Cash Quality": {
    columns: [
      "Ticker",
      "Industry",
      "Market capitalization",
      "Current price",
      "Trailing P/E ratio",
      "Return on equity",
      "Revenue growth (%)",
      "Earnings growth",
      "Total cash",
      "Total debt",
      "balance_Net Debt_2025",
      "Net Debt (2024)",
      "balance_Cash And Cash Equivalents_2025",
      "balance_Total Debt_2025",
      "cashflow_Free Cash Flow_2025",
      "Free Cash Flow (2024)",
      "Operating margins",
      "Profit margins"
    ],
    filters: {
      "Market capitalization": { minVal: "30000000", maxVal: "" },
      "Trailing P/E ratio": { minVal: "5", maxVal: "25" },
      "Return on equity": { minVal: "0.10", maxVal: "" },
      "Revenue growth (%)": { minVal: "0", maxVal: "" },
      "Earnings growth": { minVal: "0", maxVal: "" },
      "balance_Net Debt_2025": { minVal: "", maxVal: "0" },
      "cashflow_Free Cash Flow_2025": { minVal: "0", maxVal: "" },
      "Free Cash Flow (2024)": { minVal: "0", maxVal: "" }
    },
    sort: { column: "Trailing P/E ratio", order: "asc" }
  }
,

  "Master Filtre": {
    columns: [
      "Ticker",
      "Industry",
      "Market capitalization",
      "Current price",
      "Target low price",
      "Target mean price",
      "Target high price",
      "Bearish upside (%)",
      "Mean upside (%)",
      "Bullish upside (%)",
      "Trailing P/E ratio",
      "Industry avg P/E",
      "P/E discount vs industry (%)",
      "Return on equity",
      "Price-to-book ratio",
      "Earnings growth",
      "Revenue growth (%)",
      "Debt-to-equity ratio",
      "Recommendation key"
    ],
    filters: {
      "Ticker": { text: "" },
      "Trailing P/E ratio": { minVal: "", maxVal: "12" },
      "Return on equity": { minVal: "0.1", maxVal: "" },
      "Market capitalization": { minVal: "50000000", maxVal: "" },
      "Price-to-book ratio": { minVal: "", maxVal: "2" }
    },
    sort: { column: "Trailing P/E ratio", order: "asc" }
  },

  "Master Filtre (Ã©largi)": {
    columns: [
      "Ticker",
      "Industry",
      "Market capitalization",
      "Current price",
      "Target low price",
      "Target mean price",
      "Target high price",
      "Bearish upside (%)",
      "Mean upside (%)",
      "Bullish upside (%)",
      "Trailing P/E ratio",
      "Industry avg P/E",
      "P/E discount vs industry (%)",
      "Return on equity",
      "Price-to-book ratio",
      "Earnings growth",
      "Revenue growth (%)",
      "Debt-to-equity ratio",
      "Recommendation key"
    ],
    filters: {
      "Ticker": { text: "" },
      "Trailing P/E ratio": { minVal: "", maxVal: "20" },
      "Return on equity": { minVal: "0.06", maxVal: "" },
      "Market capitalization": { minVal: "30000000", maxVal: "" },
      "Price-to-book ratio": { minVal: "", maxVal: "3" }
    },
    sort: { column: "Trailing P/E ratio", order: "asc" }
  }
};
