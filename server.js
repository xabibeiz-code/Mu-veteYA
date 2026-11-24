const path = require('path');
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
app.use(cors());
app.use(express.json());

// Sirve tu index.html y archivos estáticos desde la misma carpeta
app.use(express.static(__dirname));

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/enviar-sms', async (req, res) => {
  const { telefono, placa, cajon, mensajePersonalizado } = req.body;

  if (!telefono) {
    return res.status(400).json({ exito: false, error: 'Falta el número de teléfono' });
  }

  if (!client || !twilioPhone) {
    return res.status(500).json({
      exito: false,
      error: 'Faltan variables de entorno de Twilio en el servidor'
    });
  }

  let numeroDestino = String(telefono).replace(/\D/g, '');
  if (numeroDestino.length === 10) {
    numeroDestino = `+52${numeroDestino}`;
  } else if (!numeroDestino.startsWith('+')) {
    numeroDestino = `+${numeroDestino}`;
  }

  const textoSMS = mensajePersonalizado ||
    `MuéveteYa (ParkCode): Hola, por favor acude a mover tu auto placa ${placa || ''} en el cajón ${cajon || ''}. Estorba la salida de otro vehículo.`;

  try {
    const message = await client.messages.create({
      body: textoSMS,
      from: twilioPhone,
      to: numeroDestino
    });

    console.log('✅ SMS enviado correctamente. SID:', message.sid);
    res.json({ exito: true, sid: message.sid });
  } catch (error) {
    console.error('❌ Error de Twilio:', error.message);
    res.status(500).json({ exito: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor MuéveteYa activo en puerto ${PORT}`);
});