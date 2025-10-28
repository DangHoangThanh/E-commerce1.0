import React, { useContext, useMemo, useState } from "react";
import "./CSS/Cart.css";
import { Link } from "react-router-dom";
import promoCodes from "../data/Promo.js";
import CartItem from "../Components/CartItem/CartItem";
import { ShopContext } from "../Context/ShopContext";

const Cart = () => {
  // Lấy cart & products từ ShopContext
  const {
    cartItems,
    setCartItems,           // set thẳng state giỏ
    addToCart,              // +1
    productsLookup, 
    isProductsLoading,      // đang nạp product list
    getTotalCartAmount,     // tính tổng tiền theo productsLookup
  } = useContext(ShopContext);

  const SHIPPING_FEE = 0;

  // ===== Promo state =====
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [error, setError] = useState("");

  // Subtotal lấy từ context (an toàn khi products chưa nạp đủ)
  const cartTotal = useMemo(() => getTotalCartAmount(), [getTotalCartAmount]);

  // ===== Helpers =====
  const setQty = (productId, nextQty) => {
    const pid = String(productId);
    setCartItems((prev) => {
      const q = Number(nextQty || 0);
      const copy = { ...prev };
      if (q <= 0) {
        delete copy[pid];
      } else {
        copy[pid] = q;
      }
      return copy;
    });
  };

  const onIncrease = (productId, curQty) => addToCart(productId);
  const onDecrease = (productId, curQty) => setQty(productId, (Number(curQty) || 0) - 1);
  const onRemove   = (productId) => setQty(productId, 0);

  const cartArray = useMemo(() => {
      return Object.entries(cartItems || {}).map(([productId, quantity]) => {
        const p = productsLookup?.[String(productId)];
        const img =
          p?.image ||
          p?.raw?.imageInfo?.url ||
          "";
        return {
          indexKey: productId,
          productId: String(productId),
          quantity: Number(quantity || 0),
          name: p?.name || "Loading...",
          price: Number(p?.price || 0),
          image: img,
          imageInfo: img ? { url: img } : undefined,
          category: p?.category || "",
        };
      });
    }, [cartItems, productsLookup]);
  // ===== Promo handlers =====
  const handlePromoCodeChange = (e) => {
    setPromoCode(e.target.value);
    setError("");
  };

  const applyPromoCode = (event) => {
    event.preventDefault();
    if (!promoCode.trim()) {
      setError("Please enter a promo code");
      return;
    }
    const foundPromo = promoCodes.find(
      (promo) => promo.code.toUpperCase() === promoCode.trim().toUpperCase()
    );
    if (foundPromo) {
      setAppliedPromo(foundPromo);
      setError("");
      setPromoCode("");
    } else {
      setError("Invalid promo code");
      setAppliedPromo(null);
    }
  };

  const calculateDiscount = () => {
    if (!appliedPromo) return 0;
    if (appliedPromo.type === "percentage") {
      return (cartTotal * appliedPromo.discount) / 100;
    }
    return 0;
  };

  const getShippingFee = () => {
    if (appliedPromo && appliedPromo.type === "freeshipping") return 0;
    return SHIPPING_FEE;
  };

  const getFinalTotal = () => {
    const discount = calculateDiscount();
    return cartTotal - discount + getShippingFee();
  };

  // Loading: nếu đang load sản phẩm và giỏ có item
  const isCartLoading = isProductsLoading && cartArray.length > 0;

  return (
    <div className="Cart-container">
      {/* Nút test thêm hàng */}
      <div>
        <button onClick={() => addToCart("68f9cf79c3d1a3fe39a50e90")}>
          Add Meat 1
        </button>
      </div>

      <h1 className="Cart-header">Your Cart</h1>

      {/* LIST CART ITEM */}
      <div className="Cart-cart">
        {isCartLoading ? (
          <div>Loading cart ...</div>
        ) : (
          <table id="table">
            <thead>
              <tr>
                <th id="index-col">#</th>
                <th id="image-col">Product</th>
                <th id="name-col">Name</th>
                <th id="price-col">Price</th>
                <th id="quantity-col">Quantity</th>
                <th id="total-col">Total</th>
                <th id="remove-col">Remove</th>
              </tr>
            </thead>
            <tbody>
              {cartArray.map((item, i) => (
                <tr key={item.indexKey}>
                  <td className="index-bar-cell">
                    <div className="index-bar">{i + 1}</div>
                  </td>
                  <CartItem
                    // Cart data
                    productId={item.productId}
                    quantity={item.quantity}
                    // Product data
                    name={item.name}
                    image={item.image}
                    imageInfo={item.imageInfo}
                    price={item.price}
                    // Handlers
                    onIncrease={() => onIncrease(item.productId, item.quantity)}
                    onDecrease={() => onDecrease(item.productId, item.quantity)}
                    onRemove={() => onRemove(item.productId)}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CHECKOUT */}
      <div className="Cart-checkout">
        <div className="Cart-total">
          <h1>Total</h1>
          <div>
            <div className="Cart-total-item">
              <p>Subtotal</p>
              <p>{cartTotal.toFixed(2)}đ</p>
            </div>
            <hr />
            {appliedPromo && (
              <>
                <div className="Cart-total-item">
                  <p>Discount ({appliedPromo.discount}%)</p>
                  <p>-{calculateDiscount().toFixed(2)}đ</p>
                </div>
                <hr />
              </>
            )}
            <div className="Cart-total-item">
              <p>Shipping Fee</p>
              <p>{getShippingFee().toFixed(2)}đ</p>
              {appliedPromo && appliedPromo.type === "freeshipping" && (
                <span className="free-shipping-badge">Free Shipping Applied</span>
              )}
            </div>
            <hr />
            <div className="Cart-total-item">
              <h3>Total</h3>
              <h3>{getFinalTotal().toFixed(2)}đ</h3>
            </div>
          </div>
          <Link to="/checkout">
            <button>PROCEED TO CHECKOUT</button>
          </Link>
        </div>

        <div className="Cart-promocode">
          <p>PROMO CODE HERE</p>
          {appliedPromo && (
            <div className="applied-promo">
              <p>
                Applied: {appliedPromo.code} ({appliedPromo.description})
              </p>
              <button onClick={() => setAppliedPromo(null)}>Remove</button>
            </div>
          )}
          <form className="Cart-promobox" onSubmit={applyPromoCode}>
            <input
              type="text"
              placeholder="Enter your code"
              value={promoCode}
              onChange={handlePromoCodeChange}
            />
            <button onClick={applyPromoCode}>APPLY</button>
          </form>
          {error && <p className="promo-error">{error}</p>}

          {/* testing */}
          <div className="available-promos">
            <p>
              <strong>Available promo codes:</strong>
            </p>
            <ul>
              {promoCodes.map((promo, index) => (
                <li key={index}>
                  {promo.code} - {promo.description}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
