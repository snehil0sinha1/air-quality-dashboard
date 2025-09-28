import requests
import pandas as pd
import os

API_KEY = "579b464db66ec23bdd000001ec84b2548b7b4af34b676d383c35fc69"
BASE_URL = "https://api.data.gov.in/resource/c0025cca-0daa-4fcf-93f8-36e6466d6c34"
OUTPUT_FILE = "data_gov_air_quality.csv"

def fetch_data(limit=1000):
    """Fetch paginated data from data.gov.in API and return as dataframe"""
    all_records = []
    offset = 0
    
    while True:
        url = f"{BASE_URL}?api-key={API_KEY}&format=json&limit={limit}&offset={offset}"
        response = requests.get(url)
        
        if response.status_code != 200:
            print("Error:", response.text)
            break

        data = response.json()
        records = data.get("records", [])
        
        if not records:
            break  # No more data
        
        all_records.extend(records)
        offset += limit
        print(f"Fetched {len(all_records)} records so far...")
    
    return pd.DataFrame(all_records)

if __name__ == "__main__":
    df = fetch_data(limit=1000)
    print("Total records fetched:", len(df))
    
    # Save to CSV
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"Saved data to {OUTPUT_FILE}")
