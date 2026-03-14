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
router.register(r"stock-quants", views.StockQuantViewSet)
router.register(r"receipts", views.ReceiptViewSet)
router.register(r"receipt-items", views.ReceiptItemViewSet)
router.register(r"delivery-orders", views.DeliveryOrderViewSet)
router.register(r"delivery-items", views.DeliveryItemViewSet)
router.register(r"internal-transfers", views.InternalTransferViewSet)
router.register(r"internal-transfer-items", views.InternalTransferItemViewSet)
router.register(r"adjustments", views.StockAdjustmentViewSet)
router.register(r"stock-moves", views.StockMoveViewSet)
router.register(r"operations", views.OperationViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard/stats/", views.DashboardStatsView.as_view(), name="dashboard-stats"),
    # Auth
    path("auth/signup/", views.SignupView.as_view(), name="auth-signup"),
    path("auth/login/", views.LoginView.as_view(), name="auth-login"),
    path("auth/request-otp/", views.OTPRequestView.as_view(), name="auth-request-otp"),
    path("auth/verify-otp/", views.OTPVerifyView.as_view(), name="auth-verify-otp"),
    path("auth/reset-password/", views.PasswordResetView.as_view(), name="auth-reset-password"),
]
