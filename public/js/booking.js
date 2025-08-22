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
    dateInput.addEventListener('change', updateAvailableTimes);
    barberSelect.addEventListener('change', updateAvailableTimes);

    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        await handleFormSubmit();
    });
}

async function updateAvailableTimes() {
    const selectedDate = dateInput.value;
    const selectedBarber = barberSelect.value;

    timeSelect.innerHTML = '<option value="">-- Seleziona orario --</option>';

    // Verifica se è un giorno valido (martedì=2 a sabato=6)
    const dayOfWeek = new Date(selectedDate).getDay();
    if (dayOfWeek < 2 || dayOfWeek > 6 || !selectedBarber) {
        timeSelect.innerHTML = '<option value="">-- Chiuso in questa data o barbiere non selezionato --</option>';
        timeSelect.disabled = true;
        return;
    }

    // --- DEBUG: stampa cosa stai cercando
    console.log("Cerco prenotazioni per:", selectedBarber, selectedDate);

    // Recupera orari già prenotati da Firestore
    const db = firebase.firestore();
    const snapshot = await db.collection("bookings")
        .where("barber", "==", selectedBarber)
        .where("date", "==", selectedDate)
        .get();

    // --- DEBUG: stampa quanti documenti trova e i dati
    console.log("Prenotazioni trovate:", snapshot.size);
    snapshot.docs.forEach(doc => {
        console.log("Prenotazione:", doc.data());
    });

    const bookedTimes = snapshot.docs.map(doc => doc.data().time);

    // Genera tutti gli slot orari
const times = [];
// Morning slots: 9:00 to 12:30
for (let hour = 9; hour < 13; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 12 && minute > 0) {
            continue; // Stop at 12:30
        }
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
    }
}

// Afternoon slots: 15:00 to 20:30
for (let hour = 15; hour < 21; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 20 && minute > 30) {
            continue; // Stop at 20:30
        }
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
    }
}

    // Aggiungi le opzioni, disabilitando quelle già prenotate
    times.forEach(time => {
        const option = document.createElement('option');
        option.value = time;
        option.textContent = time;
        if (bookedTimes.includes(time)) {
            option.disabled = true;
            option.textContent += " (occupato)";
        }
        timeSelect.appendChild(option);
    });

    timeSelect.disabled = false;
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
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                return;
            }

            // Prepara i dati
            const formData = {
                name: document.getElementById('name').value.trim(),
                surname: document.getElementById('surname').value.trim(),
                
                phone: document.getElementById('phone').value.trim(),
                barber: barberSelect.value,
                date: dateInput.value,
                time: timeSelect.value,
                service: document.getElementById('service').value,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // --- CONTROLLO DISPONIBILITÀ FIRESTORE ---
            console.log("DEBUG - Dati controllo:", formData.barber, formData.date, formData.time);
const db = firebase.firestore();
const snapshot = await db.collection("bookings")
    .where("barber", "==", formData.barber)
    .where("date", "==", formData.date)
    .where("time", "==", formData.time)
    .get();

if (!snapshot.empty) {
    showError('Orario già prenotato per questo barbiere. Scegli un altro orario.');
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
    return;
}
            // --- FINE CONTROLLO DISPONIBILITÀ ---

            // Salva la prenotazione
            await db.collection("bookings").add(formData);

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

        //

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

    function showError(message) {
        // Mostra errore generico sopra il form
        let errorBox = document.getElementById('formErrorBox');
        if (!errorBox) {
            errorBox = document.createElement('div');
            errorBox.id = 'formErrorBox';
            errorBox.className = 'form-error-box';
            bookingForm.prepend(errorBox);
        }
        errorBox.textContent = message;
        errorBox.style.display = 'block';
        errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function clearErrors() {
        // Rimuovi tutti i messaggi di errore
        document.querySelectorAll('.error-message').forEach(el => el.remove());

        // Rimuovi classi di errore
        document.querySelectorAll('.error').forEach(el => {
            el.classList.remove('error');
        });

        // Rimuovi box errore generico
        const errorBox = document.getElementById('formErrorBox');
        if (errorBox) {
            errorBox.style.display = 'none';
        }
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