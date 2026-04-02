import os
import datetime
import random
from google.cloud import firestore
from tiingo import TiingoClient
import yfinance as yf

# Initialize Firestore DB
db = firestore.Client(project=os.environ.get('GCP_PROJECT', 'primateportfolio'))

def get_tiingo_client():
    config = {}
    config['session'] = True
    config['api_key'] = os.environ.get('TIINGO_API_KEY')
    return TiingoClient(config)

def download_supported_tickers():
    client = get_tiingo_client()
    data = client.list_stock_tickers()
    tickers = []
    supported_exchanges = {'NYSE', 'NASDAQ', 'AMEX'}
    for item in data:
        if isinstance(item, dict) and item.get('assetType') == 'Stock' and item.get('startDate') and item.get('endDate'):
            if item.get('exchange', '').upper() in supported_exchanges:
                tickers.append(item.get('ticker'))
    return tickers

def fix_today_pick():
    print("Checking today's pick...")
    today_str = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d')
    picks_ref = db.collection('daily_picks').document(today_str)
    doc = picks_ref.get()
    
    needs_fix = False
    current_pick = None
    
    if doc.exists:
        data = doc.to_dict()
        current_pick = data.get('ticker')
        if current_pick:
            try:
                info = yf.Ticker(current_pick).info
                if info.get('quoteType') != 'EQUITY':
                    print(f"Current pick {current_pick} is NOT an equity (quoteType: {info.get('quoteType')}). Needs fix.")
                    needs_fix = True
                elif (info.get('regularMarketVolume') or 0) < 50000:
                    print(f"Current pick {current_pick} has insufficient volume. Needs fix.")
                    needs_fix = True
                else:
                    print(f"Current pick {current_pick} is a valid equity with sufficient volume. No change needed.")
            except Exception as e:
                print(f"Error checking {current_pick}: {e}. Will replace it just in case.")
                needs_fix = True
        else:
            needs_fix = True
    else:
        needs_fix = True
        
    if not needs_fix:
        return
        
    print("Generating a new valid pick...")
    
    try:
        tickers = download_supported_tickers()
        client = get_tiingo_client()
    except Exception as e:
        print(f"Could not load tickers using TIINGO_API_KEY: {e}")
        # fallback to a known list
        tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA']
        client = None

    past_picks = {d.to_dict().get('ticker') for d in db.collection('daily_picks').stream() if d.to_dict().get('ticker')}
    
    new_pick = None
    for _ in range(50):
        candidate = random.choice(tickers)
        if candidate in past_picks or not candidate.isalpha() or len(candidate) > 5:
            continue
            
        try:
            ticker_obj = yf.Ticker(candidate)
            info = ticker_obj.info
            if info.get('quoteType') != 'EQUITY':
                continue
            if (info.get('regularMarketVolume') or 0) < 50000:
                continue
            hist = ticker_obj.history(period="1d")
            if not hist.empty:
                # check tiingo if api key is available
                if client:
                    pricing = client.get_ticker_price(candidate)
                    if pricing and pricing[0].get('close') is not None:
                        new_pick = candidate
                        break
                else:
                    new_pick = candidate
                    break
        except Exception:
            pass
            
    if not new_pick:
        print("Failed to find a new stock pick.")
        return
        
    print(f"Found new valid pick: {new_pick}")
    
    # get price
    pick_price = None
    if client:
        pricing = client.get_ticker_price(new_pick)
        if pricing:
            pick_price = pricing[0].get('close')
            
    if not pick_price:
        try:
            hist = yf.Ticker(new_pick).history(period="1d")
            pick_price = hist['Close'].iloc[0]
        except Exception:
            pick_price = 10.0 # fallback
            
    picks_ref.set({
        'ticker': new_pick,
        'pick_date': today_str,
        'pick_price': pick_price,
        'current_price': pick_price,
        'total_return_pct': 0.0,
        'history': [{'date': today_str, 'return_pct': 0.0}],
        'created_at': firestore.SERVER_TIMESTAMP
    })
    print(f"Successfully updated today's pick to {new_pick} at ${pick_price:.2f}")

if __name__ == '__main__':
    fix_today_pick()
