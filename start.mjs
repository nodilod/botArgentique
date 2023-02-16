import {main} from "./main.mjs";

const tweet = !process.argv[2];
console.log("tweet ?",tweet);
main(tweet).then(r => {
    console.log('fait');
});