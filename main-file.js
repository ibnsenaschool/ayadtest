document.addEventListener('DOMContentLoaded', async () => {
    try {
        await gamesDB.init();
        loadGames();
    } catch (error) {
        console.error('Error initializing database:', error);
    }
});

async function loadGames() {
    try {
        const customGames = await gamesDB.getAllGames();
        const defaultGames = [
            {
                title: 'لعبة المتاهة',
                description: 'اختبر ذكائك في متاهة مليئة بالتحديات والألغاز',
                image: '/api/placeholder/400/200'
            },
            {
                title: 'تحدي الذاكرة',
                description: 'طور قدراتك على التذكر مع ألعاب الذاكرة المتنوعة',
                image: '/api/placeholder/400/200'
            },
            {
                title: 'لعبة الكلمات',
                description: 'اختبر مهاراتك اللغوية وأثري مفرداتك',
                image: '/api/placeholder/400/200'
            }
        ];

        const allGames = [...defaultGames, ...customGames];
        const gamesGrid = document.getElementById('gamesGrid');
        
        gamesGrid.innerHTML = allGames.map(game => `
            <div class="game-card">
                <img src="${game.image}" alt="${game.title}" class="game-image">
                <div class="game-content">
                    <h3 class="game-title">${game.title}</h3>
                    <p class="game-description">${game.description}</p>
                    <button class="play-button" onclick="playGame('${game.title}')">العب الآن</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading games:', error);
    }
}

function playGame(title) {
    alert(`سيتم تشغيل: ${title} قريباً`);
}
