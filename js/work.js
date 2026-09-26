/* =========================================================
   Lies & Ink — WORK
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const work = document.getElementById("work");

  const workNumber =
    document.getElementById("workNumber");

  const workTitle =
    document.getElementById("workTitle");

  const workCover =
    document.getElementById("workCover");

  const workCoverImage =
    document.getElementById("workCoverImage");

  const workInfo =
    document.getElementById("workInfo");

  const workMeta =
    document.getElementById("workMeta");

  const workDescription =
    document.getElementById("workDescription");

  const workPageView =
    document.getElementById("workPageView");

  const workBody =
    document.getElementById("workBody");

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
    document.getElementById(
      "backToBookshelfFooter"
    );

  const loading =
    document.getElementById("workLoading");

  const loadingText =
    document.getElementById(
      "workLoadingText"
    );

  /* =======================================================
     Page Jump
     ======================================================= */

  const workPageIndicator =
    document.getElementById(
      "workPageIndicator"
    );

  const workPageJump =
    document.getElementById(
      "workPageJump"
    );

  const pageJumpInput =
    document.getElementById(
      "pageJumpInput"
    );

  const pageJumpTotal =
    document.getElementById(
      "pageJumpTotal"
    );

  const pageJumpButton =
    document.getElementById(
      "pageJumpButton"
    );

  const pageJumpClose =
    document.getElementById(
      "pageJumpClose"
    );

  /* =======================================================
     URL
     ======================================================= */

  const params =
    new URLSearchParams(
      window.location.search
    );

  const categoryId =
    params.get("category");

  const workId =
    params.get("work");

  /* =======================================================
     State
     ======================================================= */

  let workData = null;

  let pages = [];

  let pageIndex = 0;


  /* =======================================================
     Category
     ======================================================= */

  function getCategory() {
    if (
      !window.LiesInk ||
      !Array.isArray(
        window.LiesInk.categories
      )
    ) {
      return null;
    }

    return window.LiesInk.categories.find(
      (category) =>
        category.id === categoryId
    );
  }


  /* =======================================================
     Loading
     ======================================================= */

  function setLoading(
    isLoading,
    message = "LOADING"
  ) {
    if (!work) {
      return;
    }

    work.classList.toggle(
      "is-loading",
      isLoading
    );

    if (loading) {
      loading.setAttribute(
        "aria-hidden",
        String(!isLoading)
      );
    }

    if (loadingText) {
      loadingText.textContent =
        message;
    }
  }


  /* =======================================================
     Fetch
     ======================================================= */

  async function fetchText(
    url,
    timeout = 15000
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
      const response =
        await fetch(
          `${url}?v=${Date.now()}`,
          {
            cache: "no-store",
            signal:
              controller.signal
          }
        );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      return await response.text();
    } finally {
      window.clearTimeout(timer);
    }
  }


  /* =======================================================
     Image Check
     ======================================================= */

  function checkImage(
    url,
    timeout = 5000
  ) {
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

            window.clearTimeout(
              timer
            );

            resolve(result);
          };

        const timer =
          window.setTimeout(
            () => {
              finish(false);
            },
            timeout
          );

        image.onload = () => {
          finish(true);
        };

        image.onerror = () => {
          finish(false);
        };

        image.src =
          `${url}?v=${Date.now()}`;
      }
    );
  }


  /* =======================================================
     Story Parser
     ======================================================= */

  function parseStory(text) {
    /*
     * 改行コードだけ統一する。
     *
     * 本文の文字自体は変更しない。
     * 特に全角スペース「　」は保持する。
     */

    const normalized =
      text.replace(
        /\r\n/g,
        "\n"
      );

    const lines =
      normalized.split("\n");

    let titleIndex = -1;

    /*
     * 最初の非空行をタイトルとする。
     */

    for (
      let i = 0;
      i < lines.length;
      i += 1
    ) {
      if (
        lines[i].trim() !== ""
      ) {
        titleIndex = i;
        break;
      }
    }

    if (titleIndex === -1) {
      return {
        title: "",
        body: ""
      };
    }

    /*
     * タイトルだけ前後の空白を整理。
     */

    const title =
      lines[
        titleIndex
      ].trim();

    /*
     * タイトル以降を本文にする。
     */

    const bodyLines =
      lines.slice(
        titleIndex + 1
      );

    /*
     * タイトル直後にある
     * 完全な空行だけ削除。
     */

    while (
      bodyLines.length > 0 &&
      bodyLines[0].trim() === ""
    ) {
      bodyLines.shift();
    }

    /*
     * 本文末尾にある
     * 完全な空行だけ削除。
     */

    while (
      bodyLines.length > 0 &&
      bodyLines[
        bodyLines.length - 1
      ].trim() === ""
    ) {
      bodyLines.pop();
    }

    return {
      title,
      body:
        bodyLines.join("\n")
    };
  }


  /* =======================================================
     Long Paragraph Split
     ======================================================= */

  function splitLongParagraph(
    paragraph,
    limit = 7000
  ) {
    if (
      paragraph.length <= limit
    ) {
      return [paragraph];
    }

    const result = [];

    let remaining =
      paragraph;

    while (
      remaining.length > limit
    ) {
      let cut =
        remaining.lastIndexOf(
          "。",
          limit
        );

      if (
        cut <
        Math.floor(
          limit * 0.5
        )
      ) {
        cut =
          remaining.lastIndexOf(
            "、",
            limit
          );
      }

      if (
        cut <
        Math.floor(
          limit * 0.5
        )
      ) {
        cut =
          limit - 1;
      }

      /*
       * 切り出した文字列を
       * 一切加工せず保存する。
       */

      const chunk =
        remaining.slice(
          0,
          cut + 1
        );

      result.push(chunk);

      remaining =
        remaining.slice(
          cut + 1
        );
    }

    if (
      remaining.length > 0
    ) {
      result.push(
        remaining
      );
    }

    return result;
  }


  /* =======================================================
     Auto Page Split
     ======================================================= */

  function autoSplitPages(
    body,
    limit = 7000
  ) {
    /*
     * 空行を段落の区切りにする。
     *
     * 全角スペースは削除しない。
     */

    const paragraphs =
      body.split(/\n{2,}/);

    const result = [];

    let current = "";

    paragraphs.forEach(
      (paragraph) => {
        if (
          paragraph.trim() === ""
        ) {
          return;
        }

        const pieces =
          splitLongParagraph(
            paragraph,
            limit
          );

        pieces.forEach(
          (piece) => {
            const candidate =
              current.length === 0
                ? piece
                : `${current}\n\n${piece}`;

            if (
              candidate.length <=
              limit
            ) {
              current =
                candidate;
            } else {
              if (
                current.length > 0
              ) {
                result.push(
                  current
                );
              }

              current = piece;
            }
          }
        );
      }
    );

    if (
      current.length > 0
    ) {
      result.push(
        current
      );
    }

    return result.length > 0
      ? result
      : [""];
  }


  /* =======================================================
     Page Creation
     ======================================================= */

  function createPages(body) {
    if (!body) {
      return [""];
    }

    const normalizedBody =
      body.replace(
        /\r\n/g,
        "\n"
      );

    /*
     * ===PAGE=== を
     * 行単位でページ区切りとして処理。
     *
     * line.trim() は
     * 「区切りかどうか」の判定だけに使用。
     *
     * 本文として保存する line は
     * 一切trim()しない。
     *
     * そのため、
     *
     * 　ここから次のページです。
     *
     * の全角スペースも保持される。
     */

    const lines =
      normalizedBody.split("\n");

    const manualPages = [];

    let currentPage = [];

    lines.forEach(
      (line) => {
        if (
          line.trim() ===
          "===PAGE==="
        ) {
          manualPages.push(
            currentPage.join("\n")
          );

          currentPage = [];

          return;
        }

        currentPage.push(
          line
        );
      }
    );

    /*
     * 最後のページを追加。
     */

    manualPages.push(
      currentPage.join("\n")
    );

    return manualPages
      .map(
        (page) => {
          /*
           * ページの前後にある
           * 「空行」だけ削除。
           *
           * 全角スペースは削除しない。
           */

          return page
            .replace(
              /^\n+/,
              ""
            )
            .replace(
              /\n+$/,
              ""
            );
        }
      )
      .filter(
        (page) =>
          page.trim() !== ""
      );
  }


  /* =======================================================
     Work Data
     ======================================================= */

  async function loadWork() {
    const category =
      getCategory();

    if (!category) {
      throw new Error(
        "CATEGORY_NOT_FOUND"
      );
    }

    if (
      !workId ||
      !/^\d+$/.test(
        workId
      )
    ) {
      throw new Error(
        "WORK_NOT_FOUND"
      );
    }

    const number =
      String(
        Number(workId)
      ).padStart(
        2,
        "0"
      );

    const basePath =
      `../work/${category.id}/${number}`;

    /*
     * story.txt は必須。
     */

    const storyText =
      await fetchText(
        `${basePath}/story.txt`
      );

    const story =
      parseStory(
        storyText
      );

    if (
      !story.title &&
      !story.body
    ) {
      throw new Error(
        "EMPTY_STORY"
      );
    }

    /*
     * info.txt は任意。
     */

    let info = "";

    try {
      info =
        await fetchText(
          `${basePath}/info.txt`
        );

      /*
       * 末尾の改行だけ整理。
       *
       * 先頭の全角スペースは保持。
       */

      info =
        info.replace(
          /\n+$/,
          ""
        );
    } catch (error) {
      info = "";
    }

    /*
     * cover.jpg は任意。
     */

    const coverPath =
      `${basePath}/cover.jpg`;

    const hasCover =
      await checkImage(
        coverPath
      );

    return {
      category,
      number,
      title:
        story.title,
      body:
        story.body,
      info,
      cover:
        hasCover
          ? coverPath
          : null
    };
  }


  /* =======================================================
     Render Work
     ======================================================= */

  function renderWork(data) {
    if (!work) {
      return;
    }

    work.style.setProperty(
      "--category-color",
      data.category.color
    );

    workNumber.textContent =
      data.number;

    workTitle.textContent =
      data.title;


    /* -------------------------------------------------------
       Cover
       ------------------------------------------------------- */

    if (data.cover) {
      workCover.hidden = false;

      workCover.classList.add(
        "has-cover"
      );

      workCoverImage.alt =
        data.title;

      workCoverImage.src =
        data.cover;

      window.requestAnimationFrame(
        () => {
          workCover.classList.add(
            "is-visible"
          );
        }
      );
    } else {
      workCover.hidden = true;

      workCover.classList.remove(
        "has-cover",
        "is-visible"
      );

      workCoverImage.removeAttribute(
        "src"
      );

      workCoverImage.alt = "";
    }


    /* -------------------------------------------------------
       Info
       ------------------------------------------------------- */

    if (
      data.info.trim() !== ""
    ) {
      workInfo.hidden = false;

      workDescription.textContent =
        data.info;

      window.requestAnimationFrame(
        () => {
          workInfo.classList.add(
            "is-visible"
          );
        }
      );
    } else {
      workInfo.hidden = true;

      workInfo.classList.remove(
        "is-visible"
      );

      workDescription.textContent =
        "";
    }


    /* -------------------------------------------------------
       Title
       ------------------------------------------------------- */

    const titleBlock =
      document.querySelector(
        ".work-title"
      );

    if (titleBlock) {
      window.requestAnimationFrame(
        () => {
          titleBlock.classList.add(
            "is-visible"
          );
        }
      );
    }
  }


  /* =======================================================
     Page Indicator
     ======================================================= */

  function updatePageIndicator() {
    const current =
      pageIndex + 1;

    const total =
      pages.length;

    if (currentPage) {
      currentPage.textContent =
        String(
          current
        ).padStart(
          2,
          "0"
        );
    }

    if (totalPages) {
      totalPages.textContent =
        String(
          total
        ).padStart(
          2,
          "0"
        );
    }

    if (pageJumpTotal) {
      pageJumpTotal.textContent =
        String(
          total
        ).padStart(
          2,
          "0"
        );
    }

    if (pageJumpInput) {
      pageJumpInput.max =
        String(total);

      pageJumpInput.value =
        String(current);
    }
  }


  /* =======================================================
     Render Page
     ======================================================= */

  function renderCurrentPage(
    resetScroll = true
  ) {
    if (
      !workBody ||
      !workPageView
    ) {
      return;
    }

    const page =
      pages[pageIndex] || "";

    /*
     * 一度本文を空にする。
     */

    workBody.replaceChildren();

    /*
     * 空行を段落の区切りとして使用。
     */

    const paragraphs =
      page.split(/\n{2,}/);

    paragraphs.forEach(
      (paragraphText) => {
        /*
         * 空段落かどうかの判定だけ。
         */

        if (
          paragraphText.trim() ===
          ""
        ) {
          return;
        }

        const paragraph =
          document.createElement(
            "p"
          );

        /*
         * 本文は一切加工せず
         * そのまま表示する。
         *
         * 全角スペース「　」も保持。
         */

        paragraph.textContent =
          paragraphText;

        workBody.appendChild(
          paragraph
        );
      }
    );

    /*
     * ページ番号更新。
     */

    updatePageIndicator();

    /*
     * PREV / NEXT の有効状態。
     */

    prevPage.disabled =
      pageIndex <= 0;

    nextPage.disabled =
      pageIndex >=
      pages.length - 1;

    /*
     * ページ先頭へ戻す。
     */

    if (resetScroll) {
      workPageView.scrollTop = 0;
    }

    workPageView.classList.add(
      "is-visible"
    );

    if (workPageIndicator) {
      workPageIndicator.classList.add(
        "is-visible"
      );
    }
  }


  /* =======================================================
     Page Navigation
     ======================================================= */

  function goToPage(index) {
    if (
      index < 0 ||
      index >= pages.length
    ) {
      return;
    }

    pageIndex = index;

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


  /* =======================================================
     Page Jump
     ======================================================= */

  function openPageJump() {
    if (
      !workPageJump ||
      !pageJumpInput
    ) {
      return;
    }

    /*
     * 現在のページを初期値にする。
     */

    pageJumpInput.value =
      String(
        pageIndex + 1
      );

    pageJumpInput.max =
      String(
        pages.length
      );

    if (pageJumpTotal) {
      pageJumpTotal.textContent =
        String(
          pages.length
        ).padStart(
          2,
          "0"
        );
    }

    workPageJump.hidden =
      false;

    /*
     * 少し待ってから
     * inputへフォーカス。
     */

    window.setTimeout(
      () => {
        pageJumpInput.focus();
        pageJumpInput.select();
      },
      50
    );
  }


  function closePageJump() {
    if (!workPageJump) {
      return;
    }

    workPageJump.hidden =
      true;

    if (pageJumpInput) {
      pageJumpInput.blur();
    }
  }


  function jumpToPage() {
    if (!pageJumpInput) {
      return;
    }

    const value =
      Number.parseInt(
        pageJumpInput.value,
        10
      );

    /*
     * 数字ではない、
     * またはページ範囲外なら
     * 移動しない。
     */

    if (
      Number.isNaN(value) ||
      value < 1 ||
      value > pages.length
    ) {
      pageJumpInput.focus();
      pageJumpInput.select();
      return;
    }

    /*
     * 入力値は1始まり。
     *
     * pageIndexは0始まりなので
     * 1を引く。
     */

    pageIndex =
      value - 1;

    renderCurrentPage(
      true
    );

    closePageJump();
  }


  /*
   * ページ番号をタップ
   */

  if (workPageIndicator) {
    workPageIndicator.addEventListener(
      "click",
      openPageJump
    );
  }


  /*
   * GOボタン
   */

  if (pageJumpButton) {
    pageJumpButton.addEventListener(
      "click",
      jumpToPage
    );
  }


  /*
   * CANCELボタン
   */

  if (pageJumpClose) {
    pageJumpClose.addEventListener(
      "click",
      closePageJump
    );
  }


  /*
   * 入力欄でEnter / Escape
   */

  if (pageJumpInput) {
    pageJumpInput.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Enter"
        ) {
          event.preventDefault();

          jumpToPage();
        }

        if (
          event.key === "Escape"
        ) {
          event.preventDefault();

          closePageJump();
        }
      }
    );
  }


  /*
   * パネルの外側をタップして閉じる
   */

  if (workPageJump) {
    workPageJump.addEventListener(
      "click",
      (event) => {
        if (
          event.target ===
          workPageJump
        ) {
          closePageJump();
        }
      }
    );
  }


  /* =======================================================
     Keyboard Navigation
     ======================================================= */

  document.addEventListener(
    "keydown",
    (event) => {
      /*
       * ページ入力中は
       * 左右キーによるページ移動をしない。
       */

      if (
        document.activeElement ===
        pageJumpInput
      ) {
        return;
      }

      if (
        event.key === "ArrowLeft"
      ) {
        goToPage(
          pageIndex - 1
        );
      }

      if (
        event.key === "ArrowRight"
      ) {
        goToPage(
          pageIndex + 1
        );
      }
    }
  );


  /* =======================================================
     Touch Swipe
     ======================================================= */

  let touchStartX = 0;
  let touchStartY = 0;

  if (workPageView) {
    workPageView.addEventListener(
      "touchstart",
      (event) => {
        const touch =
          event.changedTouches[0];

        touchStartX =
          touch.clientX;

        touchStartY =
          touch.clientY;
      },
      {
        passive: true
      }
    );


    workPageView.addEventListener(
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
         * 縦スクロールが主体なら
         * ページ移動しない。
         */

        if (
          Math.abs(deltaY) >
          Math.abs(deltaX)
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


  /* =======================================================
     Back Links
     ======================================================= */

  function setupBackLink(
    link
  ) {
    if (!link) {
      return;
    }

    link.href =
      `../bookshelf/index.html?category=${encodeURIComponent(
        categoryId
      )}&work=${encodeURIComponent(
        workId
      )}`;
  }


  setupBackLink(
    backToBookshelf
  );

  setupBackLink(
    backToBookshelfFooter
  );


  /* =======================================================
     Error
     ======================================================= */

  function showError(
    message
  ) {
    setLoading(false);

    workBody.replaceChildren();

    const error =
      document.createElement(
        "div"
      );

    error.className =
      "work-error";

    const strong =
      document.createElement(
        "strong"
      );

    strong.textContent =
      "WORK NOT FOUND";

    const text =
      document.createElement(
        "p"
      );

    text.textContent =
      message;

    error.appendChild(
      strong
    );

    error.appendChild(
      text
    );

    workBody.appendChild(
      error
    );

    workPageView.classList.add(
      "is-visible"
    );

    if (workPageIndicator) {
      workPageIndicator.classList.add(
        "is-visible"
      );
    }
  }


  /* =======================================================
     Init
     ======================================================= */

  async function init() {
    setLoading(
      true,
      "LOADING"
    );

    try {
      workData =
        await loadWork();

      renderWork(
        workData
      );

      pages =
        createPages(
          workData.body
        );

      pageIndex = 0;

      renderCurrentPage(
        true
      );

      /*
       * ページ数を
       * ジャンプ機能にも反映。
       */

      updatePageIndicator();

      setLoading(false);
    } catch (error) {
      console.error(
        "WORK ERROR:",
        error
      );

      showError(
        "作品を読み込めませんでした。"
      );
    }
  }


  init();
});

