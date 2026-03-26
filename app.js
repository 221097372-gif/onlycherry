let allProducts = [];
let cart = [];
let currentModalIndex = -1;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Aplicar Colores
    document.getElementById('dynamic-styles').innerHTML = `
        :root { --primary: ${CONFIG.colorPrimario}; }
        .text-primary { color: var(--primary) !important; }
        .bg-primary { background-color: var(--primary) !important; }
        .border-primary { border-color: var(--primary) !important; }
    `;
    
    // 2. Textos Iniciales
    document.getElementById('header-name').innerText = CONFIG.nombre;
    document.getElementById('header-name').style.color = CONFIG.colorPrimario;
    
    // 3. Configurar Checkbox de Legales
    const label = document.getElementById('terms-label');
    if(label) {
        label.innerHTML = `He leído los <a href="terminos.html" target="_blank" class="text-primary underline">términos</a> y la <a href="privacidad.html" target="_blank" class="text-primary underline">privacidad</a> de ${CONFIG.nombre}.`;
    }

    const termsCheck = document.getElementById('terms-check');
    if(termsCheck) {
        termsCheck.addEventListener('change', () => { 
            document.getElementById('send-btn').disabled = !termsCheck.checked; 
        });
    }

    loadData();
});

async function loadData() {
    const catalog = document.getElementById('catalog');
    try {
        const response = await fetch(CONFIG.sheetUrl);
        if (!response.ok) throw new Error("No se pudo conectar con el Excel");
        
        const data = await response.text();
        const rows = data.split('\n').slice(1);
        
        allProducts = rows.map(row => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            return {
                nombre: cols[0]?.replace(/"/g, '').trim(),
                categoria: cols[1]?.replace(/"/g, '').trim(),
                precio: parseFloat(cols[2]) || 0,
                imagen: cols[3]?.replace(/"/g, '').trim(),
                descripcion: cols[4]?.replace(/"/g, '').trim() || "Consultar disponibilidad."
            };
        }).filter(p => p.nombre && p.nombre.length > 2);

        if(allProducts.length === 0) {
            catalog.innerHTML = "<p class='col-span-2 text-center py-10 text-zinc-500'>No hay productos activos en el Excel.</p>";
            return;
        }

        renderCategories();
        renderProducts(allProducts);
    } catch (e) { 
        console.error(e);
        catalog.innerHTML = `<p class='col-span-2 text-center py-10 text-red-500'>Error: Revisa el link de tu Excel en config.js</p>`;
    }
}

function renderProducts(products) {
    const catalog = document.getElementById('catalog');
    catalog.innerHTML = products.map((p, index) => `
        <div onclick="showProductDetail(${allProducts.indexOf(p)})" class="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 flex flex-col h-full shadow-lg animate-fade-in">
            <img src="${p.imagen}" class="w-full h-40 object-cover bg-zinc-800" onerror="this.src='https://placehold.co/400x400?text=Sin+Imagen'">
            <div class="p-4 flex flex-col flex-1 justify-between">
                <div>
                    <h3 class="font-bold text-sm text-white leading-tight mb-1">${p.nombre}</h3>
                    <p class="text-[9px] text-primary font-black uppercase tracking-widest">${p.categoria}</p>
                </div>
                <div class="flex justify-between items-center mt-3 pt-3 border-t border-zinc-800/50">
                    <span class="text-white font-black text-lg">$${p.precio}</span>
                    <div class="bg-primary/10 p-2 rounded-xl text-primary"><i class="fas fa-plus text-xs"></i></div>
                </div>
            </div>
        </div>
    `).join('');
}

function showProductDetail(index) {
    currentModalIndex = index;
    const p = allProducts[index];
    
    document.getElementById('detail-img').src = p.imagen;
    document.getElementById('detail-cat').innerText = p.categoria;
    document.getElementById('detail-name').innerText = p.nombre;
    document.getElementById('detail-desc').innerText = p.descripcion;
    document.getElementById('detail-qty').value = 1;
    document.getElementById('item-comment').value = '';
    
    updateDetailPrice();
    document.getElementById('detail-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function updateDetailPrice() {
    const p = allProducts[currentModalIndex];
    const qty = parseInt(document.getElementById('detail-qty').value) || 1;
    const total = p.precio * qty;
    document.getElementById('detail-footer-price').innerText = `$${total}`;
}

function changeDetailQty(ch) {
    const input = document.getElementById('detail-qty');
    let val = (parseInt(input.value) || 1) + ch;
    input.value = val < 1 ? 1 : val;
    updateDetailPrice();
}

function closeDetail() {
    document.getElementById('detail-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function addToCartFromModal() {
    const p = allProducts[currentModalIndex];
    const qty = parseInt(document.getElementById('detail-qty').value);
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
        const sub = item.product.precio * item.quantity;
        subtotal += sub;
        return `
            <div class="bg-zinc-900 p-4 rounded-2xl flex justify-between items-center border border-zinc-800">
                <div class="flex items-center gap-3">
                    <img src="${item.product.imagen}" class="w-12 h-12 rounded-lg object-cover">
                    <div>
                        <p class="font-bold text-xs text-white">${item.product.nombre} x${item.quantity}</p>
                        <p class="text-[10px] text-primary font-bold">$${sub}</p>
                    </div>
                </div>
                <button onclick="removeItem(${i})" class="text-zinc-600 p-2"><i class="fas fa-trash"></i></button>
            </div>
        `;
    }).join('');

    const shipping = CONFIG.costoEnvio || 0;
    document.getElementById('shipping-display').innerText = `$${shipping}`;
    document.getElementById('cart-total').innerText = `$${subtotal + shipping}`;
}

function removeItem(i) { cart.splice(i, 1); updateCartUI(); }
function toggleCart() { document.getElementById('cart-modal').classList.toggle('hidden'); }

function sendOrder() {
    let message = `*NUEVO PEDIDO - ${CONFIG.nombre.toUpperCase()}*%0A%0A`;
    let subtotal = 0;
    cart.forEach(item => {
        const s = item.product.precio * item.quantity;
        subtotal += s;
        message += `• *${item.product.nombre}* x${item.quantity} ($${s})%0A`;
        if(item.comment) message += `   _Nota: ${item.comment}_%0A`;
    });
    const shipping = CONFIG.costoEnvio || 0;
    message += `%0A*Subtotal:* $${subtotal}%0A*Envío:* $${shipping}%0A*TOTAL:* $${subtotal + shipping}%0A%0A`;
    message += `*Entrega:* ${document.getElementById('address').value || "No especificada"}`;
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${message}`);
}

function renderCategories() {
    const nav = document.getElementById('filters');
    const cats = ['Todos', ...new Set(allProducts.map(p => p.categoria))];
    nav.innerHTML = cats.map(c => `
        <button onclick="filterProducts('${c}')" class="bg-zinc-800 px-5 py-3 rounded-xl text-[10px] font-bold uppercase whitespace-nowrap active:bg-primary transition-colors">${c}</button>
    `).join('');
}

function filterProducts(cat) {
    renderProducts(cat === 'Todos' ? allProducts : allProducts.filter(p => p.categoria === cat));
                                     }
