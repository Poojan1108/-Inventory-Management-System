"""Serializers for the Inventory API."""

from rest_framework import serializers

from .models import (
    Contact,
    CustomUser,
    DeliveryItem,
    DeliveryOrder,
    InternalTransfer,
    InternalTransferItem,
    Location,
    Operation,
    OperationLine,
    Product,
    ProductCategory,
    Receipt,
    ReceiptItem,
    StockAdjustment,
    StockLedger,
    StockMove,
    StockQuant,
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
    category_name = serializers.CharField(
        source="category.name", read_only=True, default=""
    )
    initial_stock = serializers.IntegerField(
        write_only=True, required=False, default=0,
        help_text="Starting inventory quantity (used on creation only).",
    )

    class Meta:
        model = Product
        fields = "__all__"

    def validate_sku(self, value):
        """Return a clear error when a duplicate SKU is submitted."""
        qs = Product.objects.filter(sku=value)
        if self.instance:  # updating — exclude current record
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                f"A product with SKU '{value}' already exists."
            )
        return value


# ---------- Contacts ----------

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = "__all__"


# ---------- Stock Quants ----------

class StockQuantSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    location_name = serializers.SerializerMethodField()

    class Meta:
        model = StockQuant
        fields = "__all__"

    def get_location_name(self, obj):
        if obj.location:
            return str(obj.location)
        return ""


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


# ---------- Internal Transfers ----------

class InternalTransferItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)

    class Meta:
        model = InternalTransferItem
        fields = "__all__"


class InternalTransferSerializer(serializers.ModelSerializer):
    items = InternalTransferItemSerializer(many=True, read_only=True)
    source_location_name = serializers.SerializerMethodField()
    destination_location_name = serializers.SerializerMethodField()

    class Meta:
        model = InternalTransfer
        fields = "__all__"

    def get_source_location_name(self, obj):
        if obj.source_location:
            return str(obj.source_location)
        return ""

    def get_destination_location_name(self, obj):
        if obj.destination_location:
            return str(obj.destination_location)
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


# ---------- Stock Ledger ----------

class StockLedgerSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    contact_name = serializers.CharField(source="contact.name", read_only=True, default="")
    from_location_name = serializers.SerializerMethodField()
    to_location_name = serializers.SerializerMethodField()

    class Meta:
        model = StockLedger
        fields = "__all__"

    def get_from_location_name(self, obj):
        return str(obj.from_location) if obj.from_location else "Vendor / External"

    def get_to_location_name(self, obj):
        return str(obj.to_location) if obj.to_location else "Customer / External"


# ---------- Operations ----------

class OperationLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)

    class Meta:
        model = OperationLine
        fields = [
            "id", "operation", "product", "product_name",
            "product_sku", "expected_qty", "received_qty", "done_qty",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {"operation": {"required": False}}


class OperationSerializer(serializers.ModelSerializer):
    """
    Nested writable serializer — accepts ``lines`` in the same payload
    so the frontend can create / update the header and items in one call.
    """

    lines = OperationLineSerializer(many=True, required=False)
    contact_name = serializers.CharField(
        source="contact.name", read_only=True, default=""
    )
    destination_location_name = serializers.SerializerMethodField()
    source_location_name = serializers.SerializerMethodField()

    class Meta:
        model = Operation
        fields = "__all__"

    def get_destination_location_name(self, obj):
        return str(obj.destination_location) if obj.destination_location else ""

    def get_source_location_name(self, obj):
        return str(obj.source_location) if obj.source_location else ""

    # ----- nested create / update -----

    def create(self, validated_data):
        lines_data = validated_data.pop("lines", [])
        operation = Operation.objects.create(**validated_data)
        for line in lines_data:
            OperationLine.objects.create(operation=operation, **line)
        return operation

    def update(self, instance, validated_data):
        lines_data = validated_data.pop("lines", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if lines_data is not None:
            # Replace all lines with the new set
            instance.lines.all().delete()
            for line in lines_data:
                OperationLine.objects.create(operation=instance, **line)

        return instance
