import Eris from 'eris';
import {main} from "./main.mjs";
import {PrismaClient} from "@prisma/client";

let token;
token = process.env.DISCORD_TOKEN;
let chanelName;
chanelName = process.env.DISCORD_CHANNEL_NAME

const tweet = !process.argv[2];
console.log("tweet ?",tweet);

// Créer un client Discord
const bot = new Eris(token);

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.username}#${bot.user.discriminator}`);
});

bot.on('messageCreate', async (msg) => {
    // Si le message provient du bot lui-même, ignorer le message
    if (msg.author.bot) return;

    //check si le message provient du bon chanel
    if (msg.channel.name === chanelName) {
        // Si le message commence par le préfixe, envoyer une réponse
        if (msg.content.startsWith('!hello')) {
            await bot.createMessage(msg.channel.id, 'Hello World!');
        }

        if (msg.content.startsWith('!help')) {
            help(bot, msg);
        }

        if (msg.content.startsWith('!scan')) {
            scan(bot, msg);
        }

        if (msg.content.startsWith('!find')) {
            find(bot, msg);
        }

        if (msg.content.startsWith('!history')) {
            history(bot, msg);
        }

    }

    // Si le message est "!random", envoyer un film en stock au hasard
    if (msg.content.startsWith('!random')) {
        random(bot, msg);
    }
});

bot.connect();

async function help(bit, msg) {
    await bot.createMessage(msg.channel.id, 'Commandes disponibles: \n\t!hello,\n\t!scan,\n\t!random <spoiler ?>,\n\t!find <nom du film>,\n\t!history <id du film>');
}

async function scan(bot, msg) {
    await bot.createMessage(msg.channel.id, 'Scanning...');
    const messages = await main(tweet)
    if (messages.length === 0) {
        await bot.createMessage(msg.channel.id, "Rien à signaler");
    } else {
        messages.forEach(message => {
            bot.createMessage(msg.channel.id, message);
        });
    }
}

async function find(bot, msg) {
    const prisma = new PrismaClient();
    // récupérer tous les films en stock avec le nom du shop
    const films = await prisma.film.findMany({
        where: {
            isInStock: true
        },
        include: {
            shop: true
        }
    });
    await prisma.$disconnect();

    const filmName = msg.content.replace('!find ', '');
    // convert to lower case and remove accents
    const filmNameLower = filmName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const foundFilms = films.filter(film =>  (film.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()).includes(filmName));

    if (foundFilms.length === 0) {
        await bot.createMessage(msg.channel.id, `Aucun film ne correspond à la recherche: ${filmName}`);
    } else {
        // dire le nombre de films trouvés
        await bot.createMessage(msg.channel.id, `${foundFilms.length} film(s) trouvé(s) pour la recherche: ${filmName}`);

        //si trop de films trouvés, ne pas envoyer le message
        if (foundFilms.length > 25) {
            await bot.createMessage(msg.channel.id, `Trop de films trouvés, veuillez préciser votre recherche`);
        } else {
            let message = '';
            foundFilms.forEach(film => {
                bot.createMessage(
                    msg.channel.id,
                    `\n id : ${film.id} -> ${film.name} ${film.price}€ ${film.shop.name} - ${film.isInStock ? 'en stock' : 'indisponible'}\n`);
            });
        }
    }
}

async function random(bot, msg) {
    const prisma = new PrismaClient();
    const films = await prisma.film.findMany({
        where: {
            isInStock: true
        }
    });
    await prisma.$disconnect();

    const film = films[Math.floor(Math.random() * films.length)];


    console.log(msg.content.includes('spoiler'));
    await bot.createMessage(msg.channel.id,
        msg.content.includes('spoiler')
            ? `Film en stock au hasard: ||${film.name} - ${film.url}||`
            : `Film en stock au hasard: ${film.name} - ${film.url}`);
}

async function history(bot , msg) {
    // !history 10
    // !history <id du film>

    const filmId = parseInt(msg.content.replace('!history ', ''));
    if (isNaN(filmId)) {
        await bot.createMessage(msg.channel.id, `Veuillez entrer un id valide`);
    } else {
        const prisma = new PrismaClient();
        const films = await prisma.film.findFirst({
            where: {
                id: filmId
            }
        })
        await prisma.$disconnect();
        if (films === null) {
            await bot.createMessage(msg.channel.id, `Aucun film ne correspond à l'id: ${filmId}`);
        } else {
            const prisma = new PrismaClient();
            const history = await prisma.FilmHistoryRecord.findMany({
                where: {
                    filmId: filmId
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
            await prisma.$disconnect();
            if (history.length === 0) {
                await bot.createMessage(msg.channel.id, `Aucun historique pour le film: ${films.name}`);
            } else {
                await bot.createMessage(msg.channel.id, `Historique pour le film: ${films.name}`);
                bot.createMessage(msg.channel.id, `en stock: O|N \t prix: \t date: \n\n`);
                history.forEach(h => {
                    bot.createMessage(msg.channel.id, `${h.isInStock ? 'O' : 'N'}\t${h.price}\t\t${ h.createdAt.getDate()}/${h.createdAt.getMonth()}/${h.createdAt.getFullYear()}`);
                });
            }
        }
    }
}