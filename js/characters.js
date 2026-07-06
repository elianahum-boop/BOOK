// characters.js - תנ"ך הדמויות של הסיפור

class CharacterBibleManager {
    constructor() {
        this.gridEl = null;
    }

    render() {
        if (!window.App) return;
        const state = window.App.state;
        this.gridEl = document.getElementById('charactersGrid');
        if (!this.gridEl) return;

        this.gridEl.innerHTML = state.characters.map(char => {
            return `
                <div class="char-card" data-id="${char.id}">
                    <div class="char-banner ${char.bannerClass || 'banner-default'}">
                        <div class="char-avatar">${char.avatar || '👤'}</div>
                    </div>
                    <div class="char-info">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div>
                                <h3 class="char-name">${char.name}</h3>
                                <span class="char-race">${char.race || 'לא ידוע'}</span>
                            </div>
                            <div style="display:flex; gap:0.3rem;">
                                <button class="icon-btn" onclick="window.App.openEditCharacterModal('${char.id}')" title="ערוך דמות" style="color: #38bdf8; font-size:0.8rem;">✏️</button>
                                <button class="icon-btn" onclick="window.CharacterBible.deleteCharacter('${char.id}')" title="מחק דמות" style="color: #f43f5e; font-size:0.8rem;">🗑️</button>
                            </div>
                        </div>

                        ${char.appearance ? `
                            <div class="char-section">
                                <div class="char-section-title">👁️ מראה כללי</div>
                                <div class="char-section-content">${char.appearance}</div>
                            </div>
                        ` : ''}

                        ${char.loved || char.hated ? `
                            <div class="char-section" style="background: rgba(0,0,0,0.2); padding: 0.6rem; border-radius: 8px;">
                                ${char.loved ? `<div style="margin-bottom:0.3rem;"><strong>❤️ אהוב:</strong> ${char.loved}</div>` : ''}
                                ${char.hated ? `<div><strong>💔 שנוא:</strong> ${char.hated}</div>` : ''}
                            </div>
                        ` : ''}

                        ${char.goal ? `
                            <div class="char-section">
                                <div class="char-section-title">🎯 מטרה מרכזית</div>
                                <div class="char-section-content" style="color: var(--accent-fire); font-weight:500;">${char.goal}</div>
                            </div>
                        ` : ''}

                        ${char.process ? `
                            <div class="char-section">
                                <div class="char-section-title">📈 תהליך והתפתחות הדמות</div>
                                <div class="char-section-content" style="white-space: pre-line; font-size:0.85rem; background:rgba(255,255,255,0.03); padding:0.6rem; border-radius:8px;">${char.process}</div>
                            </div>
                        ` : ''}

                        ${char.backstory ? `
                            <div class="char-section">
                                <div class="char-section-title">📜 סיפור רקע ועבר</div>
                                <div class="char-section-content" style="font-size:0.88rem;">${char.backstory}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    deleteCharacter(charId) {
        if (!confirm("האם למחוק דמות זו מתנ\"ך הדמויות?")) return;
        const state = window.App.state;
        state.characters = state.characters.filter(c => c.id !== charId);
        window.App.saveState();
        this.render();
        window.App.showToast("הדמות נמחקה", "🗑️");
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.CharacterBible = new CharacterBibleManager();
});
