import got from "got";
import * as cheerio from "cheerio";

export class Mori {
    website = 'https://fr.morifilmlab.com/';

    path = 'collections/';

    paramsFilmFormat = {
        "135": "35mm-film",
        "120": "medium-format-film",
    }

    async scrapFilms() {
        console.log('Scraping ' + this.website + '...');

        return new Promise(async function (resolve, reject) {
            const films = [];
            const mori = new Mori();

            for (const valueFormat of Object.entries(mori.paramsFilmFormat)) {
                const formatName = valueFormat[0];
                const formatValue = valueFormat[1];

                const url = mori.website + mori.path + formatValue;
                let page = 1;
                let isError = false;
                while (!isError) {
                    // console.log("recuperation de la page " + page + "pour le format" + formatName);
                    const response = await got(url + '?page=' + page);


                    const $ = cheerio.load(response.body);
                    const products = $('.four.thumbnail');
                    if (products.length === 0) {
                        isError = true;
                    } else {
                        products.each(async (i, product) => {
                            const $film = $(product);
                            const film = {
                                name: $film.find('.title').text().trim(),
                                url: mori.website + $film.find('a').attr('href'),
                                format: formatName,
                                isInStock: !$film.find('.price span').hasClass('sold_out')
                            };
                            film.price = (
                                    film.isInStock
                                    ? film.price = $film.find('.price .money').text()
                                    : cheerio.load((await got(film.url)).body)('.modal_price.modal_price--sold-out .current_price .money').text()
                                )
                                .trim()
                                .replace(/[^0-9,]/g, ''),
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