// Link real de Google Sheets (formato CSV)
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTgfzqFqzedC0AZ8LpnQJBO_04F2WDR8912Pf6399rtQa3uyxmkL84w8BBJKYl6529THOAY4V2iLn9G/pub?output=csv";

let allProducts = [];
let cart = [];

// Cargar datos de Google Sheets
async function loadData() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        const rows = data.split('\n').slice(1); // Ignorar cabecera

allProducts = rows.map(row => {
            // Limpiamos espacios raros y saltos de línea de toda la fila
            const cleanRow = row.trim();
            const columns = cleanRow.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
            
            return {
                nombre: columns[0]?.replace(/"/g, '').trim(),
                categoria: columns[1]?.replace(/"/g, '').trim(),
                precio: parseFloat(columns[2]) || 0,
                imagen: columns[3]?.replace(/"/g, '').trim(),
                // Si columns[4] existe, lo usamos. Si no, ponemos el mensaje.
                descripcion: (columns[4] && columns[4].trim() !== "") 
                             ? columns[4].replace(/"/g, '').trim() 
                             : "Consultar detalles" 
            };
        }).filter(p => p.nombre); // Solo productos con nombre

        renderCategories();
        renderProducts(allProducts);
    } catch (e) {
        console.error("Error:", e);
        document.getElementById('catalog').innerHTML = `<p class="col-span-full text-center py-20 text-red-500">Error conectando con la base de datos.</p>`;
    }
}

// Pintar productos en pantalla
// Actualiza esta parte en tu renderProducts
catalog.innerHTML = products.map((p, index) => `
    <div onclick="showProductDetail(${allProducts.indexOf(p)})" class="product-card bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 flex flex-col h-full shadow-lg cursor-pointer">
        <img src="${p.imagen}" class="w-full h-48 object-cover bg-zinc-800" alt="${p.nombre}">
        <div class="p-4 flex flex-col flex-1">
            <h3 class="font-bold text-base leading-tight h-12 overflow-hidden text-white">${p.nombre}</h3>
            <p class="text-[11px] text-zinc-500 mt-1 line-clamp-2">${p.descripcion}</p>
            <div class="mt-auto pt-4 flex justify-between items-center">
                <span class="text-primary font-black text-xl">$${p.precio}</span>
                <button onclick="event.stopPropagation(); addToCart(${allProducts.indexOf(p)})" class="bg-white text-black p-3 rounded-xl hover:bg-primary hover:text-white transition-colors">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        </div>
    </div>
`).join('');


// Manejo del Carrito
function addToCart(index) {
    const product = allProducts[index];
    cart.push(product);
    updateCartUI();
    // Feedback visual en el botón
    const btn = event.currentTarget;
    btn.innerHTML = '<i class="fas fa-check text-green-500"></i>';
    setTimeout(() => btn.innerHTML = '<i class="fas fa-plus"></i>', 800);
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
            <div class="flex items-center justify-between bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                <div class="flex items-center gap-4">
                    <img src="${item.imagen}" class="w-14 h-14 rounded-xl object-cover">
                    <div>
                        <p class="font-bold text-white text-sm">${item.nombre}</p>
                        <p class="text-red-500 text-xs">$${item.precio}</p>
                    </div>
                </div>
                <button onclick="removeItem(${i})" class="text-zinc-600 hover:text-red-500 text-xl"><i class="fas fa-trash"></i></button>
            </div>
        `;
    }).join('');
    total.innerText = `$${sum}`;
}

function removeItem(i) {
    cart.splice(i, 1);
    updateCartUI();
}

function toggleCart() {
    document.getElementById('cart-modal').classList.toggle('hidden');
}

// Enviar pedido por WhatsApp
function sendOrder() {
    if (cart.length === 0) return alert("El carrito está vacío");
    
    let message = `*NUEVO PEDIDO - ONLYCHERRY*%0A---------------------------%0A`;
    let total = 0;
    
    cart.forEach(item => {
        message += `• ${item.nombre} - *$${item.precio}*%0A`;
        total += item.precio;
    });
    
    message += `---------------------------%0A*TOTAL A PAGAR: $${total}*%0A%0A¿Tienen disponibilidad para entrega?`;
    
    const phone = "525621300137"; // CAMBIA ESTO POR TU WHATSAPP REAL (52 + número)
    window.open(`https://wa.me/${phone}?text=${message}`);
}

// Filtros
function renderCategories() {
    const nav = document.getElementById('filters');
    const categories = ['Todos', ...new Set(allProducts.map(p => p.categoria))];
    nav.innerHTML = categories.map(c => `
        <button onclick="filterProducts('${c}')" class="bg-zinc-800 border border-zinc-700 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-colors hover:bg-zinc-700 active:bg-red-900">${c}</button>
    `).join('');
}

function filterProducts(cat) {
    if (cat === 'Todos') return renderProducts(allProducts);
    renderProducts(allProducts.filter(p => p.categoria === cat));
}

loadData();
function showProductDetail(index) {
    const p = allProducts[index];
    const detailModal = document.createElement('div');
    detailModal.id = 'detail-modal';
    detailModal.className = 'fixed inset-0 bg-black/95 z-[70] flex flex-col p-6 overflow-y-auto animate-fade-in';
    
    detailModal.innerHTML = `
        <button onclick="this.parentElement.remove()" class="absolute top-6 right-6 text-white text-4xl">&times;</button>
        <img src="${p.imagen}" class="w-full aspect-square object-cover rounded-3xl mb-6 shadow-2xl">
        <span class="text-primary font-bold uppercase tracking-widest text-xs">${p.categoria}</span>
        <h2 class="text-3xl font-black text-white my-2">${p.nombre}</h2>
        <p class="text-zinc-400 text-lg leading-relaxed mb-8">${p.descripcion}</p>
        <div class="mt-auto flex justify-between items-center bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
            <span class="text-3xl font-black text-white">$${p.precio}</span>
            <button onclick="addToCart(${index}); this.parentElement.parentElement.remove()" class="bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2">
                <i class="fas fa-cart-plus"></i> AGREGAR
            </button>
        </div>
    `;
    document.body.appendChild(detailModal);
}
