  const firebaseConfig = {
apiKey: "AIzaSyAC1VwxUwfk_Kbff8f0h-KtcQV3z3Izs_A",
  authDomain: "hairstyle2000-db0e8.firebaseapp.com",
  databaseURL: "https://hairstyle2000-db0e8-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "hairstyle2000-db0e8",
  storageBucket: "hairstyle2000-db0e8.firebasestorage.app",
  messagingSenderId: "312036850582",
  appId: "1:312036850582:web:116111861902d35d7f3bb7",
  measurementId: "G-2QV7ZYJ4XL"
  };

  // Inizializza Firebase
  const app = firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', function() {
    // Variabili globali
    let allBookings = [];
    let filteredBookings = [];
    let currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1); // Inizia da lunedì
    
    // Elementi DOM
    const bookingsList = document.getElementById('bookingsList');
    const todayBookingsEl = document.getElementById('todayBookings');
    const totalBookingsEl = document.getElementById('totalBookings');
    const ninoBookingsEl = document.getElementById('ninoBookings');
    const antonioBookingsEl = document.getElementById('antonioBookings');
    const filterBarber = document.getElementById('filterBarber');
    const refreshBtn = document.getElementById('refreshBtn');
    const calendarView = document.getElementById('calendarView');
    const listView = document.getElementById('listView');
    const listViewBtn = document.getElementById('listViewBtn');
    const calendarViewBtn = document.getElementById('calendarViewBtn');
    const prevWeekBtn = document.getElementById('prevWeek');
    const nextWeekBtn = document.getElementById('nextWeek');
    const todayBtn = document.getElementById('todayBtn');
    const currentWeekRange = document.getElementById('currentWeekRange');
    const weekDaysHeader = document.querySelector('.week-days-header');
    const weekGrid = document.querySelector('.week-grid');
    const overlay = document.getElementById('overlay');
    const bookingDetails = document.getElementById('bookingDetails');
    const addManualBookingBtn = document.getElementById('addManualBookingBtn');
    const addBookingModal = document.getElementById('addBookingModal');
    const closeAddModal = document.getElementById('closeAddModal');
    const cancelAddBooking = document.getElementById('cancelAddBooking');
    const addBookingForm = document.getElementById('addBookingForm');
    const addDateInput = document.getElementById('addDate');
    const addTimeSelect = document.getElementById('addTime');
    const addBarberSelect = document.getElementById('addBarber');

    // Funzione per generare gli orari disponibili in base al barbiere e alla data
    async function updateAvailableTimes() {
        const selectedDate = addDateInput?.value;
        const selectedBarber = addBarberSelect?.value;
        
        // Pulisci le opzioni esistenti
        if(addTimeSelect) {
            addTimeSelect.innerHTML = '<option value="">Seleziona ora</option>';
        }
        
        if (!selectedDate || !selectedBarber) {
            if(addTimeSelect) addTimeSelect.disabled = true;
            return;
        }

        const dayOfWeek = new Date(selectedDate).getDay(); // 0 = Domenica, 1 = Lunedì, ..., 6 = Sabato

        // I giorni lavorativi sono da martedì (2) a sabato (6)
        if (dayOfWeek < 2 || dayOfWeek > 6) {
            const option = document.createElement('option');
            option.textContent = 'Non disponibile in questa data';
            option.disabled = true;
            if(addTimeSelect) addTimeSelect.appendChild(option);
            if(addTimeSelect) addTimeSelect.disabled = true;
            return;
        }

        // Recupera gli orari già prenotati da Firestore per il barbiere e la data selezionati
        try {
            const snapshot = await db.collection("bookings")
                .where("barber", "==", selectedBarber)
                .where("date", "==", selectedDate)
                .get();
            
            const bookedTimes = snapshot.docs.map(doc => doc.data().time);

            // Fasce orarie
            const workingHours = [
                { start: 9 * 60, end: 12.5 * 60 }, // 9:00 - 12:30
                { start: 15 * 60, end: 19.5 * 60 } // 15:00 - 19:30
            ];

            let hasAvailableSlots = false;

            workingHours.forEach(period => {
                for (let time = period.start; time <= period.end; time += 30) {
                    const hours = Math.floor(time / 60);
                    const minutes = time % 60;
                    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                    
                    // Salta gli orari non disponibili (es. per Nino)
                    if (selectedBarber === 'Nino' && (timeString === '15:00' || timeString === '15:30')) {
                        continue; // Passa all'orario successivo senza aggiungere l'opzione
                    }
                    
                    const option = document.createElement('option');
                    option.value = timeString;
                    option.textContent = timeString;
                    
                    // Se l'orario è già prenotato, disabilita l'opzione
                    if (bookedTimes.includes(timeString)) {
                        option.disabled = true;
                        option.textContent += " (occupato)";
                    } else {
                        hasAvailableSlots = true;
                    }
                    
                    if(addTimeSelect) addTimeSelect.appendChild(option);
                }
            });

            if (!hasAvailableSlots) {
                const option = document.createElement('option');
                option.textContent = 'Nessun orario disponibile';
                option.disabled = true;
                if(addTimeSelect) addTimeSelect.appendChild(option);
                if(addTimeSelect) addTimeSelect.disabled = true;
            } else {
                if(addTimeSelect) addTimeSelect.disabled = false;
            }
        } catch (error) {
            console.error('Errore nel recupero degli orari disponibili:', error);
            showError('Impossibile caricare gli orari. Controlla la connessione.');
        }
    }

    // Listener per il pulsante "Aggiungi Prenotazione Manuale"
    if (addManualBookingBtn) {
        addManualBookingBtn.addEventListener('click', function() {
            // Imposta la data di oggi come valore predefinito
            const today = new Date();
            const todayISO = today.toISOString().split('T')[0];
            if (addDateInput) addDateInput.value = todayISO;

            // Aggiorna gli orari in base alla data e al barbiere predefiniti
            updateAvailableTimes();
            
            // Mostra il modale
            if (addBookingModal) addBookingModal.style.display = 'flex';
        });
    }

    // Aggiorna gli orari quando la data o il barbiere cambiano
    if (addDateInput) addDateInput.addEventListener('change', updateAvailableTimes);
    if (addBarberSelect) addBarberSelect.addEventListener('change', updateAvailableTimes);

    // Listener per chiudere il modale
    if (closeAddModal) {
        closeAddModal.addEventListener('click', function() {
            if (addBookingModal) addBookingModal.style.display = 'none';
            if (addBookingForm) addBookingForm.reset();
        });
    }

    // Listener per il pulsante "Annulla" nel modale
    if (cancelAddBooking) {
        cancelAddBooking.addEventListener('click', function() {
            if (addBookingModal) addBookingModal.style.display = 'none';
            if (addBookingForm) addBookingForm.reset();
        });
    }
    
    // Funzione per caricare le prenotazioni dal server
    async function loadBookings() {
        try {
            const snapshot = await firebase.firestore().collection("bookings").get();
            allBookings = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            updateStatistics();
            applyFilters();
            
            // Se la vista calendario è attiva, aggiorna il calendario
            if (calendarView && calendarView.style.display === 'block') {
                renderCalendar();
            }
        } catch (error) {
            console.error('Errore durante il caricamento delle prenotazioni:', error);
            showError('Impossibile caricare le prenotazioni. Controlla la console per i dettagli.');
        }
    }
    
    // Funzione per aggiornare le statistiche
    function updateStatistics() {
        const today = new Date().toISOString().split('T')[0];
        
        // Filtra le prenotazioni di oggi
        const todayBookings = allBookings.filter(booking => booking.date === today);
        
        // Filtra per barbiere
        const ninoBookings = allBookings.filter(booking => booking.barber === 'Nino');
        const antonioBookings = allBookings.filter(booking => booking.barber === 'Antonio');
        
        // Aggiorna l'UI
        if(todayBookingsEl) todayBookingsEl.textContent = todayBookings.length;
        if(totalBookingsEl) totalBookingsEl.textContent = allBookings.length;
        if(ninoBookingsEl) ninoBookingsEl.textContent = ninoBookings.length;
        if(antonioBookingsEl) antonioBookingsEl.textContent = antonioBookings.length;
    }

    // Funzione per applicare i filtri
    function applyFilters() {
        filteredBookings = [...allBookings];
        
        // Filtro barbiere - verifica che l'elemento esista
        if (filterBarber && filterBarber.value !== 'all') {
            filteredBookings = filteredBookings.filter(booking => booking.barber === filterBarber.value);
        }
        
        renderBookings();
        
        // Se la vista calendario è attiva, aggiorna il calendario
        if (calendarView && calendarView.style.display === 'block') {
            renderCalendar();
        }
    }

    // Funzione per visualizzare le prenotazioni in lista
    function renderBookings() {
        if (!bookingsList) return;

        if (filteredBookings.length === 0) {
            bookingsList.innerHTML = `
                <div class="no-bookings">
                    <i class="fas fa-calendar-times"></i>
                    <p>Nessuna prenotazione trovata</p>
                </div>
            `;
            return;
        }
        
        bookingsList.innerHTML = '';
        
        // Ordina per data (più recenti prima)
        filteredBookings.sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));
        
        // Crea le card delle prenotazioni
        filteredBookings.forEach(booking => {
            const bookingCard = document.createElement('div');
            bookingCard.className = 'admin-booking-card';
            
            // Formatta la data
            const formattedDate = formatItalianDate(booking.date);
            
            bookingCard.innerHTML = `
                <div class="booking-info">
                    <h3>${booking.surname} ${booking.name}</h3>
                    <div class="booking-meta">
                        <span><i class="fas fa-calendar-alt"></i> ${formattedDate}</span>
                        <span><i class="fas fa-clock"></i> ${booking.time}</span>
                        <span><i class="fas fa-user"></i> ${booking.barber}</span>
                        <span><i class="fas fa-cut"></i> ${booking.service}</span>
                    </div>
                    <div class="booking-contact">
                        <p><i class="fas fa-phone"></i> ${booking.phone}</p>
                    </div>
                </div>
                <div class="booking-actions">
                    <button class="btn btn-delete" data-id="${booking.id}">
                        <i class="fas fa-trash"></i> Elimina
                    </button>
                </div>
            `;
            
            bookingsList.appendChild(bookingCard);
        });
        
        // Aggiungi event listeners ai pulsanti
        addActionButtonsListeners();
    }

    // Funzione per visualizzare il calendario settimanale
    function renderCalendar() {
        if (!weekDaysHeader || !weekGrid) return;
        
        // Aggiorna il range della settimana visualizzata
        updateWeekRangeDisplay();
        
        // Pulisci gli header dei giorni
        weekDaysHeader.innerHTML = '<div class="time-column-header">Orario</div>';
        weekGrid.innerHTML = '';
        
        // Crea gli header dei giorni
        const daysOfWeek = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
        const weekDates = [];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(currentWeekStart.getDate() + i);
            weekDates.push(date.toISOString().split('T')[0]);
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.innerHTML = `
                <div>${daysOfWeek[i]}</div>
                <div>${date.getDate()}/${date.getMonth() + 1}</div>
            `;
            weekDaysHeader.appendChild(dayHeader);
        }
        
        // Crea le fasce orarie (dalle 8:00 alle 20:00)
        for (let hour = 8; hour < 20; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                
                const timeLabel = document.createElement('div');
                timeLabel.className = 'time-label';
                timeLabel.textContent = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                
                timeSlot.appendChild(timeLabel);
                weekGrid.appendChild(timeSlot);
                
                // Aggiungi le celle per ogni giorno
                for (let i = 0; i < 7; i++) {
                    const dayCell = document.createElement('div');
                    dayCell.className = 'time-slot';
                    dayCell.setAttribute('data-date', weekDates[i]);
                    dayCell.setAttribute('data-time', `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
                    weekGrid.appendChild(dayCell);
                }
            }
        }
        
        // Aggiungi le prenotazioni al calendario
        renderBookingsToCalendar(weekDates);
    }

    // Funzione per aggiornare la visualizzazione del range della settimana
    function updateWeekRangeDisplay() {
        if (!currentWeekRange) return;

        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 6);
        
        const options = { day: 'numeric', month: 'long' };
        const startFormatted = currentWeekStart.toLocaleDateString('it-IT', options);
        const endFormatted = weekEnd.toLocaleDateString('it-IT', options);
        
        currentWeekRange.textContent = `${startFormatted} - ${endFormatted}`;
    }

    // Funzione per visualizzare le prenotazioni nel calendario
    function renderBookingsToCalendar(weekDates) {
        // Filtra le prenotazioni per la settimana corrente
        const weekBookings = filteredBookings.filter(booking => 
            weekDates.includes(booking.date)
        );
        
        // Aggiungi ogni prenotazione al calendario
        weekBookings.forEach(booking => {
            const bookingElement = createBookingElement(booking);
            const timeSlot = findTimeSlot(booking.date, booking.time);
            if (timeSlot) {
                timeSlot.appendChild(bookingElement);
            }
        });
    }

    // Funzione per creare un elemento prenotazione per il calendario
    function createBookingElement(booking) {
        const element = document.createElement('div');
        element.className = `booking-slot booking-${booking.barber.toLowerCase()}`;
        element.innerHTML = `
            <strong>${booking.surname || ''} ${booking.name || ''}</strong>
            <div>${booking.time} - ${booking.barber}</div>
            <div>${booking.service}</div>
        `;
        // Aggiungi evento click per visualizzare i dettagli
        element.addEventListener('click', () => showBookingDetails(booking));
        return element;
    }

    // Funzione per trovare lo slot temporale corretto per una prenotazione
    function findTimeSlot(date, time) {
        const slots = document.querySelectorAll('.time-slot[data-date]');
        for (const slot of slots) {
            if (slot.getAttribute('data-date') === date && slot.getAttribute('data-time') === time) {
                return slot;
            }
        }
        return null;
    }

    // Funzione per visualizzare i dettagli di una prenotazione
    function showBookingDetails(booking) {
        if (!bookingDetails || !overlay) return;

        const formattedDate = formatItalianDate(booking.date);
        bookingDetails.innerHTML = `
            <h2>Dettagli Prenotazione</h2>
            <div class="detail-row">
                <strong>Cliente:</strong> ${booking.surname || ''} ${booking.name || ''}
            </div>
            <div class="detail-row">
                <strong>Data:</strong> ${formattedDate}
            </div>
            <div class="detail-row">
                <strong>Ora:</strong> ${booking.time}
            </div>
            <div class="detail-row">
                <strong>Barbiere:</strong> ${booking.barber}
            </div>
            <div class="detail-row">
                <strong>Servizio:</strong> ${booking.service}
            </div>
            <div class="detail-row">
                <strong>Telefono:</strong> ${booking.phone}
            </div>
            <div class="detail-row">

            </div>
            <div class="detail-actions">
                <button class="btn btn-delete" data-id="${booking.id}">
                    <i class="fas fa-trash"></i> Elimina
                </button>
                <button class="btn" id="closeDetails">
                    <i class="fas fa-times"></i> Chiudi
                </button>
            </div>
        `;
        // Aggiungi event listener per il pulsante elimina
        const deleteBtn = bookingDetails.querySelector('.btn-delete');
        if(deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                deleteBooking(booking.id);
                closeBookingDetails();
            });
        }
        // Aggiungi event listener per il pulsante chiudi
        const closeBtn = bookingDetails.querySelector('#closeDetails');
        if(closeBtn) {
            closeBtn.addEventListener('click', closeBookingDetails);
        }
        // Mostra i dettagli e l'overlay
        bookingDetails.style.display = 'block';
        overlay.style.display = 'block';
    }

    // Funzione per chiudere i dettagli della prenotazione
    function closeBookingDetails() {
        if(bookingDetails) bookingDetails.style.display = 'none';
        if(overlay) overlay.style.display = 'none';
    }

    // Funzione per formattare la data in italiano
    function formatItalianDate(dateString) {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('it-IT', options);
    }
    
    // Funzione per gestire i pulsanti azione
    function addActionButtonsListeners() {
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookingId = this.getAttribute('data-id');
                deleteBooking(bookingId);
            });
        });
    }

    // Funzione per eliminare una prenotazione
    async function deleteBooking(bookingId) {
        if (!confirm('Sei sicuro di voler eliminare questa prenotazione?')) {
            return;
        }
        try {
            await firebase.firestore().collection("bookings").doc(bookingId).delete();
            showMessage('Prenotazione eliminata con successo.', 'success');
            loadBookings(); // Ricarica i dati dopo l'eliminazione
        } catch (error) {
            console.error('Errore durante l\'eliminazione della prenotazione:', error);
            showError('Impossibile eliminare la prenotazione. Controlla la console per i dettagli.');
        }
    }

    // Funzione per mostrare messaggi (successo o errore)
    function showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `booking-message ${type}`;
        messageDiv.textContent = message;
        
        // Aggiungi il messaggio al corpo del documento
        document.body.appendChild(messageDiv);
        
        // Rimuovi il messaggio dopo 5 secondi
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }
    
    // Funzione per mostrare errori
    function showError(message) {
        showMessage(message, 'error');
    }

    // Inizializza le funzioni
    loadBookings();
    setupViewToggle();
    
    // Listener per l'invio del form di aggiunta
    if (addBookingForm) {
        addBookingForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const newBooking = {
                name: document.getElementById('addName')?.value || '',
                surname: document.getElementById('addSurname')?.value || '',
                phone: document.getElementById('addPhone')?.value || '',
                date: document.getElementById('addDate')?.value || '',
                time: document.getElementById('addTime')?.value || '',
                barber: document.getElementById('addBarber')?.value || '',
                service: document.getElementById('addService')?.value || '',
                notes: document.getElementById('addNotes')?.value || '',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Prima di salvare, controlla se l'orario è ancora disponibile
            try {
                const snapshot = await db.collection("bookings")
                    .where("barber", "==", newBooking.barber)
                    .where("date", "==", newBooking.date)
                    .where("time", "==", newBooking.time)
                    .get();

                if (!snapshot.empty) {
                    showError('Attenzione: l\'orario selezionato non è più disponibile. Aggiorna la pagina e riprova.');
                    return;
                }

                await firebase.firestore().collection('bookings').add(newBooking);
                showMessage('Prenotazione aggiunta con successo!', 'success');
                if(addBookingModal) addBookingModal.style.display = 'none';
                addBookingForm.reset();
                loadBookings();
            } catch (error) {
                console.error('Errore durante l\'aggiunta della prenotazione:', error);
                showError('Impossibile aggiungere la prenotazione. Controlla la console per i dettagli.');
            }
        });
    }

    // Funzione per impostare il toggle della vista
    function setupViewToggle() {
        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => {
                if(listView) listView.style.display = 'block';
                if(calendarView) calendarView.style.display = 'none';
                listViewBtn.classList.add('active');
                if(calendarViewBtn) calendarViewBtn.classList.remove('active');
            });
        }
        
        if (calendarViewBtn) {
            calendarViewBtn.addEventListener('click', () => {
                if(listView) listView.style.display = 'none';
                if(calendarView) calendarView.style.display = 'block';
                if(listViewBtn) listViewBtn.classList.remove('active');
                calendarViewBtn.classList.add('active');
                renderCalendar();
            });
        }
    }

    // Funzione per cambiare la settimana visualizzata
    function changeWeek(days) {
        currentWeekStart.setDate(currentWeekStart.getDate() + days);
        renderCalendar();
    }

    // Funzione per tornare alla settimana corrente
    function goToToday() {
        currentWeekStart = new Date();
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1);
        renderCalendar();
    }
    
    // Event listeners
    if (refreshBtn) refreshBtn.addEventListener('click', loadBookings);
    if (filterBarber) filterBarber.addEventListener('change', applyFilters);
    if (prevWeekBtn) prevWeekBtn.addEventListener('click', () => changeWeek(-7));
    if (nextWeekBtn) nextWeekBtn.addEventListener('click', () => changeWeek(7));
    if (todayBtn) todayBtn.addEventListener('click', goToToday);
    
    // Chiudi il modale cliccando fuori da esso
    window.addEventListener('click', function(event) {
        if (addBookingModal && event.target === addBookingModal) {
            addBookingModal.style.display = 'none';
            if (addBookingForm) addBookingForm.reset();
        }
    });
});
