================================================================
  FRONTEND - PAGINA WEB DE TRANSACCIONES
================================================================

DESCRIPCION
-----------
Aplicacion web de una sola pagina (SPA) que permite gestionar
transacciones financieras. Incluye autenticacion con JWT,
cifrado AES-256 de datos sensibles y comunicacion
API REST en el backend.

TECNOLOGIAS
-----------
- HTML5 / CSS3
- Bootstrap 5.3.2  (via CDN)
- CryptoJS 4.1.1   (via CDN, cifrado AES-256-CBC)
- JavaScript (ES2020+, Fetch API)

ESTRUCTURA DEL PROYECTO
------------------------
frontend/
  index.html       -- Pagina principal (login + app en un solo archivo)
  js/
    app.js         -- Logica de negocio y comunicacion con la API