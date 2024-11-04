import { createPortal } from 'react-dom';

function DeleteConfirmModal({ isOpen, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 text-center">
                <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
                <p className="mb-6">Are you sure you want to delete this photo?</p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onConfirm}
                        className="bg-red-500 text-white px-4 py-2 rounded"
                    >
                        Delete
                    </button>
                    <button
                        onClick={onCancel}
                        className="bg-gray-300 text-black px-4 py-2 rounded"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>,
        document.getElementById('modal-root')
    );
}

export default DeleteConfirmModal;