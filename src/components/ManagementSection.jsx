// src/components/ManagementSection.jsx
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

// Colocamos a função de formatação aqui para que o componente seja autossuficiente
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export const ManagementSection = ({ title, icon, items, onAddItem, onDeleteItem, isLoading, hasCost = false }) => {
    const [newItemName, setNewItemName] = useState('');
    const [newItemCost, setNewItemCost] = useState('');
    const IconComponent = icon;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newItemName.trim()) {
            onAddItem(newItemName.trim(), newItemCost);
            setNewItemName('');
            setNewItemCost('');
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg">
            <h3 className="font-bold mb-2 flex items-center text-slate-800 dark:text-slate-200">
                <IconComponent className="mr-2" size={20} />
                {title}
            </h3>
            <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-2">
                <input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Nome..." className="flex-grow p-2 border rounded-lg h-10 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                {hasCost && <input type="number" value={newItemCost} onChange={e => setNewItemCost(e.target.value)} placeholder="Custo/h" className="w-24 p-2 border rounded-lg h-10 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white" />}
                <button type="submit" className="bg-green-500 text-white rounded-lg hover:bg-green-600 h-10 w-10 flex-shrink-0 flex items-center justify-center text-xl font-bold">+</button>
            </form>
            <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                {isLoading ? <p className="text-sm text-slate-500">A carregar...</p> :
                    items.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700 p-1.5 rounded">
                            <span className="text-sm truncate pr-2 text-slate-700 dark:text-slate-300">{item.name}{hasCost && item.costPerHour ? ` (${formatCurrency(item.costPerHour)})` : ''}</span>
                            <button onClick={() => onDeleteItem(item.id)} className="text-red-500 hover:text-red-700 flex-shrink-0"><Trash2 size={16} /></button>
                        </div>
                    ))
                }
            </div>
        </div>
    );
};