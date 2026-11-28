import { supabase } from '../config/supabase.js';
import { getDb } from '../config/mongodb.js';

const CAMPOS_VIGILADOS = [
    'materia_id',
    'titulo',
    'descripcion',
    'fecha_entrega',
    'prioridad',
    'estado'
];

function normalizarValor(valor) {
    if (valor === undefined || valor === null || valor === '') {
        return null;
    }
    if (valor instanceof Date) {
        return valor.toISOString();
    }
    return valor;
}

export default async function handler(req, res) {
    const { id } = req.query;

    if (!id || !/^\d+$/.test(id)) {
        return res.status(400).json({
            error: 'ID de tarea inválido'
        });
    }

    const tareaIdNum = Number(id);

    if (req.method === 'PUT') {
        try {
            const {
                materia_id,
                titulo,
                descripcion,
                fecha_entrega,
                prioridad,
                estado
            } = req.body || {};

            const cambios = {};

            if (materia_id !== undefined) {
                const materiaIdNum = Number(materia_id);
                if (!Number.isInteger(materiaIdNum) || materiaIdNum <= 0) {
                    return res.status(400).json({
                        error: 'materia_id inválido'
                    });
                }
                cambios.materia_id = materiaIdNum;
            }

            if (titulo !== undefined) {
                if (typeof titulo !== 'string' || !titulo.trim()) {
                    return res.status(400).json({
                        error: 'El título no puede estar vacío'
                    });
                }
                cambios.titulo = titulo.trim();
            }

            if (descripcion !== undefined) {
                cambios.descripcion = descripcion;
            }

            if (fecha_entrega !== undefined) {
                cambios.fecha_entrega = fecha_entrega;
            }

            if (prioridad !== undefined) {
                cambios.prioridad = prioridad;
            }

            if (estado !== undefined) {
                cambios.estado = estado;
            }

            if (Object.keys(cambios).length === 0) {
                return res.status(400).json({
                    error: 'No se enviaron datos para actualizar'
                });
            }

            const { data: tareaAnterior, error: errorConsulta } = await supabase
                .from('tareas')
                .select('*')
                .eq('id', tareaIdNum)
                .maybeSingle();

            if (errorConsulta) throw errorConsulta;

            if (!tareaAnterior) {
                return res.status(404).json({
                    error: 'Tarea no encontrada'
                });
            }

            const { data: tareaActualizada, error: errorUpdate } = await supabase
                .from('tareas')
                .update(cambios)
                .eq('id', tareaIdNum)
                .select()
                .maybeSingle();

            if (errorUpdate) throw errorUpdate;

            if (!tareaActualizada) {
                return res.status(404).json({
                    error: 'Tarea no encontrada'
                });
            }

            const ahora = new Date().toISOString();
            const logsParaInsertar = [];

            for (const campo of CAMPOS_VIGILADOS) {
                if (!(campo in cambios)) continue;

                const valorAnteriorNorm = normalizarValor(tareaAnterior[campo]);
                const valorNuevoNorm = normalizarValor(tareaActualizada[campo]);

                const esFecha = campo === 'fecha_entrega';
                const distintos = esFecha
                    ? String(valorAnteriorNorm) !== String(valorNuevoNorm)
                    : valorAnteriorNorm !== valorNuevoNorm;

                if (distintos) {
                    logsParaInsertar.push({
                        tarea_id: tareaIdNum,
                        campo,
                        valor_anterior: tareaAnterior[campo] ?? null,
                        valor_nuevo: tareaActualizada[campo] ?? null,
                        fecha_cambio: ahora
                    });
                }
            }

            let advertenciaHistorial = null;

            if (logsParaInsertar.length > 0) {
                try {
                    const db = await getDb();
                    await db.collection('historial_cambios').insertMany(logsParaInsertar);
                } catch (mongoError) {
                    advertenciaHistorial = `La tarea se actualizó en Supabase, pero no se pudo registrar el historial en MongoDB: ${mongoError.message}`;
                }
            }

            const respuesta = { ...tareaActualizada };
            if (advertenciaHistorial) {
                respuesta.advertencia_historial = advertenciaHistorial;
            }

            return res.status(200).json(respuesta);
        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { data: eliminada, error: errorDelete } = await supabase
                .from('tareas')
                .delete()
                .eq('id', tareaIdNum)
                .select('id')
                .maybeSingle();

            if (errorDelete) throw errorDelete;

            if (!eliminada) {
                return res.status(404).json({
                    error: 'Tarea no encontrada'
                });
            }

            let limpiezaMongo = {
                notas_eliminadas: 0,
                historial_eliminado: 0,
                advertencia: null
            };

            try {
                const db = await getDb();
                const [resNotas, resHistorial] = await Promise.all([
                    db.collection('notas_tarea').deleteMany({ tarea_id: tareaIdNum }),
                    db.collection('historial_cambios').deleteMany({ tarea_id: tareaIdNum })
                ]);

                limpiezaMongo.notas_eliminadas = resNotas.deletedCount;
                limpiezaMongo.historial_eliminado = resHistorial.deletedCount;
            } catch (mongoError) {
                limpiezaMongo.advertencia = `La tarea se eliminó en Supabase, pero falló la limpieza en MongoDB: ${mongoError.message}`;
            }

            return res.status(200).json({
                message: 'Tarea eliminada correctamente',
                id: eliminada.id,
                mongodb: limpiezaMongo
            });
        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    }

    return res.status(405).json({
        error: 'Método no permitido'
    });
}