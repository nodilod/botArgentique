import got from "got";
import * as cheerio from "cheerio";

export class Fotoimpex {
    website = 'https://www.fotoimpex.com/';
    websiteForFilmUrl = 'https://www.fotoimpex.com';

    path = '/shop/system/?func=listingmain&rub1=Films&cache=0';

    //rub1=
    formatsParameter = {
        "135": "Films&rub2=35mm%20films",
        "120": "Medium%20format%20films%20120",
        "large": "Sheet%20films",
        "127": "Medium%20format%20films%20127",
        "minox": "Minox%20films%208x11",
        "110": "Pocket%20films%20110",
    };

    async scrapFilms() {
        console.log('Scraping ' + this.website + '...');

        return new Promise(async function (resolve, reject) {
            const films = [];
            const fotoimpex = new Fotoimpex();

            for (const value of Object.entries(fotoimpex.formatsParameter)) {
                const format = value[0];
                const param = value[1];
                const url = fotoimpex.website + fotoimpex.path + param;

                let page = 0;
                let isError = false;

                while (!isError) {
                    console.log("recuperation de la page " + page/60 + " pour le format " + format);

                    const response = await got(url + '&pn=' + page);
                    if (response.statusCode !== 200) {
                        isError = true;
                        return;
                    }
                    page += 60;
                    const $ = cheerio.load(response.body);

                    const productscontainer = $('#os_list_prod');

                    if (productscontainer.children().length == 0) {
                        isError = true;
                    } else {
                        productscontainer.children().each((i, product) => {
                            const $film = $(product);
                            const film = {}
                            film.name = $film.find('.os_list_link1').text().trim();
                            film.url = fotoimpex.websiteForFilmUrl + $film.find('.os_list_link1').attr('href');
                            film.price = $film.find('.os_list_price2').children().eq(1).text().trim().replace(/[^0-9,]/g, '');
                            film.isInStock = !!$film.find('.os_list_button').find('input').length;
                            film.type = null;
                            film.format = format;
                            films.push(film);
                        });
                    }
                }
            }
            resolve(films);
        });
    }
}