// Local do arquivo: src/hooks/useFirestore.js
import { useState, useEffect, useReducer } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';

const firestoreReducer = (state, action) => {
    switch (action.type) {
        case 'IS_PENDING':
            return { isPending: true, document: null, success: false, error: null };
        case 'ADDED_DOCUMENT':
            return { isPending: false, document: action.payload, success: true, error: null };
        case 'DELETED_DOCUMENT':
            return { isPending: false, document: null, success: true, error: null };
        case 'ERROR':
            return { isPending: false, document: null, success: false, error: action.payload };
        default:
            return state;
    }
};

export const useFirestore = (col) => {
    const [response, dispatch] = useReducer(firestoreReducer, {
        document: null,
        isPending: false,
        error: null,
        success: false,
    });
    const [isCancelled, setIsCancelled] = useState(false);

    // collection ref
    const ref = collection(db, col);

    // only dispatch if not cancelled
    const dispatchIfNotCancelled = (action) => {
        if (!isCancelled) {
            dispatch(action);
        }
    };

    // add a document
    const addDocument = async (doc) => {
        dispatch({ type: 'IS_PENDING' });

        try {
            const createdAt = Timestamp.fromDate(new Date()); // Usar Timestamp do Firebase
            const addedDocument = await addDoc(ref, { ...doc, createdAt });
            dispatchIfNotCancelled({ type: 'ADDED_DOCUMENT', payload: addedDocument });
        } catch (err) {
            dispatchIfNotCancelled({ type: 'ERROR', payload: err.message });
        }
    };

    // delete a document
    const deleteDocument = async (id) => {
        dispatch({ type: 'IS_PENDING' });

        try {
            await deleteDoc(doc(db, col, id));
            dispatchIfNotCancelled({ type: 'DELETED_DOCUMENT' });
        } catch (err) {
            dispatchIfNotCancelled({ type: 'ERROR', payload: 'Não foi possível deletar' });
        }
    };

    useEffect(() => {
        return () => setIsCancelled(true);
    }, []);

    return { addDocument, deleteDocument, response };
};