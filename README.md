# Change-Point-Analysis-and-Statistical-Modeling-of-ts-Data


### Project Understanding

The goal of this phase was to transform raw Brent Oil price data (1988–2024) into a "labeled" dataset. By identifying major global events, we created a ground-truth timeline to test our future Bayesian Change Point models.

### Key Activities

* **Data Integration:** Merged 36 years of daily Brent Crude prices with a researched timeline of 10 major geopolitical and economic "shocks."
* **Fuzzy Date Matching:** Implemented `merge_asof` with a 2-day tolerance. This ensured that events happening on weekends or market holidays (e.g., the 2020 Saudi-Russia Price War) were correctly mapped to the nearest trading day.
* **Data Cleaning:** Handled schema inconsistencies and standardized date formats to prevent merge errors and `KeyErrors`.

### Time Series Properties

Before modeling, we analyzed the following properties of the Brent dataset:

1. **Trend:** Identified long-term non-linear cycles using a 100-day moving average.
2. **Stationarity:** Conducted the **Augmented Dickey-Fuller (ADF)** test. The data is non-stationary, suggesting that modeling "Returns" (percentage change) may be more effective than raw prices.
3. **Volatility:** Observed "Volatility Clustering" during crisis years (2008, 2014, 2020), indicating that our model must account for shifts in variance, not just the mean price.

