let totalPredictions = 0;
let fakeDetected = 0;
let realDetected = 0;
let currentInputMode = "text";

const API_BASE = "https://fake-news-detection-backend-pc6s.onrender.com";

function switchInputMode(mode) {
    currentInputMode = mode;
    const newsBox = document.getElementById("news");
    const urlInput = document.getElementById("newsUrl");

    if (mode === "url") {
        newsBox.style.display = "none";
        urlInput.style.display = "block";
    } else {
        newsBox.style.display = "block";
        urlInput.style.display = "none";
    }
}

let lastResult = null;

function renderResult(data) {
    const result = document.getElementById("result");
    const probText = document.getElementById("probability");
    const confidenceFill = document.getElementById("confidenceFill");
    const confidenceText = document.getElementById("confidenceText");
    const explainBox = document.getElementById("explainability");
    const fakeWordsEl = document.getElementById("fakeWords");
    const realWordsEl = document.getElementById("realWords");

    if (data.label === "FAKE") {
        result.innerHTML = "❌ Fake News Detected";
        result.style.color = "#B5503A";
        fakeDetected++;
        document.getElementById("fakeCount").innerText = fakeDetected;
        probText.innerHTML = "Fake Probability: " + data.fake_probability + "%";
    } else if (data.label === "REAL") {
        result.innerHTML = "✅ Real News Verified";
        result.style.color = "#6F8F6A";
        realDetected++;
        probText.innerHTML = "Real Probability: " + (100 - data.fake_probability).toFixed(2) + "%";
    } else {
        result.innerHTML = "❓ Uncertain - Low Confidence";
        result.style.color = "#A89C89";
        probText.innerHTML = "Fake Probability: " + data.fake_probability + "% | Real Probability: " + (100 - data.fake_probability).toFixed(2) + "%";
    }

    if (data.extracted_title) {
        probText.innerHTML += "<br>Article: " + data.extracted_title;
    }

    confidenceFill.style.width = data.confidence + "%";
    confidenceText.innerHTML = "Confidence: " + data.confidence + "%";

    // Explainability
    const fakeWords = (data.top_words && data.top_words.fake_words) || [];
    const realWords = (data.top_words && data.top_words.real_words) || [];

    if (fakeWords.length > 0 || realWords.length > 0) {
        explainBox.style.display = "block";
        fakeWordsEl.innerHTML = fakeWords.length
            ? fakeWords.map(w => `<span class="tag tag-fake">${w}</span>`).join("")
            : "<span class='tag-empty'>None</span>";
        realWordsEl.innerHTML = realWords.length
            ? realWords.map(w => `<span class="tag tag-real">${w}</span>`).join("")
            : "<span class='tag-empty'>None</span>";
    } else {
        explainBox.style.display = "none";
    }

    totalPredictions++;
    document.getElementById("totalCount").innerText = totalPredictions;

    lastResult = data;
    document.getElementById("shareSection").style.display = "block";
}

async function checkNews() {
    const result = document.getElementById("result");
    const probText = document.getElementById("probability");
    const confidenceFill = document.getElementById("confidenceFill");
    const confidenceText = document.getElementById("confidenceText");
    const explainBox = document.getElementById("explainability");

    let endpoint, body;

    if (currentInputMode === "url") {
        const urlInput = document.getElementById("newsUrl");
        const url = urlInput.value.trim();
        if (url === "") {
            result.innerHTML = "Please enter a URL.";
            result.style.color = "#B5503A";
            return;
        }
        endpoint = API_BASE + "/predict_url";
        body = { url: url };
    } else {
        const newsBox = document.getElementById("news");
        const text = newsBox.value;
        if (text.trim() === "") {
            result.innerHTML = "Please enter news.";
            result.style.color = "#B5503A";
            return;
        }
        endpoint = API_BASE + "/predict";
        body = { text: text };
    }

    // Loading state
    result.innerHTML = "Analyzing...";
    result.style.color = "#8A8074";
    probText.innerHTML = "";
    confidenceFill.style.width = "0%";
    confidenceText.innerHTML = "";
    explainBox.style.display = "none";

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            result.innerHTML = "⚠️ " + (data.error || "Server error");
            result.style.color = "#B5503A";
            return;
        }

        renderResult(data);

    } catch (err) {
        result.innerHTML = "⚠️ Could not reach prediction server. Is the backend running?";
        result.style.color = "#B5503A";
        console.error(err);
    }
}

function clearText() {
    document.getElementById("news").value = "";
    document.getElementById("newsUrl").value = "";
    document.getElementById("result").innerHTML = "";
    document.getElementById("probability").innerHTML = "";
    document.getElementById("confidenceFill").style.width = "0%";
    document.getElementById("confidenceText").innerHTML = "";
    document.getElementById("explainability").style.display = "none";
    document.getElementById("shareSection").style.display = "none";
    lastResult = null;
}

function downloadResultCard() {
    if (!lastResult) return;

    const canvas = document.getElementById("resultCanvas");
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    // Background
    ctx.fillStyle = "#fdfbf7";
    ctx.fillRect(0, 0, W, H);

    // Border
    ctx.strokeStyle = "#e3dac9";
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, W - 16, H - 16);

    // Header band
    ctx.fillStyle = "#e8dcc8";
    ctx.fillRect(0, 0, W, 90);

    ctx.fillStyle = "#3c352c";
    ctx.font = "600 26px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("AI-Powered Fake News Detection System", W / 2, 50);

    ctx.font = "14px Arial";
    ctx.fillStyle = "#6e6354";
    ctx.fillText("News Authenticity Analysis Result", W / 2, 75);

    // Verdict
    let verdictText, verdictColor, icon;
    if (lastResult.label === "FAKE") {
        verdictText = "FAKE NEWS DETECTED";
        verdictColor = "#B5503A";
        icon = "✗";
    } else if (lastResult.label === "REAL") {
        verdictText = "REAL NEWS VERIFIED";
        verdictColor = "#6F8F6A";
        icon = "✓";
    } else {
        verdictText = "UNCERTAIN";
        verdictColor = "#A89C89";
        icon = "?";
    }

    ctx.font = "700 64px Arial";
    ctx.fillStyle = verdictColor;
    ctx.fillText(icon, W / 2, 200);

    ctx.font = "600 32px Georgia, serif";
    ctx.fillStyle = "#3c352c";
    ctx.fillText(verdictText, W / 2, 250);

    // Confidence
    ctx.font = "20px Arial";
    ctx.fillStyle = "#6e6354";
    ctx.fillText("Confidence: " + lastResult.confidence + "%", W / 2, 295);

    // Confidence bar
    const barX = W / 2 - 250;
    const barY = 320;
    const barW = 500;
    const barH = 16;

    ctx.fillStyle = "#e8dcc8";
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = verdictColor;
    ctx.fillRect(barX, barY, barW * (lastResult.confidence / 100), barH);

    // Footer
    ctx.font = "13px Arial";
    ctx.fillStyle = "#a89c89";
    ctx.fillText("Model: TF-IDF + Passive Aggressive Classifier | Developed by Akshat Sachan", W / 2, H - 30);

    // Trigger download
    const link = document.createElement("a");
    link.download = "fake-news-result.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
}

// Voice input using Web Speech API
function startVoice() {
    const status = document.getElementById("voiceStatus");

    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
        status.innerText = "Voice recognition not supported in this browser.";
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    status.innerText = "Listening...";

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById("news").value += transcript + " ";
        status.innerText = "Captured. Click mic and speak";
    };

    recognition.onerror = function () {
        status.innerText = "Error capturing voice. Try again.";
    };

    recognition.onend = function () {
        if (status.innerText === "Listening...") {
            status.innerText = "Click mic and speak";
        }
    };

    recognition.start();
}
