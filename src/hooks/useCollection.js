import { useState, useEffect, useRef } from 'react';
import { onSnapshot, collection, query as firestoreQuery, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config'; // Certifique-se de que 'db' está sendo importado corretamente

export const useCollection = (collectionName, queryRef = null) => {
    const [documents, setDocuments] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Usamos useRef para armazenar a query, garantindo que ela não cause re-renderizações desnecessárias
    // e que o useEffect possa reagir a mudanças reais na query.
    // O JSON.stringify é uma forma simples de comparar objetos de query para saber se mudaram.
    const queryRefString = JSON.stringify(queryRef?.converter ? queryRef.converter : queryRef);
    const queryRefMemo = useRef(queryRefString);

    useEffect(() => {
        // Se a query mudou, atualiza a referência
        if (queryRefString !== queryRefMemo.current) {
            queryRefMemo.current = queryRefString;
        }

        let collectionRef;
        if (queryRef) {
            // Se uma query completa (como a gerada por 'query(collection(...), orderBy(...))') foi passada
            collectionRef = queryRef;
        } else if (collectionName) {
            // Se apenas o nome da coleção foi passado, cria uma referência básica
            collectionRef = collection(db, collectionName);
        } else {
            setError('Nenhuma coleção ou query fornecida para useCollection.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        setDocuments(null); // Limpa os documentos ao iniciar uma nova escuta

        // Configura a escuta em tempo real
        const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
            const results = [];
            snapshot.docs.forEach(doc => {
                results.push({ ...doc.data(), id: doc.id });
            });
            setDocuments(results);
            setIsLoading(false);
            setError(null);
        }, (err) => {
            console.error("Erro ao buscar coleção:", err);
            setError(err.message);
            setIsLoading(false);
            setDocuments([]); // Garante que a lista esteja vazia em caso de erro
        });

        // Retorna a função de limpeza (unsubscribe)
        // Esta função é executada quando o componente é desmontado ou quando as dependências do useEffect mudam
        return () => unsubscribe();

    }, [queryRefMemo]); // Dependência: a referência memoizada da query

    return { documents, error, isLoading };
};