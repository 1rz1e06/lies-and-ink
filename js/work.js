document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /* =========================================================
     Elements
  ========================================================= */

  const work = document.getElementById("work");

  const workCover = document.getElementById("workCover");
  const workCoverImage =
    document.getElementById("workCoverImage");

  const workTitleBlock =
    document.getElementById("workTitleBlock");

  const workNumber =
    document.getElementById("workNumber");

  const workTitle =
    document.getElementById("workTitle");

  const workInfo =
    document.getElementById("workInfo");

  const workDescription =
    document.getElementById("workDescription");

  const workReader =
    document.getElementById("workReader");

  const workPageView =
    document.getElementById("workPageView");

  const workBody =
    document.getElementById("workBody");

  const workPageIndicator =
    document.getElementById("workPageIndicator");

  const currentPage =
    document.getElementById("currentPage");

  const totalPages =
    document.getElementById("totalPages");

  const prevPage =
    document.getElementById("prevPage");

  const nextPage =
    document.getElementById("nextPage");

  const backToBookshelf =
    document.getElementById("backToBookshelf");

  const backToBookshelfFooter =
    document.getElementById("backToBookshelfFooter");

  const loading =
    document.getElementById("workLoading");

  const loadingText =
    document.getElementById("workLoadingText");


  /* =========================================================
     URL
  ========================================================= */

  const params =
    new URLSearchParams(
      window.location.search
    );

  const categoryId =
    params.get("category");

  const workParam =
    params.get("work");


  if (!categoryId || !workParam) {
    showError(
      "作品情報を取得できませんでした。"
    );
    return;
  }


  const workNumberValue =
    normalizeWorkNumber(workParam);


  if (!workNumberValue) {
    showError(
      "作品番号が正しくありません。"
    );
    return;
  }


  /* =========================================================
     Category
  ========================================================= */

  const categories =
    window.LiesInk &&
    Array.isArray(
      window.LiesInk.categories
    )
      ? window.LiesInk.categories
      : [];


  const category =
    categories.find(
      (item) =>
        item.id === categoryId
    );


  if (!category) {
    showError(
      "カテゴリーが見つかりませんでした。"
    );
    return;
  }


  if (work) {
    work.style.setProperty(
      "--category-color",
      category.color || "#6E91B5"
    );
  }


  /* =========================================================
     Paths
  ========================================================= */

  const workBasePath =
    `../work/${categoryId}/${workNumberValue}`;

  const storyPath =
    `${workBasePath}/story.txt`;

  const infoPath =
    `${workBasePath}/info.txt`;

  const coverPath =
    `${workBasePath}/cover.jpg`;


  /* =========================================================
     State
  ========================================================= */

  let pages = [];

  let pageIndex = 0;

  let touchStartX = 0;

  let touchStartY = 0;


  /*
   * ===PAGE=== がない場合の
   * 自動ページ分割目安
   */
  const AUTO_PAGE_CHAR_LIMIT = 7000;


  /* =========================================================
     Initialization
  ========================================================= */

  init();


  async function init() {

    setLoading(
      true,
      "LOADING"
    );


    try {

      const workData =
        await loadWork();


      if (
        !workData ||
        !workData.body
      ) {
        throw new Error(
          "story.txt に本文がありません。"
        );
      }


      renderWork(workData);


      pages =
        createPages(
          workData.body
        );


      if (!pages.length) {
        throw new Error(
          "本文をページに分割できませんでした。"
        );
      }


      pageIndex = 0;


      renderCurrentPage(false);


      /*
       * 表示アニメーション
       */
      window.requestAnimationFrame(() => {

        if (workCover) {
          workCover.classList.add(
            "is-visible"
          );
        }

        if (workTitleBlock) {
          workTitleBlock.classList.add(
            "is-visible"
          );
        }

        if (
          workInfo &&
          workData.info
        ) {
          workInfo.classList.add(
            "is-visible"
          );
        }

        if (workPageView) {
          workPageView.classList.add(
            "is-visible"
          );
        }

        if (workPageIndicator) {
          workPageIndicator.classList.add(
            "is-visible"
          );
        }

      });


      /*
       * Loading終了
       */
      setLoading(false);

    } catch (error) {

      console.error(
        "[Lies & Ink] WORK ERROR:",
        error
      );


      showError(
        "作品を読み込めませんでした。",
        error &&
        error.message
          ? error.message
          : ""
      );

    }

  }


  /* =========================================================
     Load work
  ========================================================= */

  async function loadWork() {

    /*
     * story.txt
     *
     * これは必須
     */

    const storyResponse =
      await fetchWithTimeout(
        storyPath,
        20000
      );


    if (!storyResponse.ok) {

      throw new Error(
        `story.txt の取得に失敗しました。HTTP ${storyResponse.status}`
      );

    }


    const storyText =
      await storyResponse.text();


    if (
      !storyText ||
      !storyText.trim()
    ) {

      throw new Error(
        "story.txt が空です。"
      );

    }


    const parsedStory =
      parseStory(storyText);


    /*
     * info.txt
     *
     * なくてもOK
     */

    let infoText = "";


    try {

      const infoResponse =
        await fetchWithTimeout(
          infoPath,
          10000
        );


      if (infoResponse.ok) {

        infoText =
          await infoResponse.text();

      }

    } catch (error) {

      console.warn(
        "[Lies & Ink] info.txt を読み込めませんでした。",
        error
      );

    }


    /*
     * cover.jpg
     *
     * なくてもOK
     *
     * ここでHEADは使用しません。
     */

    let cover = "";


    try {

      const exists =
        await checkImage(
          coverPath
        );


      if (exists) {
        cover = coverPath;
      }

    } catch (error) {

      console.warn(
        "[Lies & Ink] cover.jpg を読み込めませんでした。",
        error
      );

    }


    return {

      title:
        parsedStory.title,

      body:
        parsedStory.body,

      info:
        infoText.trim(),

      cover

    };

  }


  /* =========================================================
     Fetch with timeout
  ========================================================= */

  async function fetchWithTimeout(
    url,
    timeout = 20000
  ) {

    const controller =
      new AbortController();


    const timer =
      window.setTimeout(
        () => {
          controller.abort();
        },
        timeout
      );


    try {

      /*
       * キャッシュバスターは
       * story.txtの取得時だけ使用。
       */
      const separator =
        url.includes("?")
          ? "&"
          : "?";


      return await fetch(
        `${url}${separator}v=${Date.now()}`,
        {
          method: "GET",
          cache: "no-store",
          signal:
            controller.signal
        }
      );

    } catch (error) {

      if (
        error &&
        error.name === "AbortError"
      ) {

        throw new Error(
          `読み込みがタイムアウトしました: ${url}`
        );

      }


      throw error;

    } finally {

      window.clearTimeout(
        timer
      );

    }

  }


  /* =========================================================
     Parse story
  ========================================================= */

  function parseStory(text) {

    const normalized =
      text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/^\uFEFF/, "");


    const lines =
      normalized.split("\n");


    let title = "";

    let titleIndex = -1;


    for (
      let i = 0;
      i < lines.length;
      i++
    ) {

      if (
        lines[i].trim() !== ""
      ) {

        title =
          lines[i].trim();

        titleIndex = i;

        break;

      }

    }


    if (titleIndex === -1) {

      return {
        title: "Untitled",
        body: ""
      };

    }


    const body =
      lines
        .slice(titleIndex + 1)
        .join("\n")
        .trim();


    return {
      title,
      body
    };

  }


  /* =========================================================
     Create pages
  ========================================================= */

  function createPages(text) {

    const normalized =
      text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();


    if (!normalized) {
      return [];
    }


    /*
     * ---------------------------------------------------------
     * ===PAGE=== がある場合
     * ---------------------------------------------------------
     */

    if (
      /^\s*===PAGE===\s*$/m
        .test(normalized)
    ) {

      return normalized
        .split(
          /^\s*===PAGE===\s*$/gm
        )
        .map(
          (page) =>
            page.trim()
        )
        .filter(Boolean);

    }


    /*
     * ---------------------------------------------------------
     * ===PAGE=== がない場合
     * 自動ページ分割
     * ---------------------------------------------------------
     */

    return autoSplitPages(
      normalized,
      AUTO_PAGE_CHAR_LIMIT
    );

  }


  /* =========================================================
     Automatic page split
  ========================================================= */

  function autoSplitPages(
    text,
    limit
  ) {

    const paragraphs =
      text
        .split(/\n\s*\n/)
        .map(
          (paragraph) =>
            paragraph.trim()
        )
        .filter(Boolean);


    if (!paragraphs.length) {
      return [text];
    }


    const result = [];

    let current = "";

    let currentLength = 0;


    paragraphs.forEach(
      (paragraph) => {

        const length =
          paragraph.length;


        /*
         * まだページが空
         */
        if (!current) {

          current =
            paragraph;

          currentLength =
            length;

          return;

        }


        /*
         * まだ入る
         */
        if (
          currentLength +
          length +
          2 <=
          limit
        ) {

          current +=
            "\n\n" +
            paragraph;

          currentLength +=
            length + 2;

          return;

        }


        /*
         * 現在のページを確定
         */
        result.push(
          current.trim()
        );


        /*
         * 次ページ
         */
        current =
          paragraph;

        currentLength =
          length;

      }
    );


    if (
      current.trim()
    ) {

      result.push(
        current.trim()
      );

    }


    return result;

  }


  /* =========================================================
     Render work
  ========================================================= */

  function renderWork(data) {

    /*
     * Number
     */

    if (workNumber) {

      workNumber.textContent =
        workNumberValue;

    }


    /*
     * Title
     */

    if (workTitle) {

      workTitle.textContent =
        data.title ||
        "Untitled";

    }


    /*
     * Cover
     */

    if (
      data.cover &&
      workCover &&
      workCoverImage
    ) {

      workCoverImage.src =
        data.cover;

      workCoverImage.alt =
        `${data.title || "作品"} cover`;

      workCover.hidden = false;

    } else if (workCover) {

      workCover.hidden = true;

    }


    /*
     * Description
     */

    if (workDescription) {

      renderDescription(
        workDescription,
        data.info
      );

    }


    if (workInfo) {

      workInfo.hidden =
        !data.info;

    }


    /*
     * Bookshelf URL
     */

    const bookshelfUrl =
      `../bookshelf/index.html?category=${encodeURIComponent(
        categoryId
      )}&work=${encodeURIComponent(
        workNumberValue
      )}`;


    if (backToBookshelf) {

      backToBookshelf.href =
        bookshelfUrl;

    }


    if (backToBookshelfFooter) {

      backToBookshelfFooter.href =
        bookshelfUrl;

    }

  }


  /* =========================================================
     Description
  ========================================================= */

  function renderDescription(
    element,
    text
  ) {

    element.replaceChildren();


    if (!text) {
      return;
    }


    const paragraphs =
      text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
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


        const lines =
          paragraph.split("\n");


        lines.forEach(
          (line, index) => {

            p.appendChild(
              document.createTextNode(
                line
              )
            );


            if (
              index <
              lines.length - 1
            ) {

              p.appendChild(
                document.createElement(
                  "br"
                )
              );

            }

          }
        );


        element.appendChild(p);

      }
    );

  }


  /* =========================================================
     Render current page
  ========================================================= */

  function renderCurrentPage(
    animate = true
  ) {

    if (
      !workBody ||
      !workPageView
    ) {
      return;
    }


    const pageText =
      pages[pageIndex] || "";


    if (animate) {

      workPageView.classList.add(
        "is-page-changing"
      );

    }


    /*
     * ページ変更時は
     * ページ内スクロールを先頭へ
     */

    workPageView.scrollTop = 0;


    /*
     * 古い本文を削除
     */

    workBody.replaceChildren();


    /*
     * 現在ページを描画
     */

    renderStory(
      workBody,
      pageText
    );


    /*
     * ページ番号
     */

    if (currentPage) {

      currentPage.textContent =
        String(
          pageIndex + 1
        ).padStart(
          2,
          "0"
        );

    }


    if (totalPages) {

      totalPages.textContent =
        String(
          pages.length
        ).padStart(
          2,
          "0"
        );

    }


    /*
     * Prev
     */

    if (prevPage) {

      prevPage.disabled =
        pageIndex <= 0;

    }


    /*
     * Next
     */

    if (nextPage) {

      nextPage.disabled =
        pageIndex >=
        pages.length - 1;

    }


    /*
     * アニメーション解除
     */

    if (animate) {

      window.setTimeout(
        () => {

          workPageView.classList.remove(
            "is-page-changing"
          );

        },
        180
      );

    }

  }


  /* =========================================================
     Render story
  ========================================================= */

  function renderStory(
    element,
    text
  ) {

    const normalized =
      text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();


    if (!normalized) {
      return;
    }


    const paragraphs =
      normalized
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


        const lines =
          paragraph.split("\n");


        lines.forEach(
          (line, index) => {

            p.appendChild(
              document.createTextNode(
                line
              )
            );


            if (
              index <
              lines.length - 1
            ) {

              p.appendChild(
                document.createElement(
                  "br"
                )
              );

            }

          }
        );


        element.appendChild(p);

      }
    );

  }


  /* =========================================================
     Page navigation
  ========================================================= */

  function goToPage(index) {

    if (!pages.length) {
      return;
    }


    const nextIndex =
      Math.max(
        0,
        Math.min(
          index,
          pages.length - 1
        )
      );


    if (
      nextIndex === pageIndex
    ) {
      return;
    }


    pageIndex =
      nextIndex;


    renderCurrentPage(true);

  }


  if (prevPage) {

    prevPage.addEventListener(
      "click",
      () => {

        goToPage(
          pageIndex - 1
        );

      }
    );

  }


  if (nextPage) {

    nextPage.addEventListener(
      "click",
      () => {

        goToPage(
          pageIndex + 1
        );

      }
    );

  }


  /* =========================================================
     Keyboard
  ========================================================= */

  document.addEventListener(
    "keydown",
    (event) => {

      const active =
        document.activeElement;


      if (
        active &&
        (
          active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable
        )
      ) {

        return;

      }


      if (
        event.key === "ArrowLeft"
      ) {

        event.preventDefault();

        goToPage(
          pageIndex - 1
        );

      }


      if (
        event.key === "ArrowRight"
      ) {

        event.preventDefault();

        goToPage(
          pageIndex + 1
        );

      }


      if (
        event.key === " " &&
        !event.shiftKey
      ) {

        event.preventDefault();

        goToPage(
          pageIndex + 1
        );

      }

    }
  );


  /* =========================================================
     Touch swipe
  ========================================================= */

  if (workPageView) {

    workPageView.addEventListener(
      "touchstart",
      (event) => {

        if (
          !event.touches.length
        ) {
          return;
        }


        touchStartX =
          event.touches[0].clientX;

        touchStartY =
          event.touches[0].clientY;

      },
      {
        passive: true
      }
    );


    workPageView.addEventListener(
      "touchend",
      (event) => {

        if (
          !event.changedTouches.length
        ) {
          return;
        }


        const touch =
          event.changedTouches[0];


        const deltaX =
          touch.clientX -
          touchStartX;


        const deltaY =
          touch.clientY -
          touchStartY;


        /*
         * 縦スクロールなら
         * ページ移動しない
         */

        if (
          Math.abs(deltaX) <=
          Math.abs(deltaY)
        ) {

          return;

        }


        if (
          Math.abs(deltaX) < 60
        ) {

          return;

        }


        if (deltaX < 0) {

          goToPage(
            pageIndex + 1
          );

        } else {

          goToPage(
            pageIndex - 1
          );

        }

      },
      {
        passive: true
      }
    );

  }


  /* =========================================================
     Cover error
  ========================================================= */

  if (workCoverImage) {

    workCoverImage.addEventListener(
      "error",
      () => {

        if (workCover) {

          workCover.hidden = true;

        }

      }
    );

  }


  /* =========================================================
     Check image
  ========================================================= */

  function checkImage(src) {

    return new Promise(
      (resolve) => {

        const image =
          new Image();


        let finished = false;


        const finish =
          (result) => {

            if (finished) {
              return;
            }

            finished = true;

            resolve(result);

          };


        image.onload = () => {
          finish(true);
        };


        image.onerror = () => {
          finish(false);
        };


        image.src =
          `${src}?v=${Date.now()}`;


        /*
         * coverが無い場合に
         * 5秒以上待たない
         */

        window.setTimeout(
          () => {

            finish(false);

          },
          5000
        );

      }
    );

  }


  /* =========================================================
     Loading
  ========================================================= */

  function setLoading(
    isLoading,
    message = "LOADING"
  ) {

    if (!loading) {
      return;
    }


    if (loadingText) {

      loadingText.textContent =
        message;

    }


    if (isLoading) {

      loading.classList.remove(
        "is-hidden"
      );

      loading.setAttribute(
        "aria-hidden",
        "false"
      );

    } else {

      loading.classList.add(
        "is-hidden"
      );

      loading.setAttribute(
        "aria-hidden",
        "true"
      );

    }

  }


  /* =========================================================
     Error
  ========================================================= */

  function showError(
    message,
    detail = ""
  ) {

    /*
     * Loadingを必ず消す
     */

    setLoading(false);


    if (workBody) {

      workBody.replaceChildren();


      const wrapper =
        document.createElement(
          "div"
        );

      wrapper.className =
        "work-error";


      const title =
        document.createElement(
          "p"
        );

      title.className =
        "work-error__title";

      title.textContent =
        message;


      wrapper.appendChild(
        title
      );


      if (detail) {

        const detailElement =
          document.createElement(
            "p"
          );

        detailElement.className =
          "work-error__detail";

        detailElement.textContent =
          detail;


        wrapper.appendChild(
          detailElement
        );

      }


      workBody.appendChild(
        wrapper
      );

    }


    console.error(
      "[Lies & Ink] WORK:",
      message,
      detail
    );

  }


  /* =========================================================
     Work number
  ========================================================= */

  function normalizeWorkNumber(
    value
  ) {

    const number =
      Number.parseInt(
        value,
        10
      );


    if (
      !Number.isFinite(number) ||
      number < 1
    ) {

      return null;

    }


    return String(
      number
    ).padStart(
      2,
      "0"
    );

  }

});
