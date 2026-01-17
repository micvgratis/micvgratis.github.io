// 1. DICCIONARIO DE TRADUCCIONES
const diccionarios = {
    es: {
        perfil: "Perfil Profesional",
        experiencia: "Experiencia Laboral",
        educacion: "Educación",
        habilidades: "Competencias",
        idiomas: "Idiomas",
        adicional: "Formación Adicional"
    },
    en: {
        perfil: "Professional Profile",
        experiencia: "Work Experience",
        educacion: "Education",
        habilidades: "Skills",
        idiomas: "Languages",
        adicional: "Additional Training"
    },
    fr: {
        perfil: "Profil Professionnel",
        experiencia: "Expérience Professionnelle",
        educacion: "Éducation",
        habilidades: "Compétences",
        idiomas: "Langues",
        adicional: "Formation Complémentaire"
    },
    de: {
        perfil: "Berufliches Profil",
        experiencia: "Berufserfahrung",
        educacion: "Ausbildung",
        habilidades: "Fähigkeiten",
        idiomas: "Sprachen",
        adicional: "Zusatzqualifikationen"
    },
    it: {
        perfil: "Profilo Professionale",
        experiencia: "Esperienza Lavorativa",
        educacion: "Istruzione",
        habilidades: "Competenze",
        idiomas: "Lingue",
        adicional: "Formazione Aggiuntiva"
    }
};

document.getElementById('cv-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    const form = event.target;

    // Detectar idioma seleccionado
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
        idioma: idiomaElegido, // Guardamos el idioma en los datos
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

    // Generar resultado con títulos traducidos
    const resultado = `
Nombre: ${datos.nombre}
Email: ${datos.email}
Teléfono: ${datos.telefono}
Ciudad: ${datos.ciudad}
País: ${datos.pais}

${t.perfil}:
${datos.perfil}

${t.experiencia}:
${datos.experiencia}

${t.educacion}:
${datos.educacion}

${t.habilidades}:
${datos.habilidades}

${t.idiomas}:
${datos.idiomas}

${t.adicional}:
${datos.formacionAdicional}
  `;
    document.getElementById('resultado').textContent = resultado;
    document.getElementById('descargar-pdf').style.display = 'inline-block';

    window.__cvData = datos;
});

document.getElementById('descargar-pdf').addEventListener('click', function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const datos = window.__cvData;
    
    // Obtener etiquetas según el idioma guardado
    const t = diccionarios[datos.idioma || 'es'];

    const selector = document.getElementById('diseno-cv');
    const diseno = selector ? selector.value : 'clasico';
    
    let margin = 20;
    let y = margin;
    const maxWidth = 170;

    // --- CONFIGURACIÓN DE COLORES Y FUENTES ---
    let r = 0, g = 51, b = 102; 
    let fuentePrincipal = 'helvetica';

    if (diseno === 'moderno') {
        r = 37; g = 99; b = 235; 
    } else if (diseno === 'minimalista' || diseno === 'harvard') {
        r = 0; g = 0; b = 0; // Negro para Harvard y Minimalista
        if (diseno === 'harvard') fuentePrincipal = 'times'; // Fuente Serif para Harvard
    }

    // --- ENCABEZADO ---
    doc.setTextColor(r, g, b); 
    
    if (diseno === 'harvard') {
        // Estilo Harvard: Nombre centrado en Times Bold
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
        // Estilo Normal (Moderno/Clásico/Minimalista)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        if (diseno === 'moderno') {
            doc.text(datos.nombre.toUpperCase(), doc.internal.pageSize.width / 2, y, { align: 'center' });
        } else {
            doc.text(datos.nombre, margin, y);
        }
        y += 8;
        doc.setFontSize(11);
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

    // FOTO (Se oculta automáticamente en Harvard)
    if (datos.foto && diseno !== 'harvard') {
        try {
            const imgSize = 30;
            const xFoto = (diseno === 'moderno') ? margin : doc.internal.pageSize.width - margin - imgSize;
            doc.addImage(datos.foto, 'JPEG', xFoto, margin - 10, imgSize, imgSize);
        } catch (e) { console.error("Error foto:", e); }
    }

    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, 190, y);
    y += 10;

    // --- FUNCIÓN DE SECCIONES MEJORADA PARA HARVARD ---
    function addSection(title, text, isBullet = false) {
        if (!text || !text.trim()) return;

        if (y + 25 > doc.internal.pageSize.height - margin) {
            doc.addPage();
            y = margin;
        }

        // Título de sección
        doc.setFont(fuentePrincipal, 'bold');
        doc.setFontSize(diseno === 'harvard' ? 12 : 14);
        doc.setTextColor(r, g, b); 
        
        const label = (diseno === 'clasico' || diseno === 'harvard') ? title.toUpperCase() : title;
        doc.text(label, margin, y);
        
        if(diseno === 'harvard') {
            y += 2;
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.2);
            doc.line(margin, y, 190, y); // Línea fina típica de Harvard
            y += 5;
        } else {
            y += 7;
        }

        // Texto de sección
        doc.setFont(fuentePrincipal, 'normal');
        doc.setFontSize(diseno === 'harvard' ? 10 : 11);
        doc.setTextColor(50, 50, 50);

        if (isBullet) {
            const lines = text.split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    const bullet = (diseno === 'minimalista' || diseno === 'harvard') ? "- " : "• ";
                    const splitLine = doc.splitTextToSize(bullet + line.trim(), maxWidth);
                    doc.text(splitLine, margin, y);
                    y += splitLine.length * (diseno === 'harvard' ? 5 : 6);
                }
            });
            y += 2;
        } else {
            const lines = doc.splitTextToSize(text, maxWidth);
            doc.text(lines, margin, y);
            y += lines.length * (diseno === 'harvard' ? 5 : 6) + 4;
        }
    }

    // USAR LAS ETIQUETAS TRADUCIDAS
    addSection(t.perfil, datos.perfil);
    addSection(t.experiencia, datos.experiencia, true);
    addSection(t.educacion, datos.educacion, true);
    addSection(t.habilidades, datos.habilidades, true);
    addSection(t.idiomas, datos.idiomas);
    addSection(t.adicional, datos.formacionAdicional);

    doc.save(`CV_${datos.nombre.replace(/\s+/g, '_')}.pdf`);
});
