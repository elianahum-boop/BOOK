// wiki.js - מילון עולם ואנציקלופדיה מהירה

class WorldWiki {
    constructor() {
        this.gridEl = document.getElementById('wikiGrid');
        this.currentFilter = 'all';
    }

    render() {
        if (!this.gridEl || !window.App) return;
        const state = window.App.state;
        const searchTerm = (state.searchTerm || '').toLowerCase();

        let filtered = state.wiki || [];

        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(item => item.category === this.currentFilter);
        }

        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.title.toLowerCase().includes(searchTerm) || 
                item.description.toLowerCase().includes(searchTerm)
            );
        }

        if (filtered.length === 0) {
            this.gridEl.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-muted);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🌍</div>
                    <p>לא נמצאו מושגים במילון המתאימים לחיפוש/סינון.</p>
                </div>
            `;
            return;
        }

        this.gridEl.innerHTML = filtered.map(item => `
            <div class="idea-card" data-id="${item.id}" style="border-right: 4px solid var(--accent-fairy);">
                <div>
                    <div class="idea-header">
                        <div class="idea-title" style="color: #fff; font-weight:700;">${item.title}</div>
                        <span class="idea-tag" style="background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4);">${item.categoryLabel || 'כללי'}</span>
                    </div>
                    <div class="idea-body" style="margin-top: 0.8rem; line-height: 1.6; color: #cbd5e1;">${item.description}</div>
                </div>
                <div class="idea-footer" style="margin-top: 1.2rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.8rem;">
                    <button class="btn" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; background: rgba(56,189,248,0.1); color: var(--accent-ice);" onclick="window.WorldWiki.insertToEditor('${item.title}')" title="שתל שם בעורך">
                        ➕ שתל בסיפור
                    </button>
                    <div class="idea-actions">
                        <button class="icon-btn" onclick="window.App.openEditWikiModal('${item.id}')" title="ערוך מושג" style="color: #38bdf8;">✏️</button>
                        <button class="icon-btn" onclick="window.WorldWiki.deleteWikiItem('${item.id}')" title="מחק מושג" style="color: #f43f5e;">🗑️</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    setFilter(cat) {
        this.currentFilter = cat;
        document.querySelectorAll('.wiki-tag-filter').forEach(b => b.classList.remove('active'));
        document.querySelector(`.wiki-tag-filter[data-tag="${cat}"]`)?.classList.add('active');
        this.render();
    }

    deleteWikiItem(id) {
        if (!confirm('האם אתה בטוח שברצונך למחוק מושג זה מהמילון?')) return;
        window.App.state.wiki = (window.App.state.wiki || []).filter(item => item.id !== id);
        window.App.saveState();
        window.App.showToast('המושג נמחק מהמילון', '🗑️');
        this.render();
        if (window.ChapterEditor) window.ChapterEditor.renderSidebarContent();
    }

    insertToEditor(title) {
        if (window.ChapterEditor) {
            window.ChapterEditor.insertText(title);
            window.App.showToast(`המושג "${title}" הושתל בעורך!`, '✨');
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.WorldWiki = new WorldWiki();
});
