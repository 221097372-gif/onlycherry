let allProducts = [];
let cart = [];

/**
 * FUNCIÓN CLAVE: Carga de Datos
 * Conecta con el Google Sheets y limpia los datos del CSV.
 */
async function loadData() {
    try {
        const response = await fetch(CONFIG.sheetUrl);
        const data = await response.text();
        const rows = data.split('\n').slice(1);

        allProducts = rows.map(row => {
            // Regex para separar por comas ignorando comas dentro de comillas
            const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            return {
                nombre: columns[0]?.replace(/"/g, '').trim(),
                categoria: columns[1]?.replace(/"/g, '').trim(),
                precio: parseFloat(columns[2]) || 0,
                imagen: columns[3]?.replace(/"/g, '').trim(),
                descripcion: columns[4]?.replace(/"/g, '').trim() || "Consulte disponibilidad y tallas."
            };
        }).filter(p => p.nombre);

        renderCategories();
        renderProducts(allProducts);
    } catch (e) {
        document.getElementById('catalog').innerHTML = `<p class="col-span-full text-center py-20 text-red-500">Error al cargar productos.</p>`;
    }
}

/**
 * FUNCIÓN CLAVE: Renderizado de Catálogo
 * Crea las tarjetas de producto. El clic abre el detalle.
 */
function renderProducts(products) {
    const catalog = document.getElementById('catalog');
    catalog.innerHTML = products.map((p) => `
        <div onclick="showProductDetail(${allProducts.indexOf(p)})" class="product-card bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 flex flex-col h-full shadow-lg cursor-pointer">
            <img src="${p.imagen}" class="w-full h-40 object-cover bg-zinc-800" loading="lazy">
            <div class="p-3 flex flex-col flex-1">
                <h3 class="font-bold text-sm leading-tight h-10 overflow-hidden text-white">${p.nombre}</h3>
                <div class="mt-auto pt-2 flex justify-between items-center">
                    <span class="text-primary font-black text-lg">$${p.precio}</span>
                    <button onclick="event.stopPropagation(); addToCart(${allProducts.indexOf(p)})" class="bg-white text-black p-2 rounded-lg active:bg-primary active:text-white transition-colors">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * FUNCIÓN CLAVE: Vista de Detalle (Modal)
 * Muestra la foto grande y la descripción completa.
 */
function showProductDetail(index) {
    const p = allProducts[index];
    const detailModal = document.createElement('div');
    // CAMBIO CLAVE: Usamos bg-zinc-950 (100% opaco) para fondo sólido
    detailModal.className = 'fixed inset-0 bg-zinc-950 z-[70] flex flex-col p-6 animate-fade-in';
    detailModal.innerHTML = `
        <button onclick="this.parentElement.remove()" class="absolute top-4 right-6 text-white text-5xl z-10">×</button>
        <div class="flex-1 overflow-y-auto no-scrollbar pb-24">
            <img src="${p.imagen}" class="w-full aspect-square object-cover rounded-3xl mb-6 shadow-2xl">
            <span class="text-primary font-bold uppercase tracking-widest text-[10px]">${p.categoria}</span>
            <h2 class="text-3xl font-black text-white my-2">${p.nombre}</h2>
            <p class="text-zinc-300 text-base leading-relaxed mb-10">${p.descripcion}</p>
        </div>
        <div class="mt-auto flex justify-between items-center bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl">
            <span class="text-3xl font-black text-white">$${p.precio}</span>
            <button onclick="addToCart(${index}); this.parentElement.parentElement.remove()" class="bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 active:scale-95 transition-transform">
                <i class="fas fa-cart-plus"></i> AGREGAR
            </button>
        </div>
    `;
    document.body.appendChild(detailModal);
}

// --- LÓGICA DEL CARRITO ---
function addToCart(index) {
    cart.push(allProducts[index]);
    updateCartUI();
}

function updateCartUI() {
    const count = document.getElementById('cart-count');
    const items = document.getElementById('cart-items');
    const total = document.getElementById('cart-total');
    count.innerText = cart.length;
    count.classList.toggle('hidden', cart.length === 0);
    let sum = 0;
    items.innerHTML = cart.map((item, i) => {
        sum += item.precio;
        return `
            <div class="flex items-center justify-between bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
                <div class="flex items-center gap-3">
                    <img src="${item.imagen}" class="w-12 h-12 rounded-xl object-cover">
                    <div class="max-w-[150px]">
                        <p class="font-bold text-white text-xs truncate">${item.nombre}</p>
                        <p class="text-primary text-xs font-black">$${item.precio}</p>
                    </div>
                </div>
                <button onclick="removeItem(${i})" class="text-zinc-600 p-2"><i class="fas fa-trash"></i></button>
            </div>
        `;
    }).join('');
    total.innerText = `$${sum}`;
}

function removeItem(i) { cart.splice(i, 1); updateCartUI(); }
function toggleCart() { document.getElementById('cart-modal').classList.toggle('hidden'); }

/**
 * FUNCIÓN CLAVE: Envío a WhatsApp
 * Genera el texto del pedido automático.
 */
function sendOrder() {
    if (cart.length === 0) return;
    let message = `*NUEVO PEDIDO - ${CONFIG.nombre.toUpperCase()}*%0A---------------------------%0A`;
    let total = 0;
    cart.forEach(item => {
        message += `• ${item.nombre} - *$${item.precio}*%0A`;
        total += item.precio;
    });
    message += `---------------------------%0A*TOTAL: $${total}*%0A%0A¿Me confirman disponibilidad?`;
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${message}`);
}

function renderCategories() {
    const nav = document.getElementById('filters');
    const categories = ['Todos', ...new Set(allProducts.map(p => p.categoria))];
    nav.innerHTML = categories.map(c => `
        <button onclick="filterProducts('${c}')" class="bg-zinc-800 border border-zinc-700 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-primary active:bg-primary whitespace-nowrap">${c}</button>
    `).join('');
}

function filterProducts(cat) {
    if (cat === 'Todos') return renderProducts(allProducts);
    renderProducts(allProducts.filter(p => p.categoria === cat));
}

loadData();
