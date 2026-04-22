const launchDate = new Date().getTime() + (14 * 24 * 60 * 60 * 1000);

const updateCountdown = () => {
    const now = new Date().getTime();
    const distance = launchDate - now;

    document.getElementById("days").innerText = Math.floor(distance / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
    document.getElementById("hours").innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
    document.getElementById("minutes").innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    document.getElementById("seconds").innerText = Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, '0');

    if (distance < 0) {
        clearInterval(interval);
        document.getElementById("countdown").innerHTML = "<h3>Our site is now live!</h3>";
    }
};

const interval = setInterval(updateCountdown, 1000);
updateCountdown();