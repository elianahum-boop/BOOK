// app.js - לוגיקה וניהול המצב הראשי של הסטודיו

const STORAGE_KEY = 'dina_chronicles_studio_state';

class AppManager {
    constructor() {
        this.state = this.loadState();
        this.initEventListeners();
        this.renderCurrentTab();
    }

    loadState() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // וודא שאין מידע חסר אם שדרגנו גרסה
                return {
                    ideas: parsed.ideas || SEED_DATA.ideas,
                    chapters: parsed.chapters || SEED_DATA.chapters,
                    characters: parsed.characters || SEED_DATA.characters,
                    activeTab: parsed.activeTab || 'ideas',
                    activeChapterId: parsed.activeChapterId || 'chap-1',
                    filterTag: 'all',
                    searchTerm: ''
                };
            } catch (e) {
                console.error('Error parsing stored state:', e);
            }
        }
        // ברירת מחדל: נתוני ההתחלה של רשימות דינה
        return {
            ...JSON.parse(JSON.stringify(SEED_DATA)),
            activeTab: 'ideas',
            activeChapterId: 'chap-1',
            filterTag: 'all',
            searchTerm: ''
        };
    }

    saveState() {
        try {
            const toSave = {
                ideas: this.state.ideas,
                chapters: this.state.chapters,
                characters: this.state.characters,
                activeTab: this.state.activeTab,
                activeChapterId: this.state.activeChapterId
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
            this.showSaveIndicator();
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }

    showSaveIndicator() {
        const indicator = document.getElementById('saveIndicator');
        if (!indicator) return;
        indicator.innerHTML = '✨ נשמר אוטומטית';
        indicator.style.opacity = '1';
        clearTimeout(this._saveTimeout);
        this._saveTimeout = setTimeout(() => {
            indicator.style.opacity = '0.7';
        }, 2000);
    }

    showToast(message, icon = '✨') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span style="font-size:1.2rem;">${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3200);
    }

    initEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        // Modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });

        document.getElementById('addIdeaBtn')?.addEventListener('click', () => {
            this.openModal('newIdeaModal');
        });

        document.getElementById('addCharacterBtn')?.addEventListener('click', () => {
            this.openModal('newCharacterModal');
        });

        // Save Idea Form
        document.getElementById('newIdeaForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateIdea(e.target);
        });

        // Save Character Form
        document.getElementById('newCharacterForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateCharacter(e.target);
        });

        // Search Input
        document.getElementById('ideaSearchInput')?.addEventListener('input', (e) => {
            this.state.searchTerm = e.target.value.toLowerCase().trim();
            if (window.IdeasBoard) window.IdeasBoard.render();
        });

        // Tag Filters
        document.querySelectorAll('.tag-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tag-filter').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.state.filterTag = e.currentTarget.getAttribute('data-tag');
                if (window.IdeasBoard) window.IdeasBoard.render();
            });
        });
    }

    switchTab(tabId) {
        this.state.activeTab = tabId;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.tab-btn[data-tab="${tabId}"]`)?.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`${tabId}View`)?.classList.add('active');

        this.renderCurrentTab();
        this.saveState();
    }

    renderCurrentTab() {
        switch (this.state.activeTab) {
            case 'ideas':
                if (window.IdeasBoard) window.IdeasBoard.render();
                break;
            case 'outliner':
                if (window.Outliner) window.Outliner.render();
                break;
            case 'characters':
                if (window.CharacterBible) window.CharacterBible.render();
                break;
            case 'editor':
                if (window.ChapterEditor) window.ChapterEditor.render();
                break;
        }
    }

    openModal(modalId) {
        document.getElementById(modalId)?.classList.add('open');
    }

    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
    }

    handleCreateIdea(form) {
        const title = form.title.value.trim();
        const tag = form.tag.value;
        const content = form.content.value.trim();
        const chapterId = form.chapterId ? form.chapterId.value : null;

        if (!title || !content) return;

        const tagLabels = {
            plot: "עלילה",
            char: "דמויות",
            magic: "קסם ופיות",
            world: "בניית עולם",
            conflict: "קונפליקט"
        };

        const newIdea = {
            id: 'idea-' + Date.now(),
            title,
            tag,
            tagLabel: tagLabels[tag] || "כללי",
            content,
            chapterId: chapterId && chapterId !== "none" ? chapterId : null
        };

        this.state.ideas.unshift(newIdea);
        this.saveState();
        form.reset();
        this.closeAllModals();
        this.showToast('הרעיון החדש נוסף בהצלחה ללוח!', '💡');
        if (window.IdeasBoard) window.IdeasBoard.render();
        if (window.Outliner) window.Outliner.render();
    }

    handleCreateCharacter(form) {
        const name = form.name.value.trim();
        const race = form.race.value.trim();
        const appearance = form.appearance.value.trim();
        const goal = form.goal.value.trim();
        const backstory = form.backstory.value.trim();
        const avatar = form.avatar.value.trim() || "👤";

        if (!name) return;

        const newChar = {
            id: 'char-' + Date.now(),
            name,
            race: race || "לא ידוע",
            bannerClass: "banner-default",
            avatar,
            appearance,
            goal,
            backstory
        };

        this.state.characters.push(newChar);
        this.saveState();
        form.reset();
        this.closeAllModals();
        this.showToast('הדמות החדשה נוספה לתנ"ך הדמויות!', '👥');
        if (window.CharacterBible) window.CharacterBible.render();
    }
}

// Global App Instance
window.addEventListener('DOMContentLoaded', () => {
    window.App = new AppManager();
});
