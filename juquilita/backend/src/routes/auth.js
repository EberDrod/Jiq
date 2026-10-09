const express = require('express');
const { login, authMiddleware } = require('../services/auth');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
    }
    const result = await login(email, password);
    if (!result) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
