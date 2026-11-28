const API_BASE = '/api';

async function request(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        ...options
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const mensaje = data.error || `Error HTTP ${response.status}`;
        throw new Error(mensaje);
    }

    return data;
}

// --- Materias (Supabase) ---
export function getMaterias() {
    return request('/materias');
}

export function createMateria(payload) {
    return request('/materias', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export function updateMateria(id, payload) {
    return request(`/materias/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
}

export function deleteMateria(id) {
    return request(`/materias/${id}`, {
        method: 'DELETE'
    });
}

// --- Tareas (Supabase + Integración MongoDB) ---
export function getTareas() {
    return request('/tareas');
}

export function createTarea(payload) {
    return request('/tareas', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export function updateTarea(id, payload) {
    return request(`/tareas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
}

export function deleteTarea(id) {
    return request(`/tareas/${id}`, {
        method: 'DELETE'
    });
}

export function getTareaDetalle(id) {
    return request(`/tareas/${id}/detalle`);
}

// --- Notas de tarea (MongoDB Atlas) ---
export function getNotasByTarea(tareaId) {
    const query = tareaId ? `?tarea_id=${encodeURIComponent(tareaId)}` : '';
    return request(`/notas${query}`);
}

export function createNota(payload) {
    return request('/notas', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export function updateNota(id, payload) {
    return request(`/notas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
}

export function deleteNota(id) {
    return request(`/notas/${id}`, {
        method: 'DELETE'
    });
}

// --- Historial de cambios (MongoDB Atlas) ---
export function getHistorialByTarea(tareaId) {
    const query = tareaId ? `?tarea_id=${encodeURIComponent(tareaId)}` : '';
    return request(`/historial${query}`);
}