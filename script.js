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
  let margin = 20;
  let y = margin;
  const maxWidth = 170;

  // ENCABEZADO (HEADER)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 51, 102);
  doc.text(datos.nombre, margin, y);

  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.setFont('helvetica', 'normal');

  let contactInfo = `Email: ${datos.email} | Teléfono: ${datos.telefono}`;
  if (datos.ciudad && datos.pais) {
    contactInfo += ` | ${datos.ciudad}, ${datos.pais}`;
  } else if (datos.ciudad) {
    contactInfo += ` | ${datos.ciudad}`;
  } else if (datos.pais) {
    contactInfo += ` | ${datos.pais}`;
  }
  doc.text(contactInfo, margin, y);

  // Añadir la foto de perfil si existe
  if (datos.foto) {
    try {
      const imgWidth = 30;
      const imgHeight = 30;
      // Ajuste aquí: 'margin - 10' para subir la imagen 10 unidades.
      // La posición X sigue siendo a la derecha.
      doc.addImage(datos.foto, 'JPEG', doc.internal.pageSize.width - margin - imgWidth, margin - 10, imgWidth, imgHeight);
    } catch (e) {
      console.error("Error al añadir la imagen al PDF:", e);
    }
  }

  y += 10;
  doc.setDrawColor(200);
  doc.line(margin, y, 190, y);
  y += 10;

  function addSection(title, text, isBullet = false) {
    if (!text.trim()) return;

    if (y + 20 > doc.internal.pageSize.height - margin) {
      doc.addPage();
      y = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(title, margin, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(50);

    if (isBullet) {
      const lines = text.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          const splitLine = doc.splitTextToSize(`• ${line.trim()}`, maxWidth);
          doc.text(splitLine, margin, y);
          y += splitLine.length * 6;
        }
      });
      y += 4;
    } else {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, margin, y);
      y += lines.length * 6 + 4;
    }
  }

  addSection('Perfil Profesional', datos.perfil);
  addSection('Experiencia Laboral', datos.experiencia, true);
  addSection('Educación', datos.educacion, true);
  addSection('Competencias', datos.habilidades, true);
  addSection('Idiomas', datos.idiomas);
  addSection('Formación Adicional', datos.formacionAdicional);

  doc.save('curriculum.pdf');
});