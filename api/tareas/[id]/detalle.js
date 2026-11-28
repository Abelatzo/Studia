import { supabase } from '../../config/supabase.js';
import { getDb } from '../../config/mongodb.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { id } = req.query;
    const tareaIdNum = Number(id);

    if (!id || !/^\d+$/.test(id) || !Number.isInteger(tareaIdNum) || tareaIdNum <= 0) {
        return res.status(400).json({ error: 'ID de tarea inválido' });
    }

    try {
        const { data: tarea, error } = await supabase
            .from('tareas')
            .select(`
                *,
                materias (
                    id,
                    nombre,
                    color
                )
            `)
            .eq('id', tareaIdNum)
            .maybeSingle();

        if (error) throw error;

        if (!tarea) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        const db = await getDb();
        const [notas, historial] = await Promise.all([
            db.collection('notas_tarea')
                .find({ tarea_id: tareaIdNum })
                .sort({ _id: -1 })
                .toArray(),
            db.collection('historial_cambios')
                .find({ tarea_id: tareaIdNum })
                .sort({ fecha_cambio: -1, _id: -1 })
                .toArray()
        ]);

        return res.status(200).json({
            tarea,
            notas,
            historial
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}