/* =========================================================
   Lies & Ink
   HOME
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     ELEMENTS
  ======================================================= */

  const home =
    document.getElementById("home");

  const book =
    document.getElementById("openBook");

  const enterButton =
    document.getElementById("enterButton");

  const aboutButton =
    document.getElementById("aboutButton");

  const aboutOverlay =
    document.getElementById("aboutOverlay");

  const aboutClose =
    document.getElementById("aboutClose");

  const aboutConfirm =
    document.getElementById("aboutConfirm");


  /* =======================================================
     PASSWORD PAGE
  ======================================================= */

  const passwordPage =
    "./password/index.html";


  /* =======================================================
     OPEN BOOK / ENTER
  ======================================================= */

  function openEntrance() {

    /*
     * すでにアニメーション中なら何もしない
     */

    if (
      home.classList.contains("is-opening") ||
      home.classList.contains("is-leaving")
    ) {
      return;
    }


    /*
     * ABOUTが開いている場合は閉じる
     */

    closeAbout();


    /*
     * 本を開く
     */

    home.classList.add("is-opening");


    /*
     * 本が開いてから画面遷移
     */

    window.setTimeout(() => {

      home.classList.add("is-leaving");

    }, 650);


    /*
     * 暗転後にPASSWORDページへ
     */

    window.setTimeout(() => {

      window.location.href =
        passwordPage;

    }, 1250);

  }


  /* =======================================================
     ABOUT
  ======================================================= */

  function openAbout() {

    /*
     * ENTER遷移中ならABOUTを開かない
     */

    if (
      home.classList.contains("is-opening") ||
      home.classList.contains("is-leaving")
    ) {
      return;
    }


    aboutOverlay.classList.add("is-open");

    aboutOverlay.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "about-is-open"
    );

  }


  function closeAbout() {

    aboutOverlay.classList.remove(
      "is-open"
    );

    aboutOverlay.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "about-is-open"
    );

  }


  /* =======================================================
     BOOK CLICK
  ======================================================= */

  if (book) {

    book.addEventListener(
      "click",
      openEntrance
    );

  }


  /* =======================================================
     ENTER CLICK
  ======================================================= */

  if (enterButton) {

    enterButton.addEventListener(
      "click",
      openEntrance
    );

  }


  /* =======================================================
     ABOUT CLICK
  ======================================================= */

  if (aboutButton) {

    aboutButton.addEventListener(
      "click",
      openAbout
    );

  }


  /* =======================================================
     ABOUT CLOSE
  ======================================================= */

  if (aboutClose) {

    aboutClose.addEventListener(
      "click",
      closeAbout
    );

  }


  if (aboutConfirm) {

    aboutConfirm.addEventListener(
      "click",
      closeAbout
    );

  }


  /* =======================================================
     CLICK OUTSIDE ABOUT PANEL
  ======================================================= */

  if (aboutOverlay) {

    aboutOverlay.addEventListener(
      "click",
      (event) => {

        if (
          event.target === aboutOverlay
        ) {

          closeAbout();

        }

      }
    );

  }


  /* =======================================================
     KEYBOARD
  ======================================================= */

  document.addEventListener(
    "keydown",
    (event) => {

      /*
       * ABOUTをESCで閉じる
       */

      if (
        event.key === "Escape" &&
        aboutOverlay &&
        aboutOverlay.classList.contains("is-open")
      ) {

        closeAbout();

        return;

      }


      /*
       * 入力欄などが将来追加された場合に備える
       */

      const activeElement =
        document.activeElement;

      if (
        activeElement &&
        (
          activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA"
        )
      ) {

        return;

      }


      /*
       * ABOUTが開いている間は
       * Enter / Spaceで遷移しない
       */

      if (
        aboutOverlay &&
        aboutOverlay.classList.contains("is-open")
      ) {

        return;

      }


      /*
       * Enter / SpaceでENTER
       */

      if (
        event.key === "Enter" ||
        event.key === " "
      ) {

        event.preventDefault();

        openEntrance();

      }

    }
  );

});
