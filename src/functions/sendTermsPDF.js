// Ejemplo Cloud Function para enviar PDF por email usando SendGrid
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();
sgMail.setApiKey(functions.config().sendgrid.key);

exports.sendTermsPDF = functions.https.onRequest(async (req, res) => {
  const { email, pdfUrl, empresa, representante } = req.body;
  if (!email || !pdfUrl) {
    res.status(400).send("Faltan datos");
    return;
  }

  const msg = {
    to: email,
    from: "noreply@tuempresa.com",
    subject: "Términos y condiciones de postulación",
    text: `Estimado/a ${representante.nombre}, adjuntamos los términos y condiciones de su postulación. Le solicitaremos la documentación legal para acreditar la información de la empresa.`,
    html: `<p>Estimado/a <b>${representante.nombre}</b>,<br>
      Adjuntamos los términos y condiciones de su postulación.<br>
      <b>Le solicitaremos la documentación legal para acreditar la información de la empresa.</b>
      <br><br>
      <a href="${pdfUrl}">Descargar términos y condiciones (PDF)</a>
      </p>`,
    attachments: [
      {
        content: (await fetch(pdfUrl).then(r => r.arrayBuffer()).then(b => Buffer.from(b).toString('base64'))),
        filename: "terminos.pdf",
        type: "application/pdf",
        disposition: "attachment"
      }
    ]
  };

  try {
    await sgMail.send(msg);
    res.status(200).send("Enviado");
  } catch (err) {
    res.status(500).send("Error al enviar email: " + err.message);
  }
});