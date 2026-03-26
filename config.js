/**
 * ARCHIVO DE CONFIGURACIÓN - ARQUITECTO TECH
 * Aquí se personaliza la identidad de cada cliente.
 */
const CONFIG = {
    // 1. Identidad
    nombre: "OnlyCherry", 
    eslogan: "Lencería & Sex Shop Premium",
    
    // 2. Contacto y Ubicación
    whatsapp: "525621300137", // Formato: código de país + número
    locationUrl: "https://maps.app.goo.gl/tu-link-de-maps", // Link de Google Maps del negocio
    
    // 3. Estética (Colores en Hexadecimal)
    colorPrimario: "#dc2626", // El color de los botones, iconos y logo
    colorFondo: "#000000",   // Color de fondo de la app
    
    // 4. Redes Sociales (Si no tiene alguna, déjala vacía "")
    instagram: "https://instagram.com/onlycherry",
    facebook: "",
    tiktok: "https://tiktok.com/@onlycherry",
    /// 5. Boton de finalizado de compra
    costoEnvio: 50, // Cambia aquí el monto del envío
    linkTerminos: "terminos.html",
    linkPrivacidad: "privacidad.html"

    // 6. Base de Datos (Link de Google Sheets publicado como CSV)
    // El Math.random evita que el cel guarde precios viejos en la memoria
    sheetUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRibzuAMTfUTrTOZGGB7vHFTrUFKTdxx1nW1Qx2GOM9bdV_8bLiN5tEtnL3VA_xTA/pub?output=csv&v=" + Math.random()

};
