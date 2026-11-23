
import { supabase } from '../config/supabase.js';

export default async function handler(req, res) {

    const { id } = req.query;

    if (!id || !/^\d+$/.test(id)) {
        return res.status(400).json({
            error: 'ID de materia inválido'
        });
    }

    if (req.method === 'PUT') {

        try {
            const { nombre, descripcion, color } = req.body;

            const cambios = {};

            if (nombre !== undefined) {
                if (typeof nombre !== 'string' || !nombre.trim()) {
                    return res.status(400).json({
                        error: 'El nombre no puede estar vacío'
                    });
                }

                cambios.nombre = nombre.trim();
            }

            if (descripcion !== undefined) {
                cambios.descripcion = descripcion;
            }

            if (color !== undefined) {
                cambios.color = color;
            }

            if (Object.keys(cambios).length === 0) {
                return res.status(400).json({
                    error: 'No se enviaron datos para actualizar'
                });
            }

            const { data, error } = await supabase
                .from('materias')
                .update(cambios)
                .eq('id', id)
                .select()
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                return res.status(404).json({
                    error: 'Materia no encontrada'
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
                .from('materias')
                .delete()
                .eq('id', id)
                .select('id')
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                return res.status(404).json({
                    error: 'Materia no encontrada'
                });
            }

            return res.status(200).json({
                message: 'Materia eliminada correctamente',
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
