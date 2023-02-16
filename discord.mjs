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
            await bot.createMessage(msg.channel.id, 'Commandes disponibles: !hello, !scan');
        }

        if (msg.content.startsWith('!scan')) {
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
    }

    // Si le message est "!random", envoyer un film en stock au hasard
    if (msg.content === '!random') {
        const prisma = new PrismaClient();
        const films = await prisma.film.findMany({
            where: {
                isInStock: true
            }
        });
        await prisma.$disconnect();

        const film = films[Math.floor(Math.random() * films.length)];
        await bot.createMessage(msg.channel.id, `Film en stock au hasard: ${film.name} - ${film.url}`);
    }

});

bot.connect();