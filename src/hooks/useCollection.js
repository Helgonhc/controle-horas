import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useCollection = (collectionName, userId) => {
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setDocuments([]);
            setIsLoading(false);
            return;
        };

        setIsLoading(true);
        const collRef = collection(db, "users", userId, collectionName);
        const q = query(collRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const dataList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDocuments(dataList);
            setIsLoading(false);
        }, (error) => {
            console.error("Erro ao buscar coleção:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();

    }, [collectionName, userId]);

    return { documents, isLoading };
};