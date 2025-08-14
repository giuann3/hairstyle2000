document.addEventListener('DOMContentLoaded', function() {
    // Variabili globali
    let allBookings = [];
    let filteredBookings = [];
    const bookingsPerPage = 10;
    let currentPage = 1;

    // Elementi DOM
    const bookingsList = document.getElementById('bookingsList');
    const todayBookingsEl = document.getElementById('todayBookings');
    const totalBookingsEl = document.getElementById('totalBookings');
    const ninoBookingsEl = document.getElementById('ninoBookings');
    const antonioBookingsEl = document.getElementById('antonioBookings');
    const filterDate = document.getElementById('filterDate');
    const filterBarber = document.getElementById('filterBarber');
    const filterService = document.getElementById('filterService');
    const refreshBtn = document.getElementById('refreshBtn');

    // Carica le prenotazioni all'avvio
    loadBookings();

    // Event listeners
    refreshBtn.addEventListener('click', loadBookings);
    filterDate.addEventListener('change', applyFilters);
    filterBarber.addEventListener('change', applyFilters);
    filterService.addEventListener('change', applyFilters);

    // Funzione per caricare le prenotazioni dal server
async function loadBookings() {
    console.log("Firebase:", typeof firebase, firebase);
    try {
        // Leggi tutte le prenotazioni da Firestore
        const snapshot = await firebase.firestore().collection("bookings").get();
        allBookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        updateStatistics();
        applyFilters();
    } catch (error) {
        console.error('Errore:', error);
        showError('Impossibile caricare le prenotazioni');
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
        todayBookingsEl.textContent = todayBookings.length;
        totalBookingsEl.textContent = allBookings.length;
        ninoBookingsEl.textContent = ninoBookings.length;
        antonioBookingsEl.textContent = antonioBookings.length;
    }

    // Funzione per applicare i filtri
    function applyFilters() {
        filteredBookings = [...allBookings];
        
        // Filtro data
        if (filterDate.value) {
            filteredBookings = filteredBookings.filter(booking => booking.date === filterDate.value);
        }
        
        // Filtro barbiere
        if (filterBarber.value) {
            filteredBookings = filteredBookings.filter(booking => booking.barber === filterBarber.value);
        }
        
 
        renderBookings();
    }

    // Funzione per visualizzare le prenotazioni
    function renderBookings() {
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
        filteredBookings.sort((a, b) => new Date(b.date) - new Date(a.date));
        
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
                        <p><i class="fas fa-envelope"></i> ${booking.email}</p>
                    </div>
                </div>
                <div class="booking-actions">
                    <button class="btn btn-edit" data-id="${booking.id}">
                        <i class="fas fa-edit"></i> Modifica
                    </button>
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

    // Funzione per formattare la data in italiano
    function formatItalianDate(dateString) {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('it-IT', options);
    }

    // Funzione per gestire i pulsanti azione
    function addActionButtonsListeners() {
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookingId = this.getAttribute('data-id');
                editBooking(bookingId);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookingId = this.getAttribute('data-id');
                deleteBooking(bookingId);
            });
        });
    }

    // Funzione per modificare una prenotazione
    async function editBooking(bookingId) {
        const booking = allBookings.find(b => b.id == bookingId);
        if (!booking) return;
        
        // Qui potresti aprire un modal o reindirizzare a una pagina di modifica
        console.log('Modifica prenotazione:', booking);
        alert(`Modalità modifica per la prenotazione ${bookingId}. Implementa questa funzione.`);
    }

    // Funzione per eliminare una prenotazione
    async function deleteBooking(bookingId) {
    if (!confirm('Sei sicuro di voler eliminare questa prenotazione?')) return;
    try {
        await firebase.firestore().collection("bookings").doc(bookingId).delete();
        loadBookings();
    } catch (error) {
        console.error('Errore:', error);
        showError('Impossibile eliminare la prenotazione');
    }
}

    // Funzione per mostrare errori
    function showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(errorEl);
        setTimeout(() => errorEl.remove(), 5000);
    }

    // Inizializza la navigation (da navigation.js)
    setupMobileMenu();
    setupNavbarScroll();
});