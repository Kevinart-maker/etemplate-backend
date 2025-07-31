# 📦 E-Commerce Backend API: Orders, Sales, and Order Tracking

## 1. Order API

### Endpoints

| Method | Endpoint              | Description                |
|--------|-----------------------|----------------------------|
| POST   | `/api/orders`         | Create a new order         |
| GET    | `/api/orders`         | Get all orders             |
| GET    | `/api/orders/:orderId`| Get a specific order       |

---

### A. Create Order

**POST** `/api/orders`

**Request Body:**
```json
{
  "user": "USER_ID",
  "products": [
    {
      "product": "PRODUCT_ID",
      "quantity": 2,
      "price": 1200
    }
  ],
  "status": "Pending",         // Optional, defaults to "Pending"
  "totalAmount": 2400
}
```

**Response:**
```json
{
  "_id": "ORDER_ID",
  "user": "USER_ID",
  "products": [
    {
      "product": "PRODUCT_ID",
      "quantity": 2,
      "price": 1200,
      "_id": "PRODUCT_ITEM_ID"
    }
  ],
  "status": "Pending",
  "totalAmount": 2400,
  "createdAt": "2024-06-01T12:00:00.000Z",
  "updatedAt": "2024-06-01T12:00:00.000Z",
  "__v": 0
}
```

**Frontend Usage:**
- Use this endpoint when a user checks out.
- Send the logged-in user’s ID, cart items, and total.
- On success, store the returned order ID for tracking, payment, etc.

---

### B. Get All Orders

**GET** `/api/orders`

**Response:**
```json
[
  {
    "_id": "ORDER_ID",
    "user": { /* user object */ },
    "products": [
      { "product": { /* product object */ }, "quantity": 2, "price": 1200 }
    ],
    "status": "Pending",
    "totalAmount": 2400,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

**Frontend Usage:**
- For admin dashboards or user order history pages.
- Display order details, status, and products.

---

### C. Get Order by ID

**GET** `/api/orders/:orderId`

**Response:**  
Same as above, but for a single order.

**Frontend Usage:**
- For order detail pages.
- Use the order ID from the order list or after creation.

---

## 2. Sales API

### Endpoints

| Method | Endpoint         | Description                |
|--------|------------------|----------------------------|
| POST   | `/api/sales`     | Create a sales record      |
| GET    | `/api/sales/day` | Get sales by day           |
| GET    | `/api/sales/month`| Get sales by month        |
| GET    | `/api/sales/total`| Get total sales           |

---

### A. Create Sale

**POST** `/api/sales`

**Request Body:**
```json
{
  "order": "ORDER_ID",
  "amount": 2400,
  "date": "2024-06-01T12:00:00.000Z" // Optional, defaults to now
}
```

**Response:**
```json
{
  "_id": "SALE_ID",
  "order": "ORDER_ID",
  "amount": 2400,
  "date": "2024-06-01T12:00:00.000Z",
  "__v": 0
}
```

**Frontend Usage:**
- Call this after a successful payment to record the sale.
- Use the order ID and amount from the completed order.

---

### B. Get Sales Data

**GET** `/api/sales/day`  
**GET** `/api/sales/month`  
**GET** `/api/sales/total`

**Response Example:**
```json
[
  { "_id": "2024-06-01", "totalSales": 5000, "count": 3 },
  { "_id": "2024-06-02", "totalSales": 2000, "count": 1 }
]
```
or for `/total`:
```json
{ "totalSales": 7000, "count": 4 }
```

**Frontend Usage:**
- For admin dashboards, analytics, and sales charts.
- Visualize sales trends over time.

---

## 3. Order Tracking API

### Endpoints

| Method | Endpoint                        | Description                |
|--------|----------------------------------|----------------------------|
| POST   | `/api/order-tracking`           | Create tracking entry      |
| GET    | `/api/order-tracking/:orderId`  | Get current order status   |
| PUT    | `/api/order-tracking/:orderId`  | Update order status        |
| GET    | `/api/order-tracking/:orderId/history` | Get status history |

---

### A. Create Order Tracking

**POST** `/api/order-tracking`

**Request Body:**
```json
{
  "order": "ORDER_ID",
  "status": "Pending",
  "history": [
    { "status": "Pending", "date": "2024-06-01T12:00:00.000Z" }
  ]
}
```

**Response:**
```json
{
  "_id": "TRACKING_ID",
  "order": "ORDER_ID",
  "status": "Pending",
  "history": [
    { "status": "Pending", "date": "2024-06-01T12:00:00.000Z" }
  ],
  "__v": 0
}
```

**Frontend Usage:**
- Call this after order creation to start tracking.
- Store the returned tracking ID if needed.

---

### B. Get Order Status

**GET** `/api/order-tracking/:orderId`

**Response:**
```json
{
  "order": "ORDER_ID",
  "status": "Shipped",
  "history": [
    { "status": "Pending", "date": "..." },
    { "status": "Processing", "date": "..." },
    { "status": "Shipped", "date": "..." }
  ]
}
```

**Frontend Usage:**
- Show current status on order detail/tracking pages.

---

### C. Update Order Status

**PUT** `/api/order-tracking/:orderId`

**Request Body:**
```json
{ "status": "Delivered" }
```

**Response:**  
Updated tracking object.

**Frontend Usage:**
- For admin/staff to update order status.
- For user notifications (e.g., “Your order has shipped!”).

---

### D. Get Order Status History

**GET** `/api/order-tracking/:orderId/history`

**Response:**
```json
[
  { "status": "Pending", "date": "..." },
  { "status": "Processing", "date": "..." },
  { "status": "Shipped", "date": "..." }
]
```

**Frontend Usage:**
- Show a timeline of order progress.

---

## 4. Frontend Integration Tips

- **Authentication:**  
  If endpoints are protected, include the user’s auth token in the `Authorization` header.
- **IDs:**  
  Use IDs returned from creation endpoints for subsequent requests (e.g., order ID for tracking, sales).
- **Error Handling:**  
  Always check for error responses and display user-friendly messages.
- **Data Display:**  
  Use the GET endpoints to populate order history, sales charts, and tracking timelines.
- **Admin vs User:**  
  Restrict certain endpoints (like updating order status) to admin/staff roles.

---

## 5. Example Frontend Flow

1. **User checks out:**  
   - POST `/api/orders` with cart and user info.
   - On success, get `orderId`.
2. **Create order tracking:**  
   - POST `/api/order-tracking` with `orderId` and initial status.
3. **After payment:**  
   - POST `/api/sales` with `orderId` and amount.
4. **User views order status:**  
   - GET `/api/order-tracking/:orderId`
5. **Admin updates status:**  
   - PUT `/api/order-tracking/:orderId` with new status.
6. **Admin views sales analytics:**  
   - GET `/api/sales/day`, `/api/sales/month`, `/api/sales/total`

---

## 6. Postman Collection

- Use the provided `Sales-Order-Invoice-API.postman_collection.json` to test all endpoints.
- Update placeholder IDs with real values from your database.

---

**If you need code samples for React, Vue, or another frontend, or want to see how to handle authentication, just ask!**