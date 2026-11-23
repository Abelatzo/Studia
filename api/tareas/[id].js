
import { supabase } from '../config/supabase.js';

export default async function handler(req, res) {

    const { id } = req.query;

    if (!id || !/^\d+$/.test(id)) {
        return res.status(400).json({
            error: 'ID de tarea inválido'
        });
    }

    if (req.method === 'PUT') {

        try {
            const {
                materia_id,
                titulo,
                descripcion,
                fecha_entrega,
                prioridad,
                estado
            } = req.body;

            const cambios = {};

            if (materia_id !== undefined) cambios.materia_id = materia_id;

            if (titulo !== undefined) {
                if (typeof titulo !== 'string' || !titulo.trim()) {
                    return res.status(400).json({
                        error: 'El título no puede estar vacío'
                    });
                }

                cambios.titulo = titulo.trim();
            }

            if (descripcion !== undefined) cambios.descripcion = descripcion;
            if (fecha_entrega !== undefined) cambios.fecha_entrega = fecha_entrega;
            if (prioridad !== undefined) cambios.prioridad = prioridad;
            if (estado !== undefined) cambios.estado = estado;

            if (Object.keys(cambios).length === 0) {
                return res.status(400).json({
                    error: 'No se enviaron datos para actualizar'
                });
            }

            const { data, error } = await supabase
                .from('tareas')
                .update(cambios)
                .eq('id', id)
                .select()
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                return res.status(404).json({
                    error: 'Tarea no encontrada'
                });
            }

            return res.status(200).json(data);

        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    }

    if (req.method === 'DELETE') {

        try {
            const { data, error } = await supabase
                .from('tareas')
                .delete()
                .eq('id', id)
                .select('id')
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                return res.status(404).json({
                    error: 'Tarea no encontrada'
                });
            }

            return res.status(200).json({
                message: 'Tarea eliminada correctamente',
                id: data.id
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
