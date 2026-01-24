// Toast utility for showing status notifications
export function showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // Set message
    toastMessage.textContent = message;

    // Reset classes and add specific type
    toast.className = 'toast'; // Base class
    toast.classList.add(type);

    // Show
    toast.classList.remove('hidden');

    // Hide after duration
    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}
