import React, { useState, useEffect } from "react";
import "./DashboardPage.css";

const DashboardPage = ({ user, onLogout, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name,
    email: user.email,
    role: user.role || "Market Owner",
  });

  // Materials Database state (loaded from backend API)
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch("http://localhost:5000/api/products", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Fetch products error:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Form state for adding/editing products
  const [productForm, setProductForm] = useState({
    id: "",
    name: "",
    category: "Fruits",
    price: "",
    unit: "kg",
    stock: "",
  });
  const [isEditingProduct, setIsEditingProduct] = useState(false);

  // Billing Widget state
  const [billingQuery, setBillingQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [billingQty, setBillingQty] = useState(1);
  const [billingCart, setBillingCart] = useState([]);

  // Handle billing item search suggestions
  useEffect(() => {
    if (!billingQuery.trim()) {
      setSuggestions([]);
      setSelectedProduct(null);
      return;
    }
    const filtered = products.filter((p) =>
      p.name.toLowerCase().includes(billingQuery.toLowerCase())
    );
    setSuggestions(filtered);

    // If there are matches, auto-select the first match (closest item)
    if (filtered.length > 0) {
      const exactMatch = filtered.find(
        (p) => p.name.toLowerCase() === billingQuery.toLowerCase().trim()
      );
      setSelectedProduct(exactMatch || filtered[0]);
    } else {
      setSelectedProduct(null);
    }
  }, [billingQuery, products]);

  const handleSelectSuggestion = (product) => {
    setSelectedProduct(product);
    setBillingQuery(product.name);
    setSuggestions([]);
  };

  const handleAddToBill = (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert("Please select a valid material from the list or suggestions first.");
      return;
    }
    if (billingQty <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    const itemTotal = Number(selectedProduct.price) * Number(billingQty);
    const cartItem = {
      id: "cart_" + Math.random().toString(36).substr(2, 9),
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      unit: selectedProduct.unit,
      quantity: billingQty,
      total: itemTotal,
    };

    setBillingCart([...billingCart, cartItem]);
    setBillingQuery("");
    setSelectedProduct(null);
    setBillingQty(1);
  };

  const handleRemoveFromBill = (id) => {
    setBillingCart(billingCart.filter((item) => item.id !== id));
  };

  const handleClearBill = () => {
    setBillingCart([]);
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.email) {
      alert("Name and email cannot be empty.");
      return;
    }

    const updatedUser = {
      ...user,
      name: editForm.name,
      email: editForm.email,
      role: editForm.role,
    };

    const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const updatedUsers = storedUsers.map((u) =>
      u.id === user.id ? { ...u, ...editForm } : u
    );
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }

    setIsEditing(false);
    alert("Profile details updated successfully!");
  };

  // Product Inventory Handlers
  const handleProductFormChange = (e) => {
    setProductForm({
      ...productForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.stock) {
      alert("Please fill all required product fields.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (isEditingProduct) {
        const response = await fetch(`http://localhost:5000/api/products/${productForm.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            name: productForm.name,
            category: productForm.category,
            price: Number(productForm.price),
            unit: productForm.unit,
            stock: Number(productForm.stock)
          })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          alert("Material updated successfully!");
        } else {
          alert(data.message || "Failed to update material");
        }
        setIsEditingProduct(false);
      } else {
        const response = await fetch("http://localhost:5000/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            name: productForm.name,
            category: productForm.category,
            price: Number(productForm.price),
            unit: productForm.unit,
            stock: Number(productForm.stock)
          })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          alert("Material added successfully!");
        } else {
          alert(data.message || "Failed to add material");
        }
      }
      fetchProducts();
    } catch (error) {
      console.error("Save product error:", error);
      alert("Error saving product: connection to server failed.");
    }

    setProductForm({
      id: "",
      name: "",
      category: "Fruits",
      price: "",
      unit: "kg",
      stock: "",
    });
  };

  const handleEditProductClick = (product) => {
    setProductForm({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      unit: product.unit,
      stock: product.stock,
    });
    setIsEditingProduct(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (confirm("Are you sure you want to delete this material?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok && data.success) {
          alert("Material deleted successfully!");
          fetchProducts();
        } else {
          alert(data.message || "Failed to delete material");
        }
      } catch (error) {
        console.error("Delete product error:", error);
        alert("Error deleting product: connection to server failed.");
      }
    }
  };

  const handleCheckoutBill = async () => {
    if (billingCart.length === 0) return;
    try {
      const token = localStorage.getItem("token");
      const itemsPayload = billingCart.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
      }));

      const response = await fetch("http://localhost:5000/api/bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ items: itemsPayload }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        alert("Bill checkout successful! Inventory stock updated in database.");
        setBillingCart([]);
        fetchProducts(); // Sync updated stocks
      } else {
        alert(data.message || "Failed to process checkout");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Error checking out: connection to server failed.");
    }
  };

  const getInitials = (name) => {
    if (!name) return "MO";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Dashboard Stats Tailored for Shopkeepers
  const totalMaterials = products.length;
  const inventoryValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock < 50).length;

  const dashboardStats = [
    {
      title: "Total Materials",
      value: totalMaterials,
      change: "Items in storage",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 7l-8-4-8 4 8 4 8-4zM4 12l8 4 8-4M4 17l8 4 8-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: "Inventory Value",
      value: `₹${inventoryValue.toLocaleString()}`,
      change: "Current asset estimate",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: "Low Stock Items",
      value: lowStockCount,
      change: "Items under 50 units",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: "Storage Status",
      value: "Optimal",
      change: "Active Shop Profile",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  const totalBillAmount = billingCart.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="dashboard-container">
      {/* Decorative Blur Blobs */}
      <div className="dash-blob dash-blob-1"></div>
      <div className="dash-blob dash-blob-2"></div>

      {/* SIDEBAR NAVIGATION */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="brand-name">ProManage</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Overview
          </button>

          <button
            className={`nav-item ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.89 2.24l8 4a2 2 0 0 1 1.11 1.8v8a2 2 0 0 1-1.11 1.8l-8 4a2 2 0 0 1-1.78 0l-8-4A2 2 0 0 1 2 16V8a2 2 0 0 1 1.11-1.8l8-4a2 2 0 0 1 1.78 0z" />
              <polyline points="2.27 6.09 12 10.92 21.73 6.09" />
              <line x1="12" y1="22.08" x2="12" y2="10.91" />
            </svg>
            Material Storage
          </button>
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="sidebar-footer">
          <div className="user-avatar-mini">{getInitials(user.name)}</div>
          <div className="user-details-mini">
            <span className="user-name-mini">{user.name}</span>
            <span className="user-role-mini">{user.role || "Market Owner"}</span>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Log Out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="dashboard-main">
        {/* Top Navbar */}
        <header className="dashboard-topbar">
          <div className="topbar-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="Quick search dashboard..." disabled />
          </div>

          <div className="topbar-actions">
            <span className="current-date">
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
            <div className="notification-badge" title="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="badge-dot"></span>
            </div>
            <div className="user-avatar-top">{getInitials(user.name)}</div>
          </div>
        </header>

        {/* Dynamic content depending on active tab */}
        {activeTab === "dashboard" ? (
          <div className="dashboard-content">
            <div className="welcome-banner">
              <h1>Welcome back, {user.name.split(" ")[0]}!</h1>
              <p>Manage your market materials, update inventory pricing, and generate quick quotes.</p>
            </div>

            {/* Grid Stats cards */}
            <div className="stats-grid">
              {dashboardStats.map((stat, i) => (
                <div className="stat-card" key={i}>
                  <div className="stat-header">
                    <span className="stat-title">{stat.title}</span>
                    <div className="stat-icon-wrapper">{stat.icon}</div>
                  </div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-footer">{stat.change}</div>
                </div>
              ))}
            </div>

            {/* Row Layout: Billing lookup + Profile Details */}
            <div className="details-grid">
              
              {/* BILLING AND PRICE LOOKUP PANEL */}
              <section className="details-card billing-lookup-panel">
                <div className="card-header">
                  <h2>Price Lookup & Billing Calculator</h2>
                  <span className="header-badge" style={{ background: "rgba(255, 107, 0, 0.08)", color: "var(--primary)" }}>Interactive</span>
                </div>

                <form onSubmit={handleAddToBill} className="billing-lookup-form">
                  <div className="billing-search-row">
                    <div className="form-field search-field">
                      <label htmlFor="billing-search">Type Material Name</label>
                      <div className="search-input-wrapper">
                        <input
                          type="text"
                          id="billing-search"
                          placeholder="e.g. Mangoes, Tomatoes..."
                          value={billingQuery}
                          onChange={(e) => setBillingQuery(e.target.value)}
                          autoComplete="off"
                          required
                        />
                        {suggestions.length > 0 && (
                          <ul className="suggestions-dropdown">
                            {suggestions.map((p) => (
                              <li key={p.id} onClick={() => handleSelectSuggestion(p)}>
                                <span className="suggestion-name">{p.name}</span>
                                <span className="suggestion-price">₹{p.price}/{p.unit}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div className="form-field qty-field">
                      <label htmlFor="billing-qty">Quantity</label>
                      <input
                        type="number"
                        id="billing-qty"
                        value={billingQty}
                        onChange={(e) => setBillingQty(e.target.value)}
                        min="1"
                        step="any"
                        required
                      />
                    </div>
                  </div>

                  {/* Automatic Price indicator */}
                  {selectedProduct ? (
                    <div className="price-indicator-panel">
                      <div className="indicator-label">Product Found:</div>
                      <div className="indicator-details">
                        <span className="indicator-name">{selectedProduct.name}</span>
                        <span className="indicator-price">₹{selectedProduct.price} per {selectedProduct.unit}</span>
                      </div>
                      <div className="indicator-subtotal">
                        Subtotal: <span className="subtotal-amount">₹{(selectedProduct.price * billingQty).toFixed(2)}</span>
                      </div>
                    </div>
                  ) : billingQuery.trim() !== "" ? (
                    <div className="price-indicator-panel no-match" style={{ border: "1px dashed #f87171", background: "rgba(248, 113, 113, 0.05)" }}>
                      <div className="indicator-label" style={{ color: "#ef4444" }}>No Match Found:</div>
                      <div className="indicator-details" style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                        No material matching "{billingQuery}" exists in storage. Please add it via the "Material Storage" tab.
                      </div>
                    </div>
                  ) : null}

                  <button type="submit" className="add-bill-btn" disabled={!selectedProduct}>
                    Add to Draft Bill
                  </button>
                </form>

                {/* Draft Bill Section */}
                <div className="draft-bill-section">
                  <h3>Draft Bill / Estimate Summary</h3>
                  {billingCart.length === 0 ? (
                    <div className="empty-cart-message">No items in the draft bill. Use the lookup tool above to add items.</div>
                  ) : (
                    <>
                      <table className="draft-bill-table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Rate</th>
                            <th>Qty</th>
                            <th>Total</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {billingCart.map((item) => (
                            <tr key={item.id}>
                              <td>{item.name}</td>
                              <td>₹{item.price}/{item.unit}</td>
                              <td>{item.quantity}</td>
                              <td>₹{item.total.toFixed(2)}</td>
                              <td>
                                <button className="remove-cart-item-btn" onClick={() => handleRemoveFromBill(item.id)}>
                                  &times;
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="bill-summary-footer">
                        <div className="bill-grand-total">
                          Grand Total: <span>₹{totalBillAmount.toFixed(2)}</span>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button className="clear-bill-btn" onClick={handleClearBill}>
                            Clear Bill
                          </button>
                          <button className="save-edit-btn" onClick={handleCheckoutBill} style={{ padding: "8px 14px", fontSize: "12.5px" }}>
                            Checkout & Save Bill
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* USER PROFILE DETAILS PANEL */}
              <section className="details-card profile-details-panel">
                <div className="card-header">
                  <h2>Market Owner Profile</h2>
                  {!isEditing && (
                    <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                      </svg>
                      Edit Profile
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleSave} className="edit-profile-form">
                    <div className="form-field">
                      <label htmlFor="edit-name">Owner Name</label>
                      <input
                        type="text"
                        id="edit-name"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="edit-email">Email Address</label>
                      <input
                        type="email"
                        id="edit-email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditChange}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="edit-role">Merchant Role</label>
                      <select
                        id="edit-role"
                        name="role"
                        value={editForm.role}
                        onChange={handleEditChange}
                      >
                        <option value="Market Owner">Market Owner</option>
                        <option value="Wholesale Merchant">Wholesale Merchant</option>
                        <option value="Retail Shopkeeper">Retail Shopkeeper</option>
                        <option value="Farming Producer">Farming Producer</option>
                      </select>
                    </div>
                    <div className="edit-form-actions">
                      <button type="button" className="cancel-edit-btn" onClick={() => setIsEditing(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="save-edit-btn">
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="profile-display">
                    <div className="profile-hero">
                      <div className="user-avatar-large">{getInitials(user.name)}</div>
                      <div className="profile-hero-text">
                        <h3>{user.name}</h3>
                        <span className="badge-role">{user.role || "Market Owner"}</span>
                      </div>
                    </div>

                    <div className="info-list">
                      <div className="info-row">
                        <span className="info-label">Email Address</span>
                        <span className="info-val">{user.email}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Account Status</span>
                        <span className="info-val val-status">
                          <span className="status-dot"></span> Active
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Joined Date</span>
                        <span className="info-val">{user.joinedDate || "June 10, 2026"}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Merchant ID</span>
                        <span className="info-val val-mono">{user.id || "usr_demo123"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        ) : (
          /* PRODUCTS TAB - MATERIAL LISTING STORAGE */
          <div className="dashboard-content">
            <div className="welcome-banner">
              <h1>Material Storage Database</h1>
              <p>Add, edit, or delete items and set their selling prices per unit in the application store.</p>
            </div>

            <div className="products-layout-grid">
              
              {/* ADD OR EDIT PRODUCT CARD */}
              <section className="details-card product-form-panel">
                <div className="card-header">
                  <h2>{isEditingProduct ? "Update Material Details" : "Register New Material"}</h2>
                </div>

                <form onSubmit={handleSaveProduct} className="material-entry-form">
                  <div className="form-field">
                    <label htmlFor="prod-name">Material / Item Name</label>
                    <input
                      type="text"
                      id="prod-name"
                      name="name"
                      placeholder="e.g. Alphonso Mangoes, Potatoes..."
                      value={productForm.name}
                      onChange={handleProductFormChange}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="prod-category">Category</label>
                    <select
                      id="prod-category"
                      name="category"
                      value={productForm.category}
                      onChange={handleProductFormChange}
                    >
                      <option value="Fruits">Fruits</option>
                      <option value="Vegetables">Vegetables</option>
                      <option value="Grains">Grains</option>
                      <option value="Dairy">Dairy</option>
                      <option value="Spices">Spices</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div className="form-row-double">
                    <div className="form-field">
                      <label htmlFor="prod-price">Selling Price (₹)</label>
                      <input
                        type="number"
                        id="prod-price"
                        name="price"
                        placeholder="e.g. 120"
                        value={productForm.price}
                        onChange={handleProductFormChange}
                        min="0"
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="prod-unit">Unit</label>
                      <select
                        id="prod-unit"
                        name="unit"
                        value={productForm.unit}
                        onChange={handleProductFormChange}
                      >
                        <option value="kg">per kg</option>
                        <option value="dozen">per dozen</option>
                        <option value="piece">per piece</option>
                        <option value="packet">per packet</option>
                        <option value="litre">per litre</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="prod-stock">Initial Stock Quantity</label>
                    <input
                      type="number"
                      id="prod-stock"
                      name="stock"
                      placeholder="e.g. 150"
                      value={productForm.stock}
                      onChange={handleProductFormChange}
                      min="0"
                      required
                    />
                  </div>

                  <div className="product-form-actions">
                    {isEditingProduct && (
                      <button
                        type="button"
                        className="cancel-edit-btn"
                        onClick={() => {
                          setIsEditingProduct(false);
                          setProductForm({ id: "", name: "", category: "Fruits", price: "", unit: "kg", stock: "" });
                        }}
                      >
                        Cancel
                      </button>
                    )}
                    <button type="submit" className="save-edit-btn">
                      {isEditingProduct ? "Update Item" : "Add Material"}
                    </button>
                  </div>
                </form>
              </section>

              {/* MATERIAL LIST TABLE */}
              <section className="details-card product-list-panel">
                <div className="card-header">
                  <h2>Stored Materials & Pricing</h2>
                  <span className="header-badge">{products.length} Items</span>
                </div>

                <div className="material-table-wrapper">
                  <table className="material-database-table">
                    <thead>
                      <tr>
                        <th>Material Name</th>
                        <th>Category</th>
                        <th>Selling Price</th>
                        <th>Available Stock</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textHeight: "100px", color: "var(--text-secondary)" }}>
                            No materials registered in your database. Add one on the left!
                          </td>
                        </tr>
                      ) : (
                        products.map((p) => (
                          <tr key={p.id} className={p.stock < 50 ? "row-low-stock" : ""}>
                            <td>
                              <div className="product-name-cell">
                                <span className="product-name-bold">{p.name}</span>
                                {p.stock < 50 && <span className="badge-low-stock-label">Low Stock</span>}
                              </div>
                            </td>
                            <td><span className="badge-category">{p.category}</span></td>
                            <td><strong style={{ color: "var(--primary)" }}>₹{p.price}</strong> / {p.unit}</td>
                            <td>{p.stock} {p.unit}s</td>
                            <td className="table-row-actions">
                              <button className="table-action-btn edit" onClick={() => handleEditProductClick(p)} title="Edit Material">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                                </svg>
                              </button>
                              <button className="table-action-btn delete" onClick={() => handleDeleteProduct(p.id)} title="Delete Material">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <line x1="10" y1="11" x2="10" y2="17" />
                                  <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
