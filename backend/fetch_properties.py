import sqlite3
import argparse

DB_PATH = '../backend/hns.db'  # Adjust path as needed

def fetch_properties(location, price_range, bhk_types):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Fetch only required columns
    query = "SELECT id, Property_name, location, Price_Starting_From FROM property WHERE 1=1"
    params = []
    if location:
        query += " AND location LIKE ?"
        params.append(f"%{location}%")
    if price_range:
        query += " AND Price_Starting_From <= ?"
        params.append(price_range)
    if bhk_types:
        type_conditions = []
        for bhk in bhk_types:
            type_conditions.append("Existing_Configurations LIKE ?")
            params.append(f'%"type": "{bhk}"%')
        query += " AND (" + " OR ".join(type_conditions) + ")"

    cursor.execute(query, params)
    results = cursor.fetchall()
    conn.close()

    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fetch properties by location, price, and BHK type.")
    parser.add_argument('--location', type=str, default='', help='Location to search')
    parser.add_argument('--price', type=int, default=0, help='Max price (in Cr)')
    parser.add_argument('--type', nargs='*', default=[], help='BHK types (e.g. 1bhk 2bhk)')
    args = parser.parse_args()

    properties = fetch_properties(args.location, args.price, args.type)

    if not properties:
        print("\nNo matching properties found.\n")
    else:
        print("\nFiltered Properties:\n")
        print(f"{'ID':<5} {'Property Name':<30} {'Location':<20} {'Starting Price'}")
        print("-" * 80)
        for prop in properties:
            print(f"{prop[0]:<5} {prop[1]:<30} {prop[2]:<20} {prop[3]}")
