from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import (
    Contact,
    CustomUser,
    DeliveryItem,
    DeliveryOrder,
    InternalTransfer,
    InternalTransferItem,
    Location,
    Product,
    ProductCategory,
    Receipt,
    ReceiptItem,
    StockAdjustment,
    StockMove,
    StockQuant,
    UnitOfMeasure,
    Warehouse,
)


# ---------- Phase 1 ----------

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "first_name", "last_name", "is_staff")
    fieldsets = UserAdmin.fieldsets + (
        ("OTP Settings", {"fields": ("otp_code", "otp_created_at")}),
    )


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "is_active", "created_at")
    search_fields = ("name", "code")
    list_filter = ("is_active",)


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("short_code", "name", "warehouse", "location_type", "status")
    search_fields = ("name", "short_code")
    list_filter = ("location_type", "status", "warehouse")


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)


@admin.register(UnitOfMeasure)
class UnitOfMeasureAdmin(admin.ModelAdmin):
    list_display = ("name", "abbreviation")
    search_fields = ("name", "abbreviation")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("sku", "name", "category", "cost_price", "reorder_minimum", "is_active")
    search_fields = ("name", "sku")
    list_filter = ("category", "is_active")


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("name", "contact_type", "email", "phone", "is_active")
    search_fields = ("name", "email")
    list_filter = ("contact_type", "is_active")


# ---------- Stock Quants ----------

@admin.register(StockQuant)
class StockQuantAdmin(admin.ModelAdmin):
    list_display = ("product", "location", "quantity", "updated_at")
    list_filter = ("location",)
    search_fields = ("product__name", "product__sku")


# ---------- Receipts ----------

class ReceiptItemInline(admin.TabularInline):
    model = ReceiptItem
    extra = 1


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ("reference", "vendor", "status", "scheduled_date")
    list_filter = ("status",)
    search_fields = ("reference",)
    inlines = [ReceiptItemInline]


# ---------- Delivery Orders ----------

class DeliveryItemInline(admin.TabularInline):
    model = DeliveryItem
    extra = 1


@admin.register(DeliveryOrder)
class DeliveryOrderAdmin(admin.ModelAdmin):
    list_display = ("reference", "contact", "status", "scheduled_date")
    list_filter = ("status",)
    search_fields = ("reference",)
    inlines = [DeliveryItemInline]


# ---------- Internal Transfers ----------

class InternalTransferItemInline(admin.TabularInline):
    model = InternalTransferItem
    extra = 1


@admin.register(InternalTransfer)
class InternalTransferAdmin(admin.ModelAdmin):
    list_display = ("reference", "source_location", "destination_location", "status", "scheduled_date")
    list_filter = ("status",)
    search_fields = ("reference",)
    inlines = [InternalTransferItemInline]


# ---------- Stock Adjustments ----------

@admin.register(StockAdjustment)
class StockAdjustmentAdmin(admin.ModelAdmin):
    list_display = ("product", "location", "system_qty", "physical_qty", "reason", "status")
    list_filter = ("status", "reason")


# ---------- Stock Moves ----------

@admin.register(StockMove)
class StockMoveAdmin(admin.ModelAdmin):
    list_display = ("reference", "product", "from_location", "to_location", "quantity", "status", "date")
    list_filter = ("status",)
    search_fields = ("reference",)
