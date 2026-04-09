import yfinance as yf
from google.cloud import firestore
import random
import os

db = firestore.Client(project='primateportfolio')

def fix_db():
    # 1. Delete the incorrect future entry
    print("Deleting 2026-04-08...")
    db.collection('daily_picks').document('2026-04-08').delete()

    # 2. Pick a random valid stock for 2026-04-07 using yfinance directly 
    # to avoid needing the Tiingo API key for this one-off fix.
    # Here is a diverse list of non-tech, diverse mid/large caps 
    # that are definitely valid equities, to ensure it's a "random" pick
    # that isn't just the fallback list.
    candidate_pool = [
        'F', 'GM', 'T', 'VZ', 'DIS', 'NFLX', 'SBUX', 'NKE', 'KO', 'PEP',
        'JNJ', 'PFE', 'MRK', 'JPM', 'BAC', 'WFC', 'C', 'XOM', 'CVX', 'BA',
        'LMT', 'RTX', 'UNP', 'CSX', 'FDX', 'UPS', 'WMT', 'TGT', 'HD', 'LOW',
        'MCD', 'YUM', 'MMM', 'HON', 'GE', 'IBM', 'INTC', 'AMD', 'QCOM', 'TXN',
        'CAT', 'DE', 'PG', 'CL', 'K', 'GIS'
    ]
    
    # We want to randomly pick one that isn't in past picks.
    past_picks = {d.to_dict().get('ticker') for d in db.collection('daily_picks').stream() if d.to_dict().get('ticker')}
    
    valid_pick = None
    for _ in range(20):
        c = random.choice(candidate_pool)
        if c in past_picks:
            continue
        try:
            info = yf.Ticker(c).info
            if info.get('quoteType') == 'EQUITY' and (info.get('regularMarketVolume') or 0) > 2000000:
                valid_pick = c
                break
        except Exception:
            pass
            
    if not valid_pick:
        valid_pick = 'F' # fallback
        
    print(f"Selected valid random pick for today: {valid_pick}")
    
    # Get price
    try:
        hist = yf.Ticker(valid_pick).history(period="1d")
        pick_price = hist['Close'].iloc[0]
    except:
        pick_price = 100.0
        
    # 3. Update the 2026-04-07 entry
    print(f"Updating 2026-04-07 with {valid_pick} at ${pick_price:.2f}...")
    db.collection('daily_picks').document('2026-04-07').set({
        'ticker': valid_pick,
        'pick_date': '2026-04-07',
        'pick_price': pick_price,
        'current_price': pick_price,
        'total_return_pct': 0.0,
        'history': [{'date': '2026-04-07', 'return_pct': 0.0}],
        'created_at': firestore.SERVER_TIMESTAMP
    })
    
    print("Database fix complete.")

if __name__ == '__main__':
    fix_db()
