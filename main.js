// Used to determin if the page needs reloading when leaving the side menu
let reload = false;

function getQueryParms() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const query = urlParams.get("query") ?? "";

  const terms = JSON.parse(localStorage.getItem("terms"));

  return encodeURIComponent(query + " " + terms.join(" "));
}

function getSort() {
  const sort = encodeURIComponent(localStorage.getItem("sort"));
  const order = encodeURIComponent(localStorage.getItem("order"));
  return `order=${sort}&dir=${order}`;
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

function loadCards() {
  // Update/set settings
  if (localStorage.getItem("terms") == null) {
    localStorage.setItem("terms", "[]");
  }
  document.getElementById("globalTermsCount").innerHTML = JSON.parse(
    localStorage.getItem("terms")
  ).length;
  if (localStorage.getItem("clipboard") == null) {
    localStorage.setItem("clipboard", "{}");
  }
  if (localStorage.getItem("sort") == null) {
    localStorage.setItem("sort", "name");
  }
  document.getElementById("sort").value = localStorage.getItem("sort");
  if (localStorage.getItem("order") == null) {
    localStorage.setItem("order", "");
  }
  document.getElementById("order").value = localStorage.getItem("order");
  if (localStorage.getItem("price") == null) {
    localStorage.setItem("price", "usd");
  }
  document.getElementById("price").value = localStorage.getItem("price");
  if (localStorage.getItem("appearance") == null) {
    localStorage.setItem("appearance", "system");
  }
  document.getElementById("appearance").value =
    localStorage.getItem("appearance");
  document.body.className = "";
  document.body.classList.add(localStorage.getItem("appearance"));


  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  let page = urlParams.get("page");
  if (page?.match(/\D/g) ?? false) {
    return pageDoesNotExist(page);
  }

  if (page == "1") {
    for (var each of document.getElementsByClassName("Previous")) {
      each.disabled = true;
    }
  }
  if (localStorage.getItem("maxPage") != "false") {
    document.getElementById("page").innerHTML = `Page ${page}/${Math.ceil(
      Number(localStorage.getItem("maxPage")) / 60
    )}`;
  }

  document.getElementById("queryInput").value = urlParams.get("query");
  page = Number(page);
  page = page * 60;
  let scryFallpage = 1;
  while (scryFallpage * 175 < page - 60) {
    scryFallpage += 1;
  }
  const index = (page - 60) % 175;

  let url = `https://api.scryfall.com/cards/search?q=${getQueryParms()}&page=${scryFallpage}&${getSort()}`;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.object == "error") {
        if (data.code == "not_found") {
          return noCardsInSearch();
        } else if (data.code == "validation_error") {
          return pageDoesNotExist(page / 60);
        } else if (data.code == "bad_request") {
          return badRequest(data);
        }
      }
      if (data["total_cards"] < 60 * (page / 60 - 1)) {
        return pageDoesNotExist(page / 60);
      }

      let totalPages = Math.ceil(data.total_cards / 60);
      if (localStorage.getItem("maxPage") == "false") {
        document.getElementById("page").innerHTML = `Page ${
          page / 60
        }/${totalPages}`;
        localStorage.setItem("maxPage", data["total_cards"]);
      }
      if (Math.ceil(page / 60) == totalPages) {
        for (var each of document.getElementsByClassName("Next")) {
          each.disabled = true;
        }
      }
      printCards(data, index, 60);
      if (175 - index < 60) {
        let url = `https://api.scryfall.com/cards/search?q=${getQueryParms()}&page=${
          scryFallpage + 1
        }&${getSort()}`;
        fetch(url)
          .then((response) => response.json())
          .then((data) => printCards(data, 0, 60 - (175 - index)));
      }
      let warnings = document.getElementById("warnings");
      for (var each of data.warnings ?? []) {
        warnings.innerHTML += `<p>${each}</p>`;
      }
    });
}

function printCards(data, index, cardNumber) {
  let cardsElement = document.getElementById("cards");
  for (i = index + 0; i < index + cardNumber; i++) {
    if (i == 175 || typeof data.data[i] == "undefined") {
      break;
    }
    const each = data.data[i];
    const imgURL = each.image_uris?.png ?? each.card_faces[0].image_uris.png;

    const clipboard = JSON.parse(localStorage.getItem("clipboard"));
    const inClipboard = each.name in clipboard ? "true" : "false";
    const name = each.name.replace(/\"/g, "&#34;");
    const priceMode = localStorage.getItem("price");
    const sign = priceMode.includes("usd") ? "$" : "€";
    const price =
      each.prices[priceMode] == null ? "..." : sign + each.prices[priceMode];
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
          <img onload="reveal(this)" onclick="addToClipboard(this)" src="${imgURL}" id="${name}" data-price="" data-clipboard="${inClipboard}" data-side="front" data-front="${each.card_faces[0].image_uris.png}" data-back="${each.card_faces[1].image_uris.png}">
        </div>
        <div class="cardFooter">
        <a href="${each.scryfall_uri}"><img class="scryfallIMG" src="scryfall.png"></a>
        <span>${price}</span><button onclick="flip('${each.name}')">Flip</button>
        </div>
        </div>`;
    }
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
  let clipboard = JSON.parse(localStorage.getItem("clipboard"));

  let inClipboard = img.id in clipboard;
  if (inClipboard) {
    img.setAttribute("data-clipboard", "false");
    delete clipboard[img.id];
  } else {
    img.setAttribute("data-clipboard", "true");
    clipboard[img.id] = img.getAttribute("data-prices");
  }
  localStorage.setItem("clipboard", JSON.stringify(clipboard));
}

function pageDoesNotExist(page) {

  document.getElementById(
    "warnings"
  ).innerHTML += `<p>Page '${page}' does not exit.</p>`;
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const queryTerms = encodeURIComponent(urlParams.get("query"));
  document.getElementById("queryInput").value = urlParams.get("query");
  let page1 = `search.html?query=${queryTerms}&page=1`;
  document.getElementById(
    "details"
  ).innerHTML = `Are you messing with the URL? There is no page '${page}'. <a href="${page1}">Go Back To Page 1</a>`;

  document.getElementById("allCards").style.display = "none";
  document.getElementById("noResults").style.display = "flex";
  document.getElementById("addAllCards").disabled = true;
  document.getElementById("details").style.display = "block";
}

function noCardsInSearch() {
  document.getElementById("allCards").style.display = "none";
  document.getElementById("noResults").style.display = "flex";
  document.getElementById("addAllCards").disabled = true;
}
function badRequest(data) {
  let warnings = document.getElementById("warnings");
  for (var each of data.warnings ?? []) {
    warnings.innerHTML += `<p>${each}</p>`;
  }
  document.getElementById("details").innerHTML = data.details;
  document.getElementById("allCards").style.display = "none";
  document.getElementById("noResults").style.display = "flex";
  document.getElementById("addAllCards").disabled = true;
  document.getElementById("details").style.display = "block";
}

function previous() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  let page = Number(urlParams.get("page")) - 1;
  const query = encodeURIComponent(urlParams.get("query"));
  window.open(`search.html?query=${query}&page=${page}`, "_self");
}

function next() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  let page = Number(urlParams.get("page")) + 1;
  const query = encodeURIComponent(urlParams.get("query"));
  window.open(`search.html?query=${query}&page=${page}`, "_self");
}

/************* Clipboard Menu Functions *************/
function openNav() {
  document.getElementById("mySidenav").style.width = "100%";
  loadGlobalTerms();
  let clipboardHTML = document.getElementById("clipboard");
  clipboardHTML.innerHTML = "";

  let clipboard = JSON.parse(localStorage.getItem("clipboard"));
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

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  if (reload) {
    reload = false;
    localStorage.setItem("maxPage", false);
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const queryTerms = encodeURIComponent(urlParams.get("query"));
    window.open(`search.html?query=${queryTerms}&page=1`, "_self");
  }
}

function clearClipboard() {
  localStorage.setItem("clipboard", "{}");
  let clipboardHTML = document.getElementById("clipboard");
  clipboardHTML.innerHTML = "";

  for (var each of document.querySelectorAll("[data-clipboard='true']")) {
    each.setAttribute("data-clipboard", "false");
  }
  document.getElementById("totalPrice").innerHTML = `$0.00`;
  document.getElementById("totalCards").innerHTML = 0;
}

function copyClipboard() {
  const clipboard = JSON.parse(localStorage.getItem("clipboard"));
  const text = Object.keys(clipboard).join("\n");
  navigator.clipboard.writeText(text);

  document.getElementById("clipboard").style.backgroundColor = "var(--bg3)";
  setTimeout(function () {
    document.getElementById("clipboard").style.backgroundColor = "var(--bg1)";
  }, 500);
}

function removeCardFromClipboard(span) {
  let clipboard = JSON.parse(localStorage.getItem("clipboard"));

  // Remove parent div from clipboard HTML
  span.parentElement.parentElement.style.display = "none";

  // Remove the card from the clipboard
  const cardName = span.parentElement.parentElement.getAttribute("data-card");
  delete clipboard[cardName];
  localStorage.setItem("clipboard", JSON.stringify(clipboard));

  // Remove the heighlighting of the card if you are on it's page
  let img = document.getElementById(cardName);
  if (img !== null) {
    img.setAttribute("data-clipboard", "false");
  }

  // Update the total Price
  totalPrice = 0;
  for (each of Object.keys(clipboard)) {
    let price = JSON.parse(clipboard[each]).usd;
    totalPrice += Number(price) ?? 0;
  }
  document.getElementById("totalPrice").innerHTML = `$${totalPrice.toFixed(2)}`;
  document.getElementById("totalCards").innerHTML =
    Object.keys(clipboard).length;
}

function changeSort(select) {
  localStorage.setItem("sort", select.value);
  reload = true;
}
function changeOrder(select) {
  localStorage.setItem("order", select.value);
  reload = true;
}
function changePrice(select) {
  localStorage.setItem("price", select.value);
}
function changeAppearance(select) {
  localStorage.setItem("appearance", select.value);
  document.body.className = "";
  document.body.classList.add(select.value);
}

/************* Add All Cards of Term *************/
function displayModal() {
  document.getElementById("modalNumberOfCards").innerHTML =
    localStorage.getItem("maxPage");
  document.getElementById("modal").style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (document.getElementById("addAllCardsLoader").style.display != "block") {
    document.getElementById("modal").style.display = "none";
    document.body.style.overflow = "auto";
    document.getElementById("cancel").disabled = false;
    document.getElementById("yes").disabled = false;
  }
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    closeModal();
  }
};

function addAllCardsToClipboard() {
  document.getElementById("addAllCardsLoader").style.display = "block";
  document.getElementById("cancel").disabled = true;
  document.getElementById("yes").disabled = true;

  let clipboard = JSON.parse(localStorage.getItem("clipboard"));
  const numberOfCards = Number(
    document.getElementById("modalNumberOfCards").innerHTML
  );
  const numberOfPages = Math.ceil(numberOfCards / 175);
  getCards(clipboard, 1, numberOfPages);
}
function getCards(dic, page, maxPage) {
  document.getElementById("addAllCardsLoader").style.width =
    String((page / maxPage) * 100) + "%";
  let url = `https://api.scryfall.com/cards/search?q=${getQueryParms()}&page=${page}&${getSort()}`;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      for (var each of data.data) {
        dic[each.name] = JSON.stringify(each.prices);
      }
      if (data.has_more) {
        return getCards(dic, page + 1, maxPage);
      }
      // all card have been gotten
      localStorage.setItem("clipboard", JSON.stringify(dic));
      for (var each of document.querySelectorAll("[data-clipboard='false']")) {
        each.setAttribute("data-clipboard", "true");
      }
      document.getElementById("addAllCardsLoader").style.display = "none";
      closeModal();
    });
}

/************* Global Search Terms *************/
function addNewTerm() {
  let terms = JSON.parse(localStorage.getItem("terms"));
  terms.push("");
  localStorage.setItem("terms", JSON.stringify(terms));
  document.getElementById("globalTermsCount").innerHTML = terms.length;
  loadGlobalTerms();
}

function updateTerm(element) {
  let terms = JSON.parse(localStorage.getItem("terms"));
  terms[Number(element.id.split(":")[1])] = element.value;
  localStorage.setItem("terms", JSON.stringify(terms));
  reload = true;
}

function removeTerm(element) {
  let terms = JSON.parse(localStorage.getItem("terms"));
  terms.splice(Number(element.id.split(":")[1]), 1);
  localStorage.setItem("terms", JSON.stringify(terms));
  reload = true;
  loadGlobalTerms();
}

function loadGlobalTerms() {
  if (typeof localStorage.getItem("terms") == "null") {
    localStorage.setItem("terms", "[]");
  }
  let terms = JSON.parse(localStorage.getItem("terms"));

  let globalSearchTerms = document.getElementById("globalSearchTerms");
  globalSearchTerms.innerHTML = "";
  let i = 0;
  for (var each of terms) {
    globalSearchTerms.innerHTML += `
    <div>
        <input id="term:${i}" onchange="updateTerm(this)" value="" placeholder="Enter Your Term(s)...">
        <span  onclick="removeTerm(this.previousElementSibling)">&times;</span>
    </div>`;
    document.getElementById(`term:${i}`).setAttribute("value", each);
    i += 1;
  }
}
