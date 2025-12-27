document.getElementById('cv-form').addEventListener('submit', async function (event) {
  event.preventDefault();
  const form = event.target;

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

  // Se mantiene la previsualización en texto
  const resultado = `
Nombre: ${datos.nombre}
Email: ${datos.email}
Teléfono: ${datos.telefono}
Ciudad: ${datos.ciudad}
País: ${datos.pais}

Perfil Profesional:
${datos.perfil}

Experiencia Laboral:
${datos.experiencia}

Educación:
${datos.educacion}

Competencias:
${datos.habilidades}

Idiomas:
${datos.idiomas}

Formación Adicional:
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
  
  // Capturamos el diseño del selector (si no existe, por defecto es clasico)
  const disenoElement = document.getElementById('diseno-cv');
  const diseno = disenoElement ? disenoElement.value : 'clasico';
  
  let margin = 20;
  let y = margin;
  const maxWidth = 170;

  // --- CONFIGURACIÓN DE COLORES SEGÚN DISEÑO ---
  let colorPrimario = [0, 51, 102]; // Azul oscuro (Clásico)
  
  if (diseno === 'moderno') {
    colorPrimario = [37, 99, 235]; // Azul vibrante
  } else if (diseno === 'minimalista') {
    colorPrimario = [0, 0, 0];    // Negro
  }

  // ENCABEZADO (HEADER)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
  
  // Posicionamiento del nombre
  if (diseno === 'moderno') {
    doc.text(datos.nombre.toUpperCase(), doc.internal.pageSize.width / 2, y, { align: 'center' });
  } else {
    doc.text(datos.nombre, margin, y);
  }

  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.setFont('helvetica', 'normal');

  let contactInfo = `Email: ${datos.email} | Teléfono: ${datos.telefono}`;
  if (datos.ciudad || datos.pais) {
    contactInfo += ` | ${datos.ciudad}${datos.ciudad && datos.pais ? ', ' : ''}${datos.pais}`;
  }

  if (diseno === 'moderno') {
    doc.text(contactInfo, doc.internal.pageSize.width / 2, y, { align: 'center' });
  } else {
    doc.text(contactInfo, margin, y);
  }

  // Añadir la foto de perfil si existe
  if (datos.foto) {
    try {
      const imgWidth = 30;
      const imgHeight = 30;
      // En moderno la foto va a la izquierda, en el resto a la derecha
      const xFoto = diseno === 'moderno' ? margin : doc.internal.pageSize.width - margin - imgWidth;
      doc.addImage(datos.foto, 'JPEG', xFoto, margin - 10, imgWidth, imgHeight);
    } catch (e) {
      console.error("Error al añadir la imagen:", e);
    }
  }

  y += 10;
  doc.setDrawColor(200);
  doc.line(margin, y, 190, y);
  y += 10;

  // FUNCIÓN DE SECCIONES (Adaptada para los estilos)
  function addSection(title, text, isBullet = false) {
    if (!text || !text.trim()) return;

    if (y + 25 > doc.internal.pageSize.height - margin) {
      doc.addPage();
      y = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    
    // Decoración visual simple según diseño
    if (diseno === 'clasico') {
        doc.text(title.toUpperCase(), margin, y);
    } else {
        doc.text(title, margin, y);
    }
    
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(50);

    if (isBullet) {
      const lines = text.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          const char = diseno === 'minimalista' ? "- " : "• ";
          const splitLine = doc.splitTextToSize(`${char}${line.trim()}`, maxWidth);
          doc.text(splitLine, margin, y);
          y += splitLine.length * 6;
        }
      });
      y += 2;
    } else {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, margin, y);
      y += lines.length * 6 + 4;
    }
  }

  // Llamadas a las secciones
  addSection('Perfil Profesional', datos.perfil);
  addSection('Experiencia Laboral', datos.experiencia, true);
  addSection('Educación', datos.educacion, true);
  addSection('Competencias', datos.habilidades, true);
  addSection('Idiomas', datos.idiomas);
  addSection('Formación Adicional', datos.formacionAdicional);

  doc.save(`CV_${datos.nombre.replace(/\s+/g, '_')}.pdf`);
});
