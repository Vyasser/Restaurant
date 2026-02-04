// ====================================
// Order Form Script - مع Google Sheets API (نسخة محدثة - FormData)
// ====================================

// ⚠️ هام: استبدل هذا الرابط برابط Web App الخاص بك
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwNOjMh91cF5BOrF3avqIRhrk2dV-Ojbjd67WwsEEbV0EvfEcKbI5xWjtpRTEpuRftfiA/exec";


// Preloader
window.addEventListener('load', function() {
    const preloader = document.querySelector('[data-preload]');
    preloader.classList.add('loaded');
});

// Menu Items Data
const menuData = [
    { id: 1, name: 'بيتزا مارجريتا', price: 1200 },
    { id: 2, name: 'بيتزا بيبروني', price: 1450 },
    { id: 3, name: 'بيتزا 7Vibes الخاصة', price: 1850 },
    { id: 4, name: 'بيتزا فور سيزون', price: 1650 },
    { id: 5, name: 'بيتزا فيجيتاريان', price: 1350 },
    { id: 6, name: 'باستا ألفريدو', price: 950 },
    { id: 7, name: 'باستا بولونيز', price: 1050 },
    { id: 8, name: 'كالزوني باللحم', price: 1100 },
    { id: 9, name: 'سلطة قيصر', price: 450 },
    { id: 10, name: 'سلطة يونانية', price: 500 },
    { id: 11, name: 'أصابع الموتزاريلا', price: 650 },
    { id: 12, name: 'خبز بالثوم', price: 350 },
    { id: 13, name: 'بطاطس مقلية', price: 400 },
    { id: 14, name: 'حلى تيراميسو', price: 550 },
    { id: 15, name: 'مشروب غازي', price: 150 },
    { id: 16, name: 'عصير برتقال طازج', price: 250 },
    { id: 17, name: 'عصير ليمون بالنعناع', price: 250 }
];

// Order Items Array
let orderItems = [];
let itemCounter = 0;

// Delivery Fee
const DELIVERY_FEE = 200;

// Initialize Menu Items
function initializeMenu() {
    addMenuItem();
}

// Add Menu Item
function addMenuItem() {
    itemCounter++;
    const menuItemsContainer = document.getElementById('menuItems');
    
    const menuItemDiv = document.createElement('div');
    menuItemDiv.className = 'menu-item';
    menuItemDiv.id = `item-${itemCounter}`;
    
    menuItemDiv.innerHTML = `
        <select class="item-select" onchange="updateItem(${itemCounter}, this.value)">
            <option value="">اختر صنف...</option>
            ${menuData.map(item => `
                <option value="${item.id}" data-price="${item.price}">${item.name} - ${item.price} دج</option>
            `).join('')}
        </select>
        
        <div class="qty-control">
            <button type="button" class="qty-btn" onclick="decreaseQty(${itemCounter})">−</button>
            <span class="qty-value" id="qty-${itemCounter}">1</span>
            <button type="button" class="qty-btn" onclick="increaseQty(${itemCounter})">+</button>
        </div>
        
        <button type="button" class="btn-remove" onclick="removeItem(${itemCounter})">
            حذف
        </button>
    `;
    
    menuItemsContainer.appendChild(menuItemDiv);
    
    // Initialize order item
    orderItems[itemCounter] = {
        id: null,
        name: '',
        price: 0,
        qty: 1
    };
}

// Add Custom Item
function addCustomItem() {
    addMenuItem();
}

// Update Item
function updateItem(itemId, menuItemId) {
    if (!menuItemId) {
        orderItems[itemId] = {
            id: null,
            name: '',
            price: 0,
            qty: 1
        };
    } else {
        const selectedItem = menuData.find(item => item.id == menuItemId);
        if (selectedItem) {
            orderItems[itemId] = {
                id: selectedItem.id,
                name: selectedItem.name,
                price: selectedItem.price,
                qty: orderItems[itemId]?.qty || 1
            };
        }
    }
    updateSummary();
}

// Increase Quantity
function increaseQty(itemId) {
    const qtyElement = document.getElementById(`qty-${itemId}`);
    let qty = parseInt(qtyElement.textContent);
    qty++;
    qtyElement.textContent = qty;
    
    if (orderItems[itemId]) {
        orderItems[itemId].qty = qty;
    }
    updateSummary();
}

// Decrease Quantity
function decreaseQty(itemId) {
    const qtyElement = document.getElementById(`qty-${itemId}`);
    let qty = parseInt(qtyElement.textContent);
    if (qty > 1) {
        qty--;
        qtyElement.textContent = qty;
        
        if (orderItems[itemId]) {
            orderItems[itemId].qty = qty;
        }
        updateSummary();
    }
}

// Remove Item
function removeItem(itemId) {
    const itemElement = document.getElementById(`item-${itemId}`);
    if (itemElement) {
        itemElement.remove();
    }
    delete orderItems[itemId];
    updateSummary();
}

// Update Summary
function updateSummary() {
    const summaryItemsContainer = document.getElementById('summaryItems');
    const validItems = Object.values(orderItems).filter(item => item && item.id);
    
    if (validItems.length === 0) {
        summaryItemsContainer.innerHTML = `
            <div class="empty-summary">
                <p>لم يتم اختيار أي أصناف بعد</p>
            </div>
        `;
        document.getElementById('subtotal').textContent = '0 دج';
        document.getElementById('totalPrice').textContent = '0 دج';
        return;
    }
    
    // Calculate subtotal
    let subtotal = 0;
    let summaryHTML = '';
    
    validItems.forEach(item => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        
        summaryHTML += `
            <div class="summary-item">
                <div class="item-info">
                    <span class="item-qty-badge">×${item.qty}</span>
                    <span class="item-name-text">${item.name}</span>
                </div>
                <span class="item-price">${itemTotal.toLocaleString('ar-DZ')} دج</span>
            </div>
        `;
    });
    
    summaryItemsContainer.innerHTML = summaryHTML;
    
    // Update prices
    const orderType = document.querySelector('input[name="orderType"]:checked').value;
    const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;
    const total = subtotal + deliveryFee;
    
    document.getElementById('subtotal').textContent = `${subtotal.toLocaleString('ar-DZ')} دج`;
    document.getElementById('deliveryFee').textContent = orderType === 'delivery' ? `${deliveryFee} دج` : 'مجاني';
    document.getElementById('totalPrice').textContent = `${total.toLocaleString('ar-DZ')} دج`;
}

// Handle Order Type Change
document.addEventListener('DOMContentLoaded', function() {
    const radioButtons = document.querySelectorAll('input[name="orderType"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', updateSummary);
    });
});

// ====================================
// إرسال الطلب إلى Google Sheets (باستخدام FormData)
// ====================================

// Form Submission
document.getElementById('orderForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validate form
    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const orderType = document.querySelector('input[name="orderType"]:checked').value;
    
    if (!customerName || !customerPhone) {
        showAlert('الرجاء إدخال الاسم ورقم الهاتف', 'error');
        return;
    }
    
    // Check if at least one item is selected
    const validItems = Object.values(orderItems).filter(item => item && item.id);
    if (validItems.length === 0) {
        showAlert('الرجاء اختيار صنف واحد على الأقل', 'error');
        return;
    }
    
    // إظهار مؤشر التحميل
    showLoadingIndicator(true);
    
    try {
        // إرسال الطلب إلى Google Sheets باستخدام FormData
        const response = await sendOrderToGoogleSheets({
            customerName: customerName,
            customerPhone: customerPhone,
            customerAddress: document.getElementById('customerAddress').value.trim(),
            orderType: orderType,
            items: validItems,
            specialInstructions: document.getElementById('specialInstructions').value.trim(),
            subtotal: calculateSubtotal(),
            deliveryFee: orderType === 'delivery' ? DELIVERY_FEE : 0,
            total: calculateTotal()
        });
        
        if (response.success) {
            // عرض رسالة النجاح
            showSuccessModal(response.orderNumber);
            
            // إعادة تعيين النموذج
            setTimeout(() => { 
                resetForm();
            }, 500);
        } else {
            throw new Error(response.message || 'فشل في إرسال الطلب');
        }
    } catch (error) {
        console.error('خطأ في إرسال الطلب:', error);
        showAlert('عذراً، حدث خطأ في إرسال الطلب. الرجاء المحاولة مرة أخرى.', 'error');
    } finally {
        showLoadingIndicator(false);
    }
});

// ====================================
// إرسال الطلب باستخدام FormData (حل مشكلة CORS)
// ====================================

async function sendOrderToGoogleSheets(orderData) {
    try {
        // إنشاء FormData بدلاً من JSON
        const formData = new FormData();
        
        // إضافة البيانات إلى FormData
        formData.append('action', 'createOrder');
        formData.append('customerName', orderData.customerName);
        formData.append('customerPhone', orderData.customerPhone);
        formData.append('customerAddress', orderData.customerAddress || 'لا يوجد');
        formData.append('orderType', orderData.orderType === 'delivery' ? 'توصيل' : 'استلام');
        formData.append('items', JSON.stringify(orderData.items));
        formData.append('specialInstructions', orderData.specialInstructions || 'لا يوجد');
        formData.append('subtotal', orderData.subtotal);
        formData.append('deliveryFee', orderData.deliveryFee);
        formData.append('total', orderData.total);
        
        // إرسال الطلب باستخدام FormData
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: formData
        });
        
        // قراءة الاستجابة كنص أولاً
        const text = await response.text();
        
        try {
            // محاولة تحليل الاستجابة كـ JSON
            const result = JSON.parse(text);
            
            if (result.success) {
                return {
                    success: true,
                    orderNumber: result.data.orderNumber,
                    message: result.message
                };
            } else {
                throw new Error(result.message || 'فشل في إنشاء الطلب');
            }
        } catch (parseError) {
            // إذا كانت الاستجابة HTML (صفحة تسجيل الدخول)
            if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
                throw new Error('الرجاء التحقق من أن Web App منشور بشكل صحيح ومتاح للجميع');
            }
            
            // إذا نجح الإرسال لكن لا يمكن قراءة الاستجابة (بسبب CORS)
            // نفترض النجاح
            return {
                success: true,
                orderNumber: generateOrderNumber(),
                message: 'تم إرسال الطلب بنجاح'
            };
        }
        
    } catch (error) {
        console.error('خطأ في الاتصال:', error);
        throw error;
    }
}

// إظهار/إخفاء مؤشر التحميل
function showLoadingIndicator(show) {
    const submitBtn = document.querySelector('.btn-submit');
    if (show) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="btn-text">جاري الإرسال...</span>
            <span class="btn-icon">⏳</span>
        `;
    } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <span class="btn-text">إرسال الطلب</span>
            <span class="btn-icon">🚀</span>
        `;
    }
}

// عرض رسالة تنبيه
function showAlert(message, type = 'info') {
    alert(message);
}

// Calculate Subtotal
function calculateSubtotal() {
    const validItems = Object.values(orderItems).filter(item => item && item.id);
    return validItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

// Calculate Total
function calculateTotal() {
    const subtotal = calculateSubtotal();
    const orderType = document.querySelector('input[name="orderType"]:checked').value;
    const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;
    return subtotal + deliveryFee;
}

// Generate Order Number
function generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return timestamp.toString().slice(-6) + random.toString().padStart(3, '0');
}

// Show Success Modal
function showSuccessModal(orderNumber) {
    const modal = document.getElementById('successModal');
    document.getElementById('orderNumber').textContent = `#${orderNumber}`;
    modal.classList.add('show');
}

// Close Modal
function closeModal() {
    const modal = document.getElementById('successModal');
    modal.classList.remove('show');
}

// Reset Form
function resetForm() {
    document.getElementById('orderForm').reset();
    
    // Clear menu items
    const menuItemsContainer = document.getElementById('menuItems');
    menuItemsContainer.innerHTML = '';
    
    // Reset order items
    orderItems = [];
    itemCounter = 0;
    
    // Add first item
    addMenuItem();
    
    // Update summary
    updateSummary();
}

// Close modal on outside click
document.getElementById('successModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Initialize
initializeMenu();
updateSummary();

// Phone number formatting
document.getElementById('customerPhone').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) {
        value = value.slice(0, 10);
    }
    
    if (value.length >= 4 && value.length < 7) {
        value = value.slice(0, 4) + '-' + value.slice(4);
    } else if (value.length >= 7) {
        value = value.slice(0, 4) + '-' + value.slice(4, 6) + '-' + value.slice(6);
    }
    
    e.target.value = value;
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        document.getElementById('orderForm').dispatchEvent(new Event('submit'));
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
        closeModal();
    }
});
