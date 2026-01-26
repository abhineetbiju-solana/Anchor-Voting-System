import { showToast } from './utils/toast.js';
import { fetchActivePolls, isWalletConnected, vote, getWalletPubKey, endPoll } from './utils/anchorClient.js';


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

// Click handler for vote buttons
document.getElementById('polls-list')
    .addEventListener('click', async (event) => {
        // Handle vote button clicks
        const voteBtn = event.target.closest('.vote-btn');
        if (voteBtn) {
            const pollPubKeyStr = voteBtn.dataset.poll;
            const optionIndex = parseInt(voteBtn.dataset.index, 10);
            const success = await vote(pollPubKeyStr, optionIndex);
            if (success) await displayPolls();
            return;
        }

        // Handle delete button clicks
        const deleteBtn = event.target.closest('.delete-btn');
        if (deleteBtn) {
            const pollPubKeyStr = deleteBtn.dataset.poll;
            const pollId = deleteBtn.dataset.pollid;
            const success = await endPoll(pollPubKeyStr, pollId);
            if (success) await displayPolls();
        }
    })



// Display all active polls
async function displayPolls() {
    const pollsList = document.getElementById('polls-list');

    if (!isWalletConnected()) {
        pollsList.innerHTML = '<p class="empty-state">Connect your wallet to view polls</p>';
        return;
    }

    const walletPublicKey = getWalletPubKey();
    const polls = await fetchActivePolls();

    if (polls.length === 0) {
        pollsList.innerHTML = '<p class="empty-state">No active polls. Create one above!</p>';
        return;
    }

    pollsList.innerHTML = polls.map(({ publicKey, account }) => {
        const isOwner = account.authority.equals(walletPublicKey);

        return `
            <div class="poll-card" data-pubkey="${publicKey.toString()}">
                <div class="poll-header">
                    <h3>${account.description}</h3>
                    ${isOwner ? `<button class="delete-btn" data-poll="${publicKey.toString()}" data-pollid="${account.pollId.toString()}" title="Close Poll">🗑️</button>` : ''}
                </div>
                <div class="poll-options">
                    ${account.options.map((opt, idx) => `
                        <button class="vote-btn" data-poll="${publicKey.toString()}" data-index="${idx}">
                            ${opt.description} <span class="vote-count">(${opt.votes.toNumber()} votes)</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Refresh polls when wallet connects
document.getElementById('connect-wallet').addEventListener('click', () => {
    // Small delay to allow wallet connection to complete
    setTimeout(displayPolls, 1000);
});

// Refresh polls when a new poll is created
window.addEventListener('pollCreated', displayPolls);

