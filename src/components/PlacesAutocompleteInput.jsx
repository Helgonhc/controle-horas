// Local do arquivo: src/components/PlacesAutocompleteInput.jsx

import React from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

export const PlacesAutocompleteInput = ({ onSelect, initialValue = "" }) => {
    const { ready, value, suggestions: { status, data }, setValue, clearSuggestions } = usePlacesAutocomplete({
        requestOptions: { componentRestrictions: { country: 'br' } },
        debounce: 300,
        defaultValue: initialValue,
    });

    const handleSelect = async (address) => {
        setValue(address, false);
        clearSuggestions();
        try {
            const results = await getGeocode({ address });
            const { lat, lng } = await getLatLng(results[0]);
            onSelect({ latLng: { lat, lng }, address });
        } catch (error) {
            console.error("Erro ao buscar coordenadas: ", error);
        }
    };

    const handleInputChange = (e) => {
        setValue(e.target.value);
        // Se o onSelect for usado para um formulário simples,
        // podemos chamar ele aqui também para atualizar o estado pai com o texto digitado.
        if (typeof onSelect === 'function' && !data.length) {
            onSelect(e.target.value);
        }
    };

    return (
        <div className="relative">
            <input
                value={value}
                onChange={handleInputChange}
                disabled={!ready}
                placeholder="Digite um endereço..."
                className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
            {status === 'OK' && (
                <ul className="absolute z-10 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-b-lg shadow-lg max-h-60 overflow-y-auto">
                    {data.map(({ place_id, description }) => (
                        <li key={place_id} onClick={() => handleSelect(description)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">
                            {description}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};