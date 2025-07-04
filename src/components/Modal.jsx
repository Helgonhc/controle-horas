// Local do arquivo: src/components/Modal.jsx
import React from 'react';
import { X } from 'lucide-react'; // Importe o ícone 'X' do lucide-react

export const Modal = ({ isOpen, onClose, title, children }) => {
    // Se o modal não estiver aberto, não renderiza nada
    if (!isOpen) return null;

    return (
        // Contêiner principal do modal (overlay escuro que ocupa a tela toda)
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
            {/* Conteúdo do modal (o "card" branco/escuro flutuante) */}
            <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full 
                        max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-6xl  /* Largura máxima expandida */
                        max-h-[95vh] overflow-y-auto /* Altura máxima e rolagem vertical */
                        transform transition-all duration-300 scale-100 opacity-100">
                
                {/* Cabeçalho do modal com título e botão de fechar */}
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700"> {/* Adicionado border-b para separação visual */}
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                        <X size={24} /> {/* Ícone 'X' para fechar do lucide-react */}
                    </button>
                </div>
                {/* Corpo do modal, onde o conteúdo (children) será renderizado */}
                <div className="p-4"> {/* Adicionado um padding para o conteúdo interno */}
                    {children}
                </div>
            </div>
        </div>
    );
};