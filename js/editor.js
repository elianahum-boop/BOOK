// editor.js - עורך הפרקים עשיר (כולל מירקור ובנק מילים/רעיונות)

class ChapterEditorManager {
    constructor() {
        this.sidebarMode = 'chapters'; // 'chapters' or 'wordbank'
        this.isDistractionFree = false;
    }

    render() {
        if (!window.App) return;
        const state = window.App.state;
        
        const sidebarContentEl = document.getElementById('sidebarDynamicContent');
        const editorEl = document.getElementById('chapterEditorArea');
        const titleDisplayEl = document.getElementById('currentChapterTitleDisplay');

        if (!sidebarContentEl || !editorEl) return;

        // רינדור סרגל הצד (פרקים או בנק מילים)
        if (this.sidebarMode === 'chapters') {
            sidebarContentEl.innerHTML = state.chapters.map(chap => {
                const isActive = chap.id === state.activeChapterId;
                const plain = this.stripHtml(chap.content || '');
                const words = plain.trim() ? plain.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
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
        } else {
            // בנק מילים ורעיונות
            let bankHtml = `<div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.8rem;">לחץ "➕ הוסף" כדי לשתול שם, מושג או רעיון במיקום הסמן בעורך:</div>`;
            
            // דמויות ומושגים
            bankHtml += `<div class="bank-section-title">👤 דמויות וגזעים</div>`;
            state.characters.forEach(c => {
                bankHtml += `
                    <div class="bank-item">
                        <div>
                            <div style="font-weight:600; color:#fff;">${c.name}</div>
                            <div style="font-size:0.75rem; color:var(--accent-ice);">${c.race || ''}</div>
                        </div>
                        <button class="btn btn-primary" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="window.ChapterEditor.insertText('${c.name}')" title="הכנס שם לטקסט">➕ הוסף</button>
                    </div>
                `;
            });

            // מילון עולם ואנציקלופדיה
            if (state.wiki && state.wiki.length > 0) {
                bankHtml += `<div class="bank-section-title" style="margin-top:1.2rem;">🌍 מילון מושגים ומקומות</div>`;
                state.wiki.forEach(w => {
                    bankHtml += `
                        <div class="bank-item">
                            <div>
                                <div style="font-weight:600; color:#fff;">${w.title}</div>
                                <div style="font-size:0.75rem; color:#c084fc;">${w.categoryLabel || ''}</div>
                            </div>
                            <button class="btn" style="padding:0.2rem 0.5rem; font-size:0.75rem; background:rgba(168,85,247,0.2); color:#c084fc;" onclick="window.ChapterEditor.insertText('${w.title}')" title="הכנס מושג לטקסט">➕ הוסף</button>
                        </div>
                    `;
                });
            }

            // רעיונות מלוח הרעיונות
            bankHtml += `<div class="bank-section-title" style="margin-top:1.2rem;">💡 רעיונות וסצנות</div>`;
            state.ideas.forEach(i => {
                bankHtml += `
                    <div class="bank-item" style="flex-direction:column; align-items:flex-start; gap:0.4rem;">
                        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                            <strong style="color:#fbbf24; font-size:0.85rem;">${i.title}</strong>
                            <button class="btn btn-gold" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="window.ChapterEditor.insertText('${i.content.replace(/'/g, "\\'")}')">➕ הוסף קטע</button>
                        </div>
                        <div style="font-size:0.78rem; color:var(--text-secondary); max-height:45px; overflow:hidden; text-overflow:ellipsis;">${i.content}</div>
                    </div>
                `;
            });

            sidebarContentEl.innerHTML = bankHtml;
        }

        // טעינת הפרק הפעיל אל תוך העורך
        const activeChap = state.chapters.find(c => c.id === state.activeChapterId) || state.chapters[0];
        if (activeChap) {
            state.activeChapterId = activeChap.id;
            if (editorEl.innerHTML !== (activeChap.content || '') && document.activeElement !== editorEl) {
                editorEl.innerHTML = activeChap.content || '';
            }
            if (titleDisplayEl) {
                titleDisplayEl.innerHTML = `📖 פרק ${activeChap.number}: ${activeChap.title}`;
            }
            this.updateStats(activeChap.content || '');
            this.renderChapterGoals(activeChap);
        }

        // שמירה אוטומטית בעת הקלדה או מירקור
        editorEl.oninput = () => {
            if (activeChap) {
                activeChap.content = editorEl.innerHTML;
                window.App.saveState();
                this.updateStats(editorEl.innerHTML);
                if (this.sidebarMode === 'chapters') {
                    this.updateSidebarWordCount(activeChap.id, editorEl.innerHTML);
                }
            }
        };
    }

    switchSidebarMode(mode) {
        this.sidebarMode = mode;
        document.querySelectorAll('.sidebar-tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`sidebarBtn_${mode}`)?.classList.add('active');
        this.render();
    }

    selectChapter(chapId) {
        window.App.state.activeChapterId = chapId;
        window.App.saveState();
        this.render();
    }

    insertText(textToInsert) {
        const editorEl = document.getElementById('chapterEditorArea');
        if (!editorEl) return;

        editorEl.focus();
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && editorEl.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(textToInsert);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            // אם אין פוקוס ספציפי, הוסף לסוף הטקסט
            editorEl.innerHTML += (editorEl.innerHTML ? ' ' : '') + textToInsert;
        }

        // עדכון שמירה וסטטיסטיקה
        const activeChap = window.App.state.chapters.find(c => c.id === window.App.state.activeChapterId);
        if (activeChap) {
            activeChap.content = editorEl.innerHTML;
            window.App.saveState();
            this.updateStats(editorEl.innerHTML);
        }
        window.App.showToast('הקטע נוסף לפרק!', '➕');
    }

    highlightSelection(color) {
        const editorEl = document.getElementById('chapterEditorArea');
        if (!editorEl) return;
        editorEl.focus();
        document.execCommand('hiliteColor', false, color);
        
        // שמירה לאחר המירקור
        const activeChap = window.App.state.chapters.find(c => c.id === window.App.state.activeChapterId);
        if (activeChap) {
            activeChap.content = editorEl.innerHTML;
            window.App.saveState();
        }
        window.App.showToast(color === 'transparent' ? 'המרקר הוסר' : 'הקטע סומן במרקר!', '🖍️');
    }

    stripHtml(html) {
        if (!html) return '';
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    updateStats(htmlContent) {
        const plain = this.stripHtml(htmlContent).trim();
        const words = plain ? plain.split(/\s+/).filter(w => w.length > 0).length : 0;
        const chars = plain.length;
        const readTimeMinutes = Math.max(1, Math.ceil(words / 200));

        const wc = document.getElementById('statWordCount');
        const cc = document.getElementById('statCharCount');
        const rt = document.getElementById('statReadTime');

        if (wc) wc.innerText = words.toLocaleString();
        if (cc) cc.innerText = chars.toLocaleString();
        if (rt) rt.innerText = `${readTimeMinutes} דק'`;
    }

    updateSidebarWordCount(chapId, htmlContent) {
        const item = document.querySelector(`.chapter-list-item[onclick*="${chapId}"] span`);
        if (item) {
            const plain = this.stripHtml(htmlContent).trim();
            const words = plain ? plain.split(/\s+/).filter(w => w.length > 0).length : 0;
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
            document.getElementById('chapterEditorArea').style.paddingTop = '5rem';
            window.App.showToast('מצב פוקוס מופעל. לחץ ESC לעזיבה.', '🧘‍♂️');
        } else {
            if (header) header.style.display = 'flex';
            if (sidebar) sidebar.style.display = 'flex';
            if (toolbar) toolbar.style.background = 'rgba(15, 20, 35, 0.6)';
            document.querySelector('.editor-layout').style.gridTemplateColumns = '320px 1fr';
            document.getElementById('chapterEditorArea').style.paddingTop = '3rem';
            window.App.showToast('יציאה ממצב פוקוס', '👁️');
        }
    }

    renderChapterGoals(chapter) {
        const container = document.getElementById('chapterGoalsContainer');
        if (!container || !chapter) return;

        if (!chapter.goals) chapter.goals = [];

        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.5rem; flex-wrap:wrap; gap:0.5rem;">
                <div style="font-weight:700; color:#f8fafc; font-size:0.95rem; display:flex; align-items:center; gap:0.4rem;">
                    🎯 יעדי ומשימות לפרק <span style="font-size:0.75rem; background:rgba(56,189,248,0.15); color:#38bdf8; padding:0.1rem 0.5rem; border-radius:12px; font-weight:normal;">ניתן לעריכה</span>
                </div>
                <div style="font-size:0.8rem; color: #38bdf8; font-weight:600; background:rgba(0,0,0,0.3); padding:0.2rem 0.6rem; border-radius:8px;">
                    ${chapter.goals.filter(g => g.done).length} / ${chapter.goals.length} הושלמו
                </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:0.5rem; max-height: 160px; overflow-y:auto; padding-right:0.3rem;">
        `;

        if (chapter.goals.length === 0) {
            html += `<div style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:0.5rem;">אין יעדים לפרק זה כרגע. הקלידו יעד חדש למטה והוסיפו!</div>`;
        } else {
            chapter.goals.forEach(goal => {
                html += `
                    <div style="display:flex; align-items:center; gap:0.6rem; background: rgba(0,0,0,0.25); padding:0.4rem 0.6rem; border-radius:6px; border: 1px solid rgba(255,255,255,0.04);">
                        <input type="checkbox" ${goal.done ? 'checked' : ''} onchange="window.ChapterEditor.toggleGoal('${chapter.id}', '${goal.id}')" style="cursor:pointer; width:16px; height:16px; accent-color:#38bdf8;">
                        <input type="text" value="${goal.text.replace(/"/g, '&quot;')}" 
                               onchange="window.ChapterEditor.editGoalText('${chapter.id}', '${goal.id}', this.value)"
                               style="flex:1; background:transparent; border:none; color: ${goal.done ? '#64748b' : '#fff'}; text-decoration: ${goal.done ? 'line-through' : 'none'}; font-size:0.88rem; font-family:inherit; outline:none;" 
                               title="לחץ כאן כדי לערוך את טקסט היעד">
                        <button class="icon-btn" onclick="window.ChapterEditor.deleteGoal('${chapter.id}', '${goal.id}')" style="color:#f43f5e; font-size:0.9rem; padding:0.1rem;" title="מחק יעד זה">🗑️</button>
                    </div>
                `;
            });
        }

        html += `
            </div>
            <div style="display:flex; gap:0.5rem; margin-top: 0.8rem;">
                <input type="text" id="newGoalInput_${chapter.id}" class="form-control" placeholder="הקלידו יעד/משימה חדשה לפרק..." style="padding:0.4rem 0.8rem; font-size:0.85rem;">
                <button class="btn btn-primary" onclick="window.ChapterEditor.addGoal('${chapter.id}')" style="padding:0.4rem 0.8rem; font-size:0.85rem; white-space:nowrap; background:linear-gradient(135deg,#0ea5e9,#2563eb);">
                    + הוסף יעד
                </button>
            </div>
        `;

        container.innerHTML = html;

        const inputEl = document.getElementById(`newGoalInput_${chapter.id}`);
        if (inputEl) {
            inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addGoal(chapter.id);
                }
            });
        }
    }

    toggleGoal(chapterId, goalId) {
        const chapter = window.App.state.chapters.find(c => c.id === chapterId);
        if (!chapter || !chapter.goals) return;
        const goal = chapter.goals.find(g => g.id === goalId);
        if (goal) {
            goal.done = !goal.done;
            window.App.saveState();
            this.renderChapterGoals(chapter);
            window.App.showToast(goal.done ? 'יעד הושלם! כל הכבוד 🎯' : 'יעד סומן כלא הושלם', '🎯');
        }
    }

    addGoal(chapterId) {
        const chapter = window.App.state.chapters.find(c => c.id === chapterId);
        if (!chapter) return;
        const inputEl = document.getElementById(`newGoalInput_${chapterId}`);
        if (!inputEl) return;
        const text = inputEl.value.trim();
        if (!text) return;

        if (!chapter.goals) chapter.goals = [];
        chapter.goals.push({
            id: 'goal-' + Date.now(),
            text,
            done: false
        });

        window.App.saveState();
        this.renderChapterGoals(chapter);
        window.App.showToast('יעד חדש נוסף לפרק!', '➕');
    }

    deleteGoal(chapterId, goalId) {
        const chapter = window.App.state.chapters.find(c => c.id === chapterId);
        if (!chapter || !chapter.goals) return;
        chapter.goals = chapter.goals.filter(g => g.id !== goalId);
        window.App.saveState();
        this.renderChapterGoals(chapter);
        window.App.showToast('היעד נמחק מהפרק', '🗑️');
    }

    editGoalText(chapterId, goalId, newText) {
        const chapter = window.App.state.chapters.find(c => c.id === chapterId);
        if (!chapter || !chapter.goals) return;
        const goal = chapter.goals.find(g => g.id === goalId);
        if (goal && newText.trim()) {
            goal.text = newText.trim();
            window.App.saveState();
            window.App.showToast('טקסט היעד עודכן', '✏️');
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.ChapterEditor = new ChapterEditorManager();
    
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && window.ChapterEditor && window.ChapterEditor.isDistractionFree) {
            window.ChapterEditor.toggleDistractionFree();
        }
    });
});
