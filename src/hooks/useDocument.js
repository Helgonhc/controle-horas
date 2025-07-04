// Local do arquivo: src/hooks/useDocument.js

import { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

export const useDocument = (collectionName, id, uid) => {
    const [document, setDocument] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!uid || !id) {
            setIsLoading(false);
            return;
        }

        const docRef = doc(db, 'users', uid, collectionName, id);
        setIsLoading(true);

        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                setDocument({ ...snapshot.data(), id: snapshot.id });
                setError(null);
            } else {
                setError('Documento não encontrado.');
                setDocument(null);
            }
            setIsLoading(false);
        }, (err) => {
            console.error(err);
            setError('Falha ao buscar o documento.');
            setIsLoading(false);
        });

        // Limpa o listener ao desmontar o componente
        return () => unsubscribe();

    }, [collectionName, id, uid]);

    return { document, isLoading, error };
};