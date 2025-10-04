import requests
import json
# 1. Define the URL
url = "https://api.openaq.org/v3/locations?countries_id=9"

# 2. Define the Headers (including your API Key)
headers = {
    'x-api-key': 'e8be7c7a92baa01be7a6af8fcea6d92a90c795e4ff9bb917573cb027dc09be9a'  
}


try:
    # 3. Make the GET request, passing the headers
    response = requests.get(url, headers=headers)
    
    # Check for a successful response (e.g., status code 200)
    response.raise_for_status()

    # Get the JSON data
    data = response.json()
    with open("output.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


except requests.exceptions.RequestException as e:
    print(f"An error occurred: {e}")



import json

# Load the JSON data from the file
with open("output.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Extract required fields
extracted_data = []
for item in data.get("results", []):
    extracted_data.append({
        "id": item.get("id"),
        "name": item.get("name"),
        "country": item.get("country"),
        "coordinates": item.get("coordinates")  # This is usually a dict with 'latitude' and 'longitude'
    })

# Print the extracted data
for d in extracted_data:
    print(d)

# Optional: Save extracted data to a new JSON file
with open("extracted_locations.json", "w", encoding="utf-8") as f:
    json.dump(extracted_data, f, ensure_ascii=False, indent=2)
