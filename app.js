// app.js

// 1. Supabase Initialization
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nrxfkwendggjiasiizpj.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yeGZrd2VuZGdnamlhc2lpenBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTYyOTQsImV4cCI6MjA5Njk5MjI5NH0.roGzyEZcxVGsrjxo42UcbyfmRDiSuD3mHczXWmq6PVU';

let supabase = null;
let localAssets = [];
let currentUser = null;
let currentAuthTab = "signin"; // "signin" or "signup"
let currentImageUrl = "";
let currentImgTab = "file"; // "file" or "url"

// Initialize connection and check status
function initSupabase() {
  const statusIndicator = document.getElementById("statusIndicator");
  const statusText = document.getElementById("statusText");

  try {
    if (!window.supabase) {
      throw new Error("Supabase library not loaded from CDN.");
    }
    const { createClient } = window.supabase;
    supabase = createClient(supabaseUrl, supabaseKey);
    
    statusIndicator.className = "status-dot online";
    statusText.innerText = "Đã kết nối Supabase";
    return true;
  } catch (err) {
    console.error("Supabase Connection Error:", err);
    statusIndicator.className = "status-dot offline";
    statusText.innerText = "Lỗi kết nối cơ sở dữ liệu";
    return false;
  }
}

// 2. Fetch Assets and Categories
async function fetchAssets() {
  const loadingSpinner = document.getElementById("assetsLoading");
  const assetsGrid = document.getElementById("assetsGrid");
  const emptyState = document.getElementById("assetsEmpty");

  loadingSpinner.classList.remove("hidden");
  assetsGrid.classList.add("hidden");
  emptyState.classList.add("hidden");

  if (!supabase || !currentUser) return;

  try {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    localAssets = data || [];
    renderAssets();
    updateStats();
    populateCategoryFilters();
    populateStatusFilters();
  } catch (err) {
    console.error("Fetch Assets Failed:", err);
    document.getElementById("statusIndicator").className = "status-dot offline";
    document.getElementById("statusText").innerText = "Lỗi đồng bộ dữ liệu";
    alert("Không thể tải dữ liệu từ Supabase. Vui lòng đảm bảo bảng 'assets' đã được tạo và chứa cột 'user_id'. Xem hướng dẫn trong file asset_management_guide.md");
  } finally {
    loadingSpinner.classList.add("hidden");
    assetsGrid.classList.remove("hidden");
  }
}

// 3. Render Items Cards dynamically
function renderAssets() {
  const grid = document.getElementById("assetsGrid");
  const emptyState = document.getElementById("assetsEmpty");
  grid.innerHTML = "";

  const searchQuery = document.getElementById("searchInput").value.toLowerCase().trim();
  const categoryFilter = document.getElementById("categoryFilter").value;
  const statusFilter = document.getElementById("statusFilter").value;

  // Apply Filters Client-side
  const filtered = localAssets.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery) || 
                          item.location.toLowerCase().includes(searchQuery) ||
                          (item.notes && item.notes.toLowerCase().includes(searchQuery));
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "asset-card";
    
    // Status color badge class mapping
    let statusClass = "status-custom";
    if (item.status === "Bình thường") statusClass = "status-normal";
    if (item.status === "Đang mượn") statusClass = "status-borrowed";
    if (item.status === "Thất lạc") statusClass = "status-lost";

    card.innerHTML = `
      ${item.image_url ? `
        <div class="asset-image-wrapper">
          <img src="${item.image_url}" class="asset-image" alt="${escapeHtml(item.name)}" loading="lazy">
        </div>
      ` : ""}
      <div class="asset-card-main">
        <div class="asset-card-header">
          <span class="asset-name">${escapeHtml(item.name)}</span>
        </div>
        <div class="asset-badge-row">
          <span class="badge badge-category">${escapeHtml(item.category)}</span>
          <span class="badge badge-status ${statusClass}" title="Click để đổi trạng thái nhanh">${escapeHtml(item.status)}</span>
        </div>
        <div class="asset-location">📍 <span>${escapeHtml(item.location)}</span></div>
        ${item.notes ? `<div class="asset-notes">${escapeHtml(item.notes)}</div>` : ""}
      </div>
      
      <div class="asset-card-controls">
        <div class="quantity-control">
          <button class="qty-btn qty-minus-btn" title="Giảm số lượng">-</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn qty-plus-btn" title="Tăng số lượng">+</button>
        </div>
        <div class="card-actions">
          <button class="btn-icon edit-btn" title="Sửa thông tin">✏️ Sửa</button>
          <button class="btn-icon btn-danger delete-btn" title="Xóa món đồ">🗑️ Xóa</button>
        </div>
      </div>
    `;

    // Bind Events for Quick Actions directly on DOM
    const statusBadge = card.querySelector(".badge-status");
    statusBadge.addEventListener("click", () => cycleStatus(item.id, item.status));

    const minusBtn = card.querySelector(".qty-minus-btn");
    const plusBtn = card.querySelector(".qty-plus-btn");
    minusBtn.addEventListener("click", () => updateQuantity(item.id, item.quantity, -1));
    plusBtn.addEventListener("click", () => updateQuantity(item.id, item.quantity, 1));

    const editBtn = card.querySelector(".edit-btn");
    const deleteBtn = card.querySelector(".delete-btn");
    editBtn.addEventListener("click", () => openEditModal(item));
    deleteBtn.addEventListener("click", () => deleteItem(item.id, item.name));

    grid.appendChild(card);
  });
}

// 5. Statistics Counters updater
function updateStats() {
  const totalItems = localAssets.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const categories = new Set(localAssets.map(item => item.category)).size;
  const borrowed = localAssets.filter(item => item.status === "Đang mượn").reduce((sum, item) => sum + item.quantity, 0);
  const lost = localAssets.filter(item => item.status === "Thất lạc").reduce((sum, item) => sum + item.quantity, 0);

  document.getElementById("statTotalItems").innerText = totalItems;
  document.getElementById("statTotalCategories").innerText = categories;
  document.getElementById("statBorrowed").innerText = borrowed;
  document.getElementById("statLost").innerText = lost;
}

// 6. Populate Category Filter Dropdown dynamically
function populateCategoryFilters() {
  const filterSelect = document.getElementById("categoryFilter");
  const previousVal = filterSelect.value;

  const userMetadata = currentUser?.user_metadata || {};
  const customCategories = userMetadata.custom_categories || [];
  const assetCategories = localAssets.map(item => item.category);

  const categories = [...new Set([...customCategories, ...assetCategories])].filter(c => c && c.trim() !== "").sort();

  // Update dropdown filter
  filterSelect.innerHTML = `<option value="all">Tất cả danh mục</option>`;
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.innerText = cat;
    filterSelect.appendChild(opt);
  });
  filterSelect.value = previousVal;
}

// Populate Add/Edit Modal Category datalist dynamically
function populateModalCategories(selectedCategory = "") {
  const datalist = document.getElementById("categoryDatalist");
  const input = document.getElementById("categoryInput");
  
  const defaultCategories = ["Chìa khóa", "Đồ điện tử", "Giấy tờ / Thẻ", "Sách vở / Tài liệu", "Dụng cụ / Đồ nghề", "Đồ gia dụng", "Thuốc / Y tế"];
  const userMetadata = currentUser?.user_metadata || {};
  const customCategories = userMetadata.custom_categories || [];
  const uniqueLocal = localAssets.map(item => item.category);
  
  // Merge and sort categories list
  const combined = Array.from(new Set([...defaultCategories, ...customCategories, ...uniqueLocal])).filter(c => c && c.trim() !== "");
  combined.sort();

  // Populate Datalist options
  datalist.innerHTML = "";
  combined.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    datalist.appendChild(opt);
  });

  // Bind value
  input.value = selectedCategory;
}

// Populate Status Filters dynamically in control bar
function populateStatusFilters() {
  const filterSelect = document.getElementById("statusFilter");
  const previousVal = filterSelect.value;
  
  const defaultStatuses = ["Bình thường", "Đang mượn", "Thất lạc"];
  const userMetadata = currentUser?.user_metadata || {};
  const customStatuses = userMetadata.custom_statuses || [];
  
  const allStatuses = Array.from(new Set([...defaultStatuses, ...customStatuses])).filter(s => s && s.trim() !== "");
  
  filterSelect.innerHTML = `<option value="all">Tất cả trạng thái</option>`;
  allStatuses.forEach(status => {
    const opt = document.createElement("option");
    opt.value = status;
    opt.innerText = status;
    filterSelect.appendChild(opt);
  });
  
  filterSelect.value = previousVal;
}

// Populate Add/Edit Modal Status dropdown dynamically
function populateModalStatuses(selectedStatus = "Bình thường") {
  const statusSelect = document.getElementById("statusInput");
  const defaultStatuses = ["Bình thường", "Đang mượn", "Thất lạc"];
  const userMetadata = currentUser?.user_metadata || {};
  const customStatuses = userMetadata.custom_statuses || [];
  
  const allStatuses = Array.from(new Set([...defaultStatuses, ...customStatuses])).filter(s => s && s.trim() !== "");
  
  statusSelect.innerHTML = "";
  allStatuses.forEach(status => {
    const opt = document.createElement("option");
    opt.value = status;
    opt.innerText = status;
    statusSelect.appendChild(opt);
  });
  
  statusSelect.value = selectedStatus;
}

// 7. Supabase Database Operations (CRUD)

// Add / Update item submit handler
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById("assetIdInput").value;
  const name = document.getElementById("nameInput").value.trim();
  
  // Extract category from Datalist Input
  const category = document.getElementById("categoryInput").value.trim();

  const location = document.getElementById("locationInput").value.trim();
  const quantity = parseInt(document.getElementById("quantityInput").value, 10) || 1;
  const status = document.getElementById("statusInput").value;
  const notes = document.getElementById("notesInput").value.trim();

  if (!category) {
    alert("Vui lòng chọn hoặc điền thông tin danh mục!");
    return;
  }

  // Add currently logged in user ID to row
  const assetData = { 
    name, 
    category, 
    location, 
    quantity, 
    status, 
    notes, 
    user_id: currentUser.id,
    image_url: currentImageUrl || null
  };

  try {
    let result;
    if (id) {
      // Update Mode
      result = await supabase
        .from('assets')
        .update(assetData)
        .eq('id', id)
        .eq('user_id', currentUser.id);
    } else {
      // Create Mode
      result = await supabase
        .from('assets')
        .insert([assetData]);
    }

    if (result.error) throw result.error;

    closeModal();
    fetchAssets();
  } catch (err) {
    console.error("Save Asset Error:", err);
    if (err.message && err.message.includes("column \"image_url\"")) {
      alert("Không thể lưu tài sản. Có vẻ như cột 'image_url' chưa được tạo trong bảng 'assets' trên cơ sở dữ liệu Supabase.\n\nVui lòng mở mục SQL Editor trên trang quản lý Supabase của bạn và chạy lệnh sau:\n\nalter table assets add column image_url text;");
    } else {
      alert("Không thể lưu tài sản. Lỗi: " + err.message);
    }
  }
}

// Quick adjust quantity on card
async function updateQuantity(id, currentQty, change) {
  const newQty = currentQty + change;
  if (newQty < 1) return;

  try {
    // Optimistic UI update locally first for instant feedback feeling
    const itemIdx = localAssets.findIndex(i => i.id === id);
    if (itemIdx !== -1) {
      localAssets[itemIdx].quantity = newQty;
      renderAssets();
      updateStats();
    }

    const { error } = await supabase
      .from('assets')
      .update({ quantity: newQty })
      .eq('id', id)
      .eq('user_id', currentUser.id);

    if (error) throw error;
  } catch (err) {
    console.error("Update Quantity Error:", err);
    fetchAssets();
  }
}

// Quick toggle status cycles
async function cycleStatus(id, currentStatus) {
  const defaultStatuses = ["Bình thường", "Đang mượn", "Thất lạc"];
  const userMetadata = currentUser?.user_metadata || {};
  const customStatuses = userMetadata.custom_statuses || [];
  const statuses = Array.from(new Set([...defaultStatuses, ...customStatuses])).filter(s => s && s.trim() !== "");

  const currentIdx = statuses.indexOf(currentStatus);
  const nextStatus = statuses[currentIdx !== -1 ? (currentIdx + 1) % statuses.length : 0];

  try {
    // Optimistic UI updates
    const itemIdx = localAssets.findIndex(i => i.id === id);
    if (itemIdx !== -1) {
      localAssets[itemIdx].status = nextStatus;
      renderAssets();
      updateStats();
    }

    const { error } = await supabase
      .from('assets')
      .update({ status: nextStatus })
      .eq('id', id)
      .eq('user_id', currentUser.id);

    if (error) throw error;
  } catch (err) {
    console.error("Cycle Status Error:", err);
    fetchAssets();
  }
}

// Delete item
async function deleteItem(id, name) {
  if (!confirm(`Bạn có chắc chắn muốn xóa "${name}" không?`)) return;

  try {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id)
      .eq('user_id', currentUser.id);

    if (error) throw error;
    fetchAssets();
  } catch (err) {
    console.error("Delete Item Error:", err);
    alert("Xóa không thành công: " + err.message);
  }
}

// 8. Modals handling
function openAddModal() {
  document.getElementById("modalTitle").innerText = "Thêm món đồ mới";
  document.getElementById("assetIdInput").value = "";
  document.getElementById("assetForm").reset();
  
  // Populate categories and statuses
  populateModalCategories();
  populateModalStatuses("Bình thường");

  // Set default values
  document.getElementById("quantityInput").value = 1;
  
  // Reset image input values
  updateImagePreview("");
  switchImgTab("file");
  
  document.getElementById("assetModal").classList.remove("hidden");
}

function openEditModal(item) {
  document.getElementById("modalTitle").innerText = "Sửa thông tin đồ vật";
  document.getElementById("assetIdInput").value = item.id;
  document.getElementById("nameInput").value = item.name;
  
  // Populate categories and statuses list
  populateModalCategories(item.category);
  populateModalStatuses(item.status);

  document.getElementById("locationInput").value = item.location;
  document.getElementById("quantityInput").value = item.quantity;
  document.getElementById("notesInput").value = item.notes || "";

  // Set image if exists
  if (item.image_url) {
    updateImagePreview(item.image_url);
    if (item.image_url.startsWith("data:")) {
      switchImgTab("file");
      document.getElementById("imageUrlInput").value = "";
    } else {
      switchImgTab("url");
      document.getElementById("imageUrlInput").value = item.image_url;
    }
  } else {
    updateImagePreview("");
    switchImgTab("file");
  }

  document.getElementById("assetModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("assetModal").classList.add("hidden");
}

// Image handling helper functions
function switchImgTab(tab) {
  currentImgTab = tab;
  const tabFile = document.getElementById("imgTabFile");
  const tabUrl = document.getElementById("imgTabUrl");
  const fileGroup = document.getElementById("imgFileGroup");
  const urlGroup = document.getElementById("imgUrlGroup");

  if (tab === "file") {
    tabFile.classList.add("active");
    tabUrl.classList.remove("active");
    fileGroup.classList.remove("hidden");
    urlGroup.classList.add("hidden");
  } else {
    tabUrl.classList.add("active");
    tabFile.classList.remove("active");
    urlGroup.classList.remove("hidden");
    fileGroup.classList.add("hidden");
  }
}

function updateImagePreview(url) {
  const previewContainer = document.getElementById("imagePreviewContainer");
  const previewImg = document.getElementById("imagePreview");
  
  if (url) {
    previewImg.src = url;
    previewContainer.classList.remove("hidden");
    currentImageUrl = url;
  } else {
    previewImg.src = "";
    previewContainer.classList.add("hidden");
    currentImageUrl = "";
    document.getElementById("imageFileInput").value = "";
    document.getElementById("imageUrlInput").value = "";
  }
}

function processImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        // Limit dimensions to 500x500 to keep Base64 size compact in Database
        const maxW = 500;
        const maxH = 500;
        let width = img.width;
        let height = img.height;

        if (width > maxW || height > maxH) {
          if (width > height) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          } else {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to medium quality JPEG (0.7) to minimize storage footprint
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error("Không thể tải hình ảnh."));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error("Không thể đọc tệp tin."));
    reader.readAsDataURL(file);
  });
}

// Profile and settings modal handling
let tempCustomCategories = [];
let tempCustomStatuses = [];

function openProfileModal() {
  if (!currentUser) return;
  
  const userMetadata = currentUser.user_metadata || {};
  document.getElementById("profileDisplayNameInput").value = userMetadata.display_name || "";
  
  // Clone current categories and statuses
  tempCustomCategories = [...(userMetadata.custom_categories || [])];
  tempCustomStatuses = [...(userMetadata.custom_statuses || [])];
  
  // Render current tags
  renderCustomCategoriesList();
  renderCustomStatusesList();
  
  document.getElementById("profileModal").classList.remove("hidden");
}

function closeProfileModal() {
  document.getElementById("profileModal").classList.add("hidden");
}

function renderCustomCategoriesList() {
  const container = document.getElementById("customCategoriesList");
  container.innerHTML = "";
  
  if (tempCustomCategories.length === 0) {
    container.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-secondary); font-style: italic;">Chưa có danh mục tự chọn nào.</span>`;
    return;
  }
  
  tempCustomCategories.forEach(cat => {
    const tag = document.createElement("span");
    tag.className = "custom-tag";
    tag.innerHTML = `${escapeHtml(cat)} <span class="custom-tag-remove" data-val="${escapeHtml(cat)}">&times;</span>`;
    container.appendChild(tag);
  });
}

function renderCustomStatusesList() {
  const container = document.getElementById("customStatusesList");
  container.innerHTML = "";
  
  if (tempCustomStatuses.length === 0) {
    container.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-secondary); font-style: italic;">Chưa có trạng thái tự chọn nào.</span>`;
    return;
  }
  
  tempCustomStatuses.forEach(status => {
    const tag = document.createElement("span");
    tag.className = "custom-tag";
    tag.innerHTML = `${escapeHtml(status)} <span class="custom-tag-remove" data-val="${escapeHtml(status)}">&times;</span>`;
    container.appendChild(tag);
  });
}

async function handleProfileSubmit(e) {
  e.preventDefault();
  
  const displayName = document.getElementById("profileDisplayNameInput").value.trim();
  const saveBtn = document.getElementById("saveProfileBtn");
  
  saveBtn.disabled = true;
  saveBtn.innerText = "Đang lưu...";
  
  try {
    const { data: { user }, error } = await supabase.auth.updateUser({
      data: {
        display_name: displayName || null,
        custom_categories: tempCustomCategories,
        custom_statuses: tempCustomStatuses
      }
    });
    
    if (error) throw error;
    
    currentUser = user;
    closeProfileModal();
    
    // Refresh display
    showDashboard(currentUser);
    alert("Cập nhật hồ sơ và thiết lập thành công!");
  } catch (err) {
    console.error("Save Profile Error:", err);
    alert("Không thể cập nhật hồ sơ: " + err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerText = "Lưu Thay Đổi";
  }
}

// 9. Themes and Helper utilities
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    document.body.classList.remove("light-mode");
  } else {
    document.body.classList.add("light-mode");
    document.body.classList.remove("dark-mode");
  }
}

function toggleTheme() {
  if (document.body.classList.contains("dark-mode")) {
    document.body.classList.remove("dark-mode");
    document.body.classList.add("light-mode");
    localStorage.setItem("theme", "light");
  } else {
    document.body.classList.add("dark-mode");
    document.body.classList.remove("light-mode");
    localStorage.setItem("theme", "dark");
  }
}

// HTML XSS Escaping Helper
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 10. AUTHENTICATION MODULE

function switchAuthTab(tab) {
  currentAuthTab = tab;
  const tabSignIn = document.getElementById("tabSignIn");
  const tabSignUp = document.getElementById("tabSignUp");
  const submitBtn = document.getElementById("authSubmitBtn");
  const errorMsg = document.getElementById("authErrorMsg");
  const successMsg = document.getElementById("authSuccessMsg");

  errorMsg.classList.add("hidden");
  successMsg.classList.add("hidden");

  if (tab === "signin") {
    tabSignIn.classList.add("active");
    tabSignUp.classList.remove("active");
    submitBtn.innerText = "Đăng Nhập";
  } else {
    tabSignUp.classList.add("active");
    tabSignIn.classList.remove("active");
    submitBtn.innerText = "Đăng Ký Tài Khoản";
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const submitBtn = document.getElementById("authSubmitBtn");
  const errorMsg = document.getElementById("authErrorMsg");
  const successMsg = document.getElementById("authSuccessMsg");

  errorMsg.classList.add("hidden");
  successMsg.classList.add("hidden");
  submitBtn.disabled = true;

  try {
    if (currentAuthTab === "signin") {
      // Log In
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } else {
      // Sign Up
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      
      successMsg.innerText = "Đăng ký thành công! Bạn hãy kiểm tra hộp thư email để xác nhận tài khoản nếu Supabase yêu cầu kích hoạt.";
      successMsg.classList.remove("hidden");
    }
  } catch (err) {
    console.error("Authentication Error:", err);
    errorMsg.innerText = err.message || "Đã xảy ra lỗi khi kết nối Auth.";
    errorMsg.classList.remove("hidden");
  } finally {
    submitBtn.disabled = false;
  }
}

async function handleSignOut() {
  if (!supabase) return;
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (err) {
    console.error("Sign Out Error:", err);
    alert("Đăng xuất không thành công: " + err.message);
  }
}

function showDashboard(user) {
  document.getElementById("authContainer").classList.add("hidden");
  document.getElementById("appContainer").classList.remove("hidden");
  const displayName = user.user_metadata?.display_name;
  document.getElementById("userEmailText").innerText = displayName ? `${displayName} (${user.email})` : user.email;
  fetchAssets();
}

function showAuthScreen() {
  document.getElementById("appContainer").classList.add("hidden");
  document.getElementById("authContainer").classList.remove("hidden");
  document.getElementById("authForm").reset();
  switchAuthTab("signin");
}

async function listenToAuthChanges() {
  if (!supabase) return;

  // Listen to auth events
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      currentUser = session.user;
      showDashboard(currentUser);
    } else {
      currentUser = null;
      showAuthScreen();
    }
  });

  // Get active session
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    showDashboard(currentUser);
  } else {
    showAuthScreen();
  }
}

// 11. Neuron Background Animation
function initBgAnimation() {
  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let particles = [];
  const maxParticles = 65;
  const maxDistance = 115;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Create particles
  for (let i = 0; i < maxParticles; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 1.2
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isDark = document.body.classList.contains("dark-mode");
    const nodeColor = isDark ? "rgba(168, 85, 247, 0.45)" : "rgba(124, 58, 237, 0.35)";
    const lineColorBase = isDark ? "168, 85, 247" : "124, 58, 237";

    // Update particles positions
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      // Bounce off boundaries
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    });

    // Draw nodes and links
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];

      // Draw dot node
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
      ctx.fill();

      // Check distance for lines
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        
        if (dist < maxDistance) {
          const alpha = (1 - dist / maxDistance) * 0.12;
          ctx.strokeStyle = `rgba(${lineColorBase}, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

// 12. Event Bindings on Load
function startApp() {
  initTheme();
  initBgAnimation();
  
  const connected = initSupabase();
  if (connected) {
    listenToAuthChanges();
  }

  // Header Theme button
  document.getElementById("themeToggleBtn").addEventListener("click", toggleTheme);

  // Filters inputs
  document.getElementById("searchInput").addEventListener("input", renderAssets);
  document.getElementById("categoryFilter").addEventListener("change", renderAssets);
  document.getElementById("statusFilter").addEventListener("change", renderAssets);

  // Modals buttons
  document.getElementById("openAddModalBtn").addEventListener("click", openAddModal);
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  document.getElementById("cancelModalBtn").addEventListener("click", closeModal);
  
  // Submit modal form
  document.getElementById("assetForm").addEventListener("submit", handleFormSubmit);

  // Close modal when clicking outside form card
  document.getElementById("assetModal").addEventListener("click", (e) => {
    if (e.target.id === "assetModal") {
      closeModal();
    }
  });

  // Image tab triggers
  document.getElementById("imgTabFile").addEventListener("click", () => switchImgTab("file"));
  document.getElementById("imgTabUrl").addEventListener("click", () => switchImgTab("url"));
  
  // File input change listener (with client-side compression)
  document.getElementById("imageFileInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const base64 = await processImageFile(file);
      updateImagePreview(base64);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xử lý hình ảnh: " + err.message);
    }
  });

  // URL input text change listener
  document.getElementById("imageUrlInput").addEventListener("input", (e) => {
    const url = e.target.value.trim();
    if (url) {
      updateImagePreview(url);
    } else {
      updateImagePreview("");
    }
  });

  // Remove image preview button listener
  document.getElementById("removeImageBtn").addEventListener("click", () => {
    updateImagePreview("");
  });

  // Profile settings listeners
  document.getElementById("openProfileModalBtn").addEventListener("click", openProfileModal);
  document.getElementById("closeProfileModalBtn").addEventListener("click", closeProfileModal);
  document.getElementById("cancelProfileBtn").addEventListener("click", closeProfileModal);
  document.getElementById("profileForm").addEventListener("submit", handleProfileSubmit);

  // Close profile modal when clicking outside card
  document.getElementById("profileModal").addEventListener("click", (e) => {
    if (e.target.id === "profileModal") {
      closeProfileModal();
    }
  });

  // Custom Category list actions
  document.getElementById("addCategoryBtn").addEventListener("click", () => {
    const input = document.getElementById("newCategoryInput");
    const val = input.value.trim();
    if (val) {
      if (tempCustomCategories.includes(val)) {
        alert("Danh mục này đã tồn tại!");
        return;
      }
      tempCustomCategories.push(val);
      renderCustomCategoriesList();
      input.value = "";
    }
  });

  document.getElementById("customCategoriesList").addEventListener("click", (e) => {
    if (e.target.classList.contains("custom-tag-remove")) {
      const val = e.target.getAttribute("data-val");
      tempCustomCategories = tempCustomCategories.filter(c => c !== val);
      renderCustomCategoriesList();
    }
  });

  // Custom Status list actions
  document.getElementById("addStatusBtn").addEventListener("click", () => {
    const input = document.getElementById("newStatusInput");
    const val = input.value.trim();
    if (val) {
      if (tempCustomStatuses.includes(val)) {
        alert("Trạng thái này đã tồn tại!");
        return;
      }
      tempCustomStatuses.push(val);
      renderCustomStatusesList();
      input.value = "";
    }
  });

  document.getElementById("customStatusesList").addEventListener("click", (e) => {
    if (e.target.classList.contains("custom-tag-remove")) {
      const val = e.target.getAttribute("data-val");
      tempCustomStatuses = tempCustomStatuses.filter(s => s !== val);
      renderCustomStatusesList();
    }
  });

  // Auth screen triggers
  document.getElementById("tabSignIn").addEventListener("click", () => switchAuthTab("signin"));
  document.getElementById("tabSignUp").addEventListener("click", () => switchAuthTab("signup"));
  document.getElementById("authForm").addEventListener("submit", handleAuthSubmit);
  document.getElementById("signOutBtn").addEventListener("click", handleSignOut);

}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
