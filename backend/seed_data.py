"""
Seed script to populate the database with sample data.
Run: python manage.py shell < seed_data.py
"""

import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from datetime import date, timedelta
from inventory.models import (
    Contact,
    CustomUser,
    DeliveryItem,
    DeliveryOrder,
    Location,
    Product,
    ProductCategory,
    Receipt,
    ReceiptItem,
    StockAdjustment,
    StockMove,
    UnitOfMeasure,
    Warehouse,
)

print("🌱 Seeding database...")

# --- Users ---
admin_user, _ = CustomUser.objects.get_or_create(
    username="admin",
    defaults={
        "first_name": "Admin",
        "last_name": "User",
        "email": "admin@coreinv.com",
        "is_staff": True,
        "is_superuser": True,
    },
)
admin_user.set_password("admin123")
admin_user.save()

# --- UOM ---
pcs, _ = UnitOfMeasure.objects.get_or_create(name="Pieces", defaults={"abbreviation": "pcs"})
kg, _ = UnitOfMeasure.objects.get_or_create(name="Kilograms", defaults={"abbreviation": "kg"})

# --- Categories ---
furniture, _ = ProductCategory.objects.get_or_create(name="Furniture")
electronics, _ = ProductCategory.objects.get_or_create(name="Electronics")
accessories, _ = ProductCategory.objects.get_or_create(name="Accessories")

# --- Warehouses ---
wh_main, _ = Warehouse.objects.get_or_create(code="WH-MAIN", defaults={"name": "Main Warehouse"})
wh_b, _ = Warehouse.objects.get_or_create(code="WH-B", defaults={"name": "Warehouse B"})

# --- Locations ---
loc_a1, _ = Location.objects.get_or_create(
    warehouse=wh_main, short_code="A101",
    defaults={"name": "Warehouse A / Rack 1", "location_type": "internal"},
)
loc_a2, _ = Location.objects.get_or_create(
    warehouse=wh_main, short_code="A102",
    defaults={"name": "Warehouse A / Rack 2", "location_type": "internal"},
)
loc_a4, _ = Location.objects.get_or_create(
    warehouse=wh_main, short_code="A104",
    defaults={"name": "Warehouse A / Rack 4", "location_type": "internal"},
)
loc_b_bulky, _ = Location.objects.get_or_create(
    warehouse=wh_b, short_code="B-BLK",
    defaults={"name": "Warehouse B / Bulky", "location_type": "internal"},
)
loc_b_secure, _ = Location.objects.get_or_create(
    warehouse=wh_b, short_code="B-SEC",
    defaults={"name": "Warehouse B / Secure", "location_type": "internal"},
)
loc_vendor, _ = Location.objects.get_or_create(
    warehouse=wh_main, short_code="VEND",
    defaults={"name": "Vendor Location", "location_type": "vendor"},
)
loc_transit, _ = Location.objects.get_or_create(
    warehouse=wh_main, short_code="TRANS",
    defaults={"name": "Transit Zone", "location_type": "transit"},
)

# --- Products ---
desk, _ = Product.objects.get_or_create(
    sku="DESK001",
    defaults={"name": "Ergonomic Desk", "category": furniture, "uom": pcs, "cost_price": 3000, "reorder_minimum": 10},
)
keyboard, _ = Product.objects.get_or_create(
    sku="KEY042",
    defaults={"name": "Mechanical Keyboard", "category": electronics, "uom": pcs, "cost_price": 1500, "reorder_minimum": 20},
)
monitor_stand, _ = Product.objects.get_or_create(
    sku="MNT088",
    defaults={"name": "Monitor Stand", "category": accessories, "uom": pcs, "cost_price": 800, "reorder_minimum": 15},
)
chair, _ = Product.objects.get_or_create(
    sku="CHAIR015",
    defaults={"name": "Office Chair", "category": furniture, "uom": pcs, "cost_price": 5000, "reorder_minimum": 5},
)
ldesk, _ = Product.objects.get_or_create(
    sku="LDESK009",
    defaults={"name": "L-Shaped Desk", "category": furniture, "uom": pcs, "cost_price": 4500, "reorder_minimum": 3},
)

# --- Contacts ---
tech_supplies, _ = Contact.objects.get_or_create(
    name="TechSupplies Inc.",
    defaults={"contact_type": "supplier", "email": "orders@techsupplies.com", "phone": "+91-9876543210"},
)
office_corp, _ = Contact.objects.get_or_create(
    name="OfficeCorp Logistics",
    defaults={"contact_type": "supplier", "email": "supply@officecorp.com"},
)
global_displays, _ = Contact.objects.get_or_create(
    name="Global Displays Ltd.",
    defaults={"contact_type": "supplier", "email": "info@globaldisplays.com"},
)
furniture_world, _ = Contact.objects.get_or_create(
    name="Furniture World",
    defaults={"contact_type": "supplier", "email": "sales@furnitureworld.com"},
)
azure_interior, _ = Contact.objects.get_or_create(
    name="Azure Interior",
    defaults={"contact_type": "customer", "email": "purchase@azureinterior.com", "address": "42 MG Road, Mumbai"},
)

# --- Receipts ---
r1, _ = Receipt.objects.get_or_create(
    reference="WH/IN/0001",
    defaults={
        "vendor": tech_supplies, "source_document": "PO-2026-001",
        "destination": loc_a1, "scheduled_date": date.today(),
        "status": "ready", "responsible": admin_user,
    },
)
ReceiptItem.objects.get_or_create(receipt=r1, product=keyboard, defaults={"expected_qty": 50, "received_qty": 0})

r2, _ = Receipt.objects.get_or_create(
    reference="WH/IN/0002",
    defaults={
        "vendor": office_corp, "source_document": "PO-2026-002",
        "destination": loc_b_bulky, "scheduled_date": date.today() + timedelta(days=1),
        "status": "waiting", "responsible": admin_user,
    },
)
ReceiptItem.objects.get_or_create(receipt=r2, product=desk, defaults={"expected_qty": 15, "received_qty": 0})

r3, _ = Receipt.objects.get_or_create(
    reference="WH/IN/0003",
    defaults={
        "vendor": global_displays, "source_document": "PO-2026-003",
        "destination": loc_a4, "scheduled_date": date.today() - timedelta(days=1),
        "status": "ready", "responsible": admin_user,
    },
)
ReceiptItem.objects.get_or_create(receipt=r3, product=monitor_stand, defaults={"expected_qty": 100, "received_qty": 0})

r4, _ = Receipt.objects.get_or_create(
    reference="WH/IN/0004",
    defaults={
        "vendor": tech_supplies, "source_document": "PO-2026-004",
        "destination": loc_b_secure, "scheduled_date": date(2026, 10, 12),
        "status": "done", "responsible": admin_user,
    },
)
ReceiptItem.objects.get_or_create(receipt=r4, product=chair, defaults={"expected_qty": 20, "received_qty": 20})

r5, _ = Receipt.objects.get_or_create(
    reference="WH/IN/0005",
    defaults={
        "vendor": furniture_world, "source_document": "PO-2026-005",
        "destination": loc_a2, "scheduled_date": date(2026, 10, 10),
        "status": "canceled", "responsible": admin_user,
    },
)
ReceiptItem.objects.get_or_create(receipt=r5, product=ldesk, defaults={"expected_qty": 5, "received_qty": 0})

# --- Delivery Orders ---
d1, _ = DeliveryOrder.objects.get_or_create(
    reference="WH/OUT/0001",
    defaults={
        "contact": azure_interior, "source_document": "SO-2026-001",
        "source_location": loc_a1, "delivery_address": "42 MG Road, Mumbai",
        "scheduled_date": date.today(), "status": "ready", "responsible": admin_user,
    },
)
DeliveryItem.objects.get_or_create(delivery_order=d1, product=chair, defaults={"ordered_qty": 2, "picked_qty": 2})
DeliveryItem.objects.get_or_create(delivery_order=d1, product=desk, defaults={"ordered_qty": 6, "picked_qty": 0})

d2, _ = DeliveryOrder.objects.get_or_create(
    reference="WH/OUT/0002",
    defaults={
        "contact": azure_interior, "source_document": "SO-2026-002",
        "source_location": loc_a2, "delivery_address": "42 MG Road, Mumbai",
        "scheduled_date": date.today() + timedelta(days=2), "status": "waiting", "responsible": admin_user,
    },
)
DeliveryItem.objects.get_or_create(delivery_order=d2, product=keyboard, defaults={"ordered_qty": 10, "picked_qty": 0})

d3, _ = DeliveryOrder.objects.get_or_create(
    reference="WH/OUT/0003",
    defaults={
        "contact": azure_interior, "source_document": "SO-2026-003",
        "source_location": loc_a4, "delivery_address": "42 MG Road, Mumbai",
        "scheduled_date": date.today() - timedelta(days=2), "status": "done", "responsible": admin_user,
    },
)
DeliveryItem.objects.get_or_create(delivery_order=d3, product=monitor_stand, defaults={"ordered_qty": 5, "picked_qty": 5})

# --- Stock Adjustments ---
StockAdjustment.objects.get_or_create(
    product=desk, location=loc_a1,
    defaults={"system_qty": 50, "physical_qty": 48, "reason": "damaged", "status": "pending"},
)
StockAdjustment.objects.get_or_create(
    product=keyboard, location=loc_a2,
    defaults={"system_qty": 120, "physical_qty": 125, "reason": "correction", "status": "pending"},
)
StockAdjustment.objects.get_or_create(
    product=chair, location=loc_b_bulky,
    defaults={"system_qty": 15, "physical_qty": 14, "reason": "theft", "status": "pending"},
)
StockAdjustment.objects.get_or_create(
    product=monitor_stand, location=loc_a4,
    defaults={"system_qty": 300, "physical_qty": 300, "reason": "correction", "status": "applied"},
)

# --- Stock Moves ---
StockMove.objects.get_or_create(
    reference="WH/IN/0001", product=desk,
    defaults={"contact": tech_supplies, "from_location": "Vendor", "to_location": "WH/Stock1", "quantity": 50, "status": "ready"},
)
StockMove.objects.get_or_create(
    reference="WH/OUT/0002", product=keyboard,
    defaults={"contact": azure_interior, "from_location": "WH/Stock1", "to_location": "Customer", "quantity": 10, "status": "done"},
)
StockMove.objects.get_or_create(
    reference="WH/OUT/0003", product=monitor_stand,
    defaults={"contact": azure_interior, "from_location": "WH/Stock2", "to_location": "Customer", "quantity": 5, "status": "done"},
)

print("✅ Seed data created successfully!")
print(f"   Users: {CustomUser.objects.count()}")
print(f"   Warehouses: {Warehouse.objects.count()}")
print(f"   Locations: {Location.objects.count()}")
print(f"   Products: {Product.objects.count()}")
print(f"   Contacts: {Contact.objects.count()}")
print(f"   Receipts: {Receipt.objects.count()}")
print(f"   Delivery Orders: {DeliveryOrder.objects.count()}")
print(f"   Adjustments: {StockAdjustment.objects.count()}")
print(f"   Stock Moves: {StockMove.objects.count()}")
