let allProducts = [];
let cart = [];
let currentModalIndex = -1;

/**
 * Inicialización Dinámica de Estilos e Interfaz
 */
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('dynamic-styles').innerHTML = `
        :root { --primary: ${CONFIG.colorPrimario}; --bg: ${CONFIG.colorFondo}; }
        .text-primary { color: var(--primary) !important; }
        .bg-primary { background-color: var(--primary) !important; }
        .border-primary { border-color: var(--primary) !important; }
    `;
    document.title = CONFIG.nombre;
    const headerName = document.getElementById('header-name');
    headerName.innerText = CONFIG.nombre.toUpperCase();
    headerName.style.color = CONFIG.colorPrimario;

    // Inyectar texto de términos con el nombre real
    document.getElementById('terms-label').innerHTML = `Al dar click en 'Enviar' declaro que he leído y aceptado los <a href="javascript:alert('Términos y condiciones de ${CONFIG.nombre} en revisión')" class="text-primary underline font-bold">términos, condiciones</a> y la <a href="javascript:alert('Política de privacidad de ${CONFIG.nombre} en revisión')" class="text-primary underline font-bold">política de privacidad</a> de ${CONFIG.nombre}.`;

    const termsCheck = document.getElementById('terms-check');
    const sendBtn = document.getElementById('send-btn');
    termsCheck.addEventListener('change', () => { sendBtn.disabled = !termsCheck.checked; });
    
    loadData();
});

async function loadData() {
    try {
        const response = await fetch(CONFIG.sheetUrl);
        const data = await response.text();
        const rows = data.split('\n').slice(1);
        allProducts = rows.map(row => {
            const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            return {
                nombre: columns[0]?.replace(/"/g, '').trim(),
                categoria: columns[1]?.replace(/"/g, '').trim(),
                precio: parseFloat(columns[2]) || 0,
                imagen: columns[3]?.replace(/"/g, '').trim(),
                descripcion: columns[4]?.replace(/"/g, '').trim() || "Consulte disponibilidad."
            };
        }).filter(p => p.nombre);
        renderCategories();
        renderProducts(allProducts);
    } catch (e) { console.error(e); }
}

function renderProducts(products) {
    const catalog = document.getElementById('catalog');
    catalog.innerHTML = products.map((p) => `
        <div onclick="showProductDetail(${allProducts.indexOf(p)})" class="product-card bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 flex flex-col h-full shadow-lg cursor-pointer pb-16">
            <img src="${p.imagen}" class="w-full h-40 object-cover bg-zinc-800" loading="lazy">
            <div class="p-3 flex flex-col flex-1">
                <h3 class="font-bold text-sm leading-tight h-10 overflow-hidden text-white">${p.nombre}</h3>
                <p class="text-[10px] text-primary font-bold tracking-widest uppercase mt-1">${p.categoria}</p>
                <div class="mt-auto fixed bottom-3 left-3 right-3 flex justify-between items-center z-10 bg-zinc-900 pt-1 border-t border-zinc-800">
                    <span class="text-primary font-black text-lg">$${p.precio}</span>
                    <span class="bg-white text-black px-3 py-1 rounded-lg text-[10px] font-bold">VER MÁS</span>
                </div>
            </div>
        </div>
    `).join('');
}

// --- LÓGICA DEL MODAL ---

function showProductDetail(index) {
    currentModalIndex = index;
    const p = allProducts[index];
    document.getElementById('detail-img').src = p.imagen;
    document.getElementById('detail-cat').innerText = p.categoria;
    document.getElementById('detail-name').innerText = p.nombre;
    document.getElementById('detail-desc').innerText = p.descripcion;
    document.getElementById('detail-qty').value = 1;
    document.getElementById('item-comment').value = '';
    
    updateDetailPrice(); // Inicializar el precio de abajo

    document.getElementById('detail-modal').classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    document.getElementById('detail-scroll-area').scrollTop = 0;
}

/**
 * FUNCIÓN CLAVE: Actualiza el precio del modal según la cantidad
 */
function updateDetailPrice() {
    const p = allProducts[currentModalIndex];
    const qty = parseInt(document.getElementById('detail-qty').value) || 1;
    const totalPrice = p.precio * qty;
    document.getElementById('detail-footer-price').innerText = `$${totalPrice}`;
    // También actualizamos el precio chiquito de arriba por si acaso
    document.getElementById('detail-price').innerText = `$${p.precio}`; 
}

function changeDetailQty(change) {
    const qtyInput = document.getElementById('detail-qty');
    let currentQty = parseInt(qtyInput.value) || 1;
    currentQty += change;
    if (currentQty < 1) currentQty = 1;
    qtyInput.value = currentQty;
    
    updateDetailPrice(); // RECALCULAR AL PICAR BOTÓN
}

function closeDetail() {
    document.getElementById('detail-modal').classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

// --- CARRITO Y ENVÍO ---

function addToCartFromModal() {
    const p = allProducts[currentModalIndex];
    const qty = parseInt(document.getElementById('detail-qty').value) || 1;
    const comment = document.getElementById('item-comment').value.trim();
    cart.push({ product: p, quantity: qty, comment: comment });
    updateCartUI();
    closeDetail();
}

function updateCartUI() {
    const count = document.getElementById('cart-count');
    count.innerText = cart.length;
    count.classList.toggle('hidden', cart.length === 0);
    
    let subtotal = 0;
    document.getElementById('cart-items').innerHTML = cart.map((item, i) => {
        const pSub = item.product.precio * item.quantity;
        subtotal += pSub;
        return `
            <div class="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <img src="${item.product.imagen}" class="w-12 h-12 rounded-xl object-cover">
                        <div>
                            <p class="font-bold text-white text-xs">${item.product.nombre}</p>
                            <p class="text-xs text-primary font-black">${item.quantity}x $${item.product.precio} = $${pSub}</p>
                        </div>
                    </div>
                    <button onclick="removeItem(${i})" class="text-zinc-600 p-2"><i class="fas fa-trash text-sm"></i></button>
                </div>
                ${item.comment ? `<div class="text-[10px] text-zinc-400 bg-zinc-950 p-2 rounded-lg border border-zinc-700">Nota: ${item.comment}</div>` : ''}
            </div>
        `;
    }).join('');

    document.getElementById('cart-summary-items').innerHTML = cart.map(item => `
        <div class="flex justify-between text-xs text-zinc-400">
            <span>${item.product.nombre} x${item.quantity}</span>
            <span class="text-white">$${item.product.precio * item.quantity}</span>
        </div>
    `).join('');

    document.getElementById('cart-total').innerText = `$${subtotal}`;
}

function removeItem(i) { cart.splice(i, 1); updateCartUI(); }
function toggleCart() { document.getElementById('cart-modal').classList.toggle('hidden'); document.body.classList.toggle('overflow-hidden'); }

function sendOrder() {
    if (cart.length === 0) return;
    const address = document.getElementById('address').value.trim();
    const generalComment = document.getElementById('general-comment').value.trim();
    let message = `*NUEVO PEDIDO - ${CONFIG.nombre.toUpperCase()}*%0A---------------------------%0A%0A`;
    let subtotal = 0;
    cart.forEach(item => {
        const itemSubtotal = item.product.precio * item.quantity;
        subtotal += itemSubtotal;
        message += `✅ *${item.product.nombre}*%0A   Qty: ${item.quantity} | $${item.product.precio}%0A`;
        if(item.comment) message += `   Nota: ${item.comment}%0A`;
        message += `   Subtotal: *$${itemSubtotal}*%0A%0A`;
    });
    message += `---------------------------%0A*TOTAL: $${subtotal}*%0A---------------------------%0A%0A`;
    message += `*DATOS DE ENTREGA*%0A• Dir: ${address || "Recoge en local"}%0A`;
    if(generalComment) message += `• Notas: ${generalComment}%0A`;
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${message}`);
}

function renderCategories() {
    const nav = document.getElementById('filters');
    const categories = ['Todos', ...new Set(allProducts.map(p => p.categoria))];
    nav.innerHTML = categories.map(c => `
        <button onclick="filterProducts('${c}')" class="bg-zinc-800 border border-zinc-700 px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-wider">${c}</button>
    `).join('');
}

function filterProducts(cat) {
    if (cat === 'Todos') return renderProducts(allProducts);
    renderProducts(allProducts.filter(p => p.categoria === cat));
}

// Pintar redes sociales en footer
const container = document.getElementById('social-links');
if(CONFIG.instagram) container.innerHTML += `<a href="${CONFIG.instagram}" target="_blank" class="text-white text-xl"><i class="fab fa-instagram"></i></a>`;
if(CONFIG.facebook) container.innerHTML += `<a href="${CONFIG.facebook}" target="_blank" class="text-white text-xl"><i class="fab fa-facebook"></i></a>`;
if(CONFIG.tiktok) container.innerHTML += `<a href="${CONFIG.tiktok}" target="_blank" class="text-white text-xl"><i class="fab fa-tiktok"></i></a>`;
document.getElementById('footer-brand').innerText = `© 2026 ${CONFIG.nombre} | Arq. Tech`;
if ('serviceWorker' in navigator) { navigator.serviceWorker.register('sw.js'); }
    
