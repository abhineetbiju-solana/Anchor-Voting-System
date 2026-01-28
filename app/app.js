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
        pollsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔒</div>
                <p>Wallet Not Connected</p>
                <p class="empty-sub">Please connect your wallet to view and vote on polls.</p>
            </div>
        `;
        return;
    }

    const walletPublicKey = getWalletPubKey();
    const polls = await fetchActivePolls();

    if (polls.length === 0) {
        pollsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🗳️</div>
                <p>No Active Polls</p>
                <p class="empty-sub">Be the first to create a poll!</p>
            </div>
        `;
        return;
    }

    pollsList.innerHTML = polls.map(({ publicKey, account }) => {
        const isOwner = account.authority.equals(walletPublicKey);

        return `
            <div class="poll-card" data-pubkey="${publicKey.toString()}">
                <div class="poll-header">
                    <h3>${account.description}</h3>
                    ${isOwner ? `
                        <button class="delete-btn" data-poll="${publicKey.toString()}" data-pollid="${account.pollId.toString()}" title="Close Poll">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    ` : ''}
                </div>
                <div class="poll-options">
                    ${account.options.map((opt, idx) => `
                        <button class="vote-btn" data-poll="${publicKey.toString()}" data-index="${idx}">
                            <span class="option-text">${opt.description}</span>
                            <span class="vote-count">${opt.votes.toNumber()} votes</span>
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

