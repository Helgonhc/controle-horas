import React, { useState, useEffect } from 'react';
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-places-autocomplete';
import { toast } from 'react-toastify';
import { LoaderCircle, MapPin, PlusCircle, Route } from 'lucide-react';

// Certifique-se de que sua chave da API do Google Maps está sendo carregada aqui
// Isso geralmente é feito em um arquivo de configuração ou diretamente no index.js/App.js
// como parte da inicialização do Google Maps Loader.
// Se você está usando useJsApiLoader, a chave já deve estar sendo passada para ele.

export const TripForm = ({ employees, onAddTrip, onUpdateTrip, isSubmitting, initialData = null }) => {
    const [tripForm, setTripForm] = useState({
        driver: '',
        date: new Date().toISOString().split('T')[0],
        startLocation: '',
        endLocation: '',
        startKm: '',
        endKm: '',
        distance: 0,
        expenseDescription: '',
        expenseAmount: '',
        expenseReceipt: null, // Para o arquivo de recibo
        expenses: [] // Para armazenar múltiplas despesas
    });
    const [addressStart, setAddressStart] = useState('');
    const [addressEnd, setAddressEnd] = useState('');

    // Efeito para preencher o formulário quando initialData é fornecido (modo de edição)
    useEffect(() => {
        if (initialData) {
            setTripForm({
                driver: initialData.driver || '',
                date: initialData.date || new Date().toISOString().split('T')[0],
                startLocation: initialData.startLocation || '',
                endLocation: initialData.endLocation || '',
                startKm: initialData.startKm || '',
                endKm: initialData.endKm || '',
                distance: initialData.distance || 0,
                expenses: initialData.expenses || [], // Carrega despesas existentes
                // Não preenche expenseDescription, expenseAmount, expenseReceipt
                // pois são para adicionar novas despesas, não para editar as existentes diretamente aqui.
            });
            setAddressStart(initialData.startLocation || '');
            setAddressEnd(initialData.endLocation || '');
        } else {
            // Reseta o formulário se não houver initialData (modo de adição)
            setTripForm({
                driver: '',
                date: new Date().toISOString().split('T')[0],
                startLocation: '',
                endLocation: '',
                startKm: '',
                endKm: '',
                distance: 0,
                expenseDescription: '',
                expenseAmount: '',
                expenseReceipt: null,
                expenses: []
            });
            setAddressStart('');
            setAddressEnd('');
        }
    }, [initialData]);

    // Calcula a distância automaticamente
    useEffect(() => {
        const skm = parseFloat(tripForm.startKm);
        const ekm = parseFloat(tripForm.endKm);
        if (!isNaN(skm) && !isNaN(ekm) && ekm >= skm) {
            setTripForm(prev => ({ ...prev, distance: ekm - skm }));
        } else if (isNaN(skm) || isNaN(ekm)) {
            setTripForm(prev => ({ ...prev, distance: 0 }));
        }
    }, [tripForm.startKm, tripForm.endKm]);

    const handleSelectStart = async (address) => {
        setAddressStart(address);
        try {
            const results = await geocodeByAddress(address);
            const latLng = await getLatLng(results[0]);
            setTripForm(prev => ({ ...prev, startLocation: address, startLatLng: latLng }));
        } catch (error) {
            console.error('Erro ao obter lat/lng para o local de início:', error);
            toast.error('Erro ao validar local de início.');
        }
    };

    const handleSelectEnd = async (address) => {
        setAddressEnd(address);
        try {
            const results = await geocodeByAddress(address);
            const latLng = await getLatLng(results[0]);
            setTripForm(prev => ({ ...prev, endLocation: address, endLatLng: latLng }));
        } catch (error) {
            console.error('Erro ao obter lat/lng para o local de fim:', error);
            toast.error('Erro ao validar local de fim.');
        }
    };

    const handleAddExpense = () => {
        const { expenseDescription, expenseAmount, expenseReceipt } = tripForm;
        if (expenseDescription && expenseAmount && parseFloat(expenseAmount) > 0) {
            const newExpense = {
                id: Date.now(), // ID único para a despesa (para remoção)
                description: expenseDescription,
                amount: parseFloat(expenseAmount),
                receipt: expenseReceipt // O arquivo em si, será tratado no submit
            };
            setTripForm(prev => ({
                ...prev,
                expenses: [...prev.expenses, newExpense],
                expenseDescription: '',
                expenseAmount: '',
                expenseReceipt: null // Limpa o campo de arquivo após adicionar
            }));
            toast.success('Despesa adicionada à lista!');
        } else {
            toast.warn('Por favor, preencha a descrição e o valor da despesa.');
        }
    };

    const handleRemoveExpense = (id) => {
        setTripForm(prev => ({
            ...prev,
            expenses: prev.expenses.filter(exp => exp.id !== id)
        }));
        toast.info('Despesa removida.');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validações básicas
        if (!tripForm.driver || !tripForm.date || !tripForm.startLocation || !tripForm.endLocation ||
            isNaN(parseFloat(tripForm.startKm)) || isNaN(parseFloat(tripForm.endKm)) || tripForm.distance <= 0) {
            toast.warn("Por favor, preencha todos os campos obrigatórios e garanta que a distância seja maior que zero.");
            return;
        }

        // Se estamos em modo de edição, chame onUpdateTrip
        if (initialData) {
            // No modo de edição, as despesas são tratadas separadamente se houver upload de arquivo.
            // Para simplificar, vamos passar as despesas existentes e permitir adicionar novas.
            // O upload de arquivos para despesas adicionadas no modo de edição será tratado no AppContent.
            onUpdateTrip({ ...tripForm, id: initialData.id });
        } else {
            // Se estamos no modo de adição, chame onAddTrip
            onAddTrip(tripForm);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center">
                {initialData ? <Route className="mr-2 text-green-500" /> : <PlusCircle className="mr-2 text-green-500" />}
                {initialData ? 'Editar Registro de Viagem' : 'Adicionar Registro de Viagem'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Motorista</label>
                    <select
                        value={tripForm.driver}
                        onChange={e => setTripForm({ ...tripForm, driver: e.target.value })}
                        required
                        className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    >
                        <option value="" disabled>Selecione o motorista</option>
                        {(employees || []).map(e => (
                            <option key={e.id} value={e.name}>{e.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Data</label>
                    <input
                        type="date"
                        value={tripForm.date}
                        onChange={e => setTripForm({ ...tripForm, date: e.target.value })}
                        required
                        className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    />
                </div>

                {/* Autocomplete para Local de Início */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Local de Início</label>
                    <PlacesAutocomplete
                        value={addressStart}
                        onChange={setAddressStart}
                        onSelect={handleSelectStart}
                    >
                        {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                            <div className="relative">
                                <input
                                    {...getInputProps({
                                        placeholder: 'Digite o local de início...',
                                        className: 'w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700',
                                        required: true
                                    })}
                                />
                                {suggestions.length > 0 && (
                                    <div className="absolute z-10 w-full bg-white dark:bg-slate-700 shadow-lg rounded-lg mt-1 border border-slate-200 dark:border-slate-600">
                                        {loading && <div className="p-2">Carregando...</div>}
                                        {suggestions.map(suggestion => {
                                            const className = suggestion.active
                                                ? 'bg-blue-100 dark:bg-blue-800 p-2 cursor-pointer'
                                                : 'bg-white dark:bg-slate-700 p-2 cursor-pointer';
                                            return (
                                                <div
                                                    {...getSuggestionItemProps(suggestion, { className })}
                                                    key={suggestion.placeId}
                                                >
                                                    {suggestion.description}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </PlacesAutocomplete>
                </div>

                {/* Autocomplete para Local de Fim */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Local de Fim</label>
                    <PlacesAutocomplete
                        value={addressEnd}
                        onChange={setAddressEnd}
                        onSelect={handleSelectEnd}
                    >
                        {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                            <div className="relative">
                                <input
                                    {...getInputProps({
                                        placeholder: 'Digite o local de fim...',
                                        className: 'w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700',
                                        required: true
                                    })}
                                />
                                {suggestions.length > 0 && (
                                    <div className="absolute z-10 w-full bg-white dark:bg-slate-700 shadow-lg rounded-lg mt-1 border border-slate-200 dark:border-slate-600">
                                        {loading && <div className="p-2">Carregando...</div>}
                                        {suggestions.map(suggestion => {
                                            const className = suggestion.active
                                                ? 'bg-blue-100 dark:bg-blue-800 p-2 cursor-pointer'
                                                : 'bg-white dark:bg-slate-700 p-2 cursor-pointer';
                                            return (
                                                <div
                                                    {...getSuggestionItemProps(suggestion, { className })}
                                                    key={suggestion.placeId}
                                                >
                                                    {suggestion.description}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </PlacesAutocomplete>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">KM Inicial</label>
                        <input
                            type="number"
                            value={tripForm.startKm}
                            onChange={e => setTripForm({ ...tripForm, startKm: e.target.value })}
                            required
                            className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">KM Final</label>
                        <input
                            type="number"
                            value={tripForm.endKm}
                            onChange={e => setTripForm({ ...tripForm, endKm: e.target.value })}
                            required
                            className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Distância (KM)</label>
                    <input
                        type="text"
                        value={tripForm.distance.toFixed(2)}
                        readOnly
                        className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
                    />
                </div>

                {/* Seção de Despesas (Adicionar Nova Despesa) */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                    <h3 className="text-lg font-semibold mb-3">Adicionar Despesa</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Descrição</label>
                            <input
                                type="text"
                                value={tripForm.expenseDescription}
                                onChange={e => setTripForm({ ...tripForm, expenseDescription: e.target.value })}
                                className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                                placeholder="Ex: Gasolina, Pedágio"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Valor (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={tripForm.expenseAmount}
                                onChange={e => setTripForm({ ...tripForm, expenseAmount: e.target.value })}
                                className="w-full mt-1 p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Recibo</label>
                            <input
                                type="file"
                                onChange={e => setTripForm({ ...tripForm, expenseReceipt: e.target.files[0] })}
                                className="w-full mt-1 text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleAddExpense}
                            className="w-full col-span-full sm:col-span-1 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center justify-center disabled:bg-blue-400"
                        >
                            <PlusCircle className="mr-2" /> Adicionar Despesa
                        </button>
                    </div>

                    {/* Lista de Despesas Adicionadas */}
                    {tripForm.expenses.length > 0 && (
                        <div className="mt-4 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                            <h4 className="text-md font-semibold mb-2">Despesas desta Viagem:</h4>
                            <ul className="space-y-2">
                                {tripForm.expenses.map((exp, index) => (
                                    <li key={exp.id || index} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700 p-2 rounded-md">
                                        <span>{exp.description} - R$ {exp.amount.toFixed(2)}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveExpense(exp.id)}
                                            className="text-red-500 hover:text-red-700 text-sm"
                                        >
                                            Remover
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-green-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center disabled:bg-green-400"
                >
                    {isSubmitting ? <><LoaderCircle className="animate-spin mr-2" /> {initialData ? 'Atualizando...' : 'Guardando...'}</> : (initialData ? 'Atualizar Viagem' : 'Guardar Viagem')}
                </button>
            </form>
        </div>
    );
};