"""URL configuration for the Inventory API."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"warehouses", views.WarehouseViewSet)
router.register(r"locations", views.LocationViewSet)
router.register(r"categories", views.ProductCategoryViewSet)
router.register(r"uom", views.UnitOfMeasureViewSet)
router.register(r"products", views.ProductViewSet)
router.register(r"contacts", views.ContactViewSet)
router.register(r"receipts", views.ReceiptViewSet)
router.register(r"receipt-items", views.ReceiptItemViewSet)
router.register(r"delivery-orders", views.DeliveryOrderViewSet)
router.register(r"delivery-items", views.DeliveryItemViewSet)
router.register(r"adjustments", views.StockAdjustmentViewSet)
router.register(r"stock-moves", views.StockMoveViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard/", views.dashboard_summary, name="dashboard-summary"),
]
