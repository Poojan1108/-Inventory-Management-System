"""
Management command: seed_data
Clears all inventory data and inserts 15 sample records covering every
entity visible in the application.

Usage:
    python manage.py seed_data
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from inventory.models import (
    Warehouse, Location, ProductCategory, UnitOfMeasure,
    Product, Contact, Operation, OperationLine,
    StockQuant, StockMove, StockLedger,
    Receipt, ReceiptItem, DeliveryOrder, DeliveryItem,
    StockAdjustment, InternalTransfer, InternalTransferItem,
)


class Command(BaseCommand):
    help = "Clear inventory data and load 15 realistic sample records."

    def handle(self, *args, **options):
        self.stdout.write("Clearing existing inventory data...")
        self._clear()
        self.stdout.write(self.style.SUCCESS("✓ Cleared"))

        with transaction.atomic():
            wh, ech = self._warehouses()
            locs = self._locations(wh, ech)
            cats = self._categories()
            uoms = self._uoms()
            products = self._products(cats, uoms)
            contacts = self._contacts()
            self._operations(products, contacts, locs)

        self.stdout.write(self.style.SUCCESS(
            "\n✓ Seed complete — all sample data loaded."
        ))

    # ------------------------------------------------------------------
    # Clear
    # ------------------------------------------------------------------

    def _clear(self):
        StockLedger.objects.all().delete()
        StockMove.objects.all().delete()
        StockQuant.objects.all().delete()
        OperationLine.objects.all().delete()
        Operation.objects.all().delete()
        # Legacy models
        InternalTransferItem.objects.all().delete()
        InternalTransfer.objects.all().delete()
        StockAdjustment.objects.all().delete()
        DeliveryItem.objects.all().delete()
        DeliveryOrder.objects.all().delete()
        ReceiptItem.objects.all().delete()
        Receipt.objects.all().delete()
        # Master data
        Product.objects.all().delete()
        Contact.objects.all().delete()
        ProductCategory.objects.all().delete()
        UnitOfMeasure.objects.all().delete()
        Location.objects.all().delete()
        Warehouse.objects.all().delete()

    # ------------------------------------------------------------------
    # Warehouses
    # ------------------------------------------------------------------

    def _warehouses(self):
        wh = Warehouse.objects.create(
            name="Main Warehouse", code="WH",
            address="Plot 12, Industrial Estate, Mumbai 400001",
        )
        ech = Warehouse.objects.create(
            name="East Coast Hub", code="ECH",
            address="Sector 18, Logistics Park, Delhi 110001",
        )
        self.stdout.write(f"  Warehouses: {wh}, {ech}")
        return wh, ech

    # ------------------------------------------------------------------
    # Locations
    # ------------------------------------------------------------------

    def _locations(self, wh, ech):
        locs = {}

        locs["wh_stock"] = Location.objects.create(
            name="Stock Shelves", short_code="WH/STOCK",
            location_type="internal", warehouse=wh,
        )
        locs["wh_input"] = Location.objects.create(
            name="Input Bay", short_code="WH/IN",
            location_type="internal", warehouse=wh,
        )
        locs["wh_cold"] = Location.objects.create(
            name="Cold Storage", short_code="WH/COLD",
            location_type="internal", warehouse=wh,
        )
        locs["ech_stock"] = Location.objects.create(
            name="Stock Shelves", short_code="ECH/STOCK",
            location_type="internal", warehouse=ech,
        )
        locs["ech_recv"] = Location.objects.create(
            name="Receiving Bay", short_code="ECH/RECV",
            location_type="internal", warehouse=ech,
        )

        self.stdout.write(f"  Locations: {len(locs)} created")
        return locs

    # ------------------------------------------------------------------
    # Categories
    # ------------------------------------------------------------------

    def _categories(self):
        cats = {}
        data = [
            ("Electronics", "Computers, peripherals, and electronic devices"),
            ("Office Supplies", "Stationery, paper, and desk accessories"),
            ("Furniture", "Desks, chairs, and storage units"),
            ("Consumables", "Cleaning products and daily-use items"),
        ]
        for name, desc in data:
            cats[name] = ProductCategory.objects.create(name=name, description=desc)
        self.stdout.write(f"  Categories: {len(cats)} created")
        return cats

    # ------------------------------------------------------------------
    # Units of Measure
    # ------------------------------------------------------------------

    def _uoms(self):
        uoms = {}
        for name, sym in [("Units", "pcs"), ("Kilogram", "kg"), ("Box", "box")]:
            uoms[name] = UnitOfMeasure.objects.create(name=name, abbreviation=sym)
        self.stdout.write(f"  UoMs: {len(uoms)} created")
        return uoms

    # ------------------------------------------------------------------
    # Products
    # ------------------------------------------------------------------

    def _products(self, cats, uoms):
        elec = cats["Electronics"]
        off = cats["Office Supplies"]
        furn = cats["Furniture"]
        cons = cats["Consumables"]

        # uom is a CharField on Product, so pass the abbreviation string
        data = [
            ("Laptop Pro 15", "LP15-001", elec, "pcs", 55000, 5),
            ("Wireless Mouse", "WM-002", elec, "pcs", 900, 10),
            ("Mechanical Keyboard", "MK-003", elec, "pcs", 2800, 8),
            ("Ergonomic Office Chair", "EOC-004", furn, "pcs", 12000, 5),
            ("Standing Desk Pro", "SDP-005", furn, "pcs", 22000, 3),
            ("A4 Paper Ream", "AP-006", off, "box", 280, 20),
            ("Ballpoint Pens Pack (10)", "BPP-007", off, "box", 110, 15),
            ("Hand Sanitizer 500ml", "HS-008", cons, "pcs", 140, 20),
        ]

        products = {}
        for name, sku, cat, uom, cost, reorder_min in data:
            products[sku] = Product.objects.create(
                name=name, sku=sku, category=cat, uom=uom,
                cost_price=cost,
                reorder_minimum=reorder_min,
            )

        self.stdout.write(f"  Products: {len(products)} created")
        return products

    # ------------------------------------------------------------------
    # Contacts
    # ------------------------------------------------------------------

    def _contacts(self):
        contacts = {}
        data = [
            ("TechSupply Co.", "supplier", "procurement@techsupply.in", "+91 98201 11111", "201 Tech Park, Pune"),
            ("Office World Ltd.", "supplier", "orders@officeworld.in", "+91 98202 22222", "45 Commerce St, Bangalore"),
            ("Acme Corporation", "customer", "purchase@acme.com", "+91 98203 33333", "Tower B, BKC, Mumbai"),
            ("Globex Industries", "customer", "orders@globex.in", "+91 98204 44444", "Plot 9, Sector 62, Noida"),
            ("StartupXYZ Pvt. Ltd.", "customer", "ops@startupxyz.io", "+91 98205 55555", "WeWork, Koramangala, Bangalore"),
        ]
        for name, ctype, email, phone, address in data:
            contacts[name] = Contact.objects.create(
                name=name, contact_type=ctype,
                email=email, phone=phone, address=address,
            )
        self.stdout.write(f"  Contacts: {len(contacts)} created")
        return contacts

    # ------------------------------------------------------------------
    # Operations + stock effects
    # ------------------------------------------------------------------

    def _operations(self, products, contacts, locs):
        p = products  # shorthand
        c = contacts
        l = locs

        tech = c["TechSupply Co."]
        offworld = c["Office World Ltd."]
        acme = c["Acme Corporation"]
        globex = c["Globex Industries"]
        startup = c["StartupXYZ Pvt. Ltd."]

        wh_stock = l["wh_stock"]
        wh_input = l["wh_input"]
        ech_stock = l["ech_stock"]

        # ---- Receipt 1: Tech gear from TechSupply (DONE) ----
        r1 = Operation.objects.create(
            reference="WH/IN/0001", operation_type="receipt",
            contact=tech, destination_location=wh_stock,
            scheduled_date="2026-03-01", status="done",
        )
        r1_lines = [
            (p["LP15-001"], 10), (p["WM-002"], 25), (p["MK-003"], 20),
        ]
        for prod, qty in r1_lines:
            OperationLine.objects.create(operation=r1, product=prod, expected_qty=qty, received_qty=qty)
            self._add_quant(prod, wh_stock, qty)
            self._ledger(r1, prod, None, wh_stock, qty)
            self._move(r1.reference, prod, tech, "TechSupply Co. / External", str(wh_stock), qty)

        # ---- Receipt 2: Office supplies from Office World (DONE) ----
        r2 = Operation.objects.create(
            reference="WH/IN/0002", operation_type="receipt",
            contact=offworld, destination_location=wh_stock,
            scheduled_date="2026-03-03", status="done",
        )
        r2_lines = [
            (p["AP-006"], 60), (p["BPP-007"], 40), (p["HS-008"], 50),
            (p["EOC-004"], 8), (p["SDP-005"], 5),
        ]
        for prod, qty in r2_lines:
            OperationLine.objects.create(operation=r2, product=prod, expected_qty=qty, received_qty=qty)
            self._add_quant(prod, wh_stock, qty)
            self._ledger(r2, prod, None, wh_stock, qty)
            self._move(r2.reference, prod, offworld, "Office World / External", str(wh_stock), qty)

        # ---- Delivery 1: Laptops & mice to Acme (DONE) ----
        d1 = Operation.objects.create(
            reference="WH/OUT/0001", operation_type="delivery",
            contact=acme, source_location=wh_stock,
            scheduled_date="2026-03-05", status="done",
        )
        d1_lines = [(p["LP15-001"], 3), (p["WM-002"], 8), (p["MK-003"], 5)]
        for prod, qty in d1_lines:
            OperationLine.objects.create(operation=d1, product=prod, expected_qty=qty, done_qty=qty)
            self._sub_quant(prod, wh_stock, qty)
            self._ledger(d1, prod, wh_stock, None, qty)
            self._move(d1.reference, prod, acme, str(wh_stock), "Acme Corporation", qty)

        # ---- Delivery 2: Office chair to Globex (WAITING) ----
        d2 = Operation.objects.create(
            reference="WH/OUT/0002", operation_type="delivery",
            contact=globex, source_location=wh_stock,
            scheduled_date="2026-03-18", status="waiting",
        )
        d2_lines = [(p["EOC-004"], 2), (p["SDP-005"], 1), (p["AP-006"], 10)]
        for prod, qty in d2_lines:
            OperationLine.objects.create(operation=d2, product=prod, expected_qty=qty)

        # ---- Delivery 3: Peripherals to StartupXYZ (DRAFT) ----
        d3 = Operation.objects.create(
            reference="WH/OUT/0003", operation_type="delivery",
            contact=startup, source_location=wh_stock,
            scheduled_date="2026-03-22", status="draft",
        )
        d3_lines = [(p["WM-002"], 5), (p["MK-003"], 3), (p["BPP-007"], 10)]
        for prod, qty in d3_lines:
            OperationLine.objects.create(operation=d3, product=prod, expected_qty=qty)

        # ---- Internal Transfer: WH/Stock → ECH/Stock (DONE) ----
        t1 = Operation.objects.create(
            reference="INT/0001", operation_type="internal",
            source_location=wh_stock, destination_location=ech_stock,
            scheduled_date="2026-03-10", status="done",
        )
        t1_lines = [(p["AP-006"], 15), (p["HS-008"], 12), (p["WM-002"], 6)]
        for prod, qty in t1_lines:
            OperationLine.objects.create(operation=t1, product=prod, expected_qty=qty, done_qty=qty)
            self._sub_quant(prod, wh_stock, qty)
            self._add_quant(prod, ech_stock, qty)
            self._ledger(t1, prod, wh_stock, ech_stock, qty)
            self._move(t1.reference, prod, None, str(wh_stock), str(ech_stock), qty)

        # ---- Receipt 3: Extra keyboards from TechSupply (READY) ----
        r3 = Operation.objects.create(
            reference="WH/IN/0003", operation_type="receipt",
            contact=tech, destination_location=wh_input,
            scheduled_date="2026-03-20", status="ready",
        )
        OperationLine.objects.create(operation=r3, product=p["MK-003"], expected_qty=15)
        OperationLine.objects.create(operation=r3, product=p["LP15-001"], expected_qty=5)

        # ---- Inventory Adjustment: HS-008 overcount corrected (DONE) ----
        adj1 = Operation.objects.create(
            reference="ADJ/0001", operation_type="adjustment",
            source_location=wh_stock,
            scheduled_date="2026-03-12", status="done",
        )
        quant = StockQuant.objects.filter(product=p["HS-008"], location=wh_stock).first()
        system_qty = quant.quantity if quant else 0
        physical_qty = max(system_qty - 3, 0)      # 3 units found damaged
        OperationLine.objects.create(
            operation=adj1, product=p["HS-008"],
            expected_qty=system_qty, received_qty=physical_qty,
            done_qty=3,
        )
        if quant and system_qty != physical_qty:
            self._sub_quant(p["HS-008"], wh_stock, 3)
            self._ledger(adj1, p["HS-008"], wh_stock, None, 3)
            self._move("ADJ/0001", p["HS-008"], None, str(wh_stock), "Inventory Adjustment / Loss", 3)

        self.stdout.write(f"  Operations: 8 created (receipts 3, deliveries 3, transfer 1, adjustment 1)")
        self._print_stock()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _add_quant(self, product, location, qty):
        q, _ = StockQuant.objects.get_or_create(
            product=product, location=location, defaults={"quantity": 0}
        )
        q.quantity += qty
        q.save(update_fields=["quantity", "updated_at"])

    def _sub_quant(self, product, location, qty):
        q = StockQuant.objects.filter(product=product, location=location).first()
        if q:
            q.quantity = max(0, q.quantity - qty)
            q.save(update_fields=["quantity", "updated_at"])

    def _ledger(self, op, product, from_loc, to_loc, qty):
        StockLedger.objects.create(
            product=product,
            from_location=from_loc,
            to_location=to_loc,
            contact=op.contact if hasattr(op, "contact") else None,
            quantity=qty,
            operation_ref=op.reference,
        )

    def _move(self, ref, product, contact, from_loc, to_loc, qty):
        StockMove.objects.create(
            reference=ref,
            product=product,
            contact=contact,
            from_location=from_loc,
            to_location=to_loc,
            quantity=qty,
            status="done",
        )

    def _print_stock(self):
        self.stdout.write("\n  Current Stock Levels:")
        for q in StockQuant.objects.select_related("product", "location").order_by("location__short_code", "product__name"):
            self.stdout.write(f"    [{q.location.short_code}] {q.product.name}: {q.quantity}")
