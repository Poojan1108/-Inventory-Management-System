from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from django.urls import reverse
from .models import Warehouse, Location, ProductCategory, Product, Operation, OperationLine, StockQuant, StockLedger

User = get_user_model()

class InventoryLifecycleTest(TestCase):
    def setUp(self):
        # 1. Setup Auth & Client
        self.user = User.objects.create_user(username='testuser', email='test@warehouse.com', password='securepassword123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # 2. Setup Master Data (The World)
        self.warehouse = Warehouse.objects.create(name="Main Warehouse", code="WH1")
        self.loc_main = Location.objects.create(name="Main Store", short_code="MAIN", warehouse=self.warehouse, location_type="internal")
        self.loc_prod = Location.objects.create(name="Production Rack", short_code="PROD", warehouse=self.warehouse, location_type="internal")

        self.category = ProductCategory.objects.create(name="Raw Materials")
        self.product = Product.objects.create(name="Steel", sku="STL-001", category=self.category, uom="kg", reorder_minimum=20)

    def test_end_to_end_product_lifecycle(self):
        """
        Traces a single product through Receipt -> Transfer -> Delivery -> Adjustment.
        Asserts exact stock quantities and ledger entries at every step.
        """

        # ==========================================
        # PHASE 1: RECEIPT (+100 to Main Store)
        # ==========================================
        receipt = Operation.objects.create(
            reference="WH/IN/001", operation_type="receipt",
            destination_location=self.loc_main, status="ready"
        )
        OperationLine.objects.create(operation=receipt, product=self.product, received_qty=100)

        # Trigger validation API
        url_receipt = f'/api/operations/{receipt.id}/validate_operation/'
        self.client.post(url_receipt)

        # Assertions
        quant_main = StockQuant.objects.get(product=self.product, location=self.loc_main)
        self.assertEqual(quant_main.quantity, 100, "Receipt failed to add 100 stock.")
        self.assertEqual(StockLedger.objects.count(), 1, "Ledger entry missing for Receipt.")

        # ==========================================
        # PHASE 2: INTERNAL TRANSFER (Main Store -> Production Rack)
        # ==========================================
        transfer = Operation.objects.create(
            reference="WH/INT/001", operation_type="internal",
            source_location=self.loc_main,
            destination_location=self.loc_prod,
            status="ready"
        )
        # Internal transfer uses done_qty (falls back to expected_qty)
        OperationLine.objects.create(operation=transfer, product=self.product, expected_qty=100)

        url_transfer = f'/api/operations/{transfer.id}/validate_operation/'
        self.client.post(url_transfer)

        # Assertions
        quant_main.refresh_from_db()
        quant_prod = StockQuant.objects.get(product=self.product, location=self.loc_prod)
        self.assertEqual(quant_main.quantity, 0, "Transfer failed to empty Main Store.")
        self.assertEqual(quant_prod.quantity, 100, "Transfer failed to fill Production Rack.")

        # ==========================================
        # PHASE 3: DELIVERY (-20 from Production Rack)
        # ==========================================
        delivery = Operation.objects.create(
            reference="WH/OUT/001", operation_type="delivery",
            source_location=self.loc_prod, status="ready"
        )
        # Delivery uses done_qty (falls back to expected_qty)
        OperationLine.objects.create(operation=delivery, product=self.product, expected_qty=20)

        url_delivery = f'/api/operations/{delivery.id}/validate_operation/'
        self.client.post(url_delivery)

        # Assertions
        quant_prod.refresh_from_db()
        self.assertEqual(quant_prod.quantity, 80, "Delivery failed to deduct 20 stock.")

        # ==========================================
        # PHASE 4: ADJUSTMENT (Physical count is 77, loss of 3)
        # ==========================================
        adjustment = Operation.objects.create(
            reference="WH/ADJ/001", operation_type="adjustment",
            source_location=self.loc_prod, status="ready"
        )
        # 77 is the PHYSICAL COUNT entered by the user (stored in received_qty)
        OperationLine.objects.create(operation=adjustment, product=self.product, received_qty=77)

        url_adjustment = f'/api/operations/{adjustment.id}/validate_operation/'
        self.client.post(url_adjustment)

        # Assertions
        quant_prod.refresh_from_db()
        self.assertEqual(quant_prod.quantity, 77, "Adjustment failed to set stock to exact physical count.")

        # Verify Ledger contains exactly 4 entries representing the full history
        self.assertEqual(StockLedger.objects.count(), 4, "Ledger history is incomplete.")

        print("\nE2E Lifecycle Test Passed: 0 -> +100 -> Transfer -> -20 -> Adjust to 77. Math is perfect.")
