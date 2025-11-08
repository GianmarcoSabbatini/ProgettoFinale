const nodemailer = require('nodemailer');

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║     GENERATORE ACCOUNT ETHEREAL EMAIL (Test)          ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

console.log('📧 Ethereal Email è un servizio per testare email senza inviarle davvero.\n');
console.log('⏳ Generazione account in corso...\n');

nodemailer.createTestAccount((err, account) => {
    if (err) {
        console.error('❌ Errore durante la creazione account:', err.message);
        console.error('\n💡 Verifica la tua connessione internet e riprova.');
        process.exit(1);
    }
    
    console.log('✅ Account Ethereal creato con successo!\n');
    console.log('─────────────────────────────────────────────────────');
    console.log('📋 CREDENZIALI ETHEREAL');
    console.log('─────────────────────────────────────────────────────');
    console.log('Username:', account.user);
    console.log('Password:', account.pass);
    console.log('SMTP Host:', account.smtp.host);
    console.log('SMTP Port:', account.smtp.port);
    console.log('Web Interface:', account.web);
    console.log('─────────────────────────────────────────────────────\n');
    
    console.log('📝 AGGIUNGI QUESTE RIGHE AL TUO FILE .env:\n');
    console.log('EMAIL_SERVICE=ethereal');
    console.log(`ETHEREAL_USER=${account.user}`);
    console.log(`ETHEREAL_PASSWORD=${account.pass}`);
    console.log();
    
    console.log('💡 COME USARE:');
    console.log('   1. Copia le righe sopra nel file dashboard-backend/.env');
    console.log('   2. Riavvia il server backend');
    console.log('   3. Richiedi un reset password dall\'app');
    console.log('   4. Controlla i log del backend per il link preview');
    console.log('   5. Apri il link per vedere l\'email\n');
    
    console.log('⚠️  NOTA: Questo è solo per TEST/SVILUPPO!');
    console.log('    Le email NON vengono inviate davvero agli utenti.');
    console.log('    In produzione, usa Gmail o un servizio SMTP professionale.\n');
});
