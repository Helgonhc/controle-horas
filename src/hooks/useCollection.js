// Local do arquivo: src/hooks/useCollection.js
import { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, query as firestoreQueryBuilder } from 'firebase/firestore'; 

export const useCollection = (colPath, firestoreQuery = null) => { 
    const [documents, setDocuments] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        setError(null); 

        let ref;
        if (firestoreQuery) {
            // Se uma query Firestore já foi construída e passada (usando query(), collection(), orderBy(), etc.)
            ref = firestoreQuery; 
        } else if (colPath) {
            // Caso contrário, se apenas o caminho da coleção foi passado
            ref = collection(db, colPath);
        } else {
            // Se nenhum dos dois foi fornecido, algo está errado
            console.error("useCollection: Caminho da coleção ou query Firestore deve ser fornecido.");
            setError("Configuração de busca de dados inválida.");
            setIsLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(ref, (snapshot) => {
            let results = [];
            snapshot.docs.forEach(doc => {
                results.push({ ...doc.data(), id: doc.id });
            });
            setDocuments(results);
            setError(null);
            setIsLoading(false);
        }, (err) => {
            console.error("Erro ao buscar coleção:", err);
            setError('Não foi possível buscar os dados: ' + err.message);
            setIsLoading(false);
        });

        // Limpa o listener quando o componente é desmontado ou as dependências mudam
        return () => unsubscribe();

    }, [colPath, firestoreQuery]); // Agora, firestoreQuery é uma dependência direta

    return { documents, error, isLoading };
};