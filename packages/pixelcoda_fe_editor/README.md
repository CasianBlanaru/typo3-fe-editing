# pixelcoda FE Editor (alpha)

Core-nahe Frontend-Editier-Extension für TYPO3 12/13/14.
- **PSR-15 Middleware**: Injiziert Toolbar/JS nur für berechtigte BE-User
- **Sicheres Speichern**: Via TYPO3 DataHandler (Datamap/Cmdmap)
- **CSRF-Schutz**: Via FormProtection (BE-Kontext)
- **CKEditor 5 Preset**: RTE-Konfiguration inklusive
- **Dropzones**: Einfache Erstellung neuer `tt_content` Elemente
- **KI-Ready**: Interface für zukünftige AI-Provider Integration

## Installation

### Standard-Installation
1. Ordner nach `typo3conf/ext/pixelcoda_fe_editor` kopieren **oder** als Composer-Package einbinden.
2. Extension im Backend aktivieren.
3. Als **BE-User** einloggen, Frontend aufrufen → Toolbar sichtbar.

### DDEV-Installation (empfohlen)
```bash
# In deinem DDEV-Projekt
ddev composer require pixelcoda/fe-editor:@dev

# Oder bei lokaler Entwicklung
ddev composer config repositories.pixelcoda_fe_editor path typo3conf/ext/pixelcoda_fe_editor
ddev composer require pixelcoda/fe-editor:@dev

# Extension aktivieren
ddev exec typo3 extension:activate pixelcoda_fe_editor

# Cache löschen
ddev exec typo3 cache:flush
```

### Templates vorbereiten
In deinen Templates editierbare Felder markieren, z. B.:
```html
<h2 data-pc-field data-table="tt_content" data-uid="{data.uid}" data-field="header">{data.header}</h2>
<div data-pc-field data-table="tt_content" data-uid="{data.uid}" data-field="bodytext">{data.bodytext -> f:format.raw()}</div>

<div class="pc-drop" data-pc-dropzone data-target-pid="{data.pid}" data-col-pos="{data.colPos}">
  <button type="button" class="pc-add">+ Element</button>
</div>
```
5. Edit-Schalter togglen, Änderungen on-blur speichern; „+ Element“ legt neues CE an.

## Hinweise
- DataHandler ist der offizielle Core-Weg zum Schreiben/Bewegen von Datensätzen.
- Ajax-Route ist in `Configuration/Backend/AjaxRoutes.php` registriert → `TYPO3.settings.ajaxUrls['fe_editor_save']`.
- CSRF nutzt `TYPO3.security.csrfToken` (nur eingeloggte User).
- RTE/CKEditor 5: Preset unter `Configuration/RTE/Editor.yaml`.

## Roadmap
- Move/Copy/Delete Buttons inkl. UI.
- KI-Provider (OpenAI/Lokal) mit Rate-Limit/Caching.
- Content-Block-freundliche Registry für weitere Tabellen.


## Demo-Inhaltselement (pc_demo)
- Static TypoScript der Extension einbinden (Template-Modul → Static Includes → "pixelcoda FE Editor Demo").
- In der Seite neues Inhaltselement anlegen → "pixelcoda Demo (editierbar)".
- Das Template markiert header, subheader und bodytext als `data-pc-field` und bietet eine Dropzone.

## DDEV-Spezifische Hinweise
- Die Extension funktioniert automatisch mit HTTPS in DDEV
- Pfade werden dynamisch über `PathUtility::getAbsoluteWebPath()` generiert
- CSRF-Token wird korrekt im Frontend injiziert
- Bei Problemen: `ddev exec typo3 cache:flush` ausführen

## Troubleshooting
- **Toolbar nicht sichtbar?** → Als BE-User einloggen, Rechte prüfen (Admin oder `tables_modify: tt_content`)
- **Speichern funktioniert nicht?** → Browser-Konsole prüfen, CSRF-Token vorhanden?
- **Icons nicht sichtbar?** → Cache löschen, Pfade in Browser-Dev-Tools prüfen
