const express = require("express");
const app = express();
const https = require("https");
const port = process.env.PORT || 3000;
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "pug");

app.get("/", function (request, response) {
    response.sendFile(__dirname + "/index.html");
});

app.post("/", async function (request, response) {
    const userAgent = request.get("user-agent");
    let locName = request.body.locName.split(" ").join("+");
    
    let apiKey = "d3eb955b923603fd7fc18d08bb74afc6";
    let apiEndPoint = "https://api.openweathermap.org/data/2.5/weather";
    let apiParam = `?q=${locName}&appid=${apiKey}&units=metric`;
    let url = apiEndPoint + apiParam;

    let apiKey2 = "229a509634e047fc928cc056b2b7005f";
    let apiParam2 = `/v2/everything?q=${locName}&apiKey=${apiKey2}`;
    const options = {
        host: "newsapi.org",
        path: apiParam2,
        headers: {
            "User-Agent": userAgent,
        },
    };

    async function fetchWeatherData() {
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let objectData = {};
                const locNameToFormatted = locName.split("+").join(" ")
                const arrLocNameFormatted = locNameToFormatted.split(" ");
                for (var i = 0; i < arrLocNameFormatted.length; i++) {
                    arrLocNameFormatted[i] = arrLocNameFormatted[i].charAt(0).toUpperCase() + arrLocNameFormatted[i].slice(1);
                
                }
                locNameFormatted = arrLocNameFormatted.join(" ");
                let objectDataNull = {
                    locName: `${locNameFormatted}`,
                    desc: "(Unknown Location)",
                    temperature: "unidentified",
                    humidity: "unidentified",
                    pressure: "unidentified",
                };

                res.on("data", (data) => {
                    const weatherData = JSON.parse(data);

                    if (res.statusCode === 404 || res.statusCode === 503) {
                        objectData = objectDataNull;
                    } else {
                        objectData = {
                            locName: `${weatherData.name} (${weatherData.sys.country})`,
                            desc: `The weather is currently ${weatherData.weather[0].description}`,
                            temperature: weatherData.main.temp,
                            humidity: weatherData.main.humidity,
                            pressure: weatherData.main.pressure,
                        };
                    }
                    resolve(objectData);
                });
            });
        });
    }



    async function fetchNewsData() {
        return new Promise((resolve, reject) => {
            https.get(options, async function (res2) {
                let rawData = '';
                res2.on('data', function (chunk) {
                    rawData += chunk;
                });
                res2.on('end', () => {
                    try {
                        const newsData = JSON.parse(rawData);
                        if (newsData.articles && newsData.articles.length > 0) {
                            const firstArticleUrl = newsData.articles[0].url;
                            https.get(firstArticleUrl, function (res3) {
                                let rawData2 = '';
                                res3.on('data', function (chunk) {
                                    rawData2 += chunk;
                                });
                                res3.on('end', () => {
                                    try {
                                        const dom = new JSDOM(rawData2, {
                                            url: firstArticleUrl
                                        });
                                        const article = new Readability(dom.window.document).parse();
                                        const content = article ? article.textContent : newsData.articles[0].content;
                                        const publishedAt = newsData.articles[0].publishedAt;
                                        const date = new Date(publishedAt);

                                        const year = date.getFullYear();
                                        const month = String(date.getMonth() + 1).padStart(2, "0"); 
                                        const day = String(date.getDate()).padStart(2, "0");
                                        resolve({
                                            news_title: newsData.articles[0].title,
                                            news_publish_date: `${day}-${month}-${year}`,
                                            news_link: newsData.articles[0].url,
                                            news_content: content
                                        });
                                    } catch (error) {
                                        console.error(error);
                                        resolve({
                                            news_title: 'Not Found',
                                            news_publish_date: 'Not Found',
                                            news_link: 'Not Found',
                                            news_content: 'Not Found'
                                        });
                                    }
                                });
                            });
                        } else {
                            resolve({
                                news_title: 'Not Found',
                                news_publish_date: 'Not Found',
                                news_link: 'Not Found',
                                news_content: 'Not Found'
                            });
                        }
                    } catch (error) {
                        console.error(error);
                        resolve({
                            news_title: 'Not Found',
                            news_publish_date: 'Not Found',
                            news_link: 'Not Found',
                            news_content: 'Not Found'
                        });
                    }
                });
            });
        });
    }

    try {
        const weatherData = await fetchWeatherData();
        const newsData = await fetchNewsData();

        const result = { ...weatherData, ...newsData };
        response.render("index.pug", result);
    } catch (error) {
        console.error("Error fetching data from APIs:", error);

        response.status(500).send("Internal Server Error");
    }
});

app.listen(3000, function () {
    console.log("Server is running on localhost:3000");
});