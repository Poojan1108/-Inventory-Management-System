> [!IMPORTANT]
> **Frontend Preview Only:** This deployment is a static demonstration of the UI/UX. 
> There is currently **no backend functionality** integrated, so features like form submissions or data persistence are inactive.
# Core Inventory Management System

A centralized, real-time, and double-entry Inventory Management System (IMS) designed to digitize and optimize supply chain operations, replacing inefficient manual registers, spreadsheets, and paper-based tracking.



## 📌 Problem Statement Addressed

The traditional reliance on manual methods for tracking inventory leads to significant operational challenges:

* **Data Inaccuracy & Errors:** High risk of human error during data entry and calculations.
* **Lack of Real-Time Visibility:** Difficulty in obtaining up-to-the-minute stock levels across locations.
* **Discrepancies & Losses:** Challenges in reconciling system stock with physical counts, leading to shrink.
* **Inefficient Reporting:** Generating necessary reports is time-consuming and prone to delays.
* **Siloed Operations:** Manual systems make coordinating receipts, deliveries, and transfers cumbersome.

**Core Inventory** addresses these problems by providing a single, platform-based solution that implements a mandatory **Stock Ledger** for every movement, ensuring full traceability and accurate, real-time stock management.

## ✨ Core Features

This application implements the robust functional requirements specified for a modernized IMS:

* **Dashboard & Real-Time Reporting:** A central overview featuring key performance indicators (KPIs) calculated via a robust `DashboardStatsView`:
    * Total Products in Stock
    * Low Stock / Out of Stock Items (triggered by reorder rules)
    * Pending Receipts, Deliveries, and Transfers
    * Dynamic Filters for immediate data insights.
* **Robust Authentication & Onboarding:** Secure JWT-based login and signup. It supports mandatory multi-step **OTP-based password reset** and provides role-based navigation for **Inventory Managers** and **Warehouse Staff**.
* **Hierarchical Location & Warehouse Support:** Manage multi-warehouse operations with granular tracking at the internal location level (e.g., Racks, Bins).
* **Advanced Operations Engine:** Digital workflows for all inventory movements:
    * **Incoming Goods (Receipts):** Input and validate stock incoming from vendors.
    * **Outgoing Goods (Delivery Orders):** Manage customer shipments with full Pick, Pack, and Validate logic.
    * **Internal Transfers:** Seamlessly move stock between warehouses or specific racks.
    * **Stock Adjustments:** Easily reconcile system quantities with physical counts.
* **Automated Audit Trail (Move History):** Every single action (receipt, delivery, transfer, adjustment) is automatically logged in the **Stock Ledger** as defined in the `StockLedger` model, providing a complete and immutable audit trail.
* **Product Management:** Maintain a centralized product catalog with unique SKUs, Categories, and Units of Measure (UoM).

## 🛠️ Technology Stack

* **Frontend:** React, TypeScript, Next.js, Tailwind CSS
* **Backend:** Python, Django, Django REST Framework
* **Database:** PostgreSQL (Recommended for production), SQLite (for development)
* **Authentication:** JSON Web Tokens (JWT)

## 🚀 Getting Started

Follow these steps to set up the project locally for development and testing.

### Prerequisites

* Node.js (v18+) and npm/yarn
* Python (v3.10+)
* Poetry (Recommended for Python dependency management) or pip
* PostgreSQL (optional for development, required for production)

### 1. Backend Setup (Django)

1.  **Clone the repository:**
    ```bash
    git clone [your-repository-url]
    cd core-inventory/backend
    ```

2.  **Install dependencies:**
    ```bash
    # Using Poetry (recommended)
    poetry install
    # OR using pip
    pip install -r requirements.txt
    ```

3.  **Configure environment variables:**
    Create a `.env` file in the `backend/` directory (refer to `.env.example` if provided):
    ```env
    DEBUG=True
    SECRET_KEY=your_development_secret_key
    # DATABASE_URL=postgres://user:password@localhost:5432/core_inventory_db # If using Postgres
    EMAIL_BACKEND='django.core.mail.backends.console.EmailBackend' # For local OTP testing
    ```

4.  **Run migrations:**
    ```bash
    python manage.py migrate
    ```

5.  **Start the development server:**
    ```bash
    python manage.py runserver
    ```
    The backend API will be accessible at `http://localhost:8000`.

### 2. Frontend Setup (Next.js)

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # OR
    yarn install
    ```

3.  **Configure environment variables:**
    Create a `.env.local` file in the `frontend/` directory:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:8000/api
    ```

4.  **Start the development server:**
    ```bash
    npm run dev
    # OR
    yarn dev
    ```
    The application will be accessible at `http://localhost:3000`.

