// outliner.js - מסדר העלילה וציר הזמן של הסיפור

class OutlinerManager {
    constructor() {
        this.containerEl = null;
        this.sortable = null;
    }

    render() {
        if (!window.App) return;
        const state = window.App.state;
        this.containerEl = document.getElementById('timelineContainer');
        if (!this.containerEl) return;

        this.containerEl.innerHTML = state.chapters.map((chap, index) => {
            // רעיונות שמשויכים לפרק הזה
            const linkedIdeas = state.ideas.filter(i => i.chapterId === chap.id);
            const wordCount = chap.content ? chap.content.trim().split(/\s+/).filter(w => w.length > 0).length : 0;

            const ideasHtml = linkedIdeas.length > 0 ? 
                linkedIdeas.map(i => `
                    <div class="mini-idea-pill" onclick="window.Outliner.showIdeaDetails('${i.id}')" title="לחץ לפרטים">
                        <span>💡 ${i.title}</span>
                        <span style="font-size: 0.7rem; opacity: 0.7;">(${i.tagLabel || 'רעיון'})</span>
                    </div>
                `).join('') : 
                `<span style="color: var(--text-muted); font-size: 0.85rem; font-style: italic;">אין רעיונות משויכים לפרק זה. לחץ על "שייך לפרק" בלוח הרעיונות כדי להוסיף לכאן!</span>`;

            return `
                <div class="chapter-node" data-id="${chap.id}">
                    <div class="chapter-header">
                        <div class="chapter-title-area" style="display:flex; align-items:center; gap:0.5rem;">
                            <span class="drag-handle-outliner" title="גרור לשינוי סדר הפרק" style="cursor:grab; font-size:1.1rem; opacity:0.7;">⋮⋮</span>
                            <span class="chapter-num" style="cursor:grab;">פרק ${chap.number}</span>
                            <h3 class="chapter-title">${chap.title}</h3>
                        </div>
                        <div style="display: flex; gap: 0.5rem; align-items:center;">
                            <button class="icon-btn" onclick="window.App.moveChapter(${index}, -1, event)" title="הזז פרק למעלה" style="font-size:0.9rem; padding:0.25rem 0.4rem;">⬆️</button>
                            <button class="icon-btn" onclick="window.App.moveChapter(${index}, 1, event)" title="הזז פרק למטה" style="font-size:0.9rem; padding:0.25rem 0.4rem;">⬇️</button>
                            <button class="btn btn-primary" onclick="window.Outliner.editChapter('${chap.id}')" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">
                                ✍️ כתוב/ערוך פרק
                            </button>
                            ${index > 0 ? `<button class="icon-btn" onclick="window.Outliner.deleteChapter('${chap.id}')" title="מחק פרק" style="color: #f43f5e;">🗑️</button>` : ''}
                        </div>
                    </div>
                    
                    <div class="chapter-meta">
                        <div class="chapter-meta-item">📝 <span>${wordCount} מילים</span></div>
                        <div class="chapter-meta-item">💡 <span>${linkedIdeas.length} רעיונות משויכים</span></div>
                    </div>

                    <div class="chapter-summary">
                        <strong>תקציר העלילה:</strong> ${chap.summary || 'אין תקציר עדיין.'}
                    </div>

                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.4rem; font-weight: 600;">
                        🔗 רעיונות ונקודות עלילה בפרק זה:
                    </div>
                    <div class="chapter-ideas-dropzone">
                        ${ideasHtml}
                    </div>
                </div>
            `;
        }).join('');

        this.initSortable();
    }

    initSortable() {
        if (!this.containerEl || !window.Sortable) return;
        if (this.sortable) this.sortable.destroy();

        this.sortable = window.Sortable.create(this.containerEl, {
            animation: 150,
            handle: '.chapter-header',
            onEnd: (evt) => {
                if (evt.oldIndex === evt.newIndex) return;
                window.App.reorderChapters(evt.oldIndex, evt.newIndex);
            }
        });
    }

    editChapter(chapterId) {
        window.App.state.activeChapterId = chapterId;
        window.App.switchTab('editor');
    }

    addNewChapter() {
        const title = prompt("מה שם הפרק החדש?", "");
        if (!title || !title.trim()) return;
        
        const summary = prompt("תקציר קצר של מה שיקרה בפרק:", "") || "";
        const state = window.App.state;
        const nextNum = state.chapters.length + 1;

        const newChap = {
            id: 'chap-' + Date.now(),
            number: nextNum,
            title: title.trim(),
            summary: summary.trim(),
            content: ""
        };

        state.chapters.push(newChap);
        window.App.saveState();
        this.render();
        window.App.showToast(`פרק ${nextNum}: "${title}" נוסף לציר העלילה!`, "📖");
    }

    deleteChapter(chapterId) {
        if (!confirm("האם אתה בטוח שברצונך למחוק פרק זה? הטקסט שבתוכו יימחק.")) return;
        const state = window.App.state;
        state.chapters = state.chapters.filter(c => c.id !== chapterId);
        
        // עדכון מספרי פרקים
        state.chapters.forEach((c, idx) => {
            c.number = idx + 1;
        });

        // ניתוק רעיונות שהיו משויכים לפרק שנמחק
        state.ideas.forEach(i => {
            if (i.chapterId === chapterId) i.chapterId = null;
        });

        if (state.activeChapterId === chapterId) {
            state.activeChapterId = state.chapters[0]?.id || null;
        }

        window.App.saveState();
        this.render();
        window.App.showToast("הפרק נמחק", "🗑️");
    }

    showIdeaDetails(ideaId) {
        const idea = window.App.state.ideas.find(i => i.id === ideaId);
        if (!idea) return;
        alert(`💡 ${idea.title} (${idea.tagLabel})\n\n${idea.content}`);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.Outliner = new OutlinerManager();
});
