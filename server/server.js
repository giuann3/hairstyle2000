const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));


// API Routes

// Ottieni tutte le prenotazioni (per admin)
app.get('/api/bookings', (req, res) => {
    db.all('SELECT * FROM bookings ORDER BY date, time', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Crea una nuova prenotazione
app.post('/api/bookings', (req, res) => {
    const { name, surname, email, phone, barber, date, time, service } = req.body;

    // Validazione campi obbligatori
    if (!name || !surname || !email || !phone || !barber || !date || !time || !service) {
        return res.status(400).json({ 
            success: false, 
            error: 'Tutti i campi sono obbligatori' 
        });
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            success: false, 
            error: 'Email non valida' 
        });
    }

    // Validazione telefono (almeno 9 caratteri)
    if (phone.length < 9) {
        return res.status(400).json({ 
            success: false, 
            error: 'Numero di telefono non valido' 
        });
    }

    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate.getDay(); // 0=domenica, 1=lunedì, ecc.
    const hour = parseInt(time.split(':')[0]);

    // Verifica giorno valido (martedì=2 a sabato=6)
    if (dayOfWeek < 2 || dayOfWeek > 6) {
        return res.status(400).json({ 
            success: false, 
            error: 'Il negozio è chiuso di domenica e lunedì' 
        });
    }

    // Verifica orario valido (9-12 o 15-20)
    if ((hour < 9 || hour >= 12) && (hour < 15 || hour >= 20)) {
        return res.status(400).json({ 
            success: false, 
            error: 'Orario non valido. Gli orari disponibili sono: 9-12 e 15-20' 
        });
    }

    // Verifica se la data è nel passato
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
        return res.status(400).json({ 
            success: false, 
            error: 'Non è possibile prenotare nel passato' 
        });
    }

    // Verifica se l'orario è già prenotato per questo barbiere
    db.get(
        'SELECT * FROM bookings WHERE date = ? AND time = ? AND barber = ?',
        [date, time, barber],
        (err, row) => {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    error: err.message 
                });
            }
            
            if (row) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Questo orario è già prenotato per il barbiere selezionato' 
                });
            }

            // Se tutto ok, salva la prenotazione
            db.run(
                `INSERT INTO bookings 
                (name, surname, email, phone, barber, date, time, service) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, surname, email, phone, barber, date, time, service],
                function(err) {
                    if (err) {
                        return res.status(500).json({ 
                            success: false, 
                            error: err.message 
                        });
                    }
                    
                    // Invia email di conferma (simulato)
                    sendConfirmationEmail(email, {
                        name,
                        surname,
                        barber,
                        date,
                        time,
                        service
                    });

                    res.json({ 
                        success: true, 
                        id: this.lastID,
                        message: 'Prenotazione confermata con successo'
                    });
                }
            );
        }
    );
});

// Elimina una prenotazione (admin)
app.delete('/api/bookings/:id', (req, res) => {
    db.run(
        'DELETE FROM bookings WHERE id = ?',
        [req.params.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ 
                success: true, 
                changes: this.changes 
            });
        }
    );
});

// Route per l'admin dashboard
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin.html'));
});

// Funzione simulata per inviare email di conferma
function sendConfirmationEmail(email, bookingDetails) {
    console.log(`Email inviata a ${email} con i dettagli della prenotazione:`);
    console.log(bookingDetails);
    // In un'applicazione reale, qui integreresti un servizio email come SendGrid o Mailchimp
}

// Gestione errori 404
app.use((req, res, next) => {
    res.status(404).json({ error: 'Endpoint non trovato' });
});

// Gestione errori globali
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Errore interno del server' });
});

// Avvia il server
app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
    console.log(`Data di avvio: ${new Date().toLocaleString()}`);
});

// Chiudi il database quando il processo termina
process.on('SIGINT', () => {
    db.close();
    process.exit();
});