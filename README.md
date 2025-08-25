# AI Chat - Din personliga AI-assistent

En modern och användarvänlig AI-chattapplikation byggd med HTML, CSS och JavaScript.

## Funktioner

### 🤖 AI-chatt
- Chatta med en intelligent AI-assistent
- Stöd för svenska språket
- Konversationshistorik
- Anpassningsbara AI-inställningar (modell, temperatur, tokens)

### 📁 Dokumentverktyg (NYTT!)
- **Filuppladdning och analys:**
  - Stöd för PDF, Word (.doc, .docx), PowerPoint (.ppt, .pptx)
  - Drag & drop-funktionalitet
  - Automatisk filanalys med AI
  - Filhantering med möjlighet att ta bort uppladdade filer

- **Dokumentmallar:**
  - 🧪 Labbrapport - Komplett mall för laborationsrapporter
  - 💼 Affärsplan - Strukturerad mall för affärsplaner
  - 👥 Mötesanteckningar - Mall för mötesprotokoll
  - 📋 Projektplan - Detaljerad mall för projektplanering

- **📅 Planeringsstöd (NYTT!):**
  - 🎓 Studieplan - Strukturerad mall för studier och mål
  - ⏰ Schema - Veckoschema med tidsplanering
  - 🔔 Deadline-påminnelser - System för att hantera deadlines
  - 📝 Uppgiftslista - Prioriterad lista med uppgifter och status
  - Export-funktionalitet för alla genererade mallar

### 🔐 Användarhantering
- Registrering och inloggning
- Användarprofiler
- Chatt-historik per användare
- Demo-konto tillgängligt

### 🎨 Användargränssnitt
- Responsiv design
- Ljust och mörkt tema
- Modern och intuitiv layout
- Sidopanel med chatt-historik

## Komma igång

### Demo-konto
- **Användarnamn:** demo
- **Lösenord:** demo123

### Installation
1. Ladda ner alla filer
2. Öppna `index.html` i en webbläsare
3. Logga in med demo-kontot eller skapa ett nytt konto

## Teknisk information

### Filstruktur
```
AI/
├── index.html          # Huvudapplikation
├── script.js           # JavaScript-funktionalitet
├── styles.css          # CSS-styling
├── users.json          # Användardata
└── README.md           # Denna fil
```

### API-integration
- Använder OpenRouter API för AI-funktionalitet
- Stöd för GPT-3.5 och GPT-4 modeller
- Streaming-svar för bättre användarupplevelse

### Filtyper som stöds
- **PDF:** application/pdf
- **Word:** .doc, .docx
- **PowerPoint:** .ppt, .pptx

## Användning av dokumentverktyg

### 1. Ladda upp filer
- Klicka på "Välj filer" eller dra och släpp filer i uppladdningsområdet
- Filer analyseras automatiskt av AI:n
- Få detaljerad feedback om dina dokument

### 2. Generera mallar
- Klicka på önskad mall (t.ex. "Labbrapport")
- AI:n genererar en komplett mall med svenska struktur
- Exportera mallen som textfil för vidare redigering

### 3. Planeringsstöd
- **Studieplan:** Skapa strukturerade studier med mål och scheman
- **Schema:** Generera veckoscheman med tidsplanering
- **Deadline-påminnelser:** Hantera deadlines med prioritering
- **Uppgiftslista:** Organisera uppgifter med status och ansvar

### 4. Filhantering
- Se alla uppladdade filer med detaljerad information
- Analysera filer igen vid behov
- Ta bort filer från listan

## Utveckling

### Lägga till nya mallar
För att lägga till nya dokumentmallar, redigera `generateDocumentTemplate()` funktionen i `script.js`.

### Anpassa filtyper
För att ändra vilka filtyper som stöds, uppdatera `isValidFileType()` funktionen.

## Licens

Detta projekt är öppen källkod och tillgängligt under MIT-licensen.

## Support

För frågor eller problem, öppna en issue i projektet eller kontakta utvecklaren. 