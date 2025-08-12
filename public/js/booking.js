document.addEventListener('DOMContentLoaded', function() {
    // Elementi del DOM
    const bookingForm = document.getElementById('bookingForm');
    const confirmation = document.getElementById('bookingSuccess');
    const dateInput = document.getElementById('date');
    const timeSelect = document.getElementById('time');
    const barberSelect = document.getElementById('barber');
    
    // Inizializzazione
    initDatePicker();
    setupEventListeners();

    function initDatePicker() {
        // Imposta la data minima (domani) e massima (3 mesi da oggi)
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const maxDate = new Date(today);
        maxDate.setMonth(maxDate.getMonth() + 3);
        
        dateInput.min = formatDate(tomorrow);
        dateInput.max = formatDate(maxDate);
    }

    function setupEventListeners() {
        // Genera gli orari disponibili quando si seleziona una data
        dateInput.addEventListener('change', function() {
            updateAvailableTimes();
        });

        // Gestione submit del form
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleFormSubmit();
        });
    }

    function updateAvailableTimes() {
        const selectedDate = new Date(dateInput.value);
        const dayOfWeek = selectedDate.getDay(); // 0=domenica, 1=lunedì...
        
        timeSelect.innerHTML = '<option value="">-- Seleziona orario --</option>';
        
        // Verifica se è un giorno valido (martedì=2 a sabato=6)
        if (dayOfWeek >= 2 && dayOfWeek <= 6) {
            generateTimeSlots();
            timeSelect.disabled = false;
        } else {
            timeSelect.innerHTML = '<option value="">-- Chiuso in questa data --</option>';
            timeSelect.disabled = true;
        }
    }

    function generateTimeSlots() {
        // Mattina: 9-12
        for (let hour = 9; hour < 12; hour++) {
            const time = `${hour.toString().padStart(2, '0')}:00`;
            timeSelect.appendChild(new Option(time, time));
        }
        
        // Pomeriggio: 15-20
        for (let hour = 15; hour < 20; hour++) {
            const time = `${hour.toString().padStart(2, '0')}:00`;
            timeSelect.appendChild(new Option(time, time));
        }
    }

    async function handleFormSubmit() {
        const submitBtn = bookingForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        
        try {
            // Mostra stato di caricamento
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Prenotazione in corso...';
            submitBtn.disabled = true;
            
            // Validazione lato client
            if (!validateForm()) {
                return;
            }
            
            // Prepara i dati
            const formData = {
                name: document.getElementById('name').value.trim(),
                surname: document.getElementById('surname').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                barber: barberSelect.value,
                date: dateInput.value,
                time: timeSelect.value,
                service: document.getElementById('service').value
            };
            
            // Invia i dati al server
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Errore durante la prenotazione');
            }
            
            // Mostra conferma
            bookingForm.classList.add('hidden');
            confirmation.classList.remove('hidden');
            
            // Scrolla alla conferma
            confirmation.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Errore:', error);
            showError(error.message || 'Si è verificato un errore durante la prenotazione');
        } finally {
            // Ripristina il pulsante
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    }

    function validateForm() {
        // Rimuovi errori precedenti
        clearErrors();
        
        let isValid = true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]{9,15}$/;
        
        // Validazione nome
        if (!document.getElementById('name').value.trim()) {
            showErrorForField('name', 'Il nome è obbligatorio');
            isValid = false;
        }
        
        // Validazione cognome
        if (!document.getElementById('surname').value.trim()) {
            showErrorForField('surname', 'Il cognome è obbligatorio');
            isValid = false;
        }
        
        // Validazione email
        const email = document.getElementById('email').value.trim();
        if (!email) {
            showErrorForField('email', 'L\'email è obbligatoria');
            isValid = false;
        } else if (!emailRegex.test(email)) {
            showErrorForField('email', 'Inserisci un\'email valida');
            isValid = false;
        }
        
        // Validazione telefono
        const phone = document.getElementById('phone').value.trim();
        if (!phone) {
            showErrorForField('phone', 'Il telefono è obbligatorio');
            isValid = false;
        } else if (!phoneRegex.test(phone)) {
            showErrorForField('phone', 'Inserisci un numero di telefono valido');
            isValid = false;
        }
        
        // Validazione barbiere
        if (!barberSelect.value) {
            showErrorForField('barber', 'Seleziona un barbiere');
            isValid = false;
        }
        
        // Validazione data
        if (!dateInput.value) {
            showErrorForField('date', 'Seleziona una data');
            isValid = false;
        }
        
        // Validazione orario
        if (!timeSelect.value || timeSelect.disabled) {
            showErrorForField('time', 'Seleziona un orario valido');
            isValid = false;
        }
        
        // Validazione servizio
        if (!document.getElementById('service').value) {
            showErrorForField('service', 'Seleziona un servizio');
            isValid = false;
        }
          // Validazione termini
        if (!document.getElementById('acceptTerms').checked) {
            document.getElementById('termsError').textContent = 'Devi accettare i termini e la privacy';
            isValid = false;
        } else {
            document.getElementById('termsError').textContent = '';
        }
        
        
        return isValid;
    }

    function showErrorForField(fieldId, message) {
        const field = document.getElementById(fieldId);
        const formGroup = field.closest('.form-group');
        
        // Crea elemento errore
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        
        // Aggiungi classe errore al campo
        field.classList.add('error');
        
        // Inserisci il messaggio di errore
        formGroup.appendChild(errorEl);
        
        // Scrolla al primo errore
        if (!document.querySelector('.error-message:first-of-type')) {
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function clearErrors() {
        // Rimuovi tutti i messaggi di errore
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        
        // Rimuovi classi di errore
        document.querySelectorAll('.error').forEach(el => {
            el.classList.remove('error');
        });
    }

    function showError(message) {
        clearErrors();
        
        const errorEl = document.createElement('div');
        errorEl.className = 'booking-error';
        errorEl.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        bookingForm.prepend(errorEl);
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function formatDate(date) {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();
        
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        
        return [year, month, day].join('-');
    }
});