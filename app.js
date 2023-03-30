const express = require("express")
const app = express();
const https = require("https");
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));


app.get("/", function (request, response) {
    response.sendFile(__dirname + "/index.html");

});

app.post("/", function (request, response) {

    const userAgent = request.get('user-agent');
    let locName = request.body.locName;

    // Weather API Credential
    let apiKey = "d3eb955b923603fd7fc18d08bb74afc6";
    let apiEndPoint = "https://api.openweathermap.org/data/2.5/weather";
    let apiParam = `?q=${locName}&appid=${apiKey}&units=metric`;
    let url = apiEndPoint + apiParam;

    // News API Credential
    let apiKey2 = "229a509634e047fc928cc056b2b7005f";
    let apiParam2 = `/v2/top-headlines?q=${locName}&apiKey=${apiKey2}`;

    const options = {
        host: 'newsapi.org',
        path: apiParam2,
        headers: {
            'User-Agent': userAgent
        }
    }

    // Value Weather on screen
    var objectData = {}
    var objectDataNull = {
        locName: "Unknown Location",
        desc: "unidentified",
        temperature: "unidentified",
        humidity: "unidentified",
        pressure: "unidentified"
    }

    // Value News on screen
    var objectDataNews = {}
    var objectDataNewsNull = {
        news_title: "Not Found",
        news_publish_date: "Not Found",
        news_link: "Not Found",
        news_content: "Not Found",
    }

    // Call News API
    https.get(options, function (res2) {
        statusCode = res2.statusCode;
        console.log("1234")
        res2.on("data", function (data) {

            if (statusCode == "404") {
                console.log("12345")
                objectDataNews = objectDataNewsNull
            }
            else if (statusCode == "503") {
                objectDataNews = objectDataNewsNull
            }

            else {
                var newsData = JSON.parse(data);
                console.log("1234")

                console.log(newsData)
                var getRandomIndexofArticle = newsData.articles[0]

                var title = getRandomIndexofArticle.title;
                var publishDate = getRandomIndexofArticle.publishedAt;
                var link = getRandomIndexofArticle.url;
                var content = getRandomIndexofArticle.content;
                objectDataNews = {
                    news_title: title,
                    news_publish_date: publishDate,
                    news_link: link,
                    news_content: content,
                }
            }
        });

    })

    // Call OpenWeather API
    https.get(url, function (res) {
        statusCode = res.statusCode;

        

        res.on("data", function (data) {


            if (statusCode == "404") {
                objectData = objectDataNull

            }
            else if (statusCode == "503") {
                objectData = objectDataNull

            }
            else {
                var weatherData = JSON.parse(data);
                var locationName = `${weatherData.name} (${weatherData.sys.country})`;
                var desc = `The weather is currently ${weatherData.weather[0].description}`;
                var temperature = weatherData.main.temp;
                var humidity = weatherData.main.humidity;
                var pressure = weatherData.main.pressure;
                objectData = {
                    locName: locationName,
                    desc: desc,
                    temperature: temperature,
                    humidity: humidity,
                    pressure: pressure
                }

            }
            var joinGroup = Object.assign(objectData, objectDataNews);
            response.render('index.pug', joinGroup);
        });

    })



});


app.listen(3000, function () {
    console.log("Server is running on localhost3000");
})
