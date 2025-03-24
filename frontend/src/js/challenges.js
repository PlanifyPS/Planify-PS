const challengeMain = document.getElementById("challenges");
if(challengeMain){
    async function loadComponent(componentPath, containerId, append = false) {
        try {
            const response = await fetch(componentPath);
            const html = await response.text();
            if (append) {
                document.getElementById(containerId).insertAdjacentHTML('beforeend', html);
            } else {
                document.getElementById(containerId).innerHTML = html;
            }
        } catch (error) {
            console.error(`Error loading ${componentPath}:`, error);
        }
    }

    function setupCardEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.close-btn')) {
                e.target.closest('.card').style.opacity = '0';
                setTimeout(() => {
                    e.target.closest('.card').remove();
                }, 300);
            }

            if (e.target.closest('.pin-btn')) {
                const card = e.target.closest('.card');
                const icon = card.querySelector('.fa-thumbtack');
                card.classList.toggle('pinned');
                icon.classList.toggle('active');

                const container = document.getElementById('cards-container');
                const pinnedCards = Array.from(container.querySelectorAll('.pinned'));
                const unpinnedCards = Array.from(container.querySelectorAll('.card:not(.pinned)'));

                container.innerHTML = '';
                pinnedCards.forEach(card => container.appendChild(card));
                unpinnedCards.forEach(card => container.appendChild(card));
            }
        });
    }

    document.addEventListener('DOMContentLoaded', async () => {
        for (let i = 0; i < 6; i++) {
            await loadComponent('../src/templates/challengeItem.html', 'cards-container', true);
        }

        setupCardEvents();
    });
}
