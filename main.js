const convertBlobToBase64 = blob => new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () => {
        resolve(reader.result);
    };
    reader.readAsDataURL(blob);
});

let loadImg = false;
let loadQuotes = false;

const setApiKey = (reset = false) => {
    let apiKey = null;
    if (localStorage.getItem("API_KEY") && !reset) {
        apiKey = localStorage.getItem("API_KEY");
    } else {
        let promptAPI = prompt("Please enter your API_KEY");
        if (promptAPI != null && promptAPI != "") {
            localStorage.setItem("API_KEY", promptAPI);
            apiKey = promptAPI;
        }
    }

    if (apiKey == null) {
        return null
    }

    return apiKey;
}

const ChatGPT = async (message) => {
    let apiKey = setApiKey();

    if (apiKey == null) {
        return null
    }


    const endpoint = 'https://api.openai.com/v1/chat/completions';
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "model": "gpt-3.5-turbo",
                "messages": [{ "role": "user", "content": `${message}` }]
            }),
        });

        if (response.status != 200) { //401 apiKey errato
            return null
        }

        const data = await response.json();

        // Gestisci la risposta dell'API
        const reply = data.choices[0].message.content;
        console.log('ChatGPT: ' + reply);

        return reply;
    } catch (error) {
        console.error(error);
        return null;
    }
}

loadQuote = async () => {
    let responseGPT = await ChatGPT('Generami una citazione motivazionale in formato json');
    if (responseGPT != null) {
        let quote = JSON.parse(responseGPT);

        document.getElementById("quote").textContent = quote.citazione;
        document.getElementById("author").textContent = "-" + quote.autore;

        loadQuotes = true;
    } else {
        fetch('https://dummyjson.com/quotes/random')
            .then(res => res.json())
            .then(result => {
                console.log(result);

                document.getElementById("quote").textContent = result.quote;
                document.getElementById("author").textContent = "-" + result.author;

                loadQuotes = true;
            });
    }
}
loadBg = () => { //motivational-background
    const photo = "nature";
    //document.body.style.backgroundImage = `url(https://source.unsplash.com/1920x1080/?motivational-background&${new Date().getTime()})`;
    fetch(`https://picsum.photos/1920/1080`) //`https://source.unsplash.com/1920x1080/?${photo}#${new Date().getTime()}`
        .then(response => response.blob())
        .then(async blob => {
            console.log(blob);

            const base64 = await convertBlobToBase64(blob);
            document.body.style.backgroundImage = `url(${base64})`;

            loadImg = true;
        });
}
loadQuotesIt = () => {

    let url = 'https://it.wikiquote.org/w/api.php?format=json&origin=*&action=parse&page=Template:Qotd';

    let wqQuoteHtml = "";
    let wqAuthorHtml = "";
    
    fetch(url)
        .then(response => response.json())
        .then(data => fecthData(data))
        .catch(error => console.log(error))
    
        const fecthData = (data) => {
        let body = `${data.parse.text['*']}`;
        console.log(body);
        bodyHtml = body.replace(/\n*/gm, "").replace(/\/wiki\//gm, "https://it.wikiquote.org/wiki/");
        wqQuoteHtml = bodyHtml.replace(/.+<blockquote/gm, "<blockquote").replace(/<\/blockquote.+/gm, "</blockquote");
        wqAuthorHtml = bodyHtml.replace(/\n*/gm, "").replace(/.+<big id="Aŭtoro_CDLT"/gm, '<big id="Aŭtoro_CDLT"').replace(/<\/big><br\/>.+/gm, "</big>");
       
        console.log(wqQuoteHtml);
        console.log(wqAuthorHtml);
        //document.getElementById('eoWikiquote').innerHTML = `<figure id="figEoWikiquote">${wqQuoteHtml} + <figcaption>—${wqAuthorHtml}</figcaption></figure>`
    }


    var authors = [
        "Mahatma Gandhi",
        "Albert Einstein",
        "Martin Luther King, Jr.",
        "Leonardo da Vinci",
        "Walt Disney",
        "Edgar Allan Poe",
        "Sigmund Freud",
        "Thomas A. Edison",
        "Robin Williams",
        "Steve Jobs"
    ];

    const randInt = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    getQuote = () => Wikiquote.getRandomQuote(authors[randInt(0, 9)],
        function (quote) {
            console.log("quote", quote);
            if (quote.quote && quote.quote.length <= 180) {
                console.log(quote.quote);
            } else {
                getQuote();
            }

        }, (e) => { console.log(e); });

    getQuote();
}
loadQuotesIt();

loadBg();
loadQuote();

function toggleFullScreen() {
    if (!document.fullscreenElement &&    // alternative standard method
        !document.mozFullScreenElement && !document.webkitFullscreenElement) {  // current working methods
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }
    }
}

const checkTime = (n) => { return (n < "10") ? n = "0" + n : n; }

// Set the date we're counting down to
var countDownDate = new Date("2025/12/31 08:00:00").getTime();

// Update the count down every 1 second
var x = setInterval(() => {

    // Get today's date and time
    var now = new Date().getTime();

    // Find the distance between now and the count down date
    var distance = countDownDate - now;

    // Time calculations for days, hours, minutes and seconds
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    hours = checkTime(hours);
    minutes = checkTime(minutes);
    seconds = checkTime(seconds);

    let result = `${days} Giorni ${hours} Ore ${minutes} Minuti ${seconds} Secondi`;

    // Output the result in an element with id="demo"
    //document.getElementById("demo").textContent = result;

    document.getElementById("days").textContent = days;
    document.getElementById("hours").textContent = hours;
    document.getElementById("minutes").textContent = minutes;
    document.getElementById("seconds").textContent = seconds;
    //days + "d " + hours + "h "+ minutes + "m " + seconds + "s ";

    // If the count down is over, write some text 
    if (distance < 0) {
        clearInterval(x);
        //document.getElementById("demo").textContent = "EXPIRED";
    }

    if (minutes == "00" && seconds == "00") {
        loadQuote();
        loadBg();
    }

    if (loadImg && loadQuotes) {
        document.querySelector("body > div.loader-base").style.display = "none";
    }

    const today = new Date();
    let h = checkTime(today.getHours());
    let m = checkTime(today.getMinutes());
    let s = checkTime(today.getSeconds());
    document.getElementById('clock').textContent = `${h}:${m}`;  //:${s}`;


    //update progress bar
    const Ds = "2025/01/01";
    const Df = "2025/12/31";
    const percent = ((new Date().getTime() - new Date(Ds).getTime()) * 100) / (new Date(Df).getTime() - new Date(Ds).getTime());
    document.getElementById("percent").textContent = percent.toFixed(1) + "%";
    document.getElementById("progress").style.width = percent + "%";
}, 1000);
