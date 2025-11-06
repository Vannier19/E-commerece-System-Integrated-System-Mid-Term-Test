// api yang dipake
const FAKE_STORE_API = 'https://fakestoreapi.com';
const NAGER_DATE_API = 'https://date.nager.at/api/v3';
const NOMINATIM_API = 'https://nominatim.openstreetmap.org';

// variabel global
let semuaProduk = [];
let kategori = [];
let keranjang = [];
let kategoriSekarang = 'all';
let holidays = [];
let peta = null;
let produkFlashSale = [];

// daftar toko
const daftarToko = [
    { name: "FakeShopee Jakarta Pusat", city: "Jakarta", lat: -6.2088, lon: 106.8456 },
    { name: "FakeShopee Bandung Mall", city: "Bandung", lat: -6.9175, lon: 107.6191 },
    { name: "FakeShopee Surabaya Plaza", city: "Surabaya", lat: -7.2575, lon: 112.7521 },
    { name: "FakeShopee Yogyakarta Store", city: "Yogyakarta", lat: -7.7956, lon: 110.3695 },
    { name: "FakeShopee Semarang Hub", city: "Semarang", lat: -6.9667, lon: 110.4167 }
];

// mulai saat page load
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    try {
        await Promise.all([
            loadProduk(),
            loadKategori(),
            loadHariLibur('ID', new Date().getFullYear())
        ]);

        setupListeners();
        mulaiCountdown();
    } catch (error) {
        console.error('Error:', error);
    }
}

function setupListeners() {
    // filter kategori
    document.getElementById('categoryList').addEventListener('click', (e) => {
        const btn = e.target.closest('.category-btn');
        if (btn) {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            kategoriSekarang = btn.dataset.category;
            filterDanTampilkanProduk();
        }
    });

    document.getElementById('sortFilter').addEventListener('change', filterDanTampilkanProduk);

    document.getElementById('countrySelector').addEventListener('change', (e) => {
        loadHariLibur(e.target.value, new Date().getFullYear());
    });

    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            cariProduk();
        }
    });
}

async function loadProduk() {
    try {
        const response = await fetch(`${FAKE_STORE_API}/products`);
        semuaProduk = await response.json();
        console.log('loaded products:', semuaProduk.length); 
        produkFlashSale = semuaProduk.slice(0, 6);
        tampilkanFlashSale(produkFlashSale);
        filterDanTampilkanProduk();
    } catch (error) {
        console.error('Error load produk:', error);
        document.getElementById('productsGrid').innerHTML = '<p style="color: #ee4d2d; text-align: center;">Gagal memuat produk</p>';
    }
}

async function loadKategori() {
    try {
        const response = await fetch(`${FAKE_STORE_API}/products/categories`);
        kategori = await response.json();
        tampilkanKategori();
    } catch (error) {
        console.error('Error load kategori:', error);
    }
}

function tampilkanKategori() {
    const categoryList = document.getElementById('categoryList');
    
    kategori.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.dataset.category = cat;
        
        const icon = getIconKategori(cat);
        btn.innerHTML = `
            <span class="cat-icon">${icon}</span>
            <span>${capitalize(cat)}</span>
        `;
        
        categoryList.appendChild(btn);
    });
}

function getIconKategori(cat) {
    // icon buat kategori
    const icons = {
        "electronics": "💻",
        "jewelery": "💎",
        "men's clothing": "👔",
        "women's clothing": "👗"
    };
    return icons[cat] || "📦";
}

function tampilkanFlashSale(produk) {
    const container = document.getElementById('flashProducts');
    container.innerHTML = '';

    produk.forEach(p => {
        const diskon = Math.floor(Math.random() * 30) + 20;
        const hargaDiskon = (p.price * (1 - diskon / 100)).toFixed(2);

        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <div style="position: relative;" onclick="lihatDetail(${p.id})">
                <img src="${p.image}" alt="${p.title}" class="product-image">
                <div style="position: absolute; top: 10px; right: 10px; background: #ee4d2d; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                    -${diskon}%
                </div>
            </div>
            <div class="product-info" onclick="lihatDetail(${p.id})">
                <div class="product-title">${p.title}</div>
                <div class="product-price">$${hargaDiskon}</div>
                <div style="text-decoration: line-through; color: #999; font-size: 12px; margin-bottom: 10px;">$${p.price}</div>
            </div>
            <div class="product-footer">
                <button class="add-cart-btn" onclick="event.stopPropagation(); tambahKeKeranjang(${p.id})">Tambah ke Keranjang</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function filterDanTampilkanProduk() {
    let filtered = [...semuaProduk];

    if (kategoriSekarang !== 'all') {
        filtered = filtered.filter(p => p.category === kategoriSekarang);
    }

    const sortValue = document.getElementById('sortFilter').value;
    switch(sortValue) {
        case 'price-asc':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            filtered.sort((a, b) => b.rating.rate - a.rating.rate);
            break;
    }

    tampilkanProduk(filtered);
}

// Display Products
function tampilkanProduk(produk) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';

    produk.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <img src="${p.image}" alt="${p.title}" class="product-image" onclick="lihatDetail(${p.id})">
            <div class="product-info" onclick="lihatDetail(${p.id})">
                <div class="product-title">${p.title}</div>
                <div class="product-rating">
                    <span class="stars">${'⭐'.repeat(Math.round(p.rating.rate))}</span>
                    <span>${p.rating.rate} (${p.rating.count})</span>
                </div>
                <div class="product-price">$${p.price}</div>
            </div>
            <div class="product-footer">
                <button class="add-cart-btn" onclick="event.stopPropagation(); tambahKeKeranjang(${p.id})">Tambah ke Keranjang</button>
                <button class="like-btn">❤️</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function cariProduk() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    
    if (!query) {
        tampilkanFlashSale(produkFlashSale);
        filterDanTampilkanProduk();
        return;
    }
    
    const filteredFlash = produkFlashSale.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
    tampilkanFlashSale(filteredFlash);
    
    const filtered = semuaProduk.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
    tampilkanProduk(filtered);
}

async function loadHariLibur(countryCode, year) {
    try {
        const response = await fetch(`${NAGER_DATE_API}/PublicHolidays/${year}/${countryCode}`);
        holidays = await response.json();
        console.log('holidays loaded', holidays.length);
        
        const today = new Date();
        const upcomingHolidays = holidays
            .filter(h => new Date(h.date) >= today)
            .slice(0, 3);

        tampilkanHolidays(upcomingHolidays);
        updateBannerPromo(upcomingHolidays[0]);
    } catch (error) {
        console.error('Error loading holidays:', error);
        document.getElementById('holidayGrid').innerHTML = '<p style="color: #999; text-align: center;">Tidak dapat memuat data hari libur</p>';
    }
}

function tampilkanHolidays(holidayList) {
    const grid = document.getElementById('holidayGrid');
    grid.innerHTML = '';

    if (holidayList.length === 0) {
        grid.innerHTML = '<p style="color: #999; text-align: center;">Tidak ada hari libur mendatang</p>';
        return;
    }

    holidayList.forEach(holiday => {
        const date = new Date(holiday.date);
        const formattedDate = date.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short', 
            day: 'numeric'
        });

        const card = document.createElement('div');
        card.className = 'holiday-card';
        card.innerHTML = `
            <div class="holiday-name">${holiday.name}</div>
            <div class="holiday-date">📅 ${formattedDate}</div>
            <div class="holiday-badge">🎁 Promo Spesial Tersedia</div>
        `;
        grid.appendChild(card);
    });
}

function updateBannerPromo(holiday) {
    if (holiday) {
        const date = new Date(holiday.date);
        const daysUntil = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
        
        document.getElementById('promoTitle').textContent = `Promo ${holiday.name}!`;
        document.getElementById('promoDesc').textContent = 
            `Hanya ${daysUntil} hari lagi! Dapatkan diskon hingga 80% untuk semua kategori!`;
    }
}

function mulaiCountdown() {
    const countdownDate = new Date();
    countdownDate.setHours(23, 59, 59, 999);

    setInterval(() => {
        const now = new Date().getTime();
        const distance = countdownDate - now;

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }, 1000);
}

function togglePeta() {
    const mapContainer = document.getElementById('mapContainer');
    const toggleText = document.getElementById('mapToggleText');
    
    if (mapContainer.style.display === 'none') {
        mapContainer.style.display = 'grid';
        toggleText.textContent = 'Sembunyikan Peta';
        if (!peta) {
            initPeta();
        }
    } else {
        mapContainer.style.display = 'none';
        toggleText.textContent = 'Tampilkan Peta';
    }
}

function initPeta() {
    peta = L.map('map').setView([-2.5489, 118.0149], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(peta);

    daftarToko.forEach(store => {
        L.marker([store.lat, store.lon])
            .addTo(peta)
            .bindPopup(`<strong>${store.name}</strong><br>${store.city}`);
    });

    tampilkanDaftarToko();
}

function tampilkanDaftarToko() {
    const storeList = document.getElementById('storeList');
    storeList.innerHTML = '';

    daftarToko.forEach((store, index) => {
        const item = document.createElement('div');
        item.className = 'store-item';
        item.onclick = () => {
            peta.setView([store.lat, store.lon], 13);
        };
        item.innerHTML = `
            <div class="store-name">${store.name}</div>
            <div class="store-address">📍 ${store.city}</div>
        `;
        storeList.appendChild(item);
    });
}

function tambahKeKeranjang(productId) {
    const product = semuaProduk.find(p => p.id === productId);
    if (product) {
        keranjang.push(product);
        updateBadgeKeranjang();
        showNotification(`${product.title.slice(0, 30)}... ditambahkan ke keranjang!`);
    }
}

function updateBadgeKeranjang() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = keranjang.length;
        badge.style.display = keranjang.length > 0 ? 'block' : 'block';
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function bukaKeranjang() {
    tampilkanKeranjang();
    document.getElementById('cartModal').classList.add('active');
}

function tampilkanKeranjang() {
    const cartItems = document.getElementById('cartItems');
    
    if (keranjang.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Keranjang Anda kosong 🛒</div>';
        return;
    }

    let total = 0;
    cartItems.innerHTML = '';

    keranjang.forEach((product, index) => {
        total += product.price;
        const item = document.createElement('div');
        item.className = 'cart-item';
        item.innerHTML = `
            <img src="${product.image}" alt="${product.title}" class="cart-item-image">
            <div class="cart-item-info">
                <div class="cart-item-title">${product.title}</div>
                <div class="cart-item-price">$${product.price}</div>
            </div>
            <div class="cart-item-actions">
                <button class="remove-btn" onclick="hapusDariKeranjang(${index})">Hapus</button>
            </div>
        `;
        cartItems.appendChild(item);
    });

    const totalSection = document.createElement('div');
    totalSection.style.cssText = 'padding: 20px; border-top: 2px solid #ee4d2d; margin-top: 20px;';
    totalSection.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <span style="font-size: 18px; font-weight: 600;">Total:</span>
            <span style="font-size: 24px; color: #ee4d2d; font-weight: 700;">$${total.toFixed(2)}</span>
        </div>
        <button class="add-cart-btn" style="width: 100%; padding: 15px; font-size: 16px;" onclick="checkout()">Lanjutkan ke Pembayaran</button>
    `;
    cartItems.appendChild(totalSection);
}

function hapusDariKeranjang(index) {
    keranjang.splice(index, 1);
    updateBadgeKeranjang();
    tampilkanKeranjang();
    showNotification('Item dihapus dari keranjang');
}

function checkout() {
    if (keranjang.length === 0) {
        alert('Keranjang Anda kosong!');
        return;
    }
    
    const orderSummary = document.getElementById('orderSummary');
    const itemCount = keranjang.length;
    const total = keranjang.reduce((sum, item) => sum + item.price, 0).toFixed(2);
    
    orderSummary.innerHTML = `
        <div style="text-align: left;">
            <p style="font-size: 18px; margin-bottom: 10px;"><strong>Ringkasan Pesanan</strong></p>
            <div style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 10px;">
                <p style="margin: 5px 0;">Jumlah Item: <strong>${itemCount}</strong></p>
                <p style="margin: 5px 0; color: #ee4d2d; font-size: 20px;">Total: <strong>$${total}</strong></p>
            </div>
            <div style="margin-top: 15px;">
                ${keranjang.map(item => `
                    <div style="display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px;">
                        <span style="flex: 1; color: #666;">${item.title.slice(0, 40)}...</span>
                        <span style="color: #ee4d2d; font-weight: 600;">$${item.price}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    keranjang = [];
    updateBadgeKeranjang();
    tutupKeranjang();
    
    document.getElementById('checkoutModal').classList.add('active');
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.remove('active');
}

function tutupKeranjang() {
    document.getElementById('cartModal').classList.remove('active');
}

function lihatDetail(productId) {
    const product = semuaProduk.find(p => p.id === productId);
    if (!product) return;

    const nearestStore = daftarToko[Math.floor(Math.random() * daftarToko.length)];

    const detailsContainer = document.getElementById('productDetails');
    detailsContainer.innerHTML = `
        <div class="product-detail-grid">
            <div>
                <img src="${product.image}" alt="${product.title}" class="detail-image">
            </div>
            <div class="detail-info">
                <h2 class="detail-title">${product.title}</h2>
                <div class="detail-rating">
                    <span class="stars">${'⭐'.repeat(Math.round(product.rating.rate))}</span>
                    <span style="margin-left: 10px;">${product.rating.rate} / 5.0</span>
                    <span style="margin-left: 10px; color: #999;">(${product.rating.count} ulasan)</span>
                </div>
                <div class="detail-price">$${product.price}</div>
                <div class="detail-description">${product.description}</div>
                <div>
                    <span class="detail-category">${capitalize(product.category)}</span>
                </div>
                <div class="detail-actions">
                    <button class="add-to-cart-large" onclick="tambahKeKeranjang(${product.id}); tutupDetailModal();">
                        Tambah ke Keranjang
                    </button>
                    <button class="buy-now-btn" onclick="tambahKeKeranjang(${product.id}); tutupDetailModal(); bukaKeranjang();">
                        Beli Sekarang
                    </button>
                </div>
            </div>
        </div>
        <div class="store-info-section">
            <h4>📍 Lokasi Toko Terdekat</h4>
            <div class="store-details">
                <div class="store-detail-item">
                    <strong>${nearestStore.name}</strong>
                </div>
                <div class="store-detail-item">
                    📌 ${nearestStore.city}
                </div>
            </div>
            <div id="detailMap"></div>
        </div>
    `;

    document.getElementById('productModal').classList.add('active');

    setTimeout(() => {
        initDetailPeta(nearestStore);
    }, 100);
}

function initDetailPeta(store) {
    const detailMap = L.map('detailMap').setView([store.lat, store.lon], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(detailMap);

    L.marker([store.lat, store.lon])
        .addTo(detailMap)
        .bindPopup(`<strong>${store.name}</strong><br>${store.city}`)
        .openPopup();
}

function tutupDetailModal() {
    document.getElementById('productModal').classList.remove('active');
    
    const mapContainer = document.getElementById('detailMap');
    if (mapContainer) {
        mapContainer.innerHTML = '';
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

