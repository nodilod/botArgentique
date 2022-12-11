import got from "got";
import * as cheerio from "cheerio";

export class Marinette {
    website = 'https://www.ateliers-marinette.fr/';

    path = 'fr/photographie/pellicules-argentiques/';

    params = {
        "colorNegative": "?q=Type+de+Pellicule-Couleur+%28Négatif%29",
        "colorSlide": "?q=Type+de+Pellicule-Couleur+%28Diapo%29",
        "blackAndWhite": "?q=Type+de+Pellicule-Noir+%26+Blanc"
    }

    async scrapFilms() {
        console.log('Scraping ' + this.website + '...');

        return new Promise(async function (resolve, reject) {
            const films = [];
            const marinette = new Marinette();

            for (const value of Object.entries(marinette.params)) {
                const typeName = value[0];
                const param = value[1];
                const url = marinette.website + marinette.path + param;
                let page = 1;
                let isError = false;

                while (!isError) {
                    console.log("recuperation de la page " + page + " pour le type " + typeName);

                    const response = await got(url + '&page=' + page);
                    if (response.statusCode !== 200) {
                        isError = true;
                        return;
                    }
                    const $ = cheerio.load(response.body);

                    const products = $('.item.ajax_block_product');

                    if (products.length === 0) {
                        isError = true;
                    } else {
                        products.each((i, product) => {
                            const $film = $(product);
                            const film = {}
                            film.name = $film.find('.product-title').text().trim();
                            film.url = $film.find('.product-title').attr('href');
                            film.price = $film.find('.price').text().trim().replace(/[^0-9,]/g, '');
                            film.isInStock = !!$film.find('#add_to_cart').prop('disabled');
                            film.type = typeName;
                            films.push(film);
                        });
                    }
                    page++;
                }
            }
            resolve(films);
        });
    }
}