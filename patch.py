import io
import sys

try:
    with io.open('dashboard12_troskova.html', 'r', encoding='cp1250') as f:
        content = f.read()

    target_sync = '        async function syncFirestoreUsers() {'
    replace_sync = '''        async function forceSyncUsers() {
            if (!window.db) { alert("Baza nije povezana!"); return; }
            try {
                if (event && event.currentTarget) { event.currentTarget.innerText = "Osvježavam..."; }
                await syncFirestoreUsers();
                if (event && event.currentTarget) { event.currentTarget.innerText = "Osvježi iz baze"; }
                alert("Nalozi su uspješno sinhronizovani sa glavne baze!");
            } catch(e) { alert("Greška: " + e.message); }
        }

        async function syncFirestoreUsers() {'''
    content = content.replace(target_sync, replace_sync)

    target_btn = '<span id="userCountBadge" class="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold">1 nalog</span>'
    replace_btn = '''<div class="flex items-center gap-2">
                            <button onclick="forceSyncUsers()" type="button" class="text-[10px] bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-2 py-1 rounded font-bold transition-colors">?? Osvježi iz baze</button>
                            <span id="userCountBadge" class="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold">1 nalog</span>
                        </div>'''
    content = content.replace(target_btn, replace_btn)

    with io.open('dashboard12_troskova.html', 'w', encoding='cp1250') as f:
        f.write(content)
    print("Success")
except Exception as e:
    print(e)
