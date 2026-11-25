import { getDb } from './config/mongodb.js';

export default async function handler(req, res) {
    try {
        const db = await getDb();
        const collection = db.collection('notas_tarea');

        if (req.method === 'GET') {
            const filtro = {};

            if (req.query.tarea_id !== undefined) {
                const tareaIdNum = Number(req.query.tarea_id);
                if (!Number.isInteger(tareaIdNum) || tareaIdNum <= 0) {
                    return res.status(400).json({ error: 'tarea_id inválido' });
                }
                filtro.tarea_id = tareaIdNum;
            }

            const notas = await collection.find(filtro).sort({ _id: -1 }).toArray();
            return res.status(200).json(notas);
        }

        if (req.method === 'POST') {
            const { tarea_id, titulo, contenido, etiquetas, checklist } = req.body || {};
            const tareaIdNum = Number(tarea_id);

            if (!Number.isInteger(tareaIdNum) || tareaIdNum <= 0) {
                return res.status(400).json({ error: 'tarea_id válido es obligatorio' });
            }

            if (!titulo || typeof titulo !== 'string' || !titulo.trim()) {
                return res.status(400).json({ error: 'El título de la nota es obligatorio' });
            }

            const ahora = new Date().toISOString();
            const nuevaNota = {
                tarea_id: tareaIdNum,
                titulo: titulo.trim(),
                contenido: typeof contenido === 'string' ? contenido : '',
                etiquetas: Array.isArray(etiquetas) ? etiquetas : [],
                checklist: Array.isArray(checklist) ? checklist : [],
                fecha_creacion: ahora,
                fecha_actualizacion: ahora
            };

            const resultado = await collection.insertOne(nuevaNota);
            return res.status(201).json({
                _id: resultado.insertedId,
                ...nuevaNota
            });
        }

        return res.status(405).json({ error: 'Método no permitido' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}