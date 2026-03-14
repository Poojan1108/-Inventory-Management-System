import os
import random
from datetime import date, timedelta
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from inventory.models import (
    Contact, CustomUser, DeliveryItem, DeliveryOrder, Location,
    Product, Receipt, ReceiptItem, StockMove, StockQuant
)

print("Seeding sample Operations and History...")

# Fetch or create basic data
users = list(CustomUser.objects.filter(is_staff=True))
if not users:
    admin_user, _ = CustomUser.objects.get_or_create(
        username="admin",
        defaults={
            "first_name": "Admin",
            "last_name": "User",
            "email": "admin@example.com",
            "is_staff": True,
            "is_superuser": True,
        }
    )
    users = [admin_user]

suppliers = list(Contact.objects.filter(contact_type="supplier"))
customers = list(Contact.objects.filter(contact_type="customer"))

# Ensure we have enough contacts
if not suppliers:
    s, _ = Contact.objects.get_or_create(name="Tech Supplies Co", contact_type="supplier")
    suppliers.append(s)
if not customers:
    c, _ = Contact.objects.get_or_create(name="General Customer", contact_type="customer")
    customers.append(c)

# Fetch locations
loc_in = Location.objects.filter(location_type="internal").first()
loc_out = Location.objects.filter(location_type="internal").last()

# Fetch newer products (the recently added ones)
products = list(Product.objects.filter(sku__startswith="SAMP-"))

if not products:
    print("No SAMP- products found. Exiting.")
    exit()

# Generate 5 Receipts
for i in range(1, 6):
    r_ref = f"WH/IN/SAMP-{i:03d}"
    receipt, created = Receipt.objects.get_or_create(
        reference=r_ref,
        defaults={
            "vendor": random.choice(suppliers),
            "source_document": f"PO-SAMP-{i:03d}",
            "destination": loc_in,
            "scheduled_date": date.today() - timedelta(days=random.randint(0, 10)),
            "status": "done" if i <= 3 else "ready", # Mix of done and ready
            "responsible": random.choice(users),
        }
    )
    
    if created:
        print(f"Created Receipt: {r_ref}")
        # Add 1-3 items per receipt
        for j in range(random.randint(1, 4)):
            prod = random.choice(products)
            qty = random.randint(10, 50)
            
            # Create Receipt Item
            ReceiptItem.objects.get_or_create(
                receipt=receipt,
                product=prod,
                defaults={
                    "expected_qty": qty,
                    "received_qty": qty if receipt.status == "done" else (qty // 2 if j == 1 else 0)
                }
            )
            
            # If done, create history (StockMove) & update Quant
            if receipt.status == "done":
                StockMove.objects.get_or_create(
                    reference=r_ref,
                    product=prod,
                    defaults={
                        "contact": receipt.vendor,
                        "from_location": "Vendor",
                        "to_location": loc_in.name,
                        "quantity": qty,
                        "status": "done",
                        "date": receipt.scheduled_date
                    }
                )
                
                sq, _ = StockQuant.objects.get_or_create(product=prod, location=loc_in, defaults={"quantity": 0})
                sq.quantity += qty
                sq.save()

# Generate 5 Delivery Orders
for i in range(1, 6):
    d_ref = f"WH/OUT/SAMP-{i:03d}"
    delivery, created = DeliveryOrder.objects.get_or_create(
        reference=d_ref,
        defaults={
            "contact": random.choice(customers),
            "source_document": f"SO-SAMP-{i:03d}",
            "source_location": loc_out,
            "delivery_address": "Random Sample Address",
            "scheduled_date": date.today() + timedelta(days=random.randint(-5, 5)),
            "status": "done" if i <= 2 else "waiting", # Mix of done and waiting
            "responsible": random.choice(users),
        }
    )
    
    if created:
        print(f"Created Delivery: {d_ref}")
        # Add 1-3 items per delivery
        for j in range(random.randint(1, 4)):
            prod = random.choice(products)
            qty = random.randint(2, 15)
            
            # Create Delivery Item
            DeliveryItem.objects.get_or_create(
                delivery_order=delivery,
                product=prod,
                defaults={
                    "ordered_qty": qty,
                    "picked_qty": qty if delivery.status == "done" else 0
                }
            )
            
            # If done, create history (StockMove) & update Quant
            if delivery.status == "done":
                StockMove.objects.get_or_create(
                    reference=d_ref,
                    product=prod,
                    defaults={
                        "contact": delivery.contact,
                        "from_location": loc_out.name,
                        "to_location": "Customer",
                        "quantity": qty,
                        "status": "done",
                        "date": delivery.scheduled_date
                    }
                )
                
                sq, sq_created = StockQuant.objects.get_or_create(product=prod, location=loc_out, defaults={"quantity": 50}) # ensure default qty so it doesn't go deeply negative if it wasn't there
                sq.quantity -= qty
                sq.save()

print("Successfully seeded Receipts, Deliveries, Stock Moves, and updated Stock Quants!")
print(f"   Receipts: {Receipt.objects.count()}")
print(f"   Delivery Orders: {DeliveryOrder.objects.count()}")
print(f"   Stock Moves: {StockMove.objects.count()}")
