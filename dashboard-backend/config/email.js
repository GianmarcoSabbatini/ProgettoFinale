const nodemailer = require('nodemailer');
const logger = require('./logger');

// Configurazione transporter email
const createTransporter = () => {
    // Opzione 1: Gmail (per sviluppo/test)
    // Richiede: App Password di Gmail (non la password normale)
    // Guida: https://support.google.com/accounts/answer/185833
    
    if (process.env.EMAIL_SERVICE === 'gmail') {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD // App Password
            }
        });
    }
    
    // Opzione 2: SMTP generico (es: SendGrid, Mailgun, SES)
    if (process.env.EMAIL_SERVICE === 'smtp') {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true', // true per port 465, false per altri
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
    }
    
    // Opzione 3: Ethereal Email (solo per test/sviluppo)
    // Email "fake" che puoi visualizzare su https://ethereal.email
    if (process.env.EMAIL_SERVICE === 'ethereal' || !process.env.EMAIL_SERVICE) {
        logger.warn('⚠️ Usando Ethereal Email - solo per sviluppo!');
        // Nota: in produzione, non usare Ethereal
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
                pass: process.env.ETHEREAL_PASSWORD || 'ethereal-password'
            }
        });
    }
    
    throw new Error('Configurazione EMAIL_SERVICE non valida');
};

// Funzione per inviare email di reset password
const sendPasswordResetEmail = async (to, token, username) => {
    try {
        const transporter = createTransporter();
        
        // URL frontend per il reset
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
        
        // Template HTML email
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #6366f1;
            margin-bottom: 10px;
        }
        .content {
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            padding: 14px 30px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
        }
        .token-box {
            background: #f9fafb;
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            word-break: break-all;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #6366f1;
        }
        .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        .expiry {
            color: #ef4444;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔐 CoreTeam Digital</div>
            <h2 style="margin: 0; color: #1f2937;">Reset della Password</h2>
        </div>
        
        <div class="content">
            <p>Ciao <strong>${username}</strong>,</p>
            
            <p>Hai richiesto il reset della tua password per il tuo account CoreTeam Digital.</p>
            
            <p>Clicca sul pulsante qui sotto per reimpostare la password:</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">REIMPOSTA PASSWORD</a>
            </div>
            
            <p>Oppure copia e incolla questo link nel tuo browser:</p>
            <div class="token-box">${resetUrl}</div>
            
            <div class="warning">
                <strong>⚠️ Attenzione:</strong> Questo link è valido per <span class="expiry">1 ora</span> e può essere utilizzato una sola volta.
            </div>
            
            <p style="margin-top: 20px; font-size: 14px;">
                <strong>Non hai richiesto tu questo reset?</strong><br>
                Ignora questa email e la tua password rimarrà invariata.
            </p>
        </div>
        
        <div class="footer">
            <p>Questa è una email automatica, per favore non rispondere.</p>
            <p>&copy; 2025 CoreTeam Digital. Tutti i diritti riservati.</p>
        </div>
    </div>
</body>
</html>
        `.trim();
        
        // Template testo semplice (fallback)
        const textContent = `
Ciao ${username},

Hai richiesto il reset della tua password per il tuo account CoreTeam Digital.

Visita questo link per reimpostare la password:
${resetUrl}

ATTENZIONE: Questo link è valido per 1 ora e può essere utilizzato una sola volta.

Non hai richiesto tu questo reset? Ignora questa email e la tua password rimarrà invariata.

---
Questa è una email automatica, per favore non rispondere.
© 2025 CoreTeam Digital. Tutti i diritti riservati.
        `.trim();
        
        // Configurazione email
        const mailOptions = {
            from: `"CoreTeam Digital" <${process.env.EMAIL_FROM || 'noreply@coreteam.digital'}>`,
            to: to,
            subject: '🔐 Reset Password - CoreTeam Digital',
            text: textContent,
            html: htmlContent
        };
        
        // Invio email
        const info = await transporter.sendMail(mailOptions);
        
        logger.info('Email reset password inviata', {
            messageId: info.messageId,
            to: to,
            username: username,
            preview: nodemailer.getTestMessageUrl(info) // Solo per Ethereal
        });
        
        return {
            success: true,
            messageId: info.messageId,
            previewUrl: nodemailer.getTestMessageUrl(info) // null se non Ethereal
        };
        
    } catch (error) {
        logger.error('Errore invio email reset password', {
            error: error.message,
            stack: error.stack,
            to: to
        });
        
        throw error;
    }
};

// Funzione per inviare email di conferma cambio password
const sendPasswordChangedEmail = async (to, username) => {
    try {
        const transporter = createTransporter();
        
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 10px;
        }
        .success-icon {
            font-size: 48px;
            margin: 20px 0;
        }
        .warning-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">✅ CoreTeam Digital</div>
            <div class="success-icon">🎉</div>
            <h2 style="margin: 0; color: #1f2937;">Password Modificata</h2>
        </div>
        
        <div class="content">
            <p>Ciao <strong>${username}</strong>,</p>
            
            <p>Ti confermiamo che la password del tuo account CoreTeam Digital è stata modificata con successo.</p>
            
            <p><strong>Data e ora:</strong> ${new Date().toLocaleString('it-IT')}</p>
            
            <div class="warning-box">
                <strong>⚠️ Non sei stato tu?</strong><br>
                Se non hai effettuato tu questa modifica, contatta immediatamente il supporto tecnico all'indirizzo 
                <a href="mailto:support@coreteam.digital">support@coreteam.digital</a>
            </div>
            
            <p>Per maggiore sicurezza, ti consigliamo di:</p>
            <ul>
                <li>Utilizzare una password forte e unica</li>
                <li>Non condividere la tua password con nessuno</li>
                <li>Cambiare periodicamente la password</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>Questa è una email automatica, per favore non rispondere.</p>
            <p>&copy; 2025 CoreTeam Digital. Tutti i diritti riservati.</p>
        </div>
    </div>
</body>
</html>
        `.trim();
        
        const textContent = `
Ciao ${username},

Ti confermiamo che la password del tuo account CoreTeam Digital è stata modificata con successo.

Data e ora: ${new Date().toLocaleString('it-IT')}

Non sei stato tu? Se non hai effettuato tu questa modifica, contatta immediatamente il supporto tecnico.

---
© 2025 CoreTeam Digital. Tutti i diritti riservati.
        `.trim();
        
        const mailOptions = {
            from: `"CoreTeam Digital" <${process.env.EMAIL_FROM || 'noreply@coreteam.digital'}>`,
            to: to,
            subject: '✅ Password Modificata - CoreTeam Digital',
            text: textContent,
            html: htmlContent
        };
        
        const info = await transporter.sendMail(mailOptions);
        
        logger.info('Email conferma cambio password inviata', {
            messageId: info.messageId,
            to: to,
            username: username
        });
        
        return {
            success: true,
            messageId: info.messageId
        };
        
    } catch (error) {
        logger.error('Errore invio email conferma', {
            error: error.message,
            to: to
        });
        
        // Non bloccare il reset se email fallisce
        return {
            success: false,
            error: error.message
        };
    }
};

// Test configurazione email
const testEmailConfiguration = async () => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        logger.info('✅ Configurazione email verificata con successo');
        return true;
    } catch (error) {
        logger.error('❌ Errore configurazione email', {
            error: error.message
        });
        return false;
    }
};

module.exports = {
    sendPasswordResetEmail,
    sendPasswordChangedEmail,
    testEmailConfiguration
};
