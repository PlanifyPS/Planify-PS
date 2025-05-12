export function initShareModal() {
    const dialog   = document.getElementById('share-dialog');
    const shareBtn = document.getElementById('share-btn');
    const imgEl    = document.getElementById('share-image');

    shareBtn.addEventListener('click', () => {
        alert();
        const medalImg = document.querySelector('#challenge-detail .medal-img')?.src
            || '/assets/medal.png';
        imgEl.src = medalImg;
        dialog.showModal();
        dialog.style.display = 'block';
    });

    dialog.addEventListener('click', e => {
        const btn = e.target.closest('[data-platform]');
        if (!btn) return;
        const platform = btn.dataset.platform;
        const text      = encodeURIComponent("I just earned this medal! 🎖️");
        const imageUrl  = encodeURIComponent(imgEl.src);
        let shareUrl;

        switch(platform) {
            case 'whatsapp':
                shareUrl = `https://api.whatsapp.com/send?text=${text}%20${imageUrl}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${imageUrl}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${imageUrl}`;
                break;
            case 'copy':
                navigator.clipboard.writeText(imgEl.src);
                alert('Link copied to clipboard');
                return;
        }
        window.open(shareUrl, '_blank');
    });

    dialog.addEventListener('close', () => {
        dialog.close();
        dialog.style.display = 'none';
    });
}
