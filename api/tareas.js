
import { supabase } from './config/supabase.js';

export default async function handler(req, res) {

    if (req.method === 'GET') {

        try {
            const { data, error } = await supabase
                .from('tareas')
                .select(`
                    *,
                    materias (
                        id,
                        nombre
                    )
                `)
                .order('id', { ascending: true });

            if (error) throw error;

            return res.status(200).json(data);

        } catch (error) {
            return res.status(500).json({
                error: error.message
            });
        }
    }

    if (req.method === 'POST') {

        try {
            const {
                materia_id,
                titulo,
                descripcion,
                fecha_entrega,
                prioridad,
                estado
            } = req.body;

            if (!materia_id || !titulo || !titulo.trim()) {
                return res.status(400).json({
                    error: 'La materia y el título son obligatorios'
                });
            }

            const { data, error } = await supabase
                .from('tareas')
                .insert({
                    materia_id,
                    titulo: titulo.trim(),
                    descripcion,
                    fecha_entrega,
                    prioridad: prioridad || 'Media',
                    estado: estado || 'Pendiente'
                })
                .select()
                .single();

            if (error) throw error;

            return res.status(201).json(data);

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
