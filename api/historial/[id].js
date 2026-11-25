import { ObjectId } from 'mongodb';
import { getDb } from '../config/mongodb.js';

export default async function handler(req, res) {
    const { id } = req.query;

    if (!id || !ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID de historial inválido' });
    }

    try {
        const db = await getDb();
        const collection = db.collection('historial_cambios');
        const objectId = new ObjectId(id);

        if (req.method === 'PUT') {
            const { campo, valor_anterior, valor_nuevo, fecha_cambio } = req.body || {};
            const cambios = {};

            if (campo !== undefined) {
                if (typeof campo !== 'string' || !campo.trim()) {
                    return res.status(400).json({ error: 'El campo no puede estar vacío' });
                }
                cambios.campo = campo.trim();
            }

            if (valor_anterior !== undefined) cambios.valor_anterior = valor_anterior;
            if (valor_nuevo !== undefined) cambios.valor_nuevo = valor_nuevo;
            if (fecha_cambio !== undefined) cambios.fecha_cambio = fecha_cambio;

            if (Object.keys(cambios).length === 0) {
                return res.status(400).json({ error: 'No se enviaron datos para actualizar' });
            }

            const actualizado = await collection.findOneAndUpdate(
                { _id: objectId },
                { $set: cambios },
                { returnDocument: 'after' }
            );

            if (!actualizado) {
                return res.status(404).json({ error: 'Registro de historial no encontrado' });
            }

            return res.status(200).json(actualizado);
        }

        if (req.method === 'DELETE') {
            const eliminado = await collection.findOneAndDelete({ _id: objectId });

            if (!eliminado) {
                return res.status(404).json({ error: 'Registro de historial no encontrado' });
            }

            return res.status(200).json({
                message: 'Registro de historial eliminado correctamente',
                id
            });
        }

        return res.status(405).json({ error: 'Método no permitido' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}