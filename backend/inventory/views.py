"""ViewSets for the Inventory API."""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Contact,
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
from .serializers import (
    ContactSerializer,
    DeliveryItemSerializer,
    DeliveryOrderSerializer,
    LocationSerializer,
    ProductCategorySerializer,
    ProductSerializer,
    ReceiptItemSerializer,
    ReceiptSerializer,
    StockAdjustmentSerializer,
    StockMoveSerializer,
    UnitOfMeasureSerializer,
    WarehouseSerializer,
)


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.select_related("warehouse").all()
    serializer_class = LocationSerializer


class ProductCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer


class UnitOfMeasureViewSet(viewsets.ModelViewSet):
    queryset = UnitOfMeasure.objects.all()
    serializer_class = UnitOfMeasureSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category", "uom").all()
    serializer_class = ProductSerializer


class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer


class ReceiptViewSet(viewsets.ModelViewSet):
    queryset = Receipt.objects.select_related(
        "vendor", "destination", "responsible"
    ).prefetch_related("items__product").all()
    serializer_class = ReceiptSerializer

    @action(detail=True, methods=["post"])
    def validate(self, request, pk=None):
        """Mark receipt as DONE."""
        receipt = self.get_object()
        receipt.status = "done"
        receipt.save()
        return Response(ReceiptSerializer(receipt).data)


class ReceiptItemViewSet(viewsets.ModelViewSet):
    queryset = ReceiptItem.objects.select_related("product").all()
    serializer_class = ReceiptItemSerializer


class DeliveryOrderViewSet(viewsets.ModelViewSet):
    queryset = DeliveryOrder.objects.select_related(
        "contact", "source_location", "responsible"
    ).prefetch_related("items__product").all()
    serializer_class = DeliveryOrderSerializer

    @action(detail=True, methods=["post"])
    def validate(self, request, pk=None):
        """Mark delivery as DONE."""
        delivery = self.get_object()
        delivery.status = "done"
        delivery.save()
        return Response(DeliveryOrderSerializer(delivery).data)


class DeliveryItemViewSet(viewsets.ModelViewSet):
    queryset = DeliveryItem.objects.select_related("product").all()
    serializer_class = DeliveryItemSerializer


class StockAdjustmentViewSet(viewsets.ModelViewSet):
    queryset = StockAdjustment.objects.select_related("product", "location").all()
    serializer_class = StockAdjustmentSerializer

    @action(detail=True, methods=["post"])
    def apply(self, request, pk=None):
        """Apply the adjustment."""
        adj = self.get_object()
        adj.status = "applied"
        adj.save()
        return Response(StockAdjustmentSerializer(adj).data)


class StockMoveViewSet(viewsets.ModelViewSet):
    queryset = StockMove.objects.select_related("product", "contact").all()
    serializer_class = StockMoveSerializer


# ---------- Dashboard aggregation ----------

from rest_framework.decorators import api_view
from rest_framework.response import Response as DRFResponse
from django.db.models import Sum


@api_view(["GET"])
def dashboard_summary(request):
    """Returns KPI counts for the dashboard."""
    return DRFResponse({
        "total_products": Product.objects.filter(is_active=True).count(),
        "pending_receipts": Receipt.objects.filter(status__in=["draft", "ready", "waiting"]).count(),
        "pending_deliveries": DeliveryOrder.objects.filter(status__in=["draft", "ready", "waiting"]).count(),
        "late_receipts": Receipt.objects.filter(status="ready").count(),
        "late_deliveries": DeliveryOrder.objects.filter(status="ready").count(),
    })
