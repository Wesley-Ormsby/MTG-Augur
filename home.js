let clipboard = {}

function loadCards() {
    if (localStorage.getItem("appearance") == null) {
        localStorage.setItem("appearance", "system");
    }
    document.body.className = ""
    document.body.classList.add(localStorage.getItem("appearance"))

  let url = `https://api.scryfall.com/cards/search?order=cmc&q=id%3Adimir%20type%3Azombie%20%20usd%3C4&page=1&order=name`;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      printCards(data)
    });
}

function printCards(data) {
  let cardsElement = document.getElementById("cards");
  for (i=0 + 0; i < 2; i++) {
    let each = data.data[i];
    let imgURL = each.image_uris?.png ?? each.card_faces[0].image_uris.png;

    let inClipboard = each.name in clipboard ? "true" : "false";
    let name = each.name.replace(/\"/g, "&#34;");
    let price = (each.prices.usd == null) ?  "..." : "$" + each.prices.usd
    if (typeof each.image_uris !== "undefined") {
      cardsElement.innerHTML += `<div class="card">
        <div class="mockCard">
          <svg id="svg${name}" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><style>.spinner_9y7u{animation:spinner_fUkk 2.4s linear infinite;animation-delay:-2.4s}.spinner_DF2s{animation-delay:-1.6s}.spinner_q27e{animation-delay:-.8s}@keyframes spinner_fUkk{8.33%{x:13px;y:1px}25%{x:13px;y:1px}33.3%{x:13px;y:13px}50%{x:13px;y:13px}58.33%{x:1px;y:13px}75%{x:1px;y:13px}83.33%{x:1px;y:1px}}</style><rect class="spinner_9y7u" x="1" y="1" rx="1" width="10" height="10"/><rect class="spinner_9y7u spinner_DF2s" x="1" y="1" rx="1" width="10" height="10"/><rect class="spinner_9y7u spinner_q27e" x="1" y="1" rx="1" width="10" height="10"/></svg>
          <img onload="reveal(this)" onclick="addToClipboard(this)" src="${imgURL}" id="${name}" data-price="" data-clipboard="${inClipboard}">
        </div>
        <div class="cardFooter">
        <a href="${each.scryfall_uri}"><img class="scryfallIMG" src="scryfall.png"></a><span>${price}</span>
      </div>
        </div>`;
    } else {
      cardsElement.innerHTML += `<div class="card">
        <div class="mockCard">
          <svg id="svg${name}" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><style>.spinner_9y7u{animation:spinner_fUkk 2.4s linear infinite;animation-delay:-2.4s}.spinner_DF2s{animation-delay:-1.6s}.spinner_q27e{animation-delay:-.8s}@keyframes spinner_fUkk{8.33%{x:13px;y:1px}25%{x:13px;y:1px}33.3%{x:13px;y:13px}50%{x:13px;y:13px}58.33%{x:1px;y:13px}75%{x:1px;y:13px}83.33%{x:1px;y:1px}}</style><rect class="spinner_9y7u" x="1" y="1" rx="1" width="10" height="10"/><rect class="spinner_9y7u spinner_DF2s" x="1" y="1" rx="1" width="10" height="10"/><rect class="spinner_9y7u spinner_q27e" x="1" y="1" rx="1" width="10" height="10"/></svg>
          <img onload="reveal(this)" onclick="addToClipboard(this)" src="${imgURL}" id="${name}" data-price="" data-clipboard="${inClipboard}" data-side="front" data-front="${
        each.card_faces[0].image_uris.png
      }" data-back="${each.card_faces[1].image_uris.png}">
        </div>
        <div class="cardFooter">
        <a href="${each.scryfall_uri}"><img class="scryfallIMG" src="scryfall.png"></a>
        <span>${price}</span><button onclick="flip('${each.name}')">Flip</button>
        </div>
        </div>`;
    }
    // get element with qoutation already replced not `name`
    document
      .getElementById(each.name)
      .setAttribute("data-prices", JSON.stringify(each.prices));
  }
}
function reveal(element) {
  element.style.display = "block";
  document.getElementById("svg" + element.id).style.display = "none";
}
function flip(id) {
  img = document.getElementById(id);
  img.setAttribute(
    "data-side",
    img.getAttribute("data-side") == "front" ? "back" : "front"
  );
  img.src = img.getAttribute("data-" + img.getAttribute("data-side"));
  img.style.display = "none";
  document.getElementById("svg" + id).style.display = "block";
}

function addToClipboard(img) {
  let inClipboard = img.id in clipboard;
  if (inClipboard) {
    img.setAttribute("data-clipboard", "false");
    delete clipboard[img.id];
  } else {
    img.setAttribute("data-clipboard", "true");
    clipboard[img.id] = img.getAttribute("data-prices");
  }
  updateClipboard()
}

/************* Clipboard Menu Functions *************/
function updateClipboard() {
    let clipboardHTML = document.getElementById("clipboard");
  clipboardHTML.innerHTML = "";

  let totalPrice = 0;
  for (each of Object.keys(clipboard)) {
    let price = JSON.parse(clipboard[each]).usd;
    totalPrice += Number(price) ?? 0;
    clipboardHTML.innerHTML += `
            <div data-card="${each.replace(/\"/g, "&#34;")}">
                <span >${each}</span>
                <span>
                    <span class="clipboardPrice">${price ?? "..."}</span>
                    <span class="clipboardRemoveBtn" onclick="removeCardFromClipboard(this)">&times;</span>
                </span>
            </div>`;
  }
  document.getElementById("totalPrice").innerHTML = `$${totalPrice.toFixed(2)}`;
  document.getElementById("totalCards").innerHTML =
    Object.keys(clipboard).length;
}

function clearClipboard() {
  clipboard = {}
  updateClipboard()
  for (var each of document.querySelectorAll("[data-clipboard='true']")) {
    each.setAttribute("data-clipboard", "false");
  }
}

function copyClipboard() {
  const text = Object.keys(clipboard).join("\n");
  navigator.clipboard.writeText(text);

  document.getElementById("clipboard").style.backgroundColor = "var(--bg3)";
  setTimeout(function () {
    document.getElementById("clipboard").style.backgroundColor = "var(--bg1)";
  }, 500);
}

function removeCardFromClipboard(span) {
  const cardName = span.parentElement.parentElement.getAttribute("data-card");
  delete clipboard[cardName];
  let img = document.getElementById(cardName);
  img.setAttribute("data-clipboard", "false");
  updateClipboard()
}

function focusOnInput() {
    window.scrollTo({top: 0, behavior: 'smooth'});
    setTimeout(function() {
    document.getElementById("queryInput").focus();
    }, 400)
}

function querySearch(e) {
    if (e.key === "Enter") {
      // Cancel the default action, if needed
      e.preventDefault();
      let queryTerms = encodeURIComponent(
        document.getElementById("queryInput").value
      );
      window.open(`search.html?query=${queryTerms}&page=1`, "_self");
      localStorage.setItem("maxPage", false);
    }
  }