import os
import random
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from inventory.models import Product, ProductCategory

# Ensure some categories exist
categories = ["Office Supplies", "Hardware", "Peripherals", "Networking", "Storage"]
cat_objs = []
for cat in categories:
    obj, _ = ProductCategory.objects.get_or_create(name=cat)
    cat_objs.append(obj)

print("Seeding 20 more sample products...")

more_products_data = [
    {"sku": "SAMP-016", "name": "Ergonomic Footrest", "price": 35.0, "min": 10},
    {"sku": "SAMP-017", "name": "USB-C to HDMI Adapter", "price": 18.0, "min": 25},
    {"sku": "SAMP-018", "name": "Standing Desk Converter", "price": 120.0, "min": 5},
    {"sku": "SAMP-019", "name": "Noise Cancelling Headphones", "price": 85.0, "min": 15},
    {"sku": "SAMP-020", "name": "Wireless Charging Pad", "price": 22.0, "min": 20},
    {"sku": "SAMP-021", "name": "Cable Management Sleeve", "price": 10.0, "min": 40},
    {"sku": "SAMP-022", "name": "Surge Protector 6-Outlet", "price": 15.0, "min": 30},
    {"sku": "SAMP-023", "name": "Desktop Microphone", "price": 45.0, "min": 10},
    {"sku": "SAMP-024", "name": "Privacy Screen Filter 14\"", "price": 28.0, "min": 15},
    {"sku": "SAMP-025", "name": "Privacy Screen Filter 24\"", "price": 42.0, "min": 10},
    {"sku": "SAMP-026", "name": "1TB External SSD", "price": 95.0, "min": 20},
    {"sku": "SAMP-027", "name": "2TB External HDD", "price": 65.0, "min": 15},
    {"sku": "SAMP-028", "name": "Wi-Fi 6 Router", "price": 110.0, "min": 8},
    {"sku": "SAMP-029", "name": "Cat6 Ethernet Cable 10m", "price": 20.0, "min": 25},
    {"sku": "SAMP-030", "name": "8-Port Gigabit Switch", "price": 35.0, "min": 12},
    {"sku": "SAMP-031", "name": "Wireless Presenter Remote", "price": 25.0, "min": 20},
    {"sku": "SAMP-032", "name": "Whiteboard Markers (4-Pack)", "price": 6.0, "min": 50},
    {"sku": "SAMP-033", "name": "Magnetic Whiteboard Eraser", "price": 4.0, "min": 45},
    {"sku": "SAMP-034", "name": "Desk Lamp LED", "price": 30.0, "min": 15},
    {"sku": "SAMP-035", "name": "Posture Corrector Chair Add-on", "price": 40.0, "min": 10},
]

for pdata in more_products_data:
    cat = random.choice(cat_objs)
    Product.objects.get_or_create(
        sku=pdata["sku"],
        defaults={
            "name": pdata["name"],
            "category": cat,
            "uom": "pcs",
            "cost_price": pdata["price"],
            "reorder_minimum": pdata["min"]
        }
    )

print(f"Successfully added 20 more sample products! Total products now: {Product.objects.count()}")
