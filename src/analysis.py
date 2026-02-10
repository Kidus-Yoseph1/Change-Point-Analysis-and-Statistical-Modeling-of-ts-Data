import os
import pandas as pd
import numpy as np
import pymc as pm
import arviz as az
import matplotlib.pyplot as plt
import scipy.signal


if not hasattr(scipy.signal, 'gaussian'):
    from scipy.signal import windows
    scipy.signal.gaussian = windows.gaussian
    print("✓ Environment Patch: scipy.signal.gaussian linked.")

def analysis():
    print("🚀 Starting Task 2: Change Point Modeling...")

    # LOAD DATA
    if not os.path.exists('../Data/brent_prices_with_events.csv'):
        print("Error: brent_prices_with_events.csv not found! Run Task 1 first.")
        return
    
    df = pd.read_csv('../Data/brent_prices_with_events.csv')
    df['Date'] = pd.to_datetime(df['Date'])
    
    # EDA CALCULATIONS
    # Log returns for volatility clustering analysis
    df['Log_Returns'] = np.log(df['Price']) - np.log(df['Price'].shift(1))
    
    # BAYESIAN MODELING (PyMC)
    prices = df['Price'].values
    idx = np.arange(len(prices))
    mean_price = prices.mean()

    print(f"Modeling {len(prices)} rows of data...")

    with pm.Model() as oil_model:
        # Priors
        tau = pm.DiscreteUniform("tau", lower=0, upper=len(prices) - 1)
        mu_1 = pm.Exponential("mu_1", 1.0 / mean_price)
        mu_2 = pm.Exponential("mu_2", 1.0 / mean_price)
        sigma = pm.HalfNormal("sigma", sigma=prices.std())
        
        # Switch Logic
        mu_ = pm.math.switch(tau > idx, mu_1, mu_2)
        
        # Likelihood
        obs = pm.Normal("obs", mu=mu_, sigma=sigma, observed=prices)
        
        # Sampling
        trace = pm.sample(2000, tune=1000, chains=4, cores=4, return_inferencedata=True)

    # POST-PROCESSING RESULTS
    summary = az.summary(trace, var_names=["mu_1", "mu_2", "tau"])
    
    # Extract values for quantification
    mu1_val = summary.loc['mu_1', 'mean']
    mu2_val = summary.loc['mu_2', 'mean']
    tau_mean = int(summary.loc['tau', 'mean'])
    
    percent_change = ((mu2_val - mu1_val) / mu1_val) * 100
    detected_date = df.iloc[tau_mean]['Date']

    # PRINT QUANTIFIED IMPACT
    print("\n" + "="*30)
    print("ANALYSIS RESULTS")
    print("="*30)
    print(f"Detected Change Date: {detected_date.date()}")
    print(f"Pre-change mean:      ${mu1_val:.2f}")
    print(f"Post-change mean:     ${mu2_val:.2f}")
    print(f"Percentage Shift:     {percent_change:.2f}%")
    print("="*30)

    # SAVE RESULTS FOR TASK 3 (Dashboard)
    if not os.path.exists('backend'):
        os.makedirs('backend')
        
    summary.to_csv('backend/model_results.csv')
    df.to_csv('backend/price_data.csv', index=False)
    print("✓ Results saved to 'backend/' for the dashboard.")

    # GENERATE PLOTS 
    az.plot_trace(trace, var_names=["mu_1", "mu_2"])
    plt.savefig('trace_plots.png')
    
    plt.figure(figsize=(15, 7))
    plt.plot(df['Date'], df['Price'], color='black', alpha=0.3)
    plt.hlines(mu1_val, xmin=df['Date'].min(), xmax=detected_date, color='blue', lw=3, label='Pre-Break')
    plt.hlines(mu2_val, xmin=detected_date, xmax=df['Date'].max(), color='red', lw=3, label='Post-Break')
    plt.axvline(detected_date, color='green', label=f'Change Point: {detected_date.date()}')
    plt.legend()
    plt.savefig('regime_shift_plot.png')
    print("✓ Plots saved as 'trace_plots.png' and 'regime_shift_plot.png'")

if __name__ == "__main__":
	analysis()
