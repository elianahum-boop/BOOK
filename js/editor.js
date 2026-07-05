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
}

window.addEventListener('DOMContentLoaded', () => {
    window.ChapterEditor = new ChapterEditorManager();
    
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && window.ChapterEditor && window.ChapterEditor.isDistractionFree) {
            window.ChapterEditor.toggleDistractionFree();
        }
    });
});
