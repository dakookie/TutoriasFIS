// Helper functions for Tailwind modals
function mostrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function cerrarModalConfiguracion() {
    cerrarModal('modalConfiguracionAula');
}

function cerrarModalEditarPublicacion() {
    cerrarModal('modalEditarPublicacion');
}

function cerrarModalEditarBibliografia() {
    cerrarModal('modalEditarBibliografia');
}
