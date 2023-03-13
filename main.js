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

loadQuote = () => {
    fetch('https://dummyjson.com/quotes/random')
        .then(res => res.json())
        .then(result => {
            console.log(result);

            document.getElementById("quote").textContent = result.quote;
            document.getElementById("author").textContent = "-" + result.author;

            loadQuotes = true;
        });
}
loadBg = () => {
    //document.body.style.backgroundImage = `url(https://source.unsplash.com/1920x1080/?motivational-background&${new Date().getTime()})`;
    fetch(`https://source.unsplash.com/1920x1080/?motivational-background&${new Date().getTime()}`)
        .then(response => response.blob())
        .then(async blob => {
            console.log(blob);
            
            const base64 = await convertBlobToBase64(blob);
            document.body.style.backgroundImage = `url(${base64})`;

            loadImg = true;
        });
}

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

// Set the date we're counting down to
var countDownDate = new Date("2023/08/08 08:00:00").getTime();

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

    if (hours < "10") { hours = "0" + hours; }
    if (minutes < "10") { minutes = "0" + minutes; }
    if (seconds < "10") { seconds = "0" + seconds; }

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
}, 1000);
