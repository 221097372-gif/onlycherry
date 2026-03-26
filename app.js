let allProducts = [];
let cart = []; // Estructura: [{product: p, quantity: q, comment: c}]
let currentModalIndex = -1;

/**
 * Carga de Datos y Limpieza de CSV
 */
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
 * Renderizado de Tarjetas de Catálogo
 */
function renderProducts(products) {
    const catalog = document.getElementById('catalog');
    catalog.innerHTML = products.map((p) => `
        <div onclick="showProductDetail(${allProducts.indexOf(p)})" class="product-card bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 flex flex-col h-full shadow-lg cursor-pointer animate-fade-in pb-16">
            <img src="${p.imagen}" class="w-full h-40 object-cover bg-zinc-800" loading="lazy">
            <div class="p-3 flex flex-col flex-1">
                <h3 class="font-bold text-sm leading-tight h-10 overflow-hidden text-white">${p.nombre}</h3>
                <p class="text-[10px] text-primary font-bold tracking-widest uppercase mt-1 truncate">${p.categoria}</p>
                <div class="mt-auto fixed bottom-3 left-3 right-3 flex justify-between items-center z-10 bg-zinc-900 pt-1 border-t border-zinc-800">
                    <span class="text-primary font-black text-lg">$${p.precio}</span>
                    <span class="bg-white text-black px-3 py-1 rounded-lg text-xs font-bold active:bg-primary active:text-white transition-colors">
                        VER DETALLE
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

// --- LÓGICA DEL DETALLE (MODAL) ---

function showProductDetail(index) {
    currentModalIndex = index;
    const p = allProducts[index];
    
    // Llenar contenido del modal
    document.getElementById('detail-img').src = p.imagen;
    document.getElementById('detail-cat').innerText = p.categoria;
    document.getElementById('detail-price').innerText = `$${p.precio}`;
    document.getElementById('detail-name').innerText = p.nombre;
    document.getElementById('detail-desc').innerText = p.descripcion;
    
    // CORRECCIÓN: Llenar el precio real abajo
    document.getElementById('detail-footer-price').innerText = `$${p.precio}`;
    
    // Resetear inputs del modal
    document.getElementById('detail-qty').value = 1;
    document.getElementById('item-comment').value = '';

    // Configurar el botón de agregar
    const addBtn = document.getElementById('add-to-cart-btn');
    addBtn.onclick = () => addToCartFromModal();

    // Mostrar modal y bloquear scroll fondo
    document.getElementById('detail-modal').classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    
    // Resetear scroll del área de detalle
    document.getElementById('detail-scroll-area').scrollTop = 0;
}

function closeDetail() {
    document.getElementById('detail-modal').classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

function changeDetailQty(change) {
    const qtyInput = document.getElementById('detail-qty');
    let currentQty = parseInt(qtyInput.value) || 1;
    currentQty += change;
    if (currentQty < 1) currentQty = 1;
    qtyInput.value = currentQty;
}

// --- LÓGICA DEL CARRITO (AVANZADA) ---

function addToCartFromModal() {
    const p = allProducts[currentModalIndex];
    const qty = parseInt(document.getElementById('detail-qty').value) || 1;
    const comment = document.getElementById('item-comment').value.trim();

    cart.push({
        product: p,
        quantity: qty,
        comment: comment
    });

    updateCartUI();
    closeDetail();
}

function updateCartUI() {
    const count = document.getElementById('cart-count');
    const itemsList = document.getElementById('cart-items');
    const summaryItems = document.getElementById('cart-summary-items');
    const total = document.getElementById('cart-total');
    
    count.innerText = cart.length;
    count.classList.toggle('hidden', cart.length === 0);
    
    let subtotal = 0;
    
    itemsList.innerHTML = cart.map((item, i) => {
        const pSubtotal = item.product.precio * item.quantity;
        subtotal += pSubtotal;
        
        return `
            <div class="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 animate-fade-in space-y-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <img src="${item.product.imagen}" class="w-14 h-14 rounded-xl object-cover">
                        <div>
                            <p class="font-bold text-white text-sm leading-tight">${item.product.nombre}</p>
                            <p class="text-xs text-primary font-black pt-1">
                                ${item.quantity} x $${item.product.precio} = $${pSubtotal}
                            </p>
                        </div>
                    </div>
                    <button onclick="removeItem(${i})" class="text-zinc-600 p-2 hover:text-red-500"><i class="fas fa-trash text-lg"></i></button>
                </div>
                ${item.comment ? `
                    <div class="text-xs text-zinc-400 bg-zinc-950 p-3 rounded-xl border border-zinc-700">
                        <span class="font-bold text-zinc-200">Nota:</span> ${item.comment}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    summaryItems.innerHTML = cart.map(item => `
        <div class="flex justify-between items-start gap-4">
            <div class="flex-1">
                <p class="text-white font-medium">${item.product.nombre} <span class="font-bold text-primary">x${item.quantity}</span></p>
                ${item.comment ? `<p class="text-zinc-500 text-xs mt-1">(Nota: ${item.comment})</p>` : ''}
            </div>
            <p class="font-bold text-white text-right">$${(item.product.precio * item.quantity)}</p>
        </div>
    `).join('');

    total.innerText = `$${subtotal}`;
}

function removeItem(i) {
    cart.splice(i, 1);
    updateCartUI();
}

function toggleCart() {
    document.getElementById('cart-modal').classList.toggle('hidden');
    document.body.classList.toggle('overflow-hidden');
}

/**
 * ENVÍO A WHATSAPP (Formateador Pro)
 */
function sendOrder() {
    if (cart.length === 0) return;
    
    const address = document.getElementById('address').value.trim();
    const generalComment = document.getElementById('general-comment').value.trim();
    const termsChecked = document.getElementById('terms-check').checked;
    
    if (!termsChecked) { alert("Acepta los términos para continuar."); return; }

    let message = `*NUEVO PEDIDO - ${CONFIG.nombre.toUpperCase()}*%0A---------------------------%0A%0A`;
    let subtotal = 0;
    cart.forEach(item => {
        const itemSubtotal = item.product.precio * item.quantity;
        subtotal += itemSubtotal;
        message += `✅ *${item.product.nombre}*%0A`;
        message += `   • Cantidad: ${item.quantity}%0A`;
        message += `   • Precio x1: $${item.product.precio}%0A`;
        if(item.comment) { message += `   • *Nota: ${item.comment}*%0A`; }
        message += `   • Subtotal: *$${itemSubtotal}*%0A%0A`;
    });
    
    message += `---------------------------%0A`;
    message += `*TOTAL PRODUCTOS: $${subtotal}*%0A`;
    message += `*TOTAL A PAGAR: $${subtotal}*%0A`;
    message += `---------------------------%0A%0A`;
    message += `*DATOS DE ENTREGA*%0A`;
    message += `• Dirección: ${address || "Recoge en sucursal"}%0A`;
    if(generalComment) { message += `• Notas Generales: ${generalComment}%0A`; }
    message += `%0A¿Me confirman disponibilidad?`;
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
    
