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
  const workDescription = document.getElementById("workDescription");

  const workPageView = document.getElementById("workPageView");
  const workBody = document.getElementById("workBody");

  const currentPage = document.getElementById("currentPage");
  const totalPages = document.getElementById("totalPages");

  const prevPage = document.getElementById("prevPage");
  const nextPage = document.getElementById("nextPage");

  const backToBookshelf = document.getElementById("backToBookshelf");
  const backToBookshelfFooter =
    document.getElementById("backToBookshelfFooter");

  const loading = document.getElementById("workLoading");
  const loadingText = document.getElementById("workLoadingText");

  const params = new URLSearchParams(window.location.search);

  const categoryId = params.get("category");
  const workId = params.get("work");

  let workData = null;
  let pages = [];
  let pageIndex = 0;

  /* =======================================================
     Category
     ======================================================= */

  function getCategory() {
    if (!window.LiesInk || !Array.isArray(window.LiesInk.categories)) {
      return null;
    }

    return window.LiesInk.categories.find(
      (category) => category.id === categoryId
    );
  }

  /* =======================================================
     Loading
     ======================================================= */

  function setLoading(isLoading, message = "LOADING") {
    if (!work) return;

    work.classList.toggle("is-loading", isLoading);

    if (loading) {
      loading.setAttribute("aria-hidden", String(!isLoading));
    }

    if (loadingText) {
      loadingText.textContent = message;
    }
  }

  /* =======================================================
     Fetch
     ======================================================= */

  async function fetchText(url, timeout = 15000) {
    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(`${url}?v=${Date.now()}`, {
        cache: "no-store",
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } finally {
      window.clearTimeout(timer);
    }
  }

  /* =======================================================
     Image Check
     ======================================================= */

  function checkImage(url, timeout = 5000) {
    return new Promise((resolve) => {
      const image = new Image();

      let finished = false;

      const finish = (result) => {
        if (finished) return;

        finished = true;
        window.clearTimeout(timer);
        resolve(result);
      };

      const timer = window.setTimeout(() => {
        finish(false);
      }, timeout);

      image.onload = () => finish(true);
      image.onerror = () => finish(false);

      image.src = `${url}?v=${Date.now()}`;
    });
  }

  /* =======================================================
     Story Parser
     ======================================================= */

  function parseStory(text) {
    /*
     * 最初の非空行をタイトルとして扱う。
     *
     * ここでは trim() を使わない。
     * 本文の全角スペースを保持するため。
     */

    const normalized = text.replace(/\r\n/g, "\n");

    const lines = normalized.split("\n");

    let titleIndex = -1;

    for (let i = 0; i < lines.length; i += 1) {
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

    const title = lines[titleIndex].trim();

    /*
     * タイトル以降は本文。
     *
     * ここでも .trim() を使わない。
     * 特に本文1行目の
     *
     * 「　窓の外は、まだ夜だった。」
     *
     * の全角スペースを残す。
     */
    const bodyLines = lines.slice(titleIndex + 1);

    /*
     * タイトル直後の空行だけを削除する。
     * ただし本文そのものの行頭スペースは変更しない。
     */
    while (
      bodyLines.length > 0 &&
      bodyLines[0].trim() === ""
    ) {
      bodyLines.shift();
    }

    /*
     * 本文末尾の完全な空行だけを削除する。
     * 文章行そのものは変更しない。
     */
    while (
      bodyLines.length > 0 &&
      bodyLines[bodyLines.length - 1].trim() === ""
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

  function splitLongParagraph(paragraph, limit = 7000) {
    if (paragraph.length <= limit) {
      return [paragraph];
    }

    const result = [];
    let remaining = paragraph;

    while (remaining.length > limit) {
      let cut = remaining.lastIndexOf("。", limit);

      if (cut < Math.floor(limit * 0.5)) {
        cut = remaining.lastIndexOf("、", limit);
      }

      if (cut < Math.floor(limit * 0.5)) {
        cut = limit - 1;
      }

      const chunk = remaining.slice(0, cut + 1);

      /*
       * ここでも trim() は使わない。
       *
       * chunk の先頭にある全角スペースを保持する。
       */
      result.push(chunk);

      remaining = remaining.slice(cut + 1);
    }

    if (remaining.length > 0) {
      result.push(remaining);
    }

    return result;
  }

  /* =======================================================
     Auto Page Split
     ======================================================= */

  function autoSplitPages(body, limit = 7000) {
    /*
     * 空行を「段落の区切り」として扱う。
     *
     * split(/\n\s*\n/) では、段落の先頭にある
     * 全角スペースまで問題になる可能性があるため、
     * 改行そのものを基準にする。
     */

    const paragraphs = body.split(/\n{2,}/);

    const result = [];
    let current = "";

    paragraphs.forEach((paragraph) => {
      /*
       * 完全に空の段落だけを無視する。
       *
       * paragraph.trim() === "" は判定だけに使用。
       * 実際に格納する文字列には trim() をかけない。
       */
      if (paragraph.trim() === "") {
        return;
      }

      const pieces = splitLongParagraph(paragraph, limit);

      pieces.forEach((piece) => {
        const candidate =
          current.length === 0
            ? piece
            : `${current}\n\n${piece}`;

        if (candidate.length <= limit) {
          current = candidate;
        } else {
          if (current.length > 0) {
            result.push(current);
          }

          current = piece;
        }
      });
    });

    if (current.length > 0) {
      result.push(current);
    }

    return result.length > 0 ? result : [""];
  }

  /* =======================================================
     Page Creation
     ======================================================= */

  function createPages(body) {
    if (!body) {
      return [""];
    }

    /*
     * ===PAGE=== が書かれている場合は、
     * 作者指定のページ分けを優先する。
     */
    if (body.includes("===PAGE===")) {
      const manualPages = body.split(/\n?\s*===PAGE===\s*\n?/);

      return manualPages
        .map((page) => {
          /*
           * ページ全体の trim() は絶対にしない。
           *
           * 末尾の改行だけ整理する。
           */
          return page.replace(/\n+$/, "");
        })
        .filter((page) => page.trim() !== "");
    }

    /*
     * ===PAGE=== がない場合は自動分割。
     */
    return autoSplitPages(body);
  }

  /* =======================================================
     Work Data
     ======================================================= */

  async function loadWork() {
    const category = getCategory();

    if (!category) {
      throw new Error("CATEGORY_NOT_FOUND");
    }

    if (!workId || !/^\d+$/.test(workId)) {
      throw new Error("WORK_NOT_FOUND");
    }

    const number = String(Number(workId)).padStart(2, "0");

    const basePath = `../work/${category.id}/${number}`;

    /*
     * story.txt は必須。
     */
    const storyText = await fetchText(`${basePath}/story.txt`);

    const story = parseStory(storyText);

    if (!story.title && !story.body) {
      throw new Error("EMPTY_STORY");
    }

    /*
     * info.txt は任意。
     */
    let info = "";

    try {
      info = await fetchText(`${basePath}/info.txt`);

      /*
       * 説明文については末尾の改行だけ整理。
       * 先頭の全角スペースは保持。
       */
      info = info.replace(/\n+$/, "");
    } catch (error) {
      info = "";
    }

    /*
     * cover.jpg は任意。
     */
    const coverPath = `${basePath}/cover.jpg`;
    const hasCover = await checkImage(coverPath);

    return {
      category,
      number,
      title: story.title,
      body: story.body,
      info,
      cover: hasCover ? coverPath : null
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

    workNumber.textContent = data.number;
    workTitle.textContent = data.title;

    /* -------------------------------------------------------
       Cover
       ------------------------------------------------------- */

    if (data.cover) {
      workCover.hidden = false;
      workCover.classList.add("has-cover");

      workCoverImage.alt = data.title;
      workCoverImage.src = data.cover;

      window.requestAnimationFrame(() => {
        workCover.classList.add("is-visible");
      });
    } else {
      workCover.hidden = true;
      workCover.classList.remove(
        "has-cover",
        "is-visible"
      );

      workCoverImage.removeAttribute("src");
      workCoverImage.alt = "";
    }

    /* -------------------------------------------------------
       Info
       ------------------------------------------------------- */

    if (data.info.trim() !== "") {
      workInfo.hidden = false;

      /*
       * innerHTML ではなく textContent。
       * 説明文中の文字をそのまま表示。
       */
      workDescription.textContent = data.info;

      window.requestAnimationFrame(() => {
        workInfo.classList.add("is-visible");
      });
    } else {
      workInfo.hidden = true;
      workInfo.classList.remove("is-visible");
      workDescription.textContent = "";
    }

    /* -------------------------------------------------------
       Title
       ------------------------------------------------------- */

    const titleBlock =
      document.querySelector(".work-title");

    if (titleBlock) {
      window.requestAnimationFrame(() => {
        titleBlock.classList.add("is-visible");
      });
    }
  }

  /* =======================================================
     Render Page
     ======================================================= */

  function renderCurrentPage(resetScroll = true) {
    if (!workBody || !workPageView) return;

    const page = pages[pageIndex] || "";

    /*
     * いったん空にする。
     */
    workBody.replaceChildren();

    /*
     * 本文を段落単位で表示。
     *
     * 重要：
     * page.split() した文字列に trim() をかけない。
     * そのまま textContent に入れることで、
     * 行頭の全角スペースを保持する。
     */
    const paragraphs = page.split(/\n{2,}/);

    paragraphs.forEach((paragraphText) => {
      if (paragraphText.trim() === "") {
        return;
      }

      const paragraph = document.createElement("p");

      /*
       * textContent を使用。
       * HTMLとして解釈させず、
       * 全角スペース・改行を保持する。
       */
      paragraph.textContent = paragraphText;

      workBody.appendChild(paragraph);
    });

    currentPage.textContent = String(pageIndex + 1);
    totalPages.textContent = String(pages.length);

    prevPage.disabled = pageIndex <= 0;
    nextPage.disabled = pageIndex >= pages.length - 1;

    if (resetScroll) {
      workPageView.scrollTop = 0;
    }

    workPageView.classList.add("is-visible");

    const indicator =
      document.getElementById("workPageIndicator");

    if (indicator) {
      indicator.classList.add("is-visible");
    }
  }

  /* =======================================================
     Page Navigation
     ======================================================= */

  function goToPage(index) {
    if (index < 0 || index >= pages.length) {
      return;
    }

    pageIndex = index;

    renderCurrentPage(true);
  }

  prevPage.addEventListener("click", () => {
    goToPage(pageIndex - 1);
  });

  nextPage.addEventListener("click", () => {
    goToPage(pageIndex + 1);
  });

  /* =======================================================
     Keyboard Navigation
     ======================================================= */

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      goToPage(pageIndex - 1);
    }

    if (event.key === "ArrowRight") {
      goToPage(pageIndex + 1);
    }
  });

  /* =======================================================
     Touch Swipe
     ======================================================= */

  let touchStartX = 0;
  let touchStartY = 0;

  workPageView.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.changedTouches[0];

      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    },
    { passive: true }
  );

  workPageView.addEventListener(
    "touchend",
    (event) => {
      const touch = event.changedTouches[0];

      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;

      /*
       * 縦スクロールが主体ならページ移動しない。
       */
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        return;
      }

      if (Math.abs(deltaX) < 60) {
        return;
      }

      if (deltaX < 0) {
        goToPage(pageIndex + 1);
      } else {
        goToPage(pageIndex - 1);
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
      )}&work=${encodeURIComponent(workId)}`;
  }

  setupBackLink(backToBookshelf);
  setupBackLink(backToBookshelfFooter);

  /* =======================================================
     Error
     ======================================================= */

  function showError(message) {
    setLoading(false);

    workBody.replaceChildren();

    const error = document.createElement("div");
    error.className = "work-error";

    const strong = document.createElement("strong");
    strong.textContent = "WORK NOT FOUND";

    const text = document.createElement("p");
    text.textContent = message;

    error.appendChild(strong);
    error.appendChild(text);

    workBody.appendChild(error);

    workPageView.classList.add("is-visible");

    const indicator =
      document.getElementById("workPageIndicator");

    if (indicator) {
      indicator.classList.add("is-visible");
    }
  }

  /* =======================================================
     Init
     ======================================================= */

  async function init() {
    setLoading(true, "LOADING");

    try {
      workData = await loadWork();

      renderWork(workData);

      pages = createPages(workData.body);
      pageIndex = 0;

      renderCurrentPage(true);

      setLoading(false);
    } catch (error) {
      console.error("WORK ERROR:", error);

      showError(
        "作品を読み込めませんでした。"
      );
    }
  }

  init();
});
