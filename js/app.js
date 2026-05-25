const API_URL = 'http://localhost:8080/api';
const AES_KEY = CryptoJS.enc.Utf8.parse('AES256SecretKey!AES256SecretKey!');
const AES_IV  = CryptoJS.enc.Utf8.parse('InitVector123456');
let paginaActual = 0;


function getToken() {
    return sessionStorage.getItem('jwt');
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

function toast(mensaje, tipo = 'success') {
    const div = document.createElement('div');
    div.className = `alert alert-${tipo} alert-dismissible fade show`;
    div.innerHTML = `${mensaje}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    document.getElementById('toast-container').appendChild(div);
    setTimeout(() => div.remove(), 5000);
}

function cifrarAES(texto) {
    return CryptoJS.AES.encrypt(texto, AES_KEY, {
        iv:      AES_IV,
        mode:    CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    }).toString();
}


function mostrarVista(nombre) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('active'));

    document.getElementById('vista' + nombre.charAt(0).toUpperCase() + nombre.slice(1))
        .classList.add('active');
    document.getElementById('menu' + nombre.charAt(0).toUpperCase() + nombre.slice(1))
        .classList.add('active');

    if (nombre === 'transacciones') cargarTransacciones(0);
}

function mostrarApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appPage').style.display = 'block';
    mostrarVista('registrar');
}

function cerrarSesion() {
    sessionStorage.removeItem('jwt');
    document.getElementById('loginForm').reset();
    document.getElementById('appPage').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
}



document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        username: document.getElementById('loginUser').value.trim(),
        password: document.getElementById('loginPass').value
    };
    try {
        const res  = await fetch(`${API_URL}/login`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(body)
        });
        const data = await res.json();
        if (data.success && data.token) {
            sessionStorage.setItem('jwt', data.token);
            mostrarApp();
        } else {
            toast(data.mensaje || 'Credenciales incorrectas', 'danger');
        }
    } catch {
        toast('No se pudo conectar con el servidor', 'danger');
    }
});


document.getElementById('transaccionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        operacion: document.getElementById('txOperacion').value.trim(),
        importe:   document.getElementById('txImporte').value.trim(),
        cliente:   document.getElementById('txCliente').value.trim(),
        secreto:   cifrarAES(document.getElementById('txSecreto').value.trim())
    };
    try {
        const res  = await fetch(`${API_URL}/transacciones`, {
            method:  'POST',
            headers: authHeaders(),
            body:    JSON.stringify(body)
        });
        const data = await res.json();
        if (res.ok) {
            toast(`✔ ID: ${data.id} | Ref: ${data.referencia} | Estatus: ${data.estatus}`, 'success');
            document.getElementById('transaccionForm').reset();
        } else if (res.status === 403) {
            toast('Sesión expirada, vuelve a iniciar sesión', 'warning');
            cerrarSesion();
        } else {
            const msg = data.errores
                ? Object.values(data.errores).join('<br>')
                : (data.mensaje || 'Error al registrar');
            toast(msg, 'danger');
        }
    } catch {
        toast('No se pudo conectar con el servidor', 'danger');
    }
});


document.getElementById('cancelarForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        id:         parseInt(document.getElementById('cancelId').value),
        referencia: document.getElementById('cancelReferencia').value.trim(),
        estatus:    'cancelar'
    };
    try {
        const res  = await fetch(`${API_URL}/transacciones/estatus`, {
            method:  'PATCH',
            headers: authHeaders(),
            body:    JSON.stringify(body)
        });
        if (res.status === 403) { toast('Sesión expirada', 'warning'); cerrarSesion(); return; }
        const data = await res.json();
        toast(data.mensaje, data.success ? 'success' : 'warning');
        if (data.success) document.getElementById('cancelarForm').reset();
    } catch {
        toast('No se pudo conectar con el servidor', 'danger');
    }
});


async function cargarTransacciones(page) {
    paginaActual = page;
    const size  = document.getElementById('pageSize').value;
    const sort  = document.getElementById('sortField').value;
    const dir   = document.getElementById('sortDir').value;
    const url   = `${API_URL}/transacciones?page=${page}&size=${size}&sort=${sort}&dir=${dir}`;

    const tbody = document.getElementById('tablaTransacciones');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Cargando...</td></tr>';

    try {
        const res  = await fetch(url, { headers: authHeaders() });
        if (res.status === 403) { toast('Sesión expirada', 'warning'); cerrarSesion(); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        tbody.innerHTML = '';
        const items = data.content || [];
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Sin registros</td></tr>';
        } else {
            items.forEach(t => {
                const rowClass = t.estatus === 'Cancelada' ? 'table-danger' : '';
                tbody.innerHTML += `
                    <tr class="${rowClass}">
                        <td>${t.id}</td>
                        <td>${t.operacion}</td>
                        <td>$${t.importe}</td>
                        <td>${t.cliente}</td>
                        <td>${t.referencia}</td>
                        <td><span class="badge bg-${t.estatus === 'Aprobada' ? 'success' : 'danger'}">${t.estatus}</span></td>
                    </tr>`;
            });
        }
        renderPaginacion(data.totalPages, page);
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar</td></tr>';
        console.error(err);
    }
}

function renderPaginacion(totalPages, actual) {
    const cont = document.getElementById('paginacion');
    cont.innerHTML = '';
    for (let i = 0; i < totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `btn btn-sm ${i === actual ? 'btn-primary' : 'btn-outline-primary'}`;
        btn.textContent = i + 1;
        btn.onclick = () => cargarTransacciones(i);
        cont.appendChild(btn);
    }
}


if (getToken()) mostrarApp();
