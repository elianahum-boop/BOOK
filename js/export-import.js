// export-import.js - ייצוא ויבוא של הספר ורעיונות העלילה

class ExportImportManager {
    constructor() {}

    exportToMarkdown() {
        if (!window.App) return;
        const state = window.App.state;

        let md = `# רשימות דינה\n\n`;
        md += `> נוצר ועודכן בסטודיו לכתיבה בתאריך ${new Date().toLocaleDateString('he-IL')}\n\n`;
        md += `---\n\n`;

        state.chapters.forEach(chap => {
            md += `## פרק ${chap.number}: ${chap.title}\n\n`;
            if (chap.summary) {
                md += `*תקציר:* ${chap.summary}\n\n`;
            }
            if (chap.content && chap.content.trim()) {
                md += `${chap.content.trim()}\n\n`;
            } else {
                md += `*(טרם נכתב טקסט לפרק זה)*\n\n`;
            }
            md += `---\n\n`;
        });

        // נספח רעיונות
        md += `# נספח: רשימת רעיונות ונקודות עלילה\n\n`;
        state.ideas.forEach(idea => {
            const chapStr = idea.chapterId ? ` [משויך לפרק ${state.chapters.find(c => c.id === idea.chapterId)?.number || ''}]` : '';
            md += `### 💡 ${idea.title} (${idea.tagLabel})${chapStr}\n\n`;
            md += `${idea.content}\n\n`;
        });

        this.downloadFile(md, `dina-chronicles-book-${this.getDateStr()}.md`, 'text/markdown;charset=utf-8');
        window.App.showToast('הספר יוצא בהצלחה כקובץ Markdown!', '📥');
    }

    exportToWordDocx() {
        if (!window.App) return;
        const state = window.App.state;

        let html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>רשימות דינה</title>
                <style>
                    body { font-family: 'Arial', 'David', sans-serif; direction: rtl; text-align: right; line-height: 1.8; font-size: 14pt; color: #000000; }
                    h1 { font-size: 24pt; color: #0284c7; text-align: center; margin-bottom: 20pt; }
                    h2 { font-size: 18pt; color: #1e293b; border-bottom: 2px solid #0284c7; padding-bottom: 5pt; margin-top: 30pt; }
                    h3 { font-size: 14pt; color: #475569; margin-top: 15pt; }
                    p { margin-bottom: 15pt; text-indent: 20pt; }
                    .summary { background: #f1f5f9; padding: 10pt; border-right: 4px solid #0284c7; font-style: italic; margin-bottom: 15pt; }
                    .page-break { page-break-before: always; }
                </style>
            </head>
            <body>
                <h1>רשימות דינה</h1>
                <p style="text-align: center; font-style: italic;">טיוטה מרוכזת מתוך הסטודיו לכתיבה - ${new Date().toLocaleDateString('he-IL')}</p>
                <div class="page-break"></div>
        `;

        state.chapters.forEach((chap, idx) => {
            if (idx > 0) html += `<div class="page-break"></div>`;
            html += `<h2>פרק ${chap.number}: ${chap.title}</h2>`;
            if (chap.summary) {
                html += `<div class="summary"><strong>תקציר:</strong> ${chap.summary}</div>`;
            }
            if (chap.content && chap.content.trim()) {
                const paragraphs = chap.content.trim().split(/\n+/);
                paragraphs.forEach(p => {
                    if (p.trim()) html += `<p>${p.trim()}</p>`;
                });
            } else {
                html += `<p style="color: #94a3b8; font-style: italic;">[טרם נכתב טקסט לפרק זה]</p>`;
            }
        });

        html += `
                <div class="page-break"></div>
                <h2>נספח: תנ"ך דמויות ורעיונות</h2>
        `;

        state.characters.forEach(char => {
            html += `<h3>👤 ${char.name} (${char.race})</h3>`;
            if (char.goal) html += `<p><strong>מטרה:</strong> ${char.goal}</p>`;
            if (char.backstory) html += `<p><strong>רקע:</strong> ${char.backstory}</p>`;
        });

        html += `</body></html>`;

        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dina-chronicles-book-${this.getDateStr()}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        window.App.showToast('הספר יוצא בהצלחה כקובץ Word!', '📄');
    }

    exportBackupJson() {
        if (!window.App) return;
        const jsonStr = JSON.stringify(window.App.state, null, 2);
        this.downloadFile(jsonStr, `dina-studio-backup-${this.getDateStr()}.json`, 'application/json');
        window.App.showToast('קובץ גיבוי של הסטודיו הורד למחשב!', '💾');
    }

    importBackupJson(inputEl) {
        const file = inputEl.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (parsed.ideas && parsed.chapters) {
                    window.App.state = parsed;
                    window.App.saveState();
                    window.App.renderCurrentTab();
                    window.App.showToast('גיבוי הסטודיו שוחזר בהצלחה!', '🎉');
                } else {
                    alert('קובץ הגיבוי לא תקין.');
                }
            } catch (err) {
                alert('שגיאה בקריאת הקובץ: ' + err.message);
            }
            inputEl.value = '';
        };
        reader.readAsText(file);
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    getDateStr() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.ExportImport = new ExportImportManager();
});
