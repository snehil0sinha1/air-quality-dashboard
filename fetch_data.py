import requests
import pandas as pd

API_KEY = "579b464db66ec23bdd000001ec84b2548b7b4af34b676d383c35fc69"
RESOURCE_ID = "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"

# Fetch some records (increase limit if needed)
url = f"https://api.data.gov.in/resource/{RESOURCE_ID}?api-key={API_KEY}&format=json&limit=500"

response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    records = data.get("records", [])
    df = pd.DataFrame(records)

    if not df.empty:
        # Get unique states and cities
        unique_states = sorted(df['state'].dropna().unique())
        unique_cities = sorted(df['city'].dropna().unique())

        print(" Available States:")
        print(unique_states)

        print("\n Available Cities:")
        print(unique_cities)

        # Group by state → list cities under each state
        state_city_map = df.groupby('state')['city'].unique().apply(list).to_dict()

        print("\nState -> Cities Mapping:")
        for state, cities in state_city_map.items():
            print(f"{state} -> {cities}")

    else:
        print("No data found in response.")
else:
    print("Error:", response.status_code, response.text)
