import got from "got";
import * as cheerio from "cheerio";

export class KameraStore {
    website = 'https://kamerastore.com/';
    websiteclear = 'https://kamerastore.com';

    path = 'fr-fr/collections/';

    paramsFilmFormat = {
        "135": "35mm-film",
        "120": "120-film",
        "instant": "instant-film",
        "large": "sheet-film"
    }

    async scrapFilms() {
        console.log('Scraping ' + this.website + '...');

        return new Promise(async function (resolve, reject) {
            const films = [];
            const kameraStore = new KameraStore();

            for (const valueFormat of Object.entries(kameraStore.paramsFilmFormat)) {
                console.log("recuperation du format " + valueFormat[0]);
                const formatName = valueFormat[0];
                const formatValue = valueFormat[1];

                const url = kameraStore.website + kameraStore.path + formatValue;
                let page = 1;
                let isError = false;
                while (!isError) {
                    console.log("recuperation de la page " + page + "pour le format" + formatName);
                    const response = await got(url + '?page=' + page);


                    const $ = cheerio.load(response.body);
                    const products = $('#main-collection-product-grid .grid__item');
                    if (products.length === 0) {
                        isError = true;
                    } else {
                        products.each(async (i, product) => {
                            const $film = $(product);
                            const film = {
                                name: $film.find('.card-information__text').text().trim(),
                                url: kameraStore.websiteclear + $film.find('a').attr('href'),
                                format: formatName,
                                isInStock: $film.find('.badge--bottom-left').text().trim() !== 'Épuisé',
                                price: $film.find('.price__regular .price-item').text().trim().replace(/[^0-9,]/g, ''),
                            };

                            console.log(film);
                            films.push(film);
                        });
                    }
                    page++;
                }
            }
            console.log(films);
            resolve(films);
        });
    }
}