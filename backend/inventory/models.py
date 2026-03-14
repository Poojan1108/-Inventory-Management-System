"""
Phase 1: Master Data Models for Inventory Management System.

Dependency order:
  1. CustomUser (Authentication)
  2. Warehouse → Location (Infrastructure)
  3. ProductCategory → Product (Product Master Data)
  4. Contact (Vendors & Customers)

Additional models added (not in original spec):
  - UnitOfMeasure: Normalized UOM table instead of a plain CharField,
    allows the frontend dropdown to be data-driven.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


# =============================================================================
# 1. Authentication
# =============================================================================

class CustomUser(AbstractUser):
    """
    Extended user model with OTP support for password reset.
    Inherits: username, email, first_name, last_name, password, etc.
    """

    class Role(models.TextChoices):
        MANAGER = "manager", "Inventory Manager"
        STAFF = "staff", "Warehouse Staff"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STAFF,
    )
    otp_code = models.CharField(
        max_length=6,
        null=True,
        blank=True,
        help_text="6-digit OTP code for password reset verification.",
    )
    otp_created_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when the OTP was generated (for expiry checks).",
    )

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return self.get_full_name() or self.username


# =============================================================================
# 2. Infrastructure — Multi-Warehouse Support
# =============================================================================

class Warehouse(models.Model):
    """
    Top-level physical warehouse or distribution centre.
    Maps to the 'WH-Main', 'WH-Secondary' dropdowns in the frontend.
    """

    name = models.CharField(max_length=255)
    code = models.CharField(
        max_length=10,
        unique=True,
        help_text="Short unique code, e.g. 'WH-MAIN'.",
    )
    address = models.TextField(
        blank=True,
        default="",
        help_text="Physical address of the warehouse.",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Warehouses"

    def __str__(self):
        return f"[{self.code}] {self.name}"


class Location(models.Model):
    """
    Sub-section within a warehouse (Aisle, Rack, Bin, Zone).
    Maps to the Warehouse & Locations page table rows.
    """

    class LocationType(models.TextChoices):
        INTERNAL = "internal", "Internal"
        VENDOR = "vendor", "Vendor"
        CUSTOMER = "customer", "Customer"
        LOSS = "loss", "Loss"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        ARCHIVED = "archived", "Archived"

    name = models.CharField(
        max_length=255,
        help_text="Full descriptive name, e.g. 'Warehouse A / Rack 1'.",
    )
    short_code = models.CharField(
        max_length=20,
        help_text="Short identifier, e.g. 'A101', 'ZONE1'.",
    )
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name="locations",
    )
    location_type = models.CharField(
        max_length=20,
        choices=LocationType.choices,
        default=LocationType.INTERNAL,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["warehouse", "name"]
        unique_together = [["warehouse", "short_code"]]

    def __str__(self):
        return f"[{self.short_code}] {self.name}"


# =============================================================================
# 3. Product Master Data
# =============================================================================

class ProductCategory(models.Model):
    """
    Grouping for products (Furniture, Electronics, Accessories, etc.).
    Maps to the 'Product Category' filter on the Dashboard.
    """

    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Product Categories"

    def __str__(self):
        return self.name


class UnitOfMeasure(models.Model):
    """
    ADDED MODEL — not in original spec.
    Normalised Unit of Measure table so the frontend UOM dropdown is
    data-driven rather than a free-text field.
    Examples: pcs, kg, litre, box, pallet.
    """

    name = models.CharField(max_length=50, unique=True)
    abbreviation = models.CharField(
        max_length=10,
        unique=True,
        help_text="Short form, e.g. 'pcs', 'kg'.",
    )

    class Meta:
        ordering = ["name"]
        verbose_name = "Unit of Measure"
        verbose_name_plural = "Units of Measure"

    def __str__(self):
        return f"{self.name} ({self.abbreviation})"


class Product(models.Model):
    """
    Individual trackable product / SKU.
    Maps to the Products page table rows.
    """

    name = models.CharField(max_length=255)
    sku = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Stock Keeping Unit, e.g. 'SKU-001'.",
    )
    category = models.ForeignKey(
        ProductCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )
    uom = models.CharField(
        max_length=20,
        default="pcs",
        help_text="Unit of measure (pcs, kg, litre, box, etc.).",
    )
    cost_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        help_text="Per-unit cost price.",
    )
    reorder_minimum = models.PositiveIntegerField(
        default=0,
        help_text="Minimum stock level before a low-stock alert is triggered.",
    )
    image = models.ImageField(
        upload_to="products/",
        null=True,
        blank=True,
        help_text="Product photo / SKU label image.",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"[{self.sku}] {self.name}"


# =============================================================================
# 4. Contacts — Vendors & Customers
# =============================================================================

class Contact(models.Model):
    """
    Represents a vendor (supplier) or customer.
    Maps to Receipt.vendor and DeliveryOrder.contact fields.
    """

    class ContactType(models.TextChoices):
        SUPPLIER = "supplier", "Supplier"
        CUSTOMER = "customer", "Customer"

    name = models.CharField(max_length=255)
    contact_type = models.CharField(
        max_length=20,
        choices=ContactType.choices,
    )
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=20, blank=True, default="")
    address = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.get_contact_type_display()})"


# =============================================================================
# 5. Receipts — Incoming Shipments
# =============================================================================

class Receipt(models.Model):
    """
    An incoming shipment from a vendor.
    Maps to the Receipts list page.
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        WAITING = "waiting", "Waiting"
        READY = "ready", "Ready"
        DONE = "done", "Done"
        CANCELED = "canceled", "Canceled"

    reference = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
    )
    vendor = models.ForeignKey(
        Contact,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="receipts",
        limit_choices_to={"contact_type": "supplier"},
    )
    source_document = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Purchase Order reference, e.g. 'PO-2026-001'.",
    )
    destination = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="incoming_receipts",
    )
    scheduled_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    responsible = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_receipts",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.reference


class ReceiptItem(models.Model):
    """Line item within a Receipt."""

    receipt = models.ForeignKey(
        Receipt,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="receipt_items",
    )
    expected_qty = models.PositiveIntegerField(default=0)
    received_qty = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.product.name} x{self.expected_qty}"


# =============================================================================
# 6. Delivery Orders — Outgoing Shipments
# =============================================================================

class DeliveryOrder(models.Model):
    """
    An outgoing shipment to a customer.
    Maps to the Delivery list page.
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        WAITING = "waiting", "Waiting"
        READY = "ready", "Ready"
        DONE = "done", "Done"
        CANCELED = "canceled", "Canceled"

    reference = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
    )
    contact = models.ForeignKey(
        Contact,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="delivery_orders",
        limit_choices_to={"contact_type": "customer"},
    )
    source_document = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Sales Order reference, e.g. 'SO-2026-001'.",
    )
    source_location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="outgoing_deliveries",
    )
    delivery_address = models.TextField(blank=True, default="Customer Address")
    scheduled_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    responsible = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_deliveries",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.reference


class DeliveryItem(models.Model):
    """Line item within a Delivery Order."""

    delivery_order = models.ForeignKey(
        DeliveryOrder,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="delivery_items",
    )
    ordered_qty = models.PositiveIntegerField(default=0)
    picked_qty = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.product.name} x{self.ordered_qty}"


# =============================================================================
# 7. Stock Adjustments
# =============================================================================

class StockAdjustment(models.Model):
    """
    Manual correction of stock levels after a physical count.
    Maps to the Adjustments page.
    """

    class Reason(models.TextChoices):
        CORRECTION = "correction", "Correction"
        DAMAGED = "damaged", "Damaged"
        LOST = "lost", "Lost"
        THEFT = "theft", "Theft"
        FOUND = "found", "Found"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPLIED = "applied", "Applied"

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="adjustments",
    )
    location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="adjustments",
    )
    system_qty = models.IntegerField(default=0)
    physical_qty = models.IntegerField(default=0)
    reason = models.CharField(
        max_length=20,
        choices=Reason.choices,
        default=Reason.CORRECTION,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def difference(self):
        return self.physical_qty - self.system_qty

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Adjustment: {self.product.name} ({self.difference:+d})"


# =============================================================================
# 8. Stock Moves — Audit Trail
# =============================================================================

class StockMove(models.Model):
    """
    Record of every inventory movement.
    Maps to the Move History page.
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        WAITING = "waiting", "Waiting"
        READY = "ready", "Ready"
        DONE = "done", "Done"
        CANCELED = "canceled", "Canceled"

    reference = models.CharField(
        max_length=50,
        db_index=True,
        help_text="Source document reference (e.g. WH/IN/0001, WH/OUT/0002).",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="stock_moves",
    )
    contact = models.ForeignKey(
        Contact,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_moves",
    )
    from_location = models.CharField(max_length=255, blank=True, default="")
    to_location = models.CharField(max_length=255, blank=True, default="")
    quantity = models.PositiveIntegerField(default=0)
    date = models.DateField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DONE,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.reference} — {self.product.name} x{self.quantity}"


# =============================================================================
# 9. Stock Quant — Real-time On-Hand Inventory
# =============================================================================

class StockQuant(models.Model):
    """
    Tracks the real-time quantity of a product at a specific location.
    One row per (product, location) pair.
    """

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="stock_quants",
    )
    location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        related_name="stock_quants",
    )
    quantity = models.IntegerField(
        default=0,
        help_text="Current on-hand quantity at this location.",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [["product", "location"]]
        ordering = ["product", "location"]
        verbose_name = "Stock Quant"
        verbose_name_plural = "Stock Quants"

    def __str__(self):
        return f"{self.product.name} @ {self.location.name}: {self.quantity}"


# =============================================================================
# 10. Internal Transfers — Move Stock Between Locations
# =============================================================================

class InternalTransfer(models.Model):
    """
    Move stock from one location to another within the warehouse.
    Maps to the 'Internal Transfers' concept on the frontend.
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        READY = "ready", "Ready"
        DONE = "done", "Done"
        CANCELED = "canceled", "Canceled"

    reference = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
    )
    source_location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="outgoing_transfers",
    )
    destination_location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="incoming_transfers",
    )
    scheduled_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    responsible = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_transfers",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.reference


class InternalTransferItem(models.Model):
    """Line item within an Internal Transfer."""

    transfer = models.ForeignKey(
        InternalTransfer,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="transfer_items",
    )
    quantity = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.product.name} x{self.quantity}"


# =============================================================================
# 11. Stock Ledger — Append-Only Audit Trail
# =============================================================================

class StockLedger(models.Model):
    """
    Immutable log of every stock movement.
    Each row records exactly *what* moved, *where* it moved, *how many*, and *why*.
    """

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="ledger_entries",
    )
    from_location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ledger_out",
        help_text="Source location (NULL for vendor / external supply).",
    )
    to_location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ledger_in",
        help_text="Destination location (NULL for customer / external demand).",
    )
    contact = models.ForeignKey(
        Contact,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ledger_entries",
        help_text="Vendor (receipts) or Customer (deliveries) associated with this entry.",
    )
    quantity = models.PositiveIntegerField(default=0)
    operation_ref = models.CharField(
        max_length=50,
        db_index=True,
        help_text="Reference of the source Operation, e.g. 'WH/IN/0001'.",
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        verbose_name = "Stock Ledger Entry"
        verbose_name_plural = "Stock Ledger Entries"

    def __str__(self):
        return (
            f"{self.operation_ref}: {self.product.name} "
            f"x{self.quantity} → {self.to_location}"
        )


# =============================================================================
# 12. Operations — Unified Document Header
# =============================================================================

class Operation(models.Model):
    """
    A single warehouse operation document (Receipt, Delivery, Internal, Adjustment).
    Replaces the need for separate Receipt / DeliveryOrder models for new flows.
    """

    class OperationType(models.TextChoices):
        RECEIPT = "receipt", "Receipt"
        DELIVERY = "delivery", "Delivery"
        INTERNAL = "internal", "Internal"
        ADJUSTMENT = "adjustment", "Adjustment"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        WAITING = "waiting", "Waiting"
        READY = "ready", "Ready"
        DONE = "done", "Done"
        CANCELED = "canceled", "Canceled"

    reference = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Auto-generated reference, e.g. 'WH/IN/0001'.",
    )
    operation_type = models.CharField(
        max_length=20,
        choices=OperationType.choices,
    )
    contact = models.ForeignKey(
        Contact,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="operations",
        help_text="Supplier (receipts) or Customer (deliveries).",
    )
    source_location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="operations_out",
        help_text="Where the goods come from (used for deliveries & transfers).",
    )
    destination_location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="operations_in",
        help_text="Where the goods are going (used for receipts & transfers).",
    )
    scheduled_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    responsible = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_operations",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reference} ({self.get_operation_type_display()})"


class OperationLine(models.Model):
    """Line item within an Operation document."""

    operation = models.ForeignKey(
        Operation,
        on_delete=models.CASCADE,
        related_name="lines",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="operation_lines",
    )
    expected_qty = models.PositiveIntegerField(default=0)
    received_qty = models.PositiveIntegerField(default=0)
    done_qty = models.PositiveIntegerField(
        default=0,
        help_text="Picked / processed quantity (used for deliveries).",
    )

    def __str__(self):
        return f"{self.product.name} — expected: {self.expected_qty}, done: {self.done_qty}"

