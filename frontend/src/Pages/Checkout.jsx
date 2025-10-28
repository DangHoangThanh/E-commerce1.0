import React, { useContext, useState } from "react";
import { ShopContext } from "../Context/ShopContext";
import { CartContext } from "../Context/CartContext";
import "./CSS/Checkout.css";

// Assets
import COD_light from "../assets/COD_light.png";
import VNPAYLogo from "../assets/Logo-VNPAY-QR.png";
import DefaultImage from "../assets/placeholder-image.png";

// APIs
import { createOrder } from "../api/orderService.js";

// Utils
import { vnd } from "../utils/currencyUtils.js";

const Checkout = () => {
  const { userId } = useContext(ShopContext);
  const { isCartLoading, cartTotal, cartItems, productsLookup } =
    useContext(CartContext);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  const orderContent = Object.values(cartItems);
  const checkoutTotalItems = orderContent.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cash");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const placeOrder = async () => {
    if (!orderContent || !userId || !selectedPaymentMethod) {
      alert("Thiếu thông tin đơn hàng");
      return;
    }

    console.log("Checkout: New order");
    console.log("User ID:", userId);
    console.log("Order content:", orderContent);
    console.log("Payment method:", selectedPaymentMethod);

    try {
      await createOrder({
        userId: userId,
        paymentMethod: selectedPaymentMethod,
        productsInfo: orderContent,
      });
      alert("Đặt hàng thành công!");
    } catch (error) {
      console.error("createOrder failed:", error);
      alert("Đặt hàng thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="Checkout-page">
      <h1>Thanh Toán</h1>
      {Object.keys(cartItems).length === 0 ? (
        <p>Giỏ hàng trống</p>
      ) : (
        <div className="Checkout-content">
          {isCartLoading ? (
            <div>Đang tải giỏ hàng...</div>
          ) : (
            <>
              {/* Cart items */}
              <div className="Checkout-items">
                <h3>Sản Phẩm Mua:</h3>
                {orderContent.map((item) => {
                  const currentItemData = productsLookup[item.productId];
                  return (
                    <div key={item.productId} className="Checkout-item">
                      <img
                        src={currentItemData.imageInfo?.url || DefaultImage}
                        alt={currentItemData.name}
                      />
                      <div>
                        <h3>{currentItemData.name}</h3>
                        <p>
                          Số lượng {item.quantity} x {vnd(item.price)} ={" "}
                          <b>{vnd(item.price * item.quantity)}</b>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right side: form + summary */}
              <div className="Checkout-right">
                {/* Shipping Info */}
                <div className="Checkout-shipinfo">
                  <h3>Thông Tin Giao Hàng</h3>
                  <form>
                    <input
                      type="text"
                      name="name"
                      placeholder="Họ và Tên"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                    <input
                      type="text"
                      name="address"
                      placeholder="Địa Chỉ"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                    <input
                      type="text"
                      name="phone"
                      placeholder="Số Điện Thoại"
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
                  </form>
                </div>

                {/* Order Summary */}
                <div className="Checkout-summary">
                  <h3>Tổng Quan Đơn Hàng</h3>
                  <p>Tổng số lượng: {checkoutTotalItems} sản phẩm</p>
                  <h3>Tổng thanh toán: {vnd(cartTotal)}</h3>
                </div>

                {/* Payment Options */}
                <div className="Checkout-payments">
                  <h3>Chọn phương thức thanh toán:</h3>
                  <div className="option">
                    <label>
                      <input
                        type="radio"
                        name="payment-method"
                        value="cash"
                        checked={selectedPaymentMethod === "cash"}
                        onChange={(e) =>
                          setSelectedPaymentMethod(e.target.value)
                        }
                      />
                      <img src={COD_light} alt="COD" />
                      Thanh toán khi nhận hàng (COD)
                    </label>
                  </div>
                  <div className="option">
                    <label>
                      <input
                        type="radio"
                        name="payment-method"
                        value="vnpay"
                        checked={selectedPaymentMethod === "vnpay"}
                        onChange={(e) =>
                          setSelectedPaymentMethod(e.target.value)
                        }
                      />
                      <img src={VNPAYLogo} alt="VNPay" />
                      VN Pay
                    </label>
                  </div>
                </div>

                {/* Submit */}
                <button className="Checkout-placeorder" onClick={placeOrder}>
                  Đặt Hàng
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Checkout;
