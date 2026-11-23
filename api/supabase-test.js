import { supabase } from './config/supabase.js';

export default async function handler(req, res) {

    if (req.method !== 'GET') {
        return res.status(405).json({
            error: 'Método no permitido'
        });
    }

    try {

        const { data, error } = await supabase
            .from('materias')
            .select('*');

        if (error) {
            throw error;
        }

        return res.status(200).json({
            status: 'success',
            message: 'Conexión con Supabase exitosa',
            materias: data
        });

    } catch (error) {

        return res.status(500).json({
            status: 'error',
            message: 'Error al conectar con Supabase',
            details: error.message
        });

    }
}