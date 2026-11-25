import { getDb } from './config/mongodb.js';

export default async function handler(req, res) {
    try {
        const db = await getDb();
        const collection = db.collection('historial_cambios');

        if (req.method === 'GET') {
            const filtro = {};

            if (req.query.tarea_id !== undefined) {
                const tareaIdNum = Number(req.query.tarea_id);
                if (!Number.isInteger(tareaIdNum) || tareaIdNum <= 0) {
                    return res.status(400).json({ error: 'tarea_id inválido' });
                }
                filtro.tarea_id = tareaIdNum;
            }

            const registros = await collection
                .find(filtro)
                .sort({ fecha_cambio: -1, _id: -1 })
                .toArray();

            return res.status(200).json(registros);
        }

        if (req.method === 'POST') {
            const { tarea_id, campo, valor_anterior, valor_nuevo, fecha_cambio } = req.body || {};
            const tareaIdNum = Number(tarea_id);

            if (!Number.isInteger(tareaIdNum) || tareaIdNum <= 0) {
                return res.status(400).json({ error: 'tarea_id válido es obligatorio' });
            }

            if (!campo || typeof campo !== 'string' || !campo.trim()) {
                return res.status(400).json({ error: 'El campo modificado es obligatorio' });
            }

            const nuevoRegistro = {
                tarea_id: tareaIdNum,
                campo: campo.trim(),
                valor_anterior: valor_anterior ?? null,
                valor_nuevo: valor_nuevo ?? null,
                fecha_cambio: fecha_cambio || new Date().toISOString()
            };

            const resultado = await collection.insertOne(nuevoRegistro);
            return res.status(201).json({
                _id: resultado.insertedId,
                ...nuevoRegistro
            });
        }

        return res.status(405).json({ error: 'Método no permitido' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}