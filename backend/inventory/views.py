"""ViewSets for the Inventory API — with real stock tracking logic."""

import random
import string

from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import F, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.utils import timezone

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Contact,
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
from .serializers import (
    ContactSerializer,
    DeliveryItemSerializer,
    DeliveryOrderSerializer,
    InternalTransferItemSerializer,
    InternalTransferSerializer,
    LocationSerializer,
    OperationLineSerializer,
    OperationSerializer,
    ProductCategorySerializer,
    ProductSerializer,
    ReceiptItemSerializer,
    ReceiptSerializer,
    StockAdjustmentSerializer,
    StockMoveSerializer,
    StockQuantSerializer,
    UnitOfMeasureSerializer,
    WarehouseSerializer,
)


User = get_user_model()


# =====================================================================
# Authentication Views
# =====================================================================

class SignupView(APIView):
    """POST /api/auth/signup/ — create a new user account."""

    def post(self, request):
        data = request.data
        email = data.get("email", "").strip()
        password = data.get("password", "")
        name = data.get("name", "").strip()
        role = data.get("role", "staff")

        if not email or not password:
            return Response(
                {"detail": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {"email": ["A user with this email already exists."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        parts = name.split(" ", 1) if name else [""]
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=parts[0],
            last_name=parts[1] if len(parts) > 1 else "",
            role=role if role in ("manager", "staff") else "staff",
        )

        return Response(
            {"id": user.id, "email": user.email, "role": user.role},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """POST /api/auth/login/ — authenticate and return JWT tokens."""

    def post(self, request):
        from django.contrib.auth import authenticate

        # Accept either "username" or "email" field from the frontend
        identifier = (
            request.data.get("username", "")
            or request.data.get("email", "")
        ).strip()
        password = request.data.get("password", "")

        # Try authenticating with the identifier as username first
        user = authenticate(request, username=identifier, password=password)
        if user is None:
            # Fall back: look up by email, then authenticate with the real username
            try:
                u = User.objects.get(email=identifier)
                user = authenticate(request, username=u.username, password=password)
            except User.DoesNotExist:
                pass

        if user is None:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
            },
        })


class OTPRequestView(APIView):
    """POST /api/auth/request-otp/ — generate and send a 6-digit OTP."""

    def post(self, request):
        email = request.data.get("email", "").strip()
        if not email:
            return Response(
                {"detail": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal whether the email exists
            return Response({"detail": "If that email exists, an OTP has been sent."})

        otp = "".join(random.choices(string.digits, k=6))
        user.otp_code = otp
        user.otp_created_at = timezone.now()
        user.save(update_fields=["otp_code", "otp_created_at"])

        try:
            send_mail(
                subject="Your password reset OTP",
                message=f"Your OTP code is: {otp}\n\nThis code expires in 10 minutes.",
                from_email=None,
                recipient_list=[email],
            )
        except Exception:
            return Response(
                {"detail": "Failed to send OTP email. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"detail": "If that email exists, an OTP has been sent."})


class OTPVerifyView(APIView):
    """POST /api/auth/verify-otp/ — verify a 6-digit OTP."""

    def post(self, request):
        email = request.data.get("email", "").strip()
        otp = request.data.get("otp", "").strip()

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "No account found with that email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check 10-minute expiry first (more helpful error)
        if user.otp_created_at and (
            timezone.now() - user.otp_created_at
        ).total_seconds() > 600:
            user.otp_code = None
            user.otp_created_at = None
            user.save(update_fields=["otp_code", "otp_created_at"])
            return Response(
                {"detail": "OTP has expired. Please request a new code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.otp_code or user.otp_code != otp:
            return Response(
                {"detail": "Invalid code. Please check and try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({"detail": "OTP verified."})


class PasswordResetView(APIView):
    """POST /api/auth/reset-password/ — reset password after OTP verification."""

    def post(self, request):
        email = request.data.get("email", "").strip()
        otp = request.data.get("otp", "").strip()
        new_password = request.data.get("new_password", "")

        if not new_password or len(new_password) < 6:
            return Response(
                {"detail": "Password must be at least 6 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST
            )

        if not user.otp_code or user.otp_code != otp:
            return Response(
                {"detail": "Invalid code. Please verify your OTP first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check 10-minute expiry
        if user.otp_created_at and (
            timezone.now() - user.otp_created_at
        ).total_seconds() > 600:
            user.otp_code = None
            user.otp_created_at = None
            user.save(update_fields=["otp_code", "otp_created_at"])
            return Response(
                {"detail": "OTP has expired. Please request a new code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.otp_code = None
        user.otp_created_at = None
        user.save(update_fields=["password", "otp_code", "otp_created_at"])

        return Response({"detail": "Password has been reset successfully."})


# =====================================================================
# Helpers
# =====================================================================

def _update_quant(product, location, qty_delta):
    """
    Atomically add *qty_delta* to the StockQuant for (product, location).
    Creates the row if it doesn't exist yet.
    Returns the updated StockQuant instance.
    """
    quant, _created = StockQuant.objects.get_or_create(
        product=product,
        location=location,
        defaults={"quantity": 0},
    )
    quant.quantity = F("quantity") + qty_delta
    quant.save(update_fields=["quantity", "updated_at"])
    quant.refresh_from_db()
    return quant


def _log_stock_move(reference, product, contact, from_loc, to_loc, qty):
    """Create a StockMove audit-trail entry."""
    StockMove.objects.create(
        reference=reference,
        product=product,
        contact=contact,
        from_location=from_loc,
        to_location=to_loc,
        quantity=qty,
        status="done",
    )


# =====================================================================
# Master-Data ViewSets (simple CRUD)
# =====================================================================

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
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer

    def perform_create(self, serializer):
        """Create the product and handle initial stock if provided."""
        initial_stock = serializer.validated_data.pop("initial_stock", 0)
        product = serializer.save()

        if initial_stock > 0:
            # TODO: Create a StockQuant / StockAdjustment record for the
            #       initial inventory. This will be wired up once the
            #       stock-tracking layer is connected.
            pass


class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer


# =====================================================================
# StockQuant ViewSet (read + list only for the frontend)
# =====================================================================

class StockQuantViewSet(viewsets.ModelViewSet):
    queryset = StockQuant.objects.select_related("product", "location").all()
    serializer_class = StockQuantSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        product_id = self.request.query_params.get("product")
        location_id = self.request.query_params.get("location")
        if product_id:
            qs = qs.filter(product_id=product_id)
        if location_id:
            qs = qs.filter(location_id=location_id)
        return qs


# =====================================================================
# Receipts — Incoming Shipments
# =====================================================================

class ReceiptViewSet(viewsets.ModelViewSet):
    queryset = Receipt.objects.select_related(
        "vendor", "destination", "responsible"
    ).prefetch_related("items__product").all()
    serializer_class = ReceiptSerializer

    @action(detail=True, methods=["post"])
    def validate(self, request, pk=None):
        """
        Mark receipt as DONE and:
        1. For each ReceiptItem, add received_qty to StockQuant at destination.
        2. Log a StockMove for each item.
        """
        receipt = self.get_object()

        if receipt.status == "done":
            return Response(
                {"detail": "Receipt already validated."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not receipt.destination:
            return Response(
                {"detail": "Receipt must have a destination location."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        items = receipt.items.select_related("product").all()
        if not items.exists():
            return Response(
                {"detail": "Receipt has no items."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            for item in items:
                # Default received_qty to expected_qty if not set
                qty = item.received_qty if item.received_qty > 0 else item.expected_qty
                if qty <= 0:
                    continue

                # Update received_qty on the item
                if item.received_qty == 0:
                    item.received_qty = item.expected_qty
                    item.save(update_fields=["received_qty"])

                # Add stock at destination
                _update_quant(item.product, receipt.destination, qty)

                # Audit trail
                vendor_name = receipt.vendor.name if receipt.vendor else "Vendor"
                _log_stock_move(
                    reference=receipt.reference,
                    product=item.product,
                    contact=receipt.vendor,
                    from_loc=vendor_name,
                    to_loc=str(receipt.destination),
                    qty=qty,
                )

            receipt.status = "done"
            receipt.save(update_fields=["status", "updated_at"])

        return Response(ReceiptSerializer(receipt).data)


class ReceiptItemViewSet(viewsets.ModelViewSet):
    queryset = ReceiptItem.objects.select_related("product").all()
    serializer_class = ReceiptItemSerializer


# =====================================================================
# Delivery Orders — Outgoing Shipments
# =====================================================================

class DeliveryOrderViewSet(viewsets.ModelViewSet):
    queryset = DeliveryOrder.objects.select_related(
        "contact", "source_location", "responsible"
    ).prefetch_related("items__product").all()
    serializer_class = DeliveryOrderSerializer

    @action(detail=True, methods=["post"])
    def validate(self, request, pk=None):
        """
        Mark delivery as DONE and:
        1. For each DeliveryItem, deduct picked_qty from StockQuant.
        2. Log a StockMove for each item.
        """
        delivery = self.get_object()

        if delivery.status == "done":
            return Response(
                {"detail": "Delivery already validated."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not delivery.source_location:
            return Response(
                {"detail": "Delivery must have a source location."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        items = delivery.items.select_related("product").all()
        if not items.exists():
            return Response(
                {"detail": "Delivery has no items."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            for item in items:
                qty = item.picked_qty if item.picked_qty > 0 else item.ordered_qty
                if qty <= 0:
                    continue

                # Default picked_qty to ordered_qty if not set
                if item.picked_qty == 0:
                    item.picked_qty = item.ordered_qty
                    item.save(update_fields=["picked_qty"])

                # Deduct stock from source location
                _update_quant(item.product, delivery.source_location, -qty)

                # Audit trail
                contact_name = delivery.contact.name if delivery.contact else "Customer"
                _log_stock_move(
                    reference=delivery.reference,
                    product=item.product,
                    contact=delivery.contact,
                    from_loc=str(delivery.source_location),
                    to_loc=contact_name,
                    qty=qty,
                )

            delivery.status = "done"
            delivery.save(update_fields=["status", "updated_at"])

        return Response(DeliveryOrderSerializer(delivery).data)


class DeliveryItemViewSet(viewsets.ModelViewSet):
    queryset = DeliveryItem.objects.select_related("product").all()
    serializer_class = DeliveryItemSerializer


# =====================================================================
# Internal Transfers
# =====================================================================

class InternalTransferViewSet(viewsets.ModelViewSet):
    queryset = InternalTransfer.objects.select_related(
        "source_location", "destination_location", "responsible"
    ).prefetch_related("items__product").all()
    serializer_class = InternalTransferSerializer

    @action(detail=True, methods=["post"])
    def validate(self, request, pk=None):
        """
        Mark transfer as DONE and:
        1. Deduct from source location StockQuant.
        2. Add to destination location StockQuant.
        3. Log a StockMove for each item.
        """
        transfer = self.get_object()

        if transfer.status == "done":
            return Response(
                {"detail": "Transfer already validated."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not transfer.source_location or not transfer.destination_location:
            return Response(
                {"detail": "Transfer must have both source and destination locations."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        items = transfer.items.select_related("product").all()
        if not items.exists():
            return Response(
                {"detail": "Transfer has no items."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            for item in items:
                if item.quantity <= 0:
                    continue

                # Deduct from source
                _update_quant(item.product, transfer.source_location, -item.quantity)

                # Add to destination
                _update_quant(item.product, transfer.destination_location, item.quantity)

                # Audit trail
                _log_stock_move(
                    reference=transfer.reference,
                    product=item.product,
                    contact=None,
                    from_loc=str(transfer.source_location),
                    to_loc=str(transfer.destination_location),
                    qty=item.quantity,
                )

            transfer.status = "done"
            transfer.save(update_fields=["status", "updated_at"])

        return Response(InternalTransferSerializer(transfer).data)


class InternalTransferItemViewSet(viewsets.ModelViewSet):
    queryset = InternalTransferItem.objects.select_related("product").all()
    serializer_class = InternalTransferItemSerializer


# =====================================================================
# Stock Adjustments
# =====================================================================

class StockAdjustmentViewSet(viewsets.ModelViewSet):
    queryset = StockAdjustment.objects.select_related("product", "location").all()
    serializer_class = StockAdjustmentSerializer

    @action(detail=True, methods=["post"])
    def apply(self, request, pk=None):
        """
        Apply the adjustment:
        1. Calculate difference (physical_qty - system_qty).
        2. Update StockQuant by the difference.
        3. Log a StockMove for the adjustment.
        """
        adj = self.get_object()

        if adj.status == "applied":
            return Response(
                {"detail": "Adjustment already applied."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not adj.location:
            return Response(
                {"detail": "Adjustment must have a location."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        difference = adj.physical_qty - adj.system_qty

        with transaction.atomic():
            # Update stock by the difference
            _update_quant(adj.product, adj.location, difference)

            # Audit trail
            if difference >= 0:
                from_loc = "Adjustment (Found)"
                to_loc = str(adj.location)
            else:
                from_loc = str(adj.location)
                to_loc = f"Adjustment ({adj.get_reason_display()})"

            _log_stock_move(
                reference=f"ADJ-{adj.id}",
                product=adj.product,
                contact=None,
                from_loc=from_loc,
                to_loc=to_loc,
                qty=abs(difference),
            )

            adj.status = "applied"
            adj.save(update_fields=["status", "updated_at"])

        return Response(StockAdjustmentSerializer(adj).data)


# =====================================================================
# Operations — Unified Document Handling
# =====================================================================

class _InsufficientStockError(Exception):
    """Raised inside ``transaction.atomic()`` to roll back on insufficient stock."""

    def __init__(self, product_name):
        self.product_name = product_name
        super().__init__(product_name)


class OperationViewSet(viewsets.ModelViewSet):
    queryset = Operation.objects.select_related(
        "contact", "source_location", "destination_location", "responsible"
    ).prefetch_related("lines__product").all()
    serializer_class = OperationSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        op_type = self.request.query_params.get("operation_type")
        if op_type:
            qs = qs.filter(operation_type=op_type)
        return qs

    # -----------------------------------------------------------------
    # POST /operations/{id}/validate_operation/
    # -----------------------------------------------------------------
    @action(detail=True, methods=["post"], url_path="validate_operation")
    def validate_operation(self, request, pk=None):
        """
        Validate an Operation and apply stock effects.

        Delivery:  check stock → deduct StockQuant → write StockLedger → Done.
        Receipt:   add to StockQuant → write StockLedger → Done.
        """
        operation = self.get_object()

        if operation.status == "done":
            return Response(
                {"detail": "Operation already validated."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        lines = operation.lines.select_related("product").all()
        if not lines.exists():
            return Response(
                {"detail": "Operation has no lines."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        handler = {
            "delivery": self._validate_delivery,
            "receipt": self._validate_receipt,
            "internal": self._validate_internal,
            "adjustment": self._validate_adjustment,
        }.get(operation.operation_type)

        if handler is None:
            return Response(
                {"detail": f"Validation not supported for type '{operation.operation_type}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            return handler(operation, lines)
        except _InsufficientStockError as exc:
            if operation.operation_type == "internal":
                msg = f"Insufficient stock in source location for {exc.product_name}"
            else:
                msg = f"Insufficient stock for {exc.product_name}"
            return Response(
                {"detail": msg},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # ---------- Delivery validation ----------

    def _validate_delivery(self, operation, lines):
        if not operation.source_location:
            return Response(
                {"detail": "Delivery must have a source location."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            for line in lines:
                qty = line.done_qty if line.done_qty > 0 else line.expected_qty
                if qty <= 0:
                    continue

                # ---- Crucial stock check ----
                quant = StockQuant.objects.select_for_update().filter(
                    product=line.product,
                    location=operation.source_location,
                ).first()

                available = quant.quantity if quant else 0
                if available < qty:
                    # Abort the entire transaction
                    raise _InsufficientStockError(line.product.name)

                # Default done_qty to expected_qty when not explicitly set
                if line.done_qty == 0:
                    line.done_qty = line.expected_qty
                    line.save(update_fields=["done_qty"])

                # Deduct stock
                _update_quant(line.product, operation.source_location, -qty)

                # Ledger entry (from source → Customer / NULL)
                StockLedger.objects.create(
                    product=line.product,
                    from_location=operation.source_location,
                    to_location=None,  # outgoing to customer
                    contact=operation.contact,
                    quantity=qty,
                    operation_ref=operation.reference,
                )

                # StockMove audit trail
                contact_name = operation.contact.name if operation.contact else "Customer"
                _log_stock_move(
                    reference=operation.reference,
                    product=line.product,
                    contact=operation.contact,
                    from_loc=str(operation.source_location),
                    to_loc=contact_name,
                    qty=qty,
                )

            operation.status = "done"
            operation.save(update_fields=["status", "updated_at"])

        return Response(OperationSerializer(operation).data)

    # ---------- Receipt validation ----------

    def _validate_receipt(self, operation, lines):
        if not operation.destination_location:
            return Response(
                {"detail": "Receipt must have a destination location."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            for line in lines:
                qty = line.received_qty if line.received_qty > 0 else line.expected_qty
                if qty <= 0:
                    continue

                if line.received_qty == 0:
                    line.received_qty = line.expected_qty
                    line.save(update_fields=["received_qty"])

                # Add stock at destination
                _update_quant(line.product, operation.destination_location, qty)

                # Ledger entry (Vendor / NULL → destination)
                StockLedger.objects.create(
                    product=line.product,
                    from_location=None,  # incoming from vendor
                    to_location=operation.destination_location,
                    contact=operation.contact,
                    quantity=qty,
                    operation_ref=operation.reference,
                )

                # StockMove audit trail
                vendor_name = operation.contact.name if operation.contact else "Vendor"
                _log_stock_move(
                    reference=operation.reference,
                    product=line.product,
                    contact=operation.contact,
                    from_loc=vendor_name,
                    to_loc=str(operation.destination_location),
                    qty=qty,
                )

            operation.status = "done"
            operation.save(update_fields=["status", "updated_at"])

        return Response(OperationSerializer(operation).data)

    # ---------- Internal Transfer validation ----------

    def _validate_internal(self, operation, lines):
        if not operation.source_location:
            return Response(
                {"detail": "Internal transfer must have a source location."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not operation.destination_location:
            return Response(
                {"detail": "Internal transfer must have a destination location."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            for line in lines:
                qty = line.done_qty if line.done_qty > 0 else line.expected_qty
                if qty <= 0:
                    continue

                # ---- Stock check at source ----
                quant = StockQuant.objects.select_for_update().filter(
                    product=line.product,
                    location=operation.source_location,
                ).first()

                available = quant.quantity if quant else 0
                if available < qty:
                    raise _InsufficientStockError(line.product.name)

                # Default done_qty to expected_qty when not explicitly set
                if line.done_qty == 0:
                    line.done_qty = line.expected_qty
                    line.save(update_fields=["done_qty"])

                # Deduct from source
                _update_quant(line.product, operation.source_location, -qty)

                # Add to destination
                _update_quant(line.product, operation.destination_location, qty)

                # Ledger entry (source → destination)
                StockLedger.objects.create(
                    product=line.product,
                    from_location=operation.source_location,
                    to_location=operation.destination_location,
                    contact=None,
                    quantity=qty,
                    operation_ref=operation.reference,
                )

                # StockMove audit trail
                _log_stock_move(
                    reference=operation.reference,
                    product=line.product,
                    contact=None,
                    from_loc=str(operation.source_location),
                    to_loc=str(operation.destination_location),
                    qty=qty,
                )

            operation.status = "done"
            operation.save(update_fields=["status", "updated_at"])

        return Response(OperationSerializer(operation).data)

    # ---------- Adjustment validation ----------

    def _validate_adjustment(self, operation, lines):
        if not operation.source_location:
            return Response(
                {"detail": "Adjustment must have a location (set as source_location)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            for line in lines:
                # received_qty = physical count on the shelf
                physical_count = line.received_qty
                if physical_count < 0:
                    continue

                # Lock the current StockQuant row
                quant = StockQuant.objects.select_for_update().filter(
                    product=line.product,
                    location=operation.source_location,
                ).first()

                current_qty = quant.quantity if quant else 0
                difference = physical_count - current_qty

                if difference == 0:
                    continue

                # Set stock to the physical count
                if quant:
                    quant.quantity = physical_count
                    quant.save(update_fields=["quantity", "updated_at"])
                else:
                    StockQuant.objects.create(
                        product=line.product,
                        location=operation.source_location,
                        quantity=physical_count,
                    )

                # Update done_qty to record the absolute difference applied
                line.done_qty = abs(difference)
                line.save(update_fields=["done_qty"])

                # Ledger entry
                if difference > 0:
                    # Found stock: virtual adjustment → actual location
                    StockLedger.objects.create(
                        product=line.product,
                        from_location=None,
                        to_location=operation.source_location,
                        contact=None,
                        quantity=difference,
                        operation_ref=operation.reference,
                    )
                    _log_stock_move(
                        reference=operation.reference,
                        product=line.product,
                        contact=None,
                        from_loc="Inventory Adjustment",
                        to_loc=str(operation.source_location),
                        qty=difference,
                    )
                else:
                    # Lost / damaged stock: actual location → virtual loss
                    abs_diff = abs(difference)
                    StockLedger.objects.create(
                        product=line.product,
                        from_location=operation.source_location,
                        to_location=None,
                        contact=None,
                        quantity=abs_diff,
                        operation_ref=operation.reference,
                    )
                    _log_stock_move(
                        reference=operation.reference,
                        product=line.product,
                        contact=None,
                        from_loc=str(operation.source_location),
                        to_loc="Inventory Adjustment / Loss",
                        qty=abs_diff,
                    )

            operation.status = "done"
            operation.save(update_fields=["status", "updated_at"])

        return Response(OperationSerializer(operation).data)

    # -----------------------------------------------------------------
    # PATCH /operations/{id}/update_picking_status/
    # -----------------------------------------------------------------
    @action(detail=True, methods=["patch"], url_path="update_picking_status")
    def update_picking_status(self, request, pk=None):
        """
        Lightweight endpoint for the frontend stepper (Pick → Pack → Validate).

        Accepts:
          {
            "status": "ready",              // optional — advance header status
            "lines": [                       // optional — update done_qty per line
              {"id": 1, "done_qty": 5},
              {"id": 3, "done_qty": 10}
            ]
          }

        Allowed status transitions: draft → waiting, waiting → ready.
        This does NOT trigger stock deduction — that only happens on
        ``validate_operation``.
        """
        operation = self.get_object()

        if operation.status == "done":
            return Response(
                {"detail": "Cannot modify a completed operation."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        lines_data = request.data.get("lines", [])
        new_status = request.data.get("status")

        # Validate status transition
        allowed_transitions = {
            "draft": "waiting",
            "waiting": "ready",
        }
        if new_status:
            expected_next = allowed_transitions.get(operation.status)
            if expected_next != new_status:
                return Response(
                    {
                        "detail": (
                            f"Cannot transition from '{operation.status}' to "
                            f"'{new_status}'. Expected '{expected_next}'."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        with transaction.atomic():
            # Update individual line done_qty values
            if lines_data:
                line_ids = {l["id"]: l["done_qty"] for l in lines_data if "id" in l and "done_qty" in l}
                op_lines = operation.lines.filter(id__in=line_ids.keys())
                for line in op_lines:
                    line.done_qty = line_ids[line.id]
                    line.save(update_fields=["done_qty"])

            # Advance status
            if new_status:
                operation.status = new_status
                operation.save(update_fields=["status", "updated_at"])

        return Response(OperationSerializer(operation).data)


# =====================================================================
# Stock Moves — Read-only audit trail
# =====================================================================

class StockMoveViewSet(viewsets.ModelViewSet):
    queryset = StockMove.objects.select_related("product", "contact").all()
    serializer_class = StockMoveSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        contact_id = self.request.query_params.get("contact")
        if contact_id:
            qs = qs.filter(contact_id=contact_id)
        return qs


# =====================================================================
# Dashboard Aggregation
# =====================================================================

class DashboardStatsView(APIView):
    """
    GET /api/dashboard/stats/

    Returns five KPI integers with optional filtering via query params:
      - warehouse_id  : filter StockQuant by location__warehouse_id
      - location_id   : filter StockQuant by location_id
      - category_id   : filter Product-level queries by category_id
    """

    def get(self, request):
        warehouse_id = request.query_params.get("warehouse_id")
        location_id = request.query_params.get("location_id")
        category_id = request.query_params.get("category_id")
        contact_id = request.query_params.get("contact_id")

        # ---- KPI 1: Total Products in Stock ----
        quant_filters = Q()
        if location_id:
            quant_filters &= Q(location_id=location_id)
        elif warehouse_id:
            quant_filters &= Q(location__warehouse_id=warehouse_id)

        total_in_stock = StockQuant.objects.filter(quant_filters).aggregate(
            total=Coalesce(Sum("quantity"), Value(0))
        )["total"]

        # ---- KPI 2: Low Stock Items ----
        product_qs = Product.objects.filter(is_active=True)
        if category_id:
            product_qs = product_qs.filter(category_id=category_id)

        # Annotate each product with its summed StockQuant quantity
        # (respecting warehouse / location filters on the quant side)
        quant_sum_filters = Q()
        if location_id:
            quant_sum_filters &= Q(stock_quants__location_id=location_id)
        elif warehouse_id:
            quant_sum_filters &= Q(stock_quants__location__warehouse_id=warehouse_id)

        low_stock_count = (
            product_qs
            .annotate(
                total_qty=Coalesce(
                    Sum("stock_quants__quantity", filter=quant_sum_filters),
                    Value(0),
                )
            )
            .filter(total_qty__lte=F("reorder_minimum"))
            .count()
        )

        # ---- Shared exclusion for Operations KPIs ----
        pending_statuses = Q(status__in=["draft", "waiting", "ready"])

        # ---- KPI 3: Pending Receipts ----
        receipt_filters = Q(pending_statuses, operation_type="receipt")
        if contact_id:
            receipt_filters &= Q(contact_id=contact_id)
        pending_receipts = Operation.objects.filter(receipt_filters).count()

        # ---- KPI 4: Pending Deliveries ----
        delivery_filters = Q(pending_statuses, operation_type="delivery")
        if contact_id:
            delivery_filters &= Q(contact_id=contact_id)
        pending_deliveries = Operation.objects.filter(delivery_filters).count()

        # ---- KPI 5: Scheduled Internal Transfers ----
        scheduled_transfers = Operation.objects.filter(
            pending_statuses, operation_type="internal"
        ).count()

        return Response({
            "total_in_stock": total_in_stock,
            "low_stock_items": low_stock_count,
            "pending_receipts": pending_receipts,
            "pending_deliveries": pending_deliveries,
            "scheduled_transfers": scheduled_transfers,
        })
