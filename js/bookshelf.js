(() => {
  "use strict";

  const MAX_WORKS = 100;

  const bookshelfElement =
    document.querySelector(".bookshelf");

  const trackElement =
    document.getElementById("bookshelfTrack");

  const categoryNameElement =
    document.getElementById("categoryName");

  const workInfoElement =
    document.getElementById("workInfo");

  const workNumberElement =
    document.getElementById("workNumber");

  const workTitleElement =
    document.getElementById("workTitle");

  const workMetaElement =
    document.getElementById("workMeta");

  const workDescriptionElement =
    document.getElementById("workDescription");

  const openWorkButton =
    document.getElementById("openWork");

  const hintElement =
    document.getElementById("bookshelfHint");

  const transitionElement =
    document.getElementById("bookshelfTransition");

  const transitionTitleElement =
    document.getElementById("transitionTitle");

  const backToStudyElement =
    document.getElementById("backToStudy");


  const categories =
    window.LiesInk?.categories || [];


  const params =
    new URLSearchParams(
      window.location.search
    );


  const categoryId =
    params.get("category");


  const initialWork =
    params.get("work");


  let category = null;

  let works = [];

  let currentIndex = 0;

  let touchStartX = 0;

  let touchStartY = 0;


  /* =========================================================
     UTILITY
     ========================================================= */

  function padNumber(number) {
    return String(number).padStart(2, "0");
  }


  function getCategory() {
    return categories.find(
      (item) => item.id === categoryId
    );
  }


  function getWorkBaseUrl(workNumber) {
    return (
      `../work/${category.id}/${padNumber(workNumber)}`
    );
  }


  /* =========================================================
     STORY
     ========================================================= */

  async function fetchStory(workNumber) {

    const url =
      `${getWorkBaseUrl(workNumber)}/story.txt`;


    try {

      const response =
        await fetch(url, {
          cache: "no-store"
        });


      if (!response.ok) {
        return null;
      }


      const text =
        await response.text();


      const normalized =
        text
          .replace(/\r\n/g, "\n")
          .replace(/\r/g, "\n");


      const lines =
        normalized.split("\n");


      const titleIndex =
        lines.findIndex(
          (line) => line.trim() !== ""
        );


      if (titleIndex === -1) {
        return null;
      }


      const title =
        lines[titleIndex].trim();


      return {
        number: padNumber(workNumber),
        title
      };

    } catch (error) {

      console.warn(
        `story.txt の読み込みに失敗しました: ${url}`,
        error
      );

      return null;
    }
  }


  /* =========================================================
     INFO

     info.txt は自由記述。
     固定の書式・項目は一切使用しない。
  ========================================================= */

  async function fetchInfo(workNumber) {

    const url =
      `${getWorkBaseUrl(workNumber)}/info.txt`;


    try {

      const response =
        await fetch(url, {
          cache: "no-store"
        });


      /*
       * info.txt がない場合も
       * 作品自体は表示する。
       */

      if (!response.ok) {
        return "";
      }


      const text =
        await response.text();


      return text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();

    } catch (error) {

      console.warn(
        `info.txt の読み込みに失敗しました: ${url}`,
        error
      );

      return "";
    }
  }


  /* =========================================================
     COVER IMAGE

     cover.jpg があるか確認。
     なければ null。
  ========================================================= */

  async function checkCover(workNumber) {

    const url =
      `${getWorkBaseUrl(workNumber)}/cover.jpg`;


    try {

      const response =
        await fetch(url, {
          method: "HEAD",
          cache: "no-store"
        });


      if (
        response.ok &&
        response.headers
          .get("content-type")
          ?.startsWith("image/")
      ) {
        return url;
      }


      /*
       * Cloudflare Pagesなどの環境によっては
       * HEADのContent-Type判定が期待通りでない場合があるため、
       * HTTP 200なら画像候補として扱う。
       */

      if (response.ok) {
        return url;
      }


      return null;

    } catch (error) {

      return null;
    }
  }


  /* =========================================================
     R MARK

     作品フォルダに R.txt が存在する場合、
     R指定作品として扱う。

     R.txt の中身は不要。
     空ファイルでもOK。
  ========================================================= */

  async function checkRMark(workNumber) {

    const url =
      `${getWorkBaseUrl(workNumber)}/R.txt`;


    try {

      const response =
        await fetch(url, {
          method: "HEAD",
          cache: "no-store"
        });


      /*
       * R.txt が存在すればR指定。
       */

      return response.ok;

    } catch (error) {

      /*
       * HEADが使えない環境への保険としてGETを試す。
       */

      try {

        const response =
          await fetch(url, {
            cache: "no-store"
          });

        return response.ok;

      } catch (fallbackError) {

        return false;
      }
    }
  }


  /* =========================================================
     WORK LOADING
  ========================================================= */

  async function loadWork(workNumber) {

    const story =
      await fetchStory(workNumber);


    /*
     * story.txt がない番号で終了。
     */

    if (!story) {
      return null;
    }


    const [
      info,
      cover,
      isR
    ] = await Promise.all([
      fetchInfo(workNumber),
      checkCover(workNumber),
      checkRMark(workNumber)
    ]);


    return {
      number: story.number,
      title: story.title,
      info,
      cover,
      isR
    };
  }


  /* =========================================================
     LOAD ALL WORKS
  ========================================================= */

  async function loadWorks() {

    const loadedWorks = [];


    for (
      let number = 1;
      number <= MAX_WORKS;
      number++
    ) {

      const work =
        await loadWork(number);


      /*
       * 01 → 02 → 03 → …
       *
       * 最初にstory.txtがないところで終了。
       */

      if (!work) {
        break;
      }


      loadedWorks.push(work);
    }


    return loadedWorks;
  }


  /* =========================================================
     DESCRIPTION
  ========================================================= */

  function renderDescription(text) {

    if (!workDescriptionElement) {
      return;
    }


    workDescriptionElement.innerHTML = "";


    if (!text) {

      workDescriptionElement.hidden = true;

      return;
    }


    workDescriptionElement.hidden = false;


    /*
     * 空行を段落として扱う。
     */

    const paragraphs =
      text
        .split(/\n\s*\n/)
        .map(
          (paragraph) =>
            paragraph.trim()
        )
        .filter(Boolean);


    paragraphs.forEach(
      (paragraph) => {

        const p =
          document.createElement("p");


        /*
         * textContentを使用することで
         * HTMLとして解釈されないようにする。
         */

        const lines =
          paragraph.split("\n");


        lines.forEach(
          (line, index) => {

            p.appendChild(
              document.createTextNode(line)
            );


            if (
              index <
              lines.length - 1
            ) {

              p.appendChild(
                document.createElement("br")
              );

            }

          }
        );


        workDescriptionElement.appendChild(p);
      }
    );
  }


  /* =========================================================
     WORK INFO
  ========================================================= */

  function renderWorkInfo(work) {

    workNumberElement.textContent =
      work.number;


    workTitleElement.textContent =
      work.title;


    /*
     * 固定形式のメタ情報は使用しない。
     */

    if (workMetaElement) {

      workMetaElement.innerHTML = "";

      workMetaElement.hidden = true;
    }


    renderDescription(work.info);
  }


  /* =========================================================
     R MARK ELEMENT
  ========================================================= */

  function createRMark(work) {

    if (!work.isR) {
      return null;
    }


    const mark =
      document.createElement("span");


    mark.className =
      "book__r-mark";


    mark.textContent =
      "R";


    mark.setAttribute(
      "aria-label",
      "R指定作品"
    );


    return mark;
  }


  /* =========================================================
     BOOK CREATION
  ========================================================= */

  function createBook(work, index) {

    const book =
      document.createElement("button");


    book.type = "button";

    book.className = "book";

    book.dataset.index =
      String(index);

    book.dataset.work =
      work.number;


    /*
     * R指定作品の場合
     * Rマークを作成。
     *
     * 実際に表示されるのは
     * 中央に選択されたときだけ。
     */

    const rMark =
      createRMark(work);


    if (rMark) {
      book.appendChild(rMark);
    }


    /*
     * 書影がある場合
     */

    if (work.cover) {

      book.classList.add(
        "book--has-cover"
      );


      const cover =
        document.createElement("span");

      cover.className =
        "book__cover";


      const image =
        document.createElement("img");

      image.className =
        "book__cover-image";


      image.src =
        work.cover;


      image.alt =
        `${work.title} の書影`;


      image.loading =
        "lazy";


      image.decoding =
        "async";


      /*
       * 画像が読み込めなかった場合は
       * 文字装丁へ戻す。
       */

      image.addEventListener(
        "error",
        () => {

          book.classList.remove(
            "book--has-cover"
          );


          cover.innerHTML =
            createFallbackCover(
              work
            );

        }
      );


      cover.appendChild(image);

      book.appendChild(cover);

    } else {

      /*
       * 書影がない場合
       * 文字ベースの装丁。
       */

      const cover =
        document.createElement("span");

      cover.className =
        "book__cover";


      cover.innerHTML =
        createFallbackCover(work);


      book.appendChild(cover);
    }


    /*
     * 背表紙番号
     */

    const spineNumber =
      document.createElement("span");


    spineNumber.className =
      "book__spine-number";


    spineNumber.textContent =
      work.number;


    book.appendChild(spineNumber);


    /*
     * クリック
     */

    book.addEventListener(
      "click",
      () => {
        selectWork(index);
      }
    );


    return book;
  }


  /* =========================================================
     FALLBACK COVER
  ========================================================= */

  function createFallbackCover(work) {

    const wrapper =
      document.createElement("span");


    wrapper.className =
      "book__cover-fallback";


    const number =
      document.createElement("span");


    number.className =
      "book__cover-number";


    number.textContent =
      work.number;


    const title =
      document.createElement("span");


    title.className =
      "book__cover-title";


    title.textContent =
      work.title;


    wrapper.appendChild(number);

    wrapper.appendChild(title);


    /*
     * outerHTMLを返すのではなく、
     * DOM構築用の文字列として使用。
     *
     * titleはinnerHTMLではなくtextContentで
     * 設定しているので安全。
     */

    return wrapper.outerHTML;
  }


  /* =========================================================
     R MARK STATE
  ========================================================= */

  function updateRMark() {

    const books =
      trackElement.querySelectorAll(
        ".book"
      );


    books.forEach(
      (book, index) => {

        const mark =
          book.querySelector(
            ".book__r-mark"
          );


        if (!mark) {
          return;
        }


        const isCurrent =
          index === currentIndex;


        mark.classList.toggle(
          "is-visible",
          isCurrent
        );
      }
    );
  }


  /* =========================================================
     R MARK STYLE

     中央に選択された表紙の
     右上へ赤いRマークを表示。

     表紙の外側には出さない。
     そのため overflow:hidden によって
     消えることもありません。
  ========================================================= */

  function setupRMarkStyle() {

  if (
    document.getElementById(
      "bookshelf-r-mark-style"
    )
  ) {
    return;
  }


  const style =
    document.createElement("style");


  style.id =
    "bookshelf-r-mark-style";


  style.textContent = `
    /*
     * R指定マーク
     *
     * 静かな書斎・古書の雰囲気に合わせた
     * 控えめな縦長ラベル。
     */

    .book__r-mark {
      position: absolute;

      top: .5rem;
      right: .5rem;

      z-index: 50;

      display: flex;

      align-items: center;
      justify-content: center;

      width: 1.35rem;
      height: 1.8rem;

      box-sizing: border-box;

      border: 1px solid rgba(143, 63, 63, .72);

      background:
        rgba(16, 24, 39, .82);

      color:
        rgba(172, 91, 91, .92);

      font-family:
        "Times New Roman",
        "Yu Mincho",
        "Hiragino Mincho ProN",
        serif;

      font-size: .78rem;

      font-weight: 400;

      line-height: 1;

      letter-spacing: .02em;

      opacity: 0;

      visibility: hidden;

      transform:
        translateY(-.15rem);

      transition:
        opacity .35s ease,
        visibility .35s ease,
        transform .35s ease;

      pointer-events: none;
    }


    /*
     * 上下に細い装飾線を追加。
     *
     * Rそのものを目立たせるのではなく、
     * 古い本のラベルのような印象にする。
     */

    .book__r-mark::before,
    .book__r-mark::after {
      content: "";

      position: absolute;

      left: .25rem;
      right: .25rem;

      height: 1px;

      background:
        rgba(143, 63, 63, .5);
    }


    .book__r-mark::before {
      top: .25rem;
    }


    .book__r-mark::after {
      bottom: .25rem;
    }


    /*
     * 中央に選択された本だけ表示。
     */

    .book__r-mark.is-visible {
      opacity: 1;

      visibility: visible;

      transform:
        translateY(0);
    }


    /*
     * 小さいスマートフォン
     */

    @media (max-width: 380px) {

      .book__r-mark {
        top: .4rem;
        right: .4rem;

        width: 1.2rem;
        height: 1.6rem;

        font-size: .7rem;
      }


      .book__r-mark::before,
      .book__r-mark::after {
        left: .22rem;
        right: .22rem;
      }

    }


    /*
     * タブレット・PC
     */

    @media (min-width: 700px) {

      .book__r-mark {
        top: .6rem;
        right: .6rem;

        width: 1.5rem;
        height: 2rem;

        font-size: .85rem;
      }

    }
  `;


  document.head.appendChild(style);
}


  /* =========================================================
     R MARK DEBUG

     R.txt が正しく認識されているかを
     コンソールで確認しやすくするための処理。
  ========================================================= */

  function logRWorks() {

    const rWorks =
      works.filter(
        (work) => work.isR
      );


    if (!rWorks.length) {
      return;
    }


    console.info(
      "R指定作品:",
      rWorks.map(
        (work) =>
          `${work.number} ${work.title}`
      )
    );
  }


  /* =========================================================
     R MARK VISIBILITY

     現在中央にある本だけRを表示。
  ========================================================= */

  function refreshRMark() {

    updateRMark();

    /*
     * 現在の本がR指定かどうかも
     * data属性として保持。
     *
     * 必要になった場合にCSS側から
     * 状態を参照できるようにする。
     */

    if (!bookshelfElement) {
      return;
    }


    const currentWork =
      works[currentIndex];


    bookshelfElement.dataset.currentR =
      currentWork?.isR
        ? "true"
        : "false";
  }


  /* =========================================================
     RENDER BOOKS
  ========================================================= */

  function renderBooks() {

    trackElement.innerHTML = "";


    works.forEach(
      (work, index) => {

        const book =
          createBook(
            work,
            index
          );


        trackElement.appendChild(book);
      }
    );
  }


  /* =========================================================
     CENTER BOOK
  ========================================================= */

  function centerCurrentBook(
    instant = false
  ) {

    const books =
      trackElement.querySelectorAll(
        ".book"
      );


    if (!books.length) {
      return;
    }


    const currentBook =
      books[currentIndex];


    if (!currentBook) {
      return;
    }


    const viewport =
      document.querySelector(
        ".bookshelf-view"
      );


    if (!viewport) {
      return;
    }


    const viewportRect =
      viewport.getBoundingClientRect();


    const bookRect =
      currentBook.getBoundingClientRect();


    const currentCenter =
      bookRect.left +
      bookRect.width / 2;


    const viewportCenter =
      viewportRect.left +
      viewportRect.width / 2;


    const difference =
      viewportCenter -
      currentCenter;


    let currentX = 0;


    const currentTransform =
      getComputedStyle(
        trackElement
      ).transform;


    if (
      currentTransform &&
      currentTransform !== "none"
    ) {

      try {

        const matrix =
          new DOMMatrix(
            currentTransform
          );


        currentX =
          matrix.m41;

      } catch (error) {

        currentX = 0;
      }
    }


    const nextX =
      currentX + difference;


    if (instant) {

      trackElement.classList.add(
        "is-instant"
      );

    } else {

      trackElement.classList.remove(
        "is-instant"
      );

    }


    trackElement.style.transform =
      `translate3d(${nextX}px, 0, 0)`;


    if (instant) {

      requestAnimationFrame(() => {

        trackElement.classList.remove(
          "is-instant"
        );

      });

    }
  }


  /* =========================================================
     SELECT WORK
  ========================================================= */

  function selectWork(
    index,
    instant = false
  ) {

    if (!works.length) {
      return;
    }


    if (index < 0) {
      index = 0;
    }


    if (index >= works.length) {
      index =
        works.length - 1;
    }


    currentIndex =
      index;


    const books =
      trackElement.querySelectorAll(
        ".book"
      );


    books.forEach(
      (book, bookIndex) => {

        book.classList.toggle(
          "is-center",
          bookIndex === currentIndex
        );

      }
    );


    const work =
      works[currentIndex];


    renderWorkInfo(work);


    centerCurrentBook(
      instant
    );


    /*
     * 中央の作品がR指定なら
     * 右上のRマークを表示。
     */

    refreshRMark();


    updateHint();


    if (workInfoElement) {

      workInfoElement.classList.add(
        "is-visible"
      );

    }
  }


  /* =========================================================
     MOVE
  ========================================================= */

  function moveWork(direction) {

    if (!works.length) {
      return;
    }


    const nextIndex =
      currentIndex + direction;


    if (
      nextIndex < 0 ||
      nextIndex >= works.length
    ) {
      return;
    }


    selectWork(nextIndex);
  }


  /* =========================================================
     HINT
  ========================================================= */

  function updateHint() {

    if (!hintElement) {
      return;
    }


    if (works.length <= 1) {

      hintElement.hidden = true;

      return;
    }


    hintElement.hidden = false;
  }


  /* =========================================================
     OPEN WORK
  ========================================================= */

  function openCurrentWork() {

    if (!works.length) {
      return;
    }


    const work =
      works[currentIndex];


    const url =
      `../work/index.html` +
      `?category=${encodeURIComponent(category.id)}` +
      `&work=${encodeURIComponent(work.number)}`;


    showTransition(
      work.title
    );


    window.setTimeout(
      () => {

        window.location.href =
          url;

      },
      450
    );
  }


  /* =========================================================
     TRANSITION
  ========================================================= */

  function showTransition(title) {

    if (!transitionElement) {
      return;
    }


    if (transitionTitleElement) {

      transitionTitleElement.textContent =
        title;
    }


    transitionElement.classList.add(
      "is-visible"
    );
  }


  /* =========================================================
     BACK TO STUDY
  ========================================================= */

  function setupBackButton() {

    if (
      !backToStudyElement ||
      !category
    ) {
      return;
    }


    backToStudyElement.href =
      `../study/index.html?category=${encodeURIComponent(category.id)}`;
  }


  /* =========================================================
     TOUCH
  ========================================================= */

  function setupTouchEvents() {

    const viewport =
      document.querySelector(
        ".bookshelf-view"
      );


    if (!viewport) {
      return;
    }


    viewport.addEventListener(
      "touchstart",
      (event) => {

        const touch =
          event.touches[0];


        touchStartX =
          touch.clientX;


        touchStartY =
          touch.clientY;

      },
      {
        passive: true
      }
    );


    viewport.addEventListener(
      "touchend",
      (event) => {

        const touch =
          event.changedTouches[0];


        const deltaX =
          touch.clientX -
          touchStartX;


        const deltaY =
          touch.clientY -
          touchStartY;


        /*
         * 縦スクロールの操作は
         * スワイプとして扱わない。
         */

        if (
          Math.abs(deltaX) < 40 ||
          Math.abs(deltaX) <
            Math.abs(deltaY)
        ) {
          return;
        }


        if (deltaX < 0) {

          moveWork(1);

        } else {

          moveWork(-1);
        }

      },
      {
        passive: true
      }
    );
  }


  /* =========================================================
     KEYBOARD
  ========================================================= */

  function setupKeyboardEvents() {

    document.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key === "ArrowLeft"
        ) {

          event.preventDefault();

          moveWork(-1);

        }


        if (
          event.key === "ArrowRight"
        ) {

          event.preventDefault();

          moveWork(1);

        }


        if (
          event.key === "Enter" ||
          event.key === " "
        ) {

          const activeElement =
            document.activeElement;


          if (
            activeElement ===
              document.body ||
            activeElement ===
              trackElement
          ) {

            event.preventDefault();

            openCurrentWork();
          }
        }

      }
    );
  }


  /* =========================================================
     OPEN BUTTON
  ========================================================= */

  function setupOpenButton() {

    if (!openWorkButton) {
      return;
    }


    openWorkButton.addEventListener(
      "click",
      openCurrentWork
    );
  }


  /* =========================================================
     RESIZE
  ========================================================= */

  function setupResize() {

    window.addEventListener(
      "resize",
      () => {

        centerCurrentBook(
          true
        );

        /*
         * サイズ変更後も
         * Rマークの表示状態を維持。
         */

        refreshRMark();

      }
    );
  }


  /* =========================================================
     CATEGORY COLOR
  ========================================================= */

  function setupCategoryColor() {

    if (
      !category ||
      !bookshelfElement
    ) {
      return;
    }


    bookshelfElement.style.setProperty(
      "--category-color",
      category.color
    );
  }


  /* =========================================================
     EMPTY
  ========================================================= */

  function renderEmpty() {

    trackElement.innerHTML = "";


    const empty =
      document.createElement("p");


    empty.className =
      "bookshelf-empty";


    empty.textContent =
      "NO BOOK";


    trackElement.appendChild(
      empty
    );


    if (workInfoElement) {

      workInfoElement.classList.remove(
        "is-visible"
      );
    }


    if (hintElement) {

      hintElement.hidden = true;
    }
  }


  /* =========================================================
     INITIAL INDEX
  ========================================================= */

  function getInitialIndex() {

    if (!initialWork) {
      return 0;
    }


    const normalized =
      padNumber(
        Number(initialWork)
      );


    const index =
      works.findIndex(
        (work) =>
          work.number === normalized
      );


    return index >= 0
      ? index
      : 0;
  }


  /* =========================================================
     INITIALIZE
  ========================================================= */

  async function initialize() {

    if (
      !trackElement ||
      !categoryNameElement
    ) {
      return;
    }


    /*
     * Rマーク用のCSSを準備。
     */

    setupRMarkStyle();


    category =
      getCategory();


    if (!category) {

      categoryNameElement.textContent =
        "BOOKSHELF";


      renderEmpty();

      return;
    }


    categoryNameElement.textContent =
      category.name;


    setupCategoryColor();

    setupBackButton();


    /*
     * 作品を取得
     */

    works =
      await loadWorks();


    if (!works.length) {

      renderEmpty();

      return;
    }


    /*
     * 本を描画
     */

    renderBooks();


    /*
     * R指定作品を確認しやすくするための
     * コンソール表示。
     */

    logRWorks();


    /*
     * URLのwork=02などを
     * 初期選択位置に反映。
     */

    currentIndex =
      getInitialIndex();


    /*
     * DOM描画後に中央配置。
     */

    requestAnimationFrame(
      () => {

        selectWork(
          currentIndex,
          true
        );

      }
    );


    setupTouchEvents();

    setupKeyboardEvents();

    setupOpenButton();

    setupResize();
  }


  initialize();

})();
