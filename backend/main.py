import os
import json
import random
import zipfile
import io
import datetime
import requests
import functions_framework
from google.cloud import firestore
from tiingo import TiingoClient
import yfinance as yf

# Initialize Firestore DB
# When deployed to Cloud Functions, it uses the default service account automatically.
db = firestore.Client(project=os.environ.get('GCP_PROJECT', 'primateportfolio'))

def get_tiingo_client():
    config = {}
    config['session'] = True
    config['api_key'] = os.environ.get('TIINGO_API_KEY')
    return TiingoClient(config)

def download_supported_tickers():
    """Fetches supported tickers directly using the Tiingo Python client."""
    client = get_tiingo_client()
    data = client.list_stock_tickers()
    
    tickers = []
    supported_exchanges = {'NYSE', 'NASDAQ', 'AMEX'}
    for item in data:
        if isinstance(item, dict) and item.get('assetType') == 'Stock' and item.get('startDate') and item.get('endDate'):
            if item.get('exchange', '').upper() in supported_exchanges:
                tickers.append(item.get('ticker'))
    return tickers

@functions_framework.http
def generate_pick(request):
    """
    Cloud Function to generate a daily pick.
    Triggered daily at 6:05 AM PST.
    """
    if not os.environ.get('TIINGO_API_KEY'):
        return ("TIINGO_API_KEY not set", 500)
        
    try:
        tickers = download_supported_tickers()
        if not tickers:
            return ("Failed to fetch tickers", 500)
            
        # Fetch past picks to ensure we don't repeat them
        past_picks_ref = db.collection('daily_picks').stream()
        past_picks = {doc.to_dict().get('ticker') for doc in past_picks_ref if doc.to_dict().get('ticker')}
        
        client = get_tiingo_client()
        
        pick = None
        for _ in range(50):
            candidate = random.choice(tickers)
            if candidate in past_picks:
                continue
                
            try:
                hist = yf.Ticker(candidate).history(period="1d")
                if not hist.empty and len(hist) > 0:
                    # Verify Tiingo actually has a price for it right now
                    pricing = client.get_ticker_price(candidate)
                    if pricing and len(pricing) > 0 and pricing[0].get('close') is not None:
                        pick = candidate
                        break
            except Exception:
                pass
                
        if not pick:
            return ("Failed to find a valid stock pick with price data", 500)
            
        print(f"Today's Monkey Pick is: {pick}")
        
        # Fetch the morning price
        pricing = client.get_ticker_price(pick)
        pick_price = None
        if pricing:
            pick_price = pricing[0].get('close')
        
        today_str = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d')
        
        # Store in Firestore
        doc_ref = db.collection('daily_picks').document(today_str)
        doc_ref.set({
            'ticker': pick,
            'pick_date': today_str,
            'pick_price': pick_price,
            'current_price': pick_price,
            'total_return_pct': 0.0,
            'history': [{'date': today_str, 'return_pct': 0.0}],
            'created_at': firestore.SERVER_TIMESTAMP
        })
        
        return (f"Successfully picked {pick} for {today_str}", 200)
    except Exception as e:
        print(f"Error generating pick: {e}")
        return (str(e), 500)

@functions_framework.http
def update_performance(request):
    """
    Cloud Function to update the performance of all past picks.
    Triggered daily at 6:00 PM EST.
    """
    if not os.environ.get('TIINGO_API_KEY'):
         return ("TIINGO_API_KEY not set", 500)
         
    try:
        client = get_tiingo_client()
        picks_ref = db.collection('daily_picks')
        docs = picks_ref.stream()
        
        updated_count = 0
        
        for doc in docs:
            data = doc.to_dict()
            ticker = data.get('ticker')
            
            if not ticker:
                continue
                
            try:
                # Get the latest daily price
                pricing = client.get_ticker_price(ticker)
                
                if not pricing:
                     print(f"No pricing data found for {ticker}")
                     continue
                     
                latest_price = pricing[0].get('close')
                
                # Update logic
                update_data = {
                    'current_price': latest_price,
                    'last_updated': firestore.SERVER_TIMESTAMP
                }
                
                # If pick_price is None, it means it's the first time we are getting EOD data for this pick.
                # Use today's close as the entry price.
                current_pick_price = data.get('pick_price')
                if current_pick_price is None:
                    update_data['pick_price'] = latest_price
                    current_pick_price = latest_price
                
                # Calculate ROI
                roi_pct = 0.0
                if current_pick_price and current_pick_price > 0:
                     roi_pct = ((latest_price - current_pick_price) / current_pick_price) * 100
                     update_data['total_return_pct'] = roi_pct
                
                # Append to history array
                today_str = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d')
                update_data['history'] = firestore.ArrayUnion([{'date': today_str, 'return_pct': roi_pct}])

                doc.reference.update(update_data)
                updated_count += 1
                
            except Exception as inner_e:
                print(f"Error updating {ticker}: {inner_e}")
                
        return (f"Successfully updated {updated_count} picks", 200)
        
    except Exception as e:
         print(f"Error in update_performance: {e}")
         return (str(e), 500)

def default_json_serializer(obj):
    if isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    return str(obj)

@functions_framework.http
def get_picks_api(request):
    """
    HTTP API to get all picks, cached by CDN.
    """
    try:
        picks_ref = db.collection('daily_picks')
        query = picks_ref.order_by('pick_date', direction=firestore.Query.DESCENDING)
        docs = query.stream()
        
        picks = []
        for doc in docs:
            pick_data = doc.to_dict()
            pick_data['id'] = doc.id
            picks.append(pick_data)
            
        headers = {
            'Cache-Control': 'public, max-age=300, s-maxage=300',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
        
        return (json.dumps(picks, default=default_json_serializer), 200, headers)
    except Exception as e:
        print(f"Error fetching picks API: {e}")
        return (str(e), 500)
