import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from inventory.models import Product, ProductCategory

# Ensure some categories exist
categories = ["Office Supplies", "Hardware", "Peripherals"]
cat_objs = []
for cat in categories:
    obj, _ = ProductCategory.objects.get_or_create(name=cat)
    cat_objs.append(obj)

print("Seeding 15 sample products...")

products_data = [
    {"sku": "SAMP-001", "name": "Wireless Mouse Base", "price": 25.0, "min": 10},
    {"sku": "SAMP-002", "name": "Wireless Mouse Pro", "price": 45.0, "min": 10},
    {"sku": "SAMP-003", "name": "Bluetooth Keyboard", "price": 60.0, "min": 15},
    {"sku": "SAMP-004", "name": "USB-C Hub (4 Ports)", "price": 30.0, "min": 20},
    {"sku": "SAMP-005", "name": "USB-C Hub (8 Ports)", "price": 55.0, "min": 10},
    {"sku": "SAMP-006", "name": "Webcam 1080p", "price": 80.0, "min": 5},
    {"sku": "SAMP-007", "name": "Webcam 4K", "price": 150.0, "min": 5},
    {"sku": "SAMP-008", "name": "Notebook A5", "price": 5.0, "min": 50},
    {"sku": "SAMP-009", "name": "Gel Pens (Pack of 10)", "price": 8.0, "min": 40},
    {"sku": "SAMP-010", "name": "Desk Organizer", "price": 18.0, "min": 15},
    {"sku": "SAMP-011", "name": "HDMI Cable 2m", "price": 12.0, "min": 30},
    {"sku": "SAMP-012", "name": "Ethernet Cable 5m", "price": 15.0, "min": 25},
    {"sku": "SAMP-013", "name": "Monitor Arm Single", "price": 40.0, "min": 10},
    {"sku": "SAMP-014", "name": "Monitor Arm Dual", "price": 65.0, "min": 5},
    {"sku": "SAMP-015", "name": "Mousepad Large", "price": 15.0, "min": 20},
]

for i, pdata in enumerate(products_data):
    cat = cat_objs[i % len(cat_objs)]
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

print(f"Successfully added 15 sample products! Total products now: {Product.objects.count()}")
