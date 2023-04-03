const express = require("express");
const app = express();
const https = require("https");
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "pug");

app.get("/", function (request, response) {
    response.sendFile(__dirname + "/index.html");
});

app.post("/", async function (request, response) {
    const userAgent = request.get("user-agent");
    let locName = request.body.locName;

    let apiKey = "d3eb955b923603fd7fc18d08bb74afc6";
    let apiEndPoint = "https://api.openweathermap.org/data/2.5/weather";
    let apiParam = `?q=${locName}&appid=${apiKey}&units=metric`;
    let url = apiEndPoint + apiParam;

    let apiKey2 = "229a509634e047fc928cc056b2b7005f";
    let apiParam2 = `/v2/top-headlines?q=${locName}&apiKey=${apiKey2}`;

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
                let objectDataNull = {
                    locName: "Unknown Location",
                    desc: "unidentified",
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
            statusCode = res2.statusCode;
            var objectDataNewsNull = {
                news_title: "Not Found",
                news_publish_date: "Not Found",
                news_link: "Not Found",
                news_content: "Not Found",
            }
            var rawData = '';
            res2.on("data", function (chunk) {
              rawData += chunk;
            });
            res2.on('end', () => {
              try {
                var newsData = JSON.parse(rawData);
                if (newsData.articles && newsData.articles.length > 0) {
                  var getRandomIndexofArticle = newsData.articles[0];
                  var title = getRandomIndexofArticle.title || "Not Found";
                  var publishDate = getRandomIndexofArticle.publishedAt || "Not Found";
                  var link = getRandomIndexofArticle.url || "Not Found";
                  var content = getRandomIndexofArticle.content || "Not Found";
                  objectDataNews = {
                    news_title: title,
                    news_publish_date: publishDate,
                    news_link: link,
                    news_content: content,
                  };
                } else {
                  objectDataNews = objectDataNewsNull;
                }
                resolve(objectDataNews);
              } catch (error) {
                console.error(error);
                objectDataNews = objectDataNewsNull;
                resolve(objectDataNews);
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