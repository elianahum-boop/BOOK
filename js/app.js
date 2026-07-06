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
            const form = document.getElementById('newIdeaForm');
            if (form) { form.reset(); if(form.editId) form.editId.value = ''; }
            const titleEl = document.querySelector('#newIdeaModal h3');
            if (titleEl) titleEl.innerText = '💡 רעיון חדש לעלילה';
            this.openModal('newIdeaModal');
        });

        document.getElementById('addCharacterBtn')?.addEventListener('click', () => {
            const form = document.getElementById('newCharacterForm');
            if (form) { form.reset(); if(form.editId) form.editId.value = ''; }
            const titleEl = document.querySelector('#newCharacterModal h3');
            if (titleEl) titleEl.innerText = '👥 הוספת דמות חדשה';
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

    openEditIdeaModal(ideaId) {
        const idea = this.state.ideas.find(i => i.id === ideaId);
        if (!idea) return;
        
        const form = document.getElementById('newIdeaForm');
        if (!form) return;
        
        form.reset();
        if (form.editId) form.editId.value = idea.id;
        if (form.title) form.title.value = idea.title;
        if (form.tag) form.tag.value = idea.tag;
        if (form.chapterId) form.chapterId.value = idea.chapterId || 'none';
        if (form.content) form.content.value = idea.content;

        const titleEl = document.querySelector('#newIdeaModal h3');
        if (titleEl) titleEl.innerText = '✏️ עריכת רעיון עלילה';

        this.openModal('newIdeaModal');
    }

    openEditCharacterModal(charId) {
        const char = this.state.characters.find(c => c.id === charId);
        if (!char) return;

        const form = document.getElementById('newCharacterForm');
        if (!form) return;

        form.reset();
        if (form.editId) form.editId.value = char.id;
        if (form.name) form.name.value = char.name;
        if (form.race) form.race.value = char.race || '';
        if (form.avatar) form.avatar.value = char.avatar || '';
        if (form.appearance) form.appearance.value = char.appearance || '';
        if (form.goal) form.goal.value = char.goal || '';
        if (form.backstory) form.backstory.value = char.backstory || '';

        const titleEl = document.querySelector('#newCharacterModal h3');
        if (titleEl) titleEl.innerText = '✏️ עריכת דמות';

        this.openModal('newCharacterModal');
    }

    handleCreateIdea(form) {
        const title = form.title.value.trim();
        const tag = form.tag.value;
        const content = form.content.value.trim();
        const chapterId = form.chapterId ? form.chapterId.value : null;
        const editId = form.editId ? form.editId.value : null;

        if (!title || !content) return;

        const tagLabels = {
            plot: "עלילה",
            char: "דמויות",
            magic: "קסם ופיות",
            world: "בניית עולם",
            conflict: "קונפליקט"
        };

        if (editId) {
            const existing = this.state.ideas.find(i => i.id === editId);
            if (existing) {
                existing.title = title;
                existing.tag = tag;
                existing.tagLabel = tagLabels[tag] || "כללי";
                existing.content = content;
                existing.chapterId = chapterId && chapterId !== "none" ? chapterId : null;
                this.showToast('הרעיון עודכן בהצלחה!', '✏️');
            }
        } else {
            const newIdea = {
                id: 'idea-' + Date.now(),
                title,
                tag,
                tagLabel: tagLabels[tag] || "כללי",
                content,
                chapterId: chapterId && chapterId !== "none" ? chapterId : null
            };
            this.state.ideas.unshift(newIdea);
            this.showToast('הרעיון החדש נוסף בהצלחה ללוח!', '💡');
        }

        this.saveState();
        form.reset();
        if (form.editId) form.editId.value = '';
        const titleEl = document.querySelector('#newIdeaModal h3');
        if (titleEl) titleEl.innerText = '💡 רעיון חדש לעלילה';

        this.closeAllModals();
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
        const editId = form.editId ? form.editId.value : null;

        if (!name) return;

        if (editId) {
            const existing = this.state.characters.find(c => c.id === editId);
            if (existing) {
                existing.name = name;
                existing.race = race || "לא ידוע";
                existing.avatar = avatar;
                existing.appearance = appearance;
                existing.goal = goal;
                existing.backstory = backstory;
                this.showToast('הדמות עודכנה בהצלחה!', '✏️');
            }
        } else {
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
            this.showToast('הדמות החדשה נוספה לתנ"ך הדמויות!', '👥');
        }

        this.saveState();
        form.reset();
        if (form.editId) form.editId.value = '';
        const titleEl = document.querySelector('#newCharacterModal h3');
        if (titleEl) titleEl.innerText = '👥 הוספת דמות חדשה';

        this.closeAllModals();
        if (window.CharacterBible) window.CharacterBible.render();
    }
}

// Global App Instance
window.addEventListener('DOMContentLoaded', () => {
    window.App = new AppManager();
});
