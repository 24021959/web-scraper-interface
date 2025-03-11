document.addEventListener('DOMContentLoaded', function() {
    const scrapeForm = document.getElementById('scrape-form');
    const siteUrlInput = document.getElementById('site-url');
    const resultContainer = document.getElementById('result-container');
    const processingAlert = document.getElementById('processing-alert');
    const successAlert = document.getElementById('success-alert');
    const errorAlert = document.getElementById('error-alert');
    const recentExtractionsContainer = document.getElementById('recent-extractions');
    
    console.log("Script caricato correttamente");
    
    // Carica le estrazioni recenti
    loadRecentExtractions();
    
    // Gestisci invio del form
    scrapeForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log("Form inviato");
        
        const url = siteUrlInput.value.trim();
        if (!url) return;
        console.log("URL da processare:", url);
        
        // Mostra il contenitore risultati e l'alert di elaborazione
        resultContainer.classList.remove('d-none');
        processingAlert.classList.remove('d-none');
        successAlert.classList.add('d-none');
        errorAlert.classList.add('d-none');
        
        try {
            // URL del webhook n8n in produzione
            const webhookUrl = 'https://n8n-n8n.hcrxqs.easypanel.host/webhook/extract';
            console.log("Chiamata webhook:", webhookUrl);
            
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url })
            });
            
            console.log("Risposta ricevuta, status:", response.status);
            
            if (!response.ok) {
                throw new Error(`Errore server: ${response.status} ${response.statusText}`);
            }
            
            let responseText = "Estrazione completata con successo!";
            
            try {
                const responseData = await response.json();
                console.log("Risposta JSON:", responseData);
                if (responseData.message) {
                    responseText = responseData.message;
                }
            } catch (jsonError) {
                console.log("La risposta non è in formato JSON:", jsonError);
                // Proviamo a ottenere il testo della risposta
                const textResponse = await response.text();
                console.log("Risposta testuale:", textResponse);
            }
            
            // Nascondi l'alert di elaborazione e mostra quello di successo
            processingAlert.classList.add('d-none');
            successAlert.classList.remove('d-none');
            successAlert.innerHTML = responseText;
            
            // Salva l'estrazione nella cronologia
            saveExtraction(url);
            loadRecentExtractions();
            
            // Pulisci l'input
            siteUrlInput.value = '';
            
        } catch (error) {
            console.error('Errore completo:', error);
            // Nascondi l'alert di elaborazione e mostra quello di errore
            processingAlert.classList.add('d-none');
            errorAlert.classList.remove('d-none');
            errorAlert.textContent = `Errore: ${error.message}`;
        }
    });
    
    // Funzione per salvare l'estrazione nella cronologia
    function saveExtraction(url) {
        const extractions = JSON.parse(localStorage.getItem('recentExtractions') || '[]');
        extractions.unshift({
            url: url,
            timestamp: new Date().toISOString()
        });
        
        // Mantieni solo le ultime 10 estrazioni
        if (extractions.length > 10) {
            extractions.pop();
        }
        
        localStorage.setItem('recentExtractions', JSON.stringify(extractions));
    }
    
    // Funzione per caricare le estrazioni recenti
    function loadRecentExtractions() {
        const extractions = JSON.parse(localStorage.getItem('recentExtractions') || '[]');
        
        if (extractions.length === 0) {
            recentExtractionsContainer.innerHTML = '<li class="list-group-item text-center">Nessuna estrazione recente</li>';
            return;
        }
        
        recentExtractionsContainer.innerHTML = '';
        
        extractions.forEach(extraction => {
            const date = new Date(extraction.timestamp);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            
            listItem.innerHTML = `
                <div>
                    <strong>${extraction.url}</strong>
                    <div class="timestamp">${formattedDate}</div>
                </div>
                <button class="btn btn-sm btn-outline-primary extract-again-btn" data-url="${extraction.url}">
                    Estrai di nuovo
                </button>
            `;
            
            recentExtractionsContainer.appendChild(listItem);
        });
        
        // Aggiungi event listener ai bottoni "Estrai di nuovo"
        document.querySelectorAll('.extract-again-btn').forEach(button => {
            button.addEventListener('click', function() {
                siteUrlInput.value = this.getAttribute('data-url');
                scrapeForm.dispatchEvent(new Event('submit'));
            });
        });
    }
});
