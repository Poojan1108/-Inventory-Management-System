import os
import django
from datetime import date

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from inventory.models import Receipt, DeliveryOrder, Operation, OperationLine

print("Migrating newly created Receipts and Deliveries to Operations...")

# 1. Migrate Receipts
receipts = Receipt.objects.filter(reference__startswith="WH/IN/SAMP-")
r_count = 0
for r in receipts:
    op, created = Operation.objects.get_or_create(
        reference=r.reference,
        defaults={
            "operation_type": "receipt",
            "contact": r.vendor,
            "destination_location": r.destination,
            "scheduled_date": r.scheduled_date,
            "status": r.status,
            "responsible": r.responsible,
            "created_at": r.created_at,
        }
    )
    if created:
        r_count += 1
        for item in r.items.all():
            OperationLine.objects.get_or_create(
                operation=op,
                product=item.product,
                defaults={
                    "expected_qty": item.expected_qty,
                    "received_qty": item.received_qty,
                    "done_qty": item.received_qty,
                }
            )

# 2. Migrate Deliveries
deliveries = DeliveryOrder.objects.filter(reference__startswith="WH/OUT/SAMP-")
d_count = 0
for d in deliveries:
    op, created = Operation.objects.get_or_create(
        reference=d.reference,
        defaults={
            "operation_type": "delivery",
            "contact": d.contact,
            "source_location": d.source_location,
            "scheduled_date": d.scheduled_date,
            "status": d.status,
            "responsible": d.responsible,
            "created_at": d.created_at,
        }
    )
    if created:
        d_count += 1
        for item in d.items.all():
            OperationLine.objects.get_or_create(
                operation=op,
                product=item.product,
                defaults={
                    "expected_qty": item.ordered_qty,
                    "received_qty": 0,
                    "done_qty": item.picked_qty,
                }
            )

print(f"Successfully migrated {r_count} Receipts and {d_count} Deliveries to Operations!")
print(f"Total Operations: {Operation.objects.count()}")
