// export-import.js - ייצוא נקי ללא עיצוב (טקסט ו-Word) ויבוא גיבוי

class ExportImportManager {
    constructor() {}

    exportToPlainText() {
        if (!window.App) return;
        const state = window.App.state;

        let txt = `רשימות דינה\n`;
        txt += `=====================================\n\n`;

        state.chapters.forEach(chap => {
            txt += `פרק ${chap.number}: ${chap.title}\n`;
            txt += `-------------------------------------\n\n`;
            
            // ניקוי תגיות HTML אם יש מירקורים או עיצובים
            const plainContent = this.stripHtml(chap.content || '');
            if (plainContent.trim()) {
                txt += `${plainContent.trim()}\n\n\n`;
            } else {
                txt += `[טרם נכתב טקסט לפרק זה]\n\n\n`;
            }
        });

        this.downloadFile(txt, `dina-chronicles-text-${this.getDateStr()}.txt`, 'text/plain;charset=utf-8');
        window.App.showToast('הספר יוצא בהצלחה כקובץ טקסט (.txt) נקי!', '📥');
    }

    exportToWordDocx() {
        if (!window.App) return;
        const state = window.App.state;

        // ייצוא וורד נקי לחלוטין - ללא צבעים, ללא רקעים, רק מלל שחור על לבן
        let html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>רשימות דינה</title>
                <style>
                    body { font-family: 'Arial', 'David', sans-serif; direction: rtl; text-align: right; line-height: 1.6; font-size: 12pt; color: #000000; background: #ffffff; }
                    p { margin-bottom: 12pt; margin-top: 0; }
                    .chapter-title { font-size: 16pt; font-weight: bold; margin-top: 24pt; margin-bottom: 12pt; }
                    .page-break { page-break-before: always; }
                </style>
            </head>
            <body>
        `;

        state.chapters.forEach((chap, idx) => {
            if (idx > 0) html += `<div class="page-break"></div>`;
            html += `<div class="chapter-title">פרק ${chap.number}: ${chap.title}</div>`;
            
            const plainContent = this.stripHtml(chap.content || '');
            if (plainContent.trim()) {
                const paragraphs = plainContent.trim().split(/\n+/);
                paragraphs.forEach(p => {
                    if (p.trim()) html += `<p>${p.trim()}</p>`;
                });
            } else {
                html += `<p>[טרם נכתב טקסט לפרק זה]</p>`;
            }
        });

        html += `</body></html>`;

        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dina-chronicles-${this.getDateStr()}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        window.App.showToast('הספר יוצא בהצלחה כקובץ Word נקי!', '📄');
    }

    stripHtml(html) {
        if (!html) return '';
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
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
