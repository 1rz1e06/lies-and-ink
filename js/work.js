/* =========================================================
   Lies & Ink — WORK
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const work = document.getElementById("work");

  const workNumber = document.getElementById("workNumber");
  const workTitle = document.getElementById("workTitle");

  const workCover = document.getElementById("workCover");
  const workCoverImage = document.getElementById("workCoverImage");

  const workInfo = document.getElementById("workInfo");
  const workMeta = document.getElementById("workMeta");
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
    document.getElementById("backToBookshelfFooter");

  const loading =
    document.getElementById("workLoading");

  const loadingText =
    document.getElementById("workLoadingText");

  const params =
    new URLSearchParams(window.location.search);

  const categoryId =
    params.get("category");

  const workId =
    params.get("work");

  let workData = null;
  let pages = [];
  let pageIndex = 0;

  /* =======================================================
     Category
     ======================================================= */

  function getCategory() {
    if (
      !window.LiesInk ||
      !Array.isArray(window.LiesInk.categories)
    ) {
      return null;
    }

    return window.LiesInk.categories.find(
      (category) => category.id === categoryId
    );
  }

  /* =======================================================
     Loading
     ======================================================= */

  function setLoading(
    isLoading,
    message = "LOADING"
  ) {
    if (!work) return;

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
      loadingText.textContent = message;
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
      window.setTimeout(() => {
        controller.abort();
      }, timeout);

    try {
      const response = await fetch(
        `${url}?v=${Date.now()}`,
        {
          cache: "no-store",
          signal: controller.signal
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
    return new Promise((resolve) => {
      const image = new Image();

      let finished = false;

      const finish = (result) => {
        if (finished) return;

        finished = true;
        window.clearTimeout(timer);
        resolve(result);
      };

      const timer =
        window.setTimeout(() => {
          finish(false);
        }, timeout);

      image.onload = () => {
        finish(true);
      };

      image.onerror = () => {
        finish(false);
      };

      image.src =
        `${url}?v=${Date.now()}`;
    });
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
      text.replace(/\r\n/g, "\n");

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
      if (lines[i].trim() !== "") {
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
     * タイトルだけは前後の空白を整理する。
     *
     * タイトルの字下げを本文と同じように
     * 保持する必要はないため、ここだけtrim()を使用。
     */
    const title =
      lines[titleIndex].trim();

    /*
     * タイトル以降を本文にする。
     *
     * ここから先は文字を変更しない。
     */
    const bodyLines =
      lines.slice(titleIndex + 1);

    /*
     * タイトル直後にある完全な空行だけ削除。
     *
     * 「　文章」のような行は削除しない。
     */
    while (
      bodyLines.length > 0 &&
      bodyLines[0].trim() === ""
    ) {
      bodyLines.shift();
    }

    /*
     * 本文末尾にある完全な空行だけ削除。
     *
     * 本文そのものの文字は変更しない。
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
      body: bodyLines.join("\n")
    };
  }

  /* =======================================================
     Long Paragraph Split
     ======================================================= */

  function splitLongParagraph(
    paragraph,
    limit = 7000
  ) {
    if (paragraph.length <= limit) {
      return [paragraph];
    }

    const result = [];
    let remaining = paragraph;

    while (remaining.length > limit) {
      let cut =
        remaining.lastIndexOf(
          "。",
          limit
        );

      if (
        cut <
        Math.floor(limit * 0.5)
      ) {
        cut =
          remaining.lastIndexOf(
            "、",
            limit
          );
      }

      if (
        cut <
        Math.floor(limit * 0.5)
      ) {
        cut = limit - 1;
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

    if (remaining.length > 0) {
      result.push(remaining);
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
     * 全角スペースは区切り判定には影響するが、
     * 実際の文字列からは削除しない。
     */
    const paragraphs =
      body.split(/\n{2,}/);

    const result = [];
    let current = "";

    paragraphs.forEach(
      (paragraph) => {
        /*
         * 空段落かどうかの判定だけ。
         *
         * paragraphそのものにはtrim()をかけない。
         */
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
              current = candidate;
            } else {
              if (
                current.length > 0
              ) {
                result.push(current);
              }

              current = piece;
            }
          }
        );
      }
    );

    if (current.length > 0) {
      result.push(current);
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

  /*
   * ===PAGE=== がある場合。
   *
   * 「===PAGE===」そのものだけを
   * ページ区切りとして扱う。
   *
   * \s は使用しない。
   *
   * \s には全角スペース「　」も含まれるため、
   * ページ直後の本文の字下げまで
   * 消してしまう可能性がある。
   */
  if (
    body.includes("===PAGE===")
  ) {
    const manualPages =
      body.split("===PAGE===");

    return manualPages
      .map((page) => {
        /*
         * ===PAGE=== の周囲にある
         * 構造上の改行だけを削除する。
         *
         * 全角スペース「　」
         * 半角スペース
         * 本文の文字
         *
         * は削除しない。
         */
        return page
          .replace(/^\r?\n+/, "")
          .replace(/\r?\n+$/, "");
      })
      .filter(
        (page) =>
          page.trim() !== ""
      );
  }

  /*
   * ===PAGE=== がない場合は
   * 通常の自動ページ分割。
   */
  return autoSplitPages(body);
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
      !/^\d+$/.test(workId)
    ) {
      throw new Error(
        "WORK_NOT_FOUND"
      );
    }

    const number =
      String(Number(workId))
        .padStart(2, "0");

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
      parseStory(storyText);

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
      info = info.replace(
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
      title: story.title,
      body: story.body,
      info,
      cover: hasCover
        ? coverPath
        : null
    };
  }

  /* =======================================================
     Render Work
     ======================================================= */

  function renderWork(data) {
    if (!work) return;

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

      /*
       * textContentを使用。
       *
       * info.txt内の文字をそのまま表示する。
       */
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
         *
         * ここでtrim()した文字列を
         * textContentへ入れてはいけない。
         */
        if (
          paragraphText.trim() === ""
        ) {
          return;
        }

        const paragraph =
          document.createElement("p");

        /*
         * ここが重要。
         *
         * story.txtの文字列を
         * 一切加工せず、そのまま表示する。
         *
         * 例えばstory.txtが
         *
         * 「　窓の外は、まだ夜だった。」
         *
         * なら、その「　」もそのまま
         * textContentへ渡される。
         */
        paragraph.textContent =
          paragraphText;

        workBody.appendChild(
          paragraph
        );
      }
    );

    currentPage.textContent =
      String(pageIndex + 1);

    totalPages.textContent =
      String(pages.length);

    prevPage.disabled =
      pageIndex <= 0;

    nextPage.disabled =
      pageIndex >=
      pages.length - 1;

    if (resetScroll) {
      workPageView.scrollTop = 0;
    }

    workPageView.classList.add(
      "is-visible"
    );

    const indicator =
      document.getElementById(
        "workPageIndicator"
      );

    if (indicator) {
      indicator.classList.add(
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

  prevPage.addEventListener(
    "click",
    () => {
      goToPage(
        pageIndex - 1
      );
    }
  );

  nextPage.addEventListener(
    "click",
    () => {
      goToPage(
        pageIndex + 1
      );
    }
  );

  /* =======================================================
     Keyboard Navigation
     ======================================================= */

  document.addEventListener(
    "keydown",
    (event) => {
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
    { passive: true }
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
    { passive: true }
  );

  /* =======================================================
     Back Links
     ======================================================= */

  function setupBackLink(link) {
    if (!link) return;

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

  function showError(message) {
    setLoading(false);

    workBody.replaceChildren();

    const error =
      document.createElement("div");

    error.className =
      "work-error";

    const strong =
      document.createElement(
        "strong"
      );

    strong.textContent =
      "WORK NOT FOUND";

    const text =
      document.createElement("p");

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

    const indicator =
      document.getElementById(
        "workPageIndicator"
      );

    if (indicator) {
      indicator.classList.add(
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
