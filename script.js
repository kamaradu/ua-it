function render() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  // UPDATE WORDS COUNT
  document.getElementById("wordsCount").textContent = words.length;

  words.forEach((w, i) => {
    const listItem = document.createElement("div");
    listItem.className = "list-item" + (i === index ? " active" : "");

    // Content section
    const content = document.createElement("div");
    content.className = "list-item-content";
    content.innerHTML = `
      <div class="list-item-primary">${w.ua}</div>
      <div>
        <span class="list-item-separator">/</span>
        <span class="list-item-secondary">${w.it}</span>
      </div>
    `;

    // Play button
    const playBtn = document.createElement("button");
    playBtn.className = "list-item-action";
    playBtn.type = "button";
    playBtn.title = "Play";
    playBtn.onclick = (e) => {
      e.stopPropagation();
      playOne(i);
    };
    playBtn.innerHTML = '<i class="fas fa-play"></i>';

    listItem.appendChild(content);
    listItem.appendChild(playBtn);

    // CLICK ENTIRE ITEM TO PLAY
    listItem.onclick = () => {
      playOne(i);
    };

    list.appendChild(listItem);
  });

  // Update header display
  const current = words[index];
  const displayEl = document.getElementById("currentWord");
  displayEl.innerHTML =
    current
      ? `<span class="uk">${current.ua}</span><span class="it">${current.it}</span>`
      : "";
}
