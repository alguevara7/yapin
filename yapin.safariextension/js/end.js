function handleMessage(event) {
  //TODO call back to global page
  if (event.name === "slide-page-in") {
		var sidebar = document.createElement("iframe");
    sidebar.id = "yapin_sidebar";
    sidebar.height = '100%';
    sidebar.src = safari.extension.baseURI + 'sidebar.html';
    document.body.appendChild(sidebar);
  }
}

safari.self.addEventListener("message",  handleMessage, false);
