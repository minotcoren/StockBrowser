const CONFIGS = {
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

  "Master Filtre (élargi)": {
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
