/* =========================================================
   Lies & Ink
   PASSWORD
   ========================================================= */


document.addEventListener(
  "DOMContentLoaded",
  () => {

    const form =
      document.getElementById("passwordForm");

    const input =
      document.getElementById("password");

    const errorMessage =
      document.getElementById("errorMessage");


    /*
     * パスワード
     */

    const PASSWORD =
      "45otter6";


    /*
     * STUDYへの遷移先
     */

    const STUDY_PAGE =
      "../study/index.html";


    /* =====================================================
       SUBMIT
    ===================================================== */

    form.addEventListener(
      "submit",
      (event) => {

        event.preventDefault();


        const enteredPassword =
          input.value.trim();


        /*
         * 入力が空の場合
         */

        if (!enteredPassword) {

          errorMessage.textContent =
            "パスワードを入力してください。";

          input.focus();

          return;

        }


        /*
         * パスワード確認
         */

        if (
          enteredPassword === PASSWORD
        ) {

          /*
           * 正解
           */

          errorMessage.textContent = "";


          /*
           * 少し待ってから遷移
           */

          document.body.classList.add(
            "is-entering"
          );


          window.setTimeout(
            () => {

              window.location.href =
                STUDY_PAGE;

            },
            500
          );


        } else {

          /*
           * 不正解
           */

          errorMessage.textContent =
            "パスワードが違います。";

          input.value = "";

          input.focus();

        }

      }
    );

  }
);
