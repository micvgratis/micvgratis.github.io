// 1. DICCIONARIO DE TRADUCCIONES (Igual que lo tienes)
const diccionarios = {
    es: { perfil: "Perfil Profesional", experiencia: "Experiencia Laboral", educacion: "Educación", habilidades: "Competencias", idiomas: "Idiomas", adicional: "Formación Adicional" },
    en: { perfil: "Professional Profile", experiencia: "Work Experience", educacion: "Education", habilidades: "Skills", idiomas: "Languages", adicional: "Additional Training" },
    fr: { perfil: "Profil Professionnel", experiencia: "Expérience Professionnelle", educacion: "Éducation", habilidades: "Compétences", idiomas: "Langues", adicional: "Formation Complémentaire" },
    de: { perfil: "Berufliches Profil", experiencia: "Berufserfahrung", educacion: "Ausbildung", habilidades: "Fähigkeiten", idiomas: "Sprachen", adicional: "Zusatzqualifikationen" },
    it: { perfil: "Profilo Professionale", experiencia: "Esperienza Lavorativa", educacion: "Istruzione", habilidades: "Competenze", idiomas: "Lingue", adicional: "Formazione Aggiuntiva" }
};

document.getElementById('cv-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    const form = event.target;
    const idiomaElegido = document.getElementById('idioma-cv').value;
    const t = diccionarios[idiomaElegido];

    const datos = {
        nombre: form.nombre.value,
        email: form.email.value,
        telefono: form.telefono.value,
        ciudad: form.ciudad.value,
        pais: form.pais.value,
        perfil: form.perfil.value,
        experiencia: form.experiencia.value,
        educacion: form.educacion.value,
        habilidades: form.habilidades.value,
        idiomas: form.idiomas.value,
        formacionAdicional: form.formacionAdicional.value,
        idioma: idiomaElegido,
        foto: null
    };

    const fotoInput = form.foto;
    if (fotoInput.files && fotoInput.files[0]) {
        datos.foto = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(fotoInput.files[0]);
        });
    }

    const resultado = `Nombre: ${datos.nombre}\nEmail: ${datos.email}\nTeléfono: ${datos.telefono}\nCiudad: ${datos.ciudad}\nPaís: ${datos.pais}\n\n${t.perfil}:\n${datos.perfil}\n\n${t.experiencia}:\n${datos.experiencia}\n\n${t.educacion}:\n${datos.educacion}\n\n${t.habilidades}:\n${datos.habilidades}\n\n${t.idiomas}:\n${datos.idiomas}\n\n${t.adicional}:\n${datos.formacionAdicional}`;
    document.getElementById('resultado').textContent = resultado;
    document.getElementById('descargar-pdf').style.display = 'inline-block';
    window.__cvData = datos;
});

document.getElementById('descargar-pdf').addEventListener('click', function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const datos = window.__cvData;
    const t = diccionarios[datos.idioma || 'es'];
    const selector = document.getElementById('diseno-cv');
    const diseno = selector ? selector.value : 'clasico';
    
    let margin = 20;
    let y = margin;
    const maxWidth = 170;

    // --- CONFIGURACIÓN DE FUENTES Y TAMAÑOS ATS ---
    let r = 0, g = 51, b = 102; 
    let fuentePrincipal = 'helvetica'; // Sans-Serif (Recomendado por Google)
    let tamanoCuerpo = 11;             // Entre 10 y 12pt
    let tamanoTitulos = 13;            // Legible y jerarquizado
    let tamanoNombre = 20;

    if (diseno === 'moderno') {
        r = 37; g = 99; b = 235; 
    } else if (diseno === 'minimalista' || diseno === 'harvard') {
        r = 0; g = 0; b = 0;
        if (diseno === 'harvard') {
            fuentePrincipal = 'times'; // Serif estándar aceptada
            tamanoCuerpo = 10;
            tamanoTitulos = 12;
        }
    }

    // --- ENCABEZADO ---
    doc.setTextColor(r, g, b); 
    
    if (diseno === 'harvard') {
        doc.setFont('times', 'bold');
        doc.setFontSize(18);
        doc.text(datos.nombre.toUpperCase(), doc.internal.pageSize.width / 2, y, { align: 'center' });
        y += 7;
        doc.setFontSize(10);
        doc.setFont('times', 'normal');
        doc.setTextColor(50, 50, 50);
        let contactInfo = `${datos.email} | ${datos.telefono} | ${datos.ciudad}, ${datos.pais}`;
        doc.text(contactInfo, doc.internal.pageSize.width / 2, y, { align: 'center' });
    } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(tamanoNombre);
        if (diseno === 'moderno') {
            doc.text(datos.nombre.toUpperCase(), doc.internal.pageSize.width / 2, y, { align: 'center' });
        } else {
            doc.text(datos.nombre, margin, y);
        }
        y += 8;
        doc.setFontSize(tamanoCuerpo);
        doc.setTextColor(80, 80, 80);
        doc.setFont('helvetica', 'normal');
        let contactInfo = `Email: ${datos.email} | Teléfono: ${datos.telefono}`;
        if (datos.ciudad || datos.pais) {
            contactInfo += ` | ${datos.ciudad || ''}${datos.ciudad && datos.pais ? ', ' : ''}${datos.pais || ''}`;
        }
        if (diseno === 'moderno') {
            doc.text(contactInfo, doc.internal.pageSize.width / 2, y, { align: 'center' });
        } else {
            doc.text(contactInfo, margin, y);
        }
    }

    // Foto (Solo si no es Harvard)
    if (datos.foto && diseno !== 'harvard') {
        try {
            const imgSize = 25; // Reducida un poco para no desplazar texto
            const xFoto = (diseno === 'moderno') ? margin : doc.internal.pageSize.width - margin - imgSize;
            doc.addImage(datos.foto, 'JPEG', xFoto, margin - 10, imgSize, imgSize);
        } catch (e) { console.error("Error foto:", e); }
    }

    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, 190, y);
    y += 10;

    // --- FUNCIÓN DE SECCIONES OPTIMIZADA ---
    function addSection(title, text, isBullet = false) {
        if (!text || !text.trim()) return;
        if (y + 25 > doc.internal.pageSize.height - margin) {
            doc.addPage();
            y = margin;
        }

        // Títulos en Negrita (Sin cursivas para evitar errores de lectura ATS)
        doc.setFont(fuentePrincipal, 'bold');
        doc.setFontSize(tamanoTitulos);
        doc.setTextColor(r, g, b); 
        const label = (diseno === 'clasico' || diseno === 'harvard') ? title.toUpperCase() : title;
        doc.text(label, margin, y);
        
        if(diseno === 'harvard') {
            y += 2;
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.2);
            doc.line(margin, y, 190, y);
            y += 5;
        } else {
            y += 7;
        }

        // Cuerpo en Normal
        doc.setFont(fuentePrincipal, 'normal');
        doc.setFontSize(tamanoCuerpo);
        doc.setTextColor(50, 50, 50);

        if (isBullet) {
            const lines = text.split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    // Viñeta simple (guion) es la más segura para ATS
                    const bullet = "- "; 
                    const splitLine = doc.splitTextToSize(bullet + line.trim(), maxWidth);
                    doc.text(splitLine, margin, y);
                    y += splitLine.length * (tamanoCuerpo * 0.5) + (diseno === 'harvard' ? 1.5 : 2);
                }
            });
            y += 2;
        } else {
            const lines = doc.splitTextToSize(text, maxWidth);
            doc.text(lines, margin, y);
            y += lines.length * (tamanoCuerpo * 0.5) + 4;
        }
    }

    addSection(t.perfil, datos.perfil);
    addSection(t.experiencia, datos.experiencia, true);
    addSection(t.educacion, datos.educacion, true);
    addSection(t.habilidades, datos.habilidades, true);
    addSection(t.idiomas, datos.idiomas);
    addSection(t.adicional, datos.formacionAdicional);

    doc.save(`CV_${datos.nombre.replace(/\s+/g, '_')}.pdf`);
});

// ==========================================
// LÓGICA DE AUTOGUARDADO DEFINITIVA CON BLOQUEO
// ==========================================

const KEY_LOCAL_STORAGE = 'micvgratis_cache';
let isCleaning = false; // Bandera de seguridad

const guardarProgreso = () => {
    if (isCleaning) return; // Si estamos limpiando, NO guardamos nada

    const form = document.getElementById('cv-form');
    if (!form) return;

    const datos = {
        nombre: form.nombre.value,
        email: form.email.value,
        telefono: form.telefono.value,
        ciudad: form.ciudad.value,
        pais: form.pais.value,
        perfil: form.perfil.value,
        experiencia: form.experiencia.value,
        educacion: form.educacion.value,
        habilidades: form.habilidades.value,
        idiomas: form.idiomas.value,
        formacionAdicional: form.formacionAdicional.value,
        idiomaCV: document.getElementById('idioma-cv').value,
        disenoCV: document.getElementById('diseno-cv').value
    };

    localStorage.setItem(KEY_LOCAL_STORAGE, JSON.stringify(datos));
};

const cargarProgreso = () => {
    const datosJSON = localStorage.getItem(KEY_LOCAL_STORAGE);
    if (!datosJSON) return;

    const datos = JSON.parse(datosJSON);
    const form = document.getElementById('cv-form');
    if (!form) return;

    if (datos.nombre) form.nombre.value = datos.nombre;
    if (datos.email) form.email.value = datos.email;
    if (datos.telefono) form.telefono.value = datos.telefono;
    if (datos.ciudad) form.ciudad.value = datos.ciudad;
    if (datos.pais) form.pais.value = datos.pais;
    if (datos.perfil) form.perfil.value = datos.perfil;
    if (datos.experiencia) form.experiencia.value = datos.experiencia;
    if (datos.educacion) form.educacion.value = datos.educacion;
    if (datos.habilidades) form.habilidades.value = datos.habilidades;
    if (datos.idiomas) form.idiomas.value = datos.idiomas;
    if (datos.formacionAdicional) form.formacionAdicional.value = datos.formacionAdicional;
    
    if (datos.idiomaCV) document.getElementById('idioma-cv').value = datos.idiomaCV;
    if (datos.disenoCV) document.getElementById('diseno-cv').value = datos.disenoCV;
};

// Función de limpieza "A prueba de balas"
function borrarTodoYReiniciar() {
    if (confirm("¿Estás seguro de que quieres borrar todos los datos redactados?")) {
        isCleaning = true; // ACTIVAMOS BLOQUEO
        
        // 1. Borramos localStorage inmediatamente
        localStorage.removeItem(KEY_LOCAL_STORAGE);
        localStorage.clear();

        // 2. Vaciamos físicamente el formulario
        const form = document.getElementById('cv-form');
        if (form) form.reset();

        // 3. Limpiamos la previsualización
        const resultado = document.getElementById('resultado');
        if (resultado) resultado.innerHTML = "";
        document.getElementById('descargar-pdf').style.display = 'none';

        // 4. Forzamos recarga ignorando la caché del navegador
        window.location.href = window.location.pathname + "?v=" + Date.now();
    }
}

// Inicialización de eventos
document.addEventListener('DOMContentLoaded', () => {
    cargarProgreso();

    const form = document.getElementById('cv-form');
    if (form) {
        form.addEventListener('input', () => {
            clearTimeout(window.saveTimer);
            window.saveTimer = setTimeout(guardarProgreso, 500);
        });

        // Guardar al cerrar o perder foco, excepto si estamos limpiando
        window.addEventListener('beforeunload', () => {
            if (!isCleaning) guardarProgreso();
        });
    }
});
