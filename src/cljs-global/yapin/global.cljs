(ns yapin.global)

;var bars = safari.extension.bars;;
;		for (var i = 0; i < bars.length; ++i) {
;			if (bars[i].identifier !== "resizeme-bar")
;				continue;
;
;			var barWindow = bars[i].contentWindow;
;			if (typeof barWindow.fullscreen === "function")
;				barWindow.fullscreen();
;		}

(defn ^:export find-bookmarks [criteria] 
  [{:title "DailyCred" :url "https://www.dailycred.com/" :description "Social Authentication Done Right" :tags ["api", "service"]}])

(defn- open-browser-window [url]
  (let [ window (.openBrowserWindow js/safari.application)
        tab (.-activeTab window)]
    (set! (.-url tab) url)))

(defn ^:export handle-toolbar-item-clicked [event]
  (when (= "black" (.-command event))
    (js/alert "dispatched")
    (js/alert js/safari.application.activeBrowserWindow.activeTab.page)
    (.dispatchMessage js/safari.application.activeBrowserWindow.activeTab.page
    	"open-window"
      "test")
    (js/alert "there")
    ;(open-browser-window (str js/safari.extension.baseURI "black.html"))
    ))

;(js/safari.application.addEventListener "command"  handle-toolbar-item-clicked false)
