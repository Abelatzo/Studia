
import { supabase } from './config/supabase.js';

export default async function handler(req, res) {

    if (req.method === 'GET') {

        try {
            const { data, error } = await supabase
                .from('materias')
                .select('*')
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
            const { nombre, descripcion, color } = req.body;

            if (!nombre || !nombre.trim()) {
                return res.status(400).json({
                    error: 'El nombre de la materia es obligatorio'
                });
            }

            const { data, error } = await supabase
                .from('materias')
                .insert({
                    nombre: nombre.trim(),
                    descripcion,
                    color
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
