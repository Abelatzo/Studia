import { ObjectId } from 'mongodb';
import { getDb } from '../config/mongodb.js';

export default async function handler(req, res) {
    const { id } = req.query;

    if (!id || !ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID de nota inválido' });
    }

    try {
        const db = await getDb();
        const collection = db.collection('notas_tarea');
        const objectId = new ObjectId(id);

        if (req.method === 'PUT') {
            const { titulo, contenido, etiquetas, checklist, tarea_id } = req.body || {};
            const cambios = {};

            if (tarea_id !== undefined) {
                const tareaIdNum = Number(tarea_id);
                if (!Number.isInteger(tareaIdNum) || tareaIdNum <= 0) {
                    return res.status(400).json({ error: 'tarea_id inválido' });
                }
                cambios.tarea_id = tareaIdNum;
            }

            if (titulo !== undefined) {
                if (typeof titulo !== 'string' || !titulo.trim()) {
                    return res.status(400).json({ error: 'El título no puede estar vacío' });
                }
                cambios.titulo = titulo.trim();
            }

            if (contenido !== undefined) {
                if (typeof contenido !== 'string') {
                    return res.status(400).json({ error: 'El contenido debe ser texto' });
                }
                cambios.contenido = contenido;
            }

            if (etiquetas !== undefined) {
                if (!Array.isArray(etiquetas)) {
                    return res.status(400).json({ error: 'etiquetas debe ser un arreglo' });
                }
                cambios.etiquetas = etiquetas;
            }

            if (checklist !== undefined) {
                if (!Array.isArray(checklist)) {
                    return res.status(400).json({ error: 'checklist debe ser un arreglo' });
                }
                cambios.checklist = checklist;
            }

            if (Object.keys(cambios).length === 0) {
                return res.status(400).json({ error: 'No se enviaron datos para actualizar' });
            }

            cambios.fecha_actualizacion = new Date().toISOString();

            const actualizada = await collection.findOneAndUpdate(
                { _id: objectId },
                { $set: cambios },
                { returnDocument: 'after' }
            );

            if (!actualizada) {
                return res.status(404).json({ error: 'Nota no encontrada' });
            }

            return res.status(200).json(actualizada);
        }

        if (req.method === 'DELETE') {
            const eliminada = await collection.findOneAndDelete({ _id: objectId });

            if (!eliminada) {
                return res.status(404).json({ error: 'Nota no encontrada' });
            }

            return res.status(200).json({
                message: 'Nota eliminada correctamente',
                id
            });
        }

        return res.status(405).json({ error: 'Método no permitido' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}