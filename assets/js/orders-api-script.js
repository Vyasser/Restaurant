// ====================================
// Orders Admin Script - مع Google Sheets API (نسخة محدثة - FormData)
// ====================================

// ⚠️ هام: استبدل هذا الرابط برابط Web App الخاص بك من Google Apps Script
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwNOjMh91cF5BOrF3avqIRhrk2dV-Ojbjd67WwsEEbV0EvfEcKbI5xWjtpRTEpuRftfiA/exec";
// متغير للتحديث التلقائي
let autoRefreshEnabled = true; 

// Preloader
window.addEventListener('load', function() {
    const preloader = document.querySelector('[data-preload]');
    if (preloader) preloader.classList.add('loaded');
    
    // تحميل الطلبات عند تحميل الصفحة
    loadOrders();
});

// Status Labels (Arabic)
const statusLabels = {
    pending: 'قيد الانتظار',
    preparing: 'قيد التحضير',
    ready: 'جاهز للتسليم',
    completed: 'مكتمل',
    cancelled: 'ملغي'
};

// Current Filter
let currentFilter = 'all';

// Orders Array
let allOrders = [];

// ====================================
// تحميل الطلبات من Google Sheets
// ====================================

async function loadOrders() {
    showLoadingIndicator(true);
    
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getAllOrders`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error(`خطأ في الشبكة: ${response.status}`);
        }
        
        const text = await response.text();
        
        try {
            const data = JSON.parse(text);
            
            if (data.success) {
                // تحويل البيانات من Google Sheets إلى التنسيق المطلوب
                allOrders = convertGoogleSheetsData(data.data.orders);
                
                // عرض الطلبات
                renderOrders(currentFilter);
                updateStats();
            } else {
                throw new Error(data.message || 'فشل في تحميل الطلبات');
            }
        } catch (parseError) {
            // إذا كانت الاستجابة HTML
            if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
                throw new Error('الرجاء التحقق من أن Web App منشور بشكل صحيح');
            }
            throw parseError;
        }
    } catch (error) {
        console.error('خطأ في تحميل الطلبات:', error);
        showAlert('عذراً، حدث خطأ في تحميل الطلبات: ' + error.message, 'error');
        
        // عرض حالة فارغة
        renderOrders('all');
    } finally {
        showLoadingIndicator(false);
    }
}

// تحويل بيانات Google Sheets إلى التنسيق المطلوب
function convertGoogleSheetsData(orders) {
    return orders.map(order => {
        return {
            id: order['رقم الطلب'],
            customer: order['اسم العميل'],
            phone: order['رقم الهاتف'],
            address: order['العنوان'],
            status: order['الحالة'],
            items: order.items || [],
            total: order['الإجمالي'],
            time: formatTime(order['تاريخ الطلب']),
            type: order['نوع الطلب'],
            specialInstructions: order['ملاحظات خاصة']
        };
    });
}

// تنسيق الوقت
function formatTime(dateString) {
    if (!dateString) return '--';
    
    try {
        const date = new Date(dateString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (error) {
        return '--';
    }
}

// ====================================
// عرض الطلبات
// ====================================

function renderOrders(filter = 'all') {
    const grid = document.getElementById('ordersGrid');
    const filteredOrders = filter === 'all' 
        ? allOrders 
        : allOrders.filter(o => o.status === filter);
    
    if (filteredOrders.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🍕</div>
                <p class="empty-text">لا توجد طلبات في هذه الفئة</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredOrders.map((order, index) => `
        <div class="order-card" style="animation-delay: ${index * 0.1}s">
            <div class="order-header">
                <div class="order-number">#${order.id}</div>
                <div class="status-badge status-${order.status}">
                    ${statusLabels[order.status] || order.status}
                </div>
            </div>
            
            <div class="order-details">
                <div class="detail-row">
                    <span class="detail-label">العميل</span>
                    <span class="detail-value">${order.customer}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">الهاتف</span>
                    <span class="detail-value">${order.phone}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">نوع الطلب</span>
                    <span class="detail-value">${order.type}</span>
                </div>
                ${order.address && order.address !== 'لا يوجد' ? `
                <div class="detail-row">
                    <span class="detail-label">العنوان</span>
                    <span class="detail-value">${order.address}</span>
                </div>
                ` : ''}
            </div>

            <div class="items-list">
                <div class="items-title">الأصناف المطلوبة</div>
                ${order.items.map(item => `
                    <div class="item">
                        <span class="item-name">${item.name}</span>
                        <span class="item-qty">×${item.qty}</span>
                    </div>
                `).join('')}
            </div>

            ${order.specialInstructions && order.specialInstructions !== 'لا يوجد' ? `
            <div class="special-notes">
                <strong>ملاحظات:</strong> ${order.specialInstructions}
            </div>
            ` : ''}

            <div class="total-price">
                <div class="price-label">الإجمالي</div>
                <div class="price-value">${order.total.toLocaleString('ar-DZ')} دج</div>
            </div>

            <div class="time-badge">
                <span>⏰</span>
                <span>${order.time}</span>
            </div>

            <div class="action-buttons">
                ${order.status === 'pending' ? `
                    <button class="btn btn-accept" onclick="updateStatus('${order.id}', 'preparing')">
                        قبول الطلب
                    </button>
                    <button class="btn btn-reject" onclick="updateStatus('${order.id}', 'cancelled')">
                        رفض
                    </button>
                ` : ''}
                ${order.status === 'preparing' ? `
                    <button class="btn btn-complete" onclick="updateStatus('${order.id}', 'ready')">
                        تم التحضير
                    </button>
                ` : ''}
                ${order.status === 'ready' ? `
                    <button class="btn btn-complete" onclick="updateStatus('${order.id}', 'completed')">
                        تم التسليم ✓
                    </button>
                ` : ''}
                ${order.status === 'completed' || order.status === 'cancelled' ? `
                    <button class="btn btn-reject" onclick="deleteOrder('${order.id}')">
                        حذف
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// ====================================
// تحديث حالة الطلب (باستخدام FormData)
// ====================================

async function updateStatus(orderNumber, status) {
    try {
        // إنشاء FormData
        const formData = new FormData();
        formData.append('action', 'updateOrderStatus');
        formData.append('orderId', orderNumber);
        formData.append('newStatus', status);
        
        // إرسال الطلب
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: formData
        });
        
        // قراءة الاستجابة
        const text = await response.text();
        
        try {
            const result = JSON.parse(text);
            
            if (result.success) {
                // استخدام SweetAlert إذا كان متاحاً
                if (typeof Swal !== 'undefined') {
                    Swal.fire('تم ✅', result.message, 'success');
                } else {
                    showNotification('تم تحديث حالة الطلب بنجاح');
                }
                
                // إعادة تحميل الطلبات
                await loadOrders();
            } else {
                throw new Error(result.message || 'فشل في تحديث الحالة');
            }
        } catch (parseError) {
            // إذا كانت الاستجابة HTML
            if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
                throw new Error('الرجاء التحقق من أن Web App منشور بشكل صحيح');
            }
            
            // نفترض النجاح إذا لم نستطع قراءة الاستجابة
            showNotification('تم تحديث حالة الطلب');
            await loadOrders();
        }
        
    } catch (err) {
        console.error(err);
        if (typeof Swal !== 'undefined') {
            Swal.fire('خطأ ❌', 'فشل في تحديث حالة الطلب: ' + err.message, 'error');
        } else {
            showAlert('فشل في تحديث حالة الطلب: ' + err.message, 'error');
        }
    }
}

// ====================================
// حذف الطلب (باستخدام FormData)
// ====================================

async function deleteOrder(orderId) {
    // استخدام SweetAlert لتأكيد أفضل
    let confirmed = true;
    
    if (typeof Swal !== 'undefined') {
        const result = await Swal.fire({
            title: `حذف الطلب #${orderId}`,
            text: 'هل أنت متأكد؟ هذا الإجراء لا يمكن التراجع عنه.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        });
        confirmed = result.isConfirmed;
    } else {
        confirmed = confirm(`هل أنت متأكد من حذف الطلب #${orderId}؟`);
    }
    
    if (!confirmed) return;
    
    showLoadingIndicator(true);
    
    try {
        // إنشاء FormData
        const formData = new FormData();
        formData.append('action', 'deleteOrder');
        formData.append('orderNumber', orderId);
        
        // إرسال الطلب
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: formData
        });
        
        // قراءة الاستجابة
        const text = await response.text();
        
        try {
            const data = JSON.parse(text);
            
            if (data.success) {
                showNotification(`تم حذف الطلب #${orderId}`);
                await loadOrders();
            } else {
                throw new Error(data.message || 'فشل في حذف الطلب');
            }
        } catch (parseError) {
            // إذا كانت الاستجابة HTML
            if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
                throw new Error('الرجاء التحقق من أن Web App منشور بشكل صحيح');
            }
            
            // نفترض النجاح
            showNotification(`تم حذف الطلب #${orderId}`);
            await loadOrders();
        }
    } catch (error) {
        console.error('خطأ في حذف الطلب:', error);
        showAlert('عذراً، حدث خطأ في حذف الطلب: ' + error.message, 'error');
    } finally {
        showLoadingIndicator(false);
    }
}

// ====================================
// تحديث الإحصائيات
// ====================================

function updateStats() {
    document.getElementById('newOrders').textContent = 
        allOrders.filter(o => o.status === 'pending').length;
    document.getElementById('preparingOrders').textContent = 
        allOrders.filter(o => o.status === 'preparing').length;
    document.getElementById('readyOrders').textContent = 
        allOrders.filter(o => o.status === 'ready').length;
    document.getElementById('totalOrders').textContent = 
        allOrders.length;
}

// ====================================
// عرض الإشعارات
// ====================================

function showNotification(message) {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

function showAlert(message, type = 'info') {
    // استخدام SweetAlert إذا كان متاحاً
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: type === 'error' ? 'خطأ' : 'تنبيه',
            text: message,
            icon: type === 'error' ? 'error' : 'info',
            confirmButtonText: 'موافق'
        });
    } else {
        alert(message);
    }
}

// ====================================
// مؤشر التحميل
// ====================================

function showLoadingIndicator(show) {
    const grid = document.getElementById('ordersGrid');
    
    if (show) {
        grid.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>جاري التحميل...</p>
            </div>
        `;
    }
}

// ====================================
// أزرار التصفية
// ====================================

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        renderOrders(currentFilter);
    });
});

// ====================================
// التحديث التلقائي
// ====================================

// إعادة تحميل الطلبات كل 30 ثانية إذا كان مفعلاً
let refreshInterval = setInterval(() => {
    if (autoRefreshEnabled) {
        loadOrders();
    }
}, 30000);

// زر التحديث اليدوي
function refreshOrders() {
    loadOrders();
}

// دالة لتعطيل/تفعيل التحديث التلقائي
function toggleAutoRefresh() {
    autoRefreshEnabled = !autoRefreshEnabled;
    if (autoRefreshEnabled) {
        refreshInterval = setInterval(() => loadOrders(), 30000);
        showNotification('تم تفعيل التحديث التلقائي');
    } else {
        clearInterval(refreshInterval);
        showNotification('تم تعطيل التحديث التلقائي');
    }
}

// ====================================
// CSS للتحميل
// ====================================

// إضافة CSS لمؤشر التحميل
const style = document.createElement('style');
style.textContent = `
    .loading-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 100px 20px;
    }
    
    .loading-spinner {
        width: 60px;
        height: 60px;
        border: 4px solid var(--white-alpha-10);
        border-top-color: var(--gold-crayola);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .loading-state p {
        font-family: var(--fontFamily-forum);
        font-size: 2rem;
        color: var(--gold-crayola);
    }
    
    .special-notes {
        background: var(--eerie-black-4);
        padding: 15px;
        border-radius: 5px;
        margin: 15px 0;
        font-size: 1.4rem;
        color: var(--quick-silver);
        border-right: 3px solid var(--gold-crayola);
    }
    
    .special-notes strong {
        color: var(--gold-crayola);
        display: block;
        margin-bottom: 5px;
    }
`;
document.head.appendChild(style);
