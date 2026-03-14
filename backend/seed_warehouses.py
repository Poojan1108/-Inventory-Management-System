import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from inventory.models import Warehouse, Location

print("Seeding sample Warehouses and Locations...")

warehouses_data = [
    {"code": "WH-NYC", "name": "New York Distribution Center", "address": "123 Broadway, NY"},
    {"code": "WH-LAX", "name": "Los Angeles Hub", "address": "456 Sunset Blvd, CA"},
    {"code": "WH-CHI", "name": "Chicago Storage Facility", "address": "789 Lake Shore Dr, IL"},
    {"code": "WH-TEX", "name": "Texas Regional Warehouse", "address": "101 Lone Star Way, TX"},
]

new_wh_count = 0
new_loc_count = 0

for wh_data in warehouses_data:
    wh, created = Warehouse.objects.get_or_create(
        code=wh_data["code"],
        defaults={
            "name": wh_data["name"],
            "address": wh_data["address"],
        }
    )
    
    if created:
        new_wh_count += 1
        
        # Add 3 locations per new warehouse
        locations_data = [
            {"short_code": f"{wh.code}-A1", "name": f"{wh.name} / Zone A / Rack 1"},
            {"short_code": f"{wh.code}-B2", "name": f"{wh.name} / Zone B / Rack 2"},
            {"short_code": f"{wh.code}-C3", "name": f"{wh.name} / Zone C / Rack 3"},
        ]
        
        for loc_data in locations_data:
            Location.objects.get_or_create(
                warehouse=wh,
                short_code=loc_data["short_code"],
                defaults={
                    "name": loc_data["name"],
                    "location_type": "internal"
                }
            )
            new_loc_count += 1

print(f"Successfully added {new_wh_count} Warehouses and {new_loc_count} Locations!")
print(f"Total Warehouses: {Warehouse.objects.count()}")
print(f"Total Locations: {Location.objects.count()}")
