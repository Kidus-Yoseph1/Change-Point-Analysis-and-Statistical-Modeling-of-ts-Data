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

### How to run
**1. Create a Virtual Environment**
Open your terminal in the project root directory and run:

```bash
python -m venv venv

```

**2. Activate the Virtual Environment**

* Windows:
```bash
venv\Scripts\activate

```


* macOS/Linux:
```bash
source venv/bin/activate

```



**3. Install Dependencies**
Ensure you have the requirements.txt file in your directory, then run:

```bash
pip install -r requirements.txt

```

**4. Run Analysis**
Execute the Bayesian modeling script to generate the processed data and results:

```bash
python src/analysis.py

```

**5. Start the Backend API**
Launch the Flask server to serve the data to the frontend:

```bash
python backend/app.py

```

**6. Launch the Dashboard**
In a separate terminal, navigate to the frontend directory and run:

```bash
npm install
npm start

```

The dashboard will be available at http://localhost:3000. Ensure the Flask server is running on [http://127.0.0.1:5000](http://127.0.0.1:5000) for the visuals to populate.
