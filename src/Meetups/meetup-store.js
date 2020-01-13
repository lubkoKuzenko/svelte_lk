import { writable } from "svelte/store";

const meetupStore = writable([
  {
    id: "1",
    title: "Keyboard Cat",
    date: "01/02/2020",
    subtitle:
      "This is a wider card with supporting text below as a natural lead-in to additional content. This content is a little bit longer."
  },
  {
    id: "2",
    title: "Second Card",
    date: "02/03/2020",
    subtitle:
      "Some quick example text to build on the card title and make up the bulk of the cards content."
  }
]);

export default meetupStore;
