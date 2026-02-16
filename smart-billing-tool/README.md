# 🚀 Smart Checkout & Billing Automator

## 💡 Idea del Progetto
Questo tool è stato progettato per risolvere il problema dei dati errati nei database aziendali e automatizzare l'invio delle fatture elettroniche. Sostituisce l'inserimento manuale dei dati con un sistema di validazione in tempo reale basato sulle banche dati ufficiali di OpenAPI.

## 🛠 Funzionalità Utente
Il workflow è diviso in due fasi logiche basate sulle Composition API di Vue 3:

* **Fase 1: Validazione e Risk Check (Company API)**:
    * **Ricerca P.IVA**: Inserendo la Partita IVA, il tool recupera automaticamente Ragione Sociale, Indirizzo, PEC e Codice SDI.
    * **Check Stato**: Verifica se l'azienda è attiva (ACTIVE) o cessata, inibendo la fatturazione in caso di anomalie.
    * **Score Finanziario**: Visualizza il rating dell'azienda (es. "A-") per prevenire insoluti.

* **Fase 2: Automazione Fatturazione (Invoice API)**:
    * **Generazione XML**: Costruisce il payload fiscale senza errori di battitura, prelevando i dati certificati dalla Fase 1.
    * **Invio SDI**: Invia il documento fiscale direttamente al Sistema di Interscambio.
    * **Tracking**: Restituisce l'ID remoto per monitorare lo stato di consegna del documento.

## 💰 Analisi Costi e Crediti
L'integrazione utilizza il sistema a consumo di OpenAPI. Di seguito i costi stimati per chiamata:

| Operazione | Pacchetto/Endpoint | Costo Crediti | Note |
| :--- | :--- | :--- | :--- |
| **Ricerca Azienda** | IT-advanced (Pacchetto 3) | 0.100  EU/richiesta Free Tiers: 30/month | Fornisce dati completi e Score Finanziario. |
| **Invio Documento** | IT-receipts / Invoice API | 0.019 EU/richiesta | Costo per singolo invio allo SDI. |

## 🚀 Setup e Installazione
1. **Posizionamento**: Assicurati di essere nella cartella corretta: `cd smart-billing-tool/smart-billing-tool`.
2. **Installazione**: Esegui `npm install` per scaricare le dipendenze (Vite, Axios, Pinia).
3. **Configurazione**: Crea un file `.env` e inserisci il tuo token: `VITE_OPENAPI_TOKEN=v4vs7...`.
4. **Esecuzione**: Avvia il server di sviluppo con `npm run dev`.

## 📁 Struttura del Progetto
Il progetto segue un'architettura modulare per facilitare l'integrazione nella repository main:
* `/src/api`: Istanza Axios centralizzata.
* `/src/composables`: Logica di business riutilizzabile.
* `/src/stores`: Gestione dello stato globale con Pinia.