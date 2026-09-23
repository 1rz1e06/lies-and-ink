(() => {
  "use strict";

  const categories = [
    {
      id: "uranus",
      name: "Uranus",
      color: "#6E91B5"
    },
    {
      id: "salvia",
      name: "Salvia",
      color: "#5279A3"
    },
    {
      id: "wednesday",
      name: "Wednesday",
      color: "#D88952"
    },
    {
      id: "sphene",
      name: "Sphene",
      color: "#817A9C"
    },
    {
      id: "april",
      name: "April",
      color: "#8A789B"
    },
    {
      id: "other",
      name: "Other",
      color: "#C7C3BB"
    }
  ];

  const works = [
    {
      id: "uranus-01",
      category: "uranus",
      title: "作品タイトル01",
      description: "ここに作品の短い紹介文を入れます。",
      symbol: "Ⅰ",
      cover: null,
      story: "uranus/uranus-01/story.txt"
    }
  ];

  window.LiesInk = {
    categories,
    works
  };
})();
