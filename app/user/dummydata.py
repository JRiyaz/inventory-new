# Raw dictionary definitions for test and development dummy data to prevent circular imports

PERMISSIONS_DATA = [
    {"role": "Admin", "can_read": True, "can_write": True, "can_update": True, "can_delete": True},
    {"role": "Agent", "can_read": True, "can_write": True, "can_update": True, "can_delete": False},
    {"role": "Customer", "can_read": True, "can_write": False, "can_update": False, "can_delete": False},
]

USERS_SEED_DATA = [
    {
        "user": {
            "username": "admin",
            "email": "admin@company.com",
            "name": "Super Admin",
            "company": "System Corp",
            "role": "Admin",
            "status": "Active",
            "avatar_url": "https://ui-avatars.com/api/?name=Super+Admin&background=3b429f&color=fff&size=80",
            "password_plain": "adminpassword",
        },
        "settings": {
            "theme": "void-blue",
            "loader_animation": "bloom",
            "animation_tempo": 800,
            "display_images": True,
            "dnd": False,
            "urgent_persistence": False,
            "notification_duration": 4000,
            "notification_placement": "top-right",
        },
    },
    {
        "user": {
            "username": "viewer",
            "email": "viewer@company.com",
            "name": "Guest Viewer",
            "company": "Viewer Inc",
            "role": "Customer",
            "status": "Active",
            "avatar_url": "https://ui-avatars.com/api/?name=Guest+Viewer&background=e11d48&color=fff&size=80",
            "password_plain": "viewerpassword",
        },
        "settings": {
            "theme": "glass",
            "loader_animation": "pulse",
            "animation_tempo": 400,
            "display_images": True,
            "dnd": True,
            "urgent_persistence": False,
            "notification_duration": 2000,
            "notification_placement": "top-left",
        },
    },
]

SUPPLIERS_DATA = [
    {
        "code": "SUP-001",
        "name": "Apex Tech Parts",
        "contact_email": "sales@apexparts.com",
        "phone": "+1-555-0199",
        "address": "123 Tech Way, Silicon Valley, CA",
    },
    {
        "code": "SUP-002",
        "name": "Global Logistics & Supply",
        "contact_email": "orders@globallogistics.com",
        "phone": "+1-555-0248",
        "address": "456 Freight Rd, Chicago, IL",
    },
    {
        "code": "SUP-003",
        "name": "Eco Packaging Solutions",
        "contact_email": "support@ecopack.com",
        "phone": "+1-555-0377",
        "address": "789 Green Blvd, Portland, OR",
    },
]

PRODUCTS_DATA = [
    {
        "sku": "PRD-001",
        "name": "Ergonomic Mechanical Keyboard",
        "description": "RGB backlit mechanical keyboard with blue switches",
        "price": 89.99,
        "category": "Electronics",
        "status": "Active",
    },
    {
        "sku": "PRD-002",
        "name": "Wireless Noise-Cancelling Headphones",
        "description": "Over-ear active noise cancelling Bluetooth headphones",
        "price": 199.99,
        "category": "Electronics",
        "status": "Active",
    },
    {
        "sku": "PRD-003",
        "name": "USB-C Dual HDMI Docking Station",
        "description": "10-in-1 docking station with power delivery support",
        "price": 59.99,
        "category": "Electronics",
        "status": "Active",
    },
    {
        "sku": "PRD-004",
        "name": "Standing Desk Converter",
        "description": "Adjustable height desk converter for dual monitors",
        "price": 129.99,
        "category": "Office",
        "status": "Active",
    },
    {
        "sku": "PRD-005",
        "name": "Ergonomic Mesh Office Chair",
        "description": "High-back office chair with lumbar support and 3D armrests",
        "price": 249.99,
        "category": "Office",
        "status": "Active",
    },
    {
        "sku": "PRD-006",
        "name": "Biodegradable Bubble Wrap (Roll)",
        "description": "Environmentally friendly packaging cushioning roll",
        "price": 19.99,
        "category": "Packaging",
        "status": "Active",
    },
]

WAREHOUSES_DATA = [
    {"code": "WH-NY-01", "name": "East Coast Logistics Hub", "location": "New York, NY", "status": "Active"},
    {"code": "WH-CA-01", "name": "West Coast Distribution Center", "location": "Los Angeles, CA", "status": "Active"},
    {"code": "WH-TX-01", "name": "Central States Warehouse", "location": "Dallas, TX", "status": "Active"},
]

CUSTOMERS_DATA = [
    {
        "name": "John Doe",
        "email": "john.doe@gmail.com",
        "phone": "+1-555-0100",
        "address": "100 Maple St, Boston, MA",
        "company": "Individual",
    },
    {
        "name": "Jane Smith",
        "email": "jane.smith@yahoo.com",
        "phone": "+1-555-0101",
        "address": "200 Oak Ave, Seattle, WA",
        "company": "Individual",
    },
    {
        "name": "Acme Corporation",
        "email": "procurement@acme.com",
        "phone": "+1-555-0102",
        "address": "1000 Enterprise Pkwy, Austin, TX",
        "company": "Acme Corp",
    },
    {
        "name": "Initech LLC",
        "email": "billing@initech.com",
        "phone": "+1-555-0103",
        "address": "4120 Freemont Ave, Denver, CO",
        "company": "Initech",
    },
    {
        "name": "Umbrella Corp",
        "email": "contact@umbrella.com",
        "phone": "+1-555-0104",
        "address": "55 Raccoon Dr, Raccoon City, WI",
        "company": "Umbrella",
    },
    {
        "name": "Hooli Inc",
        "email": "support@hooli.xyz",
        "phone": "+1-555-0105",
        "address": "900 Alta Vista Way, Mountain View, CA",
        "company": "Hooli",
    },
    {
        "name": "Soylent Corp",
        "email": "info@soylent.com",
        "phone": "+1-555-0106",
        "address": "12 Main St, New York, NY",
        "company": "Soylent",
    },
    {
        "name": "Cyberdyne Systems",
        "email": "t800@cyberdyne.com",
        "phone": "+1-555-0107",
        "address": "1984 Judgment Rd, Los Angeles, CA",
        "company": "Cyberdyne",
    },
    {
        "name": "Wayne Enterprises",
        "email": "bruce@wayne.com",
        "phone": "+1-555-0108",
        "address": "1007 Mountain Dr, Gotham, NJ",
        "company": "Wayne Ent",
    },
    {
        "name": "Stark Industries",
        "email": "tony@stark.com",
        "phone": "+1-555-0109",
        "address": "10880 El Camino Real, Malibu, CA",
        "company": "Stark Ind",
    },
    {
        "name": "Tyrell Corporation",
        "email": "replicant@tyrell.corp",
        "phone": "+1-555-0110",
        "address": "2019 Nexus Way, Los Angeles, CA",
        "company": "Tyrell",
    },
    {
        "name": "Massive Dynamic",
        "email": "info@massivedynamic.com",
        "phone": "+1-555-0111",
        "address": "60 Broad St, New York, NY",
        "company": "Massive Dynamic",
    },
    {
        "name": "Globex Corporation",
        "email": "scorpio@globex.com",
        "phone": "+1-555-0112",
        "address": "100 Cypress Creek Rd, Oregon",
        "company": "Globex",
    },
    {
        "name": "Buy More",
        "email": "chuck@buymore.com",
        "phone": "+1-555-0113",
        "address": "4000 Burbank Blvd, Burbank, CA",
        "company": "Buy More",
    },
    {
        "name": "Gekko & Co",
        "email": "bud@gekko.com",
        "phone": "+1-555-0114",
        "address": "40 Wall St, New York, NY",
        "company": "Gekko",
    },
    {
        "name": "Vandelay Industries",
        "email": "george@vandelay.com",
        "phone": "+1-555-0115",
        "address": "129 West 81st St, New York, NY",
        "company": "Vandelay Latex",
    },
]

ORDERS_DATA = [
    {
        "order_number": "SO-2026-0001",
        "status": "Completed",
        "total_amount": 279.98,
        "payment_status": "Paid",
        "items": [
            {"product_sku": "PRD-001", "quantity": 1, "unit_price": 89.99},
            {"product_sku": "PRD-002", "quantity": 1, "unit_price": 190.00},
        ],
        "payment": {
            "amount": 279.98,
            "payment_method": "Credit Card",
            "transaction_reference": "TXN-982341",
            "status": "Completed",
        },
    },
    {
        "order_number": "SO-2026-0002",
        "status": "Pending",
        "total_amount": 199.99,
        "payment_status": "Unpaid",
        "items": [
            {"product_sku": "PRD-002", "quantity": 1, "unit_price": 199.99},
        ],
        "payment": None,
    },
    {
        "order_number": "SO-2026-0003",
        "status": "Completed",
        "total_amount": 1139.94,
        "payment_status": "Paid",
        "items": [
            {"product_sku": "PRD-005", "quantity": 4, "unit_price": 249.99},
            {"product_sku": "PRD-004", "quantity": 2, "unit_price": 139.99},
        ],
        "payment": {
            "amount": 1139.94,
            "payment_method": "Bank Transfer",
            "transaction_reference": "TXN-554431",
            "status": "Completed",
        },
    },
]

OFFERS_DATA = [
    {
        "title": "Summer Electronics Sale",
        "description": "Get huge discounts on premium tech components!",
        "discount": 15.0,
        "category": "Electronics",
        "expiry_date": "2026-09-01",
        "color": "success",
    },
    {
        "title": "Office Upgrade Event",
        "description": "Ergonomic standing desks and high-back chairs now on sale",
        "discount": 10.0,
        "category": "Office",
        "expiry_date": "2026-08-15",
        "color": "warning",
    },
]
