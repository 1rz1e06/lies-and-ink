(() => {
  "use strict";

  const MAX_WORKS = 100;

  const shelvesElement = document.getElementById("shelves");
  const shelfFocusElement = document.getElementById("shelfFocus");
  const focusCategoryElement = document.getElementById("focusCategory");
  const focusBooksElement = document.getElementById("focusBooks");
  const transitionElement = document.getElementById("studyTransition");
  const transitionCategoryElement =
    document.getElementById("transitionCategory");
  const scrollIndicatorElement =
    document.getElementById("scrollIndicator");

  const categories = window.LiesInk?.categories || [];

  let selectedShelf = null;

  function padNumber(number) {
    return String(number).padStart(2, "0");
  }

  async function fetchStoryTitle(category, workNumber) {
    const number = padNumber(workNumber);
    const url = `../work/${category.id}/${number}/story.txt`;

    try {
      const response = await fetch(url, {
        cache: "no-store"
      });

      if (!response.ok) {
        return null;
      }

      const text = await response.text();

      const lines = text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split("\n");

      const title = lines.find((line) => line.trim() !== "");

      if (!title) {
        return null;
      }

      return {
        number,
        title: title.trim()
      };
    } catch (error) {
      console.warn(`読み込み失敗: ${url}`, error);
      return null;
    }
  }

  async function loadCategoryWorks(category) {
    const works = [];

    for (let number = 1; number <= MAX_WORKS; number++) {
      const work = await fetchStoryTitle(category, number);

      if (!work) {
        break;
      }

      works.push(work);
    }

    return works;
  }

  function createBook(work) {
    const book = document.createElement("button");

    book.type = "button";
    book.className = "study-book";
    book.dataset.work = work.number;
    book.setAttribute("aria-label", work.title);

    const spine = document.createElement("span");
    spine.className = "study-book__spine";

    const number = document.createElement("span");
    number.className = "study-book__number";
    number.textContent = work.number;

    const title = document.createElement("span");
    title.className = "study-book__title";
    title.textContent = work.title;

    spine.appendChild(number);
    spine.appendChild(title);

    book.appendChild(spine);

    return book;
  }

  function createShelf(category, works) {
    const shelf = document.createElement("article");
    shelf.className = "shelf";
    shelf.dataset.category = category.id;

    shelf.style.setProperty("--category-color", category.color);

    const name = document.createElement("button");
    name.type = "button";
    name.className = "shelf__name";
    name.textContent = category.name;

    name.addEventListener("click", () => {
      selectShelf(shelf, category, works);
    });

    const books = document.createElement("div");
    books.className = "shelf__books";

    works.forEach((work) => {
      const book = createBook(work);

      book.addEventListener("click", (event) => {
        event.stopPropagation();

        selectShelf(shelf, category, works);
        selectBook(book, works);
      });

      books.appendChild(book);
    });

    shelf.appendChild(name);
    shelf.appendChild(books);

    return shelf;
  }

  function selectShelf(shelf, category, works) {
    const wasSelected = selectedShelf === shelf;

    document
      .querySelectorAll(".shelf")
      .forEach((item) => {
        item.classList.remove("is-selected");
      });

    if (wasSelected) {
      selectedShelf = null;
      shelvesElement.classList.remove("has-selection");
      shelfFocusElement.classList.remove("is-visible");
      return;
    }

    selectedShelf = shelf;

    shelf.classList.add("is-selected");
    shelvesElement.classList.add("has-selection");

    focusCategoryElement.textContent = category.name;

    focusBooksElement.innerHTML = "";

    works.forEach((work) => {
      const book = createBook(work);
      book.classList.add("shelf-focus__book");

      book.addEventListener("click", () => {
        openBookshelf(category, work.number);
      });

      focusBooksElement.appendChild(book);
    });

    shelfFocusElement.classList.add("is-visible");

    const firstBook = shelf.querySelector(".study-book");

    if (firstBook) {
      firstBook.classList.add("is-selected");
    }
  }

  function selectBook(book, works) {
    const workNumber = book.dataset.work;

    document
      .querySelectorAll(".study-book")
      .forEach((item) => {
        item.classList.remove("is-selected");
      });

    book.classList.add("is-selected");

    const work = works.find(
      (item) => item.number === workNumber
    );

    if (!work) {
      return;
    }

    openBookshelf(
      categories.find(
        (category) =>
          category.id === selectedShelf?.dataset.category
      ),
      work.number
    );
  }

  function openBookshelf(category, workNumber) {
    if (!category) {
      return;
    }

    transitionCategoryElement.textContent = category.name;
    transitionElement.classList.add("is-visible");

    window.setTimeout(() => {
      const url =
        `../bookshelf/index.html?category=${encodeURIComponent(category.id)}` +
        `&work=${encodeURIComponent(workNumber)}`;

      window.location.href = url;
    }, 500);
  }

  async function initialize() {
    if (!shelvesElement || !categories.length) {
      return;
    }

    const results = await Promise.all(
      categories.map(async (category) => {
        const works = await loadCategoryWorks(category);

        return {
          category,
          works
        };
      })
    );

    shelvesElement.innerHTML = "";

    results.forEach(({ category, works }) => {
      const shelf = createShelf(category, works);

      shelvesElement.appendChild(shelf);
    });

    if (scrollIndicatorElement) {
      scrollIndicatorElement.classList.add("is-visible");
    }
  }

  initialize();
})();
