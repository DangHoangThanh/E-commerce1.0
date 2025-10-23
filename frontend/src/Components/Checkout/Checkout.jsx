import React, { useContext, useState } from "react";
import { ShopContext } from "../../Context/ShopContext";
import { createOrder } from "../../api/orderService";
import "./Checkout.css";

const Checkout = () => {
  const { cartItems, all_product, getTotalCartAmount, setCartItems } = useContext(ShopContext);

  const itemsInCart = all_product.filter((p) => cartItems[p.id] > 0);

  // state cho form
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!itemsInCart.length) {
      alert("Your cart is empty!");
      return;
    }
    // Build productsInfo per backend spec
    const productsInfo = itemsInCart.map((item) => ({
      productId: String(item.id),
      quantity: parseInt(cartItems[item.id], 10),
      price: Math.round(Number(item.new_price)),
    }));

    // get userId if logged in
    let userId = null;
    try {
      const stored = localStorage.getItem("userInfo");
      if (stored) {
        const parsed = JSON.parse(stored);
        userId = parsed._id || parsed.id || parsed.userId || null;
      }
    } catch (err) {
      console.warn("Could not parse userInfo from localStorage", err);
    }

    if (!userId) {
      // No user logged in — save order locally so admin (on same browser) can see it in ManageOrders
      const ts = Date.now();
      const guestOrder = {
        _id: `guest_${ts}`,
        userId: null,
        productsInfo: productsInfo.map((p) => ({ ...p })),
        amount: productsInfo.reduce((s, p) => s + p.price * p.quantity, 0),
        paymentId: null,
        paymentMethod: "cash",
        paymentStatus: "unpaid",
        status: "pending",
        // include shipping so admin can see customer details
        shipping: {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const stored = JSON.parse(localStorage.getItem("guestOrders") || "[]");
        stored.unshift(guestOrder);
        localStorage.setItem("guestOrders", JSON.stringify(stored));
        // clear cart localStorage and context
        localStorage.removeItem("cartItems");
        try { setCartItems && setCartItems({}); } catch (e) {}
        alert("Bạn chưa đăng nhập — đơn hàng đã được lưu cục bộ. Admin sẽ thấy đơn này khi mở phần quản lý (trên cùng trình duyệt). Đơn hàng ID: " + guestOrder._id);
        window.location.href = "/";
      } catch (err) {
        console.error("Failed to save guest order:", err);
        alert("Không lưu được đơn hàng cục bộ. Vui lòng thử lại hoặc đăng nhập.");
      }
      return;
    }

    const payload = {
      userId,
      paymentMethod: "cash", // default for now
      productsInfo,
      // include shipping info — many backends require this and may return 400 if missing
      shipping: {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
      },
    };

    console.log("Creating order with payload:", payload);
    setIsSubmitting(true);
    createOrder(payload)
      .then((res) => {
        console.log("createOrder response:", res);
        if (res?.success) {
          // clear cart
          localStorage.removeItem("cartItems");
          alert("Order placed successfully! Order ID: " + (res.data?._id || "(unknown)"));
          window.location.href = "/";
        } else {
          // show server message if available
          const msg = res?.message || JSON.stringify(res) || "Unknown error";
          alert("Failed to place order: " + msg);
        }
      })
      .catch((err) => {
        console.error("Error creating order:", err);
        // show more details if available (status, data)
        let extra = "";
        if (err.status) extra += ` Status: ${err.status}`;
        if (err.data) extra += ` - ${JSON.stringify(err.data)}`;
        alert("Error placing order: " + (err.message || String(err)) + extra);
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="checkout-page">
      <h2>Checkout</h2>
      {itemsInCart.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <div className="checkout-content">
          {/* Left: items */}
          <div className="checkout-items">
            {itemsInCart.map((item) => (
              <div key={item.id} className="checkout-item">
                <img src={item.image} alt={item.name} />
                <div>
                  <h3>{item.name}</h3>
                  <p>
                    ${item.new_price} x {cartItems[item.id]} = $
                    {(item.new_price * cartItems[item.id]).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: summary + form */}
          <div className="checkout-right">
            <div className="checkout-summary">
              <h3>Order Summary</h3>
              <p>Total Items: {itemsInCart.length}</p>
              <h3>Total: ${getTotalCartAmount().toFixed(2)}</h3>
            </div>

            <div className="checkout-form">
              <h3>Shipping Information</h3>
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <button type="submit" disabled={isSubmitting} style={{ background: isSubmitting ? '#9ccc65' : undefined }}>
                  {isSubmitting ? 'Placing...' : 'Place Order'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
