const readlineSync = require('readline-sync');

function askCredentials() {
    const user = readlineSync.question('Usuário: ');
    const password = readlineSync.question('Senha: ', {
        hideEchoBack: true
    });

    return { user, password };
}

if (require.main === module) {
    const credentials = askCredentials();
    console.log(credentials);
}

module.exports = askCredentials;