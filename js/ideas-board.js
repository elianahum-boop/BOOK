// ideas-board.js - לוגיקת לוח הרעיונות וסיעור המוחות

class IdeasBoardManager {
    constructor() {
        this.gridEl = null;
        this.sortable = null;
    }

    render() {
        if (!window.App) return;
        const state = window.App.state;
        this.gridEl = document.getElementById('ideasGrid');
        if (!this.gridEl) return;

        // סינון רעיונות לפי תגית ולפי חיפוש טקסטואלי
        const filtered = state.ideas.filter(idea => {
            const matchesTag = state.filterTag === 'all' || idea.tag === state.filterTag;
            const matchesSearch = !state.searchTerm || 
                idea.title.toLowerCase().includes(state.searchTerm) || 
                idea.content.toLowerCase().includes(state.searchTerm);
            return matchesTag && matchesSearch;
        });

        if (filtered.length === 0) {
            this.gridEl.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">💡</div>
                    <h3 style="color: var(--text-secondary); margin-bottom: 0.5rem;">לא נמצאו רעיונות תואמים</h3>
                    <p>נסה לשנות את הסינון, או לחץ על "רעיון חדש" כדי להתחיל לכתוב!</p>
                </div>
            `;
            return;
        }

        this.gridEl.innerHTML = filtered.map(idea => {
            const tagClasses = {
                plot: "tag-plot",
                char: "tag-char",
                magic: "tag-magic",
                world: "tag-world",
                conflict: "tag-conflict"
            };
            const tagClass = tagClasses[idea.tag] || "tag-plot";

            // בדוק האם הרעיון משויך כבר לפרק בעלילה
            const linkedChap = idea.chapterId ? state.chapters.find(c => c.id === idea.chapterId) : null;
            const chapBadge = linkedChap ? 
                `<span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 0.15rem 0.5rem; border-radius: 6px; font-size: 0.75rem;">📖 פרק ${linkedChap.number}</span>` : 
                `<span style="color: var(--text-muted); font-size: 0.75rem;">לא משויך לפרק</span>`;

            return `
                <div class="idea-card" data-id="${idea.id}">
                    <div>
                        <div class="idea-header">
                            <div class="idea-title">${idea.title}</div>
                            <span class="idea-tag ${tagClass}">${idea.tagLabel || 'כללי'}</span>
                        </div>
                        <div class="idea-body">${idea.content}</div>
                    </div>
                    <div class="idea-footer">
                        <div>${chapBadge}</div>
                        <div class="idea-actions">
                            <button class="icon-btn" onclick="window.IdeasBoard.linkToChapter('${idea.id}')" title="שייך לפרק">🔗</button>
                            <button class="icon-btn" onclick="window.IdeasBoard.deleteIdea('${idea.id}')" title="מחק רעיון" style="color: #f43f5e;">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.initSortable();
    }

    initSortable() {
        if (!this.gridEl || !window.Sortable) return;
        if (this.sortable) this.sortable.destroy();

        this.sortable = window.Sortable.create(this.gridEl, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: (evt) => {
                const oldIndex = evt.oldIndex;
                const newIndex = evt.newIndex;
                if (oldIndex === newIndex) return;

                // עדכון הסדר במערך
                const state = window.App.state;
                const movedItem = state.ideas.splice(oldIndex, 1)[0];
                state.ideas.splice(newIndex, 0, movedItem);
                window.App.saveState();
            }
        });
    }

    deleteIdea(id) {
        if (!confirm("האם אתה בטוח שברצונך למחוק את הרעיון הזה?")) return;
        const state = window.App.state;
        state.ideas = state.ideas.filter(i => i.id !== id);
        window.App.saveState();
        this.render();
        window.App.showToast("הרעיון נמחק", "🗑️");
        if (window.Outliner) window.Outliner.render();
    }

    linkToChapter(ideaId) {
        const state = window.App.state;
        const idea = state.ideas.find(i => i.id === ideaId);
        if (!idea) return;

        const options = state.chapters.map(c => `פרק ${c.number}: ${c.title}`).join("\n");
        const input = prompt(`לאיזה פרק תרצה לשייך את "${idea.title}"?\nהקלד את מספר הפרק (למשל: 1, 2, 3...) או 0 לביטול שיוך:\n\n${options}`, "");
        
        if (input === null) return;
        const num = parseInt(input.trim(), 10);
        if (num === 0 || isNaN(num)) {
            idea.chapterId = null;
            window.App.showToast("בוטל שיוך הרעיון מהפרק", "🔓");
        } else {
            const targetChap = state.chapters.find(c => c.number === num);
            if (targetChap) {
                idea.chapterId = targetChap.id;
                window.App.showToast(`הרעיון שויך לפרק ${targetChap.number}: ${targetChap.title}!`, "🔗");
            } else {
                alert("לא נמצא פרק עם המספר הזה.");
                return;
            }
        }
        window.App.saveState();
        this.render();
        if (window.Outliner) window.Outliner.render();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.IdeasBoard = new IdeasBoardManager();
});
