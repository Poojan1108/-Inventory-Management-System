"""Serializers for the Inventory API."""

from rest_framework import serializers

from .models import (
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


# ---------- Auth ----------

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "username", "email", "first_name", "last_name"]


# ---------- Infrastructure ----------

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = "__all__"


class LocationSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    warehouse_code = serializers.CharField(source="warehouse.code", read_only=True)

    class Meta:
        model = Location
        fields = "__all__"


# ---------- Products ----------

class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = "__all__"


class UnitOfMeasureSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitOfMeasure
        fields = "__all__"


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True, default="")
    uom_abbr = serializers.CharField(source="uom.abbreviation", read_only=True, default="pcs")

    class Meta:
        model = Product
        fields = "__all__"


# ---------- Contacts ----------

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = "__all__"


# ---------- Receipts ----------

class ReceiptItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)

    class Meta:
        model = ReceiptItem
        fields = "__all__"


class ReceiptSerializer(serializers.ModelSerializer):
    items = ReceiptItemSerializer(many=True, read_only=True)
    vendor_name = serializers.CharField(source="vendor.name", read_only=True, default="")
    destination_name = serializers.SerializerMethodField()

    class Meta:
        model = Receipt
        fields = "__all__"

    def get_destination_name(self, obj):
        if obj.destination:
            return str(obj.destination)
        return ""


# ---------- Delivery Orders ----------

class DeliveryItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)

    class Meta:
        model = DeliveryItem
        fields = "__all__"


class DeliveryOrderSerializer(serializers.ModelSerializer):
    items = DeliveryItemSerializer(many=True, read_only=True)
    contact_name = serializers.CharField(source="contact.name", read_only=True, default="")
    source_location_name = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryOrder
        fields = "__all__"

    def get_source_location_name(self, obj):
        if obj.source_location:
            return str(obj.source_location)
        return ""


# ---------- Stock Adjustments ----------

class StockAdjustmentSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_code = serializers.CharField(source="product.sku", read_only=True)
    location_name = serializers.SerializerMethodField()
    difference = serializers.IntegerField(read_only=True)

    class Meta:
        model = StockAdjustment
        fields = "__all__"

    def get_location_name(self, obj):
        if obj.location:
            return str(obj.location)
        return ""


# ---------- Stock Moves ----------

class StockMoveSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    contact_name = serializers.CharField(source="contact.name", read_only=True, default="")

    class Meta:
        model = StockMove
        fields = "__all__"
