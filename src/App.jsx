import { useEffect, useState } from 'react';
import {
    getMaterias,
    getTareas,
    createTarea,
    updateTarea,
    deleteTarea,
    getTareaDetalle,
    createNota,
    updateNota,
    deleteNota
} from './services/api';
import './App.css';

const ESTADOS = ['Pendiente', 'En progreso', 'Completada'];
const PRIORIDADES = ['Baja', 'Media', 'Alta'];

export default function App() {
    const [materias, setMaterias] = useState([]);
    const [tareas, setTareas] = useState([]);
    const [materiaFiltro, setMateriaFiltro] = useState('todas');

    const [tareaSeleccionadaId, setTareaSeleccionadaId] = useState(null);
    const [detalle, setDetalle] = useState(null);

    const [nuevaTarea, setNuevaTarea] = useState({
        materia_id: '',
        titulo: '',
        descripcion: '',
        fecha_entrega: '',
        prioridad: 'Media',
        estado: 'Pendiente'
    });

    const [nuevaNota, setNuevaNota] = useState({
        titulo: '',
        contenido: '',
        etiquetasTexto: ''
    });

    const [cargando, setCargando] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [avisoMsg, setAvisoMsg] = useState('');

    async function cargarDatosIniciales() {
        try {
            setCargando(true);
            setErrorMsg('');
            const [mats, tars] = await Promise.all([getMaterias(), getTareas()]);
            setMaterias(mats);
            setTareas(tars);

            if (mats.length > 0 && !nuevaTarea.materia_id) {
                setNuevaTarea((prev) => ({ ...prev, materia_id: String(mats[0].id) }));
            }

            if (tars.length > 0) {
                const idActual = tareaSeleccionadaId ?? tars[0].id;
                setTareaSeleccionadaId(idActual);
                await cargarDetalle(idActual);
            } else {
                setDetalle(null);
            }
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setCargando(false);
        }
    }

    async function cargarDetalle(idTarea) {
        if (!idTarea) {
            setDetalle(null);
            return;
        }
        try {
            const data = await getTareaDetalle(idTarea);
            setDetalle(data);
        } catch (err) {
            setErrorMsg(err.message);
        }
    }

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    async function handleSeleccionarTarea(idTarea) {
        setTareaSeleccionadaId(idTarea);
        setErrorMsg('');
        await cargarDetalle(idTarea);
    }

    async function handleCrearTarea(e) {
        e.preventDefault();
        setErrorMsg('');
        setAvisoMsg('');

        try {
            const payload = {
                materia_id: Number(nuevaTarea.materia_id),
                titulo: nuevaTarea.titulo.trim(),
                descripcion: nuevaTarea.descripcion.trim() || null,
                fecha_entrega: nuevaTarea.fecha_entrega
                    ? new Date(nuevaTarea.fecha_entrega).toISOString()
                    : null,
                prioridad: nuevaTarea.prioridad,
                estado: nuevaTarea.estado
            };

            const creada = await createTarea(payload);
            setNuevaTarea((prev) => ({
                ...prev,
                titulo: '',
                descripcion: '',
                fecha_entrega: ''
            }));

            const tars = await getTareas();
            setTareas(tars);
            setTareaSeleccionadaId(creada.id);
            await cargarDetalle(creada.id);
            setAvisoMsg('Tarea creada en Supabase.');
        } catch (err) {
            setErrorMsg(err.message);
        }
    }

    async function handleCambiarEstado(idTarea, nuevoEstado) {
        setErrorMsg('');
        setAvisoMsg('');
        try {
            await updateTarea(idTarea, { estado: nuevoEstado });
            const tars = await getTareas();
            setTareas(tars);
            if (tareaSeleccionadaId === idTarea) {
                await cargarDetalle(idTarea);
            }
            setAvisoMsg(`Estado actualizado a "${nuevoEstado}" y registrado en historial.`);
        } catch (err) {
            setErrorMsg(err.message);
        }
    }

    async function handleEliminarTarea(idTarea) {
        setErrorMsg('');
        setAvisoMsg('');
        try {
            await deleteTarea(idTarea);
            const tars = await getTareas();
            setTareas(tars);

            if (tareaSeleccionadaId === idTarea) {
                const siguiente = tars[0]?.id ?? null;
                setTareaSeleccionadaId(siguiente);
                await cargarDetalle(siguiente);
            }
            setAvisoMsg('Tarea eliminada y datos asociados limpiados.');
        } catch (err) {
            setErrorMsg(err.message);
        }
    }

    async function handleCrearNota(e) {
        e.preventDefault();
        if (!tareaSeleccionadaId) return;
        setErrorMsg('');
        setAvisoMsg('');

        try {
            const etiquetas = nuevaNota.etiquetasTexto
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean);

            await createNota({
                tarea_id: Number(tareaSeleccionadaId),
                titulo: nuevaNota.titulo.trim(),
                contenido: nuevaNota.contenido.trim(),
                etiquetas,
                checklist: []
            });

            setNuevaNota({ titulo: '', contenido: '', etiquetasTexto: '' });
            await cargarDetalle(tareaSeleccionadaId);
            setAvisoMsg('Nota guardada en MongoDB Atlas.');
        } catch (err) {
            setErrorMsg(err.message);
        }
    }

    async function handleToggleChecklist(nota, indexItem) {
        const checklistActualizado = (nota.checklist || []).map((item, idx) =>
            idx === indexItem ? { ...item, completado: !item.completado } : item
        );

        try {
            await updateNota(nota._id, { checklist: checklistActualizado });
            await cargarDetalle(tareaSeleccionadaId);
        } catch (err) {
            setErrorMsg(err.message);
        }
    }

    async function handleEliminarNota(notaId) {
        try {
            await deleteNota(notaId);
            await cargarDetalle(tareaSeleccionadaId);
            setAvisoMsg('Nota eliminada.');
        } catch (err) {
            setErrorMsg(err.message);
        }
    }

    const tareasFiltradas =
        materiaFiltro === 'todas'
            ? tareas
            : tareas.filter((t) => String(t.materia_id) === String(materiaFiltro));

    return (
        <main className="studia-app">
            <header className="studia-header">
                <div>
                    <h1>Studia</h1>
                    <p>Gestor académico híbrido: Supabase (SQL) + MongoDB Atlas (NoSQL)</p>
                </div>
                <button type="button" onClick={cargarDatosIniciales}>
                    Actualizar todo
                </button>
            </header>

            {errorMsg && <div className="alerta error">{errorMsg}</div>}
            {avisoMsg && <div className="alerta exito">{avisoMsg}</div>}

            {cargando ? (
                <p>Cargando datos de Studia...</p>
            ) : (
                <div className="studia-grid">
                    {/* Columna 1: Materias y creación de tarea */}
                    <section className="panel">
                        <h2>Materias</h2>
                        <ul className="lista-materias">
                            <li>
                                <button
                                    type="button"
                                    className={materiaFiltro === 'todas' ? 'activo' : ''}
                                    onClick={() => setMateriaFiltro('todas')}
                                >
                                    Todas ({tareas.length})
                                </button>
                            </li>
                            {materias.map((mat) => (
                                <li key={mat.id}>
                                    <button
                                        type="button"
                                        className={String(materiaFiltro) === String(mat.id) ? 'activo' : ''}
                                        onClick={() => setMateriaFiltro(String(mat.id))}
                                    >
                                        <span
                                            className="punto-color"
                                            style={{ backgroundColor: mat.color || '#3B82F6' }}
                                        />
                                        {mat.nombre}
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <h3>Nueva tarea</h3>
                        <form onSubmit={handleCrearTarea} className="form-stack">
                            <select
                                value={nuevaTarea.materia_id}
                                onChange={(e) =>
                                    setNuevaTarea({ ...nuevaTarea, materia_id: e.target.value })
                                }
                                required
                            >
                                {materias.map((mat) => (
                                    <option key={mat.id} value={mat.id}>
                                        {mat.nombre}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="text"
                                placeholder="Título de la tarea"
                                value={nuevaTarea.titulo}
                                onChange={(e) =>
                                    setNuevaTarea({ ...nuevaTarea, titulo: e.target.value })
                                }
                                required
                            />

                            <textarea
                                placeholder="Descripción (opcional)"
                                rows={2}
                                value={nuevaTarea.descripcion}
                                onChange={(e) =>
                                    setNuevaTarea({ ...nuevaTarea, descripcion: e.target.value })
                                }
                            />

                            <input
                                type="datetime-local"
                                value={nuevaTarea.fecha_entrega}
                                onChange={(e) =>
                                    setNuevaTarea({ ...nuevaTarea, fecha_entrega: e.target.value })
                                }
                            />

                            <div className="fila-doble">
                                <select
                                    value={nuevaTarea.prioridad}
                                    onChange={(e) =>
                                        setNuevaTarea({ ...nuevaTarea, prioridad: e.target.value })
                                    }
                                >
                                    {PRIORIDADES.map((prio) => (
                                        <option key={prio} value={prio}>
                                            {prio}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={nuevaTarea.estado}
                                    onChange={(e) =>
                                        setNuevaTarea({ ...nuevaTarea, estado: e.target.value })
                                    }
                                >
                                    {ESTADOS.map((est) => (
                                        <option key={est} value={est}>
                                            {est}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button type="submit">Guardar tarea</button>
                        </form>
                    </section>

                    {/* Columna 2: Lista de tareas */}
                    <section className="panel">
                        <h2>Tareas ({tareasFiltradas.length})</h2>
                        {tareasFiltradas.length === 0 ? (
                            <p>No hay tareas en este filtro.</p>
                        ) : (
                            <ul className="lista-tareas">
                                {tareasFiltradas.map((tarea) => (
                                    <li
                                        key={tarea.id}
                                        className={
                                            tareaSeleccionadaId === tarea.id
                                                ? 'tarjeta-tarea seleccionada'
                                                : 'tarjeta-tarea'
                                        }
                                    >
                                        <div
                                            className="tarea-cuerpo"
                                            onClick={() => handleSeleccionarTarea(tarea.id)}
                                        >
                                            <strong>{tarea.titulo}</strong>
                                            <small>
                                                {tarea.materias?.nombre || `Materia #${tarea.materia_id}`} ·
                                                Prioridad: {tarea.prioridad}
                                            </small>
                                            {tarea.descripcion && <p>{tarea.descripcion}</p>}
                                        </div>

                                        <div className="tarea-acciones">
                                            <select
                                                value={tarea.estado}
                                                onChange={(e) =>
                                                    handleCambiarEstado(tarea.id, e.target.value)
                                                }
                                            >
                                                {ESTADOS.map((est) => (
                                                    <option key={est} value={est}>
                                                        {est}
                                                    </option>
                                                ))}
                                            </select>

                                            <button
                                                type="button"
                                                onClick={() => handleEliminarTarea(tarea.id)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {/* Columna 3: Detalle integrado (Supabase + Notas + Historial en MongoDB) */}
                    <section className="panel">
                        <h2>Detalle de tarea</h2>
                        {!detalle ? (
                            <p>Selecciona una tarea para ver sus notas e historial.</p>
                        ) : (
                            <div>
                                <div className="bloque-detalle">
                                    <h3>{detalle.tarea.titulo}</h3>
                                    <p>
                                        <strong>Materia:</strong> {detalle.tarea.materias?.nombre || '—'} ·{' '}
                                        <strong>Estado:</strong> {detalle.tarea.estado} ·{' '}
                                        <strong>Prioridad:</strong> {detalle.tarea.prioridad}
                                    </p>
                                    {detalle.tarea.descripcion && <p>{detalle.tarea.descripcion}</p>}
                                </div>

                                <div className="bloque-detalle">
                                    <h3>Notas ({detalle.notas.length})</h3>
                                    <form onSubmit={handleCrearNota} className="form-stack">
                                        <input
                                            type="text"
                                            placeholder="Título de la nota"
                                            value={nuevaNota.titulo}
                                            onChange={(e) =>
                                                setNuevaNota({ ...nuevaNota, titulo: e.target.value })
                                            }
                                            required
                                        />
                                        <textarea
                                            placeholder="Contenido o apuntes..."
                                            rows={2}
                                            value={nuevaNota.contenido}
                                            onChange={(e) =>
                                                setNuevaNota({ ...nuevaNota, contenido: e.target.value })
                                            }
                                        />
                                        <input
                                            type="text"
                                            placeholder="Etiquetas separadas por coma (ej. SQL, Examen)"
                                            value={nuevaNota.etiquetasTexto}
                                            onChange={(e) =>
                                                setNuevaNota({
                                                    ...nuevaNota,
                                                    etiquetasTexto: e.target.value
                                                })
                                            }
                                        />
                                        <button type="submit">Agregar nota</button>
                                    </form>

                                    <ul className="lista-notas">
                                        {detalle.notas.map((nota) => (
                                            <li key={nota._id} className="tarjeta-nota">
                                                <div className="nota-top">
                                                    <strong>{nota.titulo}</strong>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEliminarNota(nota._id)}
                                                    >
                                                        Borrar
                                                    </button>
                                                </div>
                                                {nota.contenido && <p>{nota.contenido}</p>}
                                                {Array.isArray(nota.etiquetas) && nota.etiquetas.length > 0 && (
                                                    <div className="etiquetas">
                                                        {nota.etiquetas.map((tag, i) => (
                                                            <span key={i} className="tag">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {Array.isArray(nota.checklist) && nota.checklist.length > 0 && (
                                                    <ul className="checklist">
                                                        {nota.checklist.map((item, idx) => (
                                                            <li key={idx}>
                                                                <label>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={Boolean(item.completado)}
                                                                        onChange={() =>
                                                                            handleToggleChecklist(nota, idx)
                                                                        }
                                                                    />
                                                                    {item.texto}
                                                                </label>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bloque-detalle">
                                    <h3>Historial de cambios ({detalle.historial.length})</h3>
                                    {detalle.historial.length === 0 ? (
                                        <p>Sin cambios registrados aún.</p>
                                    ) : (
                                        <ul className="lista-historial">
                                            {detalle.historial.map((h) => (
                                                <li key={h._id}>
                                                    <strong>{h.campo}</strong>: {String(h.valor_anterior ?? '—')}{' '}
                                                    → {String(h.valor_nuevo ?? '—')}
                                                    <small>
                                                        {' '}
                                                        ({new Date(h.fecha_cambio).toLocaleString()})
                                                    </small>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </main>
    );
}