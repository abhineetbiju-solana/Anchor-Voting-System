import { showToast } from './utils/toast.js';
import './utils/anchorClient.js';


// Handle Add Option button click
document.getElementById('add-option').addEventListener('click', () => {
    const optionsContainer = document.getElementById('options-container');
    const optionCount = optionsContainer.querySelectorAll('.option-input').length + 1;

    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.className = 'option-input';
    newInput.placeholder = `Option ${optionCount}`;
    newInput.required = true;

    optionsContainer.appendChild(newInput);
});

