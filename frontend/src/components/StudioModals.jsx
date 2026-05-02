import React from 'react';
import { Modal } from '../components/Shared';

export function FieldModal({ initial, tabs, stages, stageRules, onSave, onClose }) {
    return (
        <Modal title="Field Management" onClose={onClose}>
            <div className="p-8 text-center text-muted italic">
                Field Editor implementation pending... 
                (Please paste StudioModals.jsx code)
            </div>
        </Modal>
    );
}

export function TabModal({ initial, stages, onSave, onClose }) {
    return (
        <Modal title="Tab Management" onClose={onClose}>
            <div className="p-8 text-center text-muted italic">
                Tab Editor implementation pending...
                (Please paste StudioModals.jsx code)
            </div>
        </Modal>
    );
}
