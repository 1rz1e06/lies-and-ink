/* =========================================================
   Lies & Ink
   STUDY
   ========================================================= */

(() => {
  "use strict";

  /* =======================================================
     SETTINGS
     ======================================================= */

  /*
   * STUDY上に表示するダミー本の数。
   *
   * 実際の作品数とは関係ありません。
   *
   * 作品が増えても、この数は変わりません。
   */
  const DUMMY_BOOK_COUNT = 7;

  /*
   * BOOKSHELFへ移動するときに開く作品。
   *
   * 現在は各カテゴリの先頭作品「01」。
   */
  const FIRST_WORK_NUMBER = "01";


  /* =======================================================
     ELEMENTS
     ======================================================= */

  const shelvesElement =
    document.getElementById("shelves");

  const shelfFocusElement =
    document.getElementById("shelfFocus");

  const focusCategoryElement =
    document.getElementById("focusCategory");

  const focusBooksElement =
    document.getElementById("focusBooks");

  const transitionElement =
    document.getElementById("studyTransition");

  const transitionCategoryElement =
    document.getElementById(
      "transitionCategory"
    );

  const scrollIndicatorElement =
    document.getElementById(
      "scrollIndicator"
    );


  /* =======================================================
     DATA
     ======================================================= */

  const categories =
    window.LiesInk?.categories || [];


  /* =======================================================
     STATE
     ======================================================= */

  let selectedShelf = null;


  /* =======================================================
     DUMMY WORKS
     ======================================================= */

  /*
   * 実際の作品データは読み込まない。
   *
   * STUDYでは「本が並んでいる」という
   * 見た目だけを一定数表示する。
   *
   * 作品タイトルも表示しないため、
   * 空のタイトルで問題ない。
   */

  function createDummyWorks() {
    const works = [];

    for (
      let number = 1;
      number <= DUMMY_BOOK_COUNT;
      number += 1
    ) {
      works.push({
        number:
          String(number).padStart(2, "0"),

        title: ""
      });
    }

    return works;
  }


  /* =======================================================
     CREATE BOOK
     ======================================================= */

  function createBook(work) {
    const book =
      document.createElement("button");

    book.type = "button";

    book.className =
      "study-book";

    /*
     * 見た目上の番号。
     *
     * CSS側で文字は非表示になっています。
     */

    book.dataset.work =
      work.number;

    /*
     * STUDYでは作品タイトルを表示しない。
     */

    book.setAttribute(
      "aria-label",
      "Book"
    );


    /*
     * 背表紙
     */

    const spine =
      document.createElement("span");

    spine.className =
      "study-book__spine";


    /*
     * 番号
     *
     * 現在のCSSでは表示されません。
     * 将来的に必要になった場合にも
     * DOMだけは残しておきます。
     */

    const number =
      document.createElement("span");

    number.className =
      "study-book__number";

    number.textContent =
      work.number;


    /*
     * タイトル
     *
     * STUDYでは表示しません。
     */

    const title =
      document.createElement("span");

    title.className =
      "study-book__title";

    title.textContent =
      "";


    spine.appendChild(
      number
    );

    spine.appendChild(
      title
    );

    book.appendChild(
      spine
    );


    return book;
  }


  /* =======================================================
     CREATE SHELF
     ======================================================= */

  function createShelf(
    category,
    works
  ) {
    const shelf =
      document.createElement(
        "article"
      );

    shelf.className =
      "shelf";

    shelf.dataset.category =
      category.id;

    shelf.style.setProperty(
      "--category-color",
      category.color
    );


    /* -------------------------------------------------------
       Shelf Name
       ------------------------------------------------------- */

    const name =
      document.createElement(
        "button"
      );

    name.type = "button";

    name.className =
      "shelf__name";

    name.textContent =
      category.name;


    name.addEventListener(
      "click",
      () => {
        selectShelf(
          shelf,
          category,
          works
        );
      }
    );


    /* -------------------------------------------------------
       Books
       ------------------------------------------------------- */

    const books =
      document.createElement(
        "div"
      );

    books.className =
      "shelf__books";


    works.forEach(
      (work) => {
        const book =
          createBook(work);


        book.addEventListener(
          "click",
          (event) => {
            event.stopPropagation();

            selectShelf(
              shelf,
              category,
              works
            );

            selectBook(
              book,
              category,
              works
            );
          }
        );


        books.appendChild(
          book
        );
      }
    );


    shelf.appendChild(
      name
    );

    shelf.appendChild(
      books
    );


    return shelf;
  }


  /* =======================================================
     SELECT SHELF
     ======================================================= */

  function selectShelf(
    shelf,
    category,
    works
  ) {
    const wasSelected =
      selectedShelf === shelf;


    /*
     * 既存の選択状態を解除。
     */

    document
      .querySelectorAll(
        ".shelf"
      )
      .forEach(
        (item) => {
          item.classList.remove(
            "is-selected"
          );
        }
      );


    /*
     * 同じ棚をもう一度押した場合。
     */

    if (wasSelected) {
      selectedShelf = null;

      shelvesElement.classList.remove(
        "has-selection"
      );

      shelfFocusElement.classList.remove(
        "is-visible"
      );

      return;
    }


    selectedShelf =
      shelf;


    shelf.classList.add(
      "is-selected"
    );

    shelvesElement.classList.add(
      "has-selection"
    );


    /*
     * Focus表示
     */

    focusCategoryElement.textContent =
      category.name;


    focusBooksElement.innerHTML =
      "";


    /*
     * Focus側にも
     * 同じ数のダミー本を表示。
     */

    works.forEach(
      (work) => {
        const book =
          createBook(work);

        book.classList.add(
          "shelf-focus__book"
        );


        /*
         * Focus画面で本を選択した場合も
         * BOOKSHELFでは01を開く。
         */

        book.addEventListener(
          "click",
          () => {
            openBookshelf(
              category,
              FIRST_WORK_NUMBER
            );
          }
        );


        focusBooksElement.appendChild(
          book
        );
      }
    );


    shelfFocusElement.classList.add(
      "is-visible"
    );


    /*
     * 棚を選択しただけの場合は
     * 先頭の本を浮き上がらせる。
     */

    const firstBook =
      shelf.querySelector(
        ".study-book"
      );

    if (firstBook) {
      firstBook.classList.add(
        "is-selected"
      );
    }
  }


  /* =======================================================
     SELECT BOOK
     ======================================================= */

  function selectBook(
    book,
    category,
    works
  ) {
    /*
     * STUDY上の全ての本の
     * 選択状態を解除。
     */

    document
      .querySelectorAll(
        ".study-book"
      )
      .forEach(
        (item) => {
          item.classList.remove(
            "is-selected"
          );
        }
      );


    /*
     * 今選択した本を浮き上がらせる。
     *
     * ここは以前の動作を維持。
     */

    book.classList.add(
      "is-selected"
    );


    /*
     * 重要。
     *
     * STUDYの本はダミーなので、
     * 選択した本の番号は
     * 実際の作品番号として使用しない。
     *
     * 必ず先頭作品「01」を
     * BOOKSHELFで開く。
     */

    openBookshelf(
      category,
      FIRST_WORK_NUMBER
    );
  }


  /* =======================================================
     OPEN BOOKSHELF
     ======================================================= */

  function openBookshelf(
    category,
    workNumber
  ) {
    if (!category) {
      return;
    }


    /*
     * Transition
     */

    transitionCategoryElement.textContent =
      category.name;


    /*
     * カテゴリカラーを
     * Transitionにも渡す。
     */

    transitionElement.style.setProperty(
      "--transition-color",
      category.color
    );


    transitionElement.classList.add(
      "is-visible"
    );


    /*
     * BOOKSHELFへ移動。
     *
     * 必ずカテゴリの01を指定。
     */

    window.setTimeout(
      () => {
        const url =
          `../bookshelf/index.html?category=${encodeURIComponent(
            category.id
          )}` +
          `&work=${encodeURIComponent(
            workNumber
          )}`;

        window.location.href =
          url;
      },
      500
    );
  }


  /* =======================================================
     INITIALIZE
     ======================================================= */

  function initialize() {
    if (
      !shelvesElement ||
      !categories.length
    ) {
      return;
    }


    /*
     * 実際のstory.txtは一切取得しない。
     *
     * 全カテゴリに同じ数の
     * ダミー本を表示する。
     */

    shelvesElement.innerHTML =
      "";


    categories.forEach(
      (category) => {
        const works =
          createDummyWorks();


        const shelf =
          createShelf(
            category,
            works
          );


        shelvesElement.appendChild(
          shelf
        );
      }
    );


    /*
     * Scroll Indicator
     */

    if (
      scrollIndicatorElement
    ) {
      scrollIndicatorElement.classList.add(
        "is-visible"
      );
    }
  }


  /* =======================================================
     START
     ======================================================= */

  initialize();

})();

