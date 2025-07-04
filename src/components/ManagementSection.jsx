// Local do arquivo: src/components/ManagementSection.jsx
import React, { useState } from 'react';
import { PlusCircle, Trash2, LoaderCircle } from 'lucide-react';
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-places-autocomplete'; // Certifique-se de que PlacesAutocomplete é importado se for usado

export const ManagementSection = ({ title, icon: Icon, items, isLoading, onAddItem, onDeleteItem, usePlacesAutocomplete = false }) => {
    const [newItemName, setNewItemName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!newItemName.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAddItem(newItemName);
            setNewItemName('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelectPlace = async (address) => {
        setNewItemName(address);
        // Opcional: Você pode querer pegar lat/lng aqui se for salvar no item
        // try {
        //     const results = await geocodeByAddress(address);
        //     const latLng = await getLatLng(results[0]);
        //     // Faça algo com latLng, se necessário
        // } catch (error) {
        //     console.error("Erro ao obter coordenadas:", error);
        // }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center text-slate-800 dark:text-slate-200">
                {Icon && <Icon className="mr-2 text-blue-500" />} {title}
            </h2>

            {/* Formulário para Adicionar Item */}
            <form onSubmit={handleAddItem} className="mb-6 flex flex-col sm:flex-row gap-2">
                {usePlacesAutocomplete ? (
                    <PlacesAutocomplete
                        value={newItemName}
                        onChange={setNewItemName}
                        onSelect={handleSelectPlace}
                    >
                        {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                            <div className="relative flex-grow">
                                <input
                                    {...getInputProps({
                                        placeholder: `Adicionar ${title.slice(0, -1).toLowerCase()}...`,
                                        className: 'w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white',
                                    })}
                                />
                                <div className="absolute top-full left-0 right-0 z-20 bg-white dark:bg-slate-700 rounded-lg shadow-md mt-1 max-h-60 overflow-y-auto">
                                    {loading && <div className="p-2 text-sm text-slate-500">Carregando sugestões...</div>}
                                    {suggestions.map((suggestion) => {
                                        const className = suggestion.active
                                            ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 cursor-pointer p-2'
                                            : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer p-2';
                                        return (
                                            <div
                                                {...getSuggestionItemProps(suggestion, {
                                                    className,
                                                })}
                                                key={suggestion.placeId}
                                            >
                                                <span>{suggestion.description}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </PlacesAutocomplete>
                ) : (
                    <input
                        type="text"
                        placeholder={`Adicionar ${title.slice(0, -1).toLowerCase()}...`}
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="flex-grow p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                        required
                    />
                )}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="shrink-0 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center disabled:bg-blue-400 transition-colors"
                >
                    {isSubmitting ? <LoaderCircle className="animate-spin" size={20} /> : <PlusCircle size={20} />}
                </button>
            </form>

            {/* Lista de Itens */}
            {isLoading && <p className="text-center text-slate-500">Carregando {title.toLowerCase()}...</p>}
            
            {/* --- CORREÇÃO AQUI --- */}
            {/* Garante que items seja um array antes de tentar mapear */}
            {!isLoading && (!items || items.length === 0) ? (
                <p className="text-center text-slate-500">Nenhum {title.slice(0, -1).toLowerCase()} cadastrado.</p>
            ) : (
                <ul className="space-y-2">
                    {(items || []).map(item => ( // Usa (items || []) para garantir que é um array
                        <li key={item.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700 p-3 rounded-lg shadow-sm text-slate-800 dark:text-slate-200">
                            <span>{item.name}</span>
                            <button onClick={() => onDeleteItem(item.id)} className="text-red-500 hover:text-red-700 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {/* --- FIM DA CORREÇÃO --- */}
        </div>
    );
};