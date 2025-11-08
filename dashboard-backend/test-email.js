require('dotenv').config();
const { testEmailConfiguration, sendPasswordResetEmail } = require('./config/email');

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║     TEST CONFIGURAZIONE EMAIL - CoreTeam Dashboard    ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

(async () => {
    try {
        // Test 1: Verifica configurazione
        console.log('📋 Test 1: Verifica Configurazione SMTP');
        console.log('─────────────────────────────────────────────────────');
        console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'non configurato');
        console.log('EMAIL_USER:', process.env.EMAIL_USER || 'non configurato');
        console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'non configurato');
        console.log();

        const isConfigured = await testEmailConfiguration();
        
        if (!isConfigured) {
            console.log('\n❌ ERRORE: Configurazione email non valida!');
            console.log('\n📖 Leggi EMAIL-SETUP-GUIDE.md per la configurazione.');
            process.exit(1);
        }
        
        console.log('✅ Configurazione valida!\n');

        // Test 2: Invio email di prova
        console.log('📧 Test 2: Invio Email di Prova');
        console.log('─────────────────────────────────────────────────────');
        
        const testEmail = process.argv[2] || process.env.EMAIL_USER || 'test@example.com';
        const testToken = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
        const testUsername = 'TestUser';
        
        console.log('Destinatario:', testEmail);
        console.log('Token di test:', testToken.substring(0, 20) + '...');
        console.log('\nInvio in corso...');
        
        const result = await sendPasswordResetEmail(testEmail, testToken, testUsername);
        
        console.log('\n✅ Email inviata con successo!');
        console.log('Message ID:', result.messageId);
        
        if (result.previewUrl) {
            console.log('\n📬 PREVIEW EMAIL (Ethereal):');
            console.log(result.previewUrl);
            console.log('\n💡 Apri questo link nel browser per vedere l\'email');
        }
        
        if (process.env.EMAIL_SERVICE === 'gmail') {
            console.log('\n💡 Controlla la inbox di:', testEmail);
        }
        
        console.log('\n╔═══════════════════════════════════════════════════════╗');
        console.log('║                  ✅ TUTTI I TEST SUPERATI             ║');
        console.log('╚═══════════════════════════════════════════════════════╝');
        
    } catch (error) {
        console.log('\n❌ ERRORE durante il test:', error.message);
        console.log('\n📖 Controlla:');
        console.log('   1. Le variabili nel file .env');
        console.log('   2. La guida EMAIL-SETUP-GUIDE.md');
        console.log('   3. La connessione internet');
        
        if (error.code === 'EAUTH') {
            console.log('\n⚠️ Errore di autenticazione:');
            if (process.env.EMAIL_SERVICE === 'gmail') {
                console.log('   - Usa una "Password per l\'app", non la password Gmail normale');
                console.log('   - Guida: https://support.google.com/accounts/answer/185833');
            } else {
                console.log('   - Verifica username e password SMTP corretti');
            }
        }
        
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
            console.log('\n⚠️ Errore di connessione:');
            console.log('   - Verifica la tua connessione internet');
            console.log('   - Controlla firewall/antivirus');
            console.log('   - Prova a cambiare SMTP_PORT (587 o 465)');
        }
        
        console.log('\n❌ Test fallito!');
        process.exit(1);
    }
})();
