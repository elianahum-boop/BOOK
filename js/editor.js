// editor.js - עורך הפרקים הנקי ומחשבון הסטטיסטיקות

class ChapterEditorManager {
    constructor() {
        this.sidebarEl = null;
        this.textareaEl = null;
        this.wordCountEl = null;
        this.charCountEl = null;
        this.readTimeEl = null;
        this.titleDisplayEl = null;
        this.isDistractionFree = false;
    }

    render() {
        if (!window.App) return;
        const state = window.App.state;
        
        this.sidebarEl = document.getElementById('chapterSidebarList');
        this.textareaEl = document.getElementById('chapterTextarea');
        this.wordCountEl = document.getElementById('statWordCount');
        this.charCountEl = document.getElementById('statCharCount');
        this.readTimeEl = document.getElementById('statReadTime');
        this.titleDisplayEl = document.getElementById('currentChapterTitleDisplay');

        if (!this.sidebarEl || !this.textareaEl) return;

        // רשימת הפרקים בצד
        this.sidebarEl.innerHTML = state.chapters.map(chap => {
            const isActive = chap.id === state.activeChapterId;
            const words = chap.content ? chap.content.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
            return `
                <div class="chapter-list-item ${isActive ? 'active' : ''}" onclick="window.ChapterEditor.selectChapter('${chap.id}')">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong>פרק ${chap.number}</strong>
                        <span style="font-size:0.75rem; opacity:0.8;">${words} מיל'</span>
                    </div>
                    <div style="font-size:0.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        ${chap.title}
                    </div>
                </div>
            `;
        }).join('');

        // הצגת התוכן של הפרק הפעיל
        const activeChap = state.chapters.find(c => c.id === state.activeChapterId) || state.chapters[0];
        if (activeChap) {
            state.activeChapterId = activeChap.id;
            if (this.textareaEl.value !== activeChap.content && document.activeElement !== this.textareaEl) {
                this.textareaEl.value = activeChap.content || '';
            }
            if (this.titleDisplayEl) {
                this.titleDisplayEl.innerHTML = `📖 פרק ${activeChap.number}: ${activeChap.title}`;
            }
            this.updateStats(activeChap.content || '');
        }

        // האזנה להקלדה
        this.textareaEl.oninput = (e) => {
            const val = e.target.value;
            if (activeChap) {
                activeChap.content = val;
                window.App.saveState();
                this.updateStats(val);
                this.updateSidebarWordCount(activeChap.id, val);
            }
        };
    }

    selectChapter(chapId) {
        window.App.state.activeChapterId = chapId;
        window.App.saveState();
        this.render();
    }

    updateStats(text) {
        const trimmed = text.trim();
        const words = trimmed ? trimmed.split(/\s+/).filter(w => w.length > 0).length : 0;
        const chars = text.length;
        const readTimeMinutes = Math.max(1, Math.ceil(words / 200)); // ממוצע 200 מילים לדקה

        if (this.wordCountEl) this.wordCountEl.innerText = words.toLocaleString();
        if (this.charCountEl) this.charCountEl.innerText = chars.toLocaleString();
        if (this.readTimeEl) this.readTimeEl.innerText = `${readTimeMinutes} דק'`;
    }

    updateSidebarWordCount(chapId, text) {
        const item = document.querySelector(`.chapter-list-item[onclick*="${chapId}"] span`);
        if (item) {
            const words = text.trim() ? text.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
            item.innerText = `${words} מיל'`;
        }
    }

    toggleDistractionFree() {
        this.isDistractionFree = !this.isDistractionFree;
        const header = document.querySelector('.app-header');
        const sidebar = document.querySelector('.editor-sidebar');
        const toolbar = document.querySelector('.editor-toolbar');

        if (this.isDistractionFree) {
            if (header) header.style.display = 'none';
            if (sidebar) sidebar.style.display = 'none';
            if (toolbar) toolbar.style.background = 'transparent';
            document.querySelector('.editor-layout').style.gridTemplateColumns = '1fr';
            document.querySelector('.textarea-editor').style.paddingTop = '5rem';
            window.App.showToast('מצב פוקוס מופעל. לחץ ESC או על כפתור הפוקוס שוב כדי לצאת.', '🧘‍♂️');
        } else {
            if (header) header.style.display = 'flex';
            if (sidebar) sidebar.style.display = 'flex';
            if (toolbar) toolbar.style.background = 'rgba(15, 20, 35, 0.6)';
            document.querySelector('.editor-layout').style.gridTemplateColumns = '280px 1fr';
            document.querySelector('.textarea-editor').style.paddingTop = '3rem';
            window.App.showToast('יציאה ממצב פוקוס', '👁️');
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.ChapterEditor = new ChapterEditorManager();
    
    // יציאה ממצב פוקוס ב-ESC
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && window.ChapterEditor && window.ChapterEditor.isDistractionFree) {
            window.ChapterEditor.toggleDistractionFree();
        }
    });
});
